# MCP Tool Contract: refresh_credentials

**Feature**: 003-token-auto-refresh | **Date**: 2025-12-28

## Overview

Manual trigger for credential refresh. Allows operators to proactively refresh Slack user credentials when needed (e.g., after network recovery, before planned maintenance).

Implements **FR-007**: System MUST provide a mechanism to manually trigger credential refresh.

---

## Tool Definition

### Name
`refresh_credentials`

### Description
Manually trigger a refresh of Slack user credentials (token and cookie). Returns the refresh result including success status and any error details. Only available when using user token authentication.

---

## Input Schema

```typescript
// No input parameters required
interface RefreshCredentialsInput {
  // Empty - refresh uses current credentials
}
```

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {},
  "additionalProperties": false
}
```

---

## Output Schema

### Success Response

```typescript
interface RefreshCredentialsSuccessOutput {
  success: true;
  message: string;
  refreshedAt: string;  // ISO 8601 timestamp
  totalRefreshes: number;
}
```

```json
{
  "success": true,
  "message": "Credentials refreshed successfully",
  "refreshedAt": "2025-12-28T15:30:00.000Z",
  "totalRefreshes": 12
}
```

### Failure Response

```typescript
interface RefreshCredentialsFailureOutput {
  success: false;
  error: {
    code: string;
    message: string;
    retryable: boolean;
  };
}
```

```json
{
  "success": false,
  "error": {
    "code": "SESSION_REVOKED",
    "message": "Slack session has been revoked. Please re-authenticate and update credentials.",
    "retryable": false
  }
}
```

### Not Available Response

When using bot token authentication (refresh not applicable):

```json
{
  "success": false,
  "error": {
    "code": "REFRESH_NOT_AVAILABLE",
    "message": "Credential refresh is only available for user token authentication. Bot tokens do not expire.",
    "retryable": false
  }
}
```

### Already In Progress Response

When a refresh is already running (per FR-007 acceptance scenario 2):

```json
{
  "success": false,
  "error": {
    "code": "REFRESH_IN_PROGRESS",
    "message": "A credential refresh is already in progress. Please wait for it to complete.",
    "retryable": true
  }
}
```

---

## Zod Schema (Implementation)

```typescript
import { z } from "zod";

export const RefreshCredentialsInputSchema = z.object({});

export const RefreshCredentialsOutputSchema = z.discriminatedUnion("success", [
  z.object({
    success: z.literal(true),
    message: z.string(),
    refreshedAt: z.string().datetime(),
    totalRefreshes: z.number().int().nonnegative(),
  }),
  z.object({
    success: z.literal(false),
    error: z.object({
      code: z.string(),
      message: z.string(),
      retryable: z.boolean(),
    }),
  }),
]);
```

---

## Behavior

### Preconditions
1. MCP server is running
2. User token authentication is configured

### Flow
1. Check if using user token auth (return error if bot token)
2. Check if refresh already in progress (return status if so)
3. Attempt credential refresh with retry logic
4. On success: persist new credentials, update state, return success
5. On failure: return error with details

### Performance
- MUST complete within 10 seconds under normal conditions (SC-004)
- Retry attempts use exponential backoff (max 3 attempts)

### Concurrency
- Only one refresh operation at a time
- Subsequent requests while refresh is in progress return `REFRESH_IN_PROGRESS`

---

## Error Codes

| Code | Description | Retryable |
|------|-------------|-----------|
| `REFRESH_NOT_AVAILABLE` | Bot token auth, refresh not applicable | No |
| `REFRESH_IN_PROGRESS` | Another refresh already running | Yes |
| `NETWORK_ERROR` | Network connectivity issue | Yes |
| `RATE_LIMITED` | Slack rate limit exceeded | Yes |
| `SESSION_REVOKED` | Credentials invalidated, re-auth needed | No |
| `STORAGE_ERROR` | Failed to persist new credentials | Yes |
| `INVALID_RESPONSE` | Unexpected response from Slack | No |
| `UNKNOWN` | Unexpected error | No |

---

## Example Usage

### MCP Request
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "refresh_credentials",
    "arguments": {}
  }
}
```

### MCP Response (Success)
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"success\":true,\"message\":\"Credentials refreshed successfully\",\"refreshedAt\":\"2025-12-28T15:30:00.000Z\",\"totalRefreshes\":12}"
      }
    ],
    "isError": false
  }
}
```
