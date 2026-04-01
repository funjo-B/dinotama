import { useCallback } from 'react';

export interface MenuItem {
  label: string;
  action?: () => void;
  type?: 'separator';
  submenu?: MenuItem[];
}

interface NativeMenuItem {
  label: string;
  id: string;
  type?: 'normal' | 'separator';
  submenu?: NativeMenuItem[];
}

export function useContextMenu() {
  const showMenu = useCallback(async (e: React.MouseEvent, items: MenuItem[]) => {
    e.preventDefault();

    if (!window.dinoAPI?.showContextMenu) return;

    const actionMap: Record<string, () => void> = {};
    let idCounter = 0;

    function buildNativeItems(menuItems: MenuItem[]): NativeMenuItem[] {
      return menuItems.map((item) => {
        if (item.type === 'separator') {
          return { label: '', id: '', type: 'separator' as const };
        }
        const id = String(idCounter++);
        if (item.action) {
          actionMap[id] = item.action;
        }
        const native: NativeMenuItem = { label: item.label, id };
        if (item.submenu) {
          native.submenu = buildNativeItems(item.submenu);
        }
        return native;
      });
    }

    const nativeItems = buildNativeItems(items);
    const selectedId = await window.dinoAPI.showContextMenu(nativeItems);
    if (selectedId !== null && actionMap[selectedId]) {
      actionMap[selectedId]();
    }
  }, []);

  return { showMenu };
}
