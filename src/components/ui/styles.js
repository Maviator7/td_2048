export const UI_FONT_FAMILY = "'Segoe UI',sans-serif";

export const centeredFullscreenLayout = {
  minHeight: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: "20px 12px",
  fontFamily: UI_FONT_FAMILY,
};

export function createPanelSurface({ maxWidth, padding = "20px 16px 16px", background = "rgba(13,17,23,0.92)", border = "1px solid #29303d", borderRadius = 16, boxShadow = "0 20px 50px rgba(0,0,0,0.45)", textAlign = "center" }) {
  return {
    width: "100%",
    maxWidth,
    background,
    border,
    borderRadius,
    padding,
    boxShadow,
    textAlign,
  };
}

export function createPrimaryButtonStyle({ background, color = "#f8fafc", fontSize = 15, padding = "12px 10px", border = "none", borderRadius = 12, fontWeight = 800, boxShadow = "0 12px 24px rgba(15, 23, 42, 0.22)", marginTop }) {
  return {
    width: "100%",
    marginTop,
    border,
    borderRadius,
    padding,
    background,
    color,
    fontSize,
    fontWeight,
    cursor: "pointer",
    boxShadow,
  };
}

export function createModalSurface({ maxWidth, maxHeight, padding = 14, background = "#111827", border = "1px solid #334155", borderRadius = 12, boxShadow = "0 14px 30px rgba(0, 0, 0, 0.4)", textAlign = "left" }) {
  return {
    width: "100%",
    maxWidth,
    maxHeight,
    overflowY: maxHeight ? "auto" : undefined,
    background,
    border,
    borderRadius,
    padding,
    boxShadow,
    textAlign,
  };
}

export function createSecondaryPanelButtonStyle({ subdued = false } = {}) {
  return {
    width: "100%",
    border: subdued ? "1px solid #334155" : "1px solid #475569",
    borderRadius: 10,
    padding: subdued ? "8px 10px" : "8px 10px",
    background: subdued ? "rgba(15,23,42,0.78)" : "#111827",
    color: subdued ? "#cbd5e1" : "#e2e8f0",
    fontSize: 12,
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: subdued ? "none" : "0 8px 18px rgba(2, 6, 23, 0.18)",
  };
}

export const defenseLineStyle = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  margin: "6px 0",
};

export const laneDividerLineStyle = {
  flex: 1,
  height: 2,
  background: "linear-gradient(90deg, rgba(231,76,60,0.08) 0%, rgba(231,76,60,0.72) 50%, rgba(231,76,60,0.08) 100%)",
};

export const laneDividerLabelStyle = {
  fontSize: 11,
  color: "#fca5a5",
  fontWeight: "bold",
  whiteSpace: "nowrap",
  letterSpacing: 0.8,
};

export const gameHeaderIntroStyle = {
  textAlign: "center",
  marginBottom: 10,
};

export const gameTitleStyle = {
  margin: 0,
  fontSize: 22,
  color: "#f1c40f",
  letterSpacing: 1,
  textShadow: "0 0 12px #f1c40f88",
};

export const gameSubtitleStyle = {
  fontSize: 12,
  color: "#94a3b8",
  marginTop: 2,
};

export const stackedSidebarStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

export const debugToggleWrapStyle = {
  marginBottom: 8,
};

export const gameScreenShellStyle = {
  minHeight: "100vh",
  background: "linear-gradient(135deg,#0f0e17 0%,#1a1a2e 100%)",
  display: "flex",
  justifyContent: "center",
  padding: "12px 8px",
  fontFamily: UI_FONT_FAMILY,
};

export function createGameScreenContentStyle(isDesktop) {
  return {
    width: "100%",
    maxWidth: isDesktop ? "100%" : 420,
  };
}

export function createGameScreenGridStyle(isDesktop) {
  return {
    display: "grid",
    gridTemplateColumns: isDesktop ? "minmax(0,1fr) minmax(280px,360px)" : "1fr",
    gap: 12,
    alignItems: "start",
  };
}

