/**
 * API: login
 * summary: ログイン
 * description: アカウント列挙攻撃対策として、認証NGは統一した応答を返す
 */

import { z } from "zod";
import { formField } from "../lib";
import { createApi } from "../apiClient";
import type { ApiConfig } from "../lib";

const requestSchema = z.object({
  username: formField(z.string().max(16)),
  password: formField(z.string().max(32)),
});
requestSchema.describe("login");

type ApiRequestForm = z.input<typeof requestSchema>;
type ApiRquest = z.output<typeof requestSchema>;
type ApiResponse = {
  name: string,
  mailAddress?: string,
  role: 0 | 1 | 2,
};

const defaultValues: ApiRequestForm = {
  username: "",
  password: "",
};

const apiConfig: ApiConfig = {
  path: "/login",
  method: "post",
  contentType: "application/json",
  queryParamNames: [],
  responseType: "json",
};

interface Api {
  (req: ApiRquest): Promise<ApiResponse>;
  zodSchema(): typeof requestSchema;
  defaultValues(): ApiRequestForm;
}

export const login: Api = createApi<Api>(requestSchema, defaultValues, apiConfig);

export namespace login { // eslint-disable-line @typescript-eslint/no-namespace
  export type Form = ApiRequestForm;
  export type Request = ApiRquest;
  export type Response = ApiResponse;
}
