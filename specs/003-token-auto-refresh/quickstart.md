# Quickstart: Token Auto-Refresh

**Feature**: 003-token-auto-refresh | **Date**: 2025-12-28

## Overview

This feature adds automatic refresh of Slack user credentials to prevent authentication failures. Once configured, the MCP server will automatically refresh **both** the xoxc token and d cookie every 7 days (configurable) and persist them across restarts.

**How it works**: A single request to the Slack workspace refreshes both credentials:
- **xoxc token**: New value returned in response body
- **d cookie**: New value returned in `Set-Cookie` header (Slack uses sliding expiration)

## Prerequisites

- Existing slack-mcp-server installation with user token authentication
- Valid `SLACK_USER_TOKEN` (xoxc-) and `SLACK_COOKIE_D` (xoxd-) credentials
- Workspace name (e.g., "mycompany" from mycompany.slack.com)

## Configuration

### Required Environment Variables

```bash
# Existing (already configured for user token auth)
SLACK_USER_TOKEN=xoxc-your-token
SLACK_COOKIE_D=xoxd-your-cookie

# New (required for refresh)
SLACK_WORKSPACE=your-workspace-name
```

### Optional Environment Variables

```bash
# Credential storage location (default: ~/.slack-mcp-server/credentials.json)
SLACK_CREDENTIALS_PATH=/path/to/credentials.json

# Refresh interval in days (default: 7)
SLACK_REFRESH_INTERVAL_DAYS=7

# Enable/disable auto-refresh (default: true)
SLACK_REFRESH_ENABLED=true
```

## Usage

### Automatic Refresh

Once configured, auto-refresh works transparently:

1. On startup, credentials are validated and refresh scheduling begins
2. Every hour, the system checks if refresh is due
3. When due, both xoxc token and d cookie are refreshed via workspace request
4. New credentials are persisted to the credentials file
5. If refresh fails, retries occur with exponential backoff (max 3 attempts)
6. Current credentials remain valid until session is revoked

### Manual Refresh

Trigger a refresh on-demand using the MCP tool:

```json
{
  "method": "tools/call",
  "params": {
    "name": "refresh_credentials",
    "arguments": {}
  }
}
```

Response:
```json
{
  "success": true,
  "message": "Credentials refreshed successfully",
  "refreshedAt": "2025-12-28T15:30:00.000Z",
  "totalRefreshes": 5
}
```

## Monitoring

### Log Events

The system logs all refresh activity:

```
INFO  Credential refresh scheduled: next refresh in 7 days
INFO  Starting credential refresh (auto-triggered)
INFO  Credential refresh successful (attempt 1/3)
WARN  Credential refresh failed, retrying: NETWORK_ERROR
ERROR Credential refresh failed after 3 attempts: SESSION_REVOKED
```

### Credential File

View current credential state:

```bash
cat ~/.slack-mcp-server/credentials.json | jq
```

```json
{
  "version": 1,
  "credentials": {
    "token": "xoxc-...",
    "cookie": "xoxd-...",
    "workspace": "mycompany"
  },
  "metadata": {
    "lastRefreshed": "2025-12-28T10:00:00Z",
    "refreshCount": 5,
    "source": "auto-refresh"
  }
}
```

## Troubleshooting

### "SESSION_REVOKED" Error

Your Slack session has been invalidated (logged out elsewhere). Resolution:
1. Log into Slack via browser
2. Extract new xoxc token and d cookie
3. Update environment variables
4. Restart MCP server

### "NETWORK_ERROR" Persists

Check network connectivity to Slack:
```bash
curl -I https://your-workspace.slack.com
```

### Refresh Not Triggering

Verify configuration:
```bash
echo $SLACK_REFRESH_ENABLED  # Should be "true" or unset
echo $SLACK_WORKSPACE        # Must be set for refresh
```

## Backward Compatibility

- Bot token authentication (`SLACK_BOT_TOKEN`) is unaffected
- If both bot and user tokens are configured, bot token takes precedence
- Auto-refresh only applies to user token authentication
