/**
 * ループ構造を持たない OAS スキーマを zod 定義文字列に変換する。
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
 * z.object({
 *   prop1: z.string(),
 *   prop2: z.object({
 *     prop3: z.number(),
 *     prop4: z.boolean(),
 *   }),
 * });
 *   
 */

import type { NormalizedOpenAPIV3 } from "#/types/NormalizedOpenAPI.d.ts";
import { resolveRef, makeIndent, mergeAllOfSchema, applyAdditionalProperties } from "#/utils/index.ts";

type Document = NormalizedOpenAPIV3.Document;
type SchemaObject = NormalizedOpenAPIV3.SchemaObject;

/**
 * ループ構造を持たないOASスキーマオブジェクトから zod 定義ソースコードテキストを生成する
 * 
 * @param doc OASドキュメント
 * @param schemaObj スキーマオブジェクト
 * @param isRequired 必須の場合はtrue
 * @param indentLevel インデントの深さ
 * @returns zod定義のソースコードテキスト
 */
export function normalSchemaToZod(doc: Document, schemaObj: SchemaObject | undefined, isRequired: boolean = true, indentLevel = 1) {

  if (schemaObj == null) {
    return "z.void()";
  }

  // allOf の参照先がオブジェクトのみの場合は直接スキーマをマージする
  if (schemaObj.allOf != null) {
    const tmpSchema = mergeAllOfSchema(doc, schemaObj.allOf);
    if (tmpSchema != null) {
      schemaObj = tmpSchema;
    }
  }

  if (schemaObj.allOf != null) {
    return allOfToZod(doc, schemaObj, isRequired, indentLevel);
  }

  if (schemaObj.anyOf != null ||  schemaObj.oneOf != null) {
    return oneOfToZod(doc, schemaObj, isRequired, indentLevel);
  }

  if (schemaObj.enum != null) {
    return enumToZod(schemaObj, isRequired);
  }

  switch (schemaObj.type) {
    case "object":
      return objectToZod(doc, schemaObj, isRequired, indentLevel);
    case "array":
      return arrayToZod(doc, schemaObj, isRequired, indentLevel);
    case "string":
      return stringToZod(schemaObj, isRequired);
    case "number":
    case "integer":
      return numberToZod(schemaObj, isRequired);
    case "boolean":
      return booleanToZod(schemaObj, isRequired);
    default:
      throw new Error(`不正なスキーマ種別: ${JSON.stringify(schemaObj)}`);
  }
}

/**
 * allOf で指定されたスキーマオブジェクトから zod 定義テキストを生成する
 * 
 * @param doc OASドキュメント
 * @param schemaObj スキーマオブジェクト
 * @param isRequired 必須の場合はtrue
 * @param indentLevel インデントの深さ
 * @returns zod定義のテキスト
 */
