/**
 * ループ構造を持たない OAS スキーマからデフォルト値定義のコード文字列に変換する。
 * OASの default 属性の値をデフォルト値として使用する(ない場合は undefined を指定)。
 * 
 * [例]
 * type: object
 *   properties:
 *     prop1:
 *       type: string
 *     prop2:
 *       allOf:
 *         - type: object
 *             properties:
 *               prop3:
 *                 type: number
 *                 default: 3
 *         - type: object
 *             properties: 
 *               prop4:
 *                 type: boolean
 * 
 * ↓
 * 
 * {
 *   prop1: undefined,
 *   prop2: {
 *     prop3: 3,
 *     prop4: undefined,
 *   },
 * };
 *   
 */

import type { NormalizedOpenAPIV3 } from "#/types/NormalizedOpenAPI.d.ts";
import { resolveRef, makeIndent, mergeAllOfSchema, applyAdditionalProperties } from "#/utils/index.ts";

type Document = NormalizedOpenAPIV3.Document;
type SchemaObject = NormalizedOpenAPIV3.SchemaObject;

/**
 * 任意のOASスキーマオブジェクトからデフォルト値の定義テキストを生成する
 * 
 * @param doc OASドキュメント
 * @param schemaObj スキーマオブジェクト
 * @param isRequired 必須の場合はtrue
 * @param indentLevel インデントの深さ
 * @returns デフォルト値の定義テキスト
 */
export function normalSchemaToDefaultValues(doc: Document, schemaObj: SchemaObject | undefined, isRequired: boolean = true, indentLevel = 1) {

  if (schemaObj == null) {
    return "undefined";
  }

  // allOf の参照先がオブジェクトのみの場合は直接スキーマをマージする
  if (schemaObj.allOf != null) {
    const tmpSchema = mergeAllOfSchema(doc, schemaObj.allOf);
    if (tmpSchema != null) {
      schemaObj = tmpSchema;
    }
  }

  if (schemaObj.allOf != null) {
    return allOfToDefaultValue(doc, schemaObj, isRequired, indentLevel);
  }

  if (schemaObj.anyOf != null ||  schemaObj.oneOf != null) {
    return oneOfToDefaultValue(doc, schemaObj, isRequired, indentLevel);
  }

  if (schemaObj.enum != null) {
    return enumToDefaultValues(schemaObj, isRequired);
  }

  switch (schemaObj.type) {
    case "object":
      return objectToDefaultValue(doc, schemaObj, isRequired, indentLevel);
    case "array":
      return arrayToDefaultValue(schemaObj, isRequired, indentLevel);
    case "string":
      return stringToDefaultValue(schemaObj, isRequired);
    case "number":
    case "integer":
      return numberToDefaultValue(schemaObj);
    case "boolean":
      return booleanToDefaultValue(schemaObj);
    default:
      throw new Error(`不正なスキーマ種別: ${JSON.stringify(schemaObj)}`);
  }
}


/**
 * allOf で指定されたスキーマオブジェクトからデフォルト値の定義テキストを生成する
 * 
 * @param doc OASドキュメント
 * @param schemaObj スキーマオブジェクト
 * @param isRequired 必須の場合はtrue
 * @param indentLevel インデントの深さ
 * @returns 型定義のテキスト
 */
export function allOfToDefaultValue(doc: Document, schemaObj: SchemaObject, isRequired: boolean, indentLevel = 1) {

  // 型のチェック
  if (!("allOf" in schemaObj)) {
    throw new Error(`allOf用デフォルト値作成処理で不正なパラメータが渡されました。 schema=${JSON.stringify(schemaObj)}`);
  }

  // デフォルト値が設定されていればその値を返す
  if (schemaObj.default != null) {
    return JSON.stringify(schemaObj.default, undefined, makeIndent(indentLevel));
  }

  // オブジェクトが必須ではない場合は undefined を返す
  if (!isRequired) {
    return "undefined";
  }

  // null指定可能な場合は null を返す
  if (schemaObj.nullable) {
    return "null";
  }

  // allOf が参照するスキーマは object のみ許容する
  const childSchemas = (schemaObj.allOf ?? []).map(item => resolveRef(doc, item.$ref));
  for (const childSchema of childSchemas) {
    if (["array", "boolean", "number", "string", "integer"].includes(childSchema.type ?? "")) {
      throw new Error(`allOfにobject以外が指定されているため処理を継続できませんでした。 schema=${JSON.stringify(schemaObj)}`);
    }
  }

  // インデントスペースを設定
  const blockIndent = makeIndent(indentLevel);
  const outerIndent = makeIndent(indentLevel - 1);

  // 各プロパティのデフォルト値定義を生成して結合する
  const zodTextList = ["{"];
  for (const childSchema of childSchemas) {
    zodTextList.push(`${blockIndent}...${normalSchemaToDefaultValues(doc, childSchema, true, indentLevel + 1)},`);
  }
  zodTextList.push(`${outerIndent}}`);
  return zodTextList.join("\n");
}
  
