import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { SafariDriverManager } from './safari-driver.js';
import { LogLevel } from './types.js';

export class SafariMCPServer {
  private server: Server;
  private driverManager: SafariDriverManager;

  constructor() {
    this.server = new Server({
      name: 'safari-devtools-mcp',
      version: '1.0.0'
    }, {
      capabilities: {
        tools: {}
      }
    });

    this.driverManager = new SafariDriverManager();
    this.setupHandlers();
  }

  private setupHandlers(): void {
    // Tool call handler
    this.server.setRequestHandler(
      CallToolRequestSchema,
      async (request) => {
        const { name, arguments: args } = request.params;
        return {
          content: await this.handleToolCall(name, args || {})
        };
      }
    );

    // Tool list handler
    this.server.setRequestHandler(
      ListToolsRequestSchema,
      async () => ({
        tools: [
          {
            name: 'safari_start_session',
            description: 'Start a new Safari automation session with dev tools access',
            inputSchema: {
              type: 'object',
              properties: {
                sessionId: { 
                  type: 'string', 
                  description: 'Unique session identifier' 
                },
                options: {
                  type: 'object',
                  properties: {
                    enableInspection: { 
                      type: 'boolean', 
                      description: 'Enable Web Inspector for debugging'
                    },
                    enableProfiling: { 
                      type: 'boolean', 
                      description: 'Enable timeline profiling'
                    },
                    usesTechnologyPreview: {
                      type: 'boolean',
                      description: 'Use Safari Technology Preview'
                    }
                  }
                }
              },
              required: ['sessionId']
            }
          },
          {
            name: 'safari_navigate',
            description: 'Navigate to a URL in Safari',
            inputSchema: {
              type: 'object',
              properties: {
                sessionId: { type: 'string', description: 'Session identifier' },
                url: { type: 'string', description: 'URL to navigate to' }
              },
              required: ['sessionId', 'url']
            }
          },
          {
            name: 'safari_get_console_logs',
            description: 'Get browser console logs for debugging',
            inputSchema: {
              type: 'object',
              properties: {
                sessionId: { type: 'string', description: 'Session identifier' },
                logLevel: { 
                  type: 'string', 
                  enum: ['ALL', 'DEBUG', 'INFO', 'WARNING', 'SEVERE'],
                  description: 'Filter logs by level'
                }
              },
              required: ['sessionId']
            }
          },
          {
            name: 'safari_get_network_logs',
            description: 'Get network activity logs for performance analysis',
            inputSchema: {
              type: 'object',
              properties: {
                sessionId: { type: 'string', description: 'Session identifier' }
              },
              required: ['sessionId']
            }
          },
          {
            name: 'safari_clear_console_logs',
            description: 'Clear captured console logs for a session',
            inputSchema: {
              type: 'object',
              properties: {
                sessionId: { type: 'string', description: 'Session identifier' }
              },
              required: ['sessionId']
            }
          },
          {
            name: 'safari_clear_network_logs',
            description: 'Clear captured network logs for a session',
            inputSchema: {
              type: 'object',
              properties: {
                sessionId: { type: 'string', description: 'Session identifier' }
              },
              required: ['sessionId']
            }
          },
          {
            name: 'safari_execute_script',
            description: 'Execute JavaScript in the browser context',
            inputSchema: {
              type: 'object',
              properties: {
                sessionId: { type: 'string', description: 'Session identifier' },
                script: { type: 'string', description: 'JavaScript code to execute' },
                args: { 
                  type: 'array', 
                  description: 'Arguments to pass to the script'
                }
              },
              required: ['sessionId', 'script']
            }
          },
          {
            name: 'safari_take_screenshot',
            description: 'Take a screenshot of the current page',
            inputSchema: {
              type: 'object',
              properties: {
                sessionId: { type: 'string', description: 'Session identifier' }
              },
              required: ['sessionId']
            }
          },
          {
            name: 'safari_inspect_element',
            description: 'Inspect a DOM element and get its properties',
            inputSchema: {
              type: 'object',
              properties: {
                sessionId: { type: 'string', description: 'Session identifier' },
                selector: { type: 'string', description: 'CSS selector for the element' }
              },
              required: ['sessionId', 'selector']
            }
          },
          {
            name: 'safari_get_performance_metrics',
            description: 'Get page performance metrics',
            inputSchema: {
              type: 'object',
              properties: {
                sessionId: { type: 'string', description: 'Session identifier' }
              },
              required: ['sessionId']
            }
          },
          {
            name: 'safari_get_page_info',
            description: 'Get current page URL and title',
            inputSchema: {
              type: 'object',
              properties: {
                sessionId: { type: 'string', description: 'Session identifier' }
              },
              required: ['sessionId']
            }
          },
          {
            name: 'safari_list_sessions',
            description: 'List all active Safari sessions',
            inputSchema: {
              type: 'object',
              properties: {}
            }
          },
          {
            name: 'safari_close_session',
            description: 'Close a Safari automation session',
            inputSchema: {
              type: 'object',
              properties: {
                sessionId: { type: 'string', description: 'Session identifier' }
              },
              required: ['sessionId']
            }
          }
        ]
      })
    );
  }

