'use strict'

var deepExtend = require('deep-extend')
var gulp = require('gulp')
var gulpConcat = require('gulp-concat')
var gulpRev = require('gulp-rev')
var gulpSourcemaps = require('gulp-sourcemaps')
var gulpUglify = require('gulp-uglify')
var path = require('path')
var wiredep = require('wiredep')
var exceptions = require('../exceptions')
var IllegalArgumentException = exceptions.IllegalArgumentException

/**
 * Concatenate bower modules into one JavaScript bundle.
 * @param {string} bowerJsonPath
 * @param {string} bowerComponentsPath
 * @param {string} bundlePath
 * @param {Object} options
 * @return {Promise}
 */
function concatenateBower(bowerJsonPath, bowerComponentsPath, bundlePath, options) {
  if (typeof bowerJsonPath !== 'string') throw new IllegalArgumentException('bowerJsonPath')
  if (typeof bowerComponentsPath !== 'string') throw new IllegalArgumentException('bowerComponentsPath')
  if (typeof bundlePath !== 'string') throw new IllegalArgumentException('bundlePath')

  options = deepExtend({
    rev: false,
    sourcemaps: false,
    minify: false
  }, options)

  var metadata = {
    bundle: {
      name: '',
      originalName: path.basename(bundlePath)
    }
  }

  // If bower.json path is relative, require it relative to cwd.
  if (!path.isAbsolute(bowerJsonPath)) {
    bowerJsonPath = path.normalize(path.join(process.cwd(), bowerJsonPath))
  }

  return new Promise((resolve, reject) => {
    // bower_components might not be installed next to bower.json
    const dependencies = wiredep({
      directory: bowerComponentsPath,
      bowerJson: require(bowerJsonPath)
    })
    var stream = gulp.src(dependencies.js)
    if (options.sourcemaps) {
      stream = stream.pipe(gulpSourcemaps.init({ loadMaps: true }))
    }
    stream = stream.pipe(gulpConcat(bundlePath))
    if (options.minify) {
      stream = stream.pipe(gulpUglify())
    }
    if (options.rev) {
      stream = stream.pipe(gulpRev())
    }
    // Record bundle name.
    // Do this before gulp-sourcemaps adds a file to the stream.
    stream.on('data', (file) => {
      metadata.bundle.name = path.basename(file.path)
    })
    if (options.sourcemaps) {
      stream = stream.pipe(gulpSourcemaps.write('.'))
    }
    stream.pipe(gulp.dest('.'))
    .on('finish', () => {
      resolve()
    })
  })
}

module.exports = concatenateBower
