'use strict'

var deepExtend = require('deep-extend')
var fs = require('fs')
var gulp = require('gulp')
var htmlInjector = require('html-injector')
var htmlMinifierStream = require('html-minifier-stream')
var gulpReplace = require('gulp-replace')
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
        collapseInlineTagWhitespace: true,
        processScripts: ['text/ng-template']
      }))
    }
    stream = stream.pipe(vinylSourceStream(bundlePath))
    .pipe(vinylBuffer())

    // Replace revised file names.
    if (options.manifests) {
      var manifest = deepExtend({}, ...options.manifests)
      Object.keys(manifest).forEach((manifestKey) => {
        stream = stream.pipe(gulpReplace(manifestKey, manifest[manifestKey]))
      })
    }
    stream.pipe(gulp.dest('.'))
    .on('finish', () => {
      resolve()
    })
  })
}

module.exports = bundleHtml
