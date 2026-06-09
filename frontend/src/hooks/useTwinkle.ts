import { useCallback, useEffect, useRef, useState } from 'react';

export type ProvinceState = 'idle' | 'pulsing' | 'hovered';

interface TwinkleState {
  [provinceId: string]: ProvinceState;
}

const MIN_ACTIVE = 2;
const MAX_ACTIVE = 5;
const SCHEDULE_INTERVAL = 350;
const PULSE_DURATION_MIN = 600;
const PULSE_DURATION_MAX = 1200;

export function useTwinkle(provinceIds: string[], enabled: boolean) {
  const [states, setStates] = useState<TwinkleState>(() =>
    Object.fromEntries(provinceIds.map(id => [id, 'idle' as ProvinceState]))
  );
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const schedulePulse = useCallback((id: string) => {
    const duration =
      PULSE_DURATION_MIN + Math.random() * (PULSE_DURATION_MAX - PULSE_DURATION_MIN);

    setStates(prev => {
      if (prev[id] !== 'idle') return prev;
      return { ...prev, [id]: 'pulsing' };
    });

    const timer = setTimeout(() => {
      setStates(prev => {
        if (prev[id] === 'hovered') return prev;
        return { ...prev, [id]: 'idle' };
      });
      timersRef.current.delete(id);
    }, duration);

    timersRef.current.set(id, timer);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const interval = setInterval(() => {
      setStates(prev => {
        const active = Object.values(prev).filter(s => s === 'pulsing').length;
        if (active >= MAX_ACTIVE) return prev;
        const needed = MIN_ACTIVE - active;
        if (needed <= 0 && Math.random() > 0.4) return prev;
        const idleIds = provinceIds.filter(id => prev[id] === 'idle');
        if (idleIds.length === 0) return prev;
        const pick = idleIds[Math.floor(Math.random() * idleIds.length)];
        schedulePulse(pick);
        return prev;
      });
    }, SCHEDULE_INTERVAL);
    return () => clearInterval(interval);
  }, [enabled, provinceIds, schedulePulse]);

  useEffect(() => {
    return () => { timersRef.current.forEach(t => clearTimeout(t)); };
  }, []);

  // Detiene solo los pulsos activos (NO cancela los timers de hover-end)
  const resetPulsing = useCallback(() => {
    const pulseKeys = [...timersRef.current.keys()].filter(k => !k.endsWith('_hover_end'));
    pulseKeys.forEach(k => {
      clearTimeout(timersRef.current.get(k)!);
      timersRef.current.delete(k);
    });
    setStates(prev => {
      const next = { ...prev };
      for (const id of Object.keys(next)) {
        if (next[id] === 'pulsing') next[id] = 'idle';
      }
      return next;
    });
  }, []);

  const onHoverStart = useCallback((id: string) => {
    const existing = timersRef.current.get(id);
    if (existing) { clearTimeout(existing); timersRef.current.delete(id); }
    setStates(prev => ({ ...prev, [id]: 'hovered' }));
  }, []);

  const onHoverEnd = useCallback((id: string) => {
    const timer = setTimeout(() => {
      setStates(prev => {
        if (prev[id] !== 'hovered') return prev;
        return { ...prev, [id]: 'idle' };
      });
      timersRef.current.delete(id + '_hover_end');
    }, 150);
    timersRef.current.set(id + '_hover_end', timer);
  }, []);

  const getState = useCallback(
    (id: string): ProvinceState => states[id] ?? 'idle',
    [states]
  );

  return { getState, onHoverStart, onHoverEnd, resetPulsing };
}
