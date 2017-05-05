'use strict'

var deepExtend = require('deep-extend')
var gulp = require('gulp')
var gulpSourcemaps = require('gulp-sourcemaps')
var gulpTypescript = require('gulp-typescript')
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
 * Transpile TypeScript to JavaScript, keeping the same directory structure.
 * @param  {string} srcGlob glob for source files
 * @param  {string} destDir destination directory
 * @param  {Object} options
 * @return {Promise}
 */
function transpileTypescript(srcGlob, destDir, options) {
  if (typeof srcGlob !== 'string') throw new IllegalArgumentException('srcGlob')
  if (typeof destDir !== 'string') throw new IllegalArgumentException('destDir')

  options = deepExtend({
    manifest: '',
    sourcemaps: false,
    tsconfig: './tsconfig.json'
  }, options)

  return new Promise((resolve, reject) => {
    var stream = gulp.src(srcGlob)
    if (options.sourcemaps) {
      stream = stream.pipe(gulpSourcemaps.init())
    }
    var gulpTypescriptProject = getGulpTypescriptProject(options.tsconfig)
    stream = stream.pipe(gulpTypescriptProject())
    if (options.sourcemaps) {
      stream = stream.pipe(gulpSourcemaps.write('.'))
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

module.exports = transpileTypescript
