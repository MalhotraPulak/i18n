import * as Resolver from 'enhanced-resolve';
import * as path from 'path';

export default class MultiEnhancedResolver {
  hasteFS: any;
  resolvers: any;
  constructor({extensions, hasteFS, mainFields}) {
    this.hasteFS = hasteFS;
    const resolver = Resolver.default;
    console.log(extensions, mainFields)
    // one resolver for each main field
    const fieldResolvers = mainFields.map((mainField) =>
      resolver.create.sync({
        extensions: [],
        mainFields: [mainField]
      })
    ) 

    const extensionResolvers = extensions.map((ext) => 
      resolver.create.sync({
        extensions: [`.${ext}`],
        mainFields: [],
        mainFiles: ["index"],
      })
    )
    this.resolvers = fieldResolvers.concat(extensionResolvers)
    console.log(this.resolvers)
  }

  multiResolve(module) {
    const filePath = module
    module = path.dirname(module)
    const unresolved = this.hasteFS.getDependencies(filePath);
    const resolved = [];
    const errors = []; 
    unresolved.forEach((dep) => {
      const resolvedDep = []
      this.resolvers.forEach((resolver) => {
        try {
          resolvedDep.push(resolver(module, dep))
        } catch {
          return
        }
      })
      if (resolvedDep.length === 0) {
        errors.push([module, dep])
      } else {
        resolved.push(...resolvedDep)
      }
    })
    return {resolved, errors} 
  }
}

