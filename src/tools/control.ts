import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { NornsOSC } from "../connections/osc.js";

export function registerControlTools(server: McpServer, osc: NornsOSC) {
  server.registerTool("norns_key", {
    description:
      "Simulate a norns hardware key press. Keys are numbered 1-3. " +
      "z=1 for press, z=0 for release.",
    inputSchema: {
      n: z.number().int().min(1).max(3).describe("Key number (1-3)"),
      z: z.number().int().min(0).max(1).describe("Key state: 1=press, 0=release"),
    },
  }, async ({ n, z: state }) => {
    try {
      await osc.send("/remote/key", n, state);
      return {
        content: [{ type: "text", text: `Key ${n} ${state === 1 ? "pressed" : "released"}` }],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: `Error: ${(err as Error).message}` }],
        isError: true,
      };
    }
  });

  server.registerTool("norns_enc", {
    description:
      "Simulate a norns encoder turn. Encoders are numbered 1-3. " +
      "Delta is the turn amount (positive=clockwise, negative=counter-clockwise).",
    inputSchema: {
      n: z.number().int().min(1).max(3).describe("Encoder number (1-3)"),
      delta: z.number().int().describe("Turn amount (positive=CW, negative=CCW)"),
    },
  }, async ({ n, delta }) => {
    try {
      await osc.send("/remote/enc", n, delta);
      return {
        content: [{ type: "text", text: `Encoder ${n} turned ${delta}` }],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: `Error: ${(err as Error).message}` }],
        isError: true,
      };
    }
  });

  server.registerTool("norns_send_osc", {
    description:
      "Send an arbitrary OSC message to norns. Useful for scripts that listen on custom OSC paths.",
    inputSchema: {
      path: z.string().describe("OSC address path, e.g., '/my/osc/path'"),
      args: z
        .array(z.union([z.number(), z.string(), z.boolean()]))
        .optional()
        .describe("OSC arguments (numbers, strings, or booleans)"),
    },
  }, async ({ path, args }) => {
    try {
      await osc.send(path, ...(args || []));
      return {
        content: [{ type: "text", text: `Sent OSC: ${path} ${(args || []).join(" ")}` }],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: `Error: ${(err as Error).message}` }],
        isError: true,
      };
    }
  });
}
