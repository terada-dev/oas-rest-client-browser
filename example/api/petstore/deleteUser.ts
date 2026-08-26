/**
 * API: deleteUser
 * summary: Delete user resource.
 * description: This can only be done by the logged in user.
 */

import { z } from "zod";
import { formField } from "../lib";
import { createApi } from "../apiClient";
import type { ApiConfig } from "../lib";

const requestSchema = z.object({
  username: formField(z.string()).optional(),
});
requestSchema.describe("deleteUser");

type ApiRequestForm = z.input<typeof requestSchema>;
type ApiRquest = z.output<typeof requestSchema>;
type ApiResponse = void;

const defaultValues: ApiRequestForm = {
  username: undefined,
};

const apiConfig: ApiConfig = {
  path: "/user/{username}",
  method: "delete",
  contentType: undefined,
  queryParamNames: [],
  responseType: "json",
};

interface Api {
  (req: ApiRquest): Promise<ApiResponse>;
  zodSchema(): typeof requestSchema;
  defaultValues(): ApiRequestForm;
}

export const deleteUser: Api = createApi<Api>(requestSchema, defaultValues, apiConfig);

export namespace deleteUser { // eslint-disable-line @typescript-eslint/no-namespace
  export type Form = ApiRequestForm;
  export type Request = ApiRquest;
  export type Response = ApiResponse;
}
