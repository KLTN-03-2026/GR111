// NOTE:
// This file is only a type shim so TypeScript tooling doesn't error
// when dependencies are not installed or not resolved by the editor.
// At runtime, the real package must still be present in node_modules.

declare module "@ai-sdk/google" {
  export type GoogleGenerativeAIModel = unknown;
  export type GoogleGenerativeAIProvider = (modelId: string) => GoogleGenerativeAIModel;
  export function createGoogleGenerativeAI(options: {
    apiKey: string;
  }): GoogleGenerativeAIProvider;
}

declare module "ai" {
  export type ModelMessage = {
    role: "system" | "user" | "assistant" | "tool";
    content: string;
  };

  export type ToolSet = Record<
    string,
    {
      description?: string;
      parameters?: unknown;
      execute?: (input: unknown) => unknown;
    }
  >;

  export function streamText(options: {
    model: unknown;
    messages: ModelMessage[];
    system?: string;
    temperature?: number;
    tools?: ToolSet;
    onFinish?: () => void;
  }): { toUIMessageStream: () => unknown };

  export function createUIMessageStream(options: {
    execute: (args: unknown) => Promise<void> | void;
  }): unknown;

  export function createUIMessageStreamResponse(options: {
    stream: unknown;
  }): Response;
}

declare module "zod" {
  // Minimal shim for TS tooling when node_modules isn't resolved.
  // At runtime, the real `zod` package must exist.
  export const z: any;
}

declare module "next/server" {
  export interface NextRequest extends Request {
    nextUrl?: unknown;
    headers: Headers;
  }
}

declare const process: {
  env: Record<string, string | undefined>;
};

export {};

