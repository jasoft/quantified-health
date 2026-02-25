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
    <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-500 rounded-lg text-white">
          <Droplets size={20} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-blue-900">饮水进度</h3>
          <p className="text-xs text-blue-700">{current} / {target} ml</p>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="w-20 bg-blue-200 rounded-full h-1.5 overflow-hidden">
          <div 
            className="bg-blue-600 h-full transition-all duration-500" 
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
        <div className="flex items-center gap-1.5">
          {quickAddOptions.map((amount) => (
            <button
              key={amount}
              onClick={() => onAdd(amount)}
              className="px-2.5 py-1 bg-white text-blue-600 border border-blue-200 rounded-lg text-xs font-bold active:scale-95 transition-transform"
            >
              {amount}ml
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