export const hudShellStyle = {
  display: "flex",
  justifyContent: "space-between",
  background: "linear-gradient(180deg, rgba(22,33,62,0.96) 0%, rgba(15,23,42,0.96) 100%)",
  borderRadius: 14,
  padding: "12px 18px",
  marginBottom: 12,
  border: "1px solid #334155",
  boxShadow: "0 14px 28px rgba(2, 6, 23, 0.22)",
};

export const hudCellStyle = {
  textAlign: "center",
  minWidth: 72,
};

export const hudLifeCellStyle = {
  ...hudCellStyle,
  position: "relative",
};

export const hudLabelStyle = {
  fontSize: 10,
  color: "#94a3b8",
  letterSpacing: 1,
};

export const hudLivesValueStyle = {
  fontSize: 16,
  color: "#f87171",
  fontWeight: 700,
};

export const hudWaveValueStyle = {
  fontSize: 30,
  fontWeight: "bold",
  color: "#fde047",
  lineHeight: 1.1,
  textShadow: "0 0 16px rgba(250, 204, 21, 0.22)",
};

export const hudScoreValueStyle = {
  fontSize: 17,
  color: "#4ade80",
  fontWeight: 700,
};

export const movesIndicatorShellStyle = {
  display: "flex",
  justifyContent: "center",
  gap: 6,
  marginBottom: 8,
  alignItems: "center",
};

export const movesIndicatorLabelStyle = {
  fontSize: 11,
  color: "#888",
};

export function createMovePipStyle(isActive) {
  return {
    width: 22,
    height: 22,
    borderRadius: 6,
    background: isActive ? "#f1c40f" : "#1e2a3a",
    border: `2px solid ${isActive ? "#f1c40f" : "#2a3a4a"}`,
    transition: "all 0.2s",
    boxShadow: isActive ? "0 0 8px #f1c40f88" : "none",
  };
}

export const resolvingTextStyle = {
  fontSize: 11,
  color: "#e74c3c",
  marginLeft: 4,
};

export function createInfoPanelStyle({ maxHeight } = {}) {
  return {
    background: "linear-gradient(180deg, rgba(13,17,23,0.94) 0%, rgba(10,14,20,0.98) 100%)",
    border: "1px solid #1f2937",
    borderRadius: 12,
    padding: "10px 12px",
    maxHeight,
    overflowY: maxHeight ? "auto" : undefined,
  };
}

export function createLogEntryStyle({ isLatest, isDesktop }) {
  return {
    fontSize: isLatest ? (isDesktop ? 12 : 11) : (isDesktop ? 11 : 10),
    color: isLatest ? "#e5e7eb" : "#64748b",
    fontWeight: isLatest ? 600 : 400,
    marginBottom: isLatest ? 4 : 3,
    lineHeight: 1.4,
    opacity: isLatest ? 1 : 0.82,
  };
}

export function createGuideGridStyle(isDesktop) {
  return {
    display: "grid",
    gridTemplateColumns: isDesktop ? "1fr" : "1fr 1fr",
    gap: 4,
  };
}

export const guideCardStyle = {
  background: "linear-gradient(180deg, rgba(13,17,23,0.94) 0%, rgba(10,14,20,0.98) 100%)",
  border: "1px solid #1f2937",
  borderRadius: 10,
  padding: "8px 10px",
};

export const guideCardTitleStyle = {
  fontSize: 11,
  color: "#cbd5e1",
  fontWeight: "bold",
  letterSpacing: 0.2,
};

export const guideCardDescriptionStyle = {
  fontSize: 10,
  color: "#94a3b8",
  marginTop: 4,
  lineHeight: 1.45,
};

export const guideHintStyle = {
  textAlign: "center",
  color: "#64748b",
  fontSize: 10,
  marginTop: 6,
};

