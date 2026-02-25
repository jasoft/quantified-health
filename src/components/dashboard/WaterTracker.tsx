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
  const quickAddOptions = [100, 200, 300];

  return (
    <div className="p-5 bg-blue-50 rounded-2xl border border-blue-100 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500 rounded-xl text-white shadow-sm">
            <Droplets size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-blue-900">饮水进度</h3>
            <p className="text-xs font-medium text-blue-600/70">{current} <span className="text-[10px] opacity-50">/ {target} ml</span></p>
          </div>
        </div>

        <div className="flex items-center gap-2">
           <span className="text-xs font-bold text-blue-600">{Math.round(percentage)}%</span>
           <div className="w-24 bg-blue-200/50 rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-500 h-full transition-all duration-700 ease-out"
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {quickAddOptions.map((amount) => (
          <button
            key={amount}
            onClick={() => onAdd(amount)}
            className="py-2.5 bg-white text-blue-600 border border-blue-200 rounded-xl text-xs font-bold shadow-sm active:scale-95 transition-all hover:bg-blue-50"
          >
            +{amount}ml
          </button>
        ))}
      </div>
    </div>
  );
}
