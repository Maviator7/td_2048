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

export function createSecondaryPanelButtonStyle() {
  return {
    width: "100%",
    border: "1px solid #475569",
    borderRadius: 10,
    padding: "8px 10px",
    background: "#111827",
    color: "#e2e8f0",
    fontSize: 12,
    fontWeight: 800,
    cursor: "pointer",
  };
}

export const defenseLineStyle = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  margin: "6px 0",
};
