import { Builder, By, logging } from 'selenium-webdriver';
import safari from 'selenium-webdriver/safari.js';
import {
  SafariSession,
  SafariSessionOptions,
  ConsoleLogEntry,
  NetworkLogEntry,
  ElementInspectionResult,
  PerformanceMetrics,
  LogLevel
} from './types.js';

export class SafariDriverManager {
  private sessions: Map<string, SafariSession> = new Map();

  async createSession(sessionId: string, options: SafariSessionOptions = {}): Promise<SafariSession> {
    if (this.sessions.has(sessionId)) {
      throw new Error(`Session ${sessionId} already exists`);
    }

    try {
      // Configure Safari options
      const safariOptions = new safari.Options();
      
      // Enable dev tools features
      if (options.enableInspection) {
        // Note: automaticInspection may not be available in all Safari versions
        try {
          (safariOptions as any).setAutomaticInspection(true);
        } catch (e) {
          console.warn('Automatic inspection not supported in this Safari version');
        }
      }
      
      if (options.enableProfiling) {
        // Note: automaticProfiling may not be available in all Safari versions
        try {
          (safariOptions as any).setAutomaticProfiling(true);
        } catch (e) {
          console.warn('Automatic profiling not supported in this Safari version');
        }
      }

      if (options.usesTechnologyPreview) {
        safariOptions.setTechnologyPreview(true);
      }

      // Enable logging for console and performance
      const loggingPrefs = new logging.Preferences();
      loggingPrefs.setLevel(logging.Type.BROWSER, logging.Level.ALL);
      loggingPrefs.setLevel(logging.Type.PERFORMANCE, logging.Level.ALL);
      
      const driver = await new Builder()
        .forBrowser('safari')
        .setSafariOptions(safariOptions)
        .setLoggingPrefs(loggingPrefs)
        .build();

      const session: SafariSession = {
        driver,
        sessionId,
        options,
        createdAt: new Date()
      };

      this.sessions.set(sessionId, session);
      return session;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to create Safari session: ${errorMessage}`);
    }
  }

  getSession(sessionId: string): SafariSession | undefined {
    return this.sessions.get(sessionId);
  }

  async closeSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    try {
      await session.driver.quit();
      this.sessions.delete(sessionId);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to close session: ${errorMessage}`);
    }
  }

  async navigateToUrl(sessionId: string, url: string): Promise<void> {
    const session = this.getSession(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    try {
      await session.driver.get(url);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Navigation failed: ${errorMessage}`);
    }
  }

  async getConsoleLogs(sessionId: string, logLevel: LogLevel = 'ALL'): Promise<ConsoleLogEntry[]> {
    const session = this.getSession(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    try {
      // First, inject console logging capture if not already present
      await session.driver.executeScript(`
        if (!window.__safariMCPConsoleLogs) {
          window.__safariMCPConsoleLogs = [];
          
          // Store original console methods
          const originalConsole = {
            log: console.log,
            warn: console.warn,
            error: console.error,
            info: console.info,
            debug: console.debug
          };
          
          // Override console methods to capture logs
          ['log', 'warn', 'error', 'info', 'debug'].forEach(method => {
            console[method] = function(...args) {
              const message = args.map(arg => 
                typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
              ).join(' ');
              
              window.__safariMCPConsoleLogs.push({
                level: method.toUpperCase(),
                message: message,
                timestamp: Date.now(),
                source: 'browser'
              });
              
              // Still call original method
              originalConsole[method].apply(console, args);
            };
          });
        }
      `);

      // Retrieve captured logs
      const logs = await session.driver.executeScript(`
        return window.__safariMCPConsoleLogs || [];
      `);

      const filteredLogs = logLevel === 'ALL' 
        ? logs 
        : logs.filter((log: any) => log.level === logLevel);

      return filteredLogs.map((log: any) => ({
        level: log.level,
        message: log.message,
        timestamp: log.timestamp,
        source: log.source || 'browser'
      }));
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to get console logs: ${errorMessage}`);
    }
  }

  async getNetworkLogs(sessionId: string): Promise<NetworkLogEntry[]> {
    const session = this.getSession(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    try {
      // First, inject network monitoring if not already present
      await session.driver.executeScript(`
        if (!window.__safariMCPNetworkLogs) {
          window.__safariMCPNetworkLogs = [];
          
          // Capture existing performance entries
          const existingEntries = performance.getEntriesByType('resource');
          existingEntries.forEach(entry => {
            window.__safariMCPNetworkLogs.push({
              method: 'Network.resourceFinished',
              url: entry.name,
              status: null, // Not available from Resource Timing API
              requestHeaders: null,
              responseHeaders: null,
              timestamp: Date.now() - (performance.now() - entry.startTime),
              duration: entry.duration,
              transferSize: entry.transferSize || null,
              encodedBodySize: entry.encodedBodySize || null,
              decodedBodySize: entry.decodedBodySize || null
            });
          });
          
          // Monitor new resources using PerformanceObserver
          if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
              for (const entry of list.getEntries()) {
                if (entry.entryType === 'resource') {
                  window.__safariMCPNetworkLogs.push({
                    method: 'Network.resourceFinished',
                    url: entry.name,
                    status: null,
                    requestHeaders: null,
                    responseHeaders: null,
                    timestamp: Date.now() - (performance.now() - entry.startTime),
                    duration: entry.duration,
                    transferSize: entry.transferSize || null,
                    encodedBodySize: entry.encodedBodySize || null,
                    decodedBodySize: entry.decodedBodySize || null
                  });
                }
              }
            });
            observer.observe({ entryTypes: ['resource'] });
          }
          
          // Intercept fetch requests for additional data
          const originalFetch = window.fetch;
          window.fetch = function(...args) {
            const url = typeof args[0] === 'string' ? args[0] : args[0].url;
            const startTime = Date.now();
            
            return originalFetch.apply(this, args).then(response => {
              window.__safariMCPNetworkLogs.push({
                method: 'Network.responseReceived',
                url: url,
                status: response.status,
                requestHeaders: args[1]?.headers || null,
                responseHeaders: Object.fromEntries(response.headers.entries()),
                timestamp: startTime,
                duration: Date.now() - startTime
              });
              return response;
            }).catch(error => {
              window.__safariMCPNetworkLogs.push({
                method: 'Network.loadingFailed',
                url: url,
                status: null,
                requestHeaders: args[1]?.headers || null,
                responseHeaders: null,
                timestamp: startTime,
                duration: Date.now() - startTime,
                error: error.message
              });
              throw error;
            });
          };
        }
      `);

      // Retrieve captured network logs
      const networkLogs = await session.driver.executeScript(`
        return window.__safariMCPNetworkLogs || [];
      `);

      return networkLogs.map((log: any) => ({
        method: log.method,
        url: log.url,
        status: log.status,
        requestHeaders: log.requestHeaders,
        responseHeaders: log.responseHeaders,
        timestamp: log.timestamp,
        ...(log.duration !== undefined && { duration: log.duration }),
        ...(log.transferSize !== undefined && { transferSize: log.transferSize }),
        ...(log.encodedBodySize !== undefined && { encodedBodySize: log.encodedBodySize }),
        ...(log.decodedBodySize !== undefined && { decodedBodySize: log.decodedBodySize }),
        ...(log.error && { error: log.error })
      }));
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to get network logs: ${errorMessage}`);
    }
  }

  async executeScript(sessionId: string, script: string, args: any[] = []): Promise<any> {
    const session = this.getSession(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    try {
      return await session.driver.executeScript(script, ...args);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Script execution failed: ${errorMessage}`);
    }
  }

  async takeScreenshot(sessionId: string): Promise<string> {
    const session = this.getSession(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    try {
      return await session.driver.takeScreenshot();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Screenshot failed: ${errorMessage}`);
    }
  }

  async inspectElement(sessionId: string, selector: string): Promise<ElementInspectionResult> {
    const session = this.getSession(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    try {
      const element = await session.driver.findElement(By.css(selector));
      
      const [tagName, text, attributes, boundingRect] = await Promise.all([
        element.getTagName(),
        element.getText(),
        session.driver.executeScript(`
          const el = arguments[0];
          const attrs = {};
          for (let attr of el.attributes) {
            attrs[attr.name] = attr.value;
          }
          return attrs;
        `, element),
        session.driver.executeScript(`
          const rect = arguments[0].getBoundingClientRect();
          return {
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height
          };
        `, element)
      ]);

      return {
        tagName,
        text: text.substring(0, 500), // Limit text length
        attributes,
        boundingRect
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Element inspection failed: ${errorMessage}`);
    }
  }

  async getPerformanceMetrics(sessionId: string): Promise<PerformanceMetrics> {
    const session = this.getSession(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    try {
      const metrics = await session.driver.executeScript(`
        const timing = performance.timing;
        const paintEntries = performance.getEntriesByType('paint');
        
        return {
          navigationStart: timing.navigationStart,
          loadEventEnd: timing.loadEventEnd,
          domContentLoadedEventEnd: timing.domContentLoadedEventEnd,
          firstPaint: paintEntries.find(entry => entry.name === 'first-paint')?.startTime,
          firstContentfulPaint: paintEntries.find(entry => entry.name === 'first-contentful-paint')?.startTime
        };
      `);

      return metrics;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to get performance metrics: ${errorMessage}`);
    }
  }

  async getCurrentUrl(sessionId: string): Promise<string> {
    const session = this.getSession(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    try {
      return await session.driver.getCurrentUrl();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to get current URL: ${errorMessage}`);
    }
  }

  async getPageTitle(sessionId: string): Promise<string> {
    const session = this.getSession(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    try {
      return await session.driver.getTitle();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to get page title: ${errorMessage}`);
    }
  }

  async clearConsoleLogs(sessionId: string): Promise<void> {
    const session = this.getSession(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    try {
      await session.driver.executeScript(`
        if (window.__safariMCPConsoleLogs) {
          window.__safariMCPConsoleLogs = [];
        }
      `);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to clear console logs: ${errorMessage}`);
    }
  }

  async clearNetworkLogs(sessionId: string): Promise<void> {
    const session = this.getSession(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    try {
      await session.driver.executeScript(`
        if (window.__safariMCPNetworkLogs) {
          window.__safariMCPNetworkLogs = [];
        }
      `);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to clear network logs: ${errorMessage}`);
    }
  }

  getAllSessions(): string[] {
    return Array.from(this.sessions.keys());
  }

  async closeAllSessions(): Promise<void> {
    const sessionIds = this.getAllSessions();
    for (const sessionId of sessionIds) {
      try {
        await this.closeSession(sessionId);
      } catch (error) {
        console.error(`Failed to close session ${sessionId}:`, error);
      }
    }
  }
}
