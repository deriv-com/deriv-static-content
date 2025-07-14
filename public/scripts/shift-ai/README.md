# ShiftAI VSIX Extension Installation Guide

This guide will help you install the ShiftAI extension for VSCode and Cursor.

## Supported Tools

ShiftAI is compatible with the following development environments:

- **Cursor default IDE** - Built-in AI assistant with ShiftAI extension
- **Cursor + Cline** - Cursor IDE with Cline AI coding assistant
- **Cursor + Roo** - Cursor IDE with Roo AI coding assistant  
- **VS Code + Cline** - Visual Studio Code with Cline AI coding assistant
- **VS Code + Roo** - Visual Studio Code with Roo AI coding assistant

## Installation Steps
1. **Download the VSIX file to your computer:**
   - [shiftai-0.0.2.vsix](https://github.com/deriv-com/deriv-static-content/raw/refs/heads/master/public/scripts/shift-ai/shiftai-0.0.2.vsix)

2. **Install in VSCode:**
   - Open VSCode
   - **Option 1:**
     - Go to the Extensions panel
     - Click the three dots (⋮) in the top right
     - Select “Install from VSIX...”
     - Choose the downloaded `.vsix` file
   - **Option 2:**
     - Open the Command Palette (`Cmd+Shift+P` on Mac, `Ctrl+Shift+P` on Windows/Linux)
     - Type and select `Extensions: Install from VSIX...`
     - Select the downloaded `.vsix` file

3. **Install in Cursor:**
   - Open Cursor
   - Open the Command Palette (`Cmd+Shift+P` on Mac, `Ctrl+Shift+P` on Windows/Linux)
   - Type and select `Extensions: Install from VSIX...`
   - Select the downloaded `.vsix` file

---

## MCP Integration

- ShiftAI includes an MCP server for integration with compatible tools
- To enable:
  1. Install ShiftAI in VS Code
  2. Open the “Output” panel in VS Code (`View > Output` or `Cmd+Shift+U`/`Ctrl+Shift+U`)
  3. In the Output panel, select “ShiftAI” from the dropdown menu at the top right
  4. Look for a line that shows the MCP server path (e.g., `MCP server running at: /absolute/path/to/your/extension/mcp/mcp-server.js`)
  5. Copy that path for use in your MCP configuration
  6. Add it to your MCP configuration file (e.g., `~/.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "ShiftAI": {
      "command": "node",
      "args": ["/absolute/path/to/your/extension/mcp/mcp-server.js"]
    }
  }
}
```

**Enjoy using ShiftAI in your editor!**
