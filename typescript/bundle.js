'use strict'

var deepExtend = require('deep-extend')
var browserify = require('browserify-incremental')
var vinylBuffer = require('vinyl-buffer')
var gulp = require('gulp')
var gulpSourcemaps = require('gulp-sourcemaps')
var gulpUglify = require('gulp-uglify')
var vinylSourceStream = require('vinyl-source-stream')
var tsify = require('tsify')
var helpers = require('../helpers')
var exceptions = require('../exceptions')
var IllegalArgumentException = exceptions.IllegalArgumentException

/**
 * Track typescript bundles for incremental builds.
 */
var _typescriptBundles = {}

/**
 * Create browserify bundle.
 * @param {string} entryPath
 * @param {Object} options
 * @return {BrowserifyBundle}
 */
function _createBundle(entryPath, options) {
  var browserifyBundle = browserify({
    cache: {},
    packageCache: {},
    entries: [entryPath],
    debug: options.sourcemaps
  })

  // Transpile TypeScript.
  browserifyBundle.plugin(tsify, { project: options.tsconfig })

  if (options.minifyModules) {
    browserifyBundle.transform('uglifyify')
  }

  // Exclude some modules from main bundle.
  options.external.forEach((external) => {
    browserifyBundle.external(external)
  })

  return browserifyBundle
}

/**
 * Write bundle file to disk.
 * @param {BrowserifyBundle} browserifyBundle
 * @param {string} bundlePath
 * @param {Object} options
 * @return {Promise}
 */
function _bundle(browserifyBundle, bundlePath, options) {
  var manifest = {}

  return new Promise((resolve, reject) => {
    var stream = browserifyBundle.bundle()
    .on('error', (err) => {
      reject(err)
    })
    .pipe(vinylSourceStream(bundlePath))
    .pipe(vinylBuffer())
    if (options.sourcemaps) {
      stream = stream.pipe(gulpSourcemaps.init({ loadMaps: true }))
    }
    if (options.minify) {
      stream = stream.pipe(gulpUglify())
    }
    if (options.rev) {
      stream = helpers.reviseFileName(stream, manifest)
    }
    if (options.sourcemaps) {
      stream = stream.pipe(gulpSourcemaps.write('.'))
    }
    stream.pipe(gulp.dest('.'))
    .on('finish', () => {
      resolve(manifest)
    })
  })
}

/**
 * Bundle TypeScript modules.
 * @param {string} entryPath
 * @param {string} bundlePath
 * @param {Object} options
 * @return {Promise}
 */
function bundleTypescript(entryPath, bundlePath, options) {
  if (typeof entryPath !== 'string') throw new IllegalArgumentException('entryPath')
  if (typeof bundlePath !== 'string') throw new IllegalArgumentException('bundlePath')

  options = deepExtend({
    external: [],
    // Minify entire bundle
    minify: false,
    // Minify each module in bundle. Useful in incremental development builds.
    minifyModules: false,
    rev: false,
    sourcemaps: false,
    tsconfig: './tsconfig.json'
  }, options)

  var typescriptBundle = _typescriptBundles[options.tsconfig]
  if (!typescriptBundle) {
    typescriptBundle = _createBundle(entryPath, options)
    _typescriptBundles[options.tsconfig] = typescriptBundle
  }
  return _bundle(typescriptBundle, bundlePath, options)
}

module.exports = bundleTypescript
