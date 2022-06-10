import esbuild from "esbuild";
import flow from "esbuild-plugin-flow";
// import { babelFlowPlugin } from 'esbuild-plugin-babel-flow'
import chalk from "chalk";
import * as fs from "fs";
import { stringExtractor, getNearestPackage } from "./fileProcessor.js";
import { getPlatformExts, timeFnAsync } from "./utils.js"
import { performance } from 'perf_hooks';

async function getAllFilesPerPlatform({
  entryPoints,
  platform,
  packagesBlacklist,
}) {

  console.log(
    chalk.bold(`Getting all files for ${chalk.blue(platform)} platform`)
  );
  let result = await esbuild.build({
    entryPoints,
    bundle: true,
    outdir: "/tmp/trash/",
    resolveExtensions: getPlatformExts(platform),
    metafile: true,
    platform: "node",
    mainFields: ["react-native", "browser", "main"],
    // plugins: [flow(/node_modules\/react-native.*\.jsx?$|node_modules\/@react-native.*\.jsx?$|\.flow\.jsx?$/, true)],
    // plugins: [flow(/\.jsx?$/, true)],
    external: packagesBlacklist,
    loader: {
      ".js": "jsx",
    },
  });

  const metadata = result.metafile;
  const files = Object.keys(metadata.inputs);
  // console.log(result.metafile)
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
  const entryPoints = ['/Users/pulak.malhotra/intern/quirk/App.tsx']
  // const entryPoints = ["/Users/pulak.malhotra/intern/eigen/index.android.js", "/Users/pulak.malhotra/intern/eigen/index.ios.js"];
  // const entryPoints = ["/Users/pulak.malhotra/intern/eigen/index.android.js"];
  // const entryPoints = ['/Users/pulak.malhotra/intern/i18n/product/entry-point.js'];
  // const entryPoints = ["/Users/pulak.malhotra/intern/devhub/packages/mobile/index.js"]
  // const entryPoints = ["/Users/pulak.malhotra/intern/zulip-mobile/index.js"]
  // const entryPoints = ["/Users/pulak.malhotra/intern/i18n/product/entry-point.js"]

  const platforms = ["android"];
  const extractorFunctionName = "t";
  const packagesBlacklist = [
    "*.png",
    "*.ttf",
    "*.webp",
    "*.svg",
    "images/*",
    "*.json",
    "@react-*",
    "react-*",
    "react-native-screens",
    "@react-native-mapbox-gl",
    "react-native-svg",
    "@expo*",
    "@sentry*",
    "relay-runtime*",
    "core-js",
    "lodash",
    "rn*",
    "@invertase"
  ];
  return { entryPoints, platforms, extractorFunctionName, packagesBlacklist };
}

async function main() {
  const { entryPoints, platforms, packagesBlacklist, extractorFunctionName } =
    initialize();
  const allFiles = await timeFnAsync(getAllFiles, entryPoints, platforms, packagesBlacklist)
  await timeFnAsync(stringExtractor, allFiles, extractorFunctionName)
  await timeFnAsync(getNearestPackage, allFiles)
}

main();
export default main;
