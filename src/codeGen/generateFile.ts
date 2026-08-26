import fs from "fs";
import path from "path";

export function copyAssets(toPath = "./oas-rest-client-browser/api") {
  const assetDirPath = path.resolve(import.meta.dirname, "../../assets");
  fs.cpSync(assetDirPath, toPath, { recursive: true });
}

export function writeFile(toPath: string, content: string) {
  
  // 親ディレクトリが存在しない場合は作成する
  const parentDir = path.dirname(toPath);
  fs.mkdirSync(parentDir, { recursive: true });

  // ファイルを作成
  fs.writeFileSync(toPath, content);
}