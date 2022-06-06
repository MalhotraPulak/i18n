module.exports = `apple ${require('./banana')} ${require('./kiwi')}`;
import y from "./importInsideFunction";
import z from "./defaultArg";
// FIXME
// let path = require('path')
// console.log(path.basename)

const fn = () => {
  const x = import('./dynamic.js');
};
