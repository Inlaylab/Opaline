import { spawn, spawnSync, type ChildProcess, type SpawnOptions } from 'node:child_process'

const isWindows = process.platform === 'win32'

/**
 * Starts a long-running server in its own process tree. On Windows, `pnpm` and other
 * package-manager commands are `.cmd` shims that `spawn` can only find through a shell.
 */
export function startServer(command: string, args: string[], options: SpawnOptions): ChildProcess {
  return spawn(command, args, {
    ...options,
    shell: isWindows,
    // Windows has no process groups to kill, and a detached child there opens a new console.
    detached: !isWindows,
  })
}

/** Ends the server and every process it started. */
export function stopServer(server: ChildProcess | undefined): void {
  if (server?.pid === undefined) return
  try {
    if (isWindows)
      spawnSync('taskkill', ['/pid', String(server.pid), '/T', '/F'], { stdio: 'ignore' })
    else process.kill(-server.pid, 'SIGTERM')
  } catch {}
}

/** Runs a short command to completion, resolving `.cmd` shims on Windows. */
export function runSync(command: string, args: string[], options: SpawnOptions = {}): void {
  spawnSync(command, args, { ...options, shell: isWindows })
}
