'use client';

import React from 'react';
import { PieChart, Pie, Cell } from 'recharts';

interface CalorieRingProps {
  target: number;
  consumed: number;
  burned: number;
}

export function CalorieRing({ target, consumed, burned }: CalorieRingProps) {
  const chartSize = 172;
  const remaining = target - consumed + burned;
  const isOver = remaining < 0;

  const data = [
    { name: 'Consumed', value: consumed },
    { name: 'Remaining', value: Math.max(0, remaining) },
  ];

  const COLORS = ['#60a5fa', '#e5e7eb'];
  if (isOver) {
    COLORS[0] = '#ef4444';
  }

  return (
    <div
      data-testid="calorie-ring"
      className="relative mx-auto min-w-[172px]"
      style={{ width: chartSize, height: chartSize }}
    >
      <PieChart width={chartSize} height={chartSize}>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={58}
          outerRadius={76}
          paddingAngle={3}
          dataKey="value"
          startAngle={90}
          endAngle={-270}
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
          ))}
        </Pie>
      </PieChart>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider mb-0.5">还可以吃</span>
        <span className={`text-4xl font-bold tracking-tight leading-none ${isOver ? 'text-red-500' : 'text-zinc-900'}`}>
          {Math.abs(remaining)}
        </span>
        <div className="mt-1.5 flex flex-col items-center">
          <span className="text-[10px] text-zinc-400 font-medium leading-none uppercase tracking-tighter">Budget</span>
          <span className="text-xs text-zinc-500 font-semibold">{target} kcal</span>
        </div>
      </div>
    </div>
  );
}
