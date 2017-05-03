'use strict'

var autoprefixer = require('gulp-autoprefixer')
var deepExtend = require('deep-extend')
var fs = require('fs')
var gulp = require('gulp')
var rename = require('gulp-rename')
var rev = require('gulp-rev')
var sass = require('gulp-sass')
var sourcemaps = require('gulp-sourcemaps')
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
    rev: true,
    sourcemaps: true
  }, options)

  return new Promise((resolve, reject) => {
    var stream = gulp.src(entryPath)
    if (options.sourcemaps) {
      stream = stream.pipe(sourcemaps.init())
    }
    stream = stream.pipe(
      sass({ outputStyle: 'compressed' })
      .on('error', function onSassError(error) {
        sass.logError.call(this, error)
        reject()
      })
    )
    .pipe(autoprefixer({ browsers: ['last 2 versions'] }))
    .pipe(rename(bundlePath))
    if (options.rev) {
      stream = stream.pipe(rev())
    }
    if (options.sourcemaps) {
      stream = stream.pipe(sourcemaps.write('.'))
    }
    stream.pipe(gulp.dest('.'))
    .on('finish', () => {
      resolve()
    })
  })
}

module.exports = bundleScss
