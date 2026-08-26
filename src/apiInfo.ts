import type { NormalizedOpenAPIV3 } from "#/types/NormalizedOpenAPI.d.ts";
import type { ApiInfo } from "#/types/ApiInfo.d.ts";
import { createRequestData, resolveRef } from "#/utils/index.ts";

type Document = NormalizedOpenAPIV3.Document;
type PathItemObject = NormalizedOpenAPIV3.PathItemObject;
type OperationObject = NormalizedOpenAPIV3.OperationObject;
type SchemaObject = NormalizedOpenAPIV3.SchemaObject;
type RequestBodyObject = NormalizedOpenAPIV3.RequestBodyObject;
type ResponseObject = NormalizedOpenAPIV3.ResponseObject;
type ParameterObject = NormalizedOpenAPIV3.ParameterObject;

/**
 * 各APIの基本情報を取得する。
 * 
 * @param doc OASドキュメント
 * @returns API基本情報一覧
 */
export function listApiInfo(doc: Document): ApiInfo[] {

  const apiSummaryList: ApiInfo[] = [];

  // 各パスの定義からAPI情報を抽出
  for (const path of Object.keys(doc.paths)) {
    let pathItemObj = doc.paths[path];

    // 他のパスを参照しているだけの定義の場合は参照先のパスで置き換える
    if (pathItemObj?.$ref != null) {
      pathItemObj = resolveRef<PathItemObject>(doc, pathItemObj.$ref);
    }

    // 各メソッドからパラメータ情報、リクエスト情報、レスポンス情報を取得
    for (const method of ["get", "post", "put", "patch", "delete", "options", "head", "trace"] as const) {
      if (pathItemObj?.[method] == null) {
        continue;
      }
      const operationObj = pathItemObj[method];

      // operationIdがない場合は処理をスキップ
      if (operationObj.operationId == null) {
        console.warn(`[unknown] operationId が設定されていないため処理をスキップします: #/paths/['${path}']/${method}`);
        continue;
      }

      // パラメータ情報を取得
      const {queryParamNames, parameter} = getParameterInfo(doc, pathItemObj, operationObj);

      // リクエスト情報を取得
      const {contentType, request, requestRef} = getRequestInfo(doc, operationObj);

      // レスポンス情報を取得
      const {responseType, response, responseRef} = getResponseInfo(doc, operationObj);

      // スキーマ種別を取得
      const requestData = createRequestData(doc, parameter, request);
      const requestSchemaType = getSchemaType(doc, requestData, requestRef == null ? [] : [requestRef]);
      const responseSchemaType = getSchemaType(doc, response, responseRef == null ? [] : [responseRef]);

      // API情報を格納
      apiSummaryList.push({
        path,
        operationId: operationObj.operationId,
        summary: operationObj.summary,
        method,
        description: operationObj.description,
        contentType,
        responseType, 
        queryParamNames,
        parameter,
        request,
        response,
        schemaType: {
          request: requestSchemaType,
          response: responseSchemaType,
        }
      });
    }
  }
  return apiSummaryList;
}

/**
 * 指定された PathItemObject、OperationObject からパラメータ情報を取得する
 * 
 * @param doc OASドキュメント
 * @param pathItemObj PathItemObject
 * @param operationObj OperationObject
 * @returns クエリパラメータ名一覧、パラメータ参照をプロパティに持つ SchemaObject
 */
function getParameterInfo(doc: Document, pathItemObj: PathItemObject, operationObj: OperationObject) {

  // パラメータ情報を取得
  const parameterRefs = [
    ...(pathItemObj?.parameters ?? []),
    ...(operationObj?.parameters ?? []),
  ].map(param => param.$ref);

  // クエリパラメータ、パスパラメータのみ取り込む。スキーマ定義がないものは取り込まない。
  const parameterObjList = parameterRefs
    .map(ref => resolveRef<ParameterObject>(doc, ref))
    .filter(obj => ["query", "path"].includes(obj.in))
    .filter(obj => obj.schema != null);

  // 取得対象のパラメータが存在しない場合はパラメータ無しの情報を返却
  if (parameterRefs.length === 0) {
    return {
      queryParamNames: [],
      parameter: undefined,
    };
  }

  // クエリパラメータの名前一覧を取得
  const queryParamNames = parameterObjList
    .filter(obj => obj.in === "query")
    .map(obj => obj.name);
  
  // パラメータ情報を properties に持つ SchemaObject を作成
  const properties = Object.fromEntries(parameterObjList.map(obj => [obj.name, obj.schema!]));
  const parameter = {
    type: "object" as const,
    properties,
  }
  
  return {
    queryParamNames,
    parameter,
  }
}

/**
 * 指定された OperationObject からリクエスト情報を取得する
 * 
 * @param doc OASドキュメント
 * @param operationObj OperationObject
 * @returns リクエストデータのコンテンツタイプ、リクエストスキーマオブジェクト、リクエストスキーマの$refのパス
 */
