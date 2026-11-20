/* eslint-disable no-undef */
/**
 * Runs learner Python in a Web Worker via Pyodide.
 *
 * Keeping it in a worker means a `while True:` cannot freeze the page: the main
 * thread terminates this worker after a timeout and starts a fresh one next run.
 */

const PYODIDE_VERSION = "v0.28.3";
const BASE = `https://cdn.jsdelivr.net/pyodide/${PYODIDE_VERSION}/full/`;

let runtime = null;

function boot() {
  if (!runtime) {
    importScripts(`${BASE}pyodide.js`);
    runtime = loadPyodide({ indexURL: BASE });
  }
  return runtime;
}

self.onmessage = async (event) => {
  const { id, code } = event.data || {};
  if (typeof id === "undefined") return;

  try {
    const pyodide = await boot();
    let output = "";

    pyodide.setStdout({ batched: (line) => (output += `${line}\n`) });
    pyodide.setStderr({ batched: (line) => (output += `${line}\n`) });

    await pyodide.runPythonAsync(code);
    self.postMessage({ id, ok: true, output });
  } catch (error) {
    const message =
      error && error.message ? String(error.message) : String(error);
    // Python exceptions arrive with a full traceback; the last line is the
    // useful part for a beginner, but keep the whole thing readable.
    self.postMessage({ id, ok: false, output: message });
  }
};
