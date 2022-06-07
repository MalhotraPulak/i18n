import JestHasteMap from 'jest-haste-map';
import { resolve } from 'path';
import chalk from 'chalk';
import * as fs from 'fs';
import MultiDependencyResolver from './multiDependencyResolver.js';
import MultiEnhancedResolver from './multiEnhancedResolver.js'
import { getExtension, getExtensionsMap } from './utils.js';
import { cpus } from 'os';
import { stringExtractor} from './fileProcessor.js'

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
  const enhancedDepFactory = new MultiEnhancedResolver({extensions: extensionsMap, hasteFS, mainFields: ["main"]})
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

  stringExtractor(Array.from(allFiles), extractorFunctionName);

}
export default getStringsToTranslate;

// FIXME
// getStringsToTranslate({
//   entryPoints: ['/Users/pulak.malhotra/Desktop/i18n/devhub/packages/mobile/index.js'],
//   rootDir: '/Users/pulak.malhotra/Desktop/i18n/devhub',
//   platforms: ['web', 'android', 'ios', 'shared'],
//   extensions: ['js', 'jsx', 'tsx', 'ts'],
//   extractorFunctionName: 't',
// });
// getStringsToTranslate({
//   entryPoints: ['./product/entry-point.js'],
//   rootDir: './product',
//   extensions: ['js', 'jsx', 'tsx', 'ts'],
//   platforms: ['web', 'android', 'native', 'ios', 'shared'],
//   extractorFunctionName: 'getString',
// });
// getStringsToTranslate({
//   entryPoints: ["../zulip-mobile/index.js"],
//   rootDir: '../zulip-mobile',
//   platforms: ['android'],
//   extensions: ['cjs', 'js', 'jsx', 'tsx', 'ts'],
//   extractorFunctionName: 't',
// });
getStringsToTranslate({
  entryPoints: ['/Users/pulak.malhotra/intern/eigen/index.android.js'],
  rootDir: '/Users/pulak.malhotra/intern/eigen/',
  platforms: ['android'],
  extensions: ['js', 'jsx', 'tsx', 'ts'],
  extractorFunctionName: 't',
});