/**
 * API: deleteOrder
 * summary: Delete purchase order by identifier.
 * description: For valid response try integer IDs with value < 1000. Anything above 1000 or nonintegers will generate API errors.
 */

import { z } from "zod";
import { formField } from "../lib";
import { createApi } from "../apiClient";
import type { ApiConfig } from "../lib";

const requestSchema = z.object({
  orderId: formField(z.int64().optional()),
});
requestSchema.describe("deleteOrder");

type ApiRequestForm = z.input<typeof requestSchema>;
type ApiRquest = z.output<typeof requestSchema>;
type ApiResponse = void;

const defaultValues: ApiRequestForm = {
  orderId: undefined,
};

const apiConfig: ApiConfig = {
  path: "/store/order/{orderId}",
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

export const deleteOrder: Api = createApi<Api>(requestSchema, defaultValues, apiConfig);

export namespace deleteOrder { // eslint-disable-line @typescript-eslint/no-namespace
  export type Form = ApiRequestForm;
  export type Request = ApiRquest;
  export type Response = ApiResponse;
}
