import React, { useEffect, useState } from 'react';
import { socket } from '../../socket';
import styles from './index.module.css';

export function ExtraHeader() {
  const [connected, setConnected] = useState(socket.connected);

  useEffect(() => {
    socket.on('connect', () => {
      setConnected(true);
    });
    socket.on('disconnect', () => {
      setConnected(false);
    });
  }, []);

  return <div className={styles.container}>
    <span className={styles.title}>Multiplayer Mod</span>
    <span className={connected ? styles.connected : styles.connecting}>{connected ? 'Connected' : 'Connecting...'}</span>
  </div>
}
