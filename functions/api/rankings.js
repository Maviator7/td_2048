const MAX_RANKING_ENTRIES = 20;
const MAX_SCORE = 5_000_000;
const MAX_WAVE = 5_000;
const MAX_NAME_LENGTH = 12;

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
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
  const url = new URL(context.request.url);
  const limit = parsePositiveInt(url.searchParams.get("limit"), MAX_RANKING_ENTRIES);
  const rankings = await fetchRankings(context.env.DB, limit);
  return jsonResponse({ rankings });
}

export async function onRequestPost(context) {
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
    return jsonResponse({ error: nameResult.error }, 400);
  }

  if (score === null || score < 0 || score > MAX_SCORE) {
    return jsonResponse({ error: "スコアが不正です。" }, 400);
  }

  if (wave === null || wave < 1 || wave > MAX_WAVE) {
    return jsonResponse({ error: "Wave が不正です。" }, 400);
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

  return jsonResponse({ entry, rankings }, 201);
}
