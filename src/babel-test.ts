import babel from '@babel/core';
import { CloneBasenamePlugin } from 'enhanced-resolve';
import fs from 'fs/promises';

async function test(){
  const filename = "../zulip-mobile/src/nav/ZulipNavigationContainer.js";
  const opts = babel.loadOptions({
    filename,
    caller: {
      name: 'esbuild-plugin-babel-flow',
      supportsStaticESM: true,
    },
    presets: ['@babel/preset-flow'],
  });
  const codeWithFlow = await fs.readFile(filename, 'utf-8');
  console.log(codeWithFlow)
  let transformedCode = {};
  try {
    transformedCode = await babel.transformAsync(codeWithFlow, opts);
  } catch (error) {
    console.log("from babel flow", error.message);
  }
  console.log(transformedCode)
}

test()