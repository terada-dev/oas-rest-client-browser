/**
 * API: getPetById
 * summary: Find pet by ID.
 * description: Returns a single pet.
 */

import { z } from "zod";
import { formField } from "../lib";
import { createApi } from "../apiClient";
import type { ApiConfig } from "../lib";

const requestSchema = z.object({
  petId: formField(z.int64().optional()),
});
requestSchema.describe("getPetById");

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
};

const apiConfig: ApiConfig = {
  path: "/pet/{petId}",
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

export const getPetById: Api = createApi<Api>(requestSchema, defaultValues, apiConfig);

export namespace getPetById { // eslint-disable-line @typescript-eslint/no-namespace
  export type Form = ApiRequestForm;
  export type Request = ApiRquest;
  export type Response = ApiResponse;
}
