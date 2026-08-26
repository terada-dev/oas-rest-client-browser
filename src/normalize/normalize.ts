/* eslint-disable @typescript-eslint/no-explicit-any */

import type { OpenAPIV3 } from "openapi-types";
import type { NormalizedOpenAPIV3 } from "../types/NormalizedOpenAPI.d.ts"
import type { NamingConfig } from "./naming.ts"
import { defaultNamingConfig } from "./naming.ts";

type Document = OpenAPIV3.Document;
type ParameterObject = OpenAPIV3.ParameterObject;
type ReferenceObject = OpenAPIV3.ReferenceObject;
type RequestBodyObject = OpenAPIV3.RequestBodyObject;
type ResponsesObject = OpenAPIV3.ResponsesObject;
type SchemaObject = OpenAPIV3.SchemaObject;
type ExampleObject = OpenAPIV3.ExampleObject;
type ExamplesObj = { [media: string]: ReferenceObject | ExampleObject; };
type HeaderObject = OpenAPIV3.HeaderObject;
type HeadersObject = { [header: string]: ReferenceObject | HeaderObject; };
type MediaTypeObject = OpenAPIV3.MediaTypeObject;
type ContentObject = { [media: string]: MediaTypeObject; };
type LinkObject = OpenAPIV3.LinkObject;
type LinksObject = { [link: string]: ReferenceObject | LinkObject; };

type NormalizedDocument = NormalizedOpenAPIV3.Document;

/**
 * Open APIの定義情報を変換し components を参照させる形にする
 *
 * @param doc OpenAPI定義情報
 * @param naming 名前生成処理
 * @returns $refを参照した形のドキュメント
 */
export function normalizeDocument(doc: Document, namingConfig: Partial<NamingConfig> = {}): NormalizedDocument {

  // 名前の生成処理が指定されていない場合はデフォルトの生成処理を使用する
  const naming: NamingConfig = {
    ...defaultNamingConfig,
    ...namingConfig, 
  }

  // コピーしたオブジェクトを編集し元の定義を直接書き換えないようにする
  const normalizedDoc = JSON.parse(JSON.stringify(doc));

  // 階層構造が存在しない場合は空のオブジェクトを設定する
  normalizedDoc.components ??= {};
  normalizedDoc.components.parameters ??= {};
  normalizedDoc.components.requestBodies ??= {};
  normalizedDoc.components.responses ??= {};
  normalizedDoc.components.schemas ??= {};
  normalizedDoc.components.examples ??= {};
  normalizedDoc.components.headers ??= {};
  normalizedDoc.components.links ??= {};
  normalizedDoc.components.callbacks ??= {};

  // operationIdが未定義のパスはoperationIdを付与する
  setOperationId(normalizedDoc, naming);

  // 階層化されていない定義を階層化していく
  normalizeCallbacks(normalizedDoc, naming);
  normalizePaths(normalizedDoc, naming);
  normalizeParameters(normalizedDoc, naming);
  normalizeRequestBodies(normalizedDoc, naming);
  normalizeResponses(normalizedDoc, naming);
  normalizeExamples(normalizedDoc, naming);
  normalizeHeaders(normalizedDoc, naming);
  normalizeLinks(normalizedDoc, naming);
  normalizeSchemas(normalizedDoc, naming);

  return normalizedDoc;
}

/**
 * operationIdが設定されていないパスに対してoperationIdを付与する
 * 
 * @param doc OpenAPI定義情報
 * @param naming 名前生成処理
 */
function setOperationId(doc: Document, naming: NamingConfig) {

  for (const [pathName, pathObj] of Object.entries(doc.paths)) {

    // urlが定義されていない場合は処理をスキップ
    if (pathObj == null) {
      continue;
    }

    // 各メソッドに対してoperationId設定処理を実施
    for (const method of ["get", "put", "post", "delete", "options", "head", "patch", "trace"] as const) {

      // operationIdが既に定義されている場合は処理をスキップ
      const operationObj = pathObj[method];
      if (operationObj == null || "operationId" in operationObj) {
        continue;
      }

      // 「paths/[パス名]/[メソッド].operationId」を設定
      const jsonPath = `$.paths.['${pathName}'].['${method}']`;
      const operationId = naming.operation(operationObj, doc, jsonPath);
      operationObj.operationId = operationId;
    }
  }

} 

