/**
 * Example usage of Safari MCP Server
 * This demonstrates how to use the server programmatically
 */

import { SafariMCPServer } from './safari-mcp-server.js';

async function exampleUsage() {
  const server = new SafariMCPServer();
  
  console.log('Starting Safari MCP Server example...');
  
  try {
    // This would normally be handled by the MCP client
    // Here we're just demonstrating the tool calls
    
    // Example 1: Start a session
    console.log('\n1. Starting Safari session...');
    const startResult = await server['handleToolCall']('safari_start_session', {
      sessionId: 'example-session',
      options: {
        enableInspection: true,
        enableProfiling: true
      }
    });
    console.log('Result:', startResult[0]?.text);
    
    // Example 2: Navigate to a website
    console.log('\n2. Navigating to website...');
    const navResult = await server['handleToolCall']('safari_navigate', {
      sessionId: 'example-session',
      url: 'https://example.com'
    });
    console.log('Result:', navResult[0]?.text);
    
    // Example 3: Execute JavaScript
    console.log('\n3. Executing JavaScript...');
    const scriptResult = await server['handleToolCall']('safari_execute_script', {
      sessionId: 'example-session',
      script: 'return { title: document.title, url: window.location.href, userAgent: navigator.userAgent };'
    });
    console.log('Result:', scriptResult[0]?.text);
    
    // Example 4: Get page info
    console.log('\n4. Getting page info...');
    const pageInfoResult = await server['handleToolCall']('safari_get_page_info', {
      sessionId: 'example-session'
    });
    console.log('Result:', pageInfoResult[0]?.text);
    
    // Example 5: Get console logs
    console.log('\n5. Getting console logs...');
    const logsResult = await server['handleToolCall']('safari_get_console_logs', {
      sessionId: 'example-session',
      logLevel: 'ALL'
    });
    console.log('Result:', logsResult[0]?.text);
    
    // Example 6: Take screenshot
    console.log('\n6. Taking screenshot...');
    const screenshotResult = await server['handleToolCall']('safari_take_screenshot', {
      sessionId: 'example-session'
    });
    console.log('Result:', screenshotResult[0]?.text);
    
    // Example 7: Close session
    console.log('\n7. Closing session...');
    const closeResult = await server['handleToolCall']('safari_close_session', {
      sessionId: 'example-session'
    });
    console.log('Result:', closeResult[0]?.text);
    
  } catch (error) {
    console.error('Error in example:', error);
  } finally {
    await server.shutdown();
  }
}

// Uncomment to run the example
// exampleUsage();

export { exampleUsage };
