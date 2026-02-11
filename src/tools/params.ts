import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { NornsRepl } from "../connections/repl.js";
import { NornsOSC } from "../connections/osc.js";

export function registerParamTools(server: McpServer, repl: NornsRepl, osc: NornsOSC) {
  server.registerTool("norns_set_param", {
    description: "Set a norns parameter value by its string ID.",
    inputSchema: {
      id: z.string().describe("Parameter ID string, e.g., 'cutoff' or 'reverb'"),
      value: z
        .union([z.number(), z.string()])
        .describe("Value to set (number or string)"),
    },
  }, async ({ id, value }) => {
    try {
      await osc.send(`/param/${id}`, value);
      return {
        content: [{ type: "text", text: `Set param ${id} = ${value}` }],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: `Error: ${(err as Error).message}` }],
        isError: true,
      };
    }
  });

  server.registerTool("norns_get_params", {
    description:
      "List all norns parameters with their current values, types, and ranges.",
    inputSchema: {},
  }, async () => {
    try {
      // Iterate the params list and collect info
      const code = `
do
  local out = {}
  for i = 1, params.count do
    local p = params:lookup_param(i)
    if p and p.id and p.id ~= "" then
      local s = p.id .. " = " .. tostring(params:get(p.id))
      if p.t == 1 then s = s .. " (number)" -- tNUMBER
      elseif p.t == 2 then s = s .. " (option)" -- tOPTION
      elseif p.t == 3 then s = s .. " (control)" -- tCONTROL
      elseif p.t == 5 then s = s .. " (taper)" -- tTAPER
      elseif p.t == 6 then s = s .. " (trigger)" -- tTRIGGER
      elseif p.t == 7 then s = s .. " (group)" -- tGROUP
      elseif p.t == 9 then s = s .. " (binary)" -- tBINARY
      end
      table.insert(out, s)
    end
  end
  print(table.concat(out, "\\n"))
end`;
      const output = await repl.eval(code, 15000);
      return {
        content: [{ type: "text", text: output || "(no parameters)" }],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: `Error: ${(err as Error).message}` }],
        isError: true,
      };
    }
  });
}