/**
 * コールバック情報が$refを使用していない場合は$refの参照に置き換える
 * 
 * ```
 * 対象のjsonPath:
 * components/callbacks/[コールバック名]/[URL]/parameters
 * components/callbacks/[コールバック名]/[URL]/[メソッド]/parameters
 * components/callbacks/[コールバック名]/[URL]/[メソッド]/requestBody
 * components/callbacks/[コールバック名]/[URL]/[メソッド]/responses
 * ```
 *
 * @param doc OpenAPI定義情報
 * @param naming 名前生成処理
 */
function normalizeCallbacks(doc: Document, naming: NamingConfig) {

  for (const [callbackName, callbackObj] of Object.entries(doc.components!.callbacks!)) {

    // パラメータが他のパラメータを参照している場合は参照先で置換する
    const callback = inlineExpansionRef(doc, callbackObj);

    // コールバックに記述された定義は $.components.callbacks 配下に移動し $ref で参照させる
    for (const [url, pathItem] of Object.entries(callback)) {

      // SwaggerParserが解決しているはずだが一応スキップ処理
      if (pathItem.$ref != null) {
        const message = `パスの$refはサポートしていないため次の定義の変換処理をスキップします。`
                      + `[#/components/callbacks/${callbackName}/['${url}']]`;
        console.warn(message);
        continue;
      }

      // 「components/callbacks/[コールバック名]/[URL]/parameters」を置換
      let jsonPath = `$.components.callbacks.['${callbackName}'].['${url}'].parameters`;
      parametersToRef(doc, naming, pathItem.parameters, jsonPath);

      for (const method of ["get", "put", "post", "delete", "options", "head", "patch", "trace"] as const) {

        // 「components/callbacks/[コールバック名]/[URL]/[メソッド]/parameters」を置換
        jsonPath = `$.components.callbacks.['${callbackName}'].['${url}'].${method}.parameters`;
        parametersToRef(doc, naming, pathItem[method]?.parameters, jsonPath);

        // 「components/callbacks/[コールバック名]/[URL]/[メソッド]/requestBody」を置換
        jsonPath = `$.components.callbacks.['${callbackName}'].['${url}'].${method}.requestBody`;
        requestBodyToRef(doc, naming, pathItem[method]?.requestBody, jsonPath);

        // 「components/callbacks/[コールバック名]/[URL]/[メソッド]/responses」を置換
        jsonPath = `$.components.callbacks.['${callbackName}'].['${url}'].${method}.responses`
        responsesToRef(doc, naming, pathItem[method]?.responses, jsonPath);

      }
    }
  }
}

/**
 * パス情報が$refを使用していない場合は$refの参照に置き換える
 * 
 * ```
 * 対象のjsonPath:
 *   paths/[URL]/parameters
 *   paths/[URL]/[メソッド]/parameters
 *   paths/[URL]/[メソッド]/requestBody
 *   paths/[URL]/[メソッド]/responses
 * ```
 *
 * @param doc OpenAPI定義情報
 * @param naming 名前生成処理
 */
function normalizePaths(doc: Document, naming: NamingConfig) {

  for (const [url, pathItem] of Object.entries(doc.paths)) {

    // urlが定義されていない場合はスキップ
    if (pathItem == null) {
      continue;
    }

    // 異なるファイルを参照している場合はサポートしない
    if (pathItem.$ref != null) {
      const msg = `パスの$refはサポートしていないため次の定義の変換処理をスキップします。 [#/paths/${url}]`;
      console.warn(msg);
      continue;
    }

    // 「paths/[URL]/parameters」を置換
    let jsonPath = `$.paths.['${url}'].parameters`;
    parametersToRef(doc, naming, pathItem.parameters, jsonPath);

    // 各メソッドの情報を置換
    for (const method of ["get", "put", "post", "delete", "options", "head", "patch", "trace"] as const) {

      // 「paths/[URL]/[メソッド]/parameters」を置換
      jsonPath = `$.paths.['${url}'].${method}.parameters`
      parametersToRef(doc, naming, pathItem[method]?.parameters, jsonPath);

      // 「paths/[URL]/[メソッド]/requestBody」を置換
      jsonPath = `$.paths.['${url}'].${method}.requestBody`;
      requestBodyToRef(doc, naming, pathItem[method]?.requestBody, jsonPath);

      // 「paths/[URL]/[メソッド]/responses」を置換
      jsonPath = `$.paths.['${url}'].${method}.responses`;
      responsesToRef(doc, naming, pathItem[method]?.responses, jsonPath);
    }
  }
}

