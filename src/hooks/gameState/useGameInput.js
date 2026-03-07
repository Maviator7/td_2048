import { useCallback, useEffect, useRef } from "react";

import { GAME_PHASES } from "../../game/config";
import { SWIPE_THRESHOLD } from "../../game/constants";

const KEYBOARD_MOVE_MAP = {
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowUp: "up",
  ArrowDown: "down",
};

export function useGameInput({ phase, onSlide }) {
  const touchStartRef = useRef(null);

  const handleTouchStart = useCallback((event) => {
    const touch = event.touches?.[0];
    if (!touch) {
      return;
    }

    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handleTouchEnd = useCallback((event) => {
    const start = touchStartRef.current;
    touchStartRef.current = null;

    if (!start || phase !== GAME_PHASES.PLAYER) {
      return;
    }

    const touch = event.changedTouches?.[0];
    if (!touch) {
      return;
    }

    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    if (Math.max(absX, absY) < SWIPE_THRESHOLD) {
      return;
    }

    if (absX > absY) {
      onSlide(dx > 0 ? "right" : "left");
      return;
    }

    onSlide(dy > 0 ? "down" : "up");
  }, [onSlide, phase]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      const direction = KEYBOARD_MOVE_MAP[event.key];
      if (!direction) {
        return;
      }

      event.preventDefault();
      onSlide(direction);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onSlide]);

  return {
    handleTouchStart,
    handleTouchEnd,
  };
}
