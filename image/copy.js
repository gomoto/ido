'use strict'

var deepExtend = require('deep-extend')
var gulp = require('gulp')
var gulpImagemin = require('gulp-imagemin')
var gulpRev = require('gulp-rev')
var mergeStream = require('merge-stream')
var exceptions = require('../exceptions')
var IllegalArgumentException = exceptions.IllegalArgumentException

/**
 * Copy images, optionally minifying and revisioning them.
 * @param  {string} srcGlob glob for source files
 * @param  {string} destDir destination directory
 * @param  {Object} options
 * @return {Promise}
 */
function copyImages(srcGlob, destDir, options) {
  if (typeof srcGlob !== 'string') throw new IllegalArgumentException('srcGlob')
  if (typeof destDir !== 'string') throw new IllegalArgumentException('destDir')

  options = deepExtend({
    // image manifest location is relative to destDir
    manifest: '',
    minify: true,
    rev: true
  }, options)

  return new Promise((resolve, reject) => {
    var stream = gulp.src(srcGlob)
    if (options.minify) {
      stream = stream.pipe(gulpImagemin())
    }
    if (options.rev) {
      stream = stream.pipe(gulpRev())
    }
    stream = stream.pipe(gulp.dest(destDir))
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

module.exports = copyImages
