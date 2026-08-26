import type { OpenAPI, OpenAPIV3 } from "openapi-types";
import type { NormalizedOpenAPIV3 } from "#/types/NormalizedOpenAPI.d.ts";

type Document = NormalizedOpenAPIV3.Document;
type PathItemObject = NormalizedOpenAPIV3.PathItemObject;
type SchemaObject = NormalizedOpenAPIV3.SchemaObject;
type RequestBodyObject = NormalizedOpenAPIV3.RequestBodyObject;
type ResponseObject = NormalizedOpenAPIV3.ResponseObject;
type ParameterObject = NormalizedOpenAPIV3.ParameterObject;
type ReferenceObject = NormalizedOpenAPIV3.ReferenceObject;
type ResolveType = PathItemObject | SchemaObject | RequestBodyObject | ResponseObject | ParameterObject;

/**
 * OpenAPIのドキュメントが Version3 であるか否かを判定する
 * 
 * @param doc OpenAPIドキュメント
 * @returns version3か否か
 */
export function isOasV3Document(doc: OpenAPI.Document): doc is OpenAPIV3.Document {
  return ("openapi" in doc) && doc.openapi.startsWith("3.0.");
}

/**
 * パラメータ情報とリクエストボディ情報をまとめた1つのスキーマオブジェクトを作成する
 * - パラメータ情報が存在し、リクエストボディがオブジェクト型以外の場合: リクエストボディのプロパティ名を $body としてスキーマオブジェクトを作成
 * - それ以外: パラメータ情報とリクエストボディ情報をオブジェクトとしてマージする
 * 
 * @param doc OASドキュメント
 * @param parameter パラメータ情報
 * @param request リクエストデータを表すオブジェクト。voidの場合はundefinedを返す。
 */
export function createRequestData(doc: Document, parameter: SchemaObject | undefined, request: SchemaObject | undefined): SchemaObject | undefined {

  // パラメータ情報が存在しない場合はリクエストボディ情報がリクエスト情報のすべてになる
  if (parameter == null) {
    return request;
  }

  // リクエストボディ情報が存在しない場合はパラメータ情報がリクエスト情報のすべてになる
  if (request == null) {
    return parameter;
  }

  // リクエストボディがオブジェクト型ではない場合は $body プロパティを持つオブジェクトとして定義する
  if (request.type !== "object") {
    let $ref = "";
    for (const [schemaName, schemaObj] of Object.entries(doc.components?.schemas ?? {})) {
      if (schemaObj === request) {
        $ref = `#/components/schemas/${schemaName}`;
        break;
      }
    }
    if ($ref === "") {
      throw new Error(`不明なリクエストオブジェクト: ${JSON.stringify(request)}`);
    }
    request = {
      type: "object",
      properties: {
        $body: {
          $ref,
        }
      }
    };
  }

  // パラメータ情報、リクエストボディ情報をマージしたオブジェクトスキーマを返す
  return {
    type: "object",
    properties: {
      ...(parameter.properties ?? {}),
      ...(request.properties ?? {}),
    }
  };
}

/**
 * $refのパスから該当オブジェクトを取得する
 * 
 * @param doc OASドキュメント
 * @param ref $refに設定されたパス
 * @returns スキーマオブジェクト
 */
export function resolveRef<T extends ResolveType = SchemaObject>(doc: Document, ref: string): T {

  // 指定$refが指すオブジェクトを取得
  const obj = ref.startsWith("#/components/schemas/")       ? doc.components?.schemas?.[ref.slice(21)] :
              ref.startsWith("#/paths/")                    ? doc.paths?.[ref.slice(8)] :
              ref.startsWith("#/components/requestBodies/") ? doc.components?.requestBodies?.[ref.slice(27)] :
              ref.startsWith("#/components/responses/")     ? doc.components?.responses?.[ref.slice(23)] :
              ref.startsWith("#/components/parameters/")    ? doc.components?.parameters?.[ref.slice(24)] :
                                                              null;
  if (obj == null) {
    throw new Error(`不正な $ref を検出しました。 $ref = ${ref}`);
  }

  // 参照先のオブジェクトが $ref 属性を持っていない場合は得られたオブジェクトを返却
  if (!('$ref' in obj) || obj.$ref == null) {
    return obj as T;
  }
  // さらに参照先が存在する場合は再度 $ref を探索する
  return resolveRef<T>(doc, obj.$ref);
}

/**
 * allOf で複数オブジェクトが指定されている場合に各オブジェクトのキーをマージした1つの SchemaObject に変換する。
 * 
 * @param doc OASドキュメント
 * @param refs allOfで参照されている参照オブジェクトリスト
 * @returns マージしたSchemaObject。マージできない場合はnull
 */
export function mergeAllOfSchema(doc: Document, refs: ReferenceObject[]): SchemaObject | null {

  // 参照パスからスキーマオブジェクトを取得
  const schemas = refs.map(ref => resolveRef(doc, ref.$ref));

  // オブジェクト同士のみマージする
  for (const schema of schemas) {
    if ("type" in schema && schema.type !== "object") {
      return null;
    }
  }

  // allOfが複数回続いている場合は下の階層のallOfのマージを先に実施
  const mergeSchemas: SchemaObject[] = [];
  for (const schema of schemas) {
    if (!("allOf" in schema)) {
      mergeSchemas.push(schema);
      continue;
    }
    const tmpSchema = mergeAllOfSchema(doc, schema.allOf!);
    if (tmpSchema == null) {
      return null;
    }
    mergeSchemas.push(tmpSchema);
  }
  
  // allOfで参照されている properties、required のマージを実施
  const properties: Record<string, ReferenceObject> = {};
  const required: string[] = [];
  for (const resolvedSchema of mergeSchemas) {
    Object.assign(properties, resolvedSchema.properties ?? {});
    for (const requiredItem of resolvedSchema.required ?? []) {
      if (!required.includes(requiredItem)) {
        required.push(requiredItem);
      }
    }
  }

  // SchemaObject形式にして返却
  return {
    type: "object",
    properties,
    ...(required.length === 0 ? {} : {required}),
  };
}

/**
 * 「type=object」のスキーマオブジェクトに対して、additionalProperties 属性を properties 属性に反映する。
 * - additionalProperties: false -> 変更なし
 * - additionalProperties: true -> properties を空にする(any扱い)
 * - additionalProperties: <スキーマ> ->  properties を空にする(any扱い)
 * 
 * @param schemaObj スキーマオブジェクト
 */
export function applyAdditionalProperties(schemaObj: SchemaObject): SchemaObject {
  if (schemaObj.type !== "object") {
    return schemaObj;
  }
  if (schemaObj.additionalProperties == null || schemaObj.additionalProperties === false) {
    return schemaObj;
  }
  const {properties, ...rest} = schemaObj;  // eslint-disable-line @typescript-eslint/no-unused-vars
  return {
    ...rest,
  }
}
