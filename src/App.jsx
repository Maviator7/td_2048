import { useCallback, useEffect, useRef, useState } from "react";

import { APP_SCREENS } from "./constants/screens";
import { GameScreen } from "./components/GameScreen";
import { TitleScreen } from "./components/TitleScreen";
import { RankingScreen } from "./components/RankingScreen";
import { useGameState } from "./hooks/useGameState";
import { useRankings } from "./hooks/useRankings";
import { ENEMY_TYPES, GAME_PHASES } from "./game/config";
import { useBgmController } from "./hooks/useBgmController";
import {
  hasStoredRankingName,
  loadStoredRankingName,
  sanitizeRankingName,
  storeRankingName,
  validateRankingName,
} from "./game/playerProfile";

const SCREEN_EXIT_DURATION_MS = 150;
const SCREEN_ENTER_FRAME_DELAY_MS = 20;

function resolveScreenTransitionPreset(fromScreen, toScreen) {
  if (fromScreen === APP_SCREENS.TITLE && toScreen === APP_SCREENS.GAME) {
    return "deploy";
  }
  if (fromScreen === APP_SCREENS.GAME && toScreen === APP_SCREENS.RANKING) {
    return "report";
  }
  if (fromScreen === APP_SCREENS.RANKING && toScreen === APP_SCREENS.TITLE) {
    return "return";
  }
  if (fromScreen === APP_SCREENS.TITLE && toScreen === APP_SCREENS.RANKING) {
    return "menu";
  }
  return "neutral";
}

export default function MergeTowerDefense() {
  const [screen, setScreen] = useState(APP_SCREENS.TITLE);
  const [debugStartEnabled, setDebugStartEnabled] = useState(false);
  const [rankingName, setRankingName] = useState(loadStoredRankingName);
  const [shouldPromptRankingNameModal, setShouldPromptRankingNameModal] = useState(() => !hasStoredRankingName());
  const game = useGameState();
  const [saveMeta, setSaveMeta] = useState(() => game.getSaveMeta());
  const rankings = useRankings({
    phase: game.phase,
    score: game.score,
    wave: game.wave,
    playerName: rankingName,
    isRankable: !game.tampered,
  });
  const [renderedScreen, setRenderedScreen] = useState(APP_SCREENS.TITLE);
  const [screenPhase, setScreenPhase] = useState("entered");
  const [screenTransitionPreset, setScreenTransitionPreset] = useState("neutral");
  const presetTimerRef = useRef(null);
  const exitStartTimerRef = useRef(null);
  const switchTimerRef = useRef(null);
  const enterTimerRef = useRef(null);

  const refreshSaveMeta = useCallback(() => {
    setSaveMeta(game.getSaveMeta());
  }, [game]);

  const startGame = ({ debug = false } = {}) => {
    bgm.unlockAudio();
    rankings.prepareForNewRun();
    game.restart();
    setDebugStartEnabled(Boolean(debug));
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
    setDebugStartEnabled(false);
    setScreen(APP_SCREENS.GAME);
    return true;
  };

  const backToTitle = () => {
    rankings.dismissLatestRankingHighlight();
    setDebugStartEnabled(false);
    refreshSaveMeta();
    setScreen(APP_SCREENS.TITLE);
  };

  const openRanking = () => {
    rankings.refreshRankings();
    setScreen(APP_SCREENS.RANKING);
  };

  const openRankingFromGameOver = () => {
    rankings.refreshRankings();
    setScreen(APP_SCREENS.RANKING);
  };

  const handleChangeRankingName = useCallback((rawName) => {
    const sanitizedName = sanitizeRankingName(rawName);
    const result = validateRankingName(sanitizedName);
    if (!result.ok) {
      return result;
    }

    const storedName = storeRankingName(sanitizedName);
    setRankingName(storedName);
    setShouldPromptRankingNameModal(false);
    rankings.updateLatestRankingName(storedName);
    return { ok: true, value: storedName, error: null };
  }, [rankings]);

  const activeScreen = screen;

  useEffect(() => {
    window.clearTimeout(exitStartTimerRef.current);
    window.clearTimeout(switchTimerRef.current);
    window.clearTimeout(presetTimerRef.current);

    if (activeScreen === renderedScreen) {
      return undefined;
    }

    presetTimerRef.current = window.setTimeout(() => {
      setScreenTransitionPreset(resolveScreenTransitionPreset(renderedScreen, activeScreen));
    }, 0);
    exitStartTimerRef.current = window.setTimeout(() => {
      setScreenPhase("exiting");
    }, 0);
    switchTimerRef.current = window.setTimeout(() => {
      setRenderedScreen(activeScreen);
      setScreenPhase("entering");
    }, SCREEN_EXIT_DURATION_MS);

    return () => {
      window.clearTimeout(exitStartTimerRef.current);
      window.clearTimeout(switchTimerRef.current);
      window.clearTimeout(presetTimerRef.current);
    };
  }, [activeScreen, renderedScreen]);

  useEffect(() => {
    window.clearTimeout(enterTimerRef.current);
    if (screenPhase !== "entering") {
      return undefined;
    }

    enterTimerRef.current = window.setTimeout(() => {
      setScreenPhase("entered");
    }, SCREEN_ENTER_FRAME_DELAY_MS);

    return () => {
      window.clearTimeout(enterTimerRef.current);
    };
  }, [screenPhase]);

  const hasActiveBossEnemy = game.enemies?.some(
    (enemy) => (enemy?.isBoss || enemy?.type === ENEMY_TYPES.BOSS) && enemy?.step > 0,
  );
  const isBossSpawningSoon = game.nextSpawnEnemy?.isBoss || game.nextSpawnEnemy?.type === ENEMY_TYPES.BOSS;
  const shouldUseBossBgm = hasActiveBossEnemy || isBossSpawningSoon;
  const bgmMode = screen === APP_SCREENS.GAME
    ? game.phase === GAME_PHASES.GAMEOVER
      ? "gameover"
      : shouldUseBossBgm ? "boss" : "battle"
    : "title";
  const bgm = useBgmController({ mode: bgmMode });

  const screenContent = renderedScreen === APP_SCREENS.TITLE ? (
    <TitleScreen
      onStart={() => startGame({ debug: false })}
      onStartDebug={() => startGame({ debug: true })}
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
      rankingName={rankingName}
      onChangeRankingName={handleChangeRankingName}
    />
  ) : renderedScreen === APP_SCREENS.RANKING ? (
    <RankingScreen
      rankings={rankings.rankings}
      latestEntryId={rankings.latestRankingEntryId}
      rankingName={rankingName}
      shouldPromptNameModal={shouldPromptRankingNameModal}
      onSubmitRankingName={handleChangeRankingName}
      onStart={() => startGame({ debug: false })}
      onBackToTitle={backToTitle}
    />
  ) : (
    <GameScreen
      game={game}
      debugStartEnabled={debugStartEnabled}
      onSaveMetaUpdated={refreshSaveMeta}
      onBackToTitle={backToTitle}
      onOpenRanking={openRankingFromGameOver}
      bgm={bgm}
    />
  );

  return (
    <div className="app-screen-root">
      <div
        className={`app-screen-layer app-screen-layer-${screenPhase} app-screen-layer-${screenTransitionPreset}`}
      >
        {screenContent}
      </div>
    </div>
  );
}
