import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  resolveAuthConfig,
  getAuthType,
  isSearchAvailable,
  resetSlackClient,
} from "../../src/slack/client.js";
import { AUTH_ERRORS, maskCredential } from "../../src/utils/errors.js";

describe("resolveAuthConfig", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    // Clear any auth-related env vars
    delete process.env.SLACK_BOT_TOKEN;
    delete process.env.SLACK_USER_TOKEN;
    delete process.env.SLACK_COOKIE_D;
    resetSlackClient();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  // T004: resolveAuthConfig returns UserAuthConfig when SLACK_USER_TOKEN and SLACK_COOKIE_D are set
  it("returns UserAuthConfig when SLACK_USER_TOKEN and SLACK_COOKIE_D are set", () => {
    process.env.SLACK_USER_TOKEN = "xoxc-user-token-123";
    process.env.SLACK_COOKIE_D = "xoxd-cookie-value-456";

    const config = resolveAuthConfig();

    expect(config.type).toBe("user");
    expect(config.token).toBe("xoxc-user-token-123");
    if (config.type === "user") {
      expect(config.cookie).toBe("xoxd-cookie-value-456");
    }
  });

  // T005: resolveAuthConfig throws error when SLACK_USER_TOKEN is set without SLACK_COOKIE_D
  it("throws error when SLACK_USER_TOKEN is set without SLACK_COOKIE_D", () => {
    process.env.SLACK_USER_TOKEN = "xoxc-user-token-123";

    expect(() => resolveAuthConfig()).toThrow(AUTH_ERRORS.MISSING_COOKIE);
  });

  // T006: resolveAuthConfig validates xoxc- prefix for user token
  it("validates xoxc- prefix for user token", () => {
    process.env.SLACK_USER_TOKEN = "invalid-token";
    process.env.SLACK_COOKIE_D = "xoxd-cookie-value";

    expect(() => resolveAuthConfig()).toThrow("xoxc-");
  });

  // T011: resolveAuthConfig returns BotAuthConfig when only SLACK_BOT_TOKEN is set
  it("returns BotAuthConfig when only SLACK_BOT_TOKEN is set", () => {
    process.env.SLACK_BOT_TOKEN = "xoxb-bot-token-123";

    const config = resolveAuthConfig();

    expect(config.type).toBe("bot");
    expect(config.token).toBe("xoxb-bot-token-123");
  });

  // T012: resolveAuthConfig returns BotAuthConfig when both bot and user credentials are set (backward compatibility)
  it("returns BotAuthConfig when both bot and user credentials are set (backward compatibility)", () => {
    process.env.SLACK_BOT_TOKEN = "xoxb-bot-token-123";
    process.env.SLACK_USER_TOKEN = "xoxc-user-token-456";
    process.env.SLACK_COOKIE_D = "xoxd-cookie-value";

    const config = resolveAuthConfig();

    expect(config.type).toBe("bot");
    expect(config.token).toBe("xoxb-bot-token-123");
  });

  // T013: resolveAuthConfig throws error when no credentials are configured
  it("throws error when no credentials are configured", () => {
    expect(() => resolveAuthConfig()).toThrow(AUTH_ERRORS.NO_AUTH_CONFIGURED);
  });
});

describe("getAuthType", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    delete process.env.SLACK_BOT_TOKEN;
    delete process.env.SLACK_USER_TOKEN;
    delete process.env.SLACK_COOKIE_D;
    resetSlackClient();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  // T014 (partial): getAuthType returns correct type based on resolved config - user auth case
  it("returns 'user' when user token auth is configured", () => {
    process.env.SLACK_USER_TOKEN = "xoxc-user-token-123";
    process.env.SLACK_COOKIE_D = "xoxd-cookie-value-456";

    expect(getAuthType()).toBe("user");
  });

  // T014: getAuthType returns 'bot' when bot token auth is configured
  it("returns 'bot' when bot token auth is configured", () => {
    process.env.SLACK_BOT_TOKEN = "xoxb-bot-token-123";

    expect(getAuthType()).toBe("bot");
  });
});

describe("isSearchAvailable", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    delete process.env.SLACK_BOT_TOKEN;
    delete process.env.SLACK_USER_TOKEN;
    delete process.env.SLACK_COOKIE_D;
    resetSlackClient();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  // T018: isSearchAvailable returns true when user auth is configured
  it("returns true when user auth is configured", () => {
    process.env.SLACK_USER_TOKEN = "xoxc-user-token-123";
    process.env.SLACK_COOKIE_D = "xoxd-cookie-value-456";

    expect(isSearchAvailable()).toBe(true);
  });

  // T019: isSearchAvailable returns false when bot auth is configured
  it("returns false when bot auth is configured", () => {
    process.env.SLACK_BOT_TOKEN = "xoxb-bot-token-123";

    expect(isSearchAvailable()).toBe(false);
  });
});

describe("maskCredential", () => {
  // T024: maskCredential correctly masks short credentials
  it("correctly masks short credentials (8 chars or less)", () => {
    expect(maskCredential("abcd")).toBe("***");
    expect(maskCredential("12345678")).toBe("***");
    expect(maskCredential("")).toBe("***");
  });

  // T025: maskCredential correctly masks long credentials
  it("correctly masks long credentials (shows first 4 and last 4 chars)", () => {
    // "xoxc-123456789" → "xoxc***6789"
    expect(maskCredential("xoxc-123456789")).toBe("xoxc***6789");
    expect(maskCredential("xoxb-abcdefghij")).toBe("xoxb***ghij");
    expect(maskCredential("123456789")).toBe("1234***6789");
  });
});
