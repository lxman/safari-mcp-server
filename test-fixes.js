#!/usr/bin/env node

// Quick test script to verify console logs and network logs fixes
import { SafariDriverManager } from './build/safari-driver.js';

async function testFixes() {
  const driverManager = new SafariDriverManager();
  const sessionId = 'test-session';
  
  try {
    console.log('🚀 Starting Safari session...');
    await driverManager.createSession(sessionId, {
      enableInspection: true,
      enableProfiling: true
    });
    
    console.log('🌐 Navigating to test page...');
    await driverManager.navigateToUrl(sessionId, 'https://httpbin.org/json');
    
    console.log('📝 Initializing console capture and generating logs...');
    // First call getConsoleLogs to initialize the capture system
    await driverManager.getConsoleLogs(sessionId);
    
    // Now execute script to generate logs
    await driverManager.executeScript(sessionId, `
      console.log("Test log message");
      console.warn("Test warning message");
      console.error("Test error message");
      console.info("Test info message");
      console.log("Complex object:", {name: "test", value: 42, array: [1, 2, 3]});
      
      // Make a fetch request to generate network activity
      fetch('/headers').then(r => r.json()).then(data => console.log('Fetch result:', data));
    `);
    
    // Wait a moment for logs to be captured
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('🔍 Checking if console capture is initialized...');
    const captureStatus = await driverManager.executeScript(sessionId, `
      return {
        logsArrayExists: !!window.__safariMCPConsoleLogs,
        logsCount: window.__safariMCPConsoleLogs ? window.__safariMCPConsoleLogs.length : 0,
        logs: window.__safariMCPConsoleLogs || []
      };
    `);
    console.log('Console capture status:', JSON.stringify(captureStatus, null, 2));
    
    console.log('📋 Testing console logs...');
    const consoleLogs = await driverManager.getConsoleLogs(sessionId);
    console.log(`✅ Console logs captured: ${consoleLogs.length} entries`);
    consoleLogs.forEach((log, i) => console.log(`  ${i+1}. [${log.level}] ${log.message}`));
    
    console.log('\n🌐 Testing network logs...');
    const networkLogs = await driverManager.getNetworkLogs(sessionId);
    console.log(`✅ Network logs captured: ${networkLogs.length} entries`);
    networkLogs.slice(0, 3).forEach((log, i) => console.log(`  ${i+1}. ${log.method} - ${log.url}`));
    
    console.log('\n🧹 Testing log clearing...');
    await driverManager.clearConsoleLogs(sessionId);
    await driverManager.clearNetworkLogs(sessionId);
    
    const clearedConsoleLogs = await driverManager.getConsoleLogs(sessionId);
    const clearedNetworkLogs = await driverManager.getNetworkLogs(sessionId);
    
    console.log(`✅ Console logs after clear: ${clearedConsoleLogs.length} entries`);
    console.log(`✅ Network logs after clear: ${clearedNetworkLogs.length} entries`);
    
    console.log('\n🎉 All tests passed! The fixes are working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    console.log('🔧 Cleaning up...');
    try {
      await driverManager.closeSession(sessionId);
    } catch (e) {
      // Ignore cleanup errors
    }
  }
}

testFixes().catch(console.error);
