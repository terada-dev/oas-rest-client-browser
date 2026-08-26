/**
 * API: updateUser
 * summary: Update user resource.
 * description: This can only be done by the logged in user.
 */

import { z } from "zod";
import { formField } from "../lib";
import { createApi } from "../apiClient";
import type { ApiConfig } from "../lib";

const requestSchema = z.object({
  username: formField(z.string()).optional(),
  id: formField(z.int64().optional()),
  firstName: formField(z.string()).optional(),
  lastName: formField(z.string()).optional(),
  email: formField(z.string()).optional(),
  password: formField(z.string()).optional(),
  phone: formField(z.string()).optional(),
  userStatus: formField(z.int32().optional()),
});
requestSchema.describe("updateUser");

type ApiRequestForm = z.input<typeof requestSchema>;
type ApiRquest = z.output<typeof requestSchema>;
type ApiResponse = void;

const defaultValues: ApiRequestForm = {
  username: undefined,
  id: undefined,
  firstName: undefined,
  lastName: undefined,
  email: undefined,
  password: undefined,
  phone: undefined,
  userStatus: undefined,
};

const apiConfig: ApiConfig = {
  path: "/user/{username}",
  method: "put",
  contentType: "application/json",
  queryParamNames: [],
  responseType: "json",
};

interface Api {
  (req: ApiRquest): Promise<ApiResponse>;
  zodSchema(): typeof requestSchema;
  defaultValues(): ApiRequestForm;
}

export const updateUser: Api = createApi<Api>(requestSchema, defaultValues, apiConfig);

export namespace updateUser { // eslint-disable-line @typescript-eslint/no-namespace
  export type Form = ApiRequestForm;
  export type Request = ApiRquest;
  export type Response = ApiResponse;
}
