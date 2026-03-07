const STORAGE_KEY = "merge-fortress-2048:local-rankings:v1";
const LEGACY_STORAGE_KEYS = [
  "merge-fortress-2048:local-rankings",
];
const MAX_RANKING_ENTRIES = 20;
const listeners = new Set();

let rankingSnapshot = {
  rankings: [],
  latestEntryId: null,
};

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

function readRankingsFromStorage(storageKey) {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(storageKey);
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

function writeRankingsToStorage(rankings) {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rankings));
    return true;
  } catch {
    return false;
  }
}

function migrateLegacyRankings() {
  if (typeof window === "undefined") {
    return [];
  }

  const currentRankings = readRankingsFromStorage(STORAGE_KEY);
  if (currentRankings.length > 0) {
    return currentRankings;
  }

  for (const legacyKey of LEGACY_STORAGE_KEYS) {
    const legacyRankings = readRankingsFromStorage(legacyKey);
    if (!legacyRankings.length) {
      continue;
    }

    writeRankingsToStorage(legacyRankings);
    try {
      window.localStorage.removeItem(legacyKey);
    } catch {
      // Ignore cleanup failures. Migration is best-effort.
    }
    return legacyRankings;
  }

  return currentRankings;
}

function emitRankingSnapshot(nextSnapshot) {
  rankingSnapshot = nextSnapshot;
  listeners.forEach((listener) => listener());
}

function getInitialSnapshot() {
  return {
    rankings: migrateLegacyRankings(),
    latestEntryId: null,
  };
}

rankingSnapshot = getInitialSnapshot();

export function subscribeRankings(listener) {
  listeners.add(listener);
  const handleStorage = (event) => {
    if (![STORAGE_KEY, ...LEGACY_STORAGE_KEYS].includes(event.key)) {
      return;
    }

    refreshRankingSnapshot();
  };

  if (typeof window !== "undefined") {
    window.addEventListener("storage", handleStorage);
  }

  return () => {
    listeners.delete(listener);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", handleStorage);
    }
  };
}

export function getRankingSnapshot() {
  return rankingSnapshot;
}

export function refreshRankingSnapshot() {
  emitRankingSnapshot({
    rankings: migrateLegacyRankings(),
    latestEntryId: rankingSnapshot.latestEntryId,
  });
}

export function clearLatestRankingEntry() {
  emitRankingSnapshot({
    rankings: rankingSnapshot.rankings,
    latestEntryId: null,
  });
}

export function saveRankingEntry({ score, wave }) {
  const entry = {
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    score: Math.max(0, Math.floor(Number(score) || 0)),
    wave: Math.max(1, Math.floor(Number(wave) || 1)),
    playedAt: new Date().toISOString(),
  };

  if (typeof window === "undefined") {
    return { entry, rankings: [entry] };
  }

  const rankings = sortRankings([entry, ...migrateLegacyRankings()]).slice(0, MAX_RANKING_ENTRIES);
  writeRankingsToStorage(rankings);
  emitRankingSnapshot({ rankings, latestEntryId: entry.id });
  return { entry, rankings };
}

export const rankingRepository = {
  subscribe: subscribeRankings,
  getSnapshot: getRankingSnapshot,
  refresh: refreshRankingSnapshot,
  clearLatestEntry: clearLatestRankingEntry,
  saveEntry: saveRankingEntry,
};
