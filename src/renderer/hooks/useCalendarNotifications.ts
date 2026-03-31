import { useEffect, useState, useCallback } from 'react';
import type { CalendarEvent } from '../components/NotificationPopup';
import { useDinoStore } from '../stores/dinoStore';
import { getTriggerEmotion } from '../stores/emotionEngine';

export function useCalendarNotifications() {
  const [currentEvent, setCurrentEvent] = useState<CalendarEvent | null>(null);
  const { activeDino, updateEmotion } = useDinoStore();

  useEffect(() => {
    if (!window.dinoAPI?.onCalendarNotify) return undefined;

    const unsubscribe = window.dinoAPI.onCalendarNotify((data) => {
      setCurrentEvent(data as CalendarEvent);
      // Expand window to show notification
      window.dinoAPI.resize(320, 280);
    });

    return () => { unsubscribe(); };
  }, []);

  const handleOk = useCallback(() => {
    setCurrentEvent(null);
    window.dinoAPI.resetSize();

    // Trigger happy emotion
    if (activeDino) {
      const trigger = getTriggerEmotion('calendar_ok');
      updateEmotion(activeDino.id, trigger.emotion);
      setTimeout(() => {
        const state = useDinoStore.getState();
        if (state.activeDino) {
          state.updateEmotion(state.activeDino.id, 'idle');
        }
      }, trigger.durationMs);
    }
  }, [activeDino, updateEmotion]);

  const handleSnooze = useCallback(() => {
    setCurrentEvent(null);
    window.dinoAPI.resetSize();

    // Trigger sad emotion briefly
    if (activeDino) {
      const trigger = getTriggerEmotion('calendar_snooze');
      updateEmotion(activeDino.id, trigger.emotion);
      setTimeout(() => {
        const state = useDinoStore.getState();
        if (state.activeDino) {
          state.updateEmotion(state.activeDino.id, 'idle');
        }
      }, trigger.durationMs);
    }
  }, [activeDino, updateEmotion]);

  return { currentEvent, handleOk, handleSnooze };
}
