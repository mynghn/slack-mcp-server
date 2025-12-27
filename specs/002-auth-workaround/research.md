# Research: Authentication Workaround with User Token

**Feature Branch**: `002-auth-workaround`
**Date**: 2025-12-25

## Research Questions

1. How to pass custom headers (Cookie header) with @slack/web-api WebClient?
2. What is the correct format for xoxc-* tokens and the "d" cookie?
3. How to detect token type (user vs bot) for appropriate handling?

---

## 1. WebClient Custom Headers

### Decision: Use `headers` constructor option

### Rationale

The `@slack/web-api` WebClient constructor accepts a `headers` option of type `Record<string, string>` that adds custom HTTP headers to all requests. This is the simplest approach with no additional dependencies.

### Implementation

```typescript
import { WebClient } from "@slack/web-api";

const client = new WebClient(userToken, {
  headers: {
    Cookie: `d=${cookieValue}`,
  },
});
```

### Alternatives Considered

| Alternative | Rejected Because |
|-------------|------------------|
| `requestInterceptor` | More complex; `headers` option is simpler and purpose-built |
| Custom HTTP client | Unnecessary complexity; WebClient already supports headers |
| Raw fetch/axios | Loses all WebClient conveniences (retry, rate limiting, types) |

### Sources

- [WebClientOptions Reference](https://docs.slack.dev/tools/node-slack-sdk/reference/web-api/interfaces/WebClientOptions/)
- [Web API Documentation](https://docs.slack.dev/tools/node-slack-sdk/web-api/)

---

## 2. xoxc Token and "d" Cookie Format

### Decision: Accept xoxc-* tokens with xoxd-* cookie values

### Rationale

Slack user tokens (xoxc-*) require an accompanying "d" cookie for authentication. The cookie value typically starts with `xoxd-`. Both must be provided together for successful authentication.

### Token Formats

| Token Type | Prefix | Use Case |
|------------|--------|----------|
| Bot Token | `xoxb-` | App bot user access (current implementation) |
| User Token | `xoxc-` | User session access (this feature) |
| Legacy User | `xoxp-` | OAuth user token (not targeted) |

### Cookie Format

The "d" cookie must be passed in the Cookie header:
```
Cookie: d=xoxd-XXXXXXXX...
```

The cookie value:
- Starts with `xoxd-` prefix
- Previously had 10-year TTL, now ~1 year expiration
- Same cookie works across all workspaces for a user

### Sources

- [Retrieving and Using Slack Cookies for Authentication](https://www.papermtn.co.uk/retrieving-and-using-slack-cookies-for-authentication/)
- [slacktokens GitHub](https://github.com/hraftery/slacktokens)

---

## 3. Token Type Detection

### Decision: Detect by prefix pattern matching

### Rationale

Slack tokens have distinct prefixes that reliably identify their type. Simple string prefix checking is sufficient.

### Implementation

```typescript
function getTokenType(token: string): "bot" | "user" | "unknown" {
  if (token.startsWith("xoxb-")) return "bot";
  if (token.startsWith("xoxc-")) return "user";
  return "unknown";
}

function isUserToken(token: string): boolean {
  return token.startsWith("xoxc-");
}
```

### Alternatives Considered

| Alternative | Rejected Because |
|-------------|------------------|
| auth.test API call | Requires network call; prefix is reliable and instant |
| Regex validation | Overkill; simple startsWith is sufficient |

---

## 4. Search API Availability

### Decision: Search requires user token authentication

### Rationale

Slack's `search.messages` and `search.files` APIs are only available with user tokens. Bot tokens receive `missing_scope` or `not_allowed_token_type` errors regardless of OAuth scopes.

### Implementation Note

When using bot token authentication, search tool invocations should return a clear error message indicating user token is required:

```typescript
if (getAuthType() === "bot") {
  throw new Error(
    "Search requires user token authentication. " +
    "Configure SLACK_USER_TOKEN and SLACK_COOKIE_D to enable search."
  );
}
```

### Sources

- [Slack Web API - search.messages](https://api.slack.com/methods/search.messages) (requires user token)

---

## Summary

| Topic | Decision | Complexity |
|-------|----------|------------|
| Custom headers | Use WebClient `headers` option | Low |
| Token format | Detect by `xoxc-`/`xoxb-` prefix | Low |
| Cookie format | Pass as `Cookie: d={value}` header | Low |
| Search validation | Check auth type, error if bot token | Low |

All research questions resolved. No NEEDS CLARIFICATION items remain.
