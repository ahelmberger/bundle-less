'use strict';

var fs           = require('fs');
var path         = require('path');
var less         = require('less');
var cssesc       = require('cssesc');
var csswring     = require('csswring');
var autoprefixer = require('autoprefixer-core');

module.exports = function (content, options) {
  var inputFile = path.resolve(options.from);
  var outputFile = path.resolve(options.to);
  var baseDir = path.resolve(options.base || '.');
  var sourceRoot = options.sourceRoot || '';
  var lessOptions = options.less || {};
  lessOptions.filename = inputFile;
  lessOptions.sourceMap = { sourceMapFileInline: false, sourceMapBasepath: baseDir };
  var promise = less.render(content, lessOptions).then(function (result) {
    result = options.autoprefixer ? prefix(inputFile, result, options.autoprefixer) : result;
    result = options.csswring ? wring(inputFile, result, options.csswring) : result;
    result = sanitizeSourceMap(result, { inputFile: inputFile, outputCssFile: outputFile, baseDir: baseDir, sourceRoot: sourceRoot });
    result = injectSourceMappingComment(result, { outputFile: outputFile, outputMapFile: outputFile + '.map' });
    return result;
  });
  if (options.embedErrors) {
    promise = promise.catch(createCssErrorResult);
  }
  return promise;
};

function prefix(file, input, options) {
  var result = autoprefixer(options).process(input.css, {
    from: file,
    to: file.replace(/\.less$/i, '.css'),
    map: { inline: false, prev: input.map }
  });
  return {
    css: result.css,
    map: JSON.stringify(result.map)
  };
}

function wring(file, input, options) {
  var result = csswring(options).wring(input.css, {
    from: file,
    to: file.replace(/\.less$/i, '.css'),
    map: { inline: false, prev: input.map }
  });
  return {
    css: result.css,
    map: JSON.stringify(result.map)
  };
}

function sanitizeSourceMap(input, options) {
  var sourceMap = JSON.parse(input.map);
  var mapFileDir = path.dirname(options.inputFile);
  sourceMap.sourcesContent = sourceMap.sources.map(function (source) {
    return fs.readFileSync(path.resolve(mapFileDir, source), 'utf-8');
  });
  sourceMap.sources = sourceMap.sources.map(function (source) {
    return path.relative(path.resolve(options.baseDir), path.resolve(mapFileDir, source)).replace(/\\/g, '/');
  });
  sourceMap.sourceRoot = options.sourceRoot;
  sourceMap.file = path.basename(options.outputCssFile);
  return {
    css: input.css,
    map: JSON.stringify(sourceMap)
  };
}

function injectSourceMappingComment(input, options) {
  var sourceMapUrl = path.basename(options.outputFile + '.map').replace(/\\/g, '/');
  return {
    css: input.css + '\n/*# sourceMappingURL=' + sourceMapUrl + ' */',
    map: input.map
  };
}

function createCssErrorResult(error) {
  var rules = {
    'display': 'block',
    'z-index': '1000',
    'position': 'fixed',
    'top': '0',
    'left': '0',
    'right': '0',
    'font-size': '.9em',
    'padding': '1.5em 1em 1.5em 4.5em',
    'color': 'white',
    'background': 'linear-gradient(#DF4F5E, #CE3741)',
    'border': '1px solid #C64F4B',
    'box-shadow': 'inset 0 1px 0 #EB8A93, 0 0 .3em rgba(0, 0, 0, .5)',
    'white-space': 'pre',
    'font-family': 'monospace',
    'text-shadow': '0 1px #A82734',
    'content': '"' + cssesc('' + error, { quotes: 'double' }) + '"'
  };
  var combinedRules = Object.keys(rules).map(function (key) {
    return key + ':' + rules[key];
  });
  return {
    css: 'html::before{' + combinedRules.join(';') + '}',
    map: ''
  };
}
