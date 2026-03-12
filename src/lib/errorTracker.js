import * as Sentry from "@sentry/react";

const env = import.meta.env ?? {};
const dsn = typeof env.VITE_SENTRY_DSN === "string" ? env.VITE_SENTRY_DSN.trim() : "";
const tracesSampleRateRaw = Number(env.VITE_SENTRY_TRACES_SAMPLE_RATE);
const tracesSampleRate = Number.isFinite(tracesSampleRateRaw)
  ? Math.min(Math.max(tracesSampleRateRaw, 0), 1)
  : 0;
const environment = typeof env.MODE === "string" && env.MODE ? env.MODE : "production";
const release = typeof env.VITE_APP_VERSION === "string" ? env.VITE_APP_VERSION : undefined;

let initialized = false;

function isEnabled() {
  return Boolean(dsn);
}

export function initErrorTracking() {
  if (!isEnabled() || initialized) {
    return;
  }

  Sentry.init({
    dsn,
    environment,
    release,
    tracesSampleRate,
  });

  initialized = true;
}

export function captureError(error, { tags, extra } = {}) {
  if (!isEnabled()) {
    return;
  }

  Sentry.withScope((scope) => {
    if (tags && typeof tags === "object") {
      Object.entries(tags).forEach(([key, value]) => {
        scope.setTag(key, String(value));
      });
    }
    if (extra && typeof extra === "object") {
      Object.entries(extra).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }
    Sentry.captureException(error);
  });
}
