import { useEffect, useMemo, useRef, useState } from "react";

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

export function GameScreen({ game, onSaveMetaUpdated, onBackToTitle, onOpenRanking, bgm }) {
  const [viewportWidth, setViewportWidth] = useState(() => window.innerWidth);
  const [roleModalData, setRoleModalData] = useState(null);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [isEnemyCodexOpen, setIsEnemyCodexOpen] = useState(false);
  const [saveMeta, setSaveMeta] = useState(() => game.getSaveMeta());
  const initialDiscoveredEnemyTypes = useMemo(() => loadDiscoveredEnemyTypes(), []);
  const isDebugMode = import.meta.env.VITE_ENABLE_DEBUG_PANEL === "true";
  const [isDebugPanelOpen, setIsDebugPanelOpen] = useState(() => isDebugMode);
  const [debugBoostTarget, setDebugBoostTarget] = useState({ row: 0, col: 0 });
  const [isLifeLossActive, setIsLifeLossActive] = useState(false);
  const [lifeLossAmount, setLifeLossAmount] = useState(0);
  const [lifeLossFxKey, setLifeLossFxKey] = useState(0);
  const prevLivesRef = useRef(game.lives);

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

  useEffect(() => {
    if (lives < prevLivesRef.current) {
      const loss = prevLivesRef.current - lives;
      setLifeLossAmount(loss);
      setLifeLossFxKey((current) => current + 1);
      setIsLifeLossActive(true);
      const timeoutId = window.setTimeout(() => setIsLifeLossActive(false), 900);
      prevLivesRef.current = lives;
      return () => window.clearTimeout(timeoutId);
    }

    prevLivesRef.current = lives;
    return undefined;
  }, [lives]);

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
        style={createGameScreenContentStyle(isDesktop)}
      >
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
          <button
            type="button"
            onClick={openMenuModal}
            disabled={isGameOver}
            style={{
              border: "1px solid #334155",
              borderRadius: 10,
              padding: "8px 12px",
              background: "rgba(15,23,42,0.92)",
              color: "#e2e8f0",
              fontWeight: 800,
              fontSize: 13,
              cursor: isGameOver ? "not-allowed" : "pointer",
              opacity: isGameOver ? 0.55 : 1,
            }}
          >
            ☰ メニュー
          </button>
        </div>
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
            debugBoostTarget={debugBoostTarget}
            onOpenRoleModal={openRoleModal}
            onAnyTileClick={handleTileClick}
          />
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
