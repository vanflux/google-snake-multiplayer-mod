import React, { KeyboardEvent, useEffect, useState } from 'react';
import { connection } from '../../multiplayer/connection';
import styles from './index.module.css';

export function ExtraHeader() {
  const [connected, setConnected] = useState(connection.connected);
  const [serverUrlError, setServerUrlError] = useState(false);
  const [serverUrl, setServerUrl] = useState('ws://127.0.0.1:3512');

  useEffect(() => {
    connection.on('connect', () => {
      setConnected(true);
    });
    connection.on('disconnect', () => {
      setConnected(false);
    });
    connection.connect('ws', '127.0.0.1', 3512);
  }, []);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation();
  };

  const handleIpPortChange = (newServerUrl: string) => {
    setServerUrl(newServerUrl);
    if (newServerUrl !== serverUrl) {
      const match = newServerUrl.match(/^(ws|wss):\/\/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}):(\d{1,5})$/);
      if (match) {
        setServerUrlError(false);
        const [_, protocol, ip, portStr] = match;
        console.log('[GSM] Trying to connect to', protocol, ip, portStr);
        connection.connect(protocol, ip, Number(portStr));
      } else {
        setServerUrlError(true);
      }
    }
  };

  return <div className={styles.container}>
    <div className={styles.col}>
      <span className={styles.title}>Multiplayer Mod</span>
      <span className={connected ? styles.connected : styles.connecting}>{connected ? 'Connected' : 'Connecting...'}</span>
    </div>
    <div className={styles.col}>
      <span>Server Ip:Port</span>
      <input onKeyDown={handleKeyDown} className={serverUrlError ? styles.error : ''} onChange={e => handleIpPortChange(e.target.value)} value={serverUrl} placeholder='Server Url'></input>
    </div>
  </div>
}
