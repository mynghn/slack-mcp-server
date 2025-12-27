import { z } from "zod";
import { server } from "../server.js";
import { getSlackClient, isSearchAvailable } from "../slack/client.js";
import type { SearchResult, PagePaginationResult } from "../slack/types.js";
import { mapSlackError, formatErrorForMcp, AUTH_ERRORS } from "../utils/errors.js";

interface SlackSearchMatch {
  ts?: string;
  text?: string;
  user?: string;
  username?: string;
  channel?: {
    id?: string;
    name?: string;
  };
  permalink?: string;
}

interface SlackSearchMessages {
  matches?: SlackSearchMatch[];
  total?: number;
  page?: number;
  paging?: {
    count?: number;
    total?: number;
    page?: number;
    pages?: number;
  };
}

function mapSearchResult(match: SlackSearchMatch): SearchResult {
  return {
    ts: match.ts ?? "",
    text: match.text ?? "",
    userId: match.user ?? "",
    username: match.username ?? "",
    channelId: match.channel?.id ?? "",
    channelName: match.channel?.name ?? "",
    permalink: match.permalink ?? "",
  };
}

const searchMessagesSchema = {
  query: z
    .string()
    .describe(
      "Search query (supports Slack search modifiers: from:, in:, before:, after:)"
    ),
  sort: z
    .enum(["score", "timestamp"])
    .optional()
    .describe("Sort order (default: score)"),
  sort_dir: z
    .enum(["asc", "desc"])
    .optional()
    .describe("Sort direction (default: desc)"),
  count: z
    .number()
    .min(1)
    .max(100)
    .optional()
    .describe("Results per page (default: 20)"),
  page: z.number().min(1).optional().describe("Page number (default: 1)"),
};

server.tool(
  "slack_search_messages",
  "Search for messages across all accessible channels",
  searchMessagesSchema,
  async ({ query, sort, sort_dir, count, page }) => {
    // Check if search is available (requires user token auth)
    if (!isSearchAvailable()) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error: search_requires_user_token - ${AUTH_ERRORS.SEARCH_REQUIRES_USER_TOKEN}`,
          },
        ],
        isError: true,
      };
    }

    try {
      const client = getSlackClient();
      const response = await client.search.messages({
        query,
        sort: sort ?? "score",
        sort_dir: sort_dir ?? "desc",
        count: count ?? 20,
        page: page ?? 1,
      });

      if (!response.ok) {
        throw new Error(response.error ?? "Unknown Slack API error");
      }

      const messages = response.messages as SlackSearchMessages | undefined;
      const matches = messages?.matches ?? [];
      const paging = messages?.paging;

      const results = matches.map(mapSearchResult);

      const paginationResult: PagePaginationResult<SearchResult> = {
        items: results,
        total: paging?.total ?? results.length,
        page: paging?.page ?? 1,
        pageCount: paging?.pages ?? 1,
      };

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                results: paginationResult.items,
                total: paginationResult.total,
                page: paginationResult.page,
                pageCount: paginationResult.pageCount,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      const mcpError = mapSlackError(error);
      return formatErrorForMcp(mcpError);
    }
  }
);
