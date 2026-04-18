import pino from "pino";

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
  details?: Record<string, unknown>,
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
  details?: Record<string, unknown>,
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
  details?: Record<string, unknown>,
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
  details?: Record<string, unknown>,
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
  details?: Record<string, unknown>,
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
