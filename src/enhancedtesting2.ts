import * as fs from "fs";
import pkg from 'enhanced-resolve';
const { CachedInputFileSystem, ResolverFactory } = pkg;
// create a resolver
const myResolver = ResolverFactory.createResolver({
	// Typical usage will consume the `fs` + `CachedInputFileSystem`, which wraps Node.js `fs` to add caching.
	fileSystem: new CachedInputFileSystem(fs, 4000),
	extensions: [".ios.js", ".js", ".json"]
	/* any other resolver options here. Options/defaults can be seen below */
});

// resolve a file with the new resolver
const context = {};
const resolveContext = {};
const lookupStartPath = "./product";
const request = "./apple";
myResolver.resolve({}, lookupStartPath, request, resolveContext, (
	err /*Error*/,
	filepath /*string*/
) => {
	// Do something with the path
  if (filepath) {
    console.log(filepath)
  }
  if (err) {
    console.log(err)
  }
});