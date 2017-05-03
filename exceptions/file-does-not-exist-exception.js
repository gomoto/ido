'use strict'

class FileDoesNotExistException extends Error {
  constructor(filePath) {
    super(`File does not exist: ${filePath}`)
  }
}

module.exports = FileDoesNotExistException
