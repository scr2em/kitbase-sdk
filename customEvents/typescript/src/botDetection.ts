/**
 * Bot detection module for filtering automated traffic
 *
 * Detects common automation tools, headless browsers, and bot user agents.
 * Inspired by DataFast's bot detection approach.
 */

/**
 * Known automation tool global variables
 */
const AUTOMATION_GLOBALS = [
  '__webdriver_evaluate',
  '__selenium_evaluate',
  '__webdriver_script_function',
  '__webdriver_unwrapped',
  '__fxdriver_evaluate',
  '__driver_evaluate',
  '_Selenium_IDE_Recorder',
  '_selenium',
  'calledSelenium',
  '$cdc_asdjflasutopfhvcZLmcfl_', // Chrome DevTools Protocol marker
  '__nightmare',
  'domAutomation',
  'domAutomationController',
] as const;

/**
 * Known headless browser user agent patterns
 */
const HEADLESS_PATTERNS = [
  'headlesschrome',
  'phantomjs',
  'selenium',
  'webdriver',
  'puppeteer',
  'playwright',
] as const;

/**
 * Known HTTP client / bot user agent patterns
 */
const HTTP_CLIENT_PATTERNS = [
  'python',
  'curl',
  'wget',
  'java/',
  'go-http',
  'node-fetch',
  'axios',
  'postman',
  'insomnia',
  'httpie',
  'ruby',
  'perl',
  'scrapy',
  'bot',
  'spider',
  'crawler',
  'slurp',
  'googlebot',
  'bingbot',
  'yandexbot',
  'baiduspider',
  'duckduckbot',
  'facebookexternalhit',
  'twitterbot',
  'linkedinbot',
  'whatsapp',
  'telegram',
  'discord',
  'slack',
] as const;

/**
 * Bot detection result
 */
export interface BotDetectionResult {
  isBot: boolean;
  reason?: string;
  checks: {
    webdriver: boolean;
    phantomjs: boolean;
    nightmare: boolean;
    automationGlobals: boolean;
    documentAttributes: boolean;
    userAgentHeadless: boolean;
    userAgentHttpClient: boolean;
    missingUserAgent: boolean;
    invalidEnvironment: boolean;
  };
}

/**
 * Configuration for bot detection
 */
export interface BotDetectionConfig {
  /**
   * Enable bot detection.
   * When enabled and a bot is detected, all tracking events are blocked.
   * Set to false to disable bot detection.
   * @default true
   */
  enabled?: boolean;

  /**
   * Check for webdriver flag (Chrome, Firefox)
   * @default true
   */
  checkWebdriver?: boolean;

  /**
   * Check for PhantomJS
   * @default true
   */
  checkPhantomJS?: boolean;

  /**
   * Check for Nightmare.js
   * @default true
   */
  checkNightmare?: boolean;

  /**
   * Check for automation tool globals
   * @default true
   */
  checkAutomationGlobals?: boolean;

  /**
   * Check document element attributes
   * @default true
   */
  checkDocumentAttributes?: boolean;

  /**
   * Check user agent for headless browsers
   * @default true
   */
  checkUserAgentHeadless?: boolean;

  /**
   * Check user agent for HTTP clients/bots
   * @default true
   */
  checkUserAgentHttpClient?: boolean;

  /**
   * Additional user agent patterns to detect as bots
   */
  additionalBotPatterns?: string[];

  /**
   * Callback when a bot is detected
   */
  onBotDetected?: (result: BotDetectionResult) => void;
}

/**
 * Default bot detection configuration
 */
export const DEFAULT_BOT_DETECTION_CONFIG: Required<Omit<BotDetectionConfig, 'additionalBotPatterns' | 'onBotDetected'>> = {
  enabled: true,
  checkWebdriver: true,
  checkPhantomJS: true,
  checkNightmare: true,
  checkAutomationGlobals: true,
  checkDocumentAttributes: true,
  checkUserAgentHeadless: true,
  checkUserAgentHttpClient: true,
};

