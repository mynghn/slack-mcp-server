# Quickstart: User Token Authentication

**Feature Branch**: `002-auth-workaround`

## Overview

This guide explains how to configure the Slack MCP server with user token authentication, which enables access to user-only features like workspace search.

## Prerequisites

- Node.js 20+
- Access to a Slack workspace
- Browser with developer tools (to extract credentials)

## Obtaining Credentials

### Step 1: Get User Token (xoxc-*)

1. Open Slack in your web browser
2. Open Developer Tools (F12 or Cmd+Option+I)
3. Go to the **Network** tab
4. Look for a request starting with `client.boot`
5. In the **Payload** tab, find and copy the `token` value
   - It should start with `xoxc-`

### Step 2: Get the "d" Cookie

1. In the same Developer Tools window
2. Go to **Application** → **Cookies** → `https://app.slack.com`
3. Find the cookie named `d`
4. Copy its value (starts with `xoxd-`)

## Configuration

### Option A: User Token Only

Use this when you need search functionality and user-level access.

```bash
export SLACK_USER_TOKEN="xoxc-your-token-here"
export SLACK_COOKIE_D="xoxd-your-cookie-here"
```

### Option B: Bot Token Only (Existing Behavior)

Use this for standard bot functionality (no search).

```bash
export SLACK_BOT_TOKEN="xoxb-your-bot-token"
```

### Priority Rules

If multiple credentials are configured:

| SLACK_BOT_TOKEN | SLACK_USER_TOKEN | Result |
|-----------------|------------------|--------|
| Set | - | Bot auth (ignores user token) |
| - | Set (with cookie) | User auth |
| Set | Set (with cookie) | Bot auth (backward compatible) |
| - | - | Error |

## Running the Server

```bash
# Build (if not already built)
npm run build

# Run with user token
SLACK_USER_TOKEN="xoxc-..." SLACK_COOKIE_D="xoxd-..." npm start

# Or with bot token (existing method)
SLACK_BOT_TOKEN="xoxb-..." npm start
```

## MCP Client Configuration

### Claude Desktop Example

```json
{
  "mcpServers": {
    "slack": {
      "command": "node",
      "args": ["/path/to/slack-mcp-server/build/index.js"],
      "env": {
        "SLACK_USER_TOKEN": "xoxc-your-token",
        "SLACK_COOKIE_D": "xoxd-your-cookie"
      }
    }
  }
}
```

## Feature Availability

| Feature | Bot Token | User Token |
|---------|-----------|------------|
| List channels | ✅ | ✅ |
| Read messages | ✅ | ✅ |
| List users | ✅ | ✅ |
| **Search messages** | ❌ | ✅ |
| **Search files** | ❌ | ✅ |

## Troubleshooting

### "SLACK_COOKIE_D is required"

You set `SLACK_USER_TOKEN` but forgot the cookie. Both are required for user auth.

### "Search requires user token authentication"

You're using a bot token but trying to search. Switch to user token auth.

### "invalid_auth" error

Your token or cookie may have expired. Re-extract credentials from browser.

### Cookie expiration

The "d" cookie typically expires after ~1 year. If authentication starts failing, extract fresh credentials.

## Security Notes

- **Never commit credentials** to version control
- User tokens have full access to your Slack account
- The "d" cookie is a session credential - treat it like a password
- Consider using environment variables from a secure secrets manager