/**
 * パラメータ情報が$refを使用していない場合は$refの参照に置き換える
 *
 * ```
 * 対象のjsonPath:
 *   components/parameters/[パラメータ名]/schema
 *   components/parameters/[パラメータ名]/examples
 *   components/parameters/[パラメータ名]/content/[コンテンツタイプ]/schema
 *   components/parameters/[パラメータ名]/content/[コンテンツタイプ]/examples
 *   components/parameters/[パラメータ名]/content/[コンテンツタイプ]/encoding/headers/[ヘッダ名]
 * ```
 *
 * @param doc OpenAPI定義情報
 * @param naming 名前生成処理
 */
function normalizeParameters(doc: Document, naming: NamingConfig) {

  for (const [paramName, paramObj] of Object.entries(doc.components?.parameters ?? {})) {

    // パラメータが定義されていない場合はスキップ
    if (paramObj == null) {
      continue;
    }
 
    // パラメータが他のパラメータを参照している場合は参照先で置換する
    const param = inlineExpansionRef(doc, paramObj);

    // 「components/parameters/[パラメータ名]/schema」を置換
    let jsonPath = `$.components.parameters.['${paramName}'].schema`;
    schemaToRef(doc, naming, param.schema, jsonPath, true);

    // 「components/parameters/[パラメータ名]/examples」を置換
    jsonPath = `$.components.parameters.['${paramName}'].examples`;
    examplesToRef(doc, naming, param.examples, jsonPath);

    // 「components/parameters/[パラメータ名]/content/[コンテンツタイプ]/schema」を置換
    // 「components/parameters/[パラメータ名]/content/[コンテンツタイプ]/examples」を置換
    // 「components/parameters/[パラメータ名]/content/[コンテンツタイプ]/encoding/headers/[ヘッダ名]」を置換
    jsonPath = `$.components.parameters.['${paramName}'].content`
    contentToRef(doc, naming, param.content, jsonPath);
  }
}

/**
 * リクエストボディ情報が$refを使用していない場合は$refの参照に置き換える
 * 
 * ```
 * 対象のjsonPath:
 *   components/requestBodies/[リクエストボディ名]/content/[コンテンツタイプ]/schema
 *   components/requestBodies/[リクエストボディ名]/content/[コンテンツタイプ]/examples
 *   components/requestBodies/[リクエストボディ名]/content/[コンテンツタイプ]/encoding/headers/[ヘッダ名]
 * ```
 *
 * @param doc OpenAPI定義情報
 * @param naming 名前生成処理
 */
function normalizeRequestBodies(doc: Document, naming: NamingConfig) {

  for (const [requestBodyName, requestBodyObj] of Object.entries(doc.components?.requestBodies ?? {})) {

    // リクエストボディが他の情報を参照している場合は参照先で置換する
    const requestBody = inlineExpansionRef(doc, requestBodyObj);

    // 「components/requestBodies/[リクエストボディ名]/content/[コンテンツタイプ]/schema」を置換
    // 「components/requestBodies/[リクエストボディ名]/content/[コンテンツタイプ]/examples」を置換
    // 「components/requestBodies/[リクエストボディ名]/content/[コンテンツタイプ]/encoding/headers/[ヘッダ名]」を置換
    const jsonPath = `$.components.requestBodies.['${requestBodyName}'].content`;
    contentToRef(doc, naming, requestBody.content, jsonPath, true);
  }
}