export function allOfToZod(doc: Document, schemaObj: SchemaObject, isRequired: boolean, indentLevel = 1) {

  // 型のチェック
  if (!("allOf" in schemaObj)) {
    throw new Error(`allOf用zod定義作成処理で不正なパラメータが渡されました。 schema=${JSON.stringify(schemaObj)}`);
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

  // 各プロパティの zod 定義を生成
  const zodTextList = ["z.object({"];
  for (const childSchema of childSchemas) {
    zodTextList.push(`${blockIndent}...${normalSchemaToZod(doc, childSchema, true, indentLevel + 1)},`);
  }
  zodTextList.push(`${outerIndent}})`);
  let zodText = zodTextList.join("\n");

  // required、nullableを反映
  if (!isRequired) {
    zodText += ".optional()";
  }
  if (schemaObj.nullable) {
    zodText += ".nullable()";
  }

  return zodText;
}

/**
 * oneOf / anyOf で指定されたスキーマオブジェクトから zod 定義テキストを生成する
 * 
 * @param doc OASドキュメント
 * @param schemaObj スキーマオブジェクト
 * @param isRequired 必須の場合はtrue
 * @param indentLevel インデントの深さ
 * @returns zod定義のテキスト
 */
export function oneOfToZod(doc: Document, schemaObj: SchemaObject, isRequired: boolean, indentLevel = 1) {

  // 型のチェック
  if (!("oneOf" in schemaObj) && !("anyOf" in schemaObj)) {
    throw new Error(`oneOf/anyOf用zod定義作成処理で不正なパラメータが渡されました。 schema=${JSON.stringify(schemaObj)}`);
  }

  // インデントスペースを設定
  const blockIndent = makeIndent(indentLevel);
  const outerIndent = makeIndent(indentLevel - 1);

  // 各スキーマを z.union() で結合した zod 定義を生成
  const zodTextList = ["z.union(["];
  for (const childRef of (schemaObj.oneOf ?? schemaObj.anyOf ?? [])) {
    const childSchema = resolveRef(doc, childRef.$ref);
    zodTextList.push(`${blockIndent}${normalSchemaToZod(doc, childSchema, true, indentLevel + 1)},`);
  }
  zodTextList.push(`${outerIndent}])`);
  let zodText = zodTextList.join("\n");

  // required、nullableを反映
  if (!isRequired) {
    zodText += ".optional()";
  }
  if (schemaObj.nullable) {
    zodText += ".nullable()";
  }

  return zodText;
}


/**
 * type=object のスキーマオブジェクトから zod 定義テキストを生成する
 * 
 * @param doc OASドキュメント
 * @param schemaObj スキーマオブジェクト
 * @param isRequired 必須の場合はtrue
 * @param indentLevel インデントの深さ
 * @returns zod定義のテキスト
 */
function objectToZod(doc: Document, schemaObj: SchemaObject, isRequired: boolean, indentLevel = 1) {

  // 型のチェック
  if (schemaObj.type !== "object") {
    throw new Error(`string用zod定義作成処理で不正なパラメータが渡されました。 schema=${JSON.stringify(schemaObj)}`);
  }

  // additionalProperties の指定がある場合は schemaObj に反映させる
  if (schemaObj.additionalProperties != null) {
    schemaObj = applyAdditionalProperties(schemaObj);
  }
  
  // properties の指定がない場合は any 型とする
  if (schemaObj.properties == null || Object.keys(schemaObj.properties).length === 0) {
    return "z.any()";
  }

  // 必須プロパティを取得
  const requiredProps = schemaObj?.required ?? [];

  // インデントスペースを設定
  const blockIndent = makeIndent(indentLevel);
  const outerIndent = makeIndent(indentLevel - 1);

  // 各プロパティの zod 定義を生成
  const zodTextList = ["z.object({"];
  for (const [name, refObj] of Object.entries(schemaObj?.properties ?? {})) {
    const propSchema = resolveRef(doc, refObj.$ref);
    zodTextList.push(`${blockIndent}${name}: ${normalSchemaToZod(doc, propSchema, requiredProps.includes(name), indentLevel + 1)},`);
  }
  zodTextList.push(`${outerIndent}})`);
  let zodText = zodTextList.join("\n");

  // required、nullableを反映
  if (!isRequired) {
    zodText += ".optional()";
  }
  if (schemaObj.nullable) {
    zodText += ".nullable()";
  }

  return zodText;
}

/**
 * type=array のスキーマオブジェクトから zod 定義テキストを生成する
 * 
 * @param doc OASドキュメント
 * @param schemaObj スキーマオブジェクト
 * @param isRequired 必須の場合はtrue
 * @param indentLevel インデントの深さ
 * @returns zod定義のテキスト
 */
function arrayToZod(doc: Document, schemaObj: SchemaObject, isRequired: boolean, indentLevel = 1) {

  // 型のチェック
  if (schemaObj.type !== "array") {
    throw new Error(`配列用zod定義作成処理で不正なパラメータが渡されました。 schema=${JSON.stringify(schemaObj)}`);
  }

  // Array<File> の場合は formField(z.array(z.file())) 形式で表現
  let zodText: string = "";
  const itemSchema = resolveRef(doc, schemaObj.items.$ref);
  if (itemSchema.type === "string" && itemSchema.format === "binary") {
    zodText = "formField(z.array(z.file()))";
    if (itemSchema.nullable) {
      zodText += ".nullable()";
    }
  }

  // Array<File> 以外の場合は z.array(formField(z.xxx())) 形式で表現
  if (zodText === "") {
    zodText = `z.array(${normalSchemaToZod(doc, itemSchema, true, indentLevel)})`;
  }

  // required、nullableを反映
  if (!isRequired) {
    zodText += `.optional()`;
  }
  if (schemaObj.nullable) {
    zodText += ".nullable()";
  }

  return zodText;
}

/**
 * type=string のスキーマオブジェクトから zod 定義テキストを生成する
 * 
 * @param schemaObj スキーマオブジェクト
 * @param isRequired 必須の場合はtrue
 * @returns zod定義のテキスト
 */
function stringToZod(schemaObj: SchemaObject, isRequired: boolean) {

  // 型のチェック
  if (schemaObj.type !== "string" || schemaObj.enum != null) {
    throw new Error(`string用zod定義作成処理で不正なパラメータが渡されました。 schema=${JSON.stringify(schemaObj)}`);
  }

  // formatに応じてチェック内容を変更(zodで定義されていない書式は string として扱う)
  const formatMap: Record<string, string> = {
    "date":      "z.iso.date()",
    "time":      "z.iso.time()",
    "date-time": "z.iso.datetime()",
    "duration":  "z.iso.duration()",
    "byte":      "z.base64()",
    "binary":    "z.file()",
    "email":     "z.email()",
    "uuid":      "z.uuid()",
    "url":       "z.url()",
    "httpUrl":   "z.httpUrl()",
    "hostname":  "z.hostname()",
    "e164":      "z.e164()",
    "emoji":     "z.emoji()",
    "base64":    "z.base64()",
    "base64url": "z.base64url()",
    "hex":       "z.hex()",
    "jwt":       "z.jwt()",
    "nanoid":    "z.nanoid()",
    "cuid":      "z.cuid()",
    "cuid2":     "z.cuid2()",
    "ulid":      "z.ulid()",
    "ipv4":      "z.ipv4()",
    "ipv6":      "z.ipv6()",
    "mac":       "z.mac()",
    "cidrv4":    "z.cidrv4()",
    "cidrv6":    "z.cidrv6()",
    "sha256":    'z.hash("sha256")',
    "sha1":      'z.hash("sha1")',
    "sha384":    'z.hash("sha384")',
    "sha512":    'z.hash("sha512")',
    "md5":       'z.hash("md5")',
  };
  const format = schemaObj.format ?? "UNKNOWN_FORMAT";
  let zodText = (format in formatMap) ? formatMap[format] : "z.string()";

  // プロパティに応じた条件を付与
  if (schemaObj.minLength != null) {
    zodText += `.min(${schemaObj.minLength})`;
  }
  if (schemaObj.maxLength != null) {
    zodText += `.max(${schemaObj.maxLength})`;
  }
  if (schemaObj.pattern != null) {
    zodText += `.regex(new RegExp("${schemaObj.pattern}"))`;
  }

  // nullishの条件を作成
  const nullishConditions = [];
  if (!isRequired) {
    nullishConditions.push(".optional()");
  }
  if (schemaObj.nullable) {
    nullishConditions.push(".nullable()");
  }

  // 空文字を許容しないが undefined または null を許容する場合は formField() で空文字を undefined / null に変換する( formField() の内側に optional() / nullable'() を追加))
  // 空文字を許容する場合は formField() による前処理の変換で undefined / null の変換を実施しないようにする( formField() の後ろに optional() / nullable() を追加)
  // ファイルの場合は常に undefined / null を考慮した前処理を実施する
  const canEmptyFormats = ["byte", "base64", "base64url", "hex", "UNKNOWN_FORMAT"];
  const canEmpty = canEmptyFormats.includes(format)
               && ((schemaObj.minLength == null) || (0 === schemaObj.minLength));
  const needInsideCondition = (format !== "binary" && !canEmpty && 0 < nullishConditions.length) 
                           || (format === "binary" && 0 < nullishConditions.length);
  if (needInsideCondition) {
    zodText = `formField(${zodText}${nullishConditions.shift()})`;
  } else {
    zodText = `formField(${zodText})`;
  }
  zodText += nullishConditions.join("");

  return zodText;
}

/**
 * type=number or type=integer のスキーマオブジェクトから zod 定義テキストを生成する
 * 
 * @param schemaObj スキーマオブジェクト
 * @param isRequired 必須の場合はtrue
 * @returns zod定義のテキスト
 */
function numberToZod(schemaObj: SchemaObject, isRequired: boolean) {

  // 型のチェック
  if (["number", "integer"].every(type => schemaObj.type != type) || schemaObj.enum != null) {
    throw new Error(`数値用zod定義作成処理で不正なパラメータが渡されました。 schema=${JSON.stringify(schemaObj)}`);
  }

  // formatに応じてチェック内容を変更
  let zodText = schemaObj.type === "number"  ? "z.number()" :
                schemaObj.format == null     ? "z.int()" :
                schemaObj.format === "int32" ? "z.int32()" :
                schemaObj.format === "int64" ? "z.int64()" :
                                               "z.int()";
  const isInt64 = (schemaObj.type === "integer" && schemaObj.format === "int64");

  // 最小値の指定を zod に反映
  if (schemaObj.minimum != null) {
    const num = `${schemaObj.minimum}${isInt64 ? "n" : ""}`;
    const fnName = schemaObj.exclusiveMinimum ? "gt" : "min";
    zodText += `.${fnName}(${num})`;
  }

  // 最大値の指定を zod に反映
  if (schemaObj.maximum != null) {
    const num = `${schemaObj.maximum}${isInt64 ? "n" : ""}`;
    const fnName = (schemaObj.exclusiveMaximum) ? "lt" : "max";
    zodText += `.${fnName}(${num})`;
  }

  // 段階的な範囲指定を zod に反映
  if (schemaObj.multipleOf != null) {
    const num = `${schemaObj.maximum}${isInt64 ? "n" : ""}`;
    zodText += `.step(${num})`;
  }

  // nullishの条件を作成
  const nullishConditions = [];
  if (!isRequired) {
    nullishConditions.push(".optional()");
  }
  if (schemaObj.nullable) {
    nullishConditions.push(".nullable()");
  }

  // undefined または null を許容する場合は入力フィールドに空文字が設定された場合は undefined / null に変換する( formField() の内側に optional() / nullable'() を追加))
  // undefined / null いずれも許容しない場合は入力フィールドに空文字が設定された場合はエラーとする( formField() の後ろに optional() / nullable() を追加)
  if (0 < nullishConditions.length) {
    zodText = `formField(${zodText}${nullishConditions.shift()})`;
  } else {
    zodText = `formField(${zodText})`;
  }
  zodText += nullishConditions.join("");

  return zodText;
}

/**
 * type=boolean のスキーマオブジェクトから zod 定義テキストを生成する
 * 
 * @param schemaObj スキーマオブジェクト
 * @param isRequired 必須の場合はtrue
 * @returns zod定義のテキスト
 */
function booleanToZod(schemaObj: SchemaObject, isRequired: boolean) {

  // 型のチェック
  if (schemaObj.type !== "boolean" || schemaObj.enum != null) {
    throw new Error(`boolean用zod定義作成処理で不正なパラメータが渡されました。 schema=${JSON.stringify(schemaObj)}`);
  }

  let zodText = "z.boolean()";

  // nullishの条件を作成
  const nullishConditions = [];
  if (!isRequired) {
    nullishConditions.push(".optional()");
  }
  if (schemaObj.nullable) {
    nullishConditions.push(".nullable()");
  }

  // undefined または null を許容する場合は入力フィールドに空文字が設定された場合は undefined / null に変換する( formField() の内側に optional() / nullable'() を追加))
  // undefined / null いずれも許容しない場合は入力フィールドに空文字が設定された場合はエラーとする( formField() の後ろに optional() / nullable() を追加)
  if (0 < nullishConditions.length) {
    zodText = `formField(${zodText}${nullishConditions.shift()})`;
  } else {
    zodText = `formField(${zodText})`;
  }
  zodText += nullishConditions.join("");

  return zodText;
}

/**
 * enum のスキーマオブジェクトから zod 定義テキストを生成する
 * 
 * @param schemaObj スキーマオブジェクト
 * @param isRequired 必須の場合はtrue
 * @returns zod定義のテキスト
 */
function enumToZod(schemaObj: SchemaObject, isRequired: boolean) {

  // 型のチェック
  if (schemaObj.enum == null) {
    throw new Error(`enum用zod定義作成処理で不正なパラメータが渡されました。 schema=${JSON.stringify(schemaObj)}`);
  }

  // enumの型定義を設定
  const enumValues = JSON.stringify(schemaObj.enum);
  let zodText = `z.literal(${enumValues} as const)`;

    // nullishの条件を作成
  const nullishConditions = [];
  if (!isRequired) {
    nullishConditions.push(".optional()");
  }
  if (schemaObj.nullable) {
    nullishConditions.push(".nullable()");
  }

  // undefined または null を許容する場合は入力フィールドに空文字が設定された場合は undefined / null に変換する( formField() の内側に optional() / nullable'() を追加))
  // undefined / null いずれも許容しない場合は入力フィールドに空文字が設定された場合はエラーとする( formField() の後ろに optional() / nullable() を追加)
  if (0 < nullishConditions.length) {
    zodText = `formField(${zodText}${nullishConditions.shift()})`;
  } else {
    zodText = `formField(${zodText})`;
  }
  zodText += nullishConditions.join("");

  return zodText;
}
