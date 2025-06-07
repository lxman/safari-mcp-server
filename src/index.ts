#!/usr/bin/env node

import { SafariMCPServer } from './safari-mcp-server.js';

async function main() {
  try {
    const server = new SafariMCPServer();
    await server.start();
  } catch (error) {
    console.error('Failed to start Safari MCP Server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.error('Received SIGINT, shutting down gracefully');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.error('Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

main();
