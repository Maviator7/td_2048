import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";

import { GAME_PHASES } from "../game/config";
import { localRankingRepository } from "../game/rankingRepository";

export function useRankings({ phase, score, wave, playerName, isRankable = true }) {
  const rankingState = useSyncExternalStore(
    localRankingRepository.subscribe,
    localRankingRepository.getSnapshot,
    localRankingRepository.getSnapshot,
  );
  const didPersistCurrentRunRef = useRef(false);

  useEffect(() => {
    if (phase !== GAME_PHASES.GAMEOVER || didPersistCurrentRunRef.current || !isRankable) {
      return;
    }

    localRankingRepository.saveEntry({ score, wave, name: playerName });
    didPersistCurrentRunRef.current = true;
  }, [isRankable, phase, playerName, score, wave]);

  const refreshRankings = useCallback(() => {
    localRankingRepository.refresh();
  }, []);

  const prepareForNewRun = useCallback(() => {
    didPersistCurrentRunRef.current = false;
    localRankingRepository.clearLatestEntry();
  }, []);

  const dismissLatestRankingHighlight = useCallback(() => {
    localRankingRepository.clearLatestEntry();
  }, []);

  const updateLatestRankingName = useCallback((nextName) => {
    return localRankingRepository.updateLatestEntryName(nextName);
  }, []);

  return {
    rankings: rankingState.rankings,
    latestRankingEntryId: rankingState.latestEntryId,
    topScore: rankingState.rankings[0]?.score ?? null,
    refreshRankings,
    prepareForNewRun,
    dismissLatestRankingHighlight,
    updateLatestRankingName,
  };
}
