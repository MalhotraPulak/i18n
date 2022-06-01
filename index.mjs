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
// import * as parser from "@babel/parser";
import _traverse from "@babel/traverse";


function processor(strings, code, filename) {
  // console.log(strings, code)
  // let ast;
  // try {
  // ast = parser.parse(code, {
  //   plugins: ["@babel/plugin-syntax-jsx", "@babel/plugin-transform-typescript"],
  //   sourceType: "unambiguous",
  // });
  // } catch (err) {
  //   console.log("File:", filename)
  //   console.log(err)
  //   return
  // } 
  let x = babel.transformSync(code, {
    filename: "hello.ts",
    presets: ["@babel/preset-typescript"],
    code: false,
    ast: true
  },
  );
  let ast = x.ast
  const traverse = _traverse.default;
  traverse(ast, {
    CallExpression: function (path) {
      const node = path.node;
      if (
        node.arguments &&
        node.arguments[0].type === "StringLiteral" &&
        node.callee &&
        node.callee.name === "getString"
      ) {
        strings.push(path.node.arguments[0].value);
      }
    },
  });
}

async function processFiles(allFiles, processor) {
  const allCodes = [];
  let done = 0;
  console.log(chalk.bold(`❯ Reading ${chalk.blue(allFiles.length)} files`));
  const bar1 = new cliProgress.SingleBar(
    {},
    cliProgress.Presets.shades_classic
  );
  // bar1.start(allFiles.length, 0);
  await Promise.all(
    Array.from(allFiles).map(async (file) => {
      const code = await fs.promises.readFile(file, "utf8");
      allCodes.push(code);
      processor(code, file);
      //   bar1.update(++done);
    })
  ).catch(console.log);
  // bar1.stop();
}

async function getStringsToTranslate({
  entryPoint: entryPoint,
  rootDir: rootDir,
  extensions: extensions,
}) {
  const root = resolve(process.cwd(), rootDir);
  console.log(
    chalk.bold(`❯ Building HasteMap for directory ${chalk.blue(root)}`)
  );

  const hasteMapOptions = {
    extensions: ["js", "ts", "tsx", "jsx"],
    name: "jest-bundler",
    platforms: [],
    rootDir: root,
    roots: [root],
    maxWorkers: cpus().length,
  };
  const hasteMap = new JestHasteMap.default(hasteMapOptions);

  await hasteMap.setupCachePath(hasteMapOptions);
  const { hasteFS, moduleMap } = await hasteMap.build();

  entryPoint = entryPoint.map((entryPoint) =>
    resolve(process.cwd(), entryPoint)
  );

  for (let point of entryPoint) {
    if (!hasteFS.exists(point)) {
      console.log(
        chalk.red(
          "entryPoint does not exist. Please provide a path to valid file"
        )
      );
      return;
    }
  }

  console.log(chalk.bold(`❯ Resolving dependencies recursively`));

  const resolverOpts = {
    hasCoreModules: true,
    rootDir: root,
  };

  // const dependencyResolver = new DependencyResolver(resolver, hasteFS)
  // console.log(dependencyResolver.resolve(entryPoint))

  const depFactory = new DependencyResolverFactory(
    extensions,
    moduleMap,
    resolverOpts,
    hasteFS
  );
  const queue = entryPoint;
  const allFiles = new Set();

  while (queue.length) {
    const module = queue.shift();

    if (allFiles.has(module)) {
      continue;
    }

    allFiles.add(module);
    // console.log(module, hasteFS.getDependencies(module))
    // console.log("resolving dependencies of", module);
    // console.log(module, dependencyResolver.resolve(module))
    let dependencies = depFactory.multiResolve(module);
    // console.log(module, dependencies)
    queue.push(...dependencies);
  }

  console.log(chalk.bold(`❯ Found ${chalk.blue(allFiles.size)} files`));
  const stringsFound = [];
  await processFiles(Array.from(allFiles), (code, filename) => {
    processor(stringsFound, code, filename);
  });
  console.log(stringsFound);
}
export default getStringsToTranslate;

getStringsToTranslate({entryPoint: ["./product/entry-point.js"], rootDir: "./product", extensions: ["ios.js", "js", "tsx", "ts"]})