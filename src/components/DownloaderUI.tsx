'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download,
  Pause,
  Play,
  X,
  Trash2,
  CheckCircle,
  AlertCircle,
  Clock,
  Zap
} from 'lucide-react';
import type { DownloadTask, DownloadQuality } from '@/lib/download/manager';
import { downloadManager } from '@/lib/download/manager';

// ========== Helper functions (global to file) ==========
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatTime(seconds: number): string {
  if (seconds === 0) return '0s';
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  return `${Math.round(seconds / 3600)}h`;
}

// ========== Main Component ==========
interface DownloaderUIProps {
  isOpen: boolean;
  onClose: () => void;
  // onDownload prop removed – was unused
}

export function DownloaderUI({ isOpen, onClose }: DownloaderUIProps) {
  const [tasks, setTasks] = useState<DownloadTask[]>([]);
  const [stats, setStats] = useState({
    activeDownloads: 0,
    totalSpeed: 0,
    averageProgress: 0,
    estimatedTimeRemaining: 0
  });

  useEffect(() => {
    // Subscribe to download events
    const handleProgress = () => {
      setTasks([...downloadManager.getAllTasks()]);
      setStats(downloadManager.getBandwidthStats());
    };

    const handleStart = () => {
      setTasks([...downloadManager.getAllTasks()]);
    };

    const handleComplete = () => {
      setTasks([...downloadManager.getAllTasks()]);
    };

    downloadManager.on('download:progress', handleProgress);
    downloadManager.on('download:start', handleStart);
    downloadManager.on('download:complete', handleComplete);
    downloadManager.on('download:paused', handleStart);
    downloadManager.on('download:resumed', handleStart);
    downloadManager.on('download:cancelled', handleStart);

    // Initial load
    setTasks([...downloadManager.getAllTasks()]);

    // Update stats every second
    const statsInterval = setInterval(() => {
      setStats(downloadManager.getBandwidthStats());
    }, 1000);

    return () => {
      downloadManager.removeListener('download:progress', handleProgress);
      downloadManager.removeListener('download:start', handleStart);
      downloadManager.removeListener('download:complete', handleComplete);
      clearInterval(statsInterval);
    };
  }, []);

  const activeDownloads = tasks.filter(t => t.status === 'downloading');
  const completedDownloads = tasks.filter(t => t.status === 'completed');

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-4 right-4 w-96 max-h-96 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <div className="flex items-center gap-3">
              <Download size={20} className="text-red-600" />
              <h3 className="text-white font-semibold">Downloads</h3>
              {activeDownloads.length > 0 && (
                <span className="px-2 py-1 bg-red-600 rounded-full text-white text-xs font-bold">
                  {activeDownloads.length}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-800 rounded-lg transition"
            >
              <X size={20} className="text-gray-400" />
            </button>
          </div>

          {/* Stats Bar */}
          {activeDownloads.length > 0 && (
            <div className="px-4 py-3 bg-gray-800/50 border-b border-gray-700 grid grid-cols-3 gap-4">
              <div>
                <div className="text-gray-400 text-xs">Speed</div>
                <div className="text-white font-semibold flex items-center gap-1">
                  <Zap size={14} className="text-yellow-500" />
                  {formatBytes(stats.totalSpeed)}/s
                </div>
              </div>
              <div>
                <div className="text-gray-400 text-xs">Progress</div>
                <div className="text-white font-semibold">{stats.averageProgress}%</div>
              </div>
              <div>
                <div className="text-gray-400 text-xs">ETA</div>
                <div className="text-white font-semibold flex items-center gap-1">
                  <Clock size={14} className="text-blue-500" />
                  {formatTime(stats.estimatedTimeRemaining)}
                </div>
              </div>
            </div>
          )}

          {/* Download List */}
          <div className="flex-1 overflow-y-auto">
            {/* Active Downloads */}
            {activeDownloads.length > 0 && (
              <div>
                <div className="px-4 py-2 text-gray-400 text-xs font-semibold bg-gray-800/30">
                  DOWNLOADING
                </div>
                {activeDownloads.map(task => (
                  <DownloadItem
                    key={task.id}
                    task={task}
                    onPause={() => downloadManager.pauseDownload(task.id)}
                    onResume={() => downloadManager.resumeDownload(task.id)}
                    onCancel={() => downloadManager.cancelDownload(task.id)}
                  />
                ))}
              </div>
            )}

            {/* Completed Downloads */}
            {completedDownloads.length > 0 && (
              <div>
                <div className="px-4 py-2 text-gray-400 text-xs font-semibold bg-gray-800/30">
                  COMPLETED
                </div>
                {completedDownloads.slice(0, 3).map(task => (
                  <DownloadItem
                    key={task.id}
                    task={task}
                    onCancel={() => downloadManager.cancelDownload(task.id)}
                  />
                ))}
              </div>
            )}

            {/* Empty State */}
            {tasks.length === 0 && (
              <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                <Download size={32} className="mb-2 opacity-50" />
                <p className="text-sm">No downloads yet</p>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          {(tasks.length > 0 || completedDownloads.length > 0) && (
            <div className="border-t border-gray-700 p-3 flex gap-2">
              <button
                onClick={() => downloadManager.clearHistory()}
                className="flex-1 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white text-sm transition flex items-center justify-center gap-2"
              >
                <Trash2 size={14} />
                Clear History
              </button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ========== DownloadItem Component ==========
interface DownloadItemProps {
  task: DownloadTask;
  onPause?: () => void;
  onResume?: () => void;
  onCancel?: () => void;
}

function DownloadItem({ task, onPause, onResume, onCancel }: DownloadItemProps) {
  return (
    <motion.div
      layout
      className="px-4 py-3 border-b border-gray-700 hover:bg-gray-800/50 transition"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <p className="text-white text-sm font-medium truncate">{task.title}</p>
          <p className="text-gray-400 text-xs">{task.quality.label} • {task.quality.resolution}</p>
        </div>

        {/* Status Icon */}
        {task.status === 'completed' && (
          <CheckCircle size={18} className="text-green-500 ml-2" />
        )}
        {task.status === 'failed' && (
          <AlertCircle size={18} className="text-red-500 ml-2" />
        )}
      </div>

      {/* Progress Bar */}
      {(task.status === 'downloading' || task.status === 'paused') && (
        <>
          <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden mb-2">
            <motion.div
              className="h-full bg-gradient-to-r from-red-600 to-red-500"
              initial={{ width: 0 }}
              animate={{ width: `${task.progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">
              {formatBytes(task.downloadedSize)} / {formatBytes(task.totalSize)}
            </span>
            <span className="text-gray-400">
              {task.progress}% • {formatBytes(task.speed)}/s
            </span>
          </div>
        </>
      )}

      {/* Actions */}
      {task.status === 'downloading' && (
        <div className="mt-2 flex gap-2">
          <button
            onClick={onPause}
            className="flex-1 px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-white text-xs transition flex items-center justify-center gap-1"
          >
            <Pause size={12} />
            Pause
          </button>
          <button
            onClick={onCancel}
            className="px-2 py-1 bg-red-900 hover:bg-red-800 rounded text-white text-xs transition"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {task.status === 'paused' && (
        <div className="mt-2 flex gap-2">
          <button
            onClick={onResume}
            className="flex-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-white text-xs transition flex items-center justify-center gap-1"
          >
            <Play size={12} />
            Resume
          </button>
          <button
            onClick={onCancel}
            className="px-2 py-1 bg-red-900 hover:bg-red-800 rounded text-white text-xs transition"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {task.status === 'completed' && (
        <p className="text-gray-400 text-xs mt-2">
          Completed on {new Date(task.completedAt || '').toLocaleDateString()}
        </p>
      )}
    </motion.div>
  );
}