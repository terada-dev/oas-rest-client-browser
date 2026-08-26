/**
 * APIリクエストのzodスキーマに適用することで、Webブラウザの入力フォームの型を生成する前処理関数を提供する。
 * - zod.input<RequestSchemaType>: API呼び出しに使う入力フォームの型
 * - zod.output<RequestSchemaType>: API呼び出しに使うリクエストデータの型
 * 
 * 例:
 * const schema = z.object({
 *   str: formField(z.string()),
 *   bool: formField(z.boolean()),
 *   file: formField(z.file()),
 *   files: formField(z.array(z.file())),
 *   literal: formField(z.literal([1, 2, 3] as const)),
 * });
 * 
 * type FormType = z.input<typeof schema>;
 * FormType = {
 *     str: string | undefined;                  // 入力フォームの初期値に undefined を指定可能
 *     bool: string | boolean | undefined;       // 文字列を受け取り、truthy / falsy な文字列を boolean に変換する
 *     file: File | FileList | undefined;        // 「input type="file"」で渡される FileList を受け取り、 File に変換する
 *     files: File[] | FileList | undefined;     // 「input type="file"」で渡される FileList を受け取り、 File[] に変換する
 *     literal: string | 1 | 2 | 3 | undefined;  // 文字列を受け取り、リテラル値に変換する
 * }
 * type RequestType = z.output<typeof schema>;
 * RequestType = {                               // パース後の型はリクエストデータに準拠した型となる
 *     str: string;
 *     bool: boolean;
 *     file: z.core.File;
 *     files: z.core.File[];
 *     literal: 1 | 2 | 3;
 * }
 */

import { z } from "zod";
import type { ZodType, ZodString, ZodISODate, ZodISODateTime, ZodNumber, ZodBoolean, ZodFile, ZodLiteral, ZodArray, ZodOptional, ZodNullable } from "zod";

