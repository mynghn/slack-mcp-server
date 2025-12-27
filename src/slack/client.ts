import { WebClient } from "@slack/web-api";
import type { AuthConfig, AuthType } from "./types.js";
import { AUTH_ERRORS } from "../utils/errors.js";

let slackClient: WebClient | null = null;
let cachedAuthConfig: AuthConfig | null = null;

/**
 * Resolves authentication configuration from environment variables.
 *
 * Priority:
 * 1. SLACK_BOT_TOKEN (if set, use bot auth for backward compatibility)
 * 2. SLACK_USER_TOKEN + SLACK_COOKIE_D (if both set, use user auth)
 * 3. Error if neither is configured
 */
export function resolveAuthConfig(): AuthConfig {
  if (cachedAuthConfig) {
    return cachedAuthConfig;
  }

  const botToken = process.env.SLACK_BOT_TOKEN;
  const userToken = process.env.SLACK_USER_TOKEN;
  const cookie = process.env.SLACK_COOKIE_D;

  // Bot token authentication (priority for backward compatibility)
  if (botToken) {
    cachedAuthConfig = {
      type: "bot",
      token: botToken,
    };
    return cachedAuthConfig;
  }

  // User token authentication
  if (userToken) {
    // Validate xoxc- prefix
    if (!userToken.startsWith("xoxc-")) {
      throw new Error(
        "User token must start with 'xoxc-'. " +
          "Please provide a valid Slack user session token."
      );
    }

    // Cookie is required for user token
    if (!cookie) {
      throw new Error(AUTH_ERRORS.MISSING_COOKIE);
    }

    cachedAuthConfig = {
      type: "user",
      token: userToken,
      cookie,
    };
    return cachedAuthConfig;
  }

  // No valid configuration found
  throw new Error(AUTH_ERRORS.NO_AUTH_CONFIGURED);
}

/**
 * Returns the current authentication type.
 */
export function getAuthType(): AuthType {
  const config = resolveAuthConfig();
  return config.type;
}

/**
 * Checks if search functionality is available.
 * Search requires user token authentication.
 */
export function isSearchAvailable(): boolean {
  return getAuthType() === "user";
}

export function getSlackClient(): WebClient {
  if (!slackClient) {
    const config = resolveAuthConfig();

    if (config.type === "user") {
      // User token auth: include Cookie header
      slackClient = new WebClient(config.token, {
        headers: {
          Cookie: `d=${config.cookie}`,
        },
      });
    } else {
      // Bot token auth (to be implemented in US3)
      slackClient = new WebClient(config.token);
    }
  }
  return slackClient;
}

export function resetSlackClient(): void {
  slackClient = null;
  cachedAuthConfig = null;
}
