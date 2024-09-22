import { promisify } from 'util';
import { exec, ExecOptions } from 'child_process';
const execPromisified = promisify(exec);

export const runCommand = async (command: string, options: ExecOptions) => {
  try {
    const { stdout, stderr } = await execPromisified(command, options);
    return stdout.trim();
  } catch (e) {
    console.error(e); // should contain code (exit code) and signal (that caused the termination).
  }

  return null;
};