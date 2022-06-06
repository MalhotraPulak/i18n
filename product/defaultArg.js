const fn = (x = require("./fromDefaultArg.js")) => {
  console.log(x);
};

fn();
export default function getString(x) {
  return x
}