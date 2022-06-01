import * as babel from "@babel/core";
import JestHasteMap from "jest-haste-map";
import { cpus } from "os";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";
import yargs from "yargs";
import chalk from "chalk";
import Resolver from "jest-resolve";
import { DependencyResolver } from "jest-resolve-dependencies";
import fs, { read } from "fs";
import DependencyResolverFactory from "./dependencyResolverFactory.js";
import cliProgress from "cli-progress";
import _traverse from "@babel/traverse";

function processor(extractorFunctionName, code, filename) {
  let stringsFound = [];
  try {
    const { ast: ast } = babel.transformSync(code, {
      filename: filename,
      presets: [
        "@babel/preset-typescript",
        "@babel/preset-react",
        "@babel/preset-flow",
      ],
      plugins: [["@babel/plugin-proposal-decorators", { legacy: true }]],
      code: false,
      ast: true,
    });
    const traverse = _traverse.default;
    traverse(ast, {
      CallExpression: function (path) {
        const node = path.node;
        if (
          node.arguments &&
          node.arguments.length > 0 &&
          node.arguments[0].type === "StringLiteral" &&
          node.callee &&
          node.callee.name === extractorFunctionName
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

async function processFiles(allFiles, processor) {
  const allCodes = [];
  const errorFiles = [];
  const stringsFound = [];
  let done = 0;
  const bar1 = new cliProgress.SingleBar(
    {},
    cliProgress.Presets.shades_classic
  );
  bar1.start(allFiles.length, 0);
  await Promise.all(
    Array.from(allFiles).map(async (file) => {
      const code = await fs.promises.readFile(file, "utf8");
      allCodes.push(code);
      const ret = processor(code, file);
      if (!ret) {
        errorFiles.push(file);
      } else {
        stringsFound.push(...ret);
      }
      bar1.update(++done);
    })
  ).catch(console.log);
  bar1.stop();
  return { errorFiles, stringsFound };
}

async function getStringsToTranslate({
  entryPoint,
  rootDir,
  extensions,
  extractorFunctionName,
}) {
  const root = resolve(process.cwd(), rootDir);
  console.log(
    chalk.bold(`❯ Building HasteMap for directory ${chalk.blue(root)}`)
  );

  const hasteMapOptions = {
    extensions,
    name: "jest-bundler",
    platforms: [],
    rootDir: root,
    roots: [root],
    maxWorkers: cpus().length,
  };
  const hasteMap = new JestHasteMap.default(hasteMapOptions);

  await hasteMap.setupCachePath(hasteMapOptions);
  const { hasteFS, moduleMap } = await hasteMap.build();

  const entryPointAbsolute = entryPoint.map((entryPoint) => {
    let absolutePath = resolve(process.cwd(), entryPoint);
    if (!hasteFS.exists(absolutePath)) {
      throw new Error(
        chalk.red(
          `${entryPoint} does not exist. Please provide a path to valid file`
        )
      );
    }
    return absolutePath;
  });

  console.log(chalk.bold(`❯ Resolving dependencies recursively`));

  const resolverOpts = {
    hasCoreModules: true,
    rootDir: root,
  };

  const depFactory = new DependencyResolverFactory(
    extensions,
    moduleMap,
    resolverOpts,
    hasteFS
  );
  const queue = entryPointAbsolute;
  const allFiles = new Set();

  while (queue.length) {
    const module = queue.shift();

    if (allFiles.has(module)) {
      continue;
    }

    allFiles.add(module);
    let dependencies = depFactory.multiResolve(module);
    queue.push(...dependencies);
  }

  console.log(chalk.bold(`❯ Found ${chalk.blue(allFiles.size)} files`));
  const { errorFiles, stringsFound } = await processFiles(
    Array.from(allFiles),
    (code, filename) => {
      return processor(extractorFunctionName, code, filename);
    }
  );
  console.log(
    chalk.bold(`❯ ${chalk.blue(errorFiles.length)} files could not be parsed`)
  );
  errorFiles.length && console.log(errorFiles);
  const stringsSet = new Set(stringsFound);
  console.log(
    chalk.bold(
      `❯ Found ${chalk.blue(
        stringsFound.length
      )} strings out of which ${chalk.blue(stringsSet.size)} are unique`
    )
  );
  stringsFound.length && console.log(new Set(stringsFound));
}
export default getStringsToTranslate;

// getStringsToTranslate({
//   entryPoint: ["./product/entry-point.js"],
//   rootDir: "./product",
//   extensions: ["ios.js", "js", "tsx", "ts"],
//   extractorFunctionName: "getString"
// });
getStringsToTranslate({
  entryPoint: ["../i18n/eigen/index.android.js", "../i18n/eigen/index.ios.js"],
  rootDir: "../i18n/eigen",
  extensions: ["ios.js", "js", "tsx", "ts"],
  extractorFunctionName: "useFeatureFlag",
});
