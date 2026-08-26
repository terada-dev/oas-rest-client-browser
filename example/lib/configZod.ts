import z from "zod";

type $ZodStringFormats = "email" | "url" | "emoji" | "uuid" | "guid" | "nanoid" | "cuid" | "cuid2" | "ulid" | "xid" | "ksuid" | "datetime" | "date" | "time" | "duration" | "ipv4" | "ipv6" | "cidrv4" | "cidrv6" | "base64" | "base64url" | "json_string" | "e164" | "lowercase" | "uppercase" | "regex" | "jwt" | "starts_with" | "ends_with" | "includes";
type $ZodInvalidTypeExpected =  "string"  | "number"  | "int"  | "boolean"  | "bigint"  | "symbol"  | "undefined"  | "null"  | "never"  | "void"  | "date"  | "array"  | "object"  | "tuple"  | "record"  | "map"  | "set"  | "file"  | "nonoptional"  | "nan"  | "function"  | (string & {});
type $ZodErrorMap = Exclude<z.core.$ZodConfig["localeError"], undefined>;
interface $ZodStringFormatIssues {
  readonly path: PropertyKey[];
  readonly message: string;
  readonly code: "invalid_format";
  readonly format: $ZodStringFormats | (string & {});
  readonly pattern?: string;
  readonly input?: string;
  readonly prefix?: string;
  readonly suffix?: string;
  readonly includes?: string;
};

export function joinValues(array: z.core.util.Primitive[], separator = "|") {
  return array.map((val) => stringifyPrimitive(val)).join(separator);
}

export function stringifyPrimitive(value: z.core.util.Primitive) {
  if (typeof value === "bigint")
    return value.toString() + "n";
  if (typeof value === "string")
    return `"${value}"`;
  return `${String(value)}`;
}

const createLocaleError: () => $ZodErrorMap = () => {

  const FormatDictionary: {
    [k in $ZodStringFormats | (string & {})]?: string;
  } = {
    regex: "入力値",
    email: "メールアドレス",
    url: "URL",
    emoji: "絵文字",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "ISO日時",
    date: "ISO日付",
    time: "ISO時刻",
    duration: "ISO期間",
    ipv4: "IPv4アドレス",
    ipv6: "IPv6アドレス",
    cidrv4: "IPv4範囲",
    cidrv6: "IPv6範囲",
    base64: "base64エンコード文字列",
    base64url: "base64urlエンコード文字列",
    json_string: "JSON文字列",
    e164: "E.164番号",
    jwt: "JWT",
    template_literal: "入力値",
  };

  const TypeDictionary: {
    [k in $ZodInvalidTypeExpected | (string & {})]?: string;
  } = {
    number: "数値",
    array: "配列",
    string: "テキスト",
    int: "整数",
    boolean: "値",
    bigint: "整数",
    file: "ファイル",
  };

  return (issue) => {
    switch (issue.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue.expected] ?? issue.expected;
        if (/^[A-Z]/.test(issue.expected)) {
          return `${issue.expected}を入力してください`;
        }
        return `${expected}を入力してください`;
      }
      case "invalid_value":
        if (issue.values.length === 1) return `${stringifyPrimitive(issue.values[0])}を入力してください`;
        return `${joinValues(issue.values, "、")}のいずれかである必要があります`;
      case "too_big": {
        const max = issue.maximum.toString();
        const key = `${issue.origin}/${issue.inclusive}`;
        if (key === "string/true") return `${max}文字以下の値を入力してください`;
        if (key === "string/false") return `${max}より小さな文字数を入力してください`;
        if (key === "file/true") return `${max}バイト以下のファイルを設定してください`;
        if (key === "file/false") return `${max}バイトより小さなファイルを設定してください`;
        if (key === "array/true") return `${max}以下の要素数を入力してください`;
        if (key === "array/false") return `${max}より小さな要素数を入力してください`;
        if (key === "set/true") return `${max}以下の要素数を入力してください`;
        if (key === "set/false") return `${max}より小さな要素数を入力してください`;
        if (issue.inclusive) return `${max}以下の値を入力してください`
        return `${max}より小さな値を入力してください`;
      }
      case "too_small": {
        if (issue.minimum === 1 && issue.inclusive) {
          return "必須入力項目です";
        }
        const min = issue.minimum.toString();
        const key = `${issue.origin}/${issue.inclusive}`;
        if (key === "string/true") return `${min}文字以上の値を入力してください`;
        if (key === "string/false") return `${min}より大きな文字数を入力してください`;
        if (key === "file/true") return `${min}バイト以上のファイルを設定してください`;
        if (key === "file/false") return `${min}バイトより大きなファイルを設定してください`;
        if (key === "array/true") return `${min}以上の要素数を入力してください`;
        if (key === "array/false") return `${min}より大きな要素数を入力してください`;
        if (key === "set/true") return `${min}以上の要素数を入力してください`;
        if (key === "set/false") return `${min}より大きな要素数を入力してください`;
        if (issue.inclusive) return `${min}以上の値を入力してください`
        return `${min}より大きな値を入力してください`;
      }
      case "invalid_format": {
        const _issue = issue as $ZodStringFormatIssues;
        if (_issue.format === "starts_with") return `"${_issue.prefix}"で始まる値を入力してください`;
        if (_issue.format === "ends_with") return `"${_issue.suffix}"で終わる値を入力してください`;
        if (_issue.format === "includes") return `"${_issue.includes}"を含む値を入力してください`;
        if (_issue.format === "regex") return `パターン${_issue.pattern}に一致する値を入力してください`;
        return `無効な${FormatDictionary[_issue.format] ?? issue.format}`;
      }
      case "not_multiple_of":
        return `${issue.divisor}の倍数の値を入力してください`;
      case "unrecognized_keys":
        return `不正なプロパティ: ${joinValues(issue.keys, "、")}`;
      case "invalid_key":
        return `無効な入力: 入力値に紐づく情報は存在しません`;
      case "invalid_union":
        return "無効な入力";
      case "invalid_element":
        return `無効な入力: 入力値は設定できません`;
      default:
        return `無効な入力`;
    }
  };
};

export default function configZod() {
  const localeError = createLocaleError();
  z.config({
    localeError,
  });
}