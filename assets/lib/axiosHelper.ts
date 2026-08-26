/* eslint-disable @typescript-eslint/no-explicit-any */
import type { AxiosRequestConfig } from 'axios';

// 各APIの設定情報
export type ApiConfig = {
  /** パス */
  path: string,
  /** メソッド */
  method: "get" | "put" | "post" | "delete" | "options" | "head" | "patch" | "trace",
  /** リクエストのコンテンツタイプ */
  contentType?: string,
  /** クエリパラメータの名前 */
  queryParamNames: string[],
  /** レスポンスの種別 */
  responseType: "arraybuffer" | "json" | "text",
};

export function createAxiosConfig(apiConfig: ApiConfig, reqData: unknown): AxiosRequestConfig {

  // リクエストデータが Record<string, any> 型ではない場合は指定されたリクエストデータをそのまま送信
  if (reqData == null || !isObject(reqData)) {
    const headers = (apiConfig.contentType == null) ? null : {
      'Content-Type': apiConfig.contentType,
    };
    return {
      url: apiConfig.path,
      method: apiConfig.method,
      ...(headers == null ? {} : {headers}),
      ...(reqData == null ? {} : {data: reqData}),
      responseType: apiConfig.responseType,
    };
  }
  assertObject(reqData);

  // リクエストデータからパスパラメータ、クエリパラメータを分離
  const [url, dataWithoutPathParam] = applyPathParameter(apiConfig.path, reqData);
  const [postData, queryParameter]  = getQueryParameter(dataWithoutPathParam, apiConfig.queryParamNames);

  // コンテンツタイプに応じて data に渡す情報を変える
  const data = apiConfig.contentType === 'multipart/form-data'               ? toForm(postData) : 
               apiConfig.contentType === 'application/x-www-form-urlencoded' ? toParam(postData) :
                                                                               ('$body' in (postData ?? {})) ? postData.$body : postData;

  let headers = null;
  if (apiConfig.contentType != null) {
    headers = {
      'Content-Type': apiConfig.contentType,
    };
  }

  return {
    url: queryParameter != null ? [url, queryParameter].join('?') : url,
    method: apiConfig.method,
    ...(apiConfig.contentType == null ? {} : {contentType: apiConfig.contentType}),
    ...(data == null ? {} : {data}),
    ...(headers == null ? {} : {headers}),
    responseType: apiConfig.responseType,
  };
}

/**
 * URLにパスパラメータを適用する。
 * URLにパスパラメータが含まれている場合はargオブジェクトの該当キーで置換する。
 * dataオブジェクトから該当キーを除去したオブジェクトを作成し、置換後パスとともに返却する。
 * 
 * 例：
 *   result = applyPathParameter('/users/{userId}', {role: 1, userId: 'aaa'});
 *   result[0] === '/users/aaa';
 *   result[1] === {role: 1};
 * 
 * @param path パス
 * @param data リクエストデータ
 */
function applyPathParameter(path: string, data: Record<string, any>): [string, Record<string, any>] {

  // パスパラメータ({}で囲まれた単語)がない場合は元の値をそのまま返却
  if (!path.includes('{')) {
    return [path, data];
  }

  // パスパラメータを使ってURLを置換
  const pathParams: Array<string> = [];
  const newPath = path.replace(/\{[^}]*\}/g, pathParam => {
    pathParam = pathParam.slice(1, -1);
    pathParams.push(pathParam);
    if (data[pathParam] == null) {
      throw new Error(`パスパラメータが不正です。URL=${path}、パラメータ=${pathParam}、引数=${JSON.stringify(data)}`);
    }
    return data[pathParam];
  });
  
  // パスパラメータで使用されたパラメータを引数情報から除去
  const newData = Object.entries(data)
                      .filter(([key]) => !pathParams.includes(key))
                      .reduce((acc, [key, val]) => Object.assign(acc, {[key]: val}), {} as Record<string, any>);
  return [newPath, newData];
}

/**
 * クエリパラメータを取得する。
 * 指定パラメータ名を使ってクエリパラメータ文字列を生成する。
 * dataオブジェクトから該当キーを除去したオブジェクトを作成し、クエリパラメータ文字列とともに返却する。
 * 
 * 例：
 *   result = getQueryParameter({role: [1, 2, 3], userId: 'aaa'}, ['role']);
 *   result[0] === {userId: 'aaa'};
 *   result[1] === ?role=1&role=2&role=3;
 * 
 * @param data リクエストデータ
 * @param queryParameterNames クエリパラメータになるパラメータ名一覧
 */
