'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface CalorieRingProps {
  target: number;
  consumed: number;
  burned: number;
}

export function CalorieRing({ target, consumed, burned }: CalorieRingProps) {
  const remaining = target - consumed + burned;
  const isOver = remaining < 0;

  const data = [
    { name: 'Consumed', value: consumed },
    { name: 'Remaining', value: Math.max(0, remaining) },
  ];

  const COLORS = ['#0891b2', '#d7eef2'];
  if (isOver) {
    COLORS[0] = '#dc2626';
  }

  return (
    <div className="relative h-44 w-full max-w-[180px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={52}
            outerRadius={70}
            paddingAngle={2}
            dataKey="value"
            startAngle={90}
            endAngle={-270}
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-xs font-semibold uppercase tracking-wide text-cyan-900/70">剩余可吃</span>
        <span className={`font-display text-3xl font-bold ${isOver ? 'text-red-600' : 'text-cyan-950'}`}>
          {Math.abs(remaining)}
        </span>
        <span className="mt-0.5 text-[11px] font-medium text-cyan-900/60">kcal</span>
      </div>
    </div>
  );
}
