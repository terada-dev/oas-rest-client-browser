/**
 * API: addPet
 * summary: Add a new pet to the store.
 * description: Add a new pet to the store.
 */

import { z } from "zod";
import { formField } from "../lib";
import { createApi } from "../apiClient";
import type { ApiConfig } from "../lib";

const requestSchema = z.object({
  id: formField(z.int64().optional()),
  name: formField(z.string()),
  category: z.object({
    id: formField(z.int64().optional()),
    name: formField(z.string()).optional(),
  }).optional(),
  photoUrls: z.array(formField(z.string())),
  tags: z.array(z.object({
    id: formField(z.int64().optional()),
    name: formField(z.string()).optional(),
  })).optional(),
  status: formField(z.literal(["available","pending","sold"] as const).optional()),
});
requestSchema.describe("addPet");

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
  id: undefined,
  name: "",
  category: undefined,
  photoUrls: [],
  tags: undefined,
  status: undefined,
};

const apiConfig: ApiConfig = {
  path: "/pet",
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

export const addPet: Api = createApi<Api>(requestSchema, defaultValues, apiConfig);

export namespace addPet { // eslint-disable-line @typescript-eslint/no-namespace
  export type Form = ApiRequestForm;
  export type Request = ApiRquest;
  export type Response = ApiResponse;
}
