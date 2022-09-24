import React, { useEffect, useState } from 'react';
import { gameSharing, GameSharingOther } from '../../multiplayer/game-sharing';
import styles from './index.module.css';

export function CanvasOverlay() {
  const [list, setList] = useState<string[]>([]);

  useEffect(() => {
    gameSharing.on('others_changed', (others: Map<string, GameSharingOther>) => {
      const myItem = `Latency to server: ${Math.floor(gameSharing.getLatency() / 2)}ms`
      const othersList = [...others.values()].map((other, i) => `Total latency to player ${i+1}: ${Math.floor(other.getLatency())}ms`);
      setList([myItem, ...othersList]);
    })
  }, []);

  return <div className={styles.container}>
    {list.map((item, i) => (
      <div key={i}>{item}</div>
    ))}
  </div>
}
