/**
 * API: findPetsByTags
 * summary: Finds Pets by tags.
 * description: Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 */

import { z } from "zod";
import { formField } from "../lib";
import { createApi } from "../apiClient";
import type { ApiConfig } from "../lib";

const requestSchema = z.object({
  tags: z.array(formField(z.string())).optional(),
});
requestSchema.describe("findPetsByTags");

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
  tags: undefined,
};

const apiConfig: ApiConfig = {
  path: "/pet/findByTags",
  method: "get",
  contentType: undefined,
  queryParamNames: ["tags"],
  responseType: "json",
};

interface Api {
  (req: ApiRquest): Promise<ApiResponse>;
  zodSchema(): typeof requestSchema;
  defaultValues(): ApiRequestForm;
}

export const findPetsByTags: Api = createApi<Api>(requestSchema, defaultValues, apiConfig);

export namespace findPetsByTags { // eslint-disable-line @typescript-eslint/no-namespace
  export type Form = ApiRequestForm;
  export type Request = ApiRquest;
  export type Response = ApiResponse;
}
