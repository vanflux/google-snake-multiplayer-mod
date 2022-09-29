import { createRoot } from 'react-dom/client';
import { createElement, ReactNode } from "react";
import { addCleanupFn } from "../utils/cleanup";
import EventEmitter from 'events';

class MenuContainerUIHook extends EventEmitter {
  private gameMenuContainer?: HTMLElement;
  private modMenuContainer?: HTMLElement;

  public setMenu(id: number) {
    if (this.gameMenuContainer) this.gameMenuContainer.style.display = id === -1 ? '' : 'none';
    if (this.modMenuContainer) {
      this.modMenuContainer.childNodes.forEach(child => (child as HTMLDivElement).style.display = 'none');
      const menuItem = (this.modMenuContainer.childNodes.item(id) as HTMLDivElement);
      if (menuItem) menuItem.style.display = '';
    }
  }

  private tryFindMenuContainerElement() {
    return [...document.querySelectorAll('img')].find(x => x.src?.includes('fonts.gstatic.com') && x.src?.includes('gm_arrow_back_white'))?.parentElement?.parentElement?.parentElement;
  }

  private tryFindButtonsContainerElement() {
    return [...document.querySelectorAll('img')].find(x => x.src?.includes('fonts.gstatic.com') && x.src?.includes('gm_play_arrow_white'))?.parentElement;
  }
  
  private renderMenus(menuContainer: HTMLElement, menus: ReactNode[]) {
    const container = this.modMenuContainer = document.createElement('div');
    container.style.position = 'absolute';
    container.style.zIndex = '10000';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.alignItems = 'center';
    container.style.justifyContent = 'center';
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.pointerEvents = 'none';
    menuContainer.parentElement?.insertBefore(container, menuContainer);
    const root = createRoot(container);
    root.render(menus.map((menu, i) => createElement('div', { key: i, style: { pointerEvents: 'all', display: 'none' } }, menu)));
    return () => (root.unmount(), container.remove(), menuContainer.style.display = '');
  }

  private renderModButton(buttonsContainer: HTMLElement, modButton: ReactNode) {
    const container = document.createElement('div');
    container.style.margin = '12px 12px 0 0';
    buttonsContainer.parentElement?.insertBefore(container, buttonsContainer);
    const root = createRoot(container);
    root.render(modButton);
    return () => (root.unmount(), container.remove());
  }

  setup(menus: ReactNode[], modButton: ReactNode) {
    const id = setInterval(() => {
      const menuContainer = this.tryFindMenuContainerElement();
      if (!menuContainer) return;
      const buttonsContainer = this.tryFindButtonsContainerElement();
      if (!buttonsContainer) return;

      this.gameMenuContainer = menuContainer;
      console.log('[GSM] Menu+Buttons container found!');
      clearInterval(id);
  
      console.log('[GSM] Rendering menu container menus...');
      addCleanupFn(this.renderMenus(menuContainer, menus));

      console.log('[GSM] Rendering mod button...');
      addCleanupFn(this.renderModButton(buttonsContainer, modButton));
    }, 1000);
  }
}

export const menuContainerUIHook = new MenuContainerUIHook();
