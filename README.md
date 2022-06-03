### Package for i18n strings retrieval

To run modify the function call at the bottom of the `app.js` file to suit your needs
```js
getStringsToTranslate({
  entryPoints: ['./product/entry-point.js'],
  rootDir: './product',
  extensions: ['js', 'jsx', 'tsx', 'ts'],
  platforms: ['web', 'android', 'native', 'ios', 'shared'],
  extractorFunctionName: 'getString',
});
```
The run the following command on terminal,
```bash
yarn install
yarn dev
node dist/index.js 
```