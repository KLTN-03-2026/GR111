export type MappedError = {
  statusCode: number;
  message: string;
  code: string;
};

const KNOWN_ERROR_MAP: Record<string, MappedError> = {
  INVALID_CREDENTIALS: {
    statusCode: 401,
    message: "Email or password is incorrect.",
    code: "INVALID_CREDENTIALS",
  },
  ACCOUNT_DISABLED: {
    statusCode: 403,
    message: "Account is disabled.",
    code: "ACCOUNT_DISABLED",
  },
  EMAIL_SEND_FAILED: {
    statusCode: 502,
    message: "Failed to send email.",
    code: "EMAIL_SEND_FAILED",
  },
};

export function mapKnownErrorCode(code: string): MappedError | null {
  return KNOWN_ERROR_MAP[code] ?? null;
}
