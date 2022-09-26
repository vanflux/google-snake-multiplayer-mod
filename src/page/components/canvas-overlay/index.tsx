import React, { useCallback, useEffect, useState } from 'react';
import { gameSharing } from '../../multiplayer/game-sharing';
import styles from './index.module.css';

export function CanvasOverlay() {
  const [list, setList] = useState<string[]>([]);

  const update = useCallback(() => {
    const myItem = `Latency to server: ${Math.floor(gameSharing.getLatency() / 2)}ms`;
    const othersList = [...gameSharing.others?.values() || []].map((other, i) => `Total latency to player ${i+1}: ${Math.floor(other.getLatency())}ms`);
    setList([myItem, ...othersList]);
  }, []);

  useEffect(() => {
    gameSharing.on('latency_changed', update);
    gameSharing.on('others_changed', update);
  }, []);

  return <div className={styles.container}>
    {list.map((item, i) => (
      <div key={i}>{item}</div>
    ))}
  </div>
}
