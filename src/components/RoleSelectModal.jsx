import { useEffect, useId, useRef } from "react";

import { ROLE_RULES, TILE_ROLE_DEFS, TILE_ROLE_ORDER } from "../game/config";
import { createModalSurface, createRoleOptionButtonStyle, roleSelectionGridStyle } from "./ui/styles";

export function RoleSelectModal({ roleModal, onClose, onSelectRole }) {
  const dialogRef = useRef(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!roleModal) {
      return undefined;
    }

    const previousActiveElement = document.activeElement;
    const focusTarget = dialogRef.current?.querySelector('button');
    focusTarget?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) {
        return;
      }

      const focusableElements = dialogRef.current.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      const focusable = [...focusableElements].filter((element) => !element.hasAttribute("disabled"));
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const firstElement = focusable[0];
      const lastElement = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      previousActiveElement?.focus?.();
    };
  }, [onClose, roleModal]);

  if (!roleModal) {
    return null;
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 16,
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onClick={(event) => event.stopPropagation()}
        style={createModalSurface({ maxWidth: 360 })}
      >
        <div id={titleId} style={{ fontSize: 16, color: "#e5e7eb", fontWeight: "700", marginBottom: 4 }}>
          役職を選択
        </div>
        <div id={descriptionId} style={{ fontSize: 13, color: "#94a3b8", marginBottom: 10, lineHeight: 1.5 }}>
          タイル {roleModal.value}（Lv.{ROLE_RULES.minSelectableLevel}以上・未役職のみ）
        </div>
        <div style={roleSelectionGridStyle}>
          {TILE_ROLE_ORDER.map((roleKey) => {
            const roleDef = TILE_ROLE_DEFS[roleKey];
            const selected = roleModal.role === roleKey;

            return (
              <button
                key={roleKey}
                type="button"
                onClick={() => onSelectRole(roleKey)}
                aria-pressed={selected}
                style={createRoleOptionButtonStyle(selected)}
              >
                {roleDef.icon} {roleDef.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
