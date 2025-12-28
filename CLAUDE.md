# slack-mcp-server Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-12-25

## Active Technologies
- TypeScript 5.9+ with Node.js 20+ + @modelcontextprotocol/sdk ^1.25.1, @slack/web-api ^7.13.0, zod ^4.2.1 (002-auth-workaround)
- N/A (stateless - credentials via environment variables) (002-auth-workaround)
- Filesystem (JSON file in configurable data directory) for credential persistence (003-token-auto-refresh)

- TypeScript with Node.js 20+ + @modelcontextprotocol/sdk, @slack/web-api, zod (001-slack-mcp-read-only)

## Project Structure

```text
src/
tests/
```

## Commands

pnpm test && pnpm run lint

## Code Style

TypeScript with Node.js 20+: Follow standard conventions

## Recent Changes
- 003-token-auto-refresh: Added TypeScript 5.9+ with Node.js 20+ + @modelcontextprotocol/sdk ^1.25.1, @slack/web-api ^7.13.0, zod ^4.2.1
- 002-auth-workaround: Added TypeScript 5.9+ with Node.js 20+ + @modelcontextprotocol/sdk ^1.25.1, @slack/web-api ^7.13.0, zod ^4.2.1

- 001-slack-mcp-read-only: Added TypeScript with Node.js 20+ + @modelcontextprotocol/sdk, @slack/web-api, zod

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
