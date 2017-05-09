'use strict'

const rimraf = require('rimraf')

/**
 * Remove files matching given glob and return a promise.
 * @param {string} glob
 * @return {Promise}
 */
function removeFile(glob) {
  return new Promise((resolve, reject) => {
    rimraf(glob, (error) => {
      error ? reject(error) : resolve()
    })
  })
}

module.exports = removeFile