interface FormField {
  (zodString: z.ZodString): z.ZodPipe<z.ZodTransform<string, string | undefined>, z.ZodString>;
  (zodOptionalString: z.ZodOptional<z.ZodString>): z.ZodPipe<z.ZodTransform<string | undefined, string | undefined>, z.ZodOptional<z.ZodString>>;
  (zodNullableString: z.ZodNullable<z.ZodString>): z.ZodPipe<z.ZodTransform<string | null | undefined, string | null | undefined>, z.ZodNullable<z.ZodString>>;
  (zodIsoDate: z.ZodISODate): z.ZodPipe<z.ZodTransform<string | undefined, string | undefined>, z.ZodISODate>;
  (zodOptionalIsoDate: z.ZodOptional<z.ZodISODate>): z.ZodPipe<z.ZodTransform<string | undefined, string | undefined>, z.ZodOptional<z.ZodISODate>>;
  (zodNullableIsoDate: z.ZodNullable<z.ZodISODate>): z.ZodPipe<z.ZodTransform<string | null, string | null | undefined>, z.ZodNullable<z.ZodISODate>>;
  (zodISODateTime: z.ZodISODateTime): z.ZodPipe<z.ZodTransform<string | undefined, string | undefined>, z.ZodISODateTime>;
  (zodOptionalIsoDateTime: z.ZodOptional<z.ZodISODateTime>): z.ZodPipe<z.ZodTransform<string | undefined, string | undefined>, z.ZodOptional<z.ZodISODateTime>>;
  (zodNullableIsoDateTime: z.ZodNullable<z.ZodISODateTime>): z.ZodPipe<z.ZodTransform<string | null, string | null | undefined>, z.ZodNullable<z.ZodISODateTime>>;
  <T extends z.ZodNumber>(zodNumber: T): z.ZodPipe<z.ZodTransform<string | number | undefined, string | number | undefined>, T>;
  <T extends z.ZodNumber>(zodNumber: ZodOptional<T>): z.ZodPipe<z.ZodTransform<string | number | undefined, string | number | undefined>, z.ZodOptional<T>>;
  <T extends z.ZodNumber>(zodNumber: ZodNullable<T>): z.ZodPipe<z.ZodTransform<string | number | null, string | number | null | undefined>, z.ZodNullable<T>>;
  <T extends z.ZodBigInt>(zodBigInt: T): z.ZodPipe<z.ZodTransform<string | number | undefined, string | number | undefined>, T>;
  <T extends z.ZodBigInt>(zodBigInt: ZodOptional<T>): z.ZodPipe<z.ZodTransform<string | number | undefined, string | number | undefined>, z.ZodOptional<T>>;
  <T extends z.ZodBigInt>(zodBigInt: ZodNullable<T>): z.ZodPipe<z.ZodTransform<string | number | null, string | number | null | undefined>, z.ZodNullable<T>>;
  (zodBoolean: z.ZodBoolean): z.ZodPipe<z.ZodTransform<string | boolean | undefined, string | boolean | undefined>, z.ZodBoolean>;
  (zodBoolean: z.ZodOptional<z.ZodBoolean>): z.ZodPipe<z.ZodTransform<string | boolean | undefined, string | boolean | undefined>, z.ZodOptional<z.ZodBoolean>>;
  (zodBoolean: z.ZodNullable<z.ZodBoolean>): z.ZodPipe<z.ZodTransform<string | boolean | null, string | boolean | undefined>, z.ZodNullable<z.ZodBoolean>>;
  (zodFile: z.ZodFile): z.ZodPipe<z.ZodTransform<File | FileList | null | undefined, File | FileList | undefined>, z.ZodFile>;
  (zodFile: z.ZodOptional<z.ZodFile>): z.ZodPipe<z.ZodTransform<File | FileList | null | undefined, File | FileList | undefined>, z.ZodOptional<z.ZodFile>>;
  (zodFile: z.ZodNullable<z.ZodFile>): z.ZodPipe<z.ZodTransform<File | FileList | null | undefined, File | FileList | undefined>, z.ZodNullable<z.ZodFile>>;
  (zodFile: z.ZodArray<z.ZodFile>): z.ZodPipe<z.ZodTransform<File[], FileList | File[] | undefined>, z.ZodArray<z.ZodFile>>;
  (zodFile: z.ZodOptional<z.ZodArray<z.ZodFile>>): z.ZodPipe<z.ZodTransform<File[] | undefined, FileList | File[] | undefined>, z.ZodOptional<z.ZodArray<z.ZodFile>>>;
  (zodFile: z.ZodNullable<z.ZodArray<z.ZodFile>>): z.ZodPipe<z.ZodTransform<File[] | null | undefined, FileList | File[] | null | undefined>, z.ZodNullable<z.ZodArray<z.ZodFile>>>;
  <T extends z.ZodLiteral<z.core.util.Literal>>(zodLiteral: T): z.ZodPipe<z.ZodTransform<string | z.core.output<T> | undefined, string | z.core.output<T> | undefined>, T>;
  <T extends z.ZodLiteral<z.core.util.Literal>>(zodLiteral: ZodOptional<T>): z.ZodPipe<z.ZodTransform<string | z.core.output<T> | undefined, string | z.core.output<T> | undefined>, z.ZodOptional<T>>;
  <T extends z.ZodLiteral<z.core.util.Literal>>(zodLiteral: ZodNullable<T>): z.ZodPipe<z.ZodTransform<string | z.core.output<T> | null | undefined, string | z.core.output<T> | undefined>, z.ZodNullable<T>>;
}

