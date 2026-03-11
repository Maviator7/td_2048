const MAX_RANKING_ENTRIES = 20;
const MAX_SCORE = 5_000_000;
const MAX_WAVE = 5_000;
const MAX_NAME_LENGTH = 12;
const ALLOWED_CORS_HEADERS = "Content-Type, Accept";
const ALLOWED_CORS_METHODS = "GET, POST, OPTIONS";
const RATE_LIMIT_WINDOW_SECONDS = 300;
const RATE_LIMIT_MAX_SUBMISSIONS = 10;

function jsonResponse(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...headers,
    },
  });
}

function noContentResponse(status = 204, headers = {}) {
  return new Response(null, { status, headers });
}

function parseAllowedOrigins(rawValue) {
  if (typeof rawValue !== "string" || rawValue.trim().length === 0) {
    return [];
  }

  return rawValue
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function buildCorsHeaders(context) {
  const request = context.request;
  const origin = request.headers.get("Origin");
  if (!origin) {
    return { allowed: true, headers: {} };
  }

  const sameOrigin = new URL(request.url).origin;
  const allowedOrigins = new Set([sameOrigin, ...parseAllowedOrigins(context.env.ALLOWED_ORIGINS)]);
  if (!allowedOrigins.has(origin)) {
    return { allowed: false, headers: {} };
  }

  return {
    allowed: true,
    headers: {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Headers": ALLOWED_CORS_HEADERS,
      "Access-Control-Allow-Methods": ALLOWED_CORS_METHODS,
      "Vary": "Origin",
    },
  };
}

function sanitizeName(rawName) {
  if (typeof rawName !== "string") {
    return "";
  }

  return rawName
    .normalize("NFKC")
    .replace(/[\p{Cc}\p{Cf}]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function validateName(rawName) {
  const value = sanitizeName(rawName);
  if (!value) {
    return { ok: false, value, error: "名前を入力してください。" };
  }

  if (value.length > MAX_NAME_LENGTH) {
    return { ok: false, value, error: `名前は${MAX_NAME_LENGTH}文字以内で入力してください。` };
  }

  return { ok: true, value, error: null };
}

function parsePositiveInt(value, fallback = null) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return parsed;
}

function resolveClientIp(request) {
  const cfIp = request.headers.get("CF-Connecting-IP");
  if (cfIp) {
    return cfIp.trim();
  }

  const forwarded = request.headers.get("X-Forwarded-For");
  if (!forwarded) {
    return "";
  }

  return forwarded.split(",")[0]?.trim() ?? "";
}

function bytesToHex(bytes) {
  return Array.from(bytes).map((value) => value.toString(16).padStart(2, "0")).join("");
}

async function hashText(text) {
  const encoded = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return bytesToHex(new Uint8Array(digest));
}

async function createSubmissionFingerprint(request, salt) {
  const ip = resolveClientIp(request);
  const userAgent = request.headers.get("User-Agent") ?? "";
  if (!ip && !userAgent) {
    return "";
  }

  return hashText(`${ip}|${userAgent}|${salt}`);
}

async function consumeSubmissionQuota(db, fingerprint) {
  const now = new Date();
  const windowStart = new Date(now.getTime() - RATE_LIMIT_WINDOW_SECONDS * 1000).toISOString();
  const nowIso = now.toISOString();

  await db.prepare(
    "DELETE FROM ranking_submission_log WHERE created_at < ?",
  ).bind(windowStart).run();

  const countResult = await db.prepare(
    "SELECT COUNT(1) AS count FROM ranking_submission_log WHERE fingerprint = ? AND created_at >= ?",
  ).bind(fingerprint, windowStart).first();
  const count = Number(countResult?.count ?? 0);
  if (count >= RATE_LIMIT_MAX_SUBMISSIONS) {
    return false;
  }

  await db.prepare(
    "INSERT INTO ranking_submission_log (fingerprint, created_at) VALUES (?, ?)",
  ).bind(fingerprint, nowIso).run();

  return true;
}

function normalizeRankingRow(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    name: row.player_name,
    score: row.score,
    wave: row.wave,
    playedAt: row.played_at,
  };
}

async function fetchRankings(db, limit = MAX_RANKING_ENTRIES) {
  const limited = Math.min(Math.max(limit, 1), MAX_RANKING_ENTRIES);
  const result = await db.prepare(
    "SELECT id, player_name, score, wave, played_at FROM rankings ORDER BY score DESC, wave DESC, played_at DESC LIMIT ?",
  ).bind(limited).all();

  return (result?.results ?? []).map(normalizeRankingRow).filter(Boolean);
}

export async function onRequestGet(context) {
  const cors = buildCorsHeaders(context);
  if (!cors.allowed) {
    return jsonResponse({ error: "許可されていないオリジンです。" }, 403);
  }

  const url = new URL(context.request.url);
  const limit = parsePositiveInt(url.searchParams.get("limit"), MAX_RANKING_ENTRIES);
  const rankings = await fetchRankings(context.env.DB, limit);
  return jsonResponse({ rankings }, 200, cors.headers);
}

export async function onRequestPost(context) {
  const cors = buildCorsHeaders(context);
  if (!cors.allowed) {
    return jsonResponse({ error: "許可されていないオリジンです。" }, 403);
  }

  try {
    const fingerprint = await createSubmissionFingerprint(
      context.request,
      context.env.RATE_LIMIT_SALT ?? "",
    );
    if (fingerprint) {
      const allowed = await consumeSubmissionQuota(context.env.DB, fingerprint);
      if (!allowed) {
        return jsonResponse(
          { error: "送信回数が多すぎます。少し時間をおいて再試行してください。" },
          429,
          cors.headers,
        );
      }
    }
  } catch (error) {
    // Keep ranking available even when rate-limit storage is not ready.
    console.error("[online-rankings] failed to apply submission rate limit", error);
  }

  let payload = null;
  try {
    payload = await context.request.json();
  } catch {
    payload = null;
  }

  const nameResult = validateName(payload?.name);
  const score = parsePositiveInt(payload?.score, null);
  const wave = parsePositiveInt(payload?.wave, null);

  if (!nameResult.ok) {
    return jsonResponse({ error: nameResult.error }, 400, cors.headers);
  }

  if (score === null || score < 0 || score > MAX_SCORE) {
    return jsonResponse({ error: "スコアが不正です。" }, 400, cors.headers);
  }

  if (wave === null || wave < 1 || wave > MAX_WAVE) {
    return jsonResponse({ error: "Wave が不正です。" }, 400, cors.headers);
  }

  const id = crypto.randomUUID();
  const playedAt = new Date().toISOString();

  await context.env.DB.prepare(
    "INSERT INTO rankings (id, player_name, score, wave, played_at) VALUES (?, ?, ?, ?, ?)",
  ).bind(id, nameResult.value, score, wave, playedAt).run();

  const entry = {
    id,
    name: nameResult.value,
    score,
    wave,
    playedAt,
  };
  const rankings = await fetchRankings(context.env.DB, MAX_RANKING_ENTRIES);

  return jsonResponse({ entry, rankings }, 201, cors.headers);
}

export async function onRequestOptions(context) {
  const cors = buildCorsHeaders(context);
  if (!cors.allowed) {
    return jsonResponse({ error: "許可されていないオリジンです。" }, 403);
  }
  return noContentResponse(204, cors.headers);
}
