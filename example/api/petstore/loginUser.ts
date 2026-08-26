/**
 * API: loginUser
 * summary: Logs user into the system.
 * description: Log into the system.
 */

import { z } from "zod";
import { formField } from "../lib";
import { createApi } from "../apiClient";
import type { ApiConfig } from "../lib";

const requestSchema = z.object({
  username: formField(z.string()).optional(),
  password: formField(z.string()).optional(),
});
requestSchema.describe("loginUser");

type ApiRequestForm = z.input<typeof requestSchema>;
type ApiRquest = z.output<typeof requestSchema>;
type ApiResponse = string;

const defaultValues: ApiRequestForm = {
  username: undefined,
  password: undefined,
};

const apiConfig: ApiConfig = {
  path: "/user/login",
  method: "get",
  contentType: undefined,
  queryParamNames: ["username","password"],
  responseType: "text",
};

interface Api {
  (req: ApiRquest): Promise<ApiResponse>;
  zodSchema(): typeof requestSchema;
  defaultValues(): ApiRequestForm;
}

export const loginUser: Api = createApi<Api>(requestSchema, defaultValues, apiConfig);

export namespace loginUser { // eslint-disable-line @typescript-eslint/no-namespace
  export type Form = ApiRequestForm;
  export type Request = ApiRquest;
  export type Response = ApiResponse;
}
