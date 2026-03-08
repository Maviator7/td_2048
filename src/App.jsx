import { useCallback, useState } from "react";

import { APP_SCREENS } from "./constants/screens";
import { GameScreen } from "./components/GameScreen";
import { TitleScreen } from "./components/TitleScreen";
import { RankingScreen } from "./components/RankingScreen";
import { useGameState } from "./hooks/useGameState";
import { useRankings } from "./hooks/useRankings";
import { GAME_PHASES } from "./game/config";

export default function MergeTowerDefense() {
  const [screen, setScreen] = useState(APP_SCREENS.TITLE);
  const game = useGameState();
  const [saveMeta, setSaveMeta] = useState(() => game.getSaveMeta());
  const rankings = useRankings({
    phase: game.phase,
    score: game.score,
    wave: game.wave,
  });

  const refreshSaveMeta = useCallback(() => {
    setSaveMeta(game.getSaveMeta());
  }, [game]);

  const startGame = () => {
    rankings.prepareForNewRun();
    game.restart();
    refreshSaveMeta();
    setScreen(APP_SCREENS.GAME);
  };

  const continueGame = () => {
    const loaded = game.loadGame();
    refreshSaveMeta();
    if (!loaded.ok) {
      return false;
    }

    rankings.prepareForNewRun();
    setScreen(APP_SCREENS.GAME);
    return true;
  };

  const backToTitle = () => {
    rankings.dismissLatestRankingHighlight();
    refreshSaveMeta();
    setScreen(APP_SCREENS.TITLE);
  };

  const openRanking = () => {
    rankings.refreshRankings();
    setScreen(APP_SCREENS.RANKING);
  };

  const activeScreen = screen === APP_SCREENS.GAME && game.phase === GAME_PHASES.GAMEOVER
    ? APP_SCREENS.RANKING
    : screen;

  if (activeScreen === APP_SCREENS.TITLE) {
    return (
      <TitleScreen
        onStart={startGame}
        onContinue={continueGame}
        canContinue={saveMeta.exists}
        continueMeta={saveMeta.summary}
        onOpenRanking={openRanking}
        topScore={rankings.topScore}
      />
    );
  }

  if (activeScreen === APP_SCREENS.RANKING) {
    return (
      <RankingScreen
        rankings={rankings.rankings}
        latestEntryId={rankings.latestRankingEntryId}
        onStart={startGame}
        onBackToTitle={backToTitle}
      />
    );
  }

  return <GameScreen game={game} onSaveMetaUpdated={refreshSaveMeta} />;
}
