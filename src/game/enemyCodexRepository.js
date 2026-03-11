export const ENEMY_CODEX_STORAGE_KEY = "mf2048_enemy_codex_seen_v1";

export function loadDiscoveredEnemyTypes() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(ENEMY_CODEX_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((entry) => typeof entry === "string") : [];
  } catch {
    return [];
  }
}

export function saveDiscoveredEnemyTypes(discoveredEnemyTypes) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(ENEMY_CODEX_STORAGE_KEY, JSON.stringify(discoveredEnemyTypes));
  } catch {
    // Ignore storage failures and keep runtime state.
  }
}
