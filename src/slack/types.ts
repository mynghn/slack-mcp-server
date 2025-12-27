// Authentication types

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

// Core entity types - read-only projections of Slack API responses

export interface Channel {
  id: string;
  name: string;
  topic: string | null;
  purpose: string | null;
  memberCount: number;
  isArchived: boolean;
  created: number;
}

export interface Reaction {
  name: string;
  count: number;
  users: string[];
}

export interface Message {
  ts: string;
  userId: string;
  text: string;
  threadTs: string | null;
  replyCount: number | null;
  reactions: Reaction[];
}

export interface User {
  id: string;
  name: string;
  realName: string | null;
  displayName: string | null;
  isBot: boolean;
  isAdmin: boolean;
  deleted: boolean;
}

export interface UserProfile {
  displayName: string;
  realName: string;
  title: string | null;
  email: string | null;
  phone: string | null;
  statusText: string | null;
  statusEmoji: string | null;
  image72: string | null;
}

export interface SearchResult {
  ts: string;
  text: string;
  userId: string;
  username: string;
  channelId: string;
  channelName: string;
  permalink: string;
}

// Pagination types

export interface CursorPaginationParams {
  limit?: number;
  cursor?: string;
}

export interface CursorPaginationResult<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface PagePaginationParams {
  count?: number;
  page?: number;
}

export interface PagePaginationResult<T> {
  items: T[];
  total: number;
  page: number;
  pageCount: number;
}

// Error types

export type SlackErrorCode =
  | "rate_limited"
  | "invalid_auth"
  | "missing_scope"
  | "channel_not_found"
  | "user_not_found"
  | "not_in_channel"
  | "thread_not_found";

export interface SlackMcpError {
  code: string;
  message: string;
  retryable: boolean;
  retryAfter?: number;
}
