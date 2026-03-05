type LogLevel = 'error' | 'info' | 'debug';

const levelOrder: Record<LogLevel, number> = {
  error: 0,
  info: 1,
  debug: 2
};

const parseLogLevel = (value: string | undefined): LogLevel => {
  const normalized = (value || 'info').toLowerCase();
  if (normalized === 'error' || normalized === 'info' || normalized === 'debug') {
    return normalized;
  }
  return 'info';
};

const activeLevel = parseLogLevel(process.env.LOG_LEVEL);

const shouldLog = (level: LogLevel): boolean => {
  return levelOrder[level] <= levelOrder[activeLevel];
};

export const logger = {
  error: (...args: unknown[]): void => {
    if (shouldLog('error')) {
      console.error(...args);
    }
  },
  info: (...args: unknown[]): void => {
    if (shouldLog('info')) {
      console.log(...args);
    }
  },
  debug: (...args: unknown[]): void => {
    if (shouldLog('debug')) {
      console.log(...args);
    }
  }
};
