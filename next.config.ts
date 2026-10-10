import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // GitHub Pages で配信するため静的ファイルとして書き出す
  output: "export",
  // GitHub Pages ではリポジトリ名のパス (/todo) 配下になる。ワークフローから渡す
  basePath: process.env.PAGES_BASE_PATH ?? "",
};

export default nextConfig;
