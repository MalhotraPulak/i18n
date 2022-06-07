import esbuild from 'esbuild';
import flow from 'esbuild-plugin-flow';
import { babelFlowPlugin } from 'esbuild-plugin-babel-flow'
import chalk from 'chalk'
import * as fs from 'fs';

const getPlatformExts = (platform) => [".native", `.${platform}.js`, ".native.js", ".js", `.${platform}.json`, ".native.json", ".json", `.${platform}.ts`, ".native.ts", ".ts", `.${platform}.tsx`, ".native.tsx", ".tsx"]

async function getAllFiles(entryPoints, platform) {
  let result = await esbuild.build({
    entryPoints,
    bundle: true,
    outfile: "/tmp/trash/trash.txt",
    resolveExtensions: getPlatformExts(platform),
    metafile: true,
    platform: 'node',
    mainFields: ["sbmodern", "react-native", "browser", "main"],
    // plugins: [flow(/node_modules\/react-native.*\.jsx?$|node_modules\/@react-native.*\.jsx?$|\.flow\.jsx?$/, true)],
    plugins: [flow(/\.jsx?$/, true)],
    external: ["*.png", 
    "*.ttf", 
    "images/*",
    "*.json",
    "@react-*",
    "react-*",
    "@expo*"
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
  const entryPoints = ['/Users/pulak.malhotra/intern/eigen/index.android.js'];
  const allFiles = new Set();
  const platforms = ["android", "ios"];
  await Promise.all(platforms.map(async (platform) => {
    const files = await getAllFiles(entryPoints, platform);
    files.forEach(allFiles.add, allFiles);
  }));
  console.log(chalk.bold(`Found ${chalk.blue(allFiles.size)} files`));
  fs.writeFile('files.json', JSON.stringify(allFiles), console.log);
}

main()
