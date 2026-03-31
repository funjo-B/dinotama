import { useCallback, useState } from 'react';

interface MenuItem {
  label: string;
  action: () => void;
}

export function useContextMenu() {
  const [menu, setMenu] = useState<{ x: number; y: number; items: MenuItem[] } | null>(null);

  const showMenu = useCallback((e: React.MouseEvent, items: MenuItem[]) => {
    e.preventDefault();
    setMenu({ x: e.clientX, y: e.clientY, items });
  }, []);

  const hideMenu = useCallback(() => setMenu(null), []);

  return { menu, showMenu, hideMenu };
}
