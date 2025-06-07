# Safari MCP Server

A Model Context Protocol (MCP) server that provides AI assistants with Safari browser automation and developer tools access. This server enables LLMs to interact with Safari, access console logs, monitor network activity, and perform browser automation tasks.

## Features

- 🚀 **Safari Browser Automation**: Start, control, and manage Safari sessions
- 🔍 **Developer Tools Access**: Get console logs, network logs, and performance metrics
- 📸 **Screenshots**: Capture page screenshots for visual analysis
- 🕵️ **Element Inspection**: Inspect DOM elements and their properties
- ⚡ **JavaScript Execution**: Run custom JavaScript in the browser context
- 📊 **Performance Monitoring**: Access timing metrics and performance data
- 🔧 **Multiple Sessions**: Manage multiple Safari automation sessions

## Prerequisites

### System Requirements
- **macOS only** (Safari and SafariDriver are only available on macOS)
- **Node.js 18+**
- **Safari 10+** (comes with built-in WebDriver support)

### Safari Setup
Before using this MCP server, you need to enable Safari's automation features:

1. **Enable Developer Menu**:
   - Open Safari → Preferences → Advanced
   - Check "Show Develop menu in menu bar"

2. **Enable Remote Automation**:
   - In Safari's menu bar: Develop → Allow Remote Automation

3. **Authorize SafariDriver**:
   ```bash
   sudo safaridriver --enable
   ```
   Enter your admin password when prompted.

## Installation

1. **Clone or navigate to the project directory**:
   ```bash
   cd C:\Users\jorda\RiderProjects\AIPacketAnalyzer\safari-mcp-server
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Build the project**:
   ```bash
   npm run build
   ```

## Usage

### Running the Server
```bash
npm start
```

The server will start and listen for MCP protocol messages on stdio.

### Development Mode
```bash
npm run dev
```

### Available Tools

#### Session Management
- `safari_start_session` - Start a new Safari automation session
- `safari_close_session` - Close a Safari session
- `safari_list_sessions` - List all active sessions

#### Navigation & Page Info
- `safari_navigate` - Navigate to a URL
- `safari_get_page_info` - Get current page URL and title

#### Developer Tools Access
- `safari_get_console_logs` - Get browser console logs
- `safari_get_network_logs` - Get network activity logs
- `safari_get_performance_metrics` - Get page performance metrics

#### Browser Interaction
- `safari_execute_script` - Execute JavaScript in the browser
- `safari_take_screenshot` - Capture page screenshots
- `safari_inspect_element` - Inspect DOM elements

### Example Usage with Claude Desktop

Add this configuration to your Claude Desktop config file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "safari-devtools": {
      "command": "node",
      "args": ["C:/Users/jorda/RiderProjects/AIPacketAnalyzer/safari-mcp-server/build/index.js"]
    }
  }
}
```

### Example Commands

Once connected to an MCP client like Claude Desktop, you can use commands like:

```
Start a Safari session with ID "main" and navigate to Google:
- Start session: safari_start_session with sessionId "main"
- Navigate: safari_navigate to "https://www.google.com"
- Take screenshot: safari_take_screenshot
- Get console logs: safari_get_console_logs
```

## Configuration Options

When starting a session, you can specify options:

```json
{
  "sessionId": "my-session",
  "options": {
    "enableInspection": true,     // Enable Web Inspector
    "enableProfiling": true,      // Enable timeline profiling
    "usesTechnologyPreview": false // Use Safari Technology Preview
  }
}
```

## Limitations

1. **Single Session Limit**: Safari only allows one WebDriver session at a time
2. **macOS Only**: This server only works on macOS systems
3. **Safari-Specific**: Unlike Chrome DevTools Protocol, Safari has limited debugging API access
4. **Network Logs**: Network logging depends on Safari's performance logs and may have limitations

## Development

### Project Structure
```
safari-mcp-server/
├── src/
│   ├── index.ts                 # Main entry point
│   ├── safari-mcp-server.ts    # MCP server implementation
│   ├── safari-driver.ts        # Safari WebDriver manager
│   └── types.ts                # TypeScript type definitions
├── build/                      # Compiled JavaScript
├── package.json
├── tsconfig.json
└── README.md
```

### Building
```bash
npm run build
```

### Watching for Changes
```bash
npm run watch
```

### Cleaning Build
```bash
npm run clean
```

## Troubleshooting

### Common Issues

1. **"Session not found" errors**:
   - Make sure you've started a session before using other commands
   - Check that Safari didn't crash or close unexpectedly

2. **"Remote Automation not enabled"**:
   - Verify Safari's Developer menu is enabled
   - Check that "Allow Remote Automation" is enabled in the Develop menu

3. **Permission errors**:
   - Run `sudo safaridriver --enable` and enter your password
   - Make sure Terminal has the necessary permissions

4. **Safari not responding**:
   - Only one Safari automation session can be active at a time
   - Close any existing automation sessions before starting new ones

### Debug Mode

To see detailed logging, you can modify the server to include more verbose output or check Safari's Web Inspector while automation is running.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Related Projects

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Selenium WebDriver](https://selenium-webdriver.readthedocs.io/)
- [Safari WebDriver Documentation](https://developer.apple.com/documentation/webkit/testing-with-webdriver-in-safari)
