'use strict';

var fs           = require('fs');
var path         = require('path');
var less         = require('less');
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
  return less.render(content, lessOptions).then(function (result) {
    result = options.autoprefixer ? prefix(inputFile, result, options.autoprefixer) : result;
    result = options.csswring ? wring(inputFile, result, options.csswring) : result;
    result = sanitizeSourceMap(result, { inputFile: inputFile, outputCssFile: outputFile, baseDir: baseDir, sourceRoot: sourceRoot });
    result = injectSourceMappingComment(result, { outputFile: outputFile, outputMapFile: outputFile + '.map' });
    return result;
  });
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
