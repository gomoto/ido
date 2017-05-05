'use strict'

var deepExtend = require('deep-extend')
var gulp = require('gulp')
var gulpRev = require('gulp-rev')
var mergeStream = require('merge-stream')
var exceptions = require('../exceptions')
var IllegalArgumentException = exceptions.IllegalArgumentException

/**
 * Copy files, optionally revisioning them.
 * @param  {string} srcGlob glob for source files
 * @param  {string} destDir destination directory
 * @param  {Object} options
 * @return {Promise}
 */
function copyFiles(srcGlob, destDir, options) {
  if (typeof srcGlob !== 'string') throw new IllegalArgumentException('srcGlob')
  if (typeof destDir !== 'string') throw new IllegalArgumentException('destDir')

  options = deepExtend({
    manifest: '',
    rev: true
  }, options)

  return new Promise((resolve, reject) => {
    var stream = gulp.src(srcGlob)
    if (options.rev) {
      stream = stream.pipe(gulpRev())
    }
    stream = stream.pipe(gulp.dest(destDir))

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

module.exports = copyFiles
