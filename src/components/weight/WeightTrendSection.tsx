'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useRecordStore } from '@/store/useRecordStore';

const PERIODS = [7, 30, 90] as const;

interface WeightTrendSectionProps {
  title?: string;
  className?: string;
}

export function WeightTrendSection({ title = '趋势图', className = '' }: WeightTrendSectionProps) {
  const [period, setPeriod] = useState<number>(7);
  const { weightRecords, fetchWeightHistory } = useRecordStore();

  useEffect(() => {
    void fetchWeightHistory(period);
  }, [fetchWeightHistory, period]);

  const chartData = useMemo(
    () =>
      weightRecords.map((record) => ({
        ...record,
        label: record.date.slice(5),
      })),
    [weightRecords]
  );

  return (
    <section className={`bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm ${className}`.trim()}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-zinc-900">{title}</h2>
        <div className="flex gap-2">
          {PERIODS.map((days) => (
            <button
              key={days}
              type="button"
              className={`px-3 py-1 text-xs rounded-full border ${
                period === days ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-zinc-600 border-zinc-200'
              }`}
              onClick={() => setPeriod(days)}
            >
              {days}天
            </button>
          ))}
        </div>
      </div>

      {chartData.length > 0 ? (
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis domain={['dataMin - 1', 'dataMax + 1']} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="weight" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-40 flex items-center justify-center text-sm text-zinc-400">暂无体重数据</div>
      )}
    </section>
  );
}
