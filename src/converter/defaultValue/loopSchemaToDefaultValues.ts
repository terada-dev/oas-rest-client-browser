/**
 * TODO: 優先度低
 * 
 * ループ構造を持つ OAS スキーマからデフォルト値定義コードの文字列に変換する。
 * 
 * [例]
 * schemas:
 *   linkedList:
 *     type: object
 *       properties:
 *         item: 
 *           type: string
 *           default: xxxxx
 *         next:
 *           $ref: "#/components/schemas/linkedList"
 *   listHolder:
 *     type: object
 *       properties:
 *         name: string,
 *       list:
 *         $ref: "#/components/schemas/linkedList"
 * 
 * ↓
 * 
 * // $ref参照は1つにまとめて、optionalやnullableを採用する(この方式でよいか要検討)
 * {
 *   name: "xxxxx",
 *   list: undefined,
 * }
 * 
 *   
 */


