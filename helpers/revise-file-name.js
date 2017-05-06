'use strict'

var gulpRev = require('gulp-rev')
var path = require('path')

/**
 * Revise file names according to file content. Record name changes in manifest.
 * @param {ReadableStream} fileStream
 * @param {Object} manifest
 * @return {ReadableStream}
 */
function reviseFileName(fileStream, manifest) {
  return fileStream.pipe(gulpRev())
  .on('data', (file) => {
    var originalName = path.basename(file.revOrigPath)
    var name = path.basename(file.path)
    manifest[originalName] = name
  })
}

module.exports = reviseFileName
