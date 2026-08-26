/**
 * OpenAPIの構造を$refをたどるように変換する際に指定する命名方法を定義する。
 * ※ OpenAPI v3.0専用
 *
 * 例：
 * [変更前]
 * paths:
 *   /users/profile:
 *     post:
 *       requestBody:
 *         content:
 *           "application/json":
 *             schema:
 *               type: object
 *               properties:
 *                 param1:
 *                   type: number
 *                 param2:
 *                   type: string
 *       responses:
 *         200:
 *           content:
 *             "application/json":
 *               schema:
 *                 type: object
 *                 properties:
 *                   praam3:
 *                     type: number
 *                   param4:
 *                     type: string
 *
 * [変更後]
 * paths:
 *   /:
 *     post:
 *       operationId: postUsersProfile  // operationIdがない場合は生成する (method + path)
 *       requestBody:
 *         $ref: "#/components/requestBodies/PostUsersProfileRequest"  // operationId + "Request"
 *       responses:
 *         200:
 *           $ref: "#/components/requestBodies/PostUsersProfileResponse"  // operationId + "Response"
 * components:
 *   requestBodies:
 *     PostUsersProfileRequest:      // operationId + "Request"
 *       content:
 *         "application/json":
 *           schema:
 *             type: object
 *             properties:
 *               param1:
 *                 type: number
 *               param2:
 *                 type: string
 *   schemas:
 *     PostUsersProfileResponse:     // operationId + "Response"
 *       type: object
 *         properties:
 *           param1:
 *             type: number
 *           param2:
 *             type: string
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import type { OpenAPIV3 } from "openapi-types";
import { toPascalCase } from "#/utils/index.ts";

type Document = OpenAPIV3.Document;
type OperationObject = OpenAPIV3.OperationObject;
type ParameterObject = OpenAPIV3.ParameterObject;
type RequestBodyObject = OpenAPIV3.RequestBodyObject;
type ResponseObject = OpenAPIV3.ResponseObject;
type SchemaObject = OpenAPIV3.SchemaObject;
type ExampleObject = OpenAPIV3.ExampleObject;
type HeaderObject = OpenAPIV3.HeaderObject;
type LinkObject = OpenAPIV3.LinkObject;

type NamingFunc<T> = (obj: T, doc: Document, jsonPath: string) => string;

/**
 * 生成する名前を決定する関数
 */
export type NamingConfig = {
  operation: NamingFunc<OperationObject>;
  parameter: NamingFunc<ParameterObject>;
  requestBody: NamingFunc<RequestBodyObject>;
  response: NamingFunc<ResponseObject>;
  schema: NamingFunc<SchemaObject>;
  example: NamingFunc<ExampleObject>;
  header: NamingFunc<HeaderObject>;
  link: NamingFunc<LinkObject>;
};

/** デフォルトの名前決定処理 */
export const defaultNamingConfig: NamingConfig = {
  operation: getOperationId,
  parameter: getParameterName,
  requestBody: getRequestBodyName,
  response: getResponseName,
  schema: getSchemaName,
  example: getExampleName,
  header: getHeaderName,
  link: getLinkName,
};

/**
 * operationIdを生成する
 * 
 * ```
 * jsonPath                                                 name
 * -------------------------------------------------------  -------------------
 * $.paths.[パス].[メソッド]                                 <メソッド> + <パス>
 * $.components.callbacks.[コールバック名].[パス].[メソッド]  <メソッド> + <パス>
 * ```
 *
 * @param _operation オペレーションオブジェクト
 * @param _doc       OpenAPI定義情報
 * @param jsonPath   オペレーションオブジェクトのJSONパス
 * @returns operationIdの名前
 */
