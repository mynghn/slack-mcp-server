import { z } from "zod";
import { server } from "../server.js";
import { getSlackClient } from "../slack/client.js";
import type { Channel } from "../slack/types.js";
import { mapSlackError, formatErrorForMcp } from "../utils/errors.js";
import { buildCursorPaginationResult } from "../utils/pagination.js";

const listChannelsSchema = {
  limit: z
    .number()
    .min(1)
    .max(1000)
    .optional()
    .describe("Maximum number of channels to return (default: 100)"),
  cursor: z
    .string()
    .optional()
    .describe("Pagination cursor from previous response"),
  exclude_archived: z
    .boolean()
    .optional()
    .describe("Exclude archived channels (default: true)"),
};

server.tool(
  "list_channels",
  "List all public channels accessible to the bot in the Slack workspace",
  listChannelsSchema,
  async ({ limit, cursor, exclude_archived }) => {
    try {
      const client = getSlackClient();
      const response = await client.conversations.list({
        types: "public_channel",
        limit: limit ?? 100,
        cursor: cursor ?? undefined,
        exclude_archived: exclude_archived ?? true,
      });

      if (!response.ok) {
        throw new Error(response.error ?? "Unknown Slack API error");
      }

      const channels: Channel[] = (response.channels ?? []).map((ch) => ({
        id: ch.id ?? "",
        name: ch.name ?? "",
        topic: ch.topic?.value ?? null,
        purpose: ch.purpose?.value ?? null,
        memberCount: ch.num_members ?? 0,
        isArchived: ch.is_archived ?? false,
        created: ch.created ?? 0,
      }));

      const result = buildCursorPaginationResult(
        channels,
        response.response_metadata
      );

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                channels: result.items,
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
      const mcpError = mapSlackError(error);
      return formatErrorForMcp(mcpError);
    }
  }
);
