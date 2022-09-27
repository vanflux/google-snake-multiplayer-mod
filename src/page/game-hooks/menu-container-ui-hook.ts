import { createRoot } from 'react-dom/client';
import { ReactNode } from "react";
import { addCleanupFn } from "../utils/cleanup";
import EventEmitter from 'events';

class MenuContainerUIHook extends EventEmitter {
  private tryFindMenuContainerElement() {
    return [...document.querySelectorAll('img')].find(x => x.src?.includes('fonts.gstatic.com') && x.src?.includes('gm_arrow_back_white'))?.parentElement?.parentElement?.parentElement;
  }
  
  private renderMenus(menuContainer: HTMLElement, menus: ReactNode[]) {
    return menus.reduce((lastCleanup, menu) => {
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.top = '50%';
      container.style.transform = 'translateY(-50%)';
      container.style.zIndex = '10000';
      menuContainer.parentElement?.insertBefore(container, menuContainer);
      const root = createRoot(container);
      root.render(menu);
      return () => (root.unmount(), container.remove(), lastCleanup());
    }, ()=>{});
  }

  setup(menus: ReactNode[]) {
    const id = setInterval(() => {
      const menuContainer = this.tryFindMenuContainerElement();
      if (!menuContainer) return;
      console.log('[GSM] Menu container found!');
      clearInterval(id);
  
      console.log('[GSM] Rendering menu container menus...');
      addCleanupFn(this.renderMenus(menuContainer, menus));
      
    }, 1000);
  }
}

export const menuContainerUIHook = new MenuContainerUIHook();
