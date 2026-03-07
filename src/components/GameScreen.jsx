import { useEffect, useRef, useState } from "react";

import { GAME_PHASES, canSelectRoleByTileValue } from "../game/config";
import { GameBoardSection } from "./GameBoardSection";
import { GameHeader } from "./GameHeader";
import { GameSidebar } from "./GameSidebar";
import { RoleSelectModal } from "./RoleSelectModal";

export function GameScreen({ game }) {
  const [viewportWidth, setViewportWidth] = useState(() => window.innerWidth);
  const [roleModal, setRoleModal] = useState(null);
  const [isBalanceModeEnabled, setIsBalanceModeEnabled] = useState(false);
  const isDebugMode = import.meta.env.VITE_ENABLE_DEBUG_PANEL === "true";
  const [isDebugPanelOpen, setIsDebugPanelOpen] = useState(() => isDebugMode);
  const [debugBoostTarget, setDebugBoostTarget] = useState({ row: 0, col: 0 });
  const [isLifeLossActive, setIsLifeLossActive] = useState(false);
  const [lifeLossAmount, setLifeLossAmount] = useState(0);
  const [lifeLossFxKey, setLifeLossFxKey] = useState(0);
  const prevLivesRef = useRef(game.lives);

  const {
    lives,
    wave,
    score,
    phase,
    movesPerTurn,
    movesLeft,
    log,
    roleMetrics,
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
    <div className={isLifeLossActive ? "screen-life-loss-shake" : undefined} style={{ minHeight: "100vh", background: "linear-gradient(135deg,#0f0e17 0%,#1a1a2e 100%)", display: "flex", justifyContent: "center", padding: "12px 8px", fontFamily: "'Segoe UI',sans-serif" }}>
      {isLifeLossActive && (
        <>
          <div className="life-loss-overlay" key={`life-overlay-${lifeLossFxKey}`} />
          <div className="life-loss-banner" key={`life-banner-${lifeLossFxKey}`}>⚠️ -{lifeLossAmount} LIFE</div>
        </>
      )}
      <div style={{ width: "100%", maxWidth: isDesktop ? "100%" : 420 }}>
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

        <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "minmax(0,1fr) minmax(280px,360px)" : "1fr", gap: 12, alignItems: "start" }}>
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
          <GameSidebar
            isDesktop={isDesktop}
            isBalanceModeEnabled={isBalanceModeEnabled}
            onToggleBalanceMode={() => setIsBalanceModeEnabled((current) => !current)}
            roleMetrics={roleMetrics}
            log={log}
          />
        </div>
      </div>

      <RoleSelectModal roleModal={roleModal} onClose={closeRoleModal} onSelectRole={selectRole} />
    </div>
  );
}
