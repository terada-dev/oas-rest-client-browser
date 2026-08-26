import type { ApiInfo } from "#/types/ApiInfo.d.ts";

export function createCodeText(api: ApiInfo, zodCode: string, typeCode: string, defaultValueCode: string) {

  // ファイルヘッダのコメントを作成
  const commentLines = `API: ${api.operationId}`
                     + (api.summary ? `\nsummary: ${api.summary}` : "")
                     + (api.description ? `\ndescription: ${api.description}` : "");
  const fileHeaderComment = [
    "/**",
    ...commentLines.split("\n").map(line => ` * ${line}`),
    " */"
  ].join("\n");

  // テンプレートに該当API情報を埋め込む
  return `${fileHeaderComment}

import { z } from "zod";
import { formField } from "../lib";
import { createApi } from "../apiClient";
import type { ApiConfig } from "../lib";

const requestSchema = ${zodCode};
requestSchema.describe("${api.operationId}");

type ApiRequestForm = z.input<typeof requestSchema>;
type ApiRquest = z.output<typeof requestSchema>;
type ApiResponse = ${typeCode};

const defaultValues: ApiRequestForm = ${defaultValueCode};

const apiConfig: ApiConfig = {
  path: "${api.path}",
  method: "${api.method}",
  contentType: ${JSON.stringify(api.contentType) ?? "undefined"},
  queryParamNames: ${JSON.stringify(api.queryParamNames)},
  responseType: "${api.responseType}",
};

interface Api {
  (req: ApiRquest): Promise<ApiResponse>;
  zodSchema(): typeof requestSchema;
  defaultValues(): ApiRequestForm;
}

export const ${api.operationId}: Api = createApi<Api>(requestSchema, defaultValues, apiConfig);

export namespace ${api.operationId} { // eslint-disable-line @typescript-eslint/no-namespace
  export type Form = ApiRequestForm;
  export type Request = ApiRquest;
  export type Response = ApiResponse;
}
`;
}