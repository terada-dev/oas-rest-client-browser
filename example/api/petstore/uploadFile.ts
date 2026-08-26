/**
 * API: uploadFile
 * summary: Uploads an image.
 * description: Upload image of the pet.
 */

import { z } from "zod";
import { formField } from "../lib";
import { createApi } from "../apiClient";
import type { ApiConfig } from "../lib";

const requestSchema = z.object({
  petId: formField(z.int64().optional()),
  additionalMetadata: formField(z.string()).optional(),
});
requestSchema.describe("uploadFile");

type ApiRequestForm = z.input<typeof requestSchema>;
type ApiRquest = z.output<typeof requestSchema>;
type ApiResponse = {
  code?: number,
  type?: string,
  message?: string,
};

const defaultValues: ApiRequestForm = {
  petId: undefined,
  additionalMetadata: undefined,
};

const apiConfig: ApiConfig = {
  path: "/pet/{petId}/uploadImage",
  method: "post",
  contentType: undefined,
  queryParamNames: ["additionalMetadata"],
  responseType: "json",
};

interface Api {
  (req: ApiRquest): Promise<ApiResponse>;
  zodSchema(): typeof requestSchema;
  defaultValues(): ApiRequestForm;
}

export const uploadFile: Api = createApi<Api>(requestSchema, defaultValues, apiConfig);

export namespace uploadFile { // eslint-disable-line @typescript-eslint/no-namespace
  export type Form = ApiRequestForm;
  export type Request = ApiRquest;
  export type Response = ApiResponse;
}
