export const AUDIO_STORAGE_KEYS = {
  bgmMuted: "mf2048_bgm_muted_v1",
  masterVolume: "mf2048_master_volume_v1",
  bgmVolume: "mf2048_bgm_volume_v1",
  seVolume: "mf2048_se_volume_v1",
};

export const DEFAULT_AUDIO_VOLUMES = {
  master: 0.5,
  bgm: 0.5,
  se: 0.5,
};

export function clampVolume(value) {
  if (Number.isNaN(value)) {
    return 0;
  }

  return Math.min(1, Math.max(0, value));
}

export function loadStoredVolume(key, fallback) {
  if (typeof window === "undefined") {
    return fallback;
  }

  return clampVolume(Number(window.localStorage.getItem(key) ?? fallback));
}

export function getMasterVolume() {
  return loadStoredVolume(AUDIO_STORAGE_KEYS.masterVolume, DEFAULT_AUDIO_VOLUMES.master);
}

export function getSeVolume() {
  return loadStoredVolume(AUDIO_STORAGE_KEYS.seVolume, DEFAULT_AUDIO_VOLUMES.se);
}
