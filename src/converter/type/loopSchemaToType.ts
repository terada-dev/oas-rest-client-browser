
/**
 * TODO: 優先度低
 * 
 * ループ構造を持つ OAS スキーマを typescript の型定義文字列に変換する。
 * 
 * [例]
 * schemas:
 *   linkedList:
 *     type: object
 *       properties:
 *         item: 
 *           type: string
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
 * // $ref参照の数だけ型を定義する(この方式でよいか要検討)
 * type LinkedList = {
 *   item: string,
 *   next: linkedList
 * };
 * type ListHolder = {
 *   name: string,
 *   list: LinkedList,
 * }
 * 
 *   
 */
