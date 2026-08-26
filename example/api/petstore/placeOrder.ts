/**
 * API: placeOrder
 * summary: Place an order for a pet.
 * description: Place a new order in the store.
 */

import { z } from "zod";
import { formField } from "../lib";
import { createApi } from "../apiClient";
import type { ApiConfig } from "../lib";

const requestSchema = z.object({
  id: formField(z.int64().optional()),
  petId: formField(z.int64().optional()),
  quantity: formField(z.int32().optional()),
  shipDate: formField(z.iso.datetime().optional()),
  status: formField(z.literal(["placed","approved","delivered"] as const).optional()),
  complete: formField(z.boolean().optional()),
});
requestSchema.describe("placeOrder");

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
  id: undefined,
  petId: undefined,
  quantity: undefined,
  shipDate: undefined,
  status: undefined,
  complete: undefined,
};

const apiConfig: ApiConfig = {
  path: "/store/order",
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

export const placeOrder: Api = createApi<Api>(requestSchema, defaultValues, apiConfig);

export namespace placeOrder { // eslint-disable-line @typescript-eslint/no-namespace
  export type Form = ApiRequestForm;
  export type Request = ApiRquest;
  export type Response = ApiResponse;
}
