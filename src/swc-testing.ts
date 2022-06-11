import swc from '@swc/core';
import toBabel from 'swc-to-babel';
import { getExtension } from './utils.js';
import fs from 'fs'
import * as babel from '@babel/core'

async function main() {
const filename = "./Theme.tsx"

// const code = `
// (
//   a.b as any
// )
// `

const code = `
  a?.b
`
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

let syntax: "ecmascript" | "typescript";
if (getExtension(filename) === "js" || getExtension(filename) === "jsx") {
  syntax = "ecmascript"
} else {
  syntax = "typescript"
}

const swcStuff =  await swc.parse(code, {
  syntax,
  tsx: true,
  jsx: true,
  decorators: true,
  topLevelAwait: true,
  dynamicImport: true,
});
// console.log(swcStuff)
const babelstuff = getAstBabel(code, filename);
fs.writeFileSync("babelAST.json", JSON.stringify(babelstuff, null, 4))
fs.writeFileSync("swcAST.json", JSON.stringify(swcStuff, null, 4))

const ast = toBabel(swcStuff, code);
fs.writeFileSync("swcAST.json", JSON.stringify(ast, null, 4))
// fs.writeFileSync("swcAST.json", JSON.stringify(babelstuff, null , 4))
// traverseAST(ast) 
// console.log(ast)
// console.log(ast)
// traverse(ast, {
//   CallExpression(path) {
//     const { node } = path;
//     console.log(node)
//     if (isTargetNode(node, extractorFunctionName)) {
//       console.log("here")
//       stringsFound.push(node.arguments[0].value);
//     }
//   },
// });
}
main()