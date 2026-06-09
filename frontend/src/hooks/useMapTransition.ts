import { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export type TransitionState = 'idle' | 'zooming' | 'done';

export function useMapTransition() {
  const [state, setState] = useState<TransitionState>('idle');
  const navigate = useNavigate();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const trigger = useCallback(() => {
    if (state !== 'idle') return;
    setState('zooming');

    timerRef.current = setTimeout(() => {
      setState('done');
      navigate('/mapa');
    }, 1400);
  }, [state, navigate]);

  return { state, trigger };
}
