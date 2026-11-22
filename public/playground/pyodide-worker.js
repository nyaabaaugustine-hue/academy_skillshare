/* global importScripts, loadPyodide */
let pyodideReady = null;
let pyodide = null;

async function initPyodide() {
  if (pyodideReady) return pyodideReady;
  pyodideReady = (async () => {
    importScripts("/app/pyodide/pyodide.js");
    pyodide = await loadPyodide({ indexURL: "/app/pyodide/" });
    await pyodide.runPythonAsync(`
import sys, io, traceback, json
def __sb_run(code):
    out, err = io.StringIO(), io.StringIO()
    old_out, old_err = sys.stdout, sys.stderr
    sys.stdout, sys.stderr = out, err
    try:
        g = {"__name__": "__main__"}
        exec(compile(code, "<skillbridge-playground>", "exec"), g)
        ok = True
        tb = ""
    except Exception:
        ok = False
        tb = traceback.format_exc()
    finally:
        sys.stdout, sys.stderr = old_out, old_err
    return json.dumps({"ok": ok, "stdout": out.getvalue(), "stderr": err.getvalue(), "traceback": tb})
`);
    return pyodide;
  })();
  return pyodideReady;
}

self.onmessage = async (e) => {
  const { id, type, code } = e.data || {};
  if (type === "init") {
    try {
      await initPyodide();
      self.postMessage({ id, type: "ready" });
    } catch (err) {
      self.postMessage({ id, type: "error", error: String(err?.message || err) });
    }
    return;
  }
  if (type === "run") {
    try {
      const py = await initPyodide();
      py.globals.set("__sb_code", code || "");
      const raw = await py.runPythonAsync("__sb_run(__sb_code)");
      let result;
      try { result = JSON.parse(raw); } catch { result = { ok: false, stdout: "", stderr: String(raw), traceback: "" }; }
      self.postMessage({ id, type: "result", result });
    } catch (err) {
      self.postMessage({ id, type: "error", error: String(err?.message || err) });
    }
  }
};
