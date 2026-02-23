'use client';

import React from 'react';

interface MacroItemProps {
  label: string;
  current: number;
  target: number;
  color: string;
}

function MacroItem({ label, current, target, color }: MacroItemProps) {
  const percentage = Math.min(100, (current / target) * 100);
  
  return (
    <div className="w-full">
      <div className="flex justify-between items-end mb-1">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-xs text-gray-500">
          <span className="font-bold text-gray-900">{Math.round(current)}</span> / {Math.round(target)}g
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full ${color} transition-all duration-500`} 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
}

interface MacroProgressProps {
  carbs: { current: number; target: number };
  protein: { current: number; target: number };
  fat: { current: number; target: number };
}

export function MacroProgress({ carbs, protein, fat }: MacroProgressProps) {
  return (
    <div className="grid grid-cols-1 gap-4 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
      <MacroItem label="碳水" current={carbs.current} target={carbs.target} color="bg-blue-400" />
      <MacroItem label="蛋白质" current={protein.current} target={protein.target} color="bg-red-400" />
      <MacroItem label="脂肪" current={fat.current} target={fat.target} color="bg-yellow-400" />
    </div>
  );
}
