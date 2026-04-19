import { streamText, ModelMessage, createUIMessageStream, createUIMessageStreamResponse } from "ai";
import type { ToolSet } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod";
import { createBooking } from "@/modules/booking/booking.service";
import { createPaymentUrl } from "@/modules/payment/payment.service";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/middlewares/auth.middleware";
import { NextRequest } from "next/server";
import { CHATBOT_SYSTEM_PROMPT } from "./prompts";
import { normalizeToolResultForComponent } from "./componentData";
import { buildChatbotTools } from "./tools";
import "dotenv/config";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_CLOUD_API_KEY || "",
}) as (modelId: string) => unknown;

export const maxDuration = 30;

// Maps tool name → component type cho frontend
const TOOL_TO_COMPONENT: Record<string, string> = {
  searchClubs: "clubList",
  getClubDetails: "clubDetail",
  getAvailableSlots: "slotPicker",
  checkSlotAvailability: "slotPicker",
  getUserProfile: "userProfile",
  getUserBookings: "bookingHistory",
  getUserInsights: "userInsights",
  createBooking: "bookingSuccess",
};

interface RawMessagePart { type: string; text?: string }
interface RawMessage {
  role: "user" | "assistant" | "system" | "tool";
  content?: string;
  parts?: RawMessagePart[];
}

type ToolName = keyof typeof TOOL_TO_COMPONENT;
type ToolResult = unknown;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const ChatRequestSchema = z
  .object({
    // Some clients/transports may override body and omit messages; handle gracefully.
    messages: z.array(z.unknown()).optional().default([]),
    userLocation: z
      .object({
        lat: z.number(),
        lng: z.number(),
      })
      .optional(),
  })
  .passthrough();

