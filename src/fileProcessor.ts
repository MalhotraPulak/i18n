import * as babel from '@babel/core'
import cliProgress from 'cli-progress';
import _traverse from '@babel/traverse';
import chalk from 'chalk';
import * as fs from 'fs';
import {pkgUp} from 'pkg-up';
import * as path from 'path';
import memoize from "memoizee";

function processor(extractorFunctionName: string, code: string, filename: string) {
  const stringsFound = [];
  const traverse = _traverse.default;

  const isTargetNode = (node) => node.arguments
    && node.arguments.length > 0
    && node.arguments[0].type === 'StringLiteral'
    && node.callee
    && (node.callee.name === extractorFunctionName
      || (node.callee.property
        && node.callee.property.name === extractorFunctionName));

  try {
    const { ast } = babel.transformSync(code, {
      filename,
      presets: [
        '@babel/preset-typescript',
        '@babel/preset-react',
        '@babel/preset-flow',
      ],
      plugins: [['@babel/plugin-proposal-decorators', { legacy: true }]],
      code: false,
      ast: true,
    });

    traverse(ast, {
      CallExpression(path) {
        const { node } = path;
        if (isTargetNode(node)) {
          stringsFound.push(node.arguments[0].value);
        }
      },
    });
  } catch (err) {
    return false;
  }

  return stringsFound;
}

async function processFiles(allFiles: string[], extractorFunctionName: string) {
  const allCodes = [];
  const errorFiles = [];
  const stringsFound = [];
  let done = 0;
  const bar1 = new cliProgress.SingleBar(
    {},
    cliProgress.Presets.shades_classic,
  );
  bar1.start(allFiles.length, 0);
  await Promise.all(
    Array.from(allFiles).map(async (file) => {
      const code = await fs.promises.readFile(file, {encoding: 'utf8'});
      allCodes.push(code);
      const ret = processor(extractorFunctionName, code, file);
      if (!ret) {
        errorFiles.push(file);
      } else {
        stringsFound.push(...ret);
      }
      done += 1;
      bar1.update(done);
    }),
  ).catch(console.log);
  bar1.stop();
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
  return await memoPkgUp({cwd: path.dirname(file)}) 
}

async function getNearestPackage(allFiles: string[]) {
  const memoPkgUp = memoize(pkgUp);
  return await Promise.all(allFiles.map(async (file: string) => ({
    file: file,
    package: await getNearestPackageForFile(file, memoPkgUp)
  })))
}




export {stringExtractor, getNearestPackage}