import { useCallback, useRef } from 'react';

export function useDrag() {
  const isDragging = useRef(false);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return; // Left click only
    isDragging.current = true;
    window.dinoAPI.dragStart(e.screenX, e.screenY);

    const onMouseMove = (ev: MouseEvent) => {
      if (!isDragging.current) return;
      window.dinoAPI.dragMove(ev.screenX, ev.screenY);
    };

    const onMouseUp = () => {
      isDragging.current = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, []);

  return { onMouseDown };
}
