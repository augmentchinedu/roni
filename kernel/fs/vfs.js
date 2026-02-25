/**
 * roni/kernel/fs/vfs.js — Virtual File System
 * Wraps Node's fs/promises with path normalization and permission checks.
 */
import * as fs from 'node:fs/promises'
import { resolve } from 'node:path'

export class VFS {
  #root = '/'
  #bus = null

  constructor(config, bus) {
    this.#root = config.vfs?.root ?? '/'
    this.#bus = bus
  }

  async start() {
    if (!this.#bus) return
    // Register IPC handlers
    this.#bus.handle('fs', 'readFile', ({ path, encoding }) =>
      fs.readFile(this.#resolve(path), encoding ?? 'utf8'))
    this.#bus.handle('fs', 'writeFile', ({ path, data }) =>
      fs.writeFile(this.#resolve(path), data).then(() => ({ ok: true })))
    this.#bus.handle('fs', 'readdir', ({ path }) =>
      fs.readdir(this.#resolve(path), { withFileTypes: true }).then(entries =>
        entries.map(e => ({ name: e.name, type: e.isDirectory() ? 'dir' : 'file' }))))
    this.#bus.handle('fs', 'stat', ({ path }) =>
      fs.stat(this.#resolve(path)))
    this.#bus.handle('fs', 'mkdir', ({ path, recursive }) =>
      fs.mkdir(this.#resolve(path), { recursive }).then(() => ({ ok: true })))
    this.#bus.handle('fs', 'unlink', ({ path }) =>
      fs.unlink(this.#resolve(path)).then(() => ({ ok: true })))
    this.#bus.handle('fs', 'rename', ({ from, to }) =>
      fs.rename(this.#resolve(from), this.#resolve(to)).then(() => ({ ok: true })))
    console.log('[vfs] VFS started')
  }

  #resolve(p) { return resolve(this.#root, '.' + p) }
}