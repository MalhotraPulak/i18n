import Resolver from 'jest-resolve';
import { DependencyResolver } from 'jest-resolve-dependencies';

export default class MultiDependencyResolver {
  constructor(extensions, moduleMap, options, hasteFS) {
    this.resolvers = extensions.map(
      // eslint-disable-next-line new-cap
      (extension) => new Resolver.default(moduleMap, {
        ...options,
        extensions: [`.${extension}`],
      }),
    );
    this.depResolvers = this.resolvers.map(
      (resolver) => new DependencyResolver(resolver, hasteFS),
    );
  }

  multiResolve(module) {
    const newDependencies = [];
    this.depResolvers.forEach((depResolver) => {
      newDependencies.push(...depResolver.resolve(module));
    });
    return newDependencies;
  }
}