function getOperationId(_operation: OperationObject, _doc: Document, jsonPath: string) {
  const pathItems = new JsonPathItems(jsonPath);
  const isCallback = pathItems.at(1) === "components";
  const [path, method] = isCallback
    ? [pathItems.at(4), pathItems.at(5)]
    : [pathItems.at(2), pathItems.at(3)];
  const pathRemovedPathParam = path.replace(/[{}]/g, "");
  return `${method}${toPascalCase(pathRemovedPathParam)}`;
}

/**
 * パラメータの名前を生成する
 * 
 * ```
 * param.in  name                     
 * --------  -------------------------
 * query     <パラメータ名>           
 * その他    <inの値> + <パラメータ名>
 * ```
 *
 * @param parameter パラメータオブジェクト
 * @param doc       OpenAPI定義情報
 * @param _jsonPath パラメータオブジェクトのJSONパス
 * @returns パラメータの名前
 */
function getParameterName(parameter: ParameterObject, doc: Document, _jsonPath: string) {
  let parameterName: string;
  if (parameter.in === "query") {
    parameterName = parameter.name;
  } else {
    parameterName = `${parameter.in}${toPascalCase(parameter.name)}`;
  }
  return getUniqueName(doc?.components?.parameters, parameterName);
}

/**
 * リクエストボディの名前を生成する
 * 
 * ```
 * jsonPath                                                              name
 * -------------------------------------------------------------------  -----------------------------
 * $.paths.[パス].[メソッド].requestBody                                 <operationId> + "RequestBody"
 * $.components.callbacks.[コールバック名].[パス].[メソッド].requestBody  <operationId> + "RequestBody"
 * ```
 *
 * @param _requestBody リクエストボディオブジェクト
 * @param doc          OpenAPI定義情報
 * @param jsonPath     リクエストボディオブジェクトのJSONパス
 * @returns リクエストボディの名前
 */
function getRequestBodyName(_requestBody: RequestBodyObject, doc: Document, jsonPath: string) {
  const pathItems = new JsonPathItems(jsonPath);
  const isCallback = pathItems.at(1) === "components";
  const [path, method, callbackName] = isCallback
    ? [pathItems.at(4), pathItems.at(5), pathItems.at(3)]
    : [pathItems.at(2), pathItems.at(3), ""];
  let operationId = isCallback
    ? (doc as any).components.callbacks[callbackName][path][method].operationId
    : (doc as any).paths[path][method].operationId;
  if (operationId == null) {
    operationId = getOperationId(null as unknown as OperationObject, doc, pathItems.slice(0, -1));
  }
  const requestBodyName = `${toPascalCase(operationId)}RequestBody`;
  return getUniqueName(doc?.components?.requestBodies, requestBodyName);
}

/**
 * レスポンス情報の名前を生成する
 * 
 * ```
 * jsonPath                                                                            name
 * ----------------------------------------------------------------------------------  -----------------------------------------
 * $.paths.[パス].[メソッド].responses.[ステータスコード]                                <operationId> + <statusCode> + "Response"
 * $.components.callbacks.[コールバック名].[パス].[メソッド].responses.[ステータスコード]  <operationId> + <statusCode> + "Response"
 * ※ 200の場合は<statusCode>を省略
 * ```
 *
 * @param _response レスポンスオブジェクト
 * @param doc       OpenAPI定義情報
 * @param jsonPath レスポンスオブジェクトのJSONパス
 * @returns レスポンス情報の名前
 */
function getResponseName(_responseObj: ResponseObject, doc: Document, jsonPath: string) {
  const pathItems = new JsonPathItems(jsonPath);
  const isCallback = pathItems.at(1) === "components";
  const [path, method, statusCode, callbackName] = isCallback
    ? [pathItems.at(4), pathItems.at(5), pathItems.at(7), pathItems.at(3)]
    : [pathItems.at(2), pathItems.at(3), pathItems.at(5), ""];
  const statusCodeText = statusCode === "200" ? "" : statusCode;
  let operationId = isCallback
    ? (doc as any).components.callbacks[callbackName][path][method].operationId
    : (doc as any).paths[path][method].operationId;
  if (operationId == null) {
    operationId = getOperationId(null as unknown as OperationObject, doc, pathItems.slice(0, -2));
  }
  const responseName = `${toPascalCase(operationId)}${statusCodeText}Response`;
  return getUniqueName(doc.components?.responses, responseName);
}

