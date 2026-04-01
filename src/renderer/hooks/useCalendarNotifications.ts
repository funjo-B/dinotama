import { useEffect, useState, useCallback } from 'react';
import type { CalendarEvent } from '../components/NotificationPopup';
import { useDinoStore } from '../stores/dinoStore';
import { getTriggerEmotion } from '../stores/emotionEngine';

export function useCalendarNotifications() {
  const [currentEvent, setCurrentEvent] = useState<CalendarEvent | null>(null);
  const activeDino = useDinoStore((s) => s.activeDino);

  useEffect(() => {
    if (!window.dinoAPI?.onCalendarNotify) return undefined;

    const unsubscribe = window.dinoAPI.onCalendarNotify((data) => {
      setCurrentEvent(data as CalendarEvent);
      window.dinoAPI.resize(320, 280);
    });

    return () => { unsubscribe(); };
  }, []);

  const handleOk = useCallback(() => {
    setCurrentEvent(null);
    window.dinoAPI.resetSize();

    if (activeDino) {
      const trigger = getTriggerEmotion('calendar_ok');
      useDinoStore.getState().setActiveEmotion(trigger.emotion);
      setTimeout(() => {
        useDinoStore.getState().setActiveEmotion('idle');
      }, trigger.durationMs);
    }
  }, [activeDino]);

  const handleSnooze = useCallback(() => {
    setCurrentEvent(null);
    window.dinoAPI.resetSize();

    if (activeDino) {
      const trigger = getTriggerEmotion('calendar_snooze');
      useDinoStore.getState().setActiveEmotion(trigger.emotion);
      setTimeout(() => {
        useDinoStore.getState().setActiveEmotion('idle');
      }, trigger.durationMs);
    }
  }, [activeDino]);

  return { currentEvent, handleOk, handleSnooze };
}
