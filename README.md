# bundle-less

Compiles LESS, autoprefixes and minifies the resulting CSS, creates a source map.

## How it works

This module compiles LESS code provided as a string into CSS. It can optionally add vendor prefixes using [autoprefixer](https://www.npmjs.com/package/autoprefixer) and minify the resulting CSS using [csswring](https://www.npmjs.com/package/csswring). It also creates a fully functional source map. The produced source map will contain all source content, so there is no need to host the source files.

## Usage

Use [npm](http://npmjs.org) to install it:

~~~sh
npm install bundle-less --save-dev
~~~

Then use it like this:

~~~js
var bundleLess = require('bundle-less');

// call `bundleLess` providing your LESS source code and an options object:
var promise = bundleLess('body { margin: 0; }', {
  from: 'styles.less',
  to: 'styles.css',
  csswring: { removeAllComments: true },
  autoprefixer: { browsers: ['last 3 versions'] }
});

// the returned promise resolves to an object containing CSS and source map:
promise.then(function (result) {
  fs.writeFileSync('styles.css', result.css);
  fs.writeFileSync('styles.css.map', result.map);
});
~~~

## Options

### from

Absolute or relative path to the LESS file (does not have to exist, it is just used for import resolution and source map generation).

### to

Absolute or relative path to the output CSS file (will not be written, it is just used for source map generation).

### base

Absolute or relative path to the "server" roor folder (used for source map generation).

### sourceRoot

Will be prepended to each source file within the source map. This option is optional, the default value is the empty string.

### less

Options object that will get passed to the [LESS](http://lesscss.org/) compiler. The file name and source map options will be overridden by this module. This option is optional, if omitted, the default options will be used.

### csswring

Options object that will get passed to csswring. Available options can be found [here](https://www.npmjs.com/package/csswring#options). This option is optional, if omitted, the CSS will not be minified.

### autoprefixer

Options object that will get passed to autoprefixer. Available options can be found [here](https://www.npmjs.com/package/autoprefixer-core#usage). This option is optional, if omitted, no vendor prefixes will be added.

### embedErrors

Optional. If truthy, in case of an error, instead of rejecting the returned promise, the output CSS will contain an error notification (source map will be empty). This is provided for development workflows to give early feedback inside the browser about style errors.

## Changelog

__0.0.2__ Add optional error notification output

__0.0.1__ Initial version

---
Licensed under the MIT license