/**
 * example情報の名前を生成する
 * 
 * ```
 * jsonPath                                                                                         name
 * -----------------------------------------------------------------------------------------------  ---------------------------------------------------------------
 * $.components.parameters.[パラメータ名].examples.[example名]                                      <パラメータ名> + <example名> + "Parameter"
 * $.components.parameters.[パラメータ名].content.[コンテンツタイプ].examples.[example名]           <パラメータ名> + <コンテンツタイプ> + <example名> + "Parameter"
 * $.components.headers.[ヘッダ名].examples.[example名]                                             <ヘッダ名> + <example名> + "Header"
 * $.components.headers.[ヘッダ名].content.[コンテンツタイプ].examples.[example名]                  <ヘッダ名> + <コンテンツタイプ> + <example名> + "Header"
 * $.components.schemas.[スキーマ名].examples.[example名]                                           <スキーマ名> + <example名>
 * $.components.requestBodies.[リクエストボディ名].content.[コンテンツタイプ].examples.[example名]  <リクエストボディ名> + <コンテンツタイプ> + <example名>
 * $.components.responses.[レスポンス名].content.[コンテンツタイプ].examples.[example名]            <レスポンス名> + <コンテンツタイプ> + <example名>
 * ※ <コンテンツタイプ>は複数存在する場合に付与
 * ```
 *
 * @param _example example情報
 * @param doc      OpenAPI定義情報
 * @param jsonPath exampleのJSONパス
 * @returns example情報の名前
 */
