'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Droplets } from 'lucide-react';
import { WaterTracker } from '@/components/dashboard/WaterTracker';
import { useRecordStore } from '@/store/useRecordStore';
import { useUserStore } from '@/store/useUserStore';
import { format } from 'date-fns';

export default function WaterRecordPage() {
  const router = useRouter();
  const today = format(new Date(), 'yyyy-MM-dd');

  const { target, fetchTarget } = useUserStore();
  const { waterIntake, addWater, fetchRecordsForDate } = useRecordStore();

  useEffect(() => {
    void fetchTarget();
    void fetchRecordsForDate(today);
  }, [fetchTarget, fetchRecordsForDate, today]);

  const currentWater = waterIntake[today] || 0;
  const targetWater = target?.target_water || 2000;

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans pb-20">
      <header className="bg-white p-4 border-b flex items-center gap-4 sticky top-0 z-10">
        <button onClick={() => router.back()} aria-label="返回" className="p-1 -ml-1">
          <ArrowLeft size={24} className="text-zinc-600" />
        </button>
        <h1 className="text-lg font-bold text-zinc-900">饮水记录</h1>
      </header>

      <main className="p-4 max-w-md mx-auto w-full space-y-6">
        <section className="bg-white p-2 rounded-3xl border border-zinc-100 shadow-sm overflow-hidden">
          <WaterTracker
            current={currentWater}
            target={targetWater}
            onAdd={(amount) => addWater(today, amount)}
          />
        </section>

        <div className="px-4 py-2">
          <p className="text-xs text-zinc-400 text-center leading-relaxed">
            保持充足的水分摄入有助于新陈代谢和身体恢复。<br/>
            建议每日饮水量：{targetWater}ml
          </p>
        </div>
      </main>
    </div>
  );
}
