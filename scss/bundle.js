'use strict'

var autoprefixer = require('gulp-autoprefixer')
var deepExtend = require('deep-extend')
var gulp = require('gulp')
var rename = require('gulp-rename')
var rev = require('gulp-rev')
var sass = require('gulp-sass')
var sourcemaps = require('gulp-sourcemaps')
var exceptions = require('../exceptions')
var IllegalArgumentException = exceptions.IllegalArgumentException

/**
 * Create css bundle from scss files.
 * @param  {string} entry
 * @param  {string} bundle
 * @param  {Object} options
 * @return {Promise}
 */
function bundleScss(entry, bundle, options) {
  if (typeof entry !== 'string') throw new IllegalArgumentException('entry')
  if (typeof bundle !== 'string') throw new IllegalArgumentException('bundle')

  options = deepExtend({
    rev: true,
    sourcemaps: true
  }, options)

  return new Promise((resolve, reject) => {
    var stream = gulp.src(entry)
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
    .pipe(rename(bundle))
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
