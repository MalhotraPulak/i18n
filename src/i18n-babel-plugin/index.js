export default function() {
  return {
    pre(state) {
      this.extractedStrings = []
      const extractorFunctionName = state.extractorFunction
      console.log(extractorFunctionName)
      this.isTargetNode = (node) => node.arguments
      && node.arguments.length > 0
      && node.arguments[0].type === 'StringLiteral'
      && node.callee
      && (node.callee.name === extractorFunctionName
        || (node.callee.property
          && node.callee.property.name === extractorFunctionName));
    },
    visitor: {
      CallExpression(path) {
        const { node } = path;
        if (this.isTargetNode(node)) {
          this.extractedStrings.push(node.arguments[0].value);
        }
      },
    }, 
    post() {
      console.log(this.extractedStrings) 
    }
  }
}