import * as babel from '@babel/core';
import JestHasteMap from 'jest-haste-map';
import { resolve } from 'path';
import chalk from 'chalk';
import * as fs from 'fs';
import { cpus } from 'os';
import cliProgress from 'cli-progress';
import _traverse from '@babel/traverse';
// import Resolver from 'jest-resolve';
// import { DependencyResolver } from 'jest-resolve-dependencies';
import MultiDependencyResolver from './multiDependencyResolver.js';
import MultiEnhancedResolver from './multiEnhancedResolver.js'

import { getExtension, getExtensionsMap } from './utils.js';

function processor(extractorFunctionName, code, filename) {
  return
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
  ).catch(console.log);
  bar1.stop();
  return { errorFiles, stringsFound };
}

async function getStringsToTranslate({
  entryPoints,
  rootDir,
  platforms,
  extensions,
  extractorFunctionName,
}) {
  const root = resolve(process.cwd(), rootDir);
  console.log(
    chalk.bold(`❯ Building HasteMap for directory ${chalk.blue(root)}`),
  );

  const extensionsMap = getExtensionsMap(platforms, extensions);

  const hasteMapOptions = {
    extensions,
    platforms,
    rootDir: root,
    roots: [root],
    maxWorkers: cpus().length,
    retainAllFiles: true,
    useWatchman: false,
    watch: false
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
  console.log(extensionsMap);

  const depFactory = new MultiDependencyResolver(
    extensionsMap,
    moduleMap,
    resolverOpts,
    hasteFS,
  );
  const enhancedDepFactory = new MultiEnhancedResolver({extensions: extensionsMap, hasteFS, mainFields: ["main", "browser"]})
  const queue = entryPointAbsolute;
  const allFiles = new Set();
  const error_deps = [];
  while (queue.length) {
    const module = queue.shift();

    if (allFiles.has(module) || !extensions.includes(getExtension(module))) {
      continue;
    }

    allFiles.add(module);
    // test(module, hasteFS, moduleMap, rootDir, extensions);
    // const {resolved, errors}= depFactory.multiResolve(module);
    const {resolved, errors} = enhancedDepFactory.multiResolve(module);
    // console.log(dependencies);
    queue.push(...resolved);
    error_deps.push(...errors);
  }
  console.log(chalk.bold(`❯ Found ${chalk.blue(allFiles.size)} files`));
  console.log(allFiles);
  console.log(chalk.bold(`❯ Failed to parse ${chalk.blue(error_deps.length)} dependencies`));
  console.log(error_deps)
  fs.writeFile('error_deps.json', JSON.stringify(error_deps), (error) => {
    if (error) throw error;
  });

  const { errorFiles, stringsFound } = await processFiles(
    Array.from(allFiles),
    (code, filename) => processor(extractorFunctionName, code, filename),
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
export default getStringsToTranslate;

// FIXME
// getStringsToTranslate({
//   entryPoints: ['../i18n/eigen/index.android.js', '../i18n/eigen/index.ios.js'],
//   rootDir: '../i18n/eigen',
//   extensions: ['js', 'jsx', 'tsx', 'ts'],
//   platforms: ['web', 'android', 'native', 'ios', 'shared'],
//   extractorFunctionName: 'useFeatureFlag',
// });
getStringsToTranslate({
  entryPoints: ['/Users/pulak.malhotra/Desktop/i18n/devhub/packages/mobile/index.js'],
  rootDir: '/Users/pulak.malhotra/Desktop/i18n/devhub',
  platforms: ['web', 'android', 'ios', 'shared'],
  extensions: ['js', 'jsx', 'tsx', 'ts'],
  extractorFunctionName: 't',
});
// getStringsToTranslate({
//   entryPoints: ['./product/entry-point.js'],
//   rootDir: './product',
//   extensions: ['js', 'jsx', 'tsx', 'ts'],
//   platforms: ['web', 'android', 'native', 'ios'],
//   extractorFunctionName: 'getString',
// });

// getStringsToTranslate({
//   entryPoints: ["../zulip-mobile/index.js"],
//   rootDir: '../zulip-mobile',
//   platforms: ['android'],
//   extensions: ['cjs', 'js', 'jsx', 'tsx', 'ts'],
//   extractorFunctionName: 't',
// });