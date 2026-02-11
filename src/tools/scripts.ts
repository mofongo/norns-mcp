import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { NornsRepl } from "../connections/repl.js";

export function registerScriptTools(server: McpServer, repl: NornsRepl) {
  server.registerTool("norns_load_script", {
    description:
      "Load and run a norns script. The script path is relative to dust/code/, " +
      "e.g., 'awake/awake.lua' to load the awake script.",
    inputSchema: {
      script_path: z
        .string()
        .describe("Script path relative to dust/code/, e.g., 'awake/awake.lua'"),
    },
  }, async ({ script_path }) => {
    try {
      const fullPath = `code/${script_path}`;
      const output = await repl.eval(`norns.script.load("${fullPath}")`);
      return {
        content: [{ type: "text", text: output || `Loaded script: ${script_path}` }],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: `Error: ${(err as Error).message}` }],
        isError: true,
      };
    }
  });

  server.registerTool("norns_list_scripts", {
    description:
      "List available norns scripts by scanning the dust/code/ directory on the SMB mount.",
    inputSchema: {
      path: z
        .string()
        .optional()
        .describe("Optional subdirectory under dust/code/ to list"),
    },
  }, async ({ path }) => {
    try {
      const fs = await import("fs/promises");
      const pathMod = await import("path");

      const mount = process.env.NORNS_MOUNT || "/Volumes/dust";
      const baseDir = pathMod.join(mount, "code", path || "");

      const entries = await listScripts(baseDir, pathMod, fs);
      return {
        content: [{ type: "text", text: entries.length ? entries.join("\n") : "(no scripts found)" }],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: `Error: ${(err as Error).message}` }],
        isError: true,
      };
    }
  });
}

async function listScripts(
  dir: string,
  pathMod: typeof import("path"),
  fs: typeof import("fs/promises"),
  prefix = "",
): Promise<string[]> {
  const results: string[] = [];
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return results;
  }

  for (const entry of entries) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      // Check if directory contains a main lua file (convention: dirname/dirname.lua)
      const mainScript = pathMod.join(dir, entry.name, `${entry.name}.lua`);
      try {
        await fs.access(mainScript);
        results.push(`${rel}/ (main: ${entry.name}.lua)`);
      } catch {
        // Also list subdirectories that might have scripts
        const sub = await listScripts(pathMod.join(dir, entry.name), pathMod, fs, rel);
        if (sub.length > 0) {
          results.push(...sub);
        } else {
          results.push(`${rel}/`);
        }
      }
    } else if (entry.name.endsWith(".lua")) {
      results.push(rel);
    }
  }
  return results;
}
