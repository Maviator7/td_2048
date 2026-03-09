import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AUDIO_STORAGE_KEYS, clampVolume, DEFAULT_AUDIO_VOLUMES, loadStoredVolume } from "../audio/settings";

const TRACK_DEFS = {
  title: { src: "/audio/bgm-title.mp3", gain: 0.78 },
  battle: { src: "/audio/bgm-battle.mp3", gain: 0.72 },
  boss: { src: "/audio/bgm-boss.mp3", gain: 0.82 },
  gameover: { src: "/audio/bgm-gameover.mp3", gain: 0.78 },
};

const FADE_DURATION_MS = 420;

function loadInitialMuted() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(AUDIO_STORAGE_KEYS.bgmMuted) === "true";
}

export function useBgmController({ mode }) {
  const [bgmMuted, setBgmMuted] = useState(loadInitialMuted);
  const [masterVolume, setMasterVolume] = useState(() => loadStoredVolume(
    AUDIO_STORAGE_KEYS.masterVolume,
    DEFAULT_AUDIO_VOLUMES.master,
  ));
  const [bgmVolume, setBgmVolume] = useState(() => loadStoredVolume(
    AUDIO_STORAGE_KEYS.bgmVolume,
    DEFAULT_AUDIO_VOLUMES.bgm,
  ));
  const [seVolume, setSeVolume] = useState(() => loadStoredVolume(
    AUDIO_STORAGE_KEYS.seVolume,
    DEFAULT_AUDIO_VOLUMES.se,
  ));
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
    return clampVolume(masterVolume * bgmVolume * gain);
  }, [bgmMuted, bgmVolume, masterVolume]);

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

    if (nextTrackKey === "gameover") {
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio.volume = 0;
      }
      nextAudio.pause();
      nextAudio.currentTime = 0;
      nextAudio.volume = getTargetVolume(nextTrackKey);
      nextAudio.play().catch(() => {});
      activeTrackRef.current = nextTrackKey;
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
    const active = activeTrackRef.current;
    if (!active) {
      return;
    }

    const audio = tracksRef.current[active];
    if (!audio) {
      return;
    }

    audio.volume = getTargetVolume(active);
  }, [bgmMuted, bgmVolume, getTargetVolume, isUnlocked, masterVolume]);

  useEffect(() => {
    window.localStorage.setItem(AUDIO_STORAGE_KEYS.bgmMuted, String(bgmMuted));
  }, [bgmMuted]);

  useEffect(() => {
    window.localStorage.setItem(AUDIO_STORAGE_KEYS.masterVolume, String(clampVolume(masterVolume)));
  }, [masterVolume]);

  useEffect(() => {
    window.localStorage.setItem(AUDIO_STORAGE_KEYS.bgmVolume, String(clampVolume(bgmVolume)));
  }, [bgmVolume]);

  useEffect(() => {
    window.localStorage.setItem(AUDIO_STORAGE_KEYS.seVolume, String(clampVolume(seVolume)));
  }, [seVolume]);

  return useMemo(() => ({
    bgmMuted,
    setBgmMuted,
    masterVolume,
    setMasterVolume,
    bgmVolume,
    setBgmVolume,
    seVolume,
    setSeVolume,
    unlockAudio,
  }), [bgmMuted, bgmVolume, masterVolume, seVolume, unlockAudio]);
}