/**
 * レスポンス情報が$refを使用していない場合は$refの参照に置き換える
 * 
 * ```
 * 対象のjsonPath:
 *   components/responses/[レスポンス名]/headers/[ヘッダ名]
 *   components/responses/[レスポンス名]/content/[コンテンツタイプ]/schema
 *   components/responses/[レスポンス名]/content/[コンテンツタイプ]/examples
 *   components/responses/[レスポンス名]/content/[コンテンツタイプ]/encoding/headers/[ヘッダ名]
 *   components/responses/[レスポンス名]/links/[リンク名]
 * ```
 *
 * @param doc OpenAPI定義情報
 * @param naming 名前生成処理
 */
function normalizeResponses(doc: Document, naming: NamingConfig) {

  for (const [responseName, responseObj] of Object.entries(doc.components?.responses ?? {})) {

    // レスポンスが他の情報を参照している場合は参照先で置換する
    const response = inlineExpansionRef(doc, responseObj);

    // 「components/responses/[レスポンス名]/headers/[ヘッダ名]」を置換
    let jsonPath = `$.components.responses.['${responseName}'].headers`;
    headersToRef(doc, naming, response.headers, jsonPath);

    // 「components/responses/[レスポンス名]/content/[コンテンツタイプ]/schema」を置換
    // 「components/responses/[レスポンス名]/content/[コンテンツタイプ]/examples」を置換
    // 「components/responses/[レスポンス名]/content/[コンテンツタイプ]/encoding/headers/[ヘッダ名]」を置換
    jsonPath = `$.components.responses.['${responseName}'].content`;
    contentToRef(doc, naming, response.content, jsonPath, true);

    // 「components/responses/[レスポンス名]/links/[リンク名]」を置換
    jsonPath = `$.components.responses.['${responseName}'].links`;
    linkToRef(doc, naming, response.links, jsonPath);
  }
}

/**
 * examples情報が$refを使用していない場合は$refの参照に置き換える
 *
 * @param doc OpenAPI定義情報
 * @param _naming 名前生成処理
 */
function normalizeExamples(doc: Document, _naming: NamingConfig) {

  for (const [_exampleName, exampleObj] of Object.entries(doc?.components?.examples ?? {})) {
    
    // example情報が他の情報を参照している場合は参照先で置換する
    inlineExpansionRef(doc, exampleObj);

  }
}

/**
 * ヘッダ情報が$refを使用していない場合は$refの参照に置き換える
 * 
 * ```
 * 対象のjsonPath:
 *   components/headers/[ヘッダ名]/schemas
 *   components/headers/[ヘッダ名]/examples
 *   components/headers/[ヘッダ名]/content/[コンテンツタイプ]/schema
 *   components/headers/[ヘッダ名]/content/[コンテンツタイプ]/examples
 * ```
 *
 * @param doc OpenAPI定義情報
 * @param naming 名前生成処理
 */
function normalizeHeaders(doc: Document, naming: NamingConfig) {

  for (const [headerName, headerObj] of Object.entries(doc.components?.headers ?? {})) {

    // ヘッダが他の情報を参照している場合は参照先で置換する
    const header = inlineExpansionRef(doc, headerObj);

    // 「components/headers/[ヘッダ名]/schema」を置換
    let jsonPath = `$.components.headers.['${headerName}'].schema`;
    schemaToRef(doc, naming, header.schema, jsonPath);

    // 「components/headers/[ヘッダ名]/examples」を置換
    jsonPath = `$.components.headers.['${headerName}'].examples`;
    examplesToRef(doc, naming, header.examples, jsonPath);

    // 「components/headers/[ヘッダ名]/content/[コンテンツタイプ]/schema」を置換
    // 「components/headers/[ヘッダ名]/content/[コンテンツタイプ]/examples」を置換
    jsonPath = `$.components.headers.['${headerName}'].content`;
    contentToRef(doc, naming, header.content, jsonPath);
  }
}

/**
 * links情報が$refを使用していない場合は$refの参照に置き換える
 * 
 * @param doc OpenAPI定義情報
 * @param _naming 名前生成処理
 */
function normalizeLinks(doc: Document, _naming: NamingConfig) {

  for (const [_linkName, linkObj] of Object.entries(doc.components?.links ?? {})) {

    // linkが他の情報を参照している場合は参照先で置換する
    inlineExpansionRef(doc, linkObj);
    
  }
}

