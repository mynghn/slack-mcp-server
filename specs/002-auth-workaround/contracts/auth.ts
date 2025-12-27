/**
 * Authentication Module Contract
 * Feature: 002-auth-workaround
 *
 * This file defines the TypeScript interfaces for the authentication
 * system. Implementation must conform to these contracts.
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Authentication method type
 */
export type AuthType = "bot" | "user";

/**
 * Bot token authentication configuration
 */
export interface BotAuthConfig {
  type: "bot";
  /** Slack Bot User OAuth Token (xoxb-*) */
  token: string;
}

/**
 * User token authentication configuration
 */
export interface UserAuthConfig {
  type: "user";
  /** Slack user session token (xoxc-*) */
  token: string;
  /** Slack "d" cookie value */
  cookie: string;
}

/**
 * Union type for all authentication configurations
 */
export type AuthConfig = BotAuthConfig | UserAuthConfig;

// ============================================================================
// Functions
// ============================================================================

/**
 * Resolves authentication configuration from environment variables.
 *
 * Priority:
 * 1. SLACK_BOT_TOKEN (if set, use bot auth)
 * 2. SLACK_USER_TOKEN + SLACK_COOKIE_D (if both set, use user auth)
 * 3. Error if neither is configured
 *
 * @throws Error if no valid authentication is configured
 * @throws Error if SLACK_USER_TOKEN is set without SLACK_COOKIE_D
 */
export declare function resolveAuthConfig(): AuthConfig;

/**
 * Returns the current authentication type.
 *
 * @returns "bot" or "user" depending on configured credentials
 * @throws Error if called before authentication is configured
 */
export declare function getAuthType(): AuthType;

/**
 * Creates and returns a configured Slack WebClient.
 *
 * - For bot auth: Creates WebClient with token only
 * - For user auth: Creates WebClient with token and Cookie header
 *
 * @returns Configured WebClient instance
 * @throws Error if no valid authentication is configured
 */
export declare function getSlackClient(): import("@slack/web-api").WebClient;

/**
 * Checks if search functionality is available.
 *
 * Search requires user token authentication. Returns false for bot tokens.
 *
 * @returns true if user token auth is configured, false otherwise
 */
export declare function isSearchAvailable(): boolean;

/**
 * Resets the cached client instance (for testing).
 */
export declare function resetSlackClient(): void;

// ============================================================================
// Error Messages (Constants)
// ============================================================================

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
