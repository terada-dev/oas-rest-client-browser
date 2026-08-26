/**
 * API: getUserByName
 * summary: Get user by user name.
 * description: Get user detail based on username.
 */

import { z } from "zod";
import { formField } from "../lib";
import { createApi } from "../apiClient";
import type { ApiConfig } from "../lib";

const requestSchema = z.object({
  username: formField(z.string()).optional(),
});
requestSchema.describe("getUserByName");

type ApiRequestForm = z.input<typeof requestSchema>;
type ApiRquest = z.output<typeof requestSchema>;
type ApiResponse = {
  id?: number,
  username?: string,
  firstName?: string,
  lastName?: string,
  email?: string,
  password?: string,
  phone?: string,
  userStatus?: number,
};

const defaultValues: ApiRequestForm = {
  username: undefined,
};

const apiConfig: ApiConfig = {
  path: "/user/{username}",
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

export const getUserByName: Api = createApi<Api>(requestSchema, defaultValues, apiConfig);

export namespace getUserByName { // eslint-disable-line @typescript-eslint/no-namespace
  export type Form = ApiRequestForm;
  export type Request = ApiRquest;
  export type Response = ApiResponse;
}
