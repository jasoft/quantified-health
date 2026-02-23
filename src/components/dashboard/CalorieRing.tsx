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
  
  // Data for the chart
  const data = [
    { name: 'Consumed', value: consumed },
    { name: 'Remaining', value: Math.max(0, remaining) },
  ];

  const COLORS = ['#3b82f6', '#e5e7eb']; // Blue for consumed, light gray for remaining
  if (isOver) {
    COLORS[0] = '#ef4444'; // Red if over limit
  }

  return (
    <div className="relative w-full h-64 flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={80}
            outerRadius={100}
            paddingAngle={5}
            dataKey="value"
            startAngle={90}
            endAngle={-270}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-sm text-gray-500 font-medium">剩余可吃</span>
        <span className={`text-4xl font-bold ${isOver ? 'text-red-500' : 'text-gray-900'}`}>
          {Math.abs(remaining)}
        </span>
        <span className="text-xs text-gray-400 mt-1">kcal</span>
      </div>
    </div>
  );
}
