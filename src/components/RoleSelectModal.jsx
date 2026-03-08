import { useEffect, useId, useRef, useState } from "react";

import { ROLE_RULES, TILE_ROLE_DEFS, TILE_ROLE_ORDER } from "../game/config";
import { useModalTransition } from "../hooks/useModalTransition";
import {
  createModalSurface,
  createRoleActionButtonStyle,
  createRoleOptionButtonStyle,
  roleDescriptionPanelStyle,
  roleDescriptionTextStyle,
  roleDescriptionTitleStyle,
  roleModalActionsStyle,
  roleSelectionGridStyle,
} from "./ui/styles";

export function RoleSelectModal({ isOpen, roleModal, onClose, onSelectRole, onExited }) {
  const dialogRef = useRef(null);
  const titleId = useId();
  const descriptionId = useId();
  const [selectedRole, setSelectedRole] = useState(TILE_ROLE_ORDER[0] ?? null);
  const { isRendered, phase } = useModalTransition(isOpen);

  useEffect(() => {
    if (!isOpen) {
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
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen && !isRendered) {
      onExited?.();
    }
  }, [isOpen, isRendered, onExited]);

  if (!isRendered || !roleModal) {
    return null;
  }

  const selectedRoleDef = selectedRole ? TILE_ROLE_DEFS[selectedRole] : null;

  return (
    <div
      className={`modal-backdrop modal-backdrop-${phase} role-modal-backdrop`}
      onClick={onClose}
      style={{
        "--role-origin-x": `${roleModal.originXPercent ?? 50}%`,
        "--role-origin-y": `${roleModal.originYPercent ?? 50}%`,
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 16,
      }}
    >
      <div
        className={`modal-surface modal-surface-${phase} role-modal-surface`}
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onClick={(event) => event.stopPropagation()}
        style={{
          ...createModalSurface({ maxWidth: 360 }),
          transformOrigin: `${roleModal.originXPercent ?? 50}% ${roleModal.originYPercent ?? 50}%`,
        }}
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
            const selected = selectedRole === roleKey;

            return (
              <button
                key={roleKey}
                type="button"
                onClick={() => setSelectedRole(roleKey)}
                aria-pressed={selected}
                style={createRoleOptionButtonStyle(selected)}
              >
                {roleDef.icon} {roleDef.label}
              </button>
            );
          })}
        </div>
        <div style={roleDescriptionPanelStyle}>
          <div style={roleDescriptionTitleStyle}>
            {selectedRoleDef ? `${selectedRoleDef.icon} ${selectedRoleDef.label}` : "役職効果"}
          </div>
          <div style={roleDescriptionTextStyle}>
            {selectedRoleDef
              ? selectedRoleDef.description
              : "上のボタンから役職を選ぶと、ここに効果の説明が表示されます。"}
          </div>
        </div>
        <div style={roleModalActionsStyle}>
          <button
            type="button"
            onClick={onClose}
            style={createRoleActionButtonStyle()}
          >
            閉じる
          </button>
          <button
            type="button"
            onClick={() => {
              if (!selectedRole) {
                return;
              }
              onSelectRole(selectedRole);
            }}
            disabled={!selectedRole}
            style={{
              ...createRoleActionButtonStyle({ emphasis: true }),
              opacity: selectedRole ? 1 : 0.55,
              cursor: selectedRole ? "pointer" : "not-allowed",
            }}
          >
            役職を確定
          </button>
        </div>
      </div>
    </div>
  );
}
