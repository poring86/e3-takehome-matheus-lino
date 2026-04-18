import { z } from "zod";

const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(
    "NEXT_PUBLIC_SUPABASE_URL must be a valid URL",
  ),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),
});

const serverEnvSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  AI_PROVIDER: z.enum(["openai", "gemini"]).optional(),
  LOG_LEVEL: z.string().optional(),
  APP_PORT: z.string().optional(),
});

type ClientEnv = z.infer<typeof clientEnvSchema>;
type ServerEnv = z.infer<typeof serverEnvSchema>;

let clientEnvCache: ClientEnv | undefined;
let serverEnvCache: ServerEnv | undefined;

function formatZodError(scope: string, error: z.ZodError): Error {
  const details = error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");
  return new Error(`Invalid ${scope} environment variables: ${details}`);
}

function parseClientEnv() {
  const parsed = clientEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });

  if (!parsed.success) {
    throw formatZodError("client", parsed.error);
  }

  return parsed.data;
}

function parseServerEnv() {
  const parsed = serverEnvSchema.safeParse({
    DATABASE_URL: process.env.DATABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    AI_PROVIDER: process.env.AI_PROVIDER,
    LOG_LEVEL: process.env.LOG_LEVEL,
    APP_PORT: process.env.APP_PORT,
  });

  if (!parsed.success) {
    throw formatZodError("server", parsed.error);
  }

  return parsed.data;
}

export function getClientEnv(): ClientEnv {
  if (!clientEnvCache) {
    clientEnvCache = parseClientEnv();
  }

  return clientEnvCache;
}

export function getServerEnv(): ServerEnv {
  if (!serverEnvCache) {
    serverEnvCache = parseServerEnv();
  }

  return serverEnvCache;
}

function createLazyEnvProxy<T extends object>(loader: () => T): T {
  return new Proxy({} as T, {
    get(_target, prop, receiver) {
      return Reflect.get(loader(), prop, receiver);
    },
    has(_target, prop) {
      return Reflect.has(loader(), prop);
    },
    ownKeys() {
      return Reflect.ownKeys(loader());
    },
    getOwnPropertyDescriptor(_target, prop) {
      return Reflect.getOwnPropertyDescriptor(loader(), prop);
    },
  });
}

export const clientEnv = createLazyEnvProxy(getClientEnv);
export const serverEnv = createLazyEnvProxy(getServerEnv);
