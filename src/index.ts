#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { NornsRepl } from "./connections/repl.js";
import { NornsOSC } from "./connections/osc.js";
import { registerEvalTool } from "./tools/eval.js";
import { registerScriptTools } from "./tools/scripts.js";
import { registerFileTools } from "./tools/files.js";
import { registerParamTools } from "./tools/params.js";
import { registerControlTools } from "./tools/control.js";
import { registerSystemTools } from "./tools/system.js";
import { registerApiDocsResource } from "./resources/api-docs.js";

const host = process.env.NORNS_HOST;
if (!host) {
  console.error("NORNS_HOST environment variable is required (e.g., norns.local or 192.168.1.50)");
  process.exit(1);
}

const repl = new NornsRepl(host);
const osc = new NornsOSC(host);

const server = new McpServer({
  name: "norns-mcp",
  version: "1.0.0",
});

// Register all tools
registerEvalTool(server, repl);
registerScriptTools(server, repl);
registerFileTools(server);
registerParamTools(server, repl, osc);
registerControlTools(server, osc);
registerSystemTools(server, repl);

// Register resources
registerApiDocsResource(server);

// Connect transport and start
const transport = new StdioServerTransport();
await server.connect(transport);

// Graceful shutdown
process.on("SIGINT", () => {
  repl.close();
  osc.close();
  server.close();
  process.exit(0);
});

process.on("SIGTERM", () => {
  repl.close();
  osc.close();
  server.close();
  process.exit(0);
});
