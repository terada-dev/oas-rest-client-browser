import type { AxiosResponse, AxiosRequestConfig } from "axios";
import type { ApiConfig } from "./axiosHelper";

/**
 * axiosのレスポンス情報からファイルを生成する。
 * 「responseType="arraybuffer"」の場合に呼ばれる想定。
 * 
 * @param response レスポンス情報
 * @returns ファイル情報
 */
export function arrayBuffertoFile<T>(response: AxiosResponse<T>) {
  const contentDisposition = response.headers['content-disposition'];
  const fileName = getFileNameFromContentDisposition(contentDisposition) ?? 'noTitle';
  const type = String(response.headers["Content-Type"] ?? response.headers["content-type"] ?? "text/plain");
  return new File([response.data as unknown as BlobPart], fileName, { type }) as T;
}

/**
 * content-dispositionヘッダの値からファイル名を抽出する
 * 
 * @param disposition 「content-disposition」ヘッダの値
 * @return 抽出されたファイル名
 */
function getFileNameFromContentDisposition(disposition: string): string | undefined {
  const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/; // 正規表現でfilenameを抜き出す
  const matches = filenameRegex.exec(disposition);
  if (matches != null && matches[1]) {
    const fileName = matches[1].replace(/['"]/g, '');
    return decodeURIComponent(fileName).replace(/\+/g, ' '); // 日本語対応
  } else {
    return undefined;
  }
}

/**
 * ファイルダウンロードを行うリクエスト処理。
 * ファイルコンテンツページをgetリクエストしてブラウザにファイル保存を任せる方式。
 * @example
 * const apiClient: (req: Request) => Promise<Response> = async (req: Request) => {
 *   const axiosConfig = createAxiosConfig(apiConfig, req);
 *   if (zodSchema.description === "operationIdOfDownloadHugeFile") {
 *     return downloadByAnchor(apiConfig, axiosConfig);
 *   }
 *   ...
 * };
 * 
 * @param apiConfig API設定
 * @param axiosConfig axios設定
 */
export async function downloadByAnchor(apiConfig: ApiConfig, axiosConfig: AxiosRequestConfig) {

  if (axiosConfig.url == null) {
    throw Error(`送信先URLが設定されていないAPIリクエストを検出しました。${JSON.stringify(axiosConfig)}`);
  }

  // ベースURLを取得
  const baseURL = axiosConfig.baseURL ?? '';

  // URLにクエリパラメータを設定
  const url = (axiosConfig.params == null) 
                ? `${baseURL}${axiosConfig.url}`
                : `${baseURL}${axiosConfig.url}?${axiosConfig.params}`;

  // アンカーリンクで指定URLをgetリクエストする
  const a = document.createElement('a');
  a.download = '';
  a.href = url;
  document.body.appendChild(a);
  a.onclick = function () {
    if (a.parentNode != null) {
      a.parentNode.removeChild(a);
    }
  };
  a.click();
  
  // ダミーのファイル応答を返す
  return new File([""], "dummy", { type: "text/plane" });
}
