import "dotenv/config";
import { z, type ZodIssue } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
  JWT_EXPIRES_IN: z.string().default("7d"),

  NEXT_PUBLIC_APP_URL: z.string().default("http://localhost:3000"),
  API_URL: z.string().default("http://localhost:3001"),
  REDIS_URL: z.string().default("redis://127.0.0.1:6379"),

  SMTP_HOST: z.string().default("smtp.gmail.com"),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_SECURE: z
    .union([z.boolean(), z.literal("true"), z.literal("false")])
    .transform((value: boolean | "true" | "false") => value === true || value === "true")
    .default(false),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),

  FACEBOOK_APP_ID: z.string().optional(),
  FACEBOOK_APP_SECRET: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  NEXT_PUBLIC_MAPBOX_TOKEN: z.string().optional(),

  GOOGLE_CLOUD_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),

  EMAIL_USER: z.string().optional(),
  BOOKING_EXPIRE_MINUTES: z.coerce.number().int().positive().default(5),

  // --- MOMO Payment ---
  MOMO_V2_PARTNER_CODE: z.string().optional(),
  MOMO_V2_ACCESS_KEY: z.string().optional(),
  MOMO_V2_SECRET_KEY: z.string().optional(),
  MOMO_V2_ENDPOINT: z.string().optional(),
  MOMO_V2_REDIRECT_URL: z.string().optional(),
  MOMO_V2_IPN_URL: z.string().optional(),

  // --- Stripe ---
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const details = parsedEnv.error.issues
    .map((issue: ZodIssue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");
  throw new Error(`Invalid environment variables: ${details}`);
}

export const env = parsedEnv.data;