/**
 * schema情報が$refを使用していない場合は$refの参照に置き換える
 * 
 * ```
 * 対象のjsonPath:
 *   components/schemas/[スキーマ名]/properties/[プロパティ名]
 *   components/schemas/[スキーマ名]/items/properties/[プロパティ名]
 * ```
 *
 * @param doc OpenAPI定義情報
 * @param naming 名前生成処理
 */
function normalizeSchemas(doc: Document, naming: NamingConfig) {

  let needLoop = true;
  const normalizedNameSet = new Set();

  while (needLoop) {

    for (const [schemaName, schemaObj] of Object.entries(doc.components?.schemas ?? {})) {

      // インライン展開済みのため他のスキーマを参照するだけの schemaObj は存在しないはず
      if ("$ref" in schemaObj) {
        const msg = `インライン展開不可なスキーマオブジェクトを検出しました[$.components.schemas.['${schemaName}']}]`;
        throw new Error(msg);
      }

      // 既に処理済みのスキーマの場合は処理をスキップ
      if (normalizedNameSet.has(schemaName)) {
        continue;
      }
      normalizedNameSet.add(schemaName);

      // プリミティブ型のスキーマ定義は $ref 化不要
      if (["string", "number", "integer", "boolean"].includes(schemaObj.type ?? '')) {
        continue;
      }

      // object型のpropを $ref の参照に置き換える
      if (schemaObj.type === "object") {
        for (const [propName, propObj] of Object.entries(schemaObj.properties ?? {})) {
          const jsonPath = `$.components.schemas.['${schemaName}'].properties.['${propName}']`;
          schemaToRef(doc, naming, propObj, jsonPath);
        }
        continue;
      }

      // array型定義の中身を $ref の参照に置き換える
      if (schemaObj.type === "array") {
        const jsonPath = `$.components.schemas.['${schemaName}'].items`;
        schemaToRef(doc, naming, schemaObj.items, jsonPath, true);
        continue;
      }

      // oneOf、anyOf、allOfの中身を $ref の参照に置き換える
      if ("oneOf" in schemaObj || "anyOf" in schemaObj || "allOf" in schemaObj) {
        const jsonPath = `$.components.schemas.['${schemaName}']`;
        schemaToRef(doc, naming, schemaObj, jsonPath);
      }
    }

    // 全要素を処理し終えたら完了
    needLoop = normalizedNameSet.size !== Object.keys(doc.components?.schemas ?? {}).length;
  }
}

/**
 * 同じ階層を指す $ref に対して $ref の指す先の情報をインライン展開する
 * ※インプレースで値を書き換える
 * 
 * @param doc OpenAPI定義情報
 * @param obj $refプロパティを持つオブジェクト
 * @returns $refをインライン展開した結果のオブジェクト
 */
function inlineExpansionRef<T extends Record<string, any>>(doc: Document, obj: T): Exclude<T, ReferenceObject> {
    if ("$ref" in obj) {
      const refObj = getRefObj(doc, obj.$ref);
      delete obj.$ref;
      Object.assign(obj, refObj);
    }
    return obj as Exclude<T, ReferenceObject>;
}

/**
 * $refで参照されたオブジェクトを取得する
 *
 * @param doc OpenAPI定義情報
 * @param refValue $refに設定された値
 * @returns 参照先オブジェクト
 */
function getRefObj(doc: Document, refValue: string) {
  const refValueItems = refValue.substring(2).split("/");
  let parent = doc as any;
  for (const propName of refValueItems) {
    const decodedPropName = propName.replace(/~1/g, "/").replace(/~0/g, "~"); // RFC 6901
    if (!(decodedPropName in parent)) {
      throw new Error(`$refに存在しない参照先が定義されています(${refValue})`);
    }
    parent = parent[decodedPropName];
  }
  if ("$ref" in parent) {
    return getRefObj(doc, parent["$ref"]);
  }
  return parent;
}

/**
 * parameters定義を$refの参照に置き換える
 *
 * @param doc OpenAPI定義情報
 * @param naming 名前生成処理
 * @param parameters parameterオブジェクトの配列
 * @param jsonPath JSONパス
 */
