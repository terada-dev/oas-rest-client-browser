
/**
 * TODO: 優先度低
 * 
 * ループ構造を持つ OAS スキーマを zod 定義文字列に変換する。
 * 
 * [例]
 * schemas:
 *   linkedList:
 *     type: object
 *       properties:
 *         item: 
 *           type: string
 *         next:
 *             $ref: "#/components/schemas/linkedList"
 *   listHolder:
 *     type: object
 *       properties:
 *         name: string,
 *       list:
 *         $ref: "#/components/schemas/linkedList"
 * 
 * ↓
 * 
 * // $ref参照の数だけzodスキーマを定義する(この方式でよいか要検討)
 * const linkedList = z.object({
 *   item: z.string(),
 *   get next() {
 *     return linkedList;
 *   }
 * });
 * 
 * const listHolder = z.object({
 *   name: z.string(),
 *   list: linkedList,
 * })
 * 
 *   
 */

