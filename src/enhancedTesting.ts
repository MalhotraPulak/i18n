import * as Resolve from 'enhanced-resolve';
import * as path from 'path';

const resolve = Resolve.default;

const x = resolve.sync("./product", "./apple", )

const myResolve = resolve.create.sync({
  extensions : [ '.web.jsx'],
  mainFields: [],
  mainFiles: ["index"]
})

let z = myResolve('/Users/pulak.malhotra/Desktop/i18n-solver/product', './jsx')
// let z = myResolve('/Users/pulak.malhotra/Desktop/i18n-solver/product', './myPkg')
console.log(z)
console.log(path.resolve(process.cwd(), z));