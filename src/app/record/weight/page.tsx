'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Scale } from 'lucide-react';
import { WeightTrendSection } from '@/components/weight/WeightTrendSection';
import { useRecordStore } from '@/store/useRecordStore';

export default function WeightRecordPage() {
  const router = useRouter();
  const [weight, setWeight] = useState('');
  const today = new Date().toISOString().split('T')[0];
  const { addWeight, isLoading } = useRecordStore();

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

        <WeightTrendSection title="趋势图" />
      </main>
    </div>
  );
}
