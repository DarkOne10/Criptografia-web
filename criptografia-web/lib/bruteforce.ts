type AttemptRecord = {
  count: number;
  firstAttempt: number;
  blockedUntil?: number;
};

const attempts = new Map<string, AttemptRecord>();

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS_PER_WINDOW = 5;
const BLOCK_DURATION_MS = 15 * 60 * 1000;

export function getClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  return request.headers.get("x-real-ip") ?? "unknown";
}

export function checkLoginBlocked(request: Request) {
  const ip = getClientIp(request);
  const now = Date.now();
  const record = attempts.get(ip);

  if (!record) {
    return { blocked: false, retryAfter: 0 };
  }

  if (record.blockedUntil && record.blockedUntil > now) {
    return {
      blocked: true,
      retryAfter: Math.ceil((record.blockedUntil - now) / 1000),
    };
  }

  if (record.firstAttempt + RATE_LIMIT_WINDOW_MS <= now) {
    attempts.delete(ip);
    return { blocked: false, retryAfter: 0 };
  }

  return { blocked: false, retryAfter: 0 };
}

export function registerFailedLogin(request: Request) {
  const ip = getClientIp(request);
  const now = Date.now();
  const record = attempts.get(ip);

  if (!record || record.firstAttempt + RATE_LIMIT_WINDOW_MS <= now) {
    attempts.set(ip, { count: 1, firstAttempt: now });
    return { blocked: false, retryAfter: 0, attempts: 1 };
  }

  const nextCount = record.count + 1;

  if (nextCount >= MAX_ATTEMPTS_PER_WINDOW) {
    const blockedUntil = now + BLOCK_DURATION_MS;
    attempts.set(ip, {
      count: nextCount,
      firstAttempt: record.firstAttempt,
      blockedUntil,
    });

    return {
      blocked: true,
      retryAfter: Math.ceil((blockedUntil - now) / 1000),
      attempts: nextCount,
    };
  }

  attempts.set(ip, {
    count: nextCount,
    firstAttempt: record.firstAttempt,
  });

  return { blocked: false, retryAfter: 0, attempts: nextCount };
}

export function resetLoginAttempts(ip: string) {
  attempts.delete(ip);
}
