import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import * as fs from "fs/promises";
import * as path from "path";

export function registerFileTools(server: McpServer) {
  const mount = process.env.NORNS_MOUNT || "/Volumes/dust";

  server.registerTool("norns_read_file", {
    description:
      "Read a file from the norns filesystem via SMB mount. " +
      "Path is relative to the dust directory, e.g., 'code/awake/awake.lua'.",
    inputSchema: {
      path: z
        .string()
        .describe("File path relative to the dust directory, e.g., 'code/awake/awake.lua'"),
    },
  }, async ({ path: filePath }) => {
    try {
      const fullPath = path.join(mount, filePath);
      const content = await fs.readFile(fullPath, "utf-8");
      return {
        content: [{ type: "text", text: content }],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: `Error reading file: ${(err as Error).message}` }],
        isError: true,
      };
    }
  });

  server.registerTool("norns_write_file", {
    description:
      "Write a file to the norns filesystem via SMB mount. " +
      "Path is relative to the dust directory. Creates parent directories if needed.",
    inputSchema: {
      path: z
        .string()
        .describe("File path relative to the dust directory, e.g., 'code/myscript/myscript.lua'"),
      content: z.string().describe("File content to write"),
    },
  }, async ({ path: filePath, content }) => {
    try {
      const fullPath = path.join(mount, filePath);
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      await fs.writeFile(fullPath, content, "utf-8");
      return {
        content: [{ type: "text", text: `Written: ${filePath}` }],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: `Error writing file: ${(err as Error).message}` }],
        isError: true,
      };
    }
  });
}