function getQueryParameter(data: Record<string, any>, queryParameterNames: string[]): [Record<string, any>, string | undefined] {

  // クエリパラメータを使わない場合は元の値をそのまま返却
  if (queryParameterNames.length === 0 || !isObject(data)) {
    return [data, undefined];
  }
  
  // データをクエリパラメータ用のオブジェクトとそれ以外に分ける
  const queryParamEntries = [];
  const newDataEntries = [];
  for (const [key, value] of Object.entries(data)) {
    if (queryParameterNames.includes(key)) {
      queryParamEntries.push([key, value]);
    } else {
      newDataEntries.push([key, value]);
    }
  }

  // クエリパラメータと未使用パラメータのオブジェクトを返却
  const queryParameter = queryParamEntries.length === 0 ? undefined : toParam(Object.fromEntries(queryParamEntries));
  const newData = Object.fromEntries(newDataEntries);
  return [newData, queryParameter];
}

/**
 * JSONオブジェクトまたはArrayをクエリパラメータに変換する
 * (spring bootで扱える形式。PHPだとこの形は扱えない。)
 *
 * JSONオブジェクトの場合はkey、valueをそのままクエリパラメータに格納する。
 *   {key1: val1, key2: val2} 
 *      ?key1=val1&key2=val2
 * 
 * 同一キーに複数データがある場合は該当のキーに対するvalueを複数回格納する。
 *   {key1: [val1, val2]}
 *      ?key1=val1&key1=val2
 *
 * valueがオブジェクトの場合は JSON.stringify() を行った文字列を格納する。
 *   {key1: {key2: val2, key3: val3}}
 *      `?key1=${JSON.stringify({key2: val2, key3: val3})}`
 *
 * valueがnullまたはundefinedのキーは格納しない。
 *   {key1: val1, key2: null, key3: undefined, key4: val4}
 *      ?key1=val1&key4=val4
 *
 * データの格納順番が決められている場合はオブジェクトのArrayを引数に渡せば順番に格納される。
 *  [{key1: val1}, {key2: val2}, {key1: val3}]
 *      ?key1=val1&key2=val2&key1=val3
 *
 * @param data リクエストデータ
 * 
 */
function toParam(data: Record<string, any>): string | undefined {
  const urlSearchParams = new URLSearchParams();
  const dataItems: Array<Record<string, any>> = Array.isArray(data) ? data : [data];
  dataItems.forEach((item: any) => {
    for (const [key, val] of Object.entries(item)) {
      const values = Array.isArray(val) ? val : [val];
      for (let v of values) {
        if (v == null) {
          continue;
        }
        if (isObject(v)) {
          v = JSON.stringify(v);
        }
        urlSearchParams.append(key, v);
      }
    }
  });
  return urlSearchParams.toString();
}

/**
 * JSONオブジェクトまたはArrayをFormDataオブジェクトに変換する
 *
 * JSONオブジェクトの場合はkey、valueをそのままFormDataに格納する。
 *   {key1: val1, key2: val2} 
 *      formData.append(key1, val1); 
 *      formData.append(key2, val2);
 * 
 * 同一キーに複数データがある場合は該当のキーに対するvalueを複数回格納する。
 *   {key1: [val1, val2]}
 *      formData.append(key1, val1); 
 *      formData.append(key1, val2);
 *
 * valueがオブジェクトの場合は JSON.stringify() を行った文字列を格納する。
 *   {key1: {key2: val2, key3: val3}}
 *      formData.append(key1, JSON.stringify({key2: val2, key3: val3}))
 *
 * valueがnullまたはundefinedのキーは格納しない。
 *   {key1: val1, key2: null, key3: undefined, key4: val4}
 *      formData.append(key1, val1);
 *      formData.append(key4, val4);
 *
 * データの格納順番が決められている場合はオブジェクトのArrayを引数に渡せば順番に格納される。
 *  [{key1: val1}, {key2: val2}, {key1: val3}]
 *      formData.append(key1, val1);
 *      formData.append(key2, val2);
 *      formData.append(key1, val3);
 *
 */
function toForm(data: Record<string, any>) {
  const formData = new FormData();
  const objArray: Array<Record<string, any>> = Array.isArray(data) ? data : [data];
  const flattenObjArray: Array<Record<string, any>> = [];
  for (const obj of objArray) {
    for (const [key, val] of Object.entries(obj)) {
      if (Array.isArray(val)) {
        val.forEach(item => flattenObjArray.push({[key]: item}));
        continue;
      }
      flattenObjArray.push({[key]: val});
    }
  }
  for (const obj of flattenObjArray) {
    for (const [key, val] of Object.entries(obj)) {
      if (val == null) {
        continue;
      }
      if (!(val instanceof File) && isObject(val)) {
        formData.append(key, JSON.stringify(val));
      } else {
        formData.append(key, val);
      }
    }
  }
  return formData;
}

function isObject(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}


function assertObject(value: unknown): asserts value is Record<string, any> {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return;
  }
  throw new Error(`API実行時に不正なパラメータを検出しました。${JSON.stringify(value)}`);
}