function getExampleName(_example: ExampleObject, doc: Document, jsonPath: string) {
  
  const pathItems = new JsonPathItems(jsonPath);
  const [componentType, name] = [pathItems.at(2), pathItems.at(3)];

  // $.components.schemas.[スキーマ名].examples.[example名]
  if (componentType === "schemas") {
    const exampleName = pathItems.at(5);
    const fullExampleName = `${toPascalCase(name)}${toPascalCase(exampleName)}`;
    return getUniqueName(doc?.components?.examples, fullExampleName);
  }

  // $.components.headers.[ヘッダ名].examples.[example名]
  if (componentType === "headers" && pathItems.at(4) === "examples") {
    const exampleName = pathItems.at(5);
    const fullExampleName = `${toPascalCase(name)}${toPascalCase(exampleName)}Header`;
    return getUniqueName(doc?.components?.examples, fullExampleName);
  }

  // $.components.headers.[ヘッダ名].content.[コンテンツタイプ].examples.[example名]
  if (componentType === "headers" && pathItems.at(4) === "content") {
    const exampleName = pathItems.at(7);
    const hasManyContentType = 1 < Object.keys((doc as any).components.headers[name].content).length;
    if (!hasManyContentType) {
      const fullExampleName = `${toPascalCase(name)}${toPascalCase(exampleName)}Header`;
      return getUniqueName(doc?.components?.examples, fullExampleName);
    }
    const contentType = pathItems.at(5);
    const fullExampleName = `${toPascalCase(name)}${toPascalCase(contentType)}${toPascalCase(exampleName)}Header`;
    return getUniqueName(doc?.components?.examples, fullExampleName);
  }

  // $.components.requestBodies.[リクエストボディ名].content.[コンテンツタイプ].examples.[example名]
  if (componentType === "requestBodies") {
    const [contentType, exampleName] = [pathItems.at(5), pathItems.at(7)];
    const hasManyContentType = 1 < Object.keys((doc as any).components.requestBodies[name].content).length;
    if (!hasManyContentType) {
      const fullExampleName = `${toPascalCase(name)}${toPascalCase(exampleName)}`;
      return getUniqueName(doc?.components?.examples, fullExampleName);
    }
    const fullExampleName = `${toPascalCase(name)}${toPascalCase(contentType)}${toPascalCase(exampleName)}`;
    return getUniqueName(doc?.components?.examples, fullExampleName);
  }

  // $.components.responses.[レスポンス名].content.[コンテンツタイプ].examples.[example名]
  if (componentType === "responses") {
    const [contentType, exampleName] = [pathItems.at(5), pathItems.at(7)];
    const hasManyContentType = 1 < Object.keys((doc as any).components.responses[name].content).length;
    if (!hasManyContentType) {
      const fullExampleName = `${toPascalCase(name)}${toPascalCase(exampleName)}`;
      return getUniqueName(doc?.components?.examples, fullExampleName);
    }
    const fullExampleName = `${toPascalCase(name)}${toPascalCase(contentType)}${toPascalCase(exampleName)}`;
    return getUniqueName(doc?.components?.examples, fullExampleName);
  }

  if (componentType !== "parameters") {
    throw new Error(`不明なexampleを検出しました。${jsonPath}`);
  }

  // $.components.parameters.[パラメータ名].examples.[example名]
  if (pathItems.at(4) === "examples") {
    const exampleName = pathItems.at(5);
    const fullExampleName = `${name}${toPascalCase(exampleName)}Parameter`;
    return getUniqueName(doc?.components?.examples, fullExampleName);
  }

  // $.components.parameters.[パラメータ名].content.[コンテンツタイプ].examples.[example名]
  const [contentType, exampleName] = [pathItems.at(5), pathItems.at(7)];
  const hasManyContentType = 1 < Object.keys((doc as any).components.parameters[name].content).length;
  if (!hasManyContentType) {
    const fullExampleName = `${name}${toPascalCase(exampleName)}Parameter`;
    return getUniqueName(doc?.components?.examples, fullExampleName);
  }
  const fullExampleName = `${name}${toPascalCase(contentType)}${toPascalCase(exampleName)}Parameter`;
  return getUniqueName(doc?.components?.examples, fullExampleName);
}

/**
 * ヘッダ情報の名前を生成する
 * 
 * ```
 * jsonPath                                                                                                name
 * ------------------------------------------------------------------------------------------------------  ------------------------------------------------------
 * $.components.parameters.[パラメータ名].content.[コンテンツタイプ].encoding.headers.[ヘッダ名]           <パラメータ名> + <コンテンツタイプ> + <ヘッダ名>
 * $.components.requestBodies.[リクエストボディ名].content.[コンテンツタイプ].encoding.headers.[ヘッダ名]  <リクエストボディ名> + <コンテンツタイプ> + <ヘッダ名>
 * $.components.responses.[レスポンス名].headers.[ヘッダ名]                                                <レスポンス名> + <ヘッダ名>
 * $.components.responses.[レスポンス名].content.[コンテンツタイプ].encoding.headers.[ヘッダ名]            <レスポンス名> + <コンテンツタイプ> + <ヘッダ名>
 * ```
 *
 * @param header   ヘッダ情報
 * @param doc      OpenAPI定義情報
 * @param jsonPath ヘッダ情報のJSONパス
 * @returns ヘッダ情報の名前
 */
