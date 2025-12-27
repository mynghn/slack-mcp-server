import { z } from "zod";
import { server } from "../server.js";
import { getSlackClient } from "../slack/client.js";
import type { User, UserProfile } from "../slack/types.js";
import { mapSlackError, formatErrorForMcp } from "../utils/errors.js";
import { buildCursorPaginationResult } from "../utils/pagination.js";

interface SlackUser {
  id?: string;
  name?: string;
  real_name?: string;
  profile?: {
    display_name?: string;
  };
  is_bot?: boolean;
  is_admin?: boolean;
  deleted?: boolean;
}

function mapUser(user: SlackUser): User {
  return {
    id: user.id ?? "",
    name: user.name ?? "",
    realName: user.real_name ?? null,
    displayName: user.profile?.display_name ?? null,
    isBot: user.is_bot ?? false,
    isAdmin: user.is_admin ?? false,
    deleted: user.deleted ?? false,
  };
}

const listUsersSchema = {
  limit: z
    .number()
    .min(1)
    .max(1000)
    .optional()
    .describe("Maximum users to return (default: 200)"),
  cursor: z
    .string()
    .optional()
    .describe("Pagination cursor from previous response"),
};

server.tool(
  "list_users",
  "List all users in the Slack workspace",
  listUsersSchema,
  async ({ limit, cursor }) => {
    try {
      const client = getSlackClient();
      const response = await client.users.list({
        limit: limit ?? 200,
        cursor: cursor ?? undefined,
      });

      if (!response.ok) {
        throw new Error(response.error ?? "Unknown Slack API error");
      }

      const users = (response.members ?? []).map((member) =>
        mapUser(member as SlackUser)
      );

      const result = buildCursorPaginationResult(
        users,
        response.response_metadata
      );

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                users: result.items,
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

const getUserProfileSchema = {
  user_id: z.string().describe("User ID (e.g., U1234567890)"),
};

server.tool(
  "get_user_profile",
  "Get detailed profile information for a specific user",
  getUserProfileSchema,
  async ({ user_id }) => {
    try {
      const client = getSlackClient();
      const response = await client.users.profile.get({
        user: user_id,
      });

      if (!response.ok) {
        throw new Error(response.error ?? "Unknown Slack API error");
      }

      const profile = response.profile;
      const userProfile: UserProfile = {
        displayName: profile?.display_name ?? "",
        realName: profile?.real_name ?? "",
        title: profile?.title ?? null,
        email: profile?.email ?? null,
        phone: profile?.phone ?? null,
        statusText: profile?.status_text ?? null,
        statusEmoji: profile?.status_emoji ?? null,
        image72: profile?.image_72 ?? null,
      };

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ profile: userProfile }, null, 2),
          },
        ],
      };
    } catch (error) {
      const mcpError = mapSlackError(error, { userId: user_id });
      return formatErrorForMcp(mcpError);
    }
  }
);
