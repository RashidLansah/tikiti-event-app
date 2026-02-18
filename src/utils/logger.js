/**
 * Production-safe logger utility
 * Only logs in development mode (__DEV__), except errors which always log.
 */
const isDev = __DEV__;

export const logger = {
  log: (...args) => isDev && console.log(...args),
  info: (...args) => isDev && console.info(...args),
  warn: (...args) => isDev && console.warn(...args),
  error: (...args) => console.error(...args), // always log errors
  debug: (...args) => isDev && console.debug(...args),
};

export default logger;
