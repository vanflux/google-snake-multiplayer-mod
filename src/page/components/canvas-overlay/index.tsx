import React, { useCallback, useEffect, useState } from 'react';
import { RoomState } from '../../../common/enums/room-state';
import { connection } from '../../multiplayer/connection';
import { gameSharing } from '../../multiplayer/game-sharing';
import styles from './index.module.css';

export function CanvasOverlay() {
  const [list, setList] = useState<string[]>([]);
  const [id, setId] = useState<string>();
  const [state, setState] = useState<RoomState>(RoomState.INGAME);
  const [counter, setCounter] = useState(0);

  const update = useCallback(() => {
    const myItem = `Me | Latency: ${Math.floor(gameSharing.getLatency())}ms`;
    const othersList = [...gameSharing.others?.values() || []].map((other, i) => `Player ${i+1} | Latency: ${Math.floor(other.getLatency())}ms ${other.instance.ready ? '(READY)' : ''}`);
    setList([myItem, ...othersList]);
  }, []);

  useEffect(() => {
    gameSharing.on('latency:changed', update);
    gameSharing.on('others:changed', update);
  
    connection.on('room:join', ({ id }) => setId(id));
    connection.on('room:leave', () => setId(undefined));
    connection.on('room:state', ({ state }) => setState(state));
    connection.on('room:counter', ({ counter }) => setCounter(counter));
  }, []);

  return <div className={styles.container}>
    <div className={styles.roomName}>{id !== undefined && `Room ${id}`}</div>
    <div className={styles.playerList}>
      {list.map((item, i) => (
        <div key={i}>{item}</div>
      ))}
    </div>
    <div className={styles.centeredText}>
      {state === RoomState.WAITING_PLAYERS && 'Waiting for players...'}
      {state === RoomState.STARTING && `${counter}`}
      {state === RoomState.ENDED && 'Round ended!'}
    </div>
  </div>
}
