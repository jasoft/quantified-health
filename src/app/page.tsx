'use client';

import React, { useEffect } from 'react';
import { format } from 'date-fns';
import { CalorieRing } from '@/components/dashboard/CalorieRing';
import { MacroProgress } from '@/components/dashboard/MacroProgress';
import { WaterTracker } from '@/components/dashboard/WaterTracker';
import { FloatingActionButton } from '@/components/dashboard/FloatingActionButton';
import { useUserStore } from '@/store/useUserStore';
import { useRecordStore } from '@/store/useRecordStore';

export default function Home() {
  const today = format(new Date(), 'yyyy-MM-dd');
  
  const { target, fetchTarget, isLoading: userLoading } = useUserStore();
  const { 
    foodRecords, 
    waterIntake, 
    exerciseCalories, 
    fetchRecordsForDate, 
    addWater,
    isLoading: recordsLoading 
  } = useRecordStore();

  useEffect(() => {
    fetchTarget();
    fetchRecordsForDate(today);
  }, [fetchTarget, fetchRecordsForDate, today]);

  // Calculations
  const userTarget = target || {
    target_calories: 2000,
    target_carbs: 250,
    target_protein: 150,
    target_fat: 55,
    target_water: 2000,
    tdee: 2000
  };

  const consumedCalories = foodRecords.reduce((sum, r) => sum + Number(r.calories), 0);
  const consumedCarbs = foodRecords.reduce((sum, r) => sum + Number(r.carbs), 0);
  const consumedProtein = foodRecords.reduce((sum, r) => sum + Number(r.protein), 0);
  const consumedFat = foodRecords.reduce((sum, r) => sum + Number(r.fat), 0);
  
  const burnedCalories = exerciseCalories[today] || 0;
  const currentWater = waterIntake[today] || 0;

  if (userLoading && !target) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans pb-32">
      <header className="bg-white p-6 border-b border-zinc-200 sticky top-0 z-10">
        <h1 className="text-xl font-bold text-zinc-900">今日概览</h1>
        <p className="text-sm text-zinc-500">{format(new Date(), 'yyyy年MM月dd日')}</p>
      </header>

      <main className="flex-1 p-4 space-y-6 max-w-md mx-auto w-full">
        {/* Calorie Ring */}
        <section className="bg-white p-2 rounded-2xl shadow-sm border border-zinc-100">
          <CalorieRing 
            target={userTarget.target_calories} 
            consumed={consumedCalories} 
            burned={burnedCalories} 
          />
        </section>

        {/* Macros */}
        <section>
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3 px-1">营养分布</h2>
          <MacroProgress 
            carbs={{ current: consumedCarbs, target: userTarget.target_carbs }}
            protein={{ current: consumedProtein, target: userTarget.target_protein }}
            fat={{ current: consumedFat, target: userTarget.target_fat }}
          />
        </section>

        {/* Water */}
        <section>
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3 px-1">水分补给</h2>
          <WaterTracker 
            current={currentWater} 
            target={userTarget.target_water} 
            onAdd={(amount) => addWater(today, amount)}
          />
        </section>

        {/* Exercise Summary (Simple) */}
        {burnedCalories > 0 && (
          <section className="p-4 bg-red-50 rounded-xl border border-red-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-red-600 font-bold">🏃 运动消耗</div>
            </div>
            <div className="text-red-700 font-bold">+{burnedCalories} kcal</div>
          </section>
        )}
      </main>

      <FloatingActionButton />
    </div>
  );
}
