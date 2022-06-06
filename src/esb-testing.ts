import esbuild from 'esbuild';
import flow from 'esbuild-plugin-flow';
import {babelFlowPlugin} from 'esbuild-plugin-babel-flow'

const getPlatformExts = (platform) => [".native", `.${platform}.js`, ".native.js", ".js", `.${platform}.json`, ".native.json",".json", `.${platform}.ts`, ".native.ts",".ts", `.${platform}.tsx`, ".native.tsx", ".tsx"]

async function getAllFiles(entryPoints, platform) {
  let result =  await esbuild.build({
      entryPoints,
      bundle: true,
      outfile: "/tmp/trash/trash.txt",
      resolveExtensions: getPlatformExts(platform),
      metafile: true,
      platform: 'node',
      mainFields: ["browser", "main"],
      plugins: [flow(/node_modules\/react-native.*\.jsx?$|node_modules\/@react-native.*\.jsx?$|\.flow\.jsx?$/, true)],
      // external: ["@devhub/core"], // FIX THIS 
      loader: {  '.js': 'jsx',
                 '.png': 'file',
                '.ttf': 'file' }});
  // results.push(result)
  const metadata = result.metafile;
  const files = Object.keys(metadata.inputs);
  console.log(files)
  console.log(files.length)
  return Array.from(files)
}

// const entryPoints = ['/private/tmp/quirk/App.tsx']
const entryPoints = ['/private/tmp/devhub/packages/mobile/index.js']
const files = getAllFiles(entryPoints, "android")