function formFieldFunc(zodType: ZodType) {
  const fieldZodType = getFieldZodType(zodType);
  switch (fieldZodType) {
    case "string":
      return stringPreprocessor(zodType as ZodString);
    case "optionalString":
      return optionalStringPreprocessor(zodType as ZodOptional<ZodString>);
    case "nullableString":
      return nullableStringPreprocessor(zodType as ZodNullable<ZodString>);
    case "isoDate":
      return isoDatePreprocessor(zodType as ZodISODate);
    case "optionalIsoDate":
      return optionalIsoDatePreprocessor(zodType as ZodOptional<ZodISODate>);
    case "nullableIsoDate":
      return nullableIsoDatePreprocessor(zodType as ZodNullable<ZodISODate>);
    case "isoDateTime":
      return isoDateTimePreprocessor(zodType as ZodISODateTime);
    case "optionalIsoDateTime":
      return optionalIsoDatetimePreprocessor(zodType as ZodOptional<ZodISODateTime>);
    case "nullableIsoDateTime":
      return nullableIsoDatetimePreprocessor(zodType as ZodNullable<ZodISODateTime>);
    case "number":
      return numberPreprocessor(zodType as ZodNumber);
    case "optionalNumber":
      return optionalNumberPreprocessor(zodType as ZodOptional<ZodNumber>);
    case "nullableNumber":
      return nullableNumberPreprocessor(zodType as ZodNullable<ZodNumber>);
    case "boolean":
      return booleanPreprocessor(zodType as ZodBoolean);
    case "optionalBoolean":
      return optionalBooleanPreprocessor(zodType as ZodOptional<ZodBoolean>);
    case "nullableBoolean":
      return nullableBooleanPreprocessor(zodType as ZodNullable<ZodBoolean>);
    case "file":
      return filePreprocessor(zodType as ZodFile);
    case "optionalFile":
      return optionalFilePreprocessor(zodType as ZodOptional<ZodFile>);
    case "nullableFile":
      return nullableFilePreprocessor(zodType as ZodNullable<ZodFile>);
    case "arrayFile":
      return arrayFilePreprocessor(zodType as ZodArray<ZodFile>);
    case "optionalArrayFile":
      return optionalArrayFilePreprocessor(zodType as ZodOptional<ZodArray<ZodFile>>);
    case "nullableArrayFile":
      return nullableArrayFilePreprocessor(zodType as ZodNullable<ZodArray<ZodFile>>);
    case "literal":
      return literalPreprocessor(zodType as ZodLiteral);
    case "optionalLiteral":
      return optionalLiteralPreprocessor(zodType as ZodOptional<ZodLiteral>);
    case "nullableLiteral":
      return nullableLiteralPreprocessor(zodType as ZodNullable<ZodLiteral>);
    default:
      throw new Error("formField()関数に不正なスキーマが設定されました。");
  }
}

type FieldZodType = "string" | "optionalString" | "nullableString" 
                  | "isoDate" | "optionalIsoDate" | "nullableIsoDate" 
                  | "isoDateTime" | "optionalIsoDateTime" | "nullableIsoDateTime" 
                  | "number" | "optionalNumber" | "nullableNumber" 
                  | "boolean" | "optionalBoolean" | "nullableBoolean" 
                  | "file" | "optionalFile" | "nullableFile" 
                  | "arrayFile" | "optionalArrayFile" | "nullableArrayFile" 
                  | "literal" | "optionalLiteral" | "nullableLiteral";

// zodインスタンスから変換対象の型を特定する
function getFieldZodType(zodSchema: ZodType): FieldZodType {

  // zodスキーマから内部のスキーマを取得する処理
  const getInnerSchema = (schema: ZodType) => {
    const def = schema.def;
    return ("innerType" in def) ? def.innerType as ZodType :
           ("element" in def)   ? def.element as ZodType :
                                  null;
  };

  // zodスキーマから型テキストを取得する処理
  const getTypeText = (schema: ZodType) => {
    const def = schema.def;
    if (def.type === "string") { 
      if (!("format" in def)) {
        return def.type;
      }
      return def.format === "date"     ? "isoDate" :
             def.format === "datetime" ? "isoDateTime" :
                                         "string";
    }
    return def.type;
  };

  // zodスキーマの型情報を取得
  const schemaTypes = [getTypeText(zodSchema)];
  let innerSchema = getInnerSchema(zodSchema);
  while (innerSchema != null) {
    schemaTypes.push(getTypeText(innerSchema));
    innerSchema = getInnerSchema(innerSchema);
  }

  // 型情報を camelCase のテキストに変換
  const schemaTypeText = schemaTypes
    .map(item => item === "bigint" ? "number" : item)
    .map((item, index) => index === 0 ? item : `${item.charAt(0).toUpperCase()}${item.slice(1)}`)
    .join("");

  // 想定外の型情報の場合はエラー
  const fieldZodTypes: FieldZodType[] = ["string", "optionalString", "nullableString", 
                        "isoDate", "optionalIsoDate", "nullableIsoDate",
                        "isoDateTime", "optionalIsoDateTime", "nullableIsoDateTime", 
                        "number", "optionalNumber", "nullableNumber", 
                        "boolean", "optionalBoolean", "nullableBoolean", 
                        "file", "optionalFile", "nullableFile", 
                        "arrayFile", "optionalArrayFile", "nullableArrayFile", 
                        "literal", "optionalLiteral", "nullableLiteral"];
  const index = (fieldZodTypes as string[]).indexOf(schemaTypeText);
  if (index === -1) {
    throw new Error(`formField()関数に不正なスキーマが設定されました。${schemaTypes.join("/")}`);
  }
  return fieldZodTypes[index];
}

