/**
 * API: logoutUser
 * summary: Logs out current logged in user session.
 * description: Log user out of the system.
 */

import { z } from "zod";
import { formField } from "../lib";
import { createApi } from "../apiClient";
import type { ApiConfig } from "../lib";

const requestSchema = z.void();
requestSchema.describe("logoutUser");

type ApiRequestForm = z.input<typeof requestSchema>;
type ApiRquest = z.output<typeof requestSchema>;
type ApiResponse = void;

const defaultValues: ApiRequestForm = undefined;

const apiConfig: ApiConfig = {
  path: "/user/logout",
  method: "get",
  contentType: undefined,
  queryParamNames: [],
  responseType: "json",
};

interface Api {
  (req: ApiRquest): Promise<ApiResponse>;
  zodSchema(): typeof requestSchema;
  defaultValues(): ApiRequestForm;
}

export const logoutUser: Api = createApi<Api>(requestSchema, defaultValues, apiConfig);

export namespace logoutUser { // eslint-disable-line @typescript-eslint/no-namespace
  export type Form = ApiRequestForm;
  export type Request = ApiRquest;
  export type Response = ApiResponse;
}
