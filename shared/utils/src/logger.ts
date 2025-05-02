type LogLevel = "debug" | "info" | "warn" | "error";

interface LoggerOptions {
  environment?: string;
  isDevelopment?: boolean;
}

class CustomLogger {
  private environment: string;
  private isDevelopment: boolean;

  constructor(options: LoggerOptions = {}) {
    this.environment = options.environment ?? "development";
    this.isDevelopment = options.isDevelopment ?? this.environment === "development";
  }

  private formatMessage(level: LogLevel, message: string, ...args: unknown[]): string {
    const timestamp = new Date().toISOString();
    const envPrefix = `[${this.environment}]`;
    const levelPrefix = `[${level.toUpperCase()}]`;
    const formattedArgs = args.length
      ? ` ${args
          .map((arg) => (typeof arg === "object" ? JSON.stringify(arg, null, 2) : arg))
          .join(" ")}`
      : "";

    return `${timestamp} ${envPrefix} ${levelPrefix} ${message}${formattedArgs}`;
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.isDevelopment) {
      console.debug(this.formatMessage("debug", message, ...args));
    }
  }

  info(message: string, ...args: unknown[]): void {
    console.info(this.formatMessage("info", message, ...args));
  }

  warn(message: string, ...args: unknown[]): void {
    console.warn(this.formatMessage("warn", message, ...args));
  }

  error(message: string, ...args: unknown[]): void {
    console.error(this.formatMessage("error", message, ...args));
  }
}

export const logger = new CustomLogger();

export { CustomLogger };
