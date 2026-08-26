/**
 * API: deletePet
 * summary: Deletes a pet.
 * description: Delete a pet.
 */

import { z } from "zod";
import { formField } from "../lib";
import { createApi } from "../apiClient";
import type { ApiConfig } from "../lib";

const requestSchema = z.object({
  petId: formField(z.int64().optional()),
});
requestSchema.describe("deletePet");

type ApiRequestForm = z.input<typeof requestSchema>;
type ApiRquest = z.output<typeof requestSchema>;
type ApiResponse = void;

const defaultValues: ApiRequestForm = {
  petId: undefined,
};

const apiConfig: ApiConfig = {
  path: "/pet/{petId}",
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

export const deletePet: Api = createApi<Api>(requestSchema, defaultValues, apiConfig);

export namespace deletePet { // eslint-disable-line @typescript-eslint/no-namespace
  export type Form = ApiRequestForm;
  export type Request = ApiRquest;
  export type Response = ApiResponse;
}
