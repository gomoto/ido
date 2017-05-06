'use strict'

var deepExtend = require('deep-extend')
var fs = require('fs')
var gulp = require('gulp')
var gulpFile = require('gulp-file')
var htmlInjector = require('html-injector')
var htmlMinifierStream = require('html-minifier-stream')
var gulpRevReplace = require('gulp-rev-replace')
var vinylBuffer = require('vinyl-buffer')
var vinylSourceStream = require('vinyl-source-stream')
var exceptions = require('../exceptions')
var IllegalArgumentException = exceptions.IllegalArgumentException

/**
 * Bundle index.html.
 * @param {string} entryPath
 * @param {string} bundlePath
 * @param {Object} options
 * @return {Promise}
 */
function bundleHtml(entryPath, bundlePath, options) {
  if (typeof entryPath !== 'string') throw new IllegalArgumentException('entryPath')
  if (typeof bundlePath !== 'string') throw new IllegalArgumentException('bundlePath')

  options = deepExtend({
    inject: {},
    minify: false,
  }, options)

  return new Promise((resolve, reject) => {
    var stream = fs.createReadStream(entryPath)
    if (options.inject) {
      stream = stream.pipe(htmlInjector(options.inject))
    }
    if (options.minify) {
      stream = stream.pipe(htmlMinifierStream({
        collapseWhitespace: true,
        processScripts: ['text/ng-template']
      }))
    }
    stream = stream.pipe(vinylSourceStream(bundlePath))
    .pipe(vinylBuffer())

    // Replace revision hashes.
    if (options.manifests) {
      var superManifest = deepExtend({}, ...options.manifests)
      stream = stream.pipe(gulpRevReplace({
        manifest: gulpFile('_', JSON.stringify(superManifest), {src: true})
      }))
    }
    stream.pipe(gulp.dest('.'))
    .on('finish', () => {
      resolve()
    })
  })
}

module.exports = bundleHtml
