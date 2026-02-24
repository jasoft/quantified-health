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

  const COLORS = ['#60a5fa', '#e5e7eb'];
  if (isOver) {
    COLORS[0] = '#ef4444';
  }

  return (
    <div data-testid="calorie-ring" className="relative mx-auto h-[172px] w-[172px] min-w-[172px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
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
      </ResponsiveContainer>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-xs text-gray-600 font-medium">还可以吃</span>
        <span className={`text-4xl font-bold leading-none ${isOver ? 'text-red-500' : 'text-gray-900'}`}>
          {Math.abs(remaining)}
        </span>
        <span className="text-[11px] text-gray-500 mt-1">预算{target}千卡</span>
      </div>
    </div>
  );
}