function getHeaderName(_header: HeaderObject, doc: Document, jsonPath: string) {

  const pathItems = new JsonPathItems(jsonPath);
  const componentType = pathItems.at(2);

  // $.components.parameters.<パラメータ名>.content.<コンテンツタイプ>.encoding.headers.<ヘッダ名>
  if (componentType === "parameters") {
    const [paramName, contentType, headerName] = [pathItems.at(3), pathItems.at(5), pathItems.at(8)];
    const fullHeaderName = `${toPascalCase(paramName)}${toPascalCase(contentType)}${toPascalCase(headerName)}`;
    return getUniqueName(doc?.components?.headers, fullHeaderName);
  }

  // $.components.requestBodies.<リクエストボディ名>.content.<コンテンツタイプ>.encoding.headers.<ヘッダ名>
  if (componentType === "requestBodies") {
    const [reqBody, contentType, headerName] = [pathItems.at(3), pathItems.at(5), pathItems.at(8)];
    const fullHeaderName = `${toPascalCase(reqBody)}${toPascalCase(contentType)}${toPascalCase(headerName)}`;
    return getUniqueName(doc?.components?.headers, fullHeaderName);
  }

  // $.components.responses.<レスポンス名>.headers.<ヘッダ名>
  if (componentType === "responses" && pathItems.at(4) === "headers") {
    const [responseName, headerName] = [pathItems.at(3), pathItems.at(5)]
    const fullHeaderName = `${toPascalCase(responseName)}${toPascalCase(headerName)}`;
    return getUniqueName(doc?.components?.headers, fullHeaderName);
  }

  // $.components.responses.<レスポンス名>.content.<コンテンツタイプ.encoding.headers.[ヘッダ名]
  if (componentType === "responses" && pathItems.at(4) === "content") {
    const [responseName, contentType, headerName] = [pathItems.at(3), pathItems.at(5), pathItems.at(8)];
    const fullHeaderName = `${toPascalCase(responseName)}${toPascalCase(contentType)}${toPascalCase(headerName)}`;
    return getUniqueName(doc?.components?.headers, fullHeaderName);
  }

  throw new Error(`不明なヘッダ情報を検出しました。jsonPath=${jsonPath}`);
}

/**
 * リンク情報の名前を生成する
 * 
 * ```
 * jsonPath                                              name
 * ----------------------------------------------------  ---------------------------
 * $.components.responses.[レスポンス名].links.[リンク名]  <レスポンス名> + <リンク名>
 * ```
 *
 * @param _link    リンク情報
 * @param doc      OpenAPI定義情報
 * @param jsonPath リンク情報のJSONパス
 * @returns リンク情報の名前
 */
function getLinkName(_link: LinkObject, doc: Document, jsonPath: string) {
  const pathItems = new JsonPathItems(jsonPath);
  const [responseName, linkName] = [pathItems.at(3), pathItems.at(5)];
  const fullLinkName = `${toPascalCase(responseName)}${toPascalCase(linkName)}`;
  return getUniqueName(doc?.components?.links, fullLinkName);
}

/**
 * スキーマの名前を生成する
 * 
 * ```
 * jsonPath                                                                           name
 * ---------------------------------------------------------------------------------  -------------------------------------------------
 * プリミティブなスキーマ                                                             string/number/integer/boolean + <連番>
 * $.components.parameters.[パラメータ名].schema                                      <パラメータ名> + "Parameter"
 * $.components.parameters.[パラメータ名].content.[コンテンツタイプ].schema           <パラメータ名> + <コンテンツタイプ> + "Parameter"
 * $.components.requestBodies.[リクエストボディ名].content.[コンテンツタイプ].schema  <リクエストボディ名> + <コンテンツタイプ>
 * $.components.responses.[レスポンス名].content.[コンテンツタイプ].schema            <レスポンス名> + <コンテンツタイプ>
 * $.components.headers.[ヘッダ名].schema                                             <ヘッダ名> + "Header"
 * $.components.headers.[ヘッダ名].content/[コンテンツタイプ]/schema                  <ヘッダ名> + <コンテンツタイプ> + "Header"
 * $.components.schemas.[スキーマ名](.[items/allOf/oneOf/anyOf/not])*                <スキーマ名> + "Item" + <連番>
 * $.components.schemas.[スキーマ名].properties.[プロパティ名]                        <スキーマ名> + <プロパティ名>
 * ※ コンテンツタイプは複数種類ある場合に付与
 * ```
 *
 * @param schema   スキーマオブジェクト
 * @param doc      OpenAPI定義情報
 * @param jsonPath スキーマオブジェクトのJSONパス
 * @returns スキーマの名前
 */
