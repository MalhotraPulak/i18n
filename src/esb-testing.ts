import esbuild from 'esbuild';
import flow from 'esbuild-plugin-flow';
// import { babelFlowPlugin } from 'esbuild-plugin-babel-flow'
import chalk from 'chalk'
import * as fs from 'fs';
import { stringExtractor } from './fileProcessor.js';

const getPlatformExts = (platform) => [".native", `.${platform}.js`, ".native.js", ".js", `.${platform}.json`, ".native.json", ".json", `.${platform}.ts`, ".native.ts", ".ts", `.${platform}.tsx`, ".native.tsx", ".tsx", `.${platform}.jsx`, ".native.jsx", ".jsx"]

async function getAllFiles(entryPoints, platform) {
  let result = await esbuild.build({
    entryPoints,
    bundle: true,
    outfile: "/tmp/trash/trash.txt",
    resolveExtensions: getPlatformExts(platform),
    metafile: true,
    platform: 'node',
    mainFields: ["react-native", "browser", "main"],
    // plugins: [flow(/node_modules\/react-native.*\.jsx?$|node_modules\/@react-native.*\.jsx?$|\.flow\.jsx?$/, true)],
    plugins: [flow(/\.jsx?$/, true)],
    external: ["*.png", 
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
    ], // FIX THIS 
    loader: {
      '.js': 'jsx',
      '.png': 'file',
      '.ttf': 'file',
      '.webp': 'file'
    }
  });
  // results.push(result)
  const metadata = result.metafile;
  const files = Object.keys(metadata.inputs);
  // console.log(files)
  // console.log(files.length)
  return Array.from(files)
}

// const entryPoints = ['/private/tmp/quirk/App.tsx']
async function main() {
  // const entryPoints = ['/Users/pulak.malhotra/intern/eigen/index.android.js'];
  const entryPoints = ['/Users/pulak.malhotra/intern/i18n/product/entry-point.js'];
  const allFiles: Set<string> = new Set();
  const platforms = ["android", "ios"];
  const extractorFunctionName = "getString";
  await Promise.all(platforms.map(async (platform) => {
    const files = await getAllFiles(entryPoints, platform);
    files.forEach(allFiles.add, allFiles);
  }));
  console.log(chalk.bold(`Found ${chalk.blue(allFiles.size)} files`));
  fs.writeFile('./files.json', JSON.stringify(Array.from(allFiles)), (err) => err?console.log(err): null);
  stringExtractor(Array.from(allFiles), extractorFunctionName)
}

main()
