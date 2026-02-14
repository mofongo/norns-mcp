## MCP Server for the Norns open-source sound computer

An MCP (Model Context Protocol) server that gives AI assistants direct control over [monome norns](https://monome.org/docs/norns/). Connect Claude or any MCP-compatible client to your norns and use natural language to write scripts, tweak parameters, and interact with your sound computer.

### Features

- **Lua REPL** — Execute Lua code on the matron REPL via WebSocket
- **Script management** — List, load, read, and write scripts on the norns filesystem
- **Parameter control** — Get and set any norns parameter via OSC
- **Hardware simulation** — Simulate key presses and encoder turns
- **Screen capture** — Capture the norns screen as a PNG image
- **System state** — Query the running script, engine, and audio levels
- **Custom OSC** — Send arbitrary OSC messages to norns

### Setup

Requires network access to your norns and an SMB mount of the `dust` directory.

```bash
npm install
npm run build
```

Set the environment variables:

- `NORNS_HOST` — norns IP or hostname (e.g., `norns.local`)
- `NORNS_MOUNT` — path to the mounted `dust` directory (default: `/Volumes/dust`)

### MCP Client Configuration

Add to your MCP client config (e.g., `.mcp.json`):

```json
{
  "mcpServers": {
    "norns": {
      "command": "node",
      "args": ["build/index.js"],
      "env": {
        "NORNS_HOST": "norns.local"
      }
    }
  }
}
```
