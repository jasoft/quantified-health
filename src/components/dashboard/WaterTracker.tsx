'use client';

import React from 'react';
import { Droplets } from 'lucide-react';

interface WaterTrackerProps {
  current: number;
  target: number;
  onAdd: (amount: number) => void;
}

export function WaterTracker({ current, target, onAdd }: WaterTrackerProps) {
  const percentage = Math.min(100, (current / target) * 100);

  return (
    <div className="neo-card flex items-center justify-between gap-3 rounded-2xl border border-cyan-100/80 p-4">
      <div className="flex items-center gap-3">
        <div className="neo-inset flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700">
          <Droplets size={18} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-cyan-900">饮水进度</h3>
          <p className="text-xs text-cyan-700">{current} / {target} ml</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="h-2 w-20 overflow-hidden rounded-full bg-cyan-100">
          <div className="h-full rounded-full bg-cyan-600 transition-all duration-300 ease-out motion-reduce:transition-none" style={{ width: `${percentage}%` }} />
        </div>
        <button
          type="button"
          onClick={() => onAdd(250)}
          className="neo-card cursor-pointer rounded-xl border border-cyan-200 px-3 py-2 text-xs font-bold text-cyan-700 transition-colors duration-200 hover:bg-cyan-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
        >
          +250ml
        </button>
      </div>
    </div>
  );
}
