# Slack MCP Server

A read-only [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server for accessing Slack workspace data. This server enables AI assistants like Claude to read channels, messages, threads, and user information from your Slack workspace.

## Features

| Tool | Description | Auth Required |
|------|-------------|---------------|
| `list_channels` | List all accessible public channels with pagination | Bot or User |
| `get_channel_history` | Retrieve message history from a specific channel | Bot or User |
| `get_thread_replies` | Get all replies in a message thread (including parent) | Bot or User |
| `list_users` | List all workspace users with pagination | Bot or User |
| `get_user_profile` | Get detailed profile information for a specific user | Bot or User |
| `search_messages` | Search messages across all channels | User only |

All tools are **read-only** and support cursor-based pagination.

## Installation

### Prerequisites

- Node.js 20+
- pnpm (or npm/yarn)
- A Slack workspace with appropriate access

### Setup

```bash
# Clone the repository
git clone https://github.com/your-username/slack-mcp-server.git
cd slack-mcp-server

# Install dependencies
pnpm install

# Build the project
pnpm run build
```

## Authentication

The server supports two authentication methods:

### Option 1: Bot Token (Recommended)

Use a standard Slack Bot User OAuth token for most use cases.

1. Create a Slack App at [api.slack.com/apps](https://api.slack.com/apps)
2. Add the following Bot Token Scopes under **OAuth & Permissions**:
   - `channels:read` - List public channels
   - `channels:history` - Read channel messages
   - `users:read` - List workspace users
   - `users.profile:read` - Read user profiles
3. Install the app to your workspace
4. Copy the **Bot User OAuth Token** (starts with `xoxb-`)

```bash
export SLACK_BOT_TOKEN=xoxb-your-token-here
```

### Option 2: User Token (Unofficial - Required for Search)

Use a user token to enable the `search_messages` tool. This method uses browser session credentials.

> **Warning:** This authentication method uses unofficial session credentials extracted from your browser. It may violate Slack's Terms of Service. Session tokens expire and require manual re-extraction. Use at your own risk and only with workspaces where you have appropriate authorization.

1. Open your Slack workspace in a browser
2. Open Developer Tools (F12) → Application → Cookies
3. Find and copy the `d` cookie value (starts with `xoxd-`)
4. In the Network tab, find any API request and copy the token from the Authorization header (starts with `xoxc-`)

```bash
export SLACK_USER_TOKEN=xoxc-your-token-here
export SLACK_COOKIE_D=xoxd-your-cookie-here
```

> **Note:** If both bot token and user token are configured, the bot token takes precedence.

## Usage

### Running the Server

```bash
# With bot token
SLACK_BOT_TOKEN=xoxb-... pnpm start

# With user token (enables search)
SLACK_USER_TOKEN=xoxc-... SLACK_COOKIE_D=xoxd-... pnpm start
```

### Claude Code Configuration

Add this MCP server to Claude Code:

```bash
# With bot token
claude mcp add slack -- node /absolute/path/to/slack-mcp-server/build/index.js \
  -e SLACK_BOT_TOKEN=xoxb-your-token-here

# With user token (enables search)
claude mcp add slack -- node /absolute/path/to/slack-mcp-server/build/index.js \
  -e SLACK_USER_TOKEN=xoxc-your-token-here \
  -e SLACK_COOKIE_D=xoxd-your-cookie-here
```

To verify the server is configured:

```bash
claude mcp list
```

## Tool Reference

### list_channels

List all accessible public channels in the workspace.

**Parameters:**
- `limit` (optional): Maximum channels to return (1-1000, default: 100)
- `cursor` (optional): Pagination cursor from previous response
- `exclude_archived` (optional): Exclude archived channels (default: true)

### get_channel_history

Retrieve message history from a specific channel.

**Parameters:**
- `channel_id` (required): Channel ID (e.g., C1234567890)
- `limit` (optional): Maximum messages to return (1-1000, default: 50)
- `cursor` (optional): Pagination cursor
- `oldest` (optional): Only messages after this timestamp
- `latest` (optional): Only messages before this timestamp

### get_thread_replies

Retrieve all replies in a message thread.

**Parameters:**
- `channel_id` (required): Channel ID containing the thread
- `thread_ts` (required): Timestamp of the parent message
- `limit` (optional): Maximum replies to return (1-1000, default: 50)
- `cursor` (optional): Pagination cursor

### list_users

List all users in the workspace.

**Parameters:**
- `limit` (optional): Maximum users to return (1-1000, default: 200)
- `cursor` (optional): Pagination cursor

### get_user_profile

Get detailed profile information for a specific user.

**Parameters:**
- `user_id` (required): User ID (e.g., U1234567890)

### search_messages

Search for messages across all accessible channels. **Requires user token authentication.**

**Parameters:**
- `query` (required): Search query (supports Slack modifiers: `from:`, `in:`, `before:`, `after:`)
- `sort` (optional): Sort by `score` or `timestamp` (default: score)
- `sort_dir` (optional): Sort direction `asc` or `desc` (default: desc)
- `count` (optional): Results per page (1-100, default: 20)
- `page` (optional): Page number (default: 1)

## Disclaimer

This project is not affiliated with Slack Technologies, LLC.

User token authentication is unofficial and may not comply with Slack's Terms of Service. Bot token authentication is the recommended approach.
