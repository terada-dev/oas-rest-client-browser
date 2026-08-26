import SwaggerParser from "@apidevtools/swagger-parser";
import { normalizeDocument } from "./normalize/normalize.ts";
import type { OpenAPIV3 } from "openapi-types";
import { listApiInfo } from "./apiInfo.ts";

import { isOasV3Document, createRequestData } from "./utils/oasUtils.ts";
import { normalSchemaToZod, normalSchemaToType, normalSchemaToDefaultValues } from "./converter/index.ts";
import { createCodeText } from "./codeGen/codeTextCreator.ts";
import { copyAssets, writeFile } from "./codeGen/generateFile.ts";
import { getCommandLineInfo } from "./utils/argUtils.ts";

const OUTPUT_DIR = "./api";

async function main() {

  // コマンドライン引数の確認
  const cmdInfo = getCommandLineInfo();
  if (cmdInfo.specPath == null && !cmdInfo.help) {
    console.warn("OpenAPI定義ファイルのパスが指定されていません");
    cmdInfo.help = true;
  }
  if (cmdInfo.help) {
    showHelp();
    process.exit(0);
  }

  // OAS定義所を読み込みバージョンを確認
  const parser = new SwaggerParser();
  const doc = await parser.bundle(cmdInfo.specPath!);
  if (!isOasV3Document(doc)) {
    console.error("Not Support OAS Version (only v3.0 available).");
    process.exit(1);
  }

  // OAS定義から REST API Client を作成
  await generateRestClientCode(doc, cmdInfo.name!);

  console.info(`${OUTPUT_DIR}/ にファイルを出力しました。`)  

}

function showHelp() {
  const message = `
Usage: main.ts [options] [OAS-Path]

options:
  -n, --name     APIを格納するフォルダ名 (default: codeGen)
  -h, --help     本メッセージを表示
`;
  console.info(message);
}

async function generateRestClientCode(origDoc: OpenAPIV3.Document, folderName: string) {

  const doc = normalizeDocument(origDoc as OpenAPIV3.Document);

  let isFirst = true;
  const indexList = [];
  const apiList = listApiInfo(doc);
  for (const api of apiList) {

    if (api.schemaType.request === "loop" || api.schemaType.response === "loop") {
      console.warn(`[${api.operationId}] ループ構造を持つスキーマが含まれるため生成処理をスキップします。`);
      continue;
    }
    if (api.schemaType.request === "not" || api.schemaType.response === "not") {
      console.warn(`[${api.operationId}] スキーマにnotを含むため生成処理をスキップします。`);
      continue;
    }

    const reqData = createRequestData(doc, api.parameter, api.request);
    const zodCode = normalSchemaToZod(doc, reqData);
    const typeCode = normalSchemaToType(doc, api.response);
    const defaultValueCode = normalSchemaToDefaultValues(doc, reqData);

    const codeText = createCodeText(api, zodCode, typeCode, defaultValueCode);
    if (isFirst) {
      copyAssets(OUTPUT_DIR);
      isFirst = false;
    }
    writeFile(`${OUTPUT_DIR}/${folderName}/${api.operationId}.ts`, codeText);
    indexList.push(`export * from "./${api.operationId}";`)
  }
  
  writeFile(`${OUTPUT_DIR}/${folderName}/index.ts`, indexList.join("\n"));
  writeFile(`${OUTPUT_DIR}/index.ts`, `export * from "./${folderName}";`);
}

main();