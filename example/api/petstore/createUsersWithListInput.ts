/**
 * API: createUsersWithListInput
 * summary: Creates list of users with given input array.
 * description: Creates list of users with given input array.
 */

import { z } from "zod";
import { formField } from "../lib";
import { createApi } from "../apiClient";
import type { ApiConfig } from "../lib";

const requestSchema = z.array(z.object({
  id: formField(z.int64().optional()),
  username: formField(z.string()).optional(),
  firstName: formField(z.string()).optional(),
  lastName: formField(z.string()).optional(),
  email: formField(z.string()).optional(),
  password: formField(z.string()).optional(),
  phone: formField(z.string()).optional(),
  userStatus: formField(z.int32().optional()),
}));
requestSchema.describe("createUsersWithListInput");

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

const defaultValues: ApiRequestForm = [];

const apiConfig: ApiConfig = {
  path: "/user/createWithList",
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

export const createUsersWithListInput: Api = createApi<Api>(requestSchema, defaultValues, apiConfig);

export namespace createUsersWithListInput { // eslint-disable-line @typescript-eslint/no-namespace
  export type Form = ApiRequestForm;
  export type Request = ApiRquest;
  export type Response = ApiResponse;
}