/**
 * oneOf / anyOf で指定されたスキーマオブジェクトからデフォルト値の定義テキストを生成する
 * 
 * @param doc OASドキュメント
 * @param schemaObj スキーマオブジェクト
 * @param isRequired 必須の場合はtrue
 * @param indentLevel インデントの深さ
 * @returns 型定義のテキスト
 */
export function oneOfToDefaultValue(doc: Document, schemaObj: SchemaObject, isRequired: boolean, indentLevel = 1): string {

  // 型のチェック
  if (!("oneOf" in schemaObj) && !("anyOf" in schemaObj)) {
    throw new Error(`oneOf/anyOf用デフォルト値作成処理で不正なパラメータが渡されました。 schema=${JSON.stringify(schemaObj)}`);
  }

  // デフォルト値が設定されていればその値を返す
  if (schemaObj.default != null) {
    return JSON.stringify(schemaObj.default, undefined, makeIndent(indentLevel));
  }

  // オブジェクトが必須ではない場合は undefined を返す
  if (!isRequired) {
    return "undefined";
  }

  // null指定可能な場合は null を返す
  if (schemaObj.nullable) {
    return "null";
  }

  // oneOf / anyOf の先頭要素のデフォルト値を返す
  const childRefObj = (schemaObj.oneOf != null) ? schemaObj.oneOf[0] : schemaObj.anyOf![0];
  const childSchema = resolveRef(doc, childRefObj.$ref);
  return normalSchemaToDefaultValues(doc, childSchema, isRequired, indentLevel);
}

/**
 * type=object のスキーマオブジェクトからデフォルト値の定義テキストを生成する
 * 
 * @param doc OASドキュメント
 * @param schemaObj スキーマオブジェクト
 * @param isRequired 必須の場合はtrue
 * @param indentLevel インデントの深さ
 * @returns zod定義のテキスト
 */
function objectToDefaultValue(doc: Document, schemaObj: SchemaObject, isRequired: boolean, indentLevel = 1) {

  // 型のチェック
  if (schemaObj.type !== "object") {
    throw new Error(`string用のデフォルト値定義作成処理で不正なパラメータが渡されました。 schema=${JSON.stringify(schemaObj)}`);
  }

  // デフォルト値が設定されていればその値を返す
  if (schemaObj.default != null) {
    return JSON.stringify(schemaObj.default, undefined, makeIndent(indentLevel));
  }

  // オブジェクトが必須ではない場合は undefined を返す
  if (!isRequired) {
    return "undefined";
  }

  // additionalProperties の指定がある場合は schemaObj に反映させる
  if (schemaObj.additionalProperties != null) {
    schemaObj = applyAdditionalProperties(schemaObj);
  }
  
  // properties の指定がない場合は any 型とし、undefined を指定する
  if (schemaObj.properties == null || Object.keys(schemaObj.properties).length === 0) {
    return "undefined";
  }

  // 必須プロパティを取得
  const requiredProps = schemaObj?.required ?? [];

  // インデントスペースを設定
  const blockIndent = makeIndent(indentLevel);
  const outerIndent = makeIndent(indentLevel - 1);

  // 各プロパティの zod 定義を生成
  const defaultValueTextList = ["{"];
  for (const [name, refObj] of Object.entries(schemaObj?.properties ?? {})) {
    const propSchema = resolveRef(doc, refObj.$ref);
    defaultValueTextList.push(`${blockIndent}${name}: ${normalSchemaToDefaultValues(doc, propSchema, requiredProps.includes(name), indentLevel + 1)},`);
  }
  defaultValueTextList.push(`${outerIndent}}`);
  return defaultValueTextList.join("\n");
}

