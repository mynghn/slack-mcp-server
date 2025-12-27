# Data Model: Authentication Workaround

**Feature Branch**: `002-auth-workaround`
**Date**: 2025-12-25

## Overview

This feature introduces authentication configuration types to support both bot token and user token authentication methods. No persistent storage is required - all configuration comes from environment variables at startup.

---

## Entities

### AuthType (Enumeration)

Represents the active authentication method.

| Value | Description |
|-------|-------------|
| `bot` | Bot token authentication (xoxb-*) |
| `user` | User token authentication (xoxc-* + d cookie) |

### AuthConfig (Type)

Configuration for the Slack client authentication.

```typescript
type AuthConfig =
  | { type: "bot"; token: string }
  | { type: "user"; token: string; cookie: string };
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| type | `"bot"` \| `"user"` | Yes | Authentication method |
| token | string | Yes | Slack API token (xoxb-* or xoxc-*) |
| cookie | string | User only | The "d" cookie value for user token auth |

### Environment Variables

| Variable | Token Type | Required | Description |
|----------|------------|----------|-------------|
| `SLACK_BOT_TOKEN` | Bot | If no user token | Bot User OAuth Token (xoxb-*) |
| `SLACK_USER_TOKEN` | User | If no bot token | User session token (xoxc-*) |
| `SLACK_COOKIE_D` | User | With user token | Session cookie value (xoxd-*) |

---

## Validation Rules

### Token Format Validation

| Rule | Pattern | Error Message |
|------|---------|---------------|
| Bot token prefix | `/^xoxb-/` | "Bot token must start with 'xoxb-'" |
| User token prefix | `/^xoxc-/` | "User token must start with 'xoxc-'" |
| Cookie format | Non-empty string | "Cookie value is required for user token authentication" |

### Configuration Validation

| Rule | Condition | Error Message |
|------|-----------|---------------|
| At least one auth method | `botToken \|\| (userToken && cookie)` | "No authentication configured. Set SLACK_BOT_TOKEN or both SLACK_USER_TOKEN and SLACK_COOKIE_D" |
| User token requires cookie | `userToken → cookie` | "SLACK_COOKIE_D is required when using SLACK_USER_TOKEN" |

---

## State Transitions

### Authentication Resolution Flow

```
┌─────────────────────────────┐
│ Read Environment Variables  │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│ SLACK_BOT_TOKEN present?    │
│                             │
│   Yes ──► Use Bot Auth      │
│   No  ──► Check User Auth   │
└─────────────┬───────────────┘
              │ No
              ▼
┌─────────────────────────────┐
│ SLACK_USER_TOKEN present?   │
│                             │
│   Yes ──► Check Cookie      │
│   No  ──► Error: No Auth    │
└─────────────┬───────────────┘
              │ Yes
              ▼
┌─────────────────────────────┐
│ SLACK_COOKIE_D present?     │
│                             │
│   Yes ──► Use User Auth     │
│   No  ──► Error: No Cookie  │
└─────────────────────────────┘
```

### Priority Rules

1. If `SLACK_BOT_TOKEN` is set, use bot authentication (backward compatibility)
2. If only user credentials are set, use user authentication
3. If neither is set, fail with descriptive error

---

## Relationships

```
┌──────────────────┐
│   Environment    │
│    Variables     │
└────────┬─────────┘
         │ reads
         ▼
┌──────────────────┐      creates      ┌──────────────────┐
│   AuthConfig     │ ───────────────►  │   WebClient      │
│                  │                   │   (configured)   │
└──────────────────┘                   └──────────────────┘
         │
         │ determines
         ▼
┌──────────────────┐
│   AuthType       │
│   (bot | user)   │
└──────────────────┘
```

---

## Security Considerations

### Credential Masking

Credentials must never appear in:
- Log output
- Error messages
- Stack traces
- Debug information

### Masking Function

```typescript
function maskCredential(value: string): string {
  if (value.length <= 8) return "***";
  return value.slice(0, 4) + "***" + value.slice(-4);
}
// "xoxc-123456789" → "xoxc***6789"
```
