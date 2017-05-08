'use strict'

var deepExtend = require('deep-extend')
var gulp = require('gulp')
var gulpImagemin = require('gulp-imagemin')
var gulpLivereload = require('gulp-livereload')
var helpers = require('../helpers')
var exceptions = require('../exceptions')
var IllegalArgumentException = exceptions.IllegalArgumentException

/**
 * Copy images, optionally minifying and revisioning them.
 * @param {string} srcGlob glob for source files
 * @param {string} destDir destination directory
 * @param {Object} options
 * @return {Promise}
 */
function copyImages(srcGlob, destDir, options) {
  if (typeof srcGlob !== 'string') throw new IllegalArgumentException('srcGlob')
  if (typeof destDir !== 'string') throw new IllegalArgumentException('destDir')

  options = deepExtend({
    minify: false,
    rev: false
  }, options)

  var manifest = {}

  return new Promise((resolve, reject) => {
    var stream = gulp.src(srcGlob)
    if (options.minify) {
      stream = stream.pipe(gulpImagemin())
    }
    if (options.rev) {
      stream = helpers.reviseFileName(stream, manifest)
    }
    stream.pipe(gulp.dest(destDir))
    .on('finish', () => {
      // Manually notify livereload server: piping to gulp-livereload will
      // trigger two reloads if sourcemaps are in the file stream.
      // Start livereload server if it is not yet running.
      if (options.livereload) {
        gulpLivereload.listen()
        gulpLivereload.changed(options.livereload)
      }
      resolve(manifest)
    })
  })
}

module.exports = copyImages
