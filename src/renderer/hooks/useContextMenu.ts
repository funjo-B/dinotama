import { useCallback } from 'react';

interface MenuItem {
  label: string;
  action: () => void;
}

export function useContextMenu() {
  const showMenu = useCallback(async (e: React.MouseEvent, items: MenuItem[]) => {
    e.preventDefault();

    if (!window.dinoAPI?.showContextMenu) return;

    const menuItems = items.map((item, i) => ({
      label: item.label,
      id: String(i),
    }));

    const selectedId = await window.dinoAPI.showContextMenu(menuItems);
    if (selectedId !== null) {
      const idx = parseInt(selectedId, 10);
      items[idx]?.action();
    }
  }, []);

  return { showMenu };
}
