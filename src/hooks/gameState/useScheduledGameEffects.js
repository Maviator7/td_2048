import { useCallback, useEffect, useRef, useState } from "react";

export function useScheduledGameEffects() {
  const timeoutIdsRef = useRef([]);
  const [atkCols, setAtkCols] = useState([]);
  const [dmgMap, setDmgMap] = useState({});
  const [hitEffects, setHitEffects] = useState([]);
  const [damageBursts, setDamageBursts] = useState([]);
  const [shotTraces, setShotTraces] = useState([]);
  const [chainTraces, setChainTraces] = useState([]);
  const [retaliationCols, setRetaliationCols] = useState([]);
  const [retaliationHits, setRetaliationHits] = useState([]);
  const [repairHighlights, setRepairHighlights] = useState([]);
  const [mergeHL, setMergeHL] = useState([]);

  const scheduleTimeout = useCallback((callback, delayMs) => {
    const timeoutId = window.setTimeout(() => {
      timeoutIdsRef.current = timeoutIdsRef.current.filter((currentId) => currentId !== timeoutId);
      callback();
    }, delayMs);

    timeoutIdsRef.current.push(timeoutId);
    return timeoutId;
  }, []);

  const clearScheduledTimeouts = useCallback(() => {
    timeoutIdsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    timeoutIdsRef.current = [];
  }, []);

  const clearCombatEffects = useCallback(() => {
    setAtkCols([]);
    setDmgMap({});
    setHitEffects([]);
    setDamageBursts([]);
    setShotTraces([]);
    setChainTraces([]);
  }, []);

  const clearRetaliationEffects = useCallback(() => {
    setRetaliationCols([]);
    setRetaliationHits([]);
  }, []);

  const clearRepairEffects = useCallback(() => {
    setRepairHighlights([]);
  }, []);

  useEffect(() => clearScheduledTimeouts, [clearScheduledTimeouts]);

  return {
    atkCols,
    dmgMap,
    hitEffects,
    damageBursts,
    shotTraces,
    chainTraces,
    retaliationCols,
    retaliationHits,
    repairHighlights,
    mergeHL,
    setAtkCols,
    setDmgMap,
    setHitEffects,
    setDamageBursts,
    setShotTraces,
    setChainTraces,
    setRetaliationCols,
    setRetaliationHits,
    setRepairHighlights,
    setMergeHL,
    scheduleTimeout,
    clearScheduledTimeouts,
    clearCombatEffects,
    clearRetaliationEffects,
    clearRepairEffects,
  };
}