// ─── Route Handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const jsonBody: unknown = await req.json();
    const parsedBody = ChatRequestSchema.safeParse(jsonBody);

    // Fallback: some transports nest payload under `body`
    const nestedBody =
      isRecord(jsonBody) && isRecord(jsonBody.body) ? jsonBody.body : null;

    const rawMessages =
      parsedBody.success
        ? parsedBody.data.messages
        : (isRecord(jsonBody) && Array.isArray(jsonBody.messages)
          ? jsonBody.messages
          : (nestedBody && Array.isArray(nestedBody.messages)
            ? nestedBody.messages
            : []));

    const userLocation =
      parsedBody.success
        ? parsedBody.data.userLocation
        : (isRecord(jsonBody) && isRecord(jsonBody.userLocation)
          ? (jsonBody.userLocation as { lat?: unknown; lng?: unknown })
          : (nestedBody && isRecord(nestedBody.userLocation)
            ? (nestedBody.userLocation as { lat?: unknown; lng?: unknown })
            : undefined));

    if (!Array.isArray(rawMessages)) {
      return new Response(JSON.stringify({ error: "Invalid request body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const messages = (rawMessages as RawMessage[]).map(
      (m) =>
        ({
          role: m.role,
          content:
            m.content ||
            (m.parts && Array.isArray(m.parts)
              ? m.parts.map((p) => (p.type === "text" ? p.text : "")).join("")
              : ""),
        }) as ModelMessage
    );

    const { user } = await getAuthUser(req);
    const userId = user?.userId ?? null;
    const defaultLat = userLocation?.lat ?? null;
    const defaultLng = userLocation?.lng ?? null;

    const stream = createUIMessageStream({
      execute: async (ctx: unknown) => {
        const { writer } = ctx as {
          writer: {
            write: (chunk: unknown) => void;
            merge: (stream: unknown) => void;
          };
        };
        // Track tool cuối cùng được gọi
        let lastToolName: ToolName | null = null;
        let lastToolResult: ToolResult | null = null;

        // Helper gán tool result
        const setLast = <TResult,>(name: ToolName, result: TResult) => {
          lastToolName = name;
          lastToolResult = result;
          return result;
        };

        const sharedTools = buildChatbotTools({
          prisma: prisma as never,
          userId,
          defaultLat,
          defaultLng,
          getIpAddr: () => req.headers.get("x-forwarded-for") || "127.0.0.1",
          createBooking,
          createPaymentUrl,
        });

        const chatbotTools = ({

          // ── 1. searchClubs ────────────────────────────────────────────────────
          searchClubs: {
            ...sharedTools.searchClubs,
            execute: async (input: unknown) =>
              setLast("searchClubs", await sharedTools.searchClubs.execute(input)),
          },

          // ── 2. getClubDetails ──────────────────────────────────────────────────
          getClubDetails: {
            ...sharedTools.getClubDetails,
            execute: async (input: unknown) =>
              setLast("getClubDetails", await sharedTools.getClubDetails.execute(input)),
          },

          // ── 3. getAvailableSlots ────────────────────────────────────────────────
          getAvailableSlots: {
            ...sharedTools.getAvailableSlots,
            execute: async (input: unknown) =>
              setLast("getAvailableSlots", await sharedTools.getAvailableSlots.execute(input)),
          },

          // ── 3b. checkSlotAvailability ──────────────────────────────────────────
          checkSlotAvailability: {
            ...sharedTools.checkSlotAvailability,
            execute: async (input: unknown) =>
              setLast(
                "checkSlotAvailability",
                await sharedTools.checkSlotAvailability.execute(input)
              ),
          },

          // ── 4. getUserProfile ──────────────────────────────────────────────────
          getUserProfile: {
            ...sharedTools.getUserProfile,
            execute: async () =>
              setLast("getUserProfile", await sharedTools.getUserProfile.execute()),
          },

          // ── 5. getUserBookings ─────────────────────────────────────────────────
          getUserBookings: {
            ...sharedTools.getUserBookings,
            execute: async (input: unknown) =>
              setLast("getUserBookings", await sharedTools.getUserBookings.execute(input)),
          },

          // ── 5b. getUserInsights ────────────────────────────────────────────────
          getUserInsights: {
            ...sharedTools.getUserInsights,
            execute: async (input: unknown) =>
              setLast("getUserInsights", await sharedTools.getUserInsights.execute(input)),
          },

          // ── 6. createBooking ───────────────────────────────────────────────────
          createBooking: {
            ...sharedTools.createBooking,
            execute: async (input: unknown) =>
              setLast("createBooking", await sharedTools.createBooking.execute(input)),
          },
        } as unknown) as ToolSet;

        // ── streamText ────────────────────────────────────────────────────────────
        const result = streamText({
          model: google("gemini-2.5-flash"),
          messages,
          system: `${CHATBOT_SYSTEM_PROMPT}

NGỮCẢNH: Hôm nay ${new Date().toLocaleDateString("vi-VN", {
            weekday: "long", year: "numeric", month: "long", day: "numeric",
          })} — ${new Date().toLocaleTimeString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}.
User: ${userId ? `đã đăng nhập (userId=${userId})` : "chưa đăng nhập"}.`,
          temperature: 0.3,
          tools: chatbotTools,

          onFinish: () => {
            // Xác định component từ tool cuối được gọi — AI chỉ cần nói chuyện tự nhiên
            if (lastToolName && lastToolResult) {
              const hasError =
                isRecord(lastToolResult) && lastToolResult.error != null;
              const isAuthError = hasError &&
                String((lastToolResult as Record<string, unknown>).error)
                  .toLowerCase()
                  .includes("đăng nhập");

              // AI SDK v6: data chunks phải dùng type 'data-{name}', không phải 'data'
              writer.write({
                type: "data-chatComponent",
                data: {
                  component: isAuthError
                    ? "authRequired"
                    : hasError
                      ? "error"
                      : (TOOL_TO_COMPONENT[lastToolName] ?? "text"),
                  data: normalizeToolResultForComponent(lastToolName, lastToolResult),
                },
              });
            }
          },
        });

        writer.merge(result.toUIMessageStream());
      },
    });

    return createUIMessageStreamResponse({ stream });

  } catch (err: unknown) {
    const error = err as Error;
    console.error("Chat API Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}