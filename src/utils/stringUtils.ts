
const INDENT = "  ";

/**
 * 単語の区切りを PascalCase に変換する
 * @example
 * toPascalCase("camelCase") === "CamelCase"
 * toPascalCase("kebab-case") === "KebabCase"
 * toPascalCase("snake_case") === "SnakeCase"
 * toPascalCase("/url/pattern") === "UrlPattern"
 *
 * @param text 変換前の文字列。
 * @returns PascalCaseに変換した文字列。
 */
export function toPascalCase(text: string): string {
  if (text.length === 0) {
    return "";
  }

  if (text.length === 1) {
    return text.toUpperCase();
  }

  const camelCase = text.replace(/[-_/](.)/g, (_, char) => char.toUpperCase());
  return camelCase.charAt(0).toUpperCase() + camelCase.slice(1);
}

/**
 * 指定の深さに対応するインデント文字列を作成する
 * 
 * @param indentLevel インデントの深さレベル
 * @returns インデント文字列
 */
export function makeIndent(indentLevel: number) {
  return INDENT.repeat(indentLevel);
}