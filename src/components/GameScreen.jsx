import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { GAME_PHASES, canSelectRoleByTileValue } from "../game/config";
import { GameBoardSection } from "./GameBoardSection";
import { EnemyCodexModal } from "./EnemyCodexModal";
import { GameHeader } from "./GameHeader";
import { GameOverModal } from "./GameOverModal";
import { GameMenuModal } from "./GameMenuModal";
import { RoleSelectModal } from "./RoleSelectModal";
import {
  createGameScreenContentStyle,
  gameScreenShellStyle,
} from "./ui/styles";

const ENEMY_CODEX_STORAGE_KEY = "mf2048_enemy_codex_seen_v1";
const MIN_CONTENT_SCALE_X = 0.72;
const MIN_CONTENT_SCALE_Y = 0.72;

function loadDiscoveredEnemyTypes() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(ENEMY_CODEX_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((entry) => typeof entry === "string") : [];
  } catch {
    return [];
  }
}

export function GameScreen({ game, debugStartEnabled = false, onSaveMetaUpdated, onBackToTitle, onOpenRanking, bgm }) {
  const [viewportWidth, setViewportWidth] = useState(() => window.innerWidth);
  const [contentScale, setContentScale] = useState({ x: 1, y: 1 });
  const [contentSize, setContentSize] = useState({ width: 0, height: 0 });
  const [roleModalData, setRoleModalData] = useState(null);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [isEnemyCodexOpen, setIsEnemyCodexOpen] = useState(false);
  const [saveMeta, setSaveMeta] = useState(() => game.getSaveMeta());
  const initialDiscoveredEnemyTypes = useMemo(() => loadDiscoveredEnemyTypes(), []);
  const isDebugMode = debugStartEnabled || import.meta.env.VITE_ENABLE_DEBUG_PANEL === "true";
  const [isDebugPanelOpen, setIsDebugPanelOpen] = useState(() => isDebugMode);
  const [showCombatDebugOverlay, setShowCombatDebugOverlay] = useState(false);
  const [debugBoostTarget, setDebugBoostTarget] = useState({ row: 0, col: 0 });
  const [isLifeLossActive, setIsLifeLossActive] = useState(false);
  const [lifeLossAmount, setLifeLossAmount] = useState(0);
  const [lifeLossFxKey, setLifeLossFxKey] = useState(0);
  const prevLivesRef = useRef(game.lives);
  const lifeLossSeRef = useRef(null);
  const lifeLossSeFallbackRef = useRef(null);
  const scaledContentRef = useRef(null);

  const {
    lives,
    enemies,
    wave,
    score,
    phase,
    movesPerTurn,
    movesLeft,
    setTileRoleAt,
  } = game;

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const recalcContentScale = useCallback(() => {
    const contentEl = scaledContentRef.current;
    if (!contentEl) {
      return;
    }

    const rawWidth = contentEl.offsetWidth;
    const rawHeight = contentEl.offsetHeight;
    if (rawWidth <= 0 || rawHeight <= 0) {
      return;
    }

    const availableWidth = Math.max(1, window.innerWidth - 16);
    const availableHeight = Math.max(1, window.innerHeight - 24);
    const fitScaleX = Math.min(1, availableWidth / rawWidth);
    const fitScaleY = Math.min(1, availableHeight / rawHeight);
    const nextScaleX = Math.max(MIN_CONTENT_SCALE_X, fitScaleX);
    const nextScaleY = Math.max(MIN_CONTENT_SCALE_Y, fitScaleY);
    setContentScale({ x: nextScaleX, y: nextScaleY });
    setContentSize({ width: rawWidth, height: rawHeight });
  }, []);

  useEffect(() => {
    recalcContentScale();
  }, [recalcContentScale, viewportWidth, phase, isDebugPanelOpen, isMenuModalOpen, isEnemyCodexOpen, isRoleModalOpen]);

  useEffect(() => {
    const contentEl = scaledContentRef.current;
    if (!contentEl) {
      return undefined;
    }

    const observer = new ResizeObserver(() => {
      recalcContentScale();
    });
    observer.observe(contentEl);
    return () => observer.disconnect();
  }, [recalcContentScale]);

  useEffect(() => {
    const audio = new Audio("/se/life_lost.mp3");
    audio.preload = "auto";
    audio.volume = 0.72;
    lifeLossSeRef.current = audio;
    const fallbackAudio = new Audio("/se/move_tile.mp3");
    fallbackAudio.preload = "auto";
    fallbackAudio.volume = 0.5;
    lifeLossSeFallbackRef.current = fallbackAudio;

    return () => {
      audio.pause();
      lifeLossSeRef.current = null;
      fallbackAudio.pause();
      lifeLossSeFallbackRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (lives < prevLivesRef.current) {
      const loss = prevLivesRef.current - lives;
      setLifeLossAmount(loss);
      setLifeLossFxKey((current) => current + 1);
      setIsLifeLossActive(true);
      const seAudio = lifeLossSeRef.current;
      const fallbackAudio = lifeLossSeFallbackRef.current;
      if (seAudio) {
        const masterVolume = Math.min(1, Math.max(0, Number(bgm?.masterVolume ?? 0.5)));
        const seVolume = Math.min(1, Math.max(0, Number(bgm?.seVolume ?? 0.7)));
        const targetVolume = Math.min(1, Math.max(0, 0.72 * masterVolume * seVolume));
        const fallbackVolume = Math.min(1, Math.max(0, 0.5 * masterVolume * seVolume));
        seAudio.volume = targetVolume;
        seAudio.currentTime = 0;
        seAudio.play().catch(() => {
          if (!fallbackAudio) {
            return;
          }
          fallbackAudio.volume = fallbackVolume;
          fallbackAudio.currentTime = 0;
          fallbackAudio.play().catch(() => {});
        });
      }
      const timeoutId = window.setTimeout(() => setIsLifeLossActive(false), 900);
      prevLivesRef.current = lives;
      return () => window.clearTimeout(timeoutId);
    }

    prevLivesRef.current = lives;
    return undefined;
  }, [bgm?.masterVolume, bgm?.seVolume, lives]);

  const discoveredEnemyTypes = useMemo(() => {
    const nextSet = new Set(initialDiscoveredEnemyTypes);
    enemies.forEach((enemy) => {
      if (enemy?.type) {
        nextSet.add(enemy.type);
      }
    });
    return Array.from(nextSet);
  }, [enemies, initialDiscoveredEnemyTypes]);

  useEffect(() => {
    try {
      window.localStorage.setItem(ENEMY_CODEX_STORAGE_KEY, JSON.stringify(discoveredEnemyTypes));
    } catch {
      // Ignore storage failures and keep runtime state.
    }
  }, [discoveredEnemyTypes]);

  const isDesktop = viewportWidth >= 768;
  const isWideDesktop = viewportWidth >= 1200;
  const tileHeight = isWideDesktop ? 62 : isDesktop ? 56 : 54;
  const laneHeight = isWideDesktop ? 160 : isDesktop ? 140 : 130;
  const canEditRoles = phase === GAME_PHASES.PLAYER;
  const isGameOver = phase === GAME_PHASES.GAMEOVER;
  const isPauseModalOpen = isMenuModalOpen || isEnemyCodexOpen || isRoleModalOpen;

  const openRoleModal = (tile) => {
    if (!canEditRoles) {
      return;
    }
    if (!canSelectRoleByTileValue(tile.value) || tile.role) {
      return;
    }

    setRoleModalData(tile);
    setIsRoleModalOpen(true);
  };

  const closeRoleModal = () => {
    setIsRoleModalOpen(false);
  };

  const refreshSaveMeta = () => {
    const nextMeta = game.getSaveMeta();
    setSaveMeta(nextMeta);
    onSaveMetaUpdated?.();
    return nextMeta;
  };

  const openMenuModal = () => {
    if (isGameOver) {
      return;
    }
    refreshSaveMeta();
    setIsMenuModalOpen(true);
  };

  const closeMenuModal = () => {
    setIsMenuModalOpen(false);
  };

  const selectRole = (nextRole) => {
    if (!roleModalData) {
      return;
    }

    setTileRoleAt(roleModalData.row, roleModalData.col, nextRole);
    closeRoleModal();
  };

  const handleTileClick = (tile) => {
    setDebugBoostTarget({ row: tile.row, col: tile.col });
  };

  return (
    <div
      className={[
        isLifeLossActive ? "screen-life-loss-shake" : null,
        isPauseModalOpen ? "game-screen-paused" : null,
      ].filter(Boolean).join(" ") || undefined}
      style={gameScreenShellStyle}
    >
      {isLifeLossActive && (
        <>
          <div className="life-loss-overlay" key={`life-overlay-${lifeLossFxKey}`} />
          <div className="life-loss-banner" key={`life-banner-${lifeLossFxKey}`}>⚠️ -{lifeLossAmount} LIFE</div>
        </>
      )}
      <div
        className={`game-content-shell ${isPauseModalOpen ? "game-content-paused" : ""}`.trim()}
        style={{
          width: contentSize.width ? contentSize.width * contentScale.x : "100%",
          height: contentSize.height ? contentSize.height * contentScale.y : "auto",
        }}
      >
        <div
          ref={scaledContentRef}
          style={{
            ...createGameScreenContentStyle(isDesktop),
            transform: `scale(${contentScale.x}, ${contentScale.y})`,
            transformOrigin: "top left",
          }}
        >
          <GameHeader
            lives={lives}
            wave={wave}
            score={score}
            movesLeft={movesLeft}
            movesPerTurn={movesPerTurn}
            isResolving={phase === GAME_PHASES.RESOLVING}
            isLifeLossActive={isLifeLossActive}
            lifeLossAmount={lifeLossAmount}
            lifeLossFxKey={lifeLossFxKey}
            onOpenMenu={openMenuModal}
            isMenuDisabled={isGameOver}
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12, alignItems: "start" }}>
            <GameBoardSection
              game={game}
              isDesktop={isDesktop}
              laneHeight={laneHeight}
              tileHeight={tileHeight}
              isDebugMode={isDebugMode}
              isDebugPanelOpen={isDebugPanelOpen}
              onToggleDebugPanel={() => setIsDebugPanelOpen((current) => !current)}
              showCombatDebugOverlay={showCombatDebugOverlay}
              onToggleCombatDebugOverlay={setShowCombatDebugOverlay}
              debugBoostTarget={debugBoostTarget}
              onOpenRoleModal={openRoleModal}
              onAnyTileClick={handleTileClick}
            />
          </div>
        </div>
      </div>

      <RoleSelectModal
        isOpen={isRoleModalOpen}
        roleModal={roleModalData}
        onClose={closeRoleModal}
        onSelectRole={selectRole}
        onExited={() => setRoleModalData(null)}
      />
      <GameMenuModal
        isOpen={isMenuModalOpen}
        onClose={closeMenuModal}
        onBackToTitle={() => {
          setIsMenuModalOpen(false);
          onBackToTitle?.();
        }}
        onOpenEnemyCodex={() => {
          setIsMenuModalOpen(false);
          setIsEnemyCodexOpen(true);
        }}
        bgmMuted={bgm?.bgmMuted}
        masterVolume={bgm?.masterVolume}
        bgmVolume={bgm?.bgmVolume}
        seVolume={bgm?.seVolume}
        onToggleBgmMute={() => bgm?.setBgmMuted((current) => !current)}
        onChangeMasterVolume={(nextValue) => bgm?.setMasterVolume(nextValue)}
        onChangeBgmVolume={(nextValue) => bgm?.setBgmVolume(nextValue)}
        onChangeSeVolume={(nextValue) => bgm?.setSeVolume(nextValue)}
        saveMeta={saveMeta}
      />
      <EnemyCodexModal
        isOpen={isEnemyCodexOpen}
        discoveredEnemyTypes={discoveredEnemyTypes}
        onClose={() => setIsEnemyCodexOpen(false)}
      />
      <GameOverModal
        isOpen={isGameOver}
        score={score}
        wave={wave}
        onOpenRanking={() => onOpenRanking?.()}
        onBackToTitle={() => onBackToTitle?.()}
      />
    </div>
  );
}