export function createTileSurfaceStyle({
  background,
  color,
  isMerged,
  isDamaged,
  retaliationDamage,
  effectiveValue,
  isInteractive,
  tileHeight,
}) {
  return {
    background: isMerged
      ? "linear-gradient(180deg, #fff7c2 0%, #facc15 100%)"
      : background,
    color,
    borderRadius: 10,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    height: tileHeight,
    fontWeight: "bold",
    boxShadow: valueOrFallbackBoxShadow(background, isInteractive, isMerged),
    border: retaliationDamage
      ? "2px solid rgba(248, 113, 113, 0.9)"
      : isMerged
        ? "2px solid #fde047"
        : isDamaged
          ? "2px solid rgba(248, 113, 113, 0.45)"
          : isInteractive
            ? "2px solid rgba(255,255,255,0.16)"
            : "2px solid transparent",
    transition: "transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease, opacity 0.15s ease",
    transform: isMerged ? "scale(1.08)" : isInteractive ? "translateY(0)" : "scale(1)",
    opacity: effectiveValue === 0 ? 0.56 : 1,
    animationDelay: retaliationDamage ? "40ms" : undefined,
    cursor: isInteractive ? "pointer" : "default",
    overflow: "hidden",
  };
}

function valueOrFallbackBoxShadow(background, isInteractive, isMerged) {
  if (isMerged) {
    return "0 10px 20px rgba(250, 204, 21, 0.22)";
  }
  if (isInteractive) {
    return `0 10px 18px ${background}55, inset 0 1px 0 rgba(255,255,255,0.28)`;
  }
  return `0 6px 12px ${background}44, inset 0 1px 0 rgba(255,255,255,0.18)`;
}

export const selectableTileHintStyle = {
  position: "absolute",
  inset: 0,
  borderRadius: 10,
  boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.14)",
  pointerEvents: "none",
};

export const roleSelectionGridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 8,
};

export function createRoleOptionButtonStyle(selected) {
  return createPrimaryButtonStyle({
    border: selected ? "1px solid #fbbf24" : "1px solid #475569",
    background: selected
      ? "linear-gradient(180deg, #1f2937 0%, #111827 100%)"
      : "linear-gradient(180deg, #0f172a 0%, #111827 100%)",
    color: "#e5e7eb",
    borderRadius: 12,
    padding: "12px 10px",
    fontSize: 13,
    fontWeight: 700,
    boxShadow: selected
      ? "0 12px 24px rgba(250, 204, 21, 0.12)"
      : "0 10px 20px rgba(2, 6, 23, 0.18)",
  });
}

export const roleDescriptionPanelStyle = {
  marginTop: 12,
  padding: "12px 12px 10px",
  borderRadius: 12,
  background: "linear-gradient(180deg, rgba(15,23,42,0.92) 0%, rgba(17,24,39,0.98) 100%)",
  border: "1px solid #334155",
};

export const roleDescriptionTitleStyle = {
  fontSize: 14,
  color: "#f8fafc",
  fontWeight: 700,
  marginBottom: 6,
};

export const roleDescriptionTextStyle = {
  fontSize: 13,
  color: "#94a3b8",
  lineHeight: 1.55,
  minHeight: 40,
};

export const roleModalActionsStyle = {
  display: "flex",
  gap: 8,
  marginTop: 12,
};

export function createRoleActionButtonStyle({ emphasis = false } = {}) {
  return {
    flex: 1,
    border: emphasis ? "1px solid #16a34a" : "1px solid #475569",
    borderRadius: 12,
    padding: "11px 10px",
    background: emphasis
      ? "linear-gradient(90deg, #15803d 0%, #16a34a 50%, #15803d 100%)"
      : "linear-gradient(180deg, #0f172a 0%, #111827 100%)",
    color: emphasis ? "#f0fdf4" : "#e5e7eb",
    fontSize: 13,
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: emphasis
      ? "0 12px 24px rgba(22, 163, 74, 0.18)"
      : "0 8px 18px rgba(2, 6, 23, 0.16)",
  };
}