/**
 * OpenAPIの定義と入力フォーム表現の変換処理を定義
 */
export const formField = formFieldFunc as FormField;

/**
 * ZodStringに対する変換処理
 * - 入力フィールドの初期値として undefined 設定を許容する
 * - undefined は空文字に変換する
 * 
 * @param zodString zodスキーマ
 * @returns 変換後のzodスキーマ
 */
function stringPreprocessor(zodString: ZodString) {
  return z.preprocess((val: string | undefined) => val ?? '', zodString);
}

/**
 * ZodOptional<ZodString>に対する変換処理
 * - 入力フィールドの初期値として undefined 設定を許容する
 * - 「0 < minLength」かつ「required = false」指定がある場合に設定され、空文字の場合は undefined に変換する
 * 
 * @param zodString zodスキーマ
 * @returns 変換後のzodスキーマ
 */
function optionalStringPreprocessor(zodOptionalString: ZodOptional<ZodString>) {
  return z.preprocess((val: string | undefined) => val === "" ? undefined : val, zodOptionalString);
}

/**
 * ZodNullable<ZodString>に対する変換処理
 * - 入力フィールドの初期値として undefined 設定を許容する
 * - 「0 < minLength」かつ「nullable = true」の指定がある場合に設定され、空文字の場合は null に変換する
 * 
 * @param zodString zodスキーマ
 * @returns 変換後のzodスキーマ
 */
function nullableStringPreprocessor(zodNullableString: ZodNullable<ZodString>) {
  return z.preprocess((val: string | undefined | null) => val === "" ? null : val, zodNullableString);
}

/**
 * ZodISODateに対する変換処理
 * - 入力フィールドの初期値として undefined 設定を許容する
 * - yyyy/MM/dd 形式を許容する
 * 
 * @param zodIsoDate zodスキーマ
 * @returns 変換後のzodスキーマ
 */