/**
 * type=array のスキーマオブジェクトからデフォルト値の定義テキストを生成する
 * 
 * @param schemaObj スキーマオブジェクト
 * @param isRequired 必須の場合はtrue
 * @param indentLevel インデントの深さ
 * @returns zod定義のテキスト
 */
function arrayToDefaultValue(schemaObj: SchemaObject, isRequired: boolean, indentLevel = 1) {

  // 型のチェック
  if (schemaObj.type !== "array") {
    throw new Error(`配列用のデフォルト値定義作成処理で不正なパラメータが渡されました。 schema=${JSON.stringify(schemaObj)}`);
  }

  // デフォルト値が設定されていればその値を返す
  if (schemaObj.default != null) {
    return JSON.stringify(schemaObj.default, undefined, makeIndent(indentLevel));
  }

  // 必須ではない場合は undefined を返す
  if (!isRequired) {
    return "undefined";
  }

  // 空配列を返す
  return "[]";
}

/**
 * type=string のスキーマオブジェクトからデフォルト値の定義テキストを生成する
 * 
 * @param schemaObj スキーマオブジェクト
 * @param isRequired 必須の場合はtrue
 * @returns zod定義のテキスト
 */
function stringToDefaultValue(schemaObj: SchemaObject, isRequired: boolean) {

  // 型のチェック
  if (schemaObj.type !== "string" || schemaObj.enum != null) {
    throw new Error(`string用のデフォルト値定義作成処理で不正なパラメータが渡されました。 schema=${JSON.stringify(schemaObj)}`);
  }

  // デフォルト値が設定されていればその値を返す
  if (schemaObj.default != null) {
    return JSON.stringify(schemaObj.default);
  }

  // 必須ではない場合は undefined を返す
  if (!isRequired) {
    return "undefined";
  }

  // format=binaryの場合は必須であっても undefined を返す
  if (schemaObj.format === "binary") {
    return "undefined";
  }

  // 必須な場合は空文字を返す
  return '""';
}

/**
 * type=number or type=integer のスキーマオブジェクトからデフォルト値の定義テキストを生成する
 * 
 * @param schemaObj スキーマオブジェクト
 * @returns zod定義のテキスト
 */
function numberToDefaultValue(schemaObj: SchemaObject) {

  // 型のチェック
  if (["number", "integer"].every(type => schemaObj.type != type) || schemaObj.enum != null) {
    throw new Error(`数値用のデフォルト値定義作成処理で不正なパラメータが渡されました。 schema=${JSON.stringify(schemaObj)}`);
  }

  // デフォルト値が設定されていればその値を返す
  if (schemaObj.default != null) {
    return JSON.stringify(schemaObj.default);
  }

  // デフォルト値がない場合、必須か否かにかかわらず入力フィールドは空とする
  return "undefined";
}

/**
 * type=boolean のスキーマオブジェクトからデフォルト値の定義テキストを生成する
 * 
 * @param schemaObj スキーマオブジェクト
 * @returns zod定義のテキスト
 */
function booleanToDefaultValue(schemaObj: SchemaObject) {

  // 型のチェック
  if (schemaObj.type !== "boolean" || schemaObj.enum != null) {
    throw new Error(`boolean用のデフォルト値定義作成処理で不正なパラメータが渡されました。 schema=${JSON.stringify(schemaObj)}`);
  }

  // デフォルト値が設定されていればその値を返す
  if (schemaObj.default != null) {
    return JSON.stringify(schemaObj.default);
  }

  // デフォルト値がない場合、必須か否かにかかわらず入力フィールドは空とする
  return "undefined";
}

/**
 * enum のスキーマオブジェクトからデフォルト値の定義テキストを生成する
 * 
 * @param schemaObj スキーマオブジェクト
 * @param isRequired 必須の場合はtrue
 * @returns デフォルト値の定義テキスト
 */
function enumToDefaultValues(schemaObj: SchemaObject, isRequired: boolean) {

  // 型のチェック
  if (schemaObj.enum == null) {
    throw new Error(`enum用のデフォルト値定義作成処理で不正なパラメータが渡されました。 schema=${JSON.stringify(schemaObj)}`);
  }

  // デフォルト値の指定があればその値を返す
  if (schemaObj.default != null) {
    return JSON.stringify(schemaObj.default);
  }

  // 必須の場合は enum の先頭要素を採用
  if (isRequired) {
    return JSON.stringify(schemaObj.enum![0]);
  }

  // デフォルト値の指定がなく、必須ではない場合は undefined を返す
  return "undefined";
}