  private async handleToolCall(name: string, args: Record<string, any>): Promise<Array<{ type: string; text?: string; data?: string; mimeType?: string }>> {
    try {
      switch (name) {
        case 'safari_start_session':
          return await this.startSession(args);
        
        case 'safari_navigate':
          return await this.navigate(args);
        
        case 'safari_get_console_logs':
          return await this.getConsoleLogs(args);
        
        case 'safari_get_network_logs':
          return await this.getNetworkLogs(args);
        
        case 'safari_clear_console_logs':
          return await this.clearConsoleLogs(args);
        
        case 'safari_clear_network_logs':
          return await this.clearNetworkLogs(args);
        
        case 'safari_execute_script':
          return await this.executeScript(args);
        
        case 'safari_take_screenshot':
          return await this.takeScreenshot(args);
        
        case 'safari_inspect_element':
          return await this.inspectElement(args);
        
        case 'safari_get_performance_metrics':
          return await this.getPerformanceMetrics(args);
        
        case 'safari_get_page_info':
          return await this.getPageInfo(args);
        
        case 'safari_list_sessions':
          return await this.listSessions();
        
        case 'safari_close_session':
          return await this.closeSession(args);
        
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return [
        {
          type: 'text',
          text: `Error: ${errorMessage}`
        }
      ];
    }
  }

  private async startSession(args: Record<string, any>): Promise<Array<{ type: string; text: string }>> {
    const { sessionId, options = {} } = args;
    
    await this.driverManager.createSession(sessionId, options);
    
    return [
      {
        type: 'text',
        text: `Safari session '${sessionId}' started successfully with dev tools enabled.\nInspection: ${options.enableInspection !== false}\nProfiling: ${options.enableProfiling !== false}\nTechnology Preview: ${options.usesTechnologyPreview === true}`
      }
    ];
  }

  private async navigate(args: Record<string, any>): Promise<Array<{ type: string; text: string }>> {
    const { sessionId, url } = args;
    
    await this.driverManager.navigateToUrl(sessionId, url);
    
    return [
      {
        type: 'text',
        text: `Successfully navigated to: ${url}`
      }
    ];
  }

  private async getConsoleLogs(args: Record<string, any>): Promise<Array<{ type: string; text: string }>> {
    const { sessionId, logLevel = 'ALL' } = args;
    
    const logs = await this.driverManager.getConsoleLogs(sessionId, logLevel as LogLevel);
    
    return [
      {
        type: 'text',
        text: `Console Logs (${logs.length} entries):\n\n${JSON.stringify(logs, null, 2)}`
      }
    ];
  }

  private async getNetworkLogs(args: Record<string, any>): Promise<Array<{ type: string; text: string }>> {
    const { sessionId } = args;
    
    const logs = await this.driverManager.getNetworkLogs(sessionId);
    
    return [
      {
        type: 'text',
        text: `Network Logs (${logs.length} entries):\n\n${JSON.stringify(logs, null, 2)}`
      }
    ];
  }

  private async executeScript(args: Record<string, any>): Promise<Array<{ type: string; text: string }>> {
    const { sessionId, script, args: scriptArgs = [] } = args;
    
    const result = await this.driverManager.executeScript(sessionId, script, scriptArgs);
    
    return [
      {
        type: 'text',
        text: `Script execution result:\n${JSON.stringify(result, null, 2)}`
      }
    ];
  }

  private async takeScreenshot(args: Record<string, any>): Promise<Array<{ type: string; text?: string; data?: string; mimeType?: string }>> {
    const { sessionId } = args;
    
    const screenshot = await this.driverManager.takeScreenshot(sessionId);
    
    return [
      {
        type: 'text',
        text: `Screenshot captured successfully (${screenshot.length} bytes base64 data)`
      },
      {
        type: 'image',
        data: screenshot,
        mimeType: 'image/png'
      }
    ];
  }

  private async inspectElement(args: Record<string, any>): Promise<Array<{ type: string; text: string }>> {
    const { sessionId, selector } = args;
    
    const elementInfo = await this.driverManager.inspectElement(sessionId, selector);
    
    return [
      {
        type: 'text',
        text: `Element inspection for selector '${selector}':\n\n${JSON.stringify(elementInfo, null, 2)}`
      }
    ];
  }

  private async getPerformanceMetrics(args: Record<string, any>): Promise<Array<{ type: string; text: string }>> {
    const { sessionId } = args;
    
    const metrics = await this.driverManager.getPerformanceMetrics(sessionId);
    
    return [
      {
        type: 'text',
        text: `Performance Metrics:\n\n${JSON.stringify(metrics, null, 2)}`
      }
    ];
  }

  private async getPageInfo(args: Record<string, any>): Promise<Array<{ type: string; text: string }>> {
    const { sessionId } = args;
    
    const [url, title] = await Promise.all([
      this.driverManager.getCurrentUrl(sessionId),
      this.driverManager.getPageTitle(sessionId)
    ]);
    
    return [
      {
        type: 'text',
        text: `Page Info:\nURL: ${url}\nTitle: ${title}`
      }
    ];
  }

  private async listSessions(): Promise<Array<{ type: string; text: string }>> {
    const sessions = this.driverManager.getAllSessions();
    
    return [
      {
        type: 'text',
        text: `Active Safari Sessions (${sessions.length}):\n${sessions.join('\n')}`
      }
    ];
  }

  private async closeSession(args: Record<string, any>): Promise<Array<{ type: string; text: string }>> {
    const { sessionId } = args;
    
    await this.driverManager.closeSession(sessionId);
    
    return [
      {
        type: 'text',
        text: `Safari session '${sessionId}' closed successfully`
      }
    ];
  }

  private async clearConsoleLogs(args: Record<string, any>): Promise<Array<{ type: string; text: string }>> {
    const { sessionId } = args;
    
    await this.driverManager.clearConsoleLogs(sessionId);
    
    return [
      {
        type: 'text',
        text: `Console logs cleared for session '${sessionId}'`
      }
    ];
  }

  private async clearNetworkLogs(args: Record<string, any>): Promise<Array<{ type: string; text: string }>> {
    const { sessionId } = args;
    
    await this.driverManager.clearNetworkLogs(sessionId);
    
    return [
      {
        type: 'text',
        text: `Network logs cleared for session '${sessionId}'`
      }
    ];
  }

  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Safari MCP Server running on stdio');
  }

  async shutdown(): Promise<void> {
    try {
      await this.driverManager.closeAllSessions();
      console.error('All Safari sessions closed');
    } catch (error) {
      console.error('Error during shutdown:', error);
    }
  }
}
