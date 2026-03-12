import { DEFAULT_RANKING_NAME, validateRankingName } from "./playerProfile";
import { captureError } from "../lib/errorTracker";

const MAX_RANKING_ENTRIES = 20;
const ERROR_LOG_COOLDOWN_MS = 30_000;
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
let lastRefreshErrorLog = {
  key: "",
  at: 0,
};

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

async function parseErrorBody(response) {
  try {
    const data = await response.json();
    if (typeof data?.error === "string" && data.error.trim()) {
      return data.error.trim();
    }
  } catch {
    // Ignore non-JSON body.
  }
  return "";
}

function createRefreshErrorMessage(status, detailMessage = "") {
  if (status >= 500) {
    return "オンラインランキングサーバーでエラーが発生しています。時間をおいて再試行してください。";
  }
  if (status === 429) {
    return "ランキング取得が混み合っています。少し時間をおいて再試行してください。";
  }
  return detailMessage || "オンラインランキングの取得に失敗しました。";
}

function shouldLogRefreshError(status, detailMessage) {
  const now = Date.now();
  const key = `${status}:${detailMessage}`;
  const isSameError = lastRefreshErrorLog.key === key;
  const isWithinCooldown = now - lastRefreshErrorLog.at < ERROR_LOG_COOLDOWN_MS;
  if (isSameError && isWithinCooldown) {
    return false;
  }
  lastRefreshErrorLog = { key, at: now };
  return true;
}

function createRankingsUrl({ bustCache = false } = {}) {
  const params = new URLSearchParams();
  params.set("limit", String(MAX_RANKING_ENTRIES));
  if (bustCache) {
    // Keep ranking refresh instant after write operations when edge cache is enabled.
    params.set("ts", String(Date.now()));
  }
  return `${API_BASE}/rankings?${params.toString()}`;
}

async function fetchRankings({ bustCache = false } = {}) {
  const response = await fetch(createRankingsUrl({ bustCache }), {
    method: "GET",
    headers: {
      "Accept": "application/json",
    },
  });

  if (!response.ok) {
    const detailMessage = await parseErrorBody(response);
    const error = new Error(detailMessage || `Failed to load rankings (${response.status})`);
    error.status = response.status;
    error.userMessage = createRefreshErrorMessage(response.status, detailMessage);
    throw error;
  }

  const data = await response.json();
  const rankings = Array.isArray(data?.rankings) ? data.rankings : [];
  return rankings.map(normalizeRankingEntry).filter(Boolean);
}

async function refreshRankingSnapshot({ bustCache = false } = {}) {
  if (!refreshPromise) {
    refreshPromise = fetchRankings({ bustCache })
      .then((rankings) => {
        emitRankingSnapshot({
          rankings,
          latestEntryId: rankingSnapshot.latestEntryId,
          errorMessage: "",
        });
      })
      .catch((error) => {
        const status = Number.isFinite(Number(error?.status)) ? Number(error.status) : 0;
        const detailMessage = typeof error?.message === "string" ? error.message : "";
        if (shouldLogRefreshError(status, detailMessage)) {
          console.error("[online-rankings] failed to refresh rankings", error);
          captureError(error, {
            tags: { area: "online-rankings", action: "refresh" },
            extra: { status, detailMessage },
          });
        }
        emitRankingSnapshot({
          rankings: rankingSnapshot.rankings,
          latestEntryId: rankingSnapshot.latestEntryId,
          errorMessage: typeof error?.userMessage === "string" && error.userMessage
            ? error.userMessage
            : "オンラインランキングの取得に失敗しました。",
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
    captureError(error, {
      tags: { area: "online-rankings", action: "save" },
      extra: { score: payload.score, wave: payload.wave },
    });
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
    captureError(error, {
      tags: { area: "online-rankings", action: "update-name" },
      extra: { latestEntryId },
    });
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
