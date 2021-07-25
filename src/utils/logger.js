const { RAYDIANT_APP_LOG_LEVEL } = process.env;

const LOG_LEVELS = {
  DEBUG: 1,
  INFO: 2,
  WARN: 3,
  ERROR: 4,
};

let loggerContext = undefined;

const LOG_LEVEL = LOG_LEVELS[RAYDIANT_APP_LOG_LEVEL] || LOG_LEVELS.WARN;

const getCallerName = () => {
  const re = /(\w+)@|at ([\w._$]+) \(/g;
  const stack = new Error().stack;
  // ignore first 2 matches
  re.exec(stack);
  re.exec(stack);
  const matches = re.exec(stack);
  return matches[1] || matches[2];
};

const getContextString = () => (loggerContext ? `${JSON.stringify(loggerContext)} |` : '');

function debug(...args) {
  if (LOG_LEVEL <= LOG_LEVELS.DEBUG) {
    console.debug('DEBUG |', getContextString(), getCallerName(), '|', ...args);
  }
}

function info(...args) {
  if (LOG_LEVEL <= LOG_LEVELS.INFO) {
    console.info('INFO |', getContextString(), getCallerName(), '|', ...args);
  }
}

function warn(...args) {
  if (LOG_LEVEL <= LOG_LEVELS.WARN) {
    console.warn('WARN |', getContextString(), getCallerName(), '|', ...args);
  }
}

function error(...args) {
  if (LOG_LEVEL <= LOG_LEVELS.ERROR) {
    console.warn('ERROR |', getContextString(), getCallerName(), '|', ...args);
  }
}

function setContext(context) {
  loggerContext = context;
}

export default {
  debug,
  info,
  warn,
  error,
  setContext,
};
