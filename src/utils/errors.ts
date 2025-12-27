import type { SlackMcpError } from "../slack/types.js";

// Authentication error messages
export const AUTH_ERRORS = {
  NO_AUTH_CONFIGURED:
    "No authentication configured. " +
    "Set SLACK_BOT_TOKEN for bot authentication, or both " +
    "SLACK_USER_TOKEN and SLACK_COOKIE_D for user token authentication.",

  MISSING_COOKIE:
    "SLACK_COOKIE_D is required when using SLACK_USER_TOKEN. " +
    "User token authentication requires both the token and the session cookie.",

  SEARCH_REQUIRES_USER_TOKEN:
    "Search requires user token authentication. " +
    "Configure SLACK_USER_TOKEN and SLACK_COOKIE_D to enable search functionality.",
} as const;

/**
 * Masks a credential value for safe logging/display.
 * Short values (8 chars or less) are completely masked.
 * Longer values show first 4 and last 4 characters.
 */
export function maskCredential(value: string): string {
  if (value.length <= 8) return "***";
  return value.slice(0, 4) + "***" + value.slice(-4);
}

const ERROR_MESSAGES: Record<string, string> = {
  rate_limited: "Rate limited by Slack API",
  invalid_auth: "Invalid Slack token. Please check your authentication credentials",
  missing_scope: "Token lacks required scope",
  channel_not_found: "Channel not found or not accessible",
  user_not_found: "User not found",
  not_in_channel: "Bot is not a member of this channel",
  thread_not_found: "Thread not found",
};

const RETRYABLE_ERRORS = new Set(["rate_limited", "internal_error"]);

export interface ErrorContext {
  channelId?: string;
  userId?: string;
  threadTs?: string;
}

export function mapSlackError(
  error: unknown,
  context?: ErrorContext
): SlackMcpError {
  if (error instanceof Error && "code" in error) {
    const slackError = error as Error & {
      code: string;
      data?: { error?: string; retry_after?: number };
    };

    const errorCode = slackError.data?.error ?? slackError.code;
    let message = ERROR_MESSAGES[errorCode] ?? `Slack API error: ${errorCode}`;

    // Add context to "not found" errors
    if (context) {
      if (errorCode === "channel_not_found" && context.channelId) {
        message = `Channel ${context.channelId} not found or not accessible`;
      } else if (errorCode === "user_not_found" && context.userId) {
        message = `User ${context.userId} not found`;
      } else if (errorCode === "thread_not_found" && context.threadTs) {
        message = `Thread ${context.threadTs} not found`;
      } else if (errorCode === "not_in_channel" && context.channelId) {
        message = `Bot is not a member of channel ${context.channelId}`;
      }
    }

    const retryable = RETRYABLE_ERRORS.has(errorCode);
    const retryAfter = slackError.data?.retry_after;

    return {
      code: errorCode,
      message,
      retryable,
      ...(retryAfter !== undefined && { retryAfter }),
    };
  }

  if (error instanceof Error) {
    return {
      code: "unknown_error",
      message: error.message,
      retryable: false,
    };
  }

  return {
    code: "unknown_error",
    message: String(error),
    retryable: false,
  };
}

export function formatErrorForMcp(error: SlackMcpError): {
  content: Array<{ type: "text"; text: string }>;
  isError: true;
} {
  let text = `Error: ${error.code} - ${error.message}`;
  if (error.retryAfter !== undefined) {
    text += `. Please retry after ${error.retryAfter} seconds.`;
  }

  return {
    content: [{ type: "text", text }],
    isError: true,
  };
}
