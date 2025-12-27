import { z } from "zod";
import { server } from "../server.js";
import { getSlackClient } from "../slack/client.js";
import type { Message, Reaction } from "../slack/types.js";
import { mapSlackError, formatErrorForMcp } from "../utils/errors.js";
import { buildCursorPaginationResult } from "../utils/pagination.js";

interface SlackReaction {
  name?: string;
  count?: number;
  users?: string[];
}

interface SlackMessage {
  ts?: string;
  user?: string;
  text?: string;
  thread_ts?: string;
  reply_count?: number;
  reactions?: SlackReaction[];
}

function mapMessage(msg: SlackMessage): Message {
  const reactions: Reaction[] = (msg.reactions ?? []).map((r) => ({
    name: r.name ?? "",
    count: r.count ?? 0,
    users: r.users ?? [],
  }));

  return {
    ts: msg.ts ?? "",
    userId: msg.user ?? "",
    text: msg.text ?? "",
    threadTs: msg.thread_ts ?? null,
    replyCount: msg.reply_count ?? null,
    reactions,
  };
}

const channelHistorySchema = {
  channel_id: z.string().describe("Channel ID (e.g., C1234567890)"),
  limit: z
    .number()
    .min(1)
    .max(1000)
    .optional()
    .describe("Maximum messages to return (default: 50)"),
  cursor: z
    .string()
    .optional()
    .describe("Pagination cursor from previous response"),
  oldest: z.string().optional().describe("Only messages after this timestamp"),
  latest: z.string().optional().describe("Only messages before this timestamp"),
};

server.tool(
  "get_channel_history",
  "Retrieve message history from a specific channel",
  channelHistorySchema,
  async ({ channel_id, limit, cursor, oldest, latest }) => {
    try {
      const client = getSlackClient();
      const response = await client.conversations.history({
        channel: channel_id,
        limit: limit ?? 50,
        cursor: cursor ?? undefined,
        oldest: oldest ?? undefined,
        latest: latest ?? undefined,
      });

      if (!response.ok) {
        throw new Error(response.error ?? "Unknown Slack API error");
      }

      const messages = (response.messages ?? []).map((msg) =>
        mapMessage(msg as SlackMessage)
      );

      const result = buildCursorPaginationResult(
        messages,
        response.response_metadata
      );

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                messages: result.items,
                nextCursor: result.nextCursor,
                hasMore: result.hasMore,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      const mcpError = mapSlackError(error, { channelId: channel_id });
      return formatErrorForMcp(mcpError);
    }
  }
);

const threadRepliesSchema = {
  channel_id: z.string().describe("Channel ID containing the thread"),
  thread_ts: z.string().describe("Timestamp of the parent message"),
  limit: z
    .number()
    .min(1)
    .max(1000)
    .optional()
    .describe("Maximum replies to return (default: 50)"),
  cursor: z
    .string()
    .optional()
    .describe("Pagination cursor from previous response"),
};

server.tool(
  "get_thread_replies",
  "Retrieve all replies in a message thread",
  threadRepliesSchema,
  async ({ channel_id, thread_ts, limit, cursor }) => {
    try {
      const client = getSlackClient();
      const response = await client.conversations.replies({
        channel: channel_id,
        ts: thread_ts,
        limit: limit ?? 50,
        cursor: cursor ?? undefined,
      });

      if (!response.ok) {
        throw new Error(response.error ?? "Unknown Slack API error");
      }

      const messages = (response.messages ?? []).map((msg) =>
        mapMessage(msg as SlackMessage)
      );

      const result = buildCursorPaginationResult(
        messages,
        response.response_metadata
      );

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                messages: result.items,
                nextCursor: result.nextCursor,
                hasMore: result.hasMore,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      const mcpError = mapSlackError(error, {
        channelId: channel_id,
        threadTs: thread_ts,
      });
      return formatErrorForMcp(mcpError);
    }
  }
);
