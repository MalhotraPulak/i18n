### Package for i18n strings retrieval

To run modify the function call at the bottom of the `app.js` file to suit your needs
```js
getStringsToTranslate({
  entryPoints: ['../i18n/quirk/App.tsx'],
  rootDir: '../i18n/quirk',
  extensions: ['android.js', 'ios.js', 'js', 'jsx', 'tsx', 'ts'],
  extractorFunctionName: 't',
});
```
The run the following command on terminal,
```bash
node app.mjs 
```