import type { NormalizedOpenAPIV3 } from "../types/NormalizedOpenAPI.d.ts"
type SchemaObject = NormalizedOpenAPIV3.SchemaObject;

export type ApiInfo = {
  path: string,
  operationId: string,
  summary: string | undefined,
  description: string | undefined,
  method: "get" | "post" | "put" | "patch" | "delete" | "options" | "head" | "trace",
  contentType: string | undefined,
  responseType: "arraybuffer" | "json" | "text",
  queryParamNames: string[],
 /**
  * parameterは次の変換を行い ScheamObject 形式で表現する
  * @example
  * paths:
  *   /hoge/{param1Name}/  :
  *     parameters:
  *       - $ref: "#/components/parameters/param1"
  *     [method]:
  *       parameters:
  *         - $ref: "#/components/parameters/param2"
  * components:
  *   parameters:
  *     param1:
  *       name: param1Name
  *       in: path
  *       schema:
  *         $ref: "#/components/schemas/param1"
  *     param2:
  *       name: param2Name
  *       in: query
  *       schema:
  *         $ref: "#/components/schemas/param2"
  * 
  *  ↓ (次の形に変換)
  * 
  * type: object
  * properties:
  *   param1Name:
  *     $ref: "#/components/schemas/param1"
  *   param2Name:
  *     $ref: "#/components/schemas/param2"
  */
  parameter: SchemaObject | undefined,
  request: SchemaObject | undefined,
  response: SchemaObject | undefined,
  schemaType: {
    request: "normal" | "loop" | "not",
    response: "normal" | "loop" | "not",
  },
};
