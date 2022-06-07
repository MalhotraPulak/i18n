import esbuild from "esbuild";
import flow from "esbuild-plugin-flow";
// import { babelFlowPlugin } from 'esbuild-plugin-babel-flow'
import chalk from "chalk";
import * as fs from "fs";
import { stringExtractor } from "./fileProcessor.js";

async function getAllFilesPerPlatform({
  entryPoints,
  platform,
  packagesBlacklist,
}) {
  const getPlatformExts = (platform) => [
    ".native",
    `.${platform}.js`,
    ".native.js",
    ".js",
    `.${platform}.json`,
    ".native.json",
    ".json",
    `.${platform}.ts`,
    ".native.ts",
    ".ts",
    `.${platform}.tsx`,
    ".native.tsx",
    ".tsx",
    `.${platform}.jsx`,
    ".native.jsx",
    ".jsx",
  ];
  console.log(
    chalk.bold(`Getting all files for ${chalk.blue(platform)} platform`)
  );
  let result = await esbuild.build({
    entryPoints,
    bundle: true,
    outfile: "/tmp/trash/trash.txt",
    resolveExtensions: getPlatformExts(platform),
    metafile: true,
    platform: "node",
    mainFields: ["react-native", "browser", "main"],
    // plugins: [flow(/node_modules\/react-native.*\.jsx?$|node_modules\/@react-native.*\.jsx?$|\.flow\.jsx?$/, true)],
    plugins: [flow(/\.jsx?$/, true)],
    external: packagesBlacklist,
    loader: {
      ".js": "jsx",
      ".png": "file",
      ".ttf": "file",
      ".webp": "file",
    },
  });

  const metadata = result.metafile;
  const files = Object.keys(metadata.inputs);

  return Array.from(files);
}

async function getAllFiles(
  entryPoints: string[],
  platforms: string[],
  packagesBlacklist: string[]
) {
  const allFiles: Set<string> = new Set();
  await Promise.all(
    platforms.map(async (platform) => {
      const files = await getAllFilesPerPlatform({
        entryPoints,
        platform,
        packagesBlacklist,
      });
      files.forEach(allFiles.add, allFiles);
    })
  );
  console.log(chalk.bold(`Found ${chalk.blue(allFiles.size)} files`));
  fs.writeFile("./files.json", JSON.stringify(Array.from(allFiles)), (err) =>
    err ? console.log(err) : null
  );
  return Array.from(allFiles);
}

function initialize() {
  // const entryPoints = ['/Users/pulak.malhotra/intern/quirk/App.tsx']
  const entryPoints = ["/Users/pulak.malhotra/intern/eigen/index.android.js"];
  // const entryPoints = ['/Users/pulak.malhotra/intern/i18n/product/entry-point.js'];
  const platforms = ["android", "ios"];
  const extractorFunctionName = "getString";
  const packagesBlacklist = [
    "*.png",
    "*.ttf",
    "images/*",
    "*.json",
    // "@react-*",
    "react-*",
    "@react-native-mapbox-gl",
    "@expo*",
    // "@sentry*",
    // "relay-runtime*",
    // "core-js",
    // "lodash"
  ];
  return { entryPoints, platforms, extractorFunctionName, packagesBlacklist };
}

async function main() {
  const { entryPoints, platforms, packagesBlacklist, extractorFunctionName } =
    initialize();
  const allFiles = await getAllFiles(entryPoints, platforms, packagesBlacklist);
  stringExtractor(allFiles, extractorFunctionName);
}

main();
export default main;