function parametersToRef(doc: Document, 
                         naming: NamingConfig, 
                         parameters: Array<ParameterObject | ReferenceObject> | undefined, 
                         jsonPath: string) {

  if (parameters == null) {
    return;
  }

  for (let i = 0; i < parameters.length; i++) {
    const parameter = parameters[i]!;
    if ("$ref" in parameter) {
      continue;
    }
    const refName = naming.parameter(parameter, doc, `${jsonPath}[${i}]`);
    const refValue = `#/components/parameters/${refName}`;
    relocateToRef(doc, parameter, refValue);
  }
}

/**
 * requestBody定義を$refの参照に置き換える
 *
 * @param doc         OpenAPI定義情報
 * @param naming      名前生成処理
 * @param requestBody requestBodyオブジェクト
 * @param jsonPath    JSONパス
 */
function requestBodyToRef(doc: Document, 
                          naming: NamingConfig, 
                          requestBody: RequestBodyObject | ReferenceObject | undefined,
                          jsonPath: string) {

  if (requestBody == null || "$ref" in requestBody) {
    return;
  }

  const refName = naming.requestBody(requestBody, doc, jsonPath);
  const refValue = `#/components/requestBodies/${refName}`;
  relocateToRef(doc, requestBody, refValue);
}

/**
 * responses定義を$refの参照に置き換える
 *
 * @param doc       OpenAPI定義情報
 * @param naming    名前生成処理
 * @param responses responses定義オブジェクト
 * @param jsonPath  JSONパス
 */
function responsesToRef(doc: Document,
                        naming: NamingConfig,
                        responses: ResponsesObject | undefined,
                        jsonPath: string) {

  if (responses == null) {
    return;
  }

  for (const [statusCode, response] of Object.entries(responses)) {
    if ("$ref" in response) {
      continue;
    }
    const responseRefName = naming.response(response, doc, `$${jsonPath}.${statusCode}`);
    const refValue = `#/components/responses/${responseRefName}`;
    relocateToRef(doc, response, refValue);
  }
}

/**
 * schema定義を$refの参照に置き換える
 *
 * @param doc         OpenAPI定義情報
 * @param naming      名前生成処理
 * @param schema      schema定義オブジェクト
 * @param jsonPath    JSONパス
 * @param isDirectRef arrayやoneOfなどの参照先だけを$refにする場合はfalse。arrayやoneOf定義も含めて$refに置き換える場合はtrue
 */
function schemaToRef(doc: Document,
                     naming: NamingConfig,
                     schema: SchemaObject | ReferenceObject | undefined,
                     jsonPath: string,
                     isDirectRef = false) {
                      
  if (schema == null || "$ref" in schema) {
    return;
  }

  if (isDirectRef) {
    const refName = naming.schema(schema, doc, jsonPath);
    const refValue = `#/components/schemas/${refName}`;
    relocateToRef(doc, schema, refValue);
    return;
  }

  for (const refType of ["allOf", "oneOf", "anyOf"] as const) {
    if (refType in schema) {
      for (let i = 0; i < schema[refType]!.length; i++) {
        const schemaItem = schema[refType]![i]!;
        schemaToRef(doc, naming, schemaItem, `${jsonPath}.${refType}[${i}]`, true);
      }
      return;
    }
  }

  if ("not" in schema) {
    schemaToRef(doc, naming, schema.not, `${jsonPath}.not`, true);
    return;
  }

  const schemaRefName = naming.schema(schema, doc, jsonPath);
  const refValue = `#/components/schemas/${schemaRefName}`;
  relocateToRef(doc, schema, refValue);
}

/**
 * examples定義を$refの参照に置き換える
 *
 * @param doc      OpenAPI定義情報
 * @param naming   名前生成処理
 * @param examples examples定義オブジェクト
 * @param jsonPath JSONパス
 */
function examplesToRef(doc: Document, 
                       naming: NamingConfig, 
                       examples: ExamplesObj | undefined,
                       jsonPath: string) {

  if (examples == null) {
    return;
  }

  for (const [exampleName, example] of Object.entries(examples)) {
    if ("$ref" in example) {
      continue;
    }
    const exampleRefName = naming.example(example, doc, `${jsonPath}.['${exampleName}']`);
    const refValue = `#/components/examples/${exampleRefName}`;
    relocateToRef(doc, example, refValue);
  }
}