function getRequestInfo(doc: Document, operationObj: OperationObject) {

  const voidRequestInfo = {
    contentType: undefined,
    request: undefined,
    requestRef: undefined,
  };

  // リクエストボディの指定がない場合は引数無しとする
  if (operationObj.requestBody?.$ref == null) {
    return voidRequestInfo;
  }

  // Contnet-Type が複数指定されている場合は最初に検出されたサポート対象のコンテンツタイプのみ処理対象とする
  const supportedContentTypes = [
    "application/json",
    "multipart/form-data",
    "application/x-www-form-urlencoded"
  ];
  const requestBodyObj = resolveRef<RequestBodyObject>(doc, operationObj.requestBody.$ref);
  const contentType = Object.keys(requestBodyObj.content)
    .find(contentType => supportedContentTypes.some(supported => contentType.startsWith(supported)));  // 文字コード指定されるケースがあるので先頭文字で判定
  if (contentType == null) {
    console.warn(`[${operationObj.operationId}] ${supportedContentTypes.join('、')}以外のリクエストはサポートしていないため、引数無しのリクエストとして生成します。`);
    return voidRequestInfo;
  }

  // コンテンツタイプに対するリクエストオブジェクトが定義されていない場合は引数無しとする
  const schema = requestBodyObj.content[contentType].schema;
  if (schema == null || !("$ref" in schema)) {
    return voidRequestInfo;
  }

  // 特定したコンテンツタイプとリクエストスキーマオブジェクトを返す
  return {
    contentType,
    request: resolveRef(doc, schema.$ref),
    requestRef: schema.$ref,
  }
}

/**
 * 指定された OperationObject からレスポンス情報を取得する
 * 
 * @param doc OASドキュメント
 * @param parameterRefs パラメータ参照
 * @returns リクエストデータのコンテンツタイプ、リクエストスキーマオブジェクト、レスポンススキーマの$refのパス
 */
function getResponseInfo(doc: Document, operationObj: OperationObject) {

  const voidResponseInfo = {
    responseType: "json" as const,
    response: undefined,
    responseRef: undefined,
  };

  // 200のレスポンスデータが指定されていない場合は戻り値無しとする
  const responseRef = operationObj.responses?.["200"]?.$ref;
  if (responseRef == null) {
    return voidResponseInfo;
  }

  // コンテンツタイプの定義がない場合は戻り値なし
  const responseObj = resolveRef<ResponseObject>(doc, responseRef);
  if (responseObj.content == null) {
    return voidResponseInfo;
  }

  // レスポンスはコンテンツタイプは1つのみなので先頭要素からコンテンツタイプを特定
  const contentType = Object.keys(responseObj.content)[0];

  // スキーマ定義がない場合は戻り値なし
  const schemaRef = responseObj.content[contentType].schema?.$ref;
  if (schemaRef == null) {
    return voidResponseInfo;
  }

  // レスポンススキーマの型がファイルかどうかを判定
  const response = resolveRef(doc, schemaRef);
  const isFileResponse = (response.type === "string" && response.format === "binary");

  // json/ファイル以外の未知の形式の場合はtext形式で扱う
  const responseType = contentType.startsWith('application/json') ? "json" :
                       isFileResponse                             ? "arraybuffer" :
                                                                    "text" as const;
  if (responseType === "text") {
    console.warn(`[${operationObj.operationId}] application/json 以外のコンテンツタイプは text 形式の応答で作成します。 contentType=${contentType}`);
  }

  // 特定したコンテンツタイプとリクエストスキーマオブジェクトを返す
  return {
    responseType: responseType as typeof responseType,
    response,
    responseRef: schemaRef,
  }
}

/**
 * 1つのスキーマオブジェクトに対するスキーマ種別を特定する。
 * 
 * @param doc OASドキュメント
 * @param schemaObj スキーマオブジェクト
 * @param refStack 本スキーマオブジェクトに到るまでに解決したスキーマの ref パス
 * @returns スキーマ種別
 */
function getSchemaType(doc: Document, schemaObj: SchemaObject | undefined, refStack: string[]): "normal" | "loop" | "not" {

  // 階層構造を持たない場合 normal を返す
  if (schemaObj == null || ["boolean", "number", "string", "integer"].includes(schemaObj.type ?? "")) {
    return "normal";
  }

  // スキーマに not が指定されている場合は "not" を返す
  if ("not" in schemaObj) {
    return "not";
  }

  // allOf / anyOf / oneOf が指定されている場合の参照先についてスキーマ種別を特定
  if ("allOf" in schemaObj || "anyOf" in schemaObj || "oneOf" in schemaObj) {
    for (const childRefObj of schemaObj.allOf ?? schemaObj.anyOf ?? schemaObj.oneOf ?? []) {
      const ref = childRefObj.$ref;
      if (refStack.includes(ref)) {
        return "loop";
      }
      const childConvertType = getSchemaType(doc, resolveRef(doc, ref), [...refStack, ref]);
      if (childConvertType !== "normal") {
        return childConvertType;
      }
    }
    return "normal";
  }

  // array が指定されている時のスキーマ種別を特定
  if (schemaObj.type === "array") {
    const ref = schemaObj.items.$ref;
    if (refStack.includes(ref)) {
      return "loop";
    }
    return getSchemaType(doc, resolveRef(doc, ref), [...refStack, ref]);
  }

  // object が指定されている時のスキーマ種別を特定
  if (schemaObj.type === "object") {
    for (const childRefObj of Object.values(schemaObj.properties ?? {})) {
      const ref = childRefObj.$ref;
      if (refStack.includes(ref)) {
        return "loop";
      }
      const childConvertType = getSchemaType(doc, resolveRef(doc, ref), [...refStack, ref]);
      if (childConvertType !== "normal") {
        return childConvertType;
      }
    }
    return "normal";
  }

  throw new Error(`不明なスキーマ: schema = ${JSON.stringify(schemaObj)}`);
}