function getSchemaName(schema: SchemaObject, doc: Document, jsonPath: string) {

  // プリミティブな場合
  if (["string", "number", "integer", "boolean"].includes(schema.type ?? '')) {
    return getPrimitiveName(schema);
  }

  const pathItems = new JsonPathItems(jsonPath);

  // $.components.parameters.[パラメータ名].schema
  if (pathItems.at(2) === "parameters" && pathItems.at(4) === "schema") {
    const paramName = pathItems.at(3);
    const schemaName = `${toPascalCase(paramName)}Parameter`;
    return getUniqueName(doc?.components?.schemas, schemaName);
  }

  // $.components.parameters.[パラメータ名].content.[コンテンツタイプ].schema
  if (pathItems.at(2) === "parameters" && pathItems.at(4) === "content") {
    const [paramName, contentType] = [pathItems.at(3), pathItems.at(5)];
    const schemaName = `${toPascalCase(paramName)}${toPascalCase(contentType)}Parameter`;
    return getUniqueName(doc?.components?.schemas, schemaName);
  }

  // $.components.requestBodies.[リクエストボディ名].content.[コンテンツタイプ].schema
  if (pathItems.at(2) === "requestBodies") {
    const requestBodyName = pathItems.at(3);
    const hasManyContentType = 1 < Object.keys((doc as any).components.requestBodies[requestBodyName].content).length;
    if (!hasManyContentType) {
      return getUniqueName(doc?.components?.schemas, toPascalCase(requestBodyName));
    }
    const contentType = pathItems.at(5);
    const schemaName = `${toPascalCase(requestBodyName)}${toPascalCase(contentType)}`;
    return getUniqueName(doc?.components?.schemas, schemaName);
  }

  // $.components.responses.[レスポンス名].content.[コンテンツタイプ].schema
  if (pathItems.at(2) === "responses") {
    const responseName = pathItems.at(3);
    const hasManyContentType = 1 < Object.keys((doc as any).components.responses[responseName].content).length;
    if (!hasManyContentType) {
      return getUniqueName(doc?.components?.schemas, toPascalCase(responseName));
    }
    const contentType = pathItems.at(5);
    const schemaName = `${toPascalCase(responseName)}${toPascalCase(contentType)}`;
    return getUniqueName(doc?.components?.schemas, schemaName);
  }

  // $.components.headers.[ヘッダ名].schema
  if (pathItems.at(2) === "headers" && pathItems.at(4) === "schema") {
    const headerName = pathItems.at(3);
    const schemaName = `${toPascalCase(headerName)}Header`;
    return getUniqueName(doc?.components?.schemas, schemaName);
  }

  // $.components.headers.[ヘッダ名].content.[コンテンツタイプ].schema
  if (pathItems.at(2) === "headers" && pathItems.at(4) === "content") {
    const headerName = pathItems.at(3);
    const hasManyContentType = 1 < Object.keys((doc as any).components.headers[headerName].content).length;
    if (!hasManyContentType) {
      const schemaName = `${toPascalCase(headerName)}Header`;
      return getUniqueName(doc?.components?.schemas, schemaName);
    }
    const contentType = pathItems.at(5);
    const schemaName = `${toPascalCase(headerName)}${toPascalCase(contentType)}Header`;
    return getUniqueName(doc?.components?.schemas, schemaName);
  }

  // $.components.schemas.[スキーマ名](.[items/allOf/oneOf/anyOf/not])*
  const isLogicalOrArray = pathItems.at(-1).match(/^(allOf|oneOf|anyOf|not)\[\d+\]$/)
                           || ["not", "items"].includes(pathItems.at(-1));
  if (pathItems.at(2) === "schemas" && isLogicalOrArray) {
    const schemaName = pathItems.at(3);
    return getUniqueName(doc?.components?.schemas, toPascalCase(schemaName));
  }

  // $.components.schemas.[スキーマ名](.[items/allOf/oneOf/anyOf/not])*.properties.[プロパティ名]
  if (pathItems.at(2) === "schemas" && jsonPath.includes("properties")) {
    const schemaName = pathItems.at(3);
    const propNameIndex = pathItems.indexOf("properties") + 1;
    const propName = pathItems.at(propNameIndex);
    const baseName = `${toPascalCase(schemaName)}${toPascalCase(propName)}`;
    return getUniqueName(doc?.components?.schemas, baseName);
  }

  throw new Error(`不明なパスに対するスキーマの名称生成処理が行われました: ${jsonPath}`);
}