/**
 * headers定義を$refの参照に置き換える
 *
 * @param doc OpenAPI定義情報
 * @param naming 名前生成処理
 * @param headers headers定義オブジェクト
 * @param jsonPath JSONパス
 */
function headersToRef(doc: Document, 
                      naming: NamingConfig,
                      headers: HeadersObject | undefined,
                      jsonPath: string) {

  if (headers == null) {
    return;
  }

  for (const [headerName, header] of Object.entries(headers)) {
    if ("$ref" in header) {
      continue;
    }
    const headerRefName = naming.header(header, doc, `${jsonPath}.['${headerName}']`);
    const refValue = `#/components/headers/${headerRefName}`;
    relocateToRef(doc, header, refValue);
  }
}

/**
 * content定義を$refの参照に置き換える
 *
 * @param doc         OpenAPI定義情報
 * @param naming      名前生成処理
 * @param content     content定義オブジェクト
 * @param isDirectRef arrayやoneOfなどの参照先だけを$refにする場合はfalse。arrayやoneOf定義も含めて$refに置き換える場合はtrue
 * @param jsonPath    JSONパス
 */
function contentToRef(doc: Document,
                      naming: NamingConfig,
                      content: ContentObject | undefined,
                      jsonPath: string,
                      isDirectRef = false) {

  if (content == null) {
    return;
  }

  for (const [contentType, mediaType] of Object.entries(content)) {

    let path = `${jsonPath}.['${contentType}'].schema`;
    schemaToRef(doc, naming, mediaType.schema, path, isDirectRef);

    path = `${jsonPath}.['${contentType}'].examples`;
    examplesToRef(doc, naming, mediaType.examples, path);

    for (const [mediaName, encoding] of Object.entries(mediaType?.encoding ?? {})) {
      path = `${jsonPath}.['${contentType}'].encoding.['${mediaName}'].headers`;
      headersToRef(doc, naming, encoding.headers, path);
    }

  }
}

/**
 * links定義を$refの参照に置き換える
 *
 * @param doc      OpenAPI定義情報
 * @param naming   名前生成処理
 * @param links    links定義オブジェクト
 * @param jsonPath JSONパス
 */
function linkToRef(doc: Document,
                   naming: NamingConfig,
                   links: LinksObject | undefined,
                   jsonPath: string) {
                    
  if (links == null) {
    return;
  } 

  for (const [linkName, link] of Object.entries(links)) {
    if ("$ref" in link) {
      continue;
    }
    const linkRefName = naming.link(link, doc, `${jsonPath}.['${linkName}']`);
    const refValue = `#/components/links/${linkRefName}`;
    relocateToRef(doc, link, refValue);
  }
}

/**
 * オブジェクトの内部構造を指定参照先のリファレンスに移し替える
 * 
 * @param doc      OpenAPI定義情報
 * @param obj      オブジェクト
 * @param refValue 参照先
 */
function relocateToRef(doc: Document, obj: Record<string, any>, refValue: string) {
  const refName = refValue.split('/').at(-1)!;
  const refParent = getParent(doc, refValue);
  refParent[refName] = {...obj};
  for (const key of Object.keys(obj)) {
    delete obj[key];
  }
  obj.$ref = refValue;
}

/**
 * $refで指定されさ参照先要素の親オブジェクトを取得する
 * 
 * @param doc      OpenAPI定義情報
 * @param refValue 参照先
 */
function getParent(doc: Document, refValue: string) {

  // 先頭の $ は doc を表すので除去
  // 親オブジェクトまであればいいので末尾の要素も除去
  const refItems = refValue.split('/');
  refItems.shift();
  refItems.pop();

  // docから親オブジェクトまでパスをたどって返す
  let parent: Record<string, any> = doc;
  for (const refItem of refItems) {
    const decodedRefItem = refItem.replace(/~1/g, "/").replace(/~0/g, "~"); // RFC 6901
    if (parent == null || typeof parent !== 'object' || !(decodedRefItem in parent)) {
      throw new Error(`$ref追加対象のオブジェクトが存在しません[${refValue}]`);
    }
    parent = parent[decodedRefItem];
  }
  return parent;
}