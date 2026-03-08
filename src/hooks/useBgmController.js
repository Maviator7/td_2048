import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const STORAGE_KEYS = {
  muted: "mf2048_bgm_muted_v1",
  volume: "mf2048_bgm_volume_v1",
};

const TRACK_DEFS = {
  title: { src: "/audio/bgm-title.mp3", gain: 0.78 },
  battle: { src: "/audio/bgm-battle.mp3", gain: 0.72 },
  boss: { src: "/audio/bgm-boss.mp3", gain: 0.82 },
};

const FADE_DURATION_MS = 420;

function loadInitialMuted() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(STORAGE_KEYS.muted) === "true";
}

function loadInitialVolume() {
  if (typeof window === "undefined") {
    return 0.6;
  }

  const raw = Number(window.localStorage.getItem(STORAGE_KEYS.volume));
  if (Number.isNaN(raw)) {
    return 0.6;
  }

  return Math.min(1, Math.max(0, raw));
}

export function useBgmController({ mode }) {
  const [bgmMuted, setBgmMuted] = useState(loadInitialMuted);
  const [bgmVolume, setBgmVolume] = useState(loadInitialVolume);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const tracksRef = useRef({});
  const activeTrackRef = useRef(null);
  const fadeTimerRef = useRef(null);

  useEffect(() => {
    const entries = Object.entries(TRACK_DEFS).map(([key, def]) => {
      const audio = new Audio(def.src);
      audio.loop = true;
      audio.preload = "auto";
      audio.volume = 0;
      return [key, audio];
    });
    tracksRef.current = Object.fromEntries(entries);

    return () => {
      if (fadeTimerRef.current) {
        window.clearInterval(fadeTimerRef.current);
      }

      Object.values(tracksRef.current).forEach((audio) => {
        audio.pause();
        audio.currentTime = 0;
      });
      tracksRef.current = {};
      activeTrackRef.current = null;
    };
  }, []);

  const getTargetVolume = useCallback((trackKey) => {
    if (bgmMuted) {
      return 0;
    }
    const gain = TRACK_DEFS[trackKey]?.gain ?? 1;
    return Math.min(1, Math.max(0, bgmVolume * gain));
  }, [bgmMuted, bgmVolume]);

  const stopFadeTimer = useCallback(() => {
    if (!fadeTimerRef.current) {
      return;
    }
    window.clearInterval(fadeTimerRef.current);
    fadeTimerRef.current = null;
  }, []);

  const transitionTrack = useCallback((nextTrackKey) => {
    const audios = tracksRef.current;
    const nextAudio = nextTrackKey ? audios[nextTrackKey] : null;
    const currentKey = activeTrackRef.current;
    const currentAudio = currentKey ? audios[currentKey] : null;

    if (nextTrackKey === currentKey) {
      if (nextAudio) {
        nextAudio.volume = getTargetVolume(nextTrackKey);
      }
      return;
    }

    stopFadeTimer();

    if (!nextAudio && currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      activeTrackRef.current = null;
      return;
    }

    if (!nextAudio) {
      return;
    }

    nextAudio.volume = 0;
    nextAudio.play().catch(() => {});

    if (!currentAudio) {
      nextAudio.volume = getTargetVolume(nextTrackKey);
      activeTrackRef.current = nextTrackKey;
      return;
    }

    const startAt = Date.now();
    const fromVolume = currentAudio.volume;
    const toVolume = getTargetVolume(nextTrackKey);

    fadeTimerRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startAt;
      const progress = Math.min(1, elapsed / FADE_DURATION_MS);

      currentAudio.volume = fromVolume * (1 - progress);
      nextAudio.volume = toVolume * progress;

      if (progress >= 1) {
        stopFadeTimer();
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio.volume = 0;
        activeTrackRef.current = nextTrackKey;
      }
    }, 20);
  }, [getTargetVolume, stopFadeTimer]);

  const unlockAudio = useCallback(() => {
    setIsUnlocked(true);
  }, []);

  useEffect(() => {
    if (isUnlocked) {
      return undefined;
    }

    const handleUserAction = () => setIsUnlocked(true);
    window.addEventListener("pointerdown", handleUserAction, { once: true });
    window.addEventListener("keydown", handleUserAction, { once: true });

    return () => {
      window.removeEventListener("pointerdown", handleUserAction);
      window.removeEventListener("keydown", handleUserAction);
    };
  }, [isUnlocked]);

  useEffect(() => {
    if (!isUnlocked) {
      return;
    }

    transitionTrack(mode);
  }, [isUnlocked, mode, transitionTrack]);

  useEffect(() => {
    if (!isUnlocked) {
      return;
    }

    const active = activeTrackRef.current;
    if (!active) {
      return;
    }

    const audio = tracksRef.current[active];
    if (!audio) {
      return;
    }

    audio.volume = getTargetVolume(active);
  }, [bgmMuted, bgmVolume, getTargetVolume, isUnlocked]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.muted, String(bgmMuted));
  }, [bgmMuted]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.volume, String(bgmVolume));
  }, [bgmVolume]);

  return useMemo(() => ({
    bgmMuted,
    setBgmMuted,
    bgmVolume,
    setBgmVolume,
    unlockAudio,
  }), [bgmMuted, bgmVolume, unlockAudio]);
}