/**
 * 親オブジェクトに存在しないキー名を取得する。
 * 既に同じ名前のキー名が存在している場合は連番を付与した名前を返す。
 *
 * @param {Record<string, any>} parentObj 親オブジェクト
 * @param {string} keyName キー名
 * @returns 親オブジェクトに存在しないキー名
 */
function getUniqueName(parentObj: Record<string, unknown> | undefined, keyName: string) {
  if (parentObj == null || parentObj[keyName] == null) {
    return keyName;
  }
  for (let counter = 2; ; counter++) {
    if (parentObj[`${keyName}${counter}`] == null) {
      return `${keyName}${counter}`;
    }
  }
}

/**
 * プリミティブな型の連番を管理する情報
 * 命名処理完了後にプロセスが終了する前提なので初期化処理のexport関数は用意していない
 */
const primitiveMaps = {
  string: new Map<string, string>(),
  number: new Map<string, string>(),
  integer: new Map<string, string>(),
  boolean: new Map<string, string>(),
};

/**
 * プリミティブな型の名前を生成する
 * 同じ構造を持つプリミティブな型が複数あった場合、過去に払い出した名前を再利用する
 * 
 * ```
 * string型の場合: 'string' + <連番>
 * number型の場合: 'number' + <連番>
 * integer型の場合: 'integer' + <連番>
 * boolean型の場合: 'boolean' + <連番>
 * ```
 * @param schema プリミティブなスキーマオブジェクト
 */
function getPrimitiveName(schema: SchemaObject) {
  const map = primitiveMaps[schema.type as keyof typeof primitiveMaps];
  const schemaJson = JSON.stringify(schema);
  let name = map.get(schemaJson);
  if (name == null) {
    name = `${schema.type}${map.size + 1}`;
    map.set(schemaJson, name);
  }
  return name;
}

/**
 * jsonPathの指定要素取得処理
 */
class JsonPathItems {

  /** JsonPathの各要素 */
  private pathItems: string[];

  /** コンストラクタ */
  constructor(jsonPath: string) {
    this.pathItems = jsonPath.split(".");
  }

  /** 指定位置の値を取得 */
  public at(index: number): string {
    if (this.pathItems.length < index) {
      throw new Error(
        `JsonPathに対する不正な要素取得処理が行われました。jsonPath: ${this.pathItems.join(".")}, index: ${index}}`,
      );
    }
    const value = this.pathItems.at(index)!;
    const isLiteralName = value.startsWith("[") && value.endsWith("]");
    return isLiteralName ? value.slice(2, -2) : value;
  }

  /** 指定部分のパスを取得 */
  public slice(start? : number, end?: number) {
    return this.pathItems.slice(start, end).join(".");
  }

  /** 指定要素を持つインデックスを取得 */
  public indexOf(searchElement: string, fromIndex?: number) {
    for (let i = fromIndex ?? 0; i < this.pathItems.length; i++) {
      if (this.pathItems.at(i) === searchElement) {
        return i;
      }
    }
    return -1;
  }
}
