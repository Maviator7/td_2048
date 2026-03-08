import { useEffect, useRef, useState } from "react";

import { GAME_PHASES, canSelectRoleByTileValue } from "../game/config";
import { GameBoardSection } from "./GameBoardSection";
import { EnemyCodexModal } from "./EnemyCodexModal";
import { GameHeader } from "./GameHeader";
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

export function GameScreen({ game, onSaveMetaUpdated }) {
  const [viewportWidth, setViewportWidth] = useState(() => window.innerWidth);
  const [roleModal, setRoleModal] = useState(null);
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [isEnemyCodexOpen, setIsEnemyCodexOpen] = useState(false);
  const [saveStatusMessage, setSaveStatusMessage] = useState("");
  const [saveMeta, setSaveMeta] = useState(() => game.getSaveMeta());
  const [discoveredEnemyTypes, setDiscoveredEnemyTypes] = useState(loadDiscoveredEnemyTypes);
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

  useEffect(() => {
    if (!enemies?.length) {
      return;
    }

    setDiscoveredEnemyTypes((current) => {
      const nextSet = new Set(current);
      enemies.forEach((enemy) => {
        if (enemy?.type) {
          nextSet.add(enemy.type);
        }
      });
      const next = Array.from(nextSet);
      if (next.length === current.length) {
        return current;
      }

      try {
        window.localStorage.setItem(ENEMY_CODEX_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignore storage failures and keep runtime state.
      }

      return next;
    });
  }, [enemies]);

  const isDesktop = viewportWidth >= 768;
  const isWideDesktop = viewportWidth >= 1200;
  const tileHeight = isWideDesktop ? 62 : isDesktop ? 56 : 54;
  const laneHeight = isWideDesktop ? 160 : isDesktop ? 140 : 130;
  const canEditRoles = phase === GAME_PHASES.PLAYER;

  const openRoleModal = (tile) => {
    if (!canEditRoles) {
      return;
    }
    if (!canSelectRoleByTileValue(tile.value) || tile.role) {
      return;
    }

    setRoleModal(tile);
  };

  const closeRoleModal = () => {
    setRoleModal(null);
  };

  const refreshSaveMeta = () => {
    const nextMeta = game.getSaveMeta();
    setSaveMeta(nextMeta);
    onSaveMetaUpdated?.();
    return nextMeta;
  };

  const openMenuModal = () => {
    refreshSaveMeta();
    setSaveStatusMessage("");
    setIsMenuModalOpen(true);
  };

  const closeMenuModal = () => {
    setIsMenuModalOpen(false);
  };

  const handleSaveGame = () => {
    const result = game.saveGame();
    if (!result.ok) {
      setSaveStatusMessage("セーブに失敗しました。");
      return;
    }

    refreshSaveMeta();
    setSaveStatusMessage(`保存しました（Wave ${result.summary.wave} / Score ${result.summary.score.toLocaleString()}）`);
  };

  const handleLoadGame = () => {
    const result = game.loadGame();
    if (!result.ok) {
      setSaveStatusMessage("ロードに失敗しました（データ破損または改ざんを検知）。");
      refreshSaveMeta();
      return;
    }

    refreshSaveMeta();
    setSaveStatusMessage(`ロードしました（Wave ${result.summary.wave} / Score ${result.summary.score.toLocaleString()}）`);
  };

  const selectRole = (nextRole) => {
    if (!roleModal) {
      return;
    }

    setTileRoleAt(roleModal.row, roleModal.col, nextRole);
    closeRoleModal();
  };

  const handleTileClick = (tile) => {
    setDebugBoostTarget({ row: tile.row, col: tile.col });
  };

  return (
    <div className={isLifeLossActive ? "screen-life-loss-shake" : undefined} style={gameScreenShellStyle}>
      {isLifeLossActive && (
        <>
          <div className="life-loss-overlay" key={`life-overlay-${lifeLossFxKey}`} />
          <div className="life-loss-banner" key={`life-banner-${lifeLossFxKey}`}>⚠️ -{lifeLossAmount} LIFE</div>
        </>
      )}
      <div style={createGameScreenContentStyle(isDesktop)}>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
          <button
            type="button"
            onClick={openMenuModal}
            style={{
              border: "1px solid #334155",
              borderRadius: 10,
              padding: "8px 12px",
              background: "rgba(15,23,42,0.92)",
              color: "#e2e8f0",
              fontWeight: 800,
              fontSize: 13,
              cursor: "pointer",
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
        key={roleModal ? `${roleModal.row}-${roleModal.col}-${roleModal.value}` : "role-modal"}
        roleModal={roleModal}
        onClose={closeRoleModal}
        onSelectRole={selectRole}
      />
      <GameMenuModal
        isOpen={isMenuModalOpen}
        onClose={closeMenuModal}
        onSave={handleSaveGame}
        onLoad={handleLoadGame}
        onOpenEnemyCodex={() => {
          setIsMenuModalOpen(false);
          setIsEnemyCodexOpen(true);
        }}
        saveMeta={saveMeta}
        statusMessage={saveStatusMessage}
      />
      <EnemyCodexModal
        isOpen={isEnemyCodexOpen}
        discoveredEnemyTypes={discoveredEnemyTypes}
        onClose={() => setIsEnemyCodexOpen(false)}
      />
    </div>
  );
}
