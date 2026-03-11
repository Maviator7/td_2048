const MAX_NAME_LENGTH = 12;
const ALLOWED_CORS_HEADERS = "Content-Type, Accept";
const ALLOWED_CORS_METHODS = "PATCH, OPTIONS";

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

export async function onRequestPatch(context) {
  const cors = buildCorsHeaders(context);
  if (!cors.allowed) {
    return jsonResponse({ error: "許可されていないオリジンです。" }, 403);
  }

  const id = context.params?.id;
  if (!id) {
    return jsonResponse({ error: "ID が不正です。" }, 400, cors.headers);
  }

  let payload = null;
  try {
    payload = await context.request.json();
  } catch {
    payload = null;
  }

  const nameResult = validateName(payload?.name);
  if (!nameResult.ok) {
    return jsonResponse({ error: nameResult.error }, 400, cors.headers);
  }

  const update = await context.env.DB.prepare(
    "UPDATE rankings SET player_name = ? WHERE id = ?",
  ).bind(nameResult.value, id).run();

  if (!update.success) {
    return jsonResponse({ error: "更新に失敗しました。" }, 500, cors.headers);
  }
  if (update.meta?.changes === 0) {
    return jsonResponse({ error: "対象が見つかりません。" }, 404, cors.headers);
  }

  const result = await context.env.DB.prepare(
    "SELECT id, player_name, score, wave, played_at FROM rankings WHERE id = ? LIMIT 1",
  ).bind(id).first();

  if (!result) {
    return jsonResponse({ error: "対象が見つかりません。" }, 404, cors.headers);
  }

  const entry = normalizeRankingRow(result);
  return jsonResponse({ entry }, 200, cors.headers);
}

export async function onRequestOptions(context) {
  const cors = buildCorsHeaders(context);
  if (!cors.allowed) {
    return jsonResponse({ error: "許可されていないオリジンです。" }, 403);
  }
  return noContentResponse(204, cors.headers);
}
