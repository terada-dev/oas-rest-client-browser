/**
 * API: getOrderById
 * summary: Find purchase order by ID.
 * description: For valid response try integer IDs with value <= 5 or > 10. Other values will generate exceptions.
 */

import { z } from "zod";
import { formField } from "../lib";
import { createApi } from "../apiClient";
import type { ApiConfig } from "../lib";

const requestSchema = z.object({
  orderId: formField(z.int64().optional()),
});
requestSchema.describe("getOrderById");

type ApiRequestForm = z.input<typeof requestSchema>;
type ApiRquest = z.output<typeof requestSchema>;
type ApiResponse = {
  id?: number,
  petId?: number,
  quantity?: number,
  shipDate?: string,
  status?: "placed" | "approved" | "delivered",
  complete?: boolean,
};

const defaultValues: ApiRequestForm = {
  orderId: undefined,
};

const apiConfig: ApiConfig = {
  path: "/store/order/{orderId}",
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

export const getOrderById: Api = createApi<Api>(requestSchema, defaultValues, apiConfig);

export namespace getOrderById { // eslint-disable-line @typescript-eslint/no-namespace
  export type Form = ApiRequestForm;
  export type Request = ApiRquest;
  export type Response = ApiResponse;
}
