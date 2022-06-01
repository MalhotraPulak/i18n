import Resolver from "jest-resolve";
import { DependencyResolver } from "jest-resolve-dependencies";

export default class DependencyResolverFactory {
  constructor(extensions, moduleMap, options, hasteFS) {
    this._resolvers = extensions.map(
      (extension) =>
        new Resolver.default(moduleMap, {
          ...options,
          extensions: ["." + extension],
        })
    );
    this.depResolvers = this._resolvers.map(
      (resolver) => new DependencyResolver(resolver, hasteFS)
    );
  }

  multiResolve(module) {
    let newDependencies = [];
    this.depResolvers.forEach((depResolver) => {
      newDependencies.push(...depResolver.resolve(module));
    });
    return newDependencies;
  }
}
