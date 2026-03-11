import { DEFAULT_RANKING_NAME, validateRankingName } from "./playerProfile";

const MAX_RANKING_ENTRIES = 20;
const listeners = new Set();
const env = import.meta.env ?? {};
const API_BASE = env.VITE_RANKINGS_API_BASE || "/api";

let rankingSnapshot = {
  rankings: [],
  latestEntryId: null,
  errorMessage: "",
};
let refreshPromise = null;
let didInitialRefresh = false;

function emitRankingSnapshot(nextSnapshot) {
  rankingSnapshot = nextSnapshot;
  listeners.forEach((listener) => listener());
}

function normalizeRankingEntry(entry) {
  if (!entry || typeof entry !== "object") {
    return null;
  }

  const score = Number.isFinite(Number(entry.score)) ? Math.max(0, Math.floor(Number(entry.score))) : null;
  const wave = Number.isFinite(Number(entry.wave)) ? Math.max(1, Math.floor(Number(entry.wave))) : null;
  const playedAt = typeof entry.playedAt === "string" ? entry.playedAt : null;
  const id = typeof entry.id === "string" ? entry.id : null;
  const validatedName = validateRankingName(entry?.name);
  const name = validatedName.ok ? validatedName.value : DEFAULT_RANKING_NAME;

  if (score === null || wave === null || !playedAt || !id) {
    return null;
  }

  return { id, name, score, wave, playedAt };
}

async function fetchRankings() {
  const response = await fetch(`${API_BASE}/rankings?limit=${MAX_RANKING_ENTRIES}`, {
    method: "GET",
    headers: {
      "Accept": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to load rankings (${response.status})`);
  }

  const data = await response.json();
  const rankings = Array.isArray(data?.rankings) ? data.rankings : [];
  return rankings.map(normalizeRankingEntry).filter(Boolean);
}

async function refreshRankingSnapshot() {
  if (!refreshPromise) {
    refreshPromise = fetchRankings()
      .then((rankings) => {
        emitRankingSnapshot({
          rankings,
          latestEntryId: rankingSnapshot.latestEntryId,
          errorMessage: "",
        });
      })
      .catch((error) => {
        console.error("[online-rankings] failed to refresh rankings", error);
        emitRankingSnapshot({
          rankings: rankingSnapshot.rankings,
          latestEntryId: rankingSnapshot.latestEntryId,
          errorMessage: "オンラインランキングの取得に失敗しました。",
        });
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

export function subscribeRankings(listener) {
  listeners.add(listener);
  if (!didInitialRefresh) {
    didInitialRefresh = true;
    refreshRankingSnapshot();
  }
  return () => {
    listeners.delete(listener);
  };
}

export function getRankingSnapshot() {
  return rankingSnapshot;
}

export function clearLatestRankingEntry() {
  emitRankingSnapshot({
    rankings: rankingSnapshot.rankings,
    latestEntryId: null,
    errorMessage: rankingSnapshot.errorMessage,
  });
}

export async function saveRankingEntry({ score, wave, name }) {
  const validatedName = validateRankingName(name);
  const payload = {
    name: validatedName.ok ? validatedName.value : DEFAULT_RANKING_NAME,
    score: Math.max(0, Math.floor(Number(score) || 0)),
    wave: Math.max(1, Math.floor(Number(wave) || 1)),
  };

  try {
    const response = await fetch(`${API_BASE}/rankings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Failed to save ranking (${response.status})`);
    }

    const data = await response.json();
    const entry = normalizeRankingEntry(data?.entry);
    const rankings = Array.isArray(data?.rankings)
      ? data.rankings.map(normalizeRankingEntry).filter(Boolean)
      : (entry ? [entry, ...rankingSnapshot.rankings] : rankingSnapshot.rankings);

    if (entry) {
      emitRankingSnapshot({
        rankings,
        latestEntryId: entry.id,
        errorMessage: "",
      });
    }

    return { entry, rankings };
  } catch (error) {
    console.error("[online-rankings] failed to save ranking", error);
    emitRankingSnapshot({
      rankings: rankingSnapshot.rankings,
      latestEntryId: rankingSnapshot.latestEntryId,
      errorMessage: "オンラインランキングへの送信に失敗しました。",
    });
    return { entry: null, rankings: rankingSnapshot.rankings };
  }
}

export async function updateLatestRankingEntryName(name) {
  const latestEntryId = rankingSnapshot.latestEntryId;
  if (!latestEntryId) {
    return { updated: false, rankings: rankingSnapshot.rankings };
  }

  const validatedName = validateRankingName(name);
  if (!validatedName.ok) {
    return { updated: false, rankings: rankingSnapshot.rankings };
  }

  try {
    const response = await fetch(`${API_BASE}/rankings/${latestEntryId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({ name: validatedName.value }),
    });

    if (!response.ok) {
      throw new Error(`Failed to update ranking (${response.status})`);
    }

    const data = await response.json();
    const entry = normalizeRankingEntry(data?.entry);
    if (entry) {
      const rankings = rankingSnapshot.rankings.map((current) => (
        current.id === entry.id ? entry : current
      ));
      emitRankingSnapshot({
        rankings,
        latestEntryId: rankingSnapshot.latestEntryId,
        errorMessage: "",
      });
      return { updated: true, rankings };
    }
  } catch (error) {
    console.error("[online-rankings] failed to update ranking name", error);
    emitRankingSnapshot({
      rankings: rankingSnapshot.rankings,
      latestEntryId: rankingSnapshot.latestEntryId,
      errorMessage: "オンラインランキング名の更新に失敗しました。",
    });
  }

  return { updated: false, rankings: rankingSnapshot.rankings };
}

export const rankingRepository = {
  subscribe: subscribeRankings,
  getSnapshot: getRankingSnapshot,
  refresh: refreshRankingSnapshot,
  clearLatestEntry: clearLatestRankingEntry,
  saveEntry: saveRankingEntry,
  updateLatestEntryName: updateLatestRankingEntryName,
};
