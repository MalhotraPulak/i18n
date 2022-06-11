import * as babel from '@babel/core'
import cliProgress from 'cli-progress';
import _traverse from '@babel/traverse';
import chalk from 'chalk';
import * as fs from 'fs';
import { pkgUp } from 'pkg-up';
import * as path from 'path';
import memoize from "memoizee";
import WorkerPool from 'workerpool';
import swc from '@swc/core';
import toBabel from 'swc-to-babel';
import { getExtension } from './utils.js';

function isTargetNode(node, extractorFunctionName: string) {
  return node.arguments
    && node.arguments.length > 0
    && node.arguments[0].type === 'StringLiteral'
    && node.callee
    && (node.callee.name === extractorFunctionName
      || (node.callee.property
        && node.callee.property.name === extractorFunctionName));
}

function getAstBabel(code, filename) {
    const { ast } = babel.transformSync(code, {
      filename,
      presets: [
        '@babel/preset-typescript',
        '@babel/preset-react',
        // '@babel/preset-flow',
      ],
      plugins: [['@babel/plugin-proposal-decorators', { legacy: true }]],
      code: false,
      ast: true,
    });
    return ast
}

function getAstSwc(code, filename) {
    let syntax: "ecmascript" | "typescript";
    if (getExtension(filename) === "js" || getExtension(filename) === "jsx") {
      syntax = "ecmascript"
    } else {
      syntax = "typescript"
    }
    // console.log(syntax)
    // console.log(code)
    const ast = toBabel(swc.parseSync(code, {
      syntax,
      tsx: true,
      jsx: true,
      decorators: true,
      topLevelAwait: true,
      dynamicImport: true,

    }), code);
    return ast
}


function processor(extractorFunctionName: string, code: string, filename: string) {
  const stringsFound = [];
  const traverse = _traverse.default;
  try {
    // const ast = getAstBabel(code, filename);
    const ast = getAstSwc(code, filename);
    // traverseAST(ast) 
    // console.log(ast)
    // console.log(ast)
    traverse(ast, {
      CallExpression(path) {
        const { node } = path;
        // console.log(node)
        if (isTargetNode(node, extractorFunctionName)) {
          // console.log("here")
          stringsFound.push(node.arguments[0].value);
        }
      },
    });
  } catch (err) {
    console.log(filename, err)
    return false;
  }

  return stringsFound;
}

// async function processFiles(allFiles: string[], extractorFunctionName: string) {
//   const allCodes = [];
//   const errorFiles = [];
//   const stringsFound = [];
//   let done = 0;
//   const bar1 = new cliProgress.SingleBar(
//     {},
//     cliProgress.Presets.shades_classic,
//   );
//   bar1.start(allFiles.length, 0);
//   await Promise.all(
//     Array.from(allFiles).map(async (file) => {
//       const code = await fs.promises.readFile(file, {encoding: 'utf8'});
//       allCodes.push(code);
//       const ret = processor(extractorFunctionName, code, file);
//       if (!ret) {
//         errorFiles.push(file);
//       } else {
//         stringsFound.push(...ret);
//       }
//       done += 1;
//       bar1.update(done);
//     }),
//   ).catch(console.log);
//   bar1.stop();
//   return { errorFiles, stringsFound };
// }
async function workerPoolInit() {
  const pool = WorkerPool.pool(path.join(path.resolve(), './dist/multithreading/myWorker.js'), { minWorkers: 'max' })
  const poolProxy = await pool.proxy()
  // console.log(pool.minWorkers, pool.maxWorkers)
  return { poolProxy, pool }
}


async function processFile(filename, extractorFunctionName) {
  const code = await fs.promises.readFile(filename, { encoding: 'utf8' });
  return processor(extractorFunctionName, code, filename);
}

async function processFiles(allFiles: string[], extractorFunctionName: string) {
  const { poolProxy, pool } = await workerPoolInit()
  const errorFiles = [];
  const stringsFound = [];
  await Promise.all(
    allFiles.map(async (file) => {
      const ret = await poolProxy.processFile(file, extractorFunctionName)
      // const ret = await processFile(file, extractorFunctionName)
      if (!ret) {
        errorFiles.push(file);
      } else {
        stringsFound.push(...ret);
      }
    }),
  ).catch(console.log);
  pool.terminate()
  return { errorFiles, stringsFound };
}


async function stringExtractor(allFiles: string[], extractorFunctionName: string) {
  const { errorFiles, stringsFound } = await processFiles(
    Array.from(allFiles),
    extractorFunctionName
  );
  console.log(
    chalk.bold(`❯ ${chalk.blue(errorFiles.length)} files failed to parse`),
  );
  if (errorFiles.length) console.log(errorFiles);

  const stringsSet = new Set(stringsFound);
  console.log(
    chalk.bold(
      `❯ Found ${chalk.blue(
        stringsFound.length,
      )} strings out of which ${chalk.blue(stringsSet.size)} are unique`,
    ),
  );
  if (stringsFound.length) console.log(new Set(stringsFound));
}

async function getNearestPackageForFile(file: string, memoPkgUp) {
  return await memoPkgUp({ cwd: path.dirname(file) })
}

async function getNearestPackage(allFiles: string[]) {
  const memoPkgUp = memoize(pkgUp);
  return await Promise.all(allFiles.map(async (file: string) => ({
    file: file,
    package: await getNearestPackageForFile(file, memoPkgUp)
  })))
}




export { stringExtractor, getNearestPackage, processFile }