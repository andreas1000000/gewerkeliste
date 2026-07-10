export const WRITE_BLOCKED_MESSAGE = "Write access is disabled in this preview environment.";

export type RuntimeWriteMode =
  | "vercel-production"
  | "vercel-preview"
  | "local-development"
  | "test"
  | "unknown";

export type RuntimeWriteDecision = {
  allowed: boolean;
  mode: RuntimeWriteMode;
  reason: string;
};

export type WriteOperationContext = {
  operation: string;
  target?: string;
};

const WRITE_HTTP_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export class WriteBlockedError extends Error {
  readonly status = 403;
  readonly code = "WRITE_BLOCKED";
  readonly decision: RuntimeWriteDecision;
  readonly context: WriteOperationContext;

  constructor(decision: RuntimeWriteDecision, context: WriteOperationContext) {
    super(WRITE_BLOCKED_MESSAGE);
    this.name = "WriteBlockedError";
    this.decision = decision;
    this.context = context;
  }
}

export function getRuntimeWriteDecision(env: NodeJS.ProcessEnv = process.env): RuntimeWriteDecision {
  const vercelTarget = env.VERCEL_TARGET_ENV || env.VERCEL_ENV;

  if (vercelTarget === "production") {
    return {
      allowed: true,
      mode: "vercel-production",
      reason: "Vercel production keeps the existing authorized write paths enabled.",
    };
  }

  if (vercelTarget === "preview") {
    return {
      allowed: false,
      mode: "vercel-preview",
      reason: "Vercel preview is read-only.",
    };
  }

  if (env.VERCEL === "1") {
    return {
      allowed: false,
      mode: "unknown",
      reason: "Unknown Vercel environment fails closed.",
    };
  }

  if (env.NODE_ENV === "development") {
    return {
      allowed: true,
      mode: "local-development",
      reason: "Local development may write to the configured local target.",
    };
  }

  if (env.NODE_ENV === "test") {
    return {
      allowed: true,
      mode: "test",
      reason: "Automated tests may opt into write-path behavior with mocks.",
    };
  }

  return {
    allowed: false,
    mode: "unknown",
    reason: "Unknown runtime environment fails closed.",
  };
}

export function assertWritesAllowed(context: WriteOperationContext) {
  const decision = getRuntimeWriteDecision();

  if (!decision.allowed) {
    throw new WriteBlockedError(decision, context);
  }
}

export function isWriteHttpMethod(method: string) {
  return WRITE_HTTP_METHODS.has(method.toUpperCase());
}

export function shouldBlockHttpWrite(method: string, env: NodeJS.ProcessEnv = process.env) {
  if (!isWriteHttpMethod(method)) return false;
  return !getRuntimeWriteDecision(env).allowed;
}

export function blockedWriteResponse() {
  return new Response(WRITE_BLOCKED_MESSAGE, {
    status: 403,
    headers: {
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
