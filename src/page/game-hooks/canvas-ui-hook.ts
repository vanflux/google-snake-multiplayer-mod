import { createRoot } from 'react-dom/client';
import { ReactNode } from "react";
import { addCleanupFn } from "../utils/cleanup";
import EventEmitter from 'events';

class CanvasUIHook extends EventEmitter {
  private tryFindCanvasElement() {
    return [...document.querySelectorAll('canvas')].sort((a, b) => (b.width || 0) - (a.width || 0))?.[0];
  }
  
  private renderCanvasOverlay(canvas: HTMLElement, canvasOverlay: ReactNode) {
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '0px';
    container.style.right = '0px';
    container.style.bottom = '0px';
    container.style.top = '70px';
    canvas.parentElement?.insertBefore(container, canvas);
    const root = createRoot(container);
    root.render(canvasOverlay);
    return () => (root.unmount(), container.remove());
  }

  setup(canvasOverlay: ReactNode) {
    const id = setInterval(() => {
      const canvas = this.tryFindCanvasElement();
      if (!canvas) return;
      console.log('[GSM] Canvas found!');
      clearInterval(id);
  
      console.log('[GSM] Rendering canvas overlay...');
      addCleanupFn(this.renderCanvasOverlay(canvas, canvasOverlay));
      
    }, 1000);
  }
}

export const canvasUIHook = new CanvasUIHook();
