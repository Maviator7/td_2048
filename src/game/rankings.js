const STORAGE_KEY = "merge-fortress-2048:local-rankings";
const MAX_RANKING_ENTRIES = 20;

function sortRankings(rankings) {
  return [...rankings].sort((left, right) => {
    if (right.score !== left.score) {
      return right.score - left.score;
    }
    if (right.wave !== left.wave) {
      return right.wave - left.wave;
    }
    return right.playedAt.localeCompare(left.playedAt);
  });
}

function normalizeRankingEntry(entry) {
  if (!entry || typeof entry !== "object") {
    return null;
  }

  const score = Number.isFinite(Number(entry.score)) ? Math.max(0, Math.floor(Number(entry.score))) : null;
  const wave = Number.isFinite(Number(entry.wave)) ? Math.max(1, Math.floor(Number(entry.wave))) : null;
  const playedAt = typeof entry.playedAt === "string" ? entry.playedAt : null;
  const id = typeof entry.id === "string" ? entry.id : null;

  if (score === null || wave === null || !playedAt || !id) {
    return null;
  }

  return { id, score, wave, playedAt };
}

export function getLocalRankings() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return sortRankings(parsed.map(normalizeRankingEntry).filter(Boolean)).slice(0, MAX_RANKING_ENTRIES);
  } catch {
    return [];
  }
}

export function saveLocalRanking({ score, wave }) {
  const entry = {
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    score: Math.max(0, Math.floor(Number(score) || 0)),
    wave: Math.max(1, Math.floor(Number(wave) || 1)),
    playedAt: new Date().toISOString(),
  };

  if (typeof window === "undefined") {
    return { entry, rankings: [entry] };
  }

  const rankings = sortRankings([entry, ...getLocalRankings()]).slice(0, MAX_RANKING_ENTRIES);

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rankings));
  } catch {
    return { entry, rankings };
  }

  return { entry, rankings };
}
