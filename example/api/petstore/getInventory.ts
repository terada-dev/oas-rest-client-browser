/**
 * API: getInventory
 * summary: Returns pet inventories by status.
 * description: Returns a map of status codes to quantities.
 */

import { z } from "zod";
import { formField } from "../lib";
import { createApi } from "../apiClient";
import type { ApiConfig } from "../lib";

const requestSchema = z.void();
requestSchema.describe("getInventory");

type ApiRequestForm = z.input<typeof requestSchema>;
type ApiRquest = z.output<typeof requestSchema>;
type ApiResponse = any;

const defaultValues: ApiRequestForm = undefined;

const apiConfig: ApiConfig = {
  path: "/store/inventory",
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

export const getInventory: Api = createApi<Api>(requestSchema, defaultValues, apiConfig);

export namespace getInventory { // eslint-disable-line @typescript-eslint/no-namespace
  export type Form = ApiRequestForm;
  export type Request = ApiRquest;
  export type Response = ApiResponse;
}
