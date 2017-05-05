'use strict'

var deepExtend = require('deep-extend')
var browserify = require('browserify-incremental')
var vinylBuffer = require('vinyl-buffer')
var gulp = require('gulp')
var gulpRev = require('gulp-rev')
var gulpSourcemaps = require('gulp-sourcemaps')
var gulpUglify = require('gulp-uglify')
var mergeStream = require('merge-stream')
var path = require('path')
var vinylSourceStream = require('vinyl-source-stream')
var exceptions = require('../exceptions')
var IllegalArgumentException = exceptions.IllegalArgumentException

/**
 * Track npm bundles for incremental builds.
 */
var _npmBundles = {}

/**
 * Create browserify bundle.
 * @param {string} entryPath path to package.json
 * @param {Object} options
 * @return {BrowserifyBundle}
 */
function _createBundle(entryPath, options) {
  var browserifyBundle = browserify({
    cache: {},
    packageCache: {},
    debug: options.sourcemaps
  })
  // If path is relative, require package.json relative to cwd.
  if (!path.isAbsolute(entryPath)) {
    entryPath = path.normalize(path.join(process.cwd(), entryPath))
  }
  const packageJson = require(entryPath)
  const vendors = Object.keys(packageJson.dependencies)
  vendors.forEach((vendor) => {
    // node_modules will be installed next to manifest.
    browserifyBundle.require(`./node_modules/${vendor}`, {
      basedir: path.dirname(entryPath),
      expose: vendor
    })
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
    if (options.uglify) {
      stream = stream.pipe(gulpUglify())
    }
    if (options.rev) {
      stream = stream.pipe(gulpRev())
    }
    if (options.sourcemaps) {
      stream = stream.pipe(gulpSourcemaps.write('.'))
    }
    stream = stream.pipe(gulp.dest('.'))

    // Record rev in manifest.
    if (options.manifest) {
      var manifestStream = stream
      .pipe(gulpRev.manifest(options.manifest))
      .pipe(gulp.dest(process.cwd()))
      stream = mergeStream(stream, manifestStream)
    }
    stream.on('finish', () => {
      resolve()
    })
  })
}

/**
 * Bundle npm modules.
 * @param {string} entryPath path to package.json
 * @param {string} bundlePath
 * @param {Object} options
 * @return {Promise}
 */
function bundleNpm(entryPath, bundlePath, options) {
  if (typeof entryPath !== 'string') throw new IllegalArgumentException('entryPath')
  if (typeof bundlePath !== 'string') throw new IllegalArgumentException('bundlePath')

  options = deepExtend({
    manifest: '',
    rev: false,
    sourcemaps: false,
    uglify: true
  }, options)

  var npmBundle = _npmBundles[options.tsconfig]
  if (!npmBundle) {
    npmBundle = _createBundle(entryPath, options)
    _npmBundles[options.tsconfig] = npmBundle
  }
  return _bundle(npmBundle, bundlePath, options)
}

module.exports = bundleNpm
