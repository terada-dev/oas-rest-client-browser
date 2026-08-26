/**
 * ループ構造を持たない OAS スキーマを typescript の型定義文字列に変換する。
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
 *         - type: object
 *             properties: 
 *               prop4:
 *                 type: boolean
 * 
 * ↓
 * 
 * {
 *   prop1: string,
 *   prop2: {
 *     prop3: number,
 *     prop4: boolean,
 *   }
 * };
 *   
 */

import type { NormalizedOpenAPIV3 } from "#/types/NormalizedOpenAPI.d.ts";
import { resolveRef, makeIndent, mergeAllOfSchema, applyAdditionalProperties } from "#/utils/index.ts";

type Document = NormalizedOpenAPIV3.Document;
type SchemaObject = NormalizedOpenAPIV3.SchemaObject;

/**
 * ループ構造を持たないOASスキーマオブジェクトから型定義ソースコードテキストを生成する
 * 
 * @param doc OASドキュメント
 * @param schemaObj スキーマオブジェクト
 * @param isRequired 必須の場合はtrue
 * @param indentLevel インデントの深さ
 * @returns 型定義のソースコードテキスト
 */
export function normalSchemaToType(doc: Document, schemaObj: SchemaObject | undefined, isRequired: boolean = true, indentLevel = 1) {

  if (schemaObj == null) {
    return "void";
  }

  // allOf の参照先がオブジェクトのみの場合は直接スキーマをマージする
  if (schemaObj.allOf != null) {
    const tmpSchema = mergeAllOfSchema(doc, schemaObj.allOf);
    if (tmpSchema != null) {
      schemaObj = tmpSchema;
    }
  }

  if (schemaObj.allOf != null) {
    return allOfToType(doc, schemaObj, isRequired, indentLevel);
  }

  if (schemaObj.anyOf != null ||  schemaObj.oneOf != null) {
    return oneOfToType(doc, schemaObj, isRequired, indentLevel);
  }

  if (schemaObj.enum != null) {
    return enumToType(schemaObj, isRequired);
  }

  switch (schemaObj.type) {
    case "object":
      return objectToType(doc, schemaObj, isRequired, indentLevel);
    case "array":
      return arrayToType(doc, schemaObj, isRequired, indentLevel);
    case "string":
      return stringToType(schemaObj, isRequired);
    case "number":
    case "integer":
      return numberToType(schemaObj, isRequired);
    case "boolean":
      return booleanToType(schemaObj, isRequired);
    default:
      throw new Error(`不正なスキーマ種別: ${JSON.stringify(schemaObj)}`);
  }
}

/**
 * allOf で指定されたスキーマオブジェクトから typescript 型定義テキストを生成する
 * 
 * @param doc OASドキュメント
 * @param schemaObj スキーマオブジェクト
 * @param isRequired 必須の場合はtrue
 * @param indentLevel インデントの深さ
 * @returns 型定義のテキスト
 */
function allOfToType(doc: Document, schemaObj: SchemaObject, isRequired: boolean, indentLevel = 1) {

  // 型のチェック
  if (!("allOf" in schemaObj)) {
    throw new Error(`allOf用型定義作成処理で不正なパラメータが渡されました。 schema=${JSON.stringify(schemaObj)}`);
  }

  // 各スキーマを 「&」 で結合した型定義を生成
  const childSchemas = (schemaObj.allOf ?? []).map(item => resolveRef(doc, item.$ref));
  const typeTextList: string[] = [];
  for (const childSchema of childSchemas) {
    typeTextList.push(normalSchemaToType(doc, childSchema, true, indentLevel));
  }
  let typeText = typeTextList.join(" & ");
  typeText = `(${typeText})`;

  // required、nullableを反映
  if (!isRequired) {
    typeText += " | undefined";
  }
  if (schemaObj.nullable) {
    typeText += " | null";
  }

  return typeText;
}
  
/**
 * oneOf / anyOf で指定されたスキーマオブジェクトから typescript 型定義テキストを生成する
 * 
 * @param doc OASドキュメント
 * @param schemaObj スキーマオブジェクト
 * @param isRequired 必須の場合はtrue
 * @param indentLevel インデントの深さ
 * @returns 型定義のテキスト
 */
function oneOfToType(doc: Document, schemaObj: SchemaObject, isRequired: boolean, indentLevel = 1) {

  // 型のチェック
  if (!("oneOf" in schemaObj) && !("anyOf" in schemaObj)) {
    throw new Error(`oneOf/anyOf用型定義作成処理で不正なパラメータが渡されました。 schema=${JSON.stringify(schemaObj)}`);
  }

  // 各スキーマを 「|」 で結合した型定義を生成
  const typeTextList: string[] = [];
  for (const childRef of (schemaObj.oneOf ?? schemaObj.anyOf ?? [])) {
    const childSchema = resolveRef(doc, childRef.$ref);
    typeTextList.push(normalSchemaToType(doc, childSchema, true, indentLevel));
  }
  let typeText = typeTextList.join(" | ");
  typeText = `(${typeText})`;

  // required、nullableを反映
  if (!isRequired) {
    typeText += " | undefined";
  }
  if (schemaObj.nullable) {
    typeText += " | null";
  }

  return typeText;
}


/**
 * type=object のスキーマオブジェクトから typescript 型定義テキストを生成する
 * 
 * @param doc OASドキュメント
 * @param schemaObj スキーマオブジェクト
 * @param isRequired 必須の場合はtrue
 * @param indentLevel インデントの深さ
 * @returns 型定義のテキスト
 */
