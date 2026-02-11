import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { NornsRepl } from "../connections/repl.js";

export function registerSystemTools(server: McpServer, repl: NornsRepl) {
  server.registerTool("norns_system_state", {
    description: "Get the current norns system state: running script, engine, audio levels, etc.",
    inputSchema: {},
  }, async () => {
    try {
      const code = `
do
  local out = {}
  table.insert(out, "script: " .. tostring(norns.state.name))
  table.insert(out, "path: " .. tostring(norns.state.path))
  table.insert(out, "engine: " .. tostring(norns.state.engine))
  local vol = params:get("output_level")
  if vol then table.insert(out, "output_level: " .. tostring(vol)) end
  local mon = params:get("monitor_level")
  if mon then table.insert(out, "monitor_level: " .. tostring(mon)) end
  local rev = params:get("reverb")
  if rev then table.insert(out, "reverb: " .. tostring(rev)) end
  local comp = params:get("compressor")
  if comp then table.insert(out, "compressor: " .. tostring(comp)) end
  print(table.concat(out, "\\n"))
end`;
      const output = await repl.eval(code);
      return {
        content: [{ type: "text", text: output || "(no state available)" }],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: `Error: ${(err as Error).message}` }],
        isError: true,
      };
    }
  });

  server.registerTool("norns_screen_capture", {
    description:
      "Capture the current norns screen as a PNG file. Returns the path to the saved image.",
    inputSchema: {},
  }, async () => {
    try {
      const code = `
do
  local filename = "/tmp/norns_screen_capture.png"
  _norns.screen_export_png(filename)
  print(filename)
end`;
      const output = await repl.eval(code);
      const devicePath = (output || "").trim();

      if (!devicePath || !devicePath.endsWith(".png")) {
        return {
          content: [{ type: "text", text: "Screen capture failed: could not get file path" }],
          isError: true,
        };
      }

      // The file is on the norns device at /tmp/, not on the SMB mount.
      // Read it back via Lua by base64 encoding it.
      const readCode = `
do
  local f = io.open("${devicePath}", "rb")
  if f then
    local data = f:read("*all")
    f:close()
    local b64 = {}
    local chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
    local i = 1
    while i <= #data do
      local a, b, c = data:byte(i, i+2)
      b = b or 0
      c = c or 0
      local n = a * 65536 + b * 256 + c
      local remaining = #data - i + 1
      table.insert(b64, chars:sub(math.floor(n/262144)%64+1, math.floor(n/262144)%64+1))
      table.insert(b64, chars:sub(math.floor(n/4096)%64+1, math.floor(n/4096)%64+1))
      if remaining >= 2 then
        table.insert(b64, chars:sub(math.floor(n/64)%64+1, math.floor(n/64)%64+1))
      else
        table.insert(b64, "=")
      end
      if remaining >= 3 then
        table.insert(b64, chars:sub(n%64+1, n%64+1))
      else
        table.insert(b64, "=")
      end
      i = i + 3
    end
    print(table.concat(b64))
  else
    print("ERROR: could not open file")
  end
end`;
      const b64Output = await repl.eval(readCode, 15000);

      if (b64Output.startsWith("ERROR:")) {
        return {
          content: [{ type: "text", text: b64Output }],
          isError: true,
        };
      }

      return {
        content: [{
          type: "image",
          data: b64Output.trim(),
          mimeType: "image/png",
        }],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: `Error: ${(err as Error).message}` }],
        isError: true,
      };
    }
  });
}
