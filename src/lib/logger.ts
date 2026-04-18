import pino from "pino";

type LogDetails = Record<string, unknown>;

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

// Helper functions for common log patterns
export const logAuthEvent = (
  event: string,
  userId?: string,
  orgId?: string,
  details?: LogDetails,
) => {
  logger.info(
    {
      event: "auth",
      action: event,
      userId,
      orgId,
      ...details,
    },
    `Auth event: ${event}`,
  );
};

export const logMutation = (
  operation: string,
  resource: string,
  userId: string,
  orgId: string,
  resourceId?: string,
  details?: LogDetails,
) => {
  logger.info(
    {
      event: "mutation",
      operation,
      resource,
      userId,
      orgId,
      resourceId,
      ...details,
    },
    `Mutation: ${operation} ${resource}`,
  );
};

export const logAIRequest = (
  action: string,
  userId: string,
  orgId: string,
  noteId?: string,
  details?: LogDetails,
) => {
  logger.info(
    {
      event: "ai",
      action,
      userId,
      orgId,
      noteId,
      ...details,
    },
    `AI request: ${action}`,
  );
};

export const logPermissionDenied = (
  action: string,
  userId?: string,
  orgId?: string,
  resource?: string,
  details?: LogDetails,
) => {
  logger.warn(
    {
      event: "permission_denied",
      action,
      userId,
      orgId,
      resource,
      ...details,
    },
    `Permission denied: ${action}`,
  );
};

export const logError = (
  error: Error,
  context: string,
  userId?: string,
  details?: LogDetails,
) => {
  logger.error(
    {
      event: "error",
      context,
      userId,
      error: error.message,
      stack: error.stack,
      ...details,
    },
    `Error in ${context}: ${error.message}`,
  );
};
