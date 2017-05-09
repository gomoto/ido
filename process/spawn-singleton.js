'use strict'

var child_process = require('child_process')
var exceptions = require('../exceptions')
var IllegalArgumentException = exceptions.IllegalArgumentException

/**
 * Processes
 */
const procs = {
  // [command: string]: ChildProcess | null | undefined
}

// Save reference to 'exit' listeners between calls to spawnSingleton.
const _listenerCache = {
  // [command: string]: Function
}

/**
 * Spawn a new process for the given command (using child_process.spawn).
 * Only one process for the given command exists at a point in time.
 * If the same command is run again, the existing process for command will be
 * killed before starting a new process.
 * @param {string} command command to run in the spawned process
 * @param {Function} done called when the spawned process completes
 */
function spawnSingleton(command, done) {
  if (typeof command !== 'string') throw new IllegalArgumentException('command')

  const proc = procs[command]

  if (proc) {
    // Process is running. Kill it before spawning new process.
    proc.once('exit', spawnProcess)
    proc.kill()
    procs[command] = null
    _listenerCache[command] = spawnProcess
  } else if (proc === null) {
    // Process is being killed. Remove old listener; add new listener.
    proc.removeListener('exit', _listenerCache[command])
    proc.once('exit', spawnProcess)
    _listenerCache[command] = spawnProcess
  } else {
    // No process. Spawn a new one.
    spawnProcess()
  }

  function spawnProcess() {
    const commandTokens = command.split(' ')
    const proc = child_process.spawn(commandTokens[0], commandTokens.slice(1))
    proc.stdout.on('data', (data) => process.stdout.write(data))
    proc.stderr.on('data', (data) => process.stderr.write(data))

    // Call callback exactly one time, whether or not process succeeds.
    // Guard against accidentally invoking handler functions multiple times.
    let alreadyDone = false
    proc.on('error', (err) => {
      if (alreadyDone) return
      alreadyDone = true
      onceProcessFinishes(err)
    })
    proc.on('exit', () => {
      if (alreadyDone) return
      alreadyDone = true
      onceProcessFinishes()
    })

    // Save reference to process.
    procs[command] = proc
    delete _listenerCache[command]
  }

  function onceProcessFinishes(err) {
    // Delete reference to process.
    delete procs[command]

    // Call callback.
    done = done || Function.prototype /* noop */
    err ? done(err) : done()
  }
}

module.exports = spawnSingleton
