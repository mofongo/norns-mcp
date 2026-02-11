import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { NornsRepl } from "../connections/repl.js";

export function registerEvalTool(server: McpServer, repl: NornsRepl) {
  server.registerTool("norns_eval", {
    description:
      "Execute Lua code on the norns matron REPL. Returns any printed output. " +
      "Use this for arbitrary Lua evaluation: query state, call functions, modify behavior.",
    inputSchema: {
      code: z.string().describe("Lua code to execute on norns"),
    },
  }, async ({ code }) => {
    try {
      const output = await repl.eval(code);
      return {
        content: [{ type: "text", text: output || "(no output)" }],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: `Error: ${(err as Error).message}` }],
        isError: true,
      };
    }
  });
}
