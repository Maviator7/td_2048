import { useCallback, useState } from "react";

import { APP_SCREENS } from "./constants/screens";
import { GameScreen } from "./components/GameScreen";
import { TitleScreen } from "./components/TitleScreen";
import { RankingScreen } from "./components/RankingScreen";
import { useGameState } from "./hooks/useGameState";
import { useRankings } from "./hooks/useRankings";
import { ENEMY_TYPES, GAME_PHASES } from "./game/config";
import { useBgmController } from "./hooks/useBgmController";

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
    bgm.unlockAudio();
    rankings.prepareForNewRun();
    game.restart();
    refreshSaveMeta();
    setScreen(APP_SCREENS.GAME);
  };

  const continueGame = () => {
    bgm.unlockAudio();
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
  const hasActiveBossEnemy = game.enemies?.some(
    (enemy) => (enemy?.isBoss || enemy?.type === ENEMY_TYPES.BOSS) && enemy?.step > 0,
  );
  const isBossSpawningSoon = game.nextSpawnEnemy?.isBoss || game.nextSpawnEnemy?.type === ENEMY_TYPES.BOSS;
  const shouldUseBossBgm = hasActiveBossEnemy || isBossSpawningSoon;
  const bgmMode = activeScreen === APP_SCREENS.GAME
    ? shouldUseBossBgm ? "boss" : "battle"
    : "title";
  const bgm = useBgmController({ mode: bgmMode });

  if (activeScreen === APP_SCREENS.TITLE) {
    return (
      <TitleScreen
        onStart={startGame}
        onContinue={continueGame}
        canContinue={saveMeta.exists}
        continueMeta={saveMeta.summary}
        onOpenRanking={openRanking}
        topScore={rankings.topScore}
        bgmMuted={bgm.bgmMuted}
        masterVolume={bgm.masterVolume}
        bgmVolume={bgm.bgmVolume}
        seVolume={bgm.seVolume}
        onToggleBgmMute={() => bgm.setBgmMuted((current) => !current)}
        onChangeMasterVolume={(nextValue) => bgm.setMasterVolume(nextValue)}
        onChangeBgmVolume={(nextValue) => bgm.setBgmVolume(nextValue)}
        onChangeSeVolume={(nextValue) => bgm.setSeVolume(nextValue)}
        onUnlockAudio={bgm.unlockAudio}
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

  return (
    <GameScreen
      game={game}
      onSaveMetaUpdated={refreshSaveMeta}
      onBackToTitle={backToTitle}
      bgm={bgm}
    />
  );
}
