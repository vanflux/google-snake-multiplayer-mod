import React, { useEffect, useState } from 'react';
import { connection } from '../../multiplayer/connection';
import styles from './index.module.css';

export function ExtraHeader() {
  const [connected, setConnected] = useState(connection.connected);

  useEffect(() => {
    connection.on('connect', () => {
      setConnected(true);
    });
    connection.on('disconnect', () => {
      setConnected(false);
    });
  }, []);

  return <div className={styles.container}>
    <span className={styles.title}>Multiplayer Mod</span>
    <span className={connected ? styles.connected : styles.connecting}>{connected ? 'Connected' : 'Connecting...'}</span>
  </div>
}
