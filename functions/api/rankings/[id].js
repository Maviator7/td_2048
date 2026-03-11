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
  const id = context.params?.id;
  if (!id) {
    return jsonResponse({ error: "ID が不正です。" }, 400);
  }

  let payload = null;
  try {
    payload = await context.request.json();
  } catch {
    payload = null;
  }

  const nameResult = validateName(payload?.name);
  if (!nameResult.ok) {
    return jsonResponse({ error: nameResult.error }, 400);
  }

  const update = await context.env.DB.prepare(
    "UPDATE rankings SET player_name = ? WHERE id = ?",
  ).bind(nameResult.value, id).run();

  if (!update.success) {
    return jsonResponse({ error: "更新に失敗しました。" }, 500);
  }
  if (update.meta?.changes === 0) {
    return jsonResponse({ error: "対象が見つかりません。" }, 404);
  }

  const result = await context.env.DB.prepare(
    "SELECT id, player_name, score, wave, played_at FROM rankings WHERE id = ? LIMIT 1",
  ).bind(id).first();

  if (!result) {
    return jsonResponse({ error: "対象が見つかりません。" }, 404);
  }

  const entry = normalizeRankingRow(result);
  return jsonResponse({ entry });
}
