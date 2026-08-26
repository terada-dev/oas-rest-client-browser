import { createAxiosConfig, arrayBuffertoFile } from "./lib/";
import type { ApiConfig, ApiType } from "./lib/";
import { axiosInstance } from "../lib/axios";

/**
 * API生成処理
 * 
 * @param zodSchema 入力フォーム・リクエストデータの型情報を持つzodスキーマ(descriptionにoperationIdを格納)
 * @param defaultValue OASから得られたデフォルト値
 * @param apiConfig axios呼び出し情報
 * @returns API
 */
export function createApi<Api extends ApiType>(
  zodSchema: ReturnType<Api['zodSchema']>,
  defaultValue: ReturnType<Api['defaultValues']>,
  apiConfig: ApiConfig): Api {

  const apiClient: (req: Request) => Promise<Response> = async (req: Request) => {
    const axiosConfig = createAxiosConfig(apiConfig, req);
    const response = await axiosInstance.request<Response>(axiosConfig);

    // arrayBufferの場合はファイルを生成して返却
    if (apiConfig.responseType === 'arraybuffer') {
      return arrayBuffertoFile(response);
    }
    return response.data;
  };
  
  const api = Object.assign(apiClient, {
    zodSchema: () => zodSchema,
    defaultValues: () => defaultValue,
  });
  return api as Api;
}
