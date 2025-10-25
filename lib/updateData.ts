import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const PYTHON_CANDIDATES = ["python3", "python"];
const SCRIPT_PATH = "dashboardAPI.py";

export async function updateDashboardData() {
  let lastError: unknown;

  for (const interpreter of PYTHON_CANDIDATES) {
    try {
      const { stdout, stderr } = await execFileAsync(
        interpreter,
        [SCRIPT_PATH],
        {
          cwd: process.cwd(),
        },
      );

      if (stdout) {
        console.log(`[dashboardAPI] ${stdout.trim()}`);
      }
      if (stderr) {
        console.warn(`[dashboardAPI warning] ${stderr.trim()}`);
      }

      return;
    } catch (error) {
      lastError = error;
      console.warn(
        `[dashboardAPI] Failed to run with ${interpreter}: ${(error as Error).message}`,
      );
    }
  }

  if (lastError) {
    console.error(
      "[dashboardAPI] Unable to refresh data via dashboardAPI.py",
      lastError,
    );
  }
}
