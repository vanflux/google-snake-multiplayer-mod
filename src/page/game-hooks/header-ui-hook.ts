import { createRoot } from 'react-dom/client';
import { ReactNode } from "react";
import { addCleanupFn } from "../utils/cleanup";

let onHeaderUIInitialize: ()=>any;

export const setOnHeaderUIInitialize = (handler: typeof onHeaderUIInitialize) => onHeaderUIInitialize = handler;

function tryFindHeaderElement() {
  const allImgs = [...document.querySelectorAll('img')];
  const isTrophy = (elem: HTMLImageElement) => elem.src?.includes('snake_arcad') && elem.src?.includes('trophy');
  const isApple = (elem: HTMLImageElement) => elem.src?.includes('snake_arcad') && elem.src?.includes('apple');
  const header = allImgs.find(img => isTrophy(img) && [...img.parentElement?.parentElement?.querySelectorAll('img') || []].find(isApple))?.parentElement?.parentElement;
  return header;
}

function renderExtraHeader(header: HTMLElement, extraHeader: ReactNode) {
  const container = document.createElement('div');
  container.style.position = 'relative';
  container.style.display = 'inline-block';
  header.appendChild(container);
  const root = createRoot(container);
  root.render(extraHeader);
  return () => (root.unmount(), container.remove());
}

export function setupHeaderUIHooks(extraHeader: ReactNode) {
  const id = setInterval(() => {
    const header = tryFindHeaderElement();
    if (!header) return;
    console.log('[GSM] Header found!');
    clearInterval(id);

    console.log('[GSM] Rendering extra header...');
    addCleanupFn(renderExtraHeader(header, extraHeader));
    
  }, 1000);
}
