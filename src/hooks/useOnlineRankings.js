import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";

import { GAME_PHASES } from "../game/config";
import { onlineRankingRepository } from "../game/rankingRepository";

const env = import.meta.env ?? {};
const onlineEnabled = env.VITE_ONLINE_RANKINGS === "true" || env.VITE_RANKINGS_MODE === "remote";

const emptySnapshot = {
  rankings: [],
  latestEntryId: null,
};

export function useOnlineRankings({ phase, score, wave, playerName, isRankable = true } = {}) {
  const rankingState = useSyncExternalStore(
    onlineEnabled ? onlineRankingRepository.subscribe : () => () => {},
    onlineEnabled ? onlineRankingRepository.getSnapshot : () => emptySnapshot,
    onlineEnabled ? onlineRankingRepository.getSnapshot : () => emptySnapshot,
  );
  const didPersistCurrentRunRef = useRef(false);

  useEffect(() => {
    if (!onlineEnabled) {
      return;
    }
    if (phase !== GAME_PHASES.GAMEOVER || didPersistCurrentRunRef.current || !isRankable) {
      return;
    }

    onlineRankingRepository.saveEntry({ score, wave, name: playerName });
    didPersistCurrentRunRef.current = true;
  }, [isRankable, phase, playerName, score, wave]);

  const refreshRankings = useCallback(() => {
    if (!onlineEnabled) {
      return;
    }
    onlineRankingRepository.refresh();
  }, []);

  const prepareForNewRun = useCallback(() => {
    didPersistCurrentRunRef.current = false;
    if (!onlineEnabled) {
      return;
    }
    onlineRankingRepository.clearLatestEntry();
  }, []);

  const dismissLatestRankingHighlight = useCallback(() => {
    if (!onlineEnabled) {
      return;
    }
    onlineRankingRepository.clearLatestEntry();
  }, []);

  const updateLatestRankingName = useCallback((nextName) => {
    if (!onlineEnabled) {
      return { updated: false, rankings: emptySnapshot.rankings };
    }
    return onlineRankingRepository.updateLatestEntryName(nextName);
  }, []);

  return {
    rankings: rankingState.rankings,
    latestRankingEntryId: rankingState.latestEntryId,
    topScore: rankingState.rankings[0]?.score ?? null,
    refreshRankings,
    prepareForNewRun,
    dismissLatestRankingHighlight,
    updateLatestRankingName,
    isEnabled: onlineEnabled,
  };
}
