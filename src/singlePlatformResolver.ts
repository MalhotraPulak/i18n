import * as Resolver from 'enhanced-resolve';
import * as path from 'path';
import * as fs from 'fs';
import { getPlatformExts } from './utils.js';

export default class SinglePlatformResolver {
  hasteFS: any;
  resolvers: any;
  constructor({platforms, hasteFS, mainFields}) {
    this.hasteFS = hasteFS;
    const resolver = Resolver.default;
    const cache = new Resolver.default.CachedInputFileSystem(fs, 10000);

    this.resolvers = platforms.map((platform: string) => 
      resolver.create.sync({
        mainFields,
        fileSystem: cache,
        mainFiles: ["index"],
        extensions: getPlatformExts(platform),
      })
    );
    console.log(getPlatformExts(platforms[0]))
  }

  multiResolve(module) {
    const filePath = module
    module = path.dirname(module)
    // console.log(filePath)
    const unresolved: string[] = this.hasteFS.getDependencies(filePath);
    // console.log(filePath, unresolved)
    const resolved = [];
    const errors = []; 
    unresolved.forEach((dep) => {
      const resolvedDep = []
      this.resolvers.forEach((resolver) => {
        try {
          resolvedDep.push(resolver(module, dep))
        } catch (err) {
          // console.log(err)
          return
        }
      })
      if (resolvedDep.length === 0) {
        errors.push([filePath, dep])
      } else {
        resolved.push(...resolvedDep)
      }
    })
    return {resolved, errors} 
  }
}

