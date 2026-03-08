import { useEffect, useRef, useState } from "react";

const ENTER_FRAME_DELAY_MS = 16;

export function useModalTransition(isOpen, options = {}) {
  const { exitDurationMs = 180 } = options;
  const [isRendered, setIsRendered] = useState(isOpen);
  const [phase, setPhase] = useState(isOpen ? "entered" : "exited");
  const lifecycleTimerRef = useRef(null);
  const enterTimerRef = useRef(null);
  const exitTimerRef = useRef(null);

  useEffect(() => {
    window.clearTimeout(lifecycleTimerRef.current);
    window.clearTimeout(enterTimerRef.current);
    window.clearTimeout(exitTimerRef.current);

    if (isOpen) {
      lifecycleTimerRef.current = window.setTimeout(() => {
        setIsRendered(true);
        setPhase("entering");
        enterTimerRef.current = window.setTimeout(() => {
          setPhase("entered");
        }, ENTER_FRAME_DELAY_MS);
      }, 0);
      return () => {
        window.clearTimeout(lifecycleTimerRef.current);
        window.clearTimeout(enterTimerRef.current);
      };
    }

    if (!isRendered) {
      return undefined;
    }

    lifecycleTimerRef.current = window.setTimeout(() => {
      setPhase("exiting");
      exitTimerRef.current = window.setTimeout(() => {
        setIsRendered(false);
        setPhase("exited");
      }, exitDurationMs);
    }, 0);

    return () => {
      window.clearTimeout(lifecycleTimerRef.current);
      window.clearTimeout(exitTimerRef.current);
    };
  }, [isOpen, isRendered, exitDurationMs]);

  return {
    isRendered,
    phase,
  };
}
