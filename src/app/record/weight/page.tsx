'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Scale } from 'lucide-react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useRecordStore } from '@/store/useRecordStore';

const PERIODS = [7, 30, 90] as const;

export default function WeightRecordPage() {
  const router = useRouter();
  const [weight, setWeight] = useState('');
  const [period, setPeriod] = useState<number>(7);
  const today = new Date().toISOString().split('T')[0];
  const { weightRecords, fetchWeightHistory, addWeight, isLoading } = useRecordStore();

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

  const onSave = async () => {
    const value = parseFloat(weight);
    if (!Number.isFinite(value) || value <= 0) return;
    await addWeight(today, value);
    setWeight('');
  };

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans pb-20">
      <header className="bg-white p-4 border-b flex items-center gap-4">
        <button onClick={() => router.back()} aria-label="返回">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-bold">体重记录</h1>
      </header>

      <main className="p-4 max-w-md mx-auto w-full space-y-4">
        <section className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Scale size={18} className="text-slate-600" />
            <h2 className="font-bold text-zinc-900">今日体重</h2>
          </div>
          <div className="flex items-end gap-3">
            <input
              type="number"
              step="0.1"
              value={weight}
              placeholder="70.0"
              onChange={(e) => setWeight(e.target.value)}
              className="flex-1 min-w-0 w-full p-3 border rounded-xl text-3xl font-bold text-center bg-zinc-50 text-black"
            />
            <span className="pb-3 text-zinc-500 font-semibold">kg</span>
          </div>
          <button
            type="button"
            onClick={() => void onSave()}
            disabled={isLoading}
            className="mt-4 w-full py-3 bg-slate-900 text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : null}
            保存体重
          </button>
        </section>

        <section className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-zinc-900">趋势图</h2>
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
      </main>
    </div>
  );
}
