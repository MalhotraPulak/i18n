import Resolver from 'jest-resolve';

function getExtension(filename) {
  return filename.split('.').pop();
}

function getExtensionsMap(platforms, extensions) {
  const extensionsMap = [];
  platforms.forEach((platform) => {
    extensions.forEach((extension) => {
      extensionsMap.push(`${platform}.${extension}`);
    });
  });
  return extensionsMap.concat(extensions);
}


async function timeFnAsync(fn, ...args) {
  const startTime = performance.now()
  const ret = await fn(...args)
  const endTime = performance.now()
  console.log(`Call to ${fn.name} took ${endTime - startTime} milliseconds`)
  return ret
}
// function test(file, hasteFS, moduleMap, rootDir, extensions) {
//   const dependencies = Array.from(hasteFS.getDependencies(file) || []);
//   // eslint-disable-next-line new-cap
//   const resolver = new Resolver.default(moduleMap, {
//     extensions,
//     hasCoreModules: true,
//     rootDir,
//   });
//   // const dependencyResolver = new DependencyResolver(resolver, hasteFS);
//   dependencies.forEach((dep) => {
//     try {
//       console.log(dep, resolver.resolveModule(file, dep));
//     } catch (err) {
//       console.log('Error:', dep, file);
//     }
//   });
//   //  dependencies.forEach((dep) => console.log(dep, resolver.resolveModule(file, dep)));
// }

const getPlatformExts = (platform: string) => [
  ".native",
  `.${platform}.js`,
  ".native.js",
  ".js",
  `.${platform}.json`,
  ".native.json",
  ".json",
  `.${platform}.ts`,
  ".native.ts",
  ".ts",
  `.${platform}.tsx`,
  ".native.tsx",
  ".tsx",
  `.${platform}.jsx`,
  ".native.jsx",
  ".jsx",
];

export { timeFnAsync, getExtension, getExtensionsMap, getPlatformExts };
