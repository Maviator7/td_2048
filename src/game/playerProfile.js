export const PLAYER_PROFILE_STORAGE_KEYS = {
  rankingName: "mf2048_player_name_v1",
};

export const DEFAULT_RANKING_NAME = "PLAYER";
export const MAX_RANKING_NAME_LENGTH = 12;

export function sanitizeRankingName(rawName) {
  if (typeof rawName !== "string") {
    return "";
  }

  return rawName
    .normalize("NFKC")
    .replace(/[\p{Cc}\p{Cf}]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function validateRankingName(rawName) {
  const value = sanitizeRankingName(rawName);
  if (!value) {
    return { ok: false, value, error: "名前を入力してください。" };
  }

  if (value.length > MAX_RANKING_NAME_LENGTH) {
    return { ok: false, value, error: `名前は${MAX_RANKING_NAME_LENGTH}文字以内で入力してください。` };
  }

  return { ok: true, value, error: null };
}

export function loadStoredRankingName() {
  if (typeof window === "undefined") {
    return DEFAULT_RANKING_NAME;
  }

  const stored = window.localStorage.getItem(PLAYER_PROFILE_STORAGE_KEYS.rankingName);
  const result = validateRankingName(stored);
  return result.ok ? result.value : DEFAULT_RANKING_NAME;
}

export function hasStoredRankingName() {
  if (typeof window === "undefined") {
    return false;
  }

  const stored = window.localStorage.getItem(PLAYER_PROFILE_STORAGE_KEYS.rankingName);
  return validateRankingName(stored).ok;
}

export function storeRankingName(rawName) {
  const result = validateRankingName(rawName);
  const value = result.ok ? result.value : DEFAULT_RANKING_NAME;

  if (typeof window !== "undefined") {
    window.localStorage.setItem(PLAYER_PROFILE_STORAGE_KEYS.rankingName, value);
  }

  return value;
}