/**
 * Check if running in a browser environment
 */
function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

/**
 * Safely get window property
 */
function getWindowProperty(key: string): unknown {
  try {
    return (window as unknown as Record<string, unknown>)[key];
  } catch {
    return undefined;
  }
}

/**
 * Check for webdriver flag
 */
function checkWebdriver(): boolean {
  if (!isBrowser()) return false;

  try {
    return window.navigator?.webdriver === true;
  } catch {
    return false;
  }
}

/**
 * Check for PhantomJS
 */
function checkPhantomJS(): boolean {
  if (!isBrowser()) return false;

  try {
    return !!(
      getWindowProperty('callPhantom') ||
      getWindowProperty('_phantom') ||
      getWindowProperty('phantom')
    );
  } catch {
    return false;
  }
}

/**
 * Check for Nightmare.js
 */
function checkNightmare(): boolean {
  if (!isBrowser()) return false;

  try {
    return !!getWindowProperty('__nightmare');
  } catch {
    return false;
  }
}

/**
 * Check for automation tool globals
 */
function checkAutomationGlobals(): boolean {
  if (!isBrowser()) return false;

  try {
    for (const global of AUTOMATION_GLOBALS) {
      if (getWindowProperty(global) !== undefined) {
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Check for webdriver/selenium attributes on document element
 */
function checkDocumentAttributes(): boolean {
  if (!isBrowser()) return false;

  try {
    const docEl = document.documentElement;
    if (!docEl) return false;

    return !!(
      docEl.getAttribute('webdriver') ||
      docEl.getAttribute('selenium') ||
      docEl.getAttribute('driver')
    );
  } catch {
    return false;
  }
}

/**
 * Check user agent for headless browser patterns
 */
function checkUserAgentHeadless(): boolean {
  if (!isBrowser()) return false;

  try {
    const ua = window.navigator?.userAgent?.toLowerCase() || '';
    if (!ua) return false;

    for (const pattern of HEADLESS_PATTERNS) {
      if (ua.includes(pattern)) {
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Check user agent for HTTP client patterns
 */
function checkUserAgentHttpClient(additionalPatterns?: string[]): boolean {
  if (!isBrowser()) return false;

  try {
    const ua = window.navigator?.userAgent?.toLowerCase() || '';
    if (!ua) return false;

    // Check built-in patterns
    for (const pattern of HTTP_CLIENT_PATTERNS) {
      if (ua.includes(pattern)) {
        return true;
      }
    }

    // Check additional patterns
    if (additionalPatterns) {
      for (const pattern of additionalPatterns) {
        if (ua.includes(pattern.toLowerCase())) {
          return true;
        }
      }
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Check for missing or invalid user agent
 */
function checkMissingUserAgent(): boolean {
  if (!isBrowser()) return false;

  try {
    const ua = window.navigator?.userAgent;
    return !ua || ua === '' || ua === 'undefined' || ua.length < 10;
  } catch {
    return false;
  }
}

/**
 * Check for invalid browser environment (missing required objects)
 */
function checkInvalidEnvironment(): boolean {
  if (!isBrowser()) return false;

  try {
    // Check for missing or fake navigator/location/document
    if (
      !window.navigator ||
      !window.location ||
      !window.document ||
      typeof window.navigator !== 'object' ||
      typeof window.location !== 'object' ||
      typeof window.document !== 'object'
    ) {
      return true;
    }
    return false;
  } catch {
    return true;
  }
}

/**
 * Detect if the current visitor is a bot
 *
 * @param config - Bot detection configuration
 * @returns Bot detection result
 *
 * @example
 * ```typescript
 * const result = detectBot();
 * if (result.isBot) {
 *   console.log('Bot detected:', result.reason);
 * }
 * ```
 */
export function detectBot(config: BotDetectionConfig = {}): BotDetectionResult {
  const mergedConfig = { ...DEFAULT_BOT_DETECTION_CONFIG, ...config };

  const checks = {
    webdriver: mergedConfig.checkWebdriver ? checkWebdriver() : false,
    phantomjs: mergedConfig.checkPhantomJS ? checkPhantomJS() : false,
    nightmare: mergedConfig.checkNightmare ? checkNightmare() : false,
    automationGlobals: mergedConfig.checkAutomationGlobals ? checkAutomationGlobals() : false,
    documentAttributes: mergedConfig.checkDocumentAttributes ? checkDocumentAttributes() : false,
    userAgentHeadless: mergedConfig.checkUserAgentHeadless ? checkUserAgentHeadless() : false,
    userAgentHttpClient: mergedConfig.checkUserAgentHttpClient
      ? checkUserAgentHttpClient(config.additionalBotPatterns)
      : false,
    missingUserAgent: checkMissingUserAgent(),
    invalidEnvironment: checkInvalidEnvironment(),
  };

  // Determine the reason for bot detection
  let reason: string | undefined;
  if (checks.webdriver) {
    reason = 'WebDriver detected';
  } else if (checks.phantomjs) {
    reason = 'PhantomJS detected';
  } else if (checks.nightmare) {
    reason = 'Nightmare.js detected';
  } else if (checks.automationGlobals) {
    reason = 'Automation tool globals detected';
  } else if (checks.documentAttributes) {
    reason = 'Automation attributes on document element';
  } else if (checks.userAgentHeadless) {
    reason = 'Headless browser user agent detected';
  } else if (checks.userAgentHttpClient) {
    reason = 'HTTP client/bot user agent detected';
  } else if (checks.missingUserAgent) {
    reason = 'Missing or invalid user agent';
  } else if (checks.invalidEnvironment) {
    reason = 'Invalid browser environment';
  }

  const isBot = Object.values(checks).some(Boolean);

  const result: BotDetectionResult = {
    isBot,
    reason,
    checks,
  };

  // Call callback if provided and bot was detected
  if (isBot && config.onBotDetected) {
    try {
      config.onBotDetected(result);
    } catch {
      // Ignore callback errors
    }
  }

  return result;
}

/**
 * Quick check if current visitor is a bot
 *
 * @param config - Bot detection configuration
 * @returns true if bot detected, false otherwise
 *
 * @example
 * ```typescript
 * if (isBot()) {
 *   console.log('Bot detected, skipping tracking');
 *   return;
 * }
 * ```
 */
export function isBot(config: BotDetectionConfig = {}): boolean {
  return detectBot(config).isBot;
}

/**
 * Check a custom user agent string for bot patterns
 * Useful for server-side bot detection
 *
 * @param userAgent - The user agent string to check
 * @param additionalPatterns - Additional patterns to check
 * @returns true if bot user agent detected
 *
 * @example
 * ```typescript
 * // Server-side usage
 * const ua = request.headers['user-agent'];
 * if (isUserAgentBot(ua)) {
 *   console.log('Bot request detected');
 * }
 * ```
 */
export function isUserAgentBot(userAgent: string, additionalPatterns?: string[]): boolean {
  if (!userAgent || userAgent.length < 10) {
    return true;
  }

  const ua = userAgent.toLowerCase();

  // Check headless patterns
  for (const pattern of HEADLESS_PATTERNS) {
    if (ua.includes(pattern)) {
      return true;
    }
  }

  // Check HTTP client patterns
  for (const pattern of HTTP_CLIENT_PATTERNS) {
    if (ua.includes(pattern)) {
      return true;
    }
  }

  // Check additional patterns
  if (additionalPatterns) {
    for (const pattern of additionalPatterns) {
      if (ua.includes(pattern.toLowerCase())) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Get the current user agent (browser only)
 *
 * @returns User agent string or null if not in browser
 */
export function getUserAgent(): string | null {
  if (!isBrowser()) return null;

  try {
    return window.navigator?.userAgent || null;
  } catch {
    return null;
  }
}