function isoDatePreprocessor(zodIsoDate: ZodISODate) {
  return z.preprocess((val: string | undefined) => {
    if (val == null || val === "") {
      return val;
    }
    if (val.match(/^\d{4}\/\d{2}\/\d{2}$/)) {
      return val.replace(/\//g, "-");    // yyyy/MM/dd を yyyy-MM-dd に変換
    }
    return val;        // zod側でNGにするために元の値を返す
  }, zodIsoDate);
}

/**
 * ZodOptional<ZodISODate>に対する変換処理
 * - 入力フィールドの初期値として undefined 設定を許容する
 * - yyyy/MM/dd 形式を許容する
 * - 「required = false」の指定がある場合に設定され、空文字の場合は undefined に変換する
 * 
 * @param zodString zodスキーマ
 * @returns 変換後のzodスキーマ
 */
function optionalIsoDatePreprocessor(zodOptionalIsoDate: ZodOptional<ZodISODate>) {
  return z.preprocess((val: string | undefined) => {
    if (val == null || val === "") {
      return undefined;
    }
    if (val.match(/^\d{4}\/\d{2}\/\d{2}$/)) {
      return val.replace(/\//g, "-");    // yyyy/MM/dd を yyyy-MM-dd に変換
    }
    return val;        // zod側でNGにするために元の値を返す
  }, zodOptionalIsoDate);
}

/**
 * ZodNullable<ZodISODate>に対する変換処理
 * - 入力フィールドの初期値として undefined 設定を許容する
 * - yyyy/MM/dd 形式を許容する
 * - 「nullable = true」の指定がある場合に設定され、空文字の場合は null に変換する
 * 
 * @param zodString zodスキーマ
 * @returns 変換後のzodスキーマ
 */
function nullableIsoDatePreprocessor(zodNullableIsoDate: ZodNullable<ZodISODate>) {
  return z.preprocess((val: string | undefined | null) => {
    if (val == null || val === "") {
      return null;
    }
    if (val.match(/^\d{4}\/\d{2}\/\d{2}$/)) {
      return val.replace(/\//g, "-");    // yyyy/MM/dd を yyyy-MM-dd に変換
    }
    return val;        // zod側でNGにするために元の値を返す
  }, zodNullableIsoDate);
}

/**
 * ZodISODateTimeに対する変換処理
 * - 入力フィールドの初期値として undefined 設定を許容する
 * - yyyy/MM/dd hh:mm:ss 形式を許容する
 * 
 * @param zodString zodスキーマ
 * @returns 変換後のzodスキーマ
 */
function isoDateTimePreprocessor(zodISODateTime: ZodISODateTime) {
  return z.preprocess((val: string | undefined) => {
    if (val == null || val === "") {
      return val;
    }
    if (val.match(/^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2}$/)) {
      return val.replace(/\//g, "-").replace(/ /, "T") + "Z";    // yyyy/MM/dd hh:mm:ss を yyyy-MM-ddThh:mm:ssZ に変換
    }
    return val;        // zod側でNGにするために元の値を返す
  }, zodISODateTime);
}

/**
 * ZodOptional<ZodISODateTime>に対する変換処理
 * - 入力フィールドの初期値として undefined 設定を許容する
 * - yyyy/MM/dd hh:mm:ss 形式を許容する
 * - 「required = false」の指定がある場合に設定され、空文字の場合は undefined に変換する
 * 
 * @param zodString zodスキーマ
 * @returns 変換後のzodスキーマ
 */
function optionalIsoDatetimePreprocessor(zodOptionalIsoDateTime: ZodOptional<ZodISODateTime>) {
  return z.preprocess((val: string | undefined) => {
    if (val == null || val === "") {
      return undefined;
    }
    if (val.match(/^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2}$/)) {
      return val.replace(/\//g, "-").replace(/ /, "T") + "Z";    // yyyy/MM/dd hh:mm:ss を yyyy-MM-ddThh:mm:ssZ に変換
    }
    return val;        // zod側でNGにするために元の値を返す
  }, zodOptionalIsoDateTime);
}

/**
 * ZodNullable<ZodISODateTime>に対する変換処理
 * - 入力フィールドの初期値として undefined 設定を許容する
 * - yyyy/MM/dd hh:mm:ss 形式を許容する
 * - 「nullable = true」の指定がある場合に設定され、空文字の場合は null に変換する
 * 
 * @param zodString zodスキーマ
 * @returns 変換後のzodスキーマ
 */
function nullableIsoDatetimePreprocessor(zodNullableIsoDateTime: ZodNullable<ZodISODateTime>) {
  return z.preprocess((val: string | undefined | null) => {
    if (val == null || val === "") {
      return null;
    }
    if (val.match(/^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2}$/)) {
      return val.replace(/\//g, "-").replace(/ /, "T") + "Z";    // yyyy/MM/dd hh:mm:ss を yyyy-MM-ddThh:mm:ssZ に変換
    }
    return val;        // zod側でNGにするために元の値を返す
  }, zodNullableIsoDateTime);
}

/**
 * ZodNumberに対する変換処理
 * - 入力フィールドの初期値として undefined 設定を許容する
 * - 文字列の入力を許容する
 * - 入力フィールドの値(文字列)を数値形式に変換する
 * 
 * @param zodString zodスキーマ
 * @returns 変換後のzodスキーマ
 */
function numberPreprocessor<T extends ZodNumber>(zodNumber: T) {
  return z.preprocess((val: string | number | undefined) => {
    if (val == null || val === '') {
      return val;
    }
    if (Number.isNaN(val)) {
      return val;
    }
    const numValue = Number(val);
    return Number.isNaN(numValue) ? val : numValue; // zod側でNGにするために元の値を返す
  }, zodNumber);
}

/**
 * ZodOptional<ZodNumber>に対する変換処理
 * - 入力フィールドの初期値として undefined 設定を許容する
 * - 文字列の入力を許容する
 * - 入力フィールドの値(文字列)を数値形式に変換する
 * - 「required = false」の指定がある場合に設定され、空文字の場合は undefined に変換する
 * 
 * @param zodNumber zodスキーマ
 * @returns 変換後のzodスキーマ
 */
function optionalNumberPreprocessor<T extends ZodNumber>(zodNumber: ZodOptional<T>) {
  return z.preprocess((val: string | number | undefined) => {
    if (val == null || val === '') {
      return undefined;
    }
    if (Number.isNaN(val)) {
      return val;
    }
    const numValue = Number(val);
    return Number.isNaN(numValue) ? val : numValue; // zod側でNGにするために元の値を返す
  }, zodNumber);
}

/**
 * ZodNullable<ZodNumber>に対する変換処理
 * - 入力フィールドの初期値として undefined 設定を許容する
 * - 文字列の入力を許容する
 * - 入力フィールドの値(文字列)を数値形式に変換する
 * - 「nullable = true」の指定がある場合に設定され、空文字の場合は null に変換する
 * 
 * @param zodNumber zodスキーマ
 * @returns 変換後のzodスキーマ
 */
function nullableNumberPreprocessor<T extends ZodNumber>(zodNumber: ZodNullable<T>) {
  return z.preprocess((val: string | number | undefined | null) => {
    if (val == null || val === '') {
      return null;
    }
    if (Number.isNaN(val)) {
      return val;
    }
    const numValue = Number(val);
    return Number.isNaN(numValue) ? val : numValue; // zod側でNGにするために元の値を返す
  }, zodNumber);
}

/**
 * ZodBooleanに対する変換処理
 * - 入力フィールドの初期値として undefined 設定を許容する
 * - z.stringbool()形式の変換を実施する
 * 
 * @param zodBoolean zodスキーマ
 * @returns 変換後のzodスキーマ
 */
function booleanPreprocessor(zodBoolean: ZodBoolean) {
  return z.preprocess((val: string | boolean | undefined) =>{
    const truthy = ["true", "1", "yes", "on", "y", "enabled", "ok"];
    const falsy = ["false", "0", "no", "off", "n", "disabled", "ng"];
    return val == null              ? val :
           typeof val === "boolean" ? val :
           typeof val !== "string"  ? val : // zod側でNGにするために元の値を返す
           truthy.includes(val)     ? true :
           falsy.includes(val)      ? false :
                                      val;  // zod側でNGにするために元の値を返す
  }, zodBoolean);
}

/**
 * ZodOptional<ZodBoolean>に対する変換処理
 * - 入力フィールドの初期値として undefined 設定を許容する
 * - z.stringbool()形式の変換を実施する
 * - 「required = false」の指定がある場合に設定され、空文字の場合は undefined に変換する
 * 
 * @param zodBoolean zodスキーマ
 * @returns 変換後のzodスキーマ
 */
function optionalBooleanPreprocessor(zodBoolean: ZodOptional<ZodBoolean>) {
  return z.preprocess((val: string | boolean | undefined) =>{
    const truthy = ["true", "1", "yes", "on", "y", "enabled", "ok"];
    const falsy = ["false", "0", "no", "off", "n", "disabled", "ng"];
    return val === ""               ? undefined :
           val == null              ? undefined :
           typeof val === "boolean" ? val :
           typeof val !== "string"  ? val : // zod側でNGにするために元の値を返す
           truthy.includes(val)     ? true :
           falsy.includes(val)      ? false :
                                      val;  // zod側でNGにするために元の値を返す
  }, zodBoolean);
}

/**
 * ZodNullable<ZodBoolean>に対する変換処理
 * - 入力フィールドの初期値として undefined 設定を許容する
 * - z.stringbool()形式の変換を実施する
 * - 「nullable = true」の指定がある場合に設定され、空文字の場合は null に変換する
 * 
 * @param zodBoolean zodスキーマ
 * @returns 変換後のzodスキーマ
 */
function nullableBooleanPreprocessor(zodBoolean: ZodNullable<ZodBoolean>) {
  return z.preprocess((val: string | boolean | undefined) =>{
    const truthy = ["true", "1", "yes", "on", "y", "enabled", "ok"];
    const falsy = ["false", "0", "no", "off", "n", "disabled", "ng"];
    return val == ""                ? null :
           val == null              ? null :
           typeof val === "boolean" ? val :
           typeof val !== "string"  ? val : // zod側でNGにするために元の値を返す
           truthy.includes(val)     ? true :
           falsy.includes(val)      ? false :
                                      val;  // zod側でNGにするために元の値を返す
  }, zodBoolean);
}

/**
 * ZodFileに対する変換処理
 * - 入力フィールドの初期値として undefined 設定を許容する
 * - ファイル入力フィールドで渡される型 FileList を受け入れる
 * 
 * @param zodFile zodスキーマ
 * @returns 変換後のzodスキーマ
 */
function filePreprocessor(zodFile: ZodFile) {
  return z.preprocess((val: File | FileList | undefined) => {
    return val == null                    ? undefined :
           val instanceof File            ? val :
           !(val instanceof FileList)     ? val :  // 不明な型の場合はzod側でNG判定する
           (val as FileList).length === 0 ? undefined : 
           (val as FileList).length === 1 ? (val as FileList).item(0) :
                                            val;   // 複数ファイルが入力された場合はzod側でNG判定する
  }, zodFile);
}

/**
 * ZodOptional<ZodFile>に対する変換処理
 * - 入力フィールドの初期値として undefined 設定を許容する
 * - ファイル入力フィールドで渡される型 FileList を受け入れる
 * - 「required = false」の指定がある場合に設定され、FileListが空の場合は undefined に変換する
 * 
 * @param zodFile zodスキーマ
 * @returns 変換後のzodスキーマ
 */
function optionalFilePreprocessor(zodFile: ZodOptional<ZodFile>) {
  return z.preprocess((val: File | FileList | undefined) => {
    return val == null                    ? undefined :
           val instanceof File            ? val :
           !(val instanceof FileList)     ? val :  // 不明な型の場合はzod側でNG判定する
           (val as FileList).length === 0 ? undefined : 
           (val as FileList).length === 1 ? (val as FileList).item(0) :
                                            val;   // 複数ファイルが入力された場合はzod側でNG判定する
  }, zodFile);
}

/**
 * ZodNullable<ZodFile>に対する変換処理
 * - 入力フィールドの初期値として undefined 設定を許容する
 * - ファイル入力フィールドで渡される型 FileList を受け入れる
 * - 「nullable = true」の指定がある場合に設定され、FileListが空の場合やundefinedの場合は null に変換する
 * 
 * @param zodFile zodスキーマ
 * @returns 変換後のzodスキーマ
 */
function nullableFilePreprocessor(zodFile: ZodNullable<ZodFile>) {
  return z.preprocess((val: File | FileList | undefined) => {
    return val == null                    ? null :
           val instanceof File            ? val :
           !(val instanceof FileList)     ? val :  // 不明な型の場合はzod側でNG判定する
           (val as FileList).length === 0 ? null : 
           (val as FileList).length === 1 ? (val as FileList).item(0) :
                                            val;   // 複数ファイルが入力された場合はzod側でNG判定する
  }, zodFile);
}

/**
 * ZodArray<ZodFile>に対する変換処理
 * - 入力フィールドの初期値として undefined 設定を許容する
 * - ファイル入力フィールドで渡される型 FileList を受け入れる
 * - 入力値が undefined の場合は空配列に変換する
 * 
 * @param zodFile zodスキーマ
 * @returns 変換後のzodスキーマ
 */
function arrayFilePreprocessor(zodFile: ZodArray<ZodFile>) {
  return z.preprocess((val: File[] | FileList | undefined) => {
    return val == null             ? [] : 
           val instanceof FileList ? Array.from(val) :
                                     val;
  }, zodFile);
}

/**
 * ZodOptional<ZodArray<ZodFile>>に対する変換処理
 * - 入力フィールドの初期値として undefined 設定を許容する
 * - ファイル入力フィールドで渡される型 FileList を受け入れる
 * - 「0 < minItems」かつ「required = false」の指定がある場合に設定され、undefined または 空配列の入力値を undefined に変換する
 * 
 * @param zodFile zodスキーマ
 * @returns 変換後のzodスキーマ
 */
function optionalArrayFilePreprocessor(zodFile: ZodOptional<ZodArray<ZodFile>>) {
  return z.preprocess((val: File[] | FileList | undefined) => {
    if (val == null) {
      return undefined;
    }
    const files = val instanceof FileList ? Array.from(val) : val;
    if (files.length === 0) {
      return undefined;
    }
    return files;
  }, zodFile);
}

/**
 * ZodNullable<ZodArray<ZodFile>>に対する変換処理
 * - 入力フィールドの初期値として undefined 設定を許容する
 * - ファイル入力フィールドで渡される型 FileList を受け入れる
 * - 「0 < minItems」かつ「nullable = true」の指定がある場合に設定され、undefined または 空配列の入力値を null に変換する
 * 
 * @param zodFile zodスキーマ
 * @returns 変換後のzodスキーマ
 */
function nullableArrayFilePreprocessor(zodFile: ZodNullable<ZodArray<ZodFile>>) {
  return z.preprocess((val: File[] | FileList | undefined | null) => {
    if (val == null) {
      return null;
    }
    const files = val instanceof FileList ? Array.from(val) : val;
    if (files.length === 0) {
      return null;
    }
    return files;
  }, zodFile);
}

/**
 * ZodLiteralに対する変換処理
 * - 入力フィールドの初期値として undefined 設定を許容する
 * - 入力フィールドの値(文字列)を受け取り、リテラル値に変換する
 * 
 * @param zodLiteral zodスキーマ
 * @returns 変換後のzodスキーマ
 */
function literalPreprocessor<T extends ZodLiteral>(zodLiteral: T) {
  const literalValues = [...zodLiteral.values] as Array<z.infer<T>>;
  const literalMap = new Map<string | z.infer<T>, z.infer<T>>();
  literalValues.forEach(item => {
    literalMap.set(item, item);
    literalMap.set(String(item), item);
  });
  return z.preprocess((val: undefined | string | z.infer<T>) => {
    if (val == null) {
      return val;
    }
    if (literalMap.has(val)) {
      return literalMap.get(val);
    }
    return val;    // zod側でNGにするために元の値を返す
  }, zodLiteral);
}

/**
 * ZodOptional<ZodLiteral>に対する変換処理
 * - 入力フィールドの初期値として undefined 設定を許容する
 * - 入力フィールドの値(文字列)を受け取り、リテラル値に変換する
 * - 「required = false」の指定がある場合に設定され、空文字の場合は undefined に変換する
 * 
 * @param zodLiteral zodスキーマ
 * @returns 変換後のzodスキーマ
 */
function optionalLiteralPreprocessor<T extends ZodLiteral>(zodLiteral: ZodOptional<T>) {
  const values = zodLiteral.def.innerType.values;
  const literalValues = [...values] as Array<z.infer<T>>;
  const literalMap = new Map<string | z.infer<T>, z.infer<T>>();
  literalValues.forEach(item => {
    literalMap.set(item, item);
    literalMap.set(String(item), item);
});
  return z.preprocess((val: undefined | string | z.infer<T>) => {
    if (val == null) {
      return undefined;
    }
    if (val === "" && !literalMap.has(val)) {
      return undefined;
    }
    if (literalMap.has(val)) {
      return literalMap.get(val);
    }
    return val;    // zod側でNGにするために元の値を返す
  }, zodLiteral);
}

/**
 * ZodNulable<ZodLiteral>に対する変換処理
 * - 入力フィールドの初期値として undefined 設定を許容する
 * - 入力フィールドの値(文字列)を受け取り、リテラル値に変換する
 * - 「nullable = true」の指定がある場合に設定され、空文字の場合は undefined に変換する
 * 
 * @param zodLiteral zodスキーマ
 * @returns 変換後のzodスキーマ
 */
function nullableLiteralPreprocessor<T extends ZodLiteral>(zodLiteral: ZodNullable<T>) {
  const values = zodLiteral.def.innerType.values;
  const literalValues = [...values] as Array<z.infer<T>>;
  const literalMap = new Map<string | z.infer<T>, z.infer<T>>();
  literalValues.forEach(item => {
    literalMap.set(item, item);
    literalMap.set(String(item), item);
});
  return z.preprocess((val: undefined | string | z.infer<T>) => {
    if (val == null) {
      return null;
    }
    if (val === "" && !literalMap.has(val)) {
      return null;
    }
    if (literalMap.has(val)) {
      return literalMap.get(val);
    }
    return val;    // zod側でNGにするために元の値を返す
  }, zodLiteral);
}
