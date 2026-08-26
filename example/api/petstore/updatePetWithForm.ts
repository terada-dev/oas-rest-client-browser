/**
 * API: updatePetWithForm
 * summary: Updates a pet in the store with form data.
 * description: Updates a pet resource based on the form data.
 */

import { z } from "zod";
import { formField } from "../lib";
import { createApi } from "../apiClient";
import type { ApiConfig } from "../lib";

const requestSchema = z.object({
  petId: formField(z.int64().optional()),
  name: formField(z.string()).optional(),
  status: formField(z.string()).optional(),
});
requestSchema.describe("updatePetWithForm");

type ApiRequestForm = z.input<typeof requestSchema>;
type ApiRquest = z.output<typeof requestSchema>;
type ApiResponse = {
  id?: number,
  name: string,
  category?: {
    id?: number,
    name?: string,
  },
  photoUrls: Array<string>,
  tags?: Array<{
    id?: number,
    name?: string,
  }>,
  status?: "available" | "pending" | "sold",
};

const defaultValues: ApiRequestForm = {
  petId: undefined,
  name: undefined,
  status: undefined,
};

const apiConfig: ApiConfig = {
  path: "/pet/{petId}",
  method: "post",
  contentType: undefined,
  queryParamNames: ["name","status"],
  responseType: "json",
};

interface Api {
  (req: ApiRquest): Promise<ApiResponse>;
  zodSchema(): typeof requestSchema;
  defaultValues(): ApiRequestForm;
}

export const updatePetWithForm: Api = createApi<Api>(requestSchema, defaultValues, apiConfig);

export namespace updatePetWithForm { // eslint-disable-line @typescript-eslint/no-namespace
  export type Form = ApiRequestForm;
  export type Request = ApiRquest;
  export type Response = ApiResponse;
}
