"use client";
import { useState, useCallback, useRef } from 'react';

interface DownloadState {
  status: 'idle' | 'downloading' | 'complete' | 'error';
  progress: number;
  filename: string;
  error?: string;
}

export function useDownload() {
  const [download, setDownload] = useState<DownloadState>({
    status: 'idle',
    progress: 0,
    filename: '',
  });
  const abortRef = useRef<AbortController | null>(null);

  const startDownload = useCallback(async (url: string, filename: string) => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setDownload({ status: 'downloading', progress: 0, filename });

    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const contentLength = response.headers.get('content-length');
      const total = contentLength ? parseInt(contentLength, 10) : 0;

      const reader = response.body?.getReader();
      if (!reader) throw new Error('ReadableStream not supported');

      const chunks: Uint8Array[] = [];
      let received = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        received += value.length;
        if (total > 0) {
          setDownload(prev => ({ ...prev, progress: Math.round((received / total) * 100) }));
        }
      }

      // Fix: cast to any to satisfy strict BlobPart typing
      const blob = new Blob(chunks as any);
      const blobUrl = URL.createObjectURL(blob);

      if ('showSaveFilePicker' in window) {
        try {
          const handle = await (window as any).showSaveFilePicker({
            suggestedName: filename,
            types: [{ description: 'Video File', accept: { 'video/mp4': ['.mp4'] } }],
          });
          const writable = await handle.createWritable();
          await writable.write(blob);
          await writable.close();
        } catch (err: any) {
          if (err.name === 'AbortError') {
            setDownload({ status: 'idle', progress: 0, filename: '' });
            return;
          }
          throw err;
        }
      } else {
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }

      URL.revokeObjectURL(blobUrl);
      setDownload({ status: 'complete', progress: 100, filename });
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setDownload({ status: 'idle', progress: 0, filename: '' });
      } else {
        setDownload(prev => ({ ...prev, status: 'error', error: err.message || 'Download failed' }));
      }
    }
  }, []);

  const cancelDownload = useCallback(() => {
    abortRef.current?.abort();
    setDownload({ status: 'idle', progress: 0, filename: '' });
  }, []);

  return { download, setDownload, startDownload, cancelDownload };
}