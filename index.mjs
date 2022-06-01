import * as babel from '@babel/core';
import JestHasteMap from 'jest-haste-map';
import { resolve } from 'path';
import chalk from 'chalk';
import fs from 'fs';
import { cpus } from 'os';
import cliProgress from 'cli-progress';
import _traverse from '@babel/traverse';
// eslint-disable-next-line import/extensions
import DependencyResolverFactory from './dependencyResolverFactory.js';

function getExtension(filename) {
  return filename.split('.').pop();
}

function processor(extractorFunctionName, code, filename) {
  const stringsFound = [];
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
    const traverse = _traverse.default;
    traverse(ast, {
      CallExpression(path) {
        const { node } = path;
        if (
          node.arguments
          && node.arguments.length > 0
          && node.arguments[0].type === 'StringLiteral'
          && node.callee
          && node.callee.name === extractorFunctionName
        ) {
          stringsFound.push(path.node.arguments[0].value);
        }
      },
    });
  } catch (err) {
    return false;
  }
  return stringsFound;
}

async function processFiles(allFiles, fileProcessor) {
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
      const code = await fs.promises.readFile(file, 'utf8');
      allCodes.push(code);
      const ret = fileProcessor(code, file);
      if (!ret) {
        errorFiles.push(file);
      } else {
        stringsFound.push(...ret);
      }
      done += 1;
      bar1.update(done);
    }),
  ).catch(console.err);
  bar1.stop();
  return { errorFiles, stringsFound };
}

async function getStringsToTranslate({
  entryPoints,
  rootDir,
  extensions,
  extractorFunctionName,
}) {
  const root = resolve(process.cwd(), rootDir);
  console.log(
    chalk.bold(`❯ Building HasteMap for directory ${chalk.blue(root)}`),
  );

  const hasteMapOptions = {
    extensions,
    name: 'jest-bundler',
    platforms: [],
    rootDir: root,
    roots: [root],
    maxWorkers: cpus().length,
  };
  // eslint-disable-next-line new-cap
  const hasteMap = new JestHasteMap.default(hasteMapOptions);

  await hasteMap.setupCachePath(hasteMapOptions);
  const { hasteFS, moduleMap } = await hasteMap.build();

  const entryPointAbsolute = entryPoints.map((entryPoint) => {
    const absolutePath = resolve(process.cwd(), entryPoint);
    if (!hasteFS.exists(absolutePath)) {
      throw new Error(
        chalk.red(
          `${entryPoint} does not exist. Please provide a path to valid file`,
        ),
      );
    }
    return absolutePath;
  });

  console.log(chalk.bold('❯ Resolving dependencies recursively'));

  const resolverOpts = {
    hasCoreModules: true,
    rootDir: root,
  };

  const depFactory = new DependencyResolverFactory(
    extensions,
    moduleMap,
    resolverOpts,
    hasteFS,
  );
  const queue = entryPointAbsolute;
  const allFiles = new Set();

  while (queue.length) {
    const module = queue.shift();

    if (allFiles.has(module) || !extensions.includes(getExtension(module))) {
      continue;
    }
    
    allFiles.add(module);
    const dependencies = depFactory.multiResolve(module);
    queue.push(...dependencies);
  }

  console.log(chalk.bold(`❯ Found ${chalk.blue(allFiles.size)} files`));
  const { errorFiles, stringsFound } = await processFiles(
    Array.from(allFiles),
    (code, filename) => processor(extractorFunctionName, code, filename),
  );
  console.log(
    chalk.bold(`❯ ${chalk.blue(errorFiles.length)} files could not be parsed`),
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
export default getStringsToTranslate;

getStringsToTranslate({
  entryPoints: ['../quirk/App.tsx'],
  rootDir: '../quirk',
  extensions: ['android.js', 'ios.js', 'js', 'jsx', 'tsx', 'ts'],
  extractorFunctionName: 'getString',
});
// getStringsToTranslate({
//   entryPoints: ['../i18n/eigen/index.android.js', '../i18n/eigen/index.ios.js'],
//   rootDir: '../i18n/eigen',
//   extensions: ['android.js', 'ios.js', 'js', 'jsx', 'tsx', 'ts'],
//   extractorFunctionName: 'useFeatureFlag',
// });
