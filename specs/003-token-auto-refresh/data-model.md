# Data Model: Slack User Token and D Cookie Auto Refresh

**Feature**: 003-token-auto-refresh | **Date**: 2025-12-28

## Entities

### 1. StoredCredentials

Represents persisted credentials in the JSON file. **Both credentials are refreshed** on each refresh operation:
- `token` (xoxc): New value from response body
- `cookie` (xoxd): New value from `Set-Cookie` response header (sliding expiration)

```typescript
interface StoredCredentials {
  version: 1;
  credentials: {
    token: string;      // xoxc-prefixed user token (refreshed from response body)
    cookie: string;     // xoxd-prefixed d cookie (refreshed from Set-Cookie header)
    workspace: string;  // Workspace identifier for refresh requests
  };
  metadata: {
    lastRefreshed: string;  // ISO 8601 timestamp
    refreshCount: number;   // Total successful refreshes
    source: "initial" | "auto-refresh" | "manual-refresh";
  };
}
```

**Validation Rules**:
- `token` MUST start with "xoxc-"
- `cookie` MUST start with "xoxd-"
- `workspace` MUST be non-empty string
- `lastRefreshed` MUST be valid ISO 8601 timestamp
- `refreshCount` MUST be non-negative integer

**File Location**: `~/.slack-mcp-server/credentials.json` (configurable via `SLACK_CREDENTIALS_PATH`)

---

### 2. RefreshState

Tracks the current status of refresh operations (in-memory only).

```typescript
type RefreshStatus = "idle" | "in_progress" | "succeeded" | "failed";

interface RefreshState {
  status: RefreshStatus;
  lastAttempt: Date | null;
  lastSuccess: Date | null;
  lastError: RefreshError | null;
  consecutiveFailures: number;
  isManualTrigger: boolean;
}
```

**State Transitions**:

```
idle ──(refresh triggered)──> in_progress
in_progress ──(success)──> succeeded ──(auto)──> idle
in_progress ──(failure, retries left)──> in_progress
in_progress ──(failure, no retries)──> failed ──(auto)──> idle
```

**Invariants**:
- Only one refresh operation can be `in_progress` at a time
- `consecutiveFailures` resets to 0 on success
- `lastError` is cleared on success

---

### 3. RefreshError

Captures details about refresh failures.

```typescript
interface RefreshError {
  code: RefreshErrorCode;
  message: string;
  timestamp: Date;
  attempt: number;
  retryable: boolean;
}

type RefreshErrorCode =
  | "NETWORK_ERROR"      // Transient network issue
  | "RATE_LIMITED"       // Slack rate limit (429)
  | "SESSION_REVOKED"    // Credentials no longer valid
  | "INVALID_RESPONSE"   // Unexpected response format
  | "STORAGE_ERROR"      // Failed to persist credentials
  | "UNKNOWN";           // Unexpected error
```

---

### 4. RefreshSchedule

Configuration and timing for automatic refresh (in-memory, derived from config).

```typescript
interface RefreshSchedule {
  intervalDays: number;      // Default: 7, from SLACK_REFRESH_INTERVAL_DAYS
  checkIntervalMs: number;   // Default: 3600000 (1 hour)
  nextCheckAt: Date;
  enabled: boolean;          // false for bot tokens
}
```

**Derived Values**:
- `nextRefreshDue`: `lastRefreshed + (intervalDays * 24 * 60 * 60 * 1000)`
- `isRefreshDue`: `Date.now() >= nextRefreshDue`

---

### 5. RefreshResult

Return type for refresh operations.

```typescript
type RefreshResult =
  | { success: true; credentials: StoredCredentials }
  | { success: false; error: RefreshError };
```

---

## Relationships

```
┌─────────────────────────────────────────────────────────────┐
│                     RefreshManager                          │
│  (orchestrates all refresh operations)                      │
└─────────────┬───────────────────────────┬───────────────────┘
              │                           │
              ▼                           ▼
┌─────────────────────────┐   ┌───────────────────────────────┐
│   CredentialStorage     │   │      RefreshScheduler         │
│                         │   │                               │
│ - load(): Credentials   │   │ - start(): void               │
│ - save(creds): void     │   │ - stop(): void                │
│ - exists(): boolean     │   │ - triggerManual(): Promise    │
└─────────────────────────┘   └───────────────────────────────┘
              │                           │
              ▼                           │
┌─────────────────────────┐               │
│   credentials.json      │               │
│   (filesystem)          │               │
└─────────────────────────┘               │
                                          ▼
                              ┌───────────────────────────────┐
                              │   RefreshState (in-memory)    │
                              │   RefreshSchedule (in-memory) │
                              └───────────────────────────────┘
```

---

## Storage Schema

### credentials.json

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["version", "credentials", "metadata"],
  "properties": {
    "version": {
      "type": "integer",
      "const": 1
    },
    "credentials": {
      "type": "object",
      "required": ["token", "cookie", "workspace"],
      "properties": {
        "token": {
          "type": "string",
          "pattern": "^xoxc-"
        },
        "cookie": {
          "type": "string",
          "pattern": "^xoxd-"
        },
        "workspace": {
          "type": "string",
          "minLength": 1
        }
      }
    },
    "metadata": {
      "type": "object",
      "required": ["lastRefreshed", "refreshCount", "source"],
      "properties": {
        "lastRefreshed": {
          "type": "string",
          "format": "date-time"
        },
        "refreshCount": {
          "type": "integer",
          "minimum": 0
        },
        "source": {
          "type": "string",
          "enum": ["initial", "auto-refresh", "manual-refresh"]
        }
      }
    }
  }
}
```

---

## Environment Variables

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `SLACK_CREDENTIALS_PATH` | string | `~/.slack-mcp-server/credentials.json` | Path to credential storage file |
| `SLACK_REFRESH_INTERVAL_DAYS` | number | `7` | Days between automatic refreshes |
| `SLACK_WORKSPACE` | string | (required for refresh) | Workspace name for token regeneration |
| `SLACK_REFRESH_ENABLED` | boolean | `true` | Enable/disable auto-refresh |

---

## Backward Compatibility

Bot token authentication (`SLACK_BOT_TOKEN`) remains unchanged:
- No refresh mechanism (bot tokens don't expire)
- No credential persistence needed
- `RefreshSchedule.enabled = false` for bot auth
