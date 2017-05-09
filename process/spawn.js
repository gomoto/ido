const child_process = require('child_process')

/**
 * Spawn a child process for the given command.
 * Returned promise resolves if exit code is 0 and rejects otherwise.
 * @param {string} command
 * @return {Promise}
 */
module.exports = function spawn(command) {
  const commandTokens = command.split(' ')
  return new Promise((resolve, reject) => {
    child_process.spawn(commandTokens[0], commandTokens.slice(1), {
      stdio: [process.stdin, process.stdout, process.stderr]
    })
    .on('close', (code) => {
      code === 0 ? resolve(code) : reject(code)
    })
  })
}
