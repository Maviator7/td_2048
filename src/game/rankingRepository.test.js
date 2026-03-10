import { beforeEach, describe, expect, test, vi } from "vitest";

const STORAGE_KEY = "merge-fortress-2048:local-rankings:v1";
const LEGACY_STORAGE_KEY = "merge-fortress-2048:local-rankings";

describe("rankingRepository", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    vi.useRealTimers();
    vi.resetModules();
  });

  test("migrates legacy rankings into the versioned storage key", async () => {
    localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify([
      { id: "older", score: 120, wave: 4, playedAt: "2026-03-01T00:00:00.000Z", name: "AAA" },
      { id: "better", score: 180, wave: 5, playedAt: "2026-03-02T00:00:00.000Z", name: "BBB" },
    ]));

    const { getRankingSnapshot } = await import("./rankingRepository.js");

    expect(getRankingSnapshot().rankings.map((entry) => entry.id)).toEqual(["better", "older"]);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY))).toHaveLength(2);
    expect(localStorage.getItem(LEGACY_STORAGE_KEY)).toBeNull();
  });

  test("saveEntry persists the latest entry and allows clearing the highlight", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-08T00:00:00.000Z"));
    vi.spyOn(Math, "random").mockReturnValue(0.123456);

    localStorage.setItem(STORAGE_KEY, JSON.stringify([
      { id: "seed-1", score: 80, wave: 3, playedAt: "2026-03-01T00:00:00.000Z", name: "S1" },
      { id: "seed-2", score: 40, wave: 2, playedAt: "2026-02-28T00:00:00.000Z", name: "S2" },
    ]));

    const { clearLatestRankingEntry, getRankingSnapshot, saveRankingEntry } = await import("./rankingRepository.js");

    const { entry } = saveRankingEntry({ score: 120, wave: 6, name: "Alice" });
    const snapshot = getRankingSnapshot();

    expect(snapshot.latestEntryId).toBe(entry.id);
    expect(snapshot.rankings[0]).toMatchObject({ id: entry.id, score: 120, wave: 6, name: "Alice" });
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY))[0].id).toBe(entry.id);

    clearLatestRankingEntry();
    expect(getRankingSnapshot().latestEntryId).toBeNull();
  });

  test("updateLatestRankingEntryName renames the latest ranking entry", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-08T00:00:00.000Z"));
    vi.spyOn(Math, "random").mockReturnValue(0.654321);

    const {
      getRankingSnapshot,
      saveRankingEntry,
      updateLatestRankingEntryName,
    } = await import("./rankingRepository.js");

    const { entry } = saveRankingEntry({ score: 220, wave: 8, name: "Before" });
    const updateResult = updateLatestRankingEntryName("After");
    const snapshot = getRankingSnapshot();

    expect(updateResult.updated).toBe(true);
    expect(snapshot.latestEntryId).toBe(entry.id);
    expect(snapshot.rankings[0].name).toBe("After");
  });
});
