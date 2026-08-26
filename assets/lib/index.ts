/* eslint-disable @typescript-eslint/no-explicit-any */

export { createAxiosConfig } from "./axiosHelper";
export type { ApiConfig } from "./axiosHelper";
export { formField } from "./zodFormInputField";
export { arrayBuffertoFile, downloadByAnchor } from "./utils";

export interface ApiType<Req = any, Res = any, Zod = any, Form = any> {
  (req: Req): Promise<Res>;
  zodSchema(): Zod;
  defaultValues(): Form;
}
