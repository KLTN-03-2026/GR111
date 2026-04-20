import { AppError } from "@/core/errors/app-error";
import { mapKnownErrorCode } from "@/core/errors/error-map";

type HandledError = {
  statusCode: number;
  message: string;
  code: string;
  details?: Record<string, string[]>;
};

export function handleApiError(error: unknown): HandledError {
  if (error instanceof AppError) {
    return {
      statusCode: error.statusCode,
      message: error.message,
      code: error.code,
      details: error.details,
    };
  }

  if (error instanceof Error) {
    if (error.message.startsWith("ACCOUNT_LOCKED:")) {
      const mins = error.message.split(":")[1] ?? "15";
      return {
        statusCode: 429,
        message: `Account is temporarily locked due to too many failed login attempts. Try again in ${mins} minutes.`,
        code: "ACCOUNT_LOCKED",
      };
    }

    const knownMapped = mapKnownErrorCode(error.message);
    if (knownMapped) {
      return knownMapped;
    }

    return {
      statusCode: 500,
      message: "Internal server error",
      code: "INTERNAL_SERVER_ERROR",
    };
  }

  return {
    statusCode: 500,
    message: "Internal server error",
    code: "INTERNAL_SERVER_ERROR",
  };
}
