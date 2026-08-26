/**
 * API: findPetsByStatus
 * summary: Finds Pets by status.
 * description: Multiple status values can be provided with comma separated strings.
 */

import { z } from "zod";
import { formField } from "../lib";
import { createApi } from "../apiClient";
import type { ApiConfig } from "../lib";

const requestSchema = z.object({
  status: formField(z.literal(["available","pending","sold"] as const).optional()),
});
requestSchema.describe("findPetsByStatus");

type ApiRequestForm = z.input<typeof requestSchema>;
type ApiRquest = z.output<typeof requestSchema>;
type ApiResponse = Array<{
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
}>;

const defaultValues: ApiRequestForm = {
  status: "available",
};

const apiConfig: ApiConfig = {
  path: "/pet/findByStatus",
  method: "get",
  contentType: undefined,
  queryParamNames: ["status"],
  responseType: "json",
};

interface Api {
  (req: ApiRquest): Promise<ApiResponse>;
  zodSchema(): typeof requestSchema;
  defaultValues(): ApiRequestForm;
}

export const findPetsByStatus: Api = createApi<Api>(requestSchema, defaultValues, apiConfig);

export namespace findPetsByStatus { // eslint-disable-line @typescript-eslint/no-namespace
  export type Form = ApiRequestForm;
  export type Request = ApiRquest;
  export type Response = ApiResponse;
}
