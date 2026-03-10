import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";

import { GAME_PHASES } from "../game/config";
import { rankingRepository } from "../game/rankingRepository";

export function useRankings({ phase, score, wave, playerName, isRankable = true }) {
  const rankingState = useSyncExternalStore(
    rankingRepository.subscribe,
    rankingRepository.getSnapshot,
    rankingRepository.getSnapshot,
  );
  const didPersistCurrentRunRef = useRef(false);

  useEffect(() => {
    if (phase !== GAME_PHASES.GAMEOVER || didPersistCurrentRunRef.current || !isRankable) {
      return;
    }

    rankingRepository.saveEntry({ score, wave, name: playerName });
    didPersistCurrentRunRef.current = true;
  }, [isRankable, phase, playerName, score, wave]);

  const refreshRankings = useCallback(() => {
    rankingRepository.refresh();
  }, []);

  const prepareForNewRun = useCallback(() => {
    didPersistCurrentRunRef.current = false;
    rankingRepository.clearLatestEntry();
  }, []);

  const dismissLatestRankingHighlight = useCallback(() => {
    rankingRepository.clearLatestEntry();
  }, []);

  const updateLatestRankingName = useCallback((nextName) => {
    return rankingRepository.updateLatestEntryName(nextName);
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
