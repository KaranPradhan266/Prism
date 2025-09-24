import { useEffect, useState, useRef } from 'react';

export const useRawLogStream = (projectId: string) => {
  const [logs, setLogs] = useState<string[]>([]);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!projectId) return;

    ws.current = new WebSocket(`ws://localhost:8080/ws/logs/${projectId}`);

    ws.current.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.current.onmessage = (event) => {
      setLogs((prevLogs) => [...prevLogs, event.data]);
    };

    ws.current.onclose = () => {
      console.log('WebSocket disconnected');
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [projectId]);

  return logs;
};
