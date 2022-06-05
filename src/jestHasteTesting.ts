import JestHasteMap from 'jest-haste-map';
import { resolve } from 'path';
import chalk from 'chalk';
import { cpus } from 'os';

async function test() {
  const rootDir = "/private/tmp/zulip-mobile"
  // const file = "index.js"
  // const rootDir = "."
  const file = "/private/tmp/zulip-mobile/node_modules/react-native-gesture-handler/lib/commonjs/index.js" 
  const root = resolve(process.cwd(), rootDir);
  console.log(
    chalk.bold(`❯ Building HasteMap for directory ${chalk.blue(root)}`),
  );

  // const extensionsMap = getExtensionsMap(platforms, extensions);

  const hasteMapOptions = {
    extensions: ["cjs", "js", "android.js", "jsx", "ts", "tsx"],
    platforms: [],
    rootDir: root,
    roots: [root],
    maxWorkers: cpus().length,
    retainAllFiles: true,
    useWatchman: false,
    watch: false,
    getSha1: true
  };
  // eslint-disable-next-line new-cap
  const hasteMap = new JestHasteMap.default(hasteMapOptions);
  await hasteMap.setupCachePath(hasteMapOptions);
  const { hasteFS } = await hasteMap.build();
  console.log(hasteFS.getDependencies(file));
  console.log(hasteFS.getSize(file));
  // console.log(hasteFS.getModuleName(file));
  // console.log(hasteFS.getAllFiles());
}

test()