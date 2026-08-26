# oas-rest-client-browser
Open API(3.0) のドキュメントからブラウザ向けの RESTクライアント、typescript型定義、zodスキーマを生成する。

## 利用イメージ

- インプットファイル (oas.yaml)
```yaml
openapi: 3.0.0
paths:
  /login:
    post:
      operationId: login
      summary: ログイン
      description: アカウント列挙攻撃対策として、認証NGは統一した応答を返す
      requestBody:
        content:
          "application/json":
            schema:
              type: object
              properties:
                username:
                  type: string
                  title: ユーザー名
                  maxLength: 16
                password:
                  type: string
                  title: パスワード
                  maxLength: 32
              required:
                - username
                - password
      responses:
        200:
          description: ログイン応答
          content:
            "application/json":
              schema:
                type: object
                properties:
                  name:
                    type: string
                    maxLength: 20
                  mailAddress:
                    type: string
                    maxLength: 256
                  role:
                    type: integer
                    enum:
                      - 0
                      - 1
                      - 2
                required:
                  - name
                  - role
```

- 生成処理の実施
```sh
git clone <this repository>
pnpm install
node ./src/main.ts ./oas.yaml
```

- 出力ファイル (./app/codeGen/login.ts)
```ts
/**
 * API: login
 * summary: ログイン
 * description: アカウント列挙攻撃対策として、認証NGは統一した応答を返す
 */

import { z } from "zod";
import { formField } from "../lib";
import { createApi } from "../apiClient";
import type { ApiConfig } from "../lib";

const requestSchema = z.object({
  username: formField(z.string().max(16)),
  password: formField(z.string().max(32)),
});
requestSchema.describe("login");

type ApiRequestForm = z.input<typeof requestSchema>;
type ApiRquest = z.output<typeof requestSchema>;
type ApiResponse = {
  name: string,
  mailAddress?: string,
  role: 0 | 1 | 2,
};

const defaultValues: ApiRequestForm = {
  username: "",
  password: "",
};

const apiConfig: ApiConfig = {
  path: "/login",
  method: "post",
  contentType: "application/json",
  queryParamNames: [],
  responseType: "json",
};

interface Api {
  (req: ApiRquest): Promise<ApiResponse>;  // login() でログイン処理を実行
  zodSchema(): typeof requestSchema;       // login.zodSchema() で zod 定義を取得
  defaultValues(): ApiRequestForm;         // login.defaultValues() で入力フォーム用のデフォルト値を取得
}

export const login: Api = createApi<Api>(requestSchema, defaultValues, apiConfig);

export namespace login { // eslint-disable-line @typescript-eslint/no-namespace
  export type Form = ApiRequestForm;       // login.Form で入力フォームの型定義を参照
  export type Request = ApiRquest;         // login.Request で REST API のリクエスト型を参照
  export type Response = ApiResponse;      // login.Response で REST API のレスポンス型を参照
}
```

- 利用例
```ts
import { login } from "@/api";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

export default function Login() {

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<login.Form, unknown, login.Request>({
    resolver: zodResolver(login.zodSchema()),
    defaultValues: login.defaultValues(),
  });

  const onSubmit = async (data: login.Request) => {
    const response = await login(data);
    console.log("ログイン",  JSON.stringify(response));
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
    ...(省略)
```

## 特徴

### 1. RESTクライアント生成

- OpenAPIドキュメントからRESTクライアントを生成
- リクエストデータ型は1つのオブジェクト形式で表現する
  - クエリパラメータ、パスパラメータも同じオブジェクト型に含める
  - クエリパラメータ / パスパラメータのキー値とリクエストデータのキー値がバッティングするAPIはサポート外
- 送信処理は axios を利用する

### 2. zodスキーマ生成

- リクエストデータに対して1つのzodスキーマを生成
- `z.input<typeof requestSchema>` は入力フォームの型定義を表現する
- `z.output<typeof requestSchema>` はリクエストデータの型定義を表現する
- `formField()` は以下の前処理(zod向けpreprocess処理)を実行し、入力フォーム向けの変換処理を提供する
  - 必須属性に対し undefined の入力を許容する (数値型の必須属性に空欄の入力フィールドを受け入れる)
  - optionalかつminlength > 0 の属性に対し、空文字を undefined に変換する
  - 数値型の属性に対し、文字列入力を数値に変換する
  - boolean型の属性に対し、文字列入力を数値に変換する (stringboolと同等、かつ、boolean値の入力も許容)
  - File型の属性に対し、FileList の入力を許容する

### 3. デフォルト値生成

- リクエストデータに対して1つのデフォルト値データを生成
- OpenAPIで定義されている default 値を使用する (ない場合はundefined)

### 4. レスポンス型定義生成

- typescript型定義を生成

## 想定する使用方法

- 生成されたコードは編集される想定
- OpenAPI定義が更新された場合は再度ソースコードを生成し、手動でマージする
- 基本的には個々のチェックにバリデーションエラーメッセージを定義せず、zod のデフォルトメッセージを汎用的な形にカスタマイズする

## 制限事項

- OpenAPI定義上、ループ構造を持つスキーマが存在するAPIは対象外

