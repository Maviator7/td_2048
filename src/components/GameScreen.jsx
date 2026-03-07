import { useEffect, useRef, useState } from "react";

import { GAME_PHASES, canSelectRoleByTileValue } from "../game/config";
import { GameBoardSection } from "./GameBoardSection";
import { GameHeader } from "./GameHeader";
import { RoleSelectModal } from "./RoleSelectModal";
import {
  createGameScreenContentStyle,
  gameScreenShellStyle,
} from "./ui/styles";

export function GameScreen({ game }) {
  const [viewportWidth, setViewportWidth] = useState(() => window.innerWidth);
  const [roleModal, setRoleModal] = useState(null);
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
    <div className={isLifeLossActive ? "screen-life-loss-shake" : undefined} style={gameScreenShellStyle}>
      {isLifeLossActive && (
        <>
          <div className="life-loss-overlay" key={`life-overlay-${lifeLossFxKey}`} />
          <div className="life-loss-banner" key={`life-banner-${lifeLossFxKey}`}>⚠️ -{lifeLossAmount} LIFE</div>
        </>
      )}
      <div style={createGameScreenContentStyle(isDesktop)}>
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
    </div>
  );
}
