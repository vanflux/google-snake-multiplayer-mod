import { createRoot } from 'react-dom/client';
import { ReactNode } from "react";
import { addCleanupFn } from "../utils/cleanup";
import EventEmitter from 'events';

class HeaderUIHook extends EventEmitter {
  tryFindHeaderElement() {
    const allImgs = [...document.querySelectorAll('img')];
    const isTrophy = (elem: HTMLImageElement) => elem.src?.includes('snake_arcad') && elem.src?.includes('trophy');
    const isApple = (elem: HTMLImageElement) => elem.src?.includes('snake_arcad') && elem.src?.includes('apple');
    const header = allImgs.find(img => isTrophy(img) && [...img.parentElement?.parentElement?.querySelectorAll('img') || []].find(isApple))?.parentElement?.parentElement;
    return header;
  }
  
  renderExtraHeader(header: HTMLElement, extraHeader: ReactNode) {
    const container = document.createElement('div');
    container.style.position = 'relative';
    container.style.display = 'inline-block';
    container.style.top = '-20px';
    header.appendChild(container);
    const root = createRoot(container);
    root.render(extraHeader);
    return () => (root.unmount(), container.remove());
  }
  
  setup(extraHeader: ReactNode) {
    const id = setInterval(() => {
      const header = this.tryFindHeaderElement();
      if (!header) return;
      console.log('[GSM] Header found!');
      clearInterval(id);
  
      console.log('[GSM] Rendering extra header...');
      addCleanupFn(this.renderExtraHeader(header, extraHeader));
      
    }, 1000);
  }
}

export const headerUIHook = new HeaderUIHook();
