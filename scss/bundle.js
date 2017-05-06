'use strict'

var gulpAutoprefixer = require('gulp-autoprefixer')
var deepExtend = require('deep-extend')
var fs = require('fs')
var gulp = require('gulp')
var gulpRename = require('gulp-rename')
var gulpRev = require('gulp-rev')
var gulpSass = require('gulp-sass')
var gulpSourcemaps = require('gulp-sourcemaps')
var mergeStream = require('merge-stream')
var path = require('path')
var exceptions = require('../exceptions')
var IllegalArgumentException = exceptions.IllegalArgumentException
var FileDoesNotExistException = exceptions.FileDoesNotExistException

/**
 * Create css bundle from scss files.
 * @param  {string} entryPath
 * @param  {string} bundlePath
 * @param  {Object} options
 * @return {Promise}
 */
function bundleScss(entryPath, bundlePath, options) {
  if (typeof entryPath !== 'string') throw new IllegalArgumentException('entryPath')
  if (typeof bundlePath !== 'string') throw new IllegalArgumentException('bundlePath')

  // Fail if a file does not exist at entryPath.
  // gulp.src does not check if file exists.
  if (!fs.existsSync(entryPath)) throw new FileDoesNotExistException(entryPath)

  options = deepExtend({
    rev: false,
    sourcemaps: true
  }, options)

  var metadata = {
    bundle: {
      name: '',
      originalName: path.basename(bundlePath)
    }
  }

  return new Promise((resolve, reject) => {
    var stream = gulp.src(entryPath)
    if (options.sourcemaps) {
      stream = stream.pipe(gulpSourcemaps.init())
    }
    stream = stream.pipe(
      gulpSass({ outputStyle: 'compressed' })
      .on('error', function onSassError(error) {
        gulpSass.logError.call(this, error)
        reject()
      })
    )
    .pipe(gulpAutoprefixer({ browsers: ['last 2 versions'] }))
    .pipe(gulpRename(bundlePath))
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
      resolve(metadata)
    })
  })
}

module.exports = bundleScss
