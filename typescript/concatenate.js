'use strict'

var deepExtend = require('deep-extend')
var gulp = require('gulp')
var gulpConcat = require('gulp-concat')
var gulpRev = require('gulp-rev')
var gulpSourcemaps = require('gulp-sourcemaps')
var gulpTypescript = require('gulp-typescript')
var gulpUglify = require('gulp-uglify')
var mergeStream = require('merge-stream')
var exceptions = require('../exceptions')
var IllegalArgumentException = exceptions.IllegalArgumentException

/**
 * Track gulp-typescript projects for incremental builds.
 */
var _gulpTypescriptProjects = {}

/**
 * Get gulp-typescript project for the given tsconfig file.
 * One project per tsconfig file.
 * @param {string} tsconfigPath
 * @return {GulpTypescriptProject}
 */
function getGulpTypescriptProject(tsconfigPath) {
  // Create gulp-typescript project if one does not yet exist.
  var gulpTypescriptProject = _gulpTypescriptProjects[tsconfigPath]
  if (!gulpTypescriptProject) {
    gulpTypescriptProject = gulpTypescript.createProject(tsconfigPath)
    _gulpTypescriptProjects[tsconfigPath] = gulpTypescriptProject
  }
  return gulpTypescriptProject
}

/**
 * Concatenate TypeScript into one JavaScript bundle.
 * @param {string} srcGlob glob for source files
 * @param {string} bundlePath path to output JavaScript bundle
 * @param {Object} options
 * @return {Promise}
 */
function concatenateTypescript(srcGlob, bundlePath, options) {
  if (typeof srcGlob !== 'string') throw new IllegalArgumentException('srcGlob')
  if (typeof bundlePath !== 'string') throw new IllegalArgumentException('bundlePath')

  options = deepExtend({
    manifest: '',
    rev: false,
    sourcemaps: false,
    tsconfig: './tsconfig.json',
    minify: false
  }, options)

  return new Promise((resolve, reject) => {
    var stream = gulp.src(srcGlob)
    if (options.sourcemaps) {
      stream = stream.pipe(gulpSourcemaps.init())
    }
    var gulpTypescriptProject = getGulpTypescriptProject(options.tsconfig)
    stream = stream.pipe(gulpTypescriptProject())
    stream = stream.pipe(gulpConcat(bundlePath))
    if (options.minify) {
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

module.exports = concatenateTypescript