function objectToType(doc: Document, schemaObj: SchemaObject, isRequired: boolean, indentLevel = 1) {

  // 型のチェック
  if (schemaObj.type !== "object") {
    throw new Error(`string用型定義作成処理で不正なパラメータが渡されました。 schema=${JSON.stringify(schemaObj)}`);
  }

  // additionalProperties の指定がある場合は schemaObj に反映させる
  if (schemaObj.additionalProperties != null) {
    schemaObj = applyAdditionalProperties(schemaObj);
  }
  
  // properties の指定がない場合は any 型とする
  if (schemaObj.properties == null || Object.keys(schemaObj.properties).length === 0) {
    return "any";
  }

  // 必須プロパティを取得
  const requiredProps = schemaObj?.required ?? [];

  // インデントスペースを設定
  const blockIndent = makeIndent(indentLevel);
  const outerIndent = makeIndent(indentLevel - 1);

  // 各プロパティの型定義を生成
  const typeTextList = ["{"];
  for (const [name, refObj] of Object.entries(schemaObj?.properties ?? {})) {
    const propSchema = resolveRef(doc, refObj.$ref);
    const optionalMark = requiredProps.includes(name) ? "" : "?";
    typeTextList.push(`${blockIndent}${name}${optionalMark}: ${normalSchemaToType(doc, propSchema, true, indentLevel + 1)},`);
  }
  typeTextList.push(`${outerIndent}}`);
  let typeText = typeTextList.join("\n");

  // required、nullableを反映
  if (!isRequired) {
    typeText += " | undefined";
  }
  if (schemaObj.nullable) {
    typeText += " | null";
  }

  return typeText;
}

/**
 * type=array のスキーマオブジェクトから typescript 型定義テキストを生成する
 * 
 * @param doc OASドキュメント
 * @param schemaObj スキーマオブジェクト
 * @param isRequired 必須の場合はtrue
 * @param indentLevel インデントの深さ
 * @returns 型定義のテキスト
 */
function arrayToType(doc: Document, schemaObj: SchemaObject, isRequired: boolean, indentLevel = 1) {

  // 型のチェック
  if (schemaObj.type !== "array") {
    throw new Error(`配列用型定義作成処理で不正なパラメータが渡されました。 schema=${JSON.stringify(schemaObj)}`);
  }

  const itemSchema = resolveRef(doc, schemaObj.items.$ref);
  let typeText: string = `Array<${normalSchemaToType(doc, itemSchema, true, indentLevel)}>`;

  // required、nullableを反映
  if (!isRequired) {
    typeText += ` | undefined`;
  }
  if (schemaObj.nullable) {
    typeText += " | null";
  }

  return typeText;
}

/**
 * type=string のスキーマオブジェクトから typescript 型定義テキストを生成する
 * 
 * @param schemaObj スキーマオブジェクト
 * @param isRequired 必須の場合はtrue
 * @returns 型定義のテキスト
 */
function stringToType(schemaObj: SchemaObject, isRequired: boolean) {

  // 型のチェック
  if (schemaObj.type !== "string" || schemaObj.enum != null) {
    throw new Error(`string用型定義作成処理で不正なパラメータが渡されました。 schema=${JSON.stringify(schemaObj)}`);
  }
  
  // format=binaryの場合は File とする
  let typeText = (schemaObj.format === "binary") ? "File" : "string";

  // required、nullableを反映
  if (!isRequired) {
    typeText += " | undefined";
  }
  if (schemaObj.nullable) {
    typeText += " | null";
  }

  return typeText;
}

/**
 * type=number or type=integer のスキーマオブジェクトから typescript 型定義テキストを生成する
 * 
 * @param schemaObj スキーマオブジェクト
 * @param isRequired 必須の場合はtrue
 * @returns 型定義のテキスト
 */
function numberToType(schemaObj: SchemaObject, isRequired: boolean) {

  // 型のチェック
  if (["number", "integer"].every(type => schemaObj.type != type) || schemaObj.enum != null) {
    throw new Error(`数値用型定義作成処理で不正なパラメータが渡されました。 schema=${JSON.stringify(schemaObj)}`);
  }
  
  // 型定義を作成
  let typeText = "number";

  // required、nullableを反映
  if (!isRequired) {
    typeText += " | undefined";
  }
  if (schemaObj.nullable) {
    typeText += " | null";
  }

  return typeText;
}

/**
 * type=boolean のスキーマオブジェクトから typescript 型定義テキストを生成する
 * 
 * @param schemaObj スキーマオブジェクト
 * @param isRequired 必須の場合はtrue
 * @returns 型定義のテキスト
 */
function booleanToType(schemaObj: SchemaObject, isRequired: boolean) {

  // 型のチェック
  if (schemaObj.type !== "boolean" || schemaObj.enum != null) {
    throw new Error(`boolean用型定義作成処理で不正なパラメータが渡されました。 schema=${JSON.stringify(schemaObj)}`);
  }

  let typeText = "boolean";

  // required、nullableを反映
  if (!isRequired) {
    typeText += " | undefined";
  }
  if (schemaObj.nullable) {
    typeText += " | null";
  }

  return typeText;
}

/**
 * enum のスキーマオブジェクトから typescript 型定義テキストを生成する
 * 
 * @param schemaObj スキーマオブジェクト
 * @param isRequired 必須の場合はtrue
 * @returns 型定義のテキスト
 */
function enumToType(schemaObj: SchemaObject, isRequired: boolean) {

  // 型のチェック
  if (schemaObj.enum == null) {
    throw new Error(`enum用型定義作成処理で不正なパラメータが渡されました。 schema=${JSON.stringify(schemaObj)}`);
  }

  // enumの型定義を設定
  let typeText = schemaObj.enum.map(item => JSON.stringify(item)).join(" | ");

  // required、nullableを反映
  if (!isRequired) {
    typeText += " | undefined";
  }
  if (schemaObj.nullable) {
    typeText += " | null";
  }

  return typeText;
}
