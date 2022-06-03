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

function test(file, hasteFS, moduleMap, rootDir, extensions) {
  const dependencies = Array.from(hasteFS.getDependencies(file) || []);
  // eslint-disable-next-line new-cap
  const resolver = new Resolver.default(moduleMap, {
    extensions,
    hasCoreModules: true,
    rootDir,
  });
  // const dependencyResolver = new DependencyResolver(resolver, hasteFS);
  dependencies.forEach((dep) => {
    try {
      console.log(dep, resolver.resolveModule(file, dep));
    } catch (err) {
      console.log('Error:', dep, file);
    }
  });
  //  dependencies.forEach((dep) => console.log(dep, resolver.resolveModule(file, dep)));
}

export { test, getExtension, getExtensionsMap };
