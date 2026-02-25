'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Dumbbell } from 'lucide-react';
import { format } from 'date-fns';
import { useRecordStore } from '@/store/useRecordStore';

export default function ExerciseRecordPage() {
  const router = useRouter();
  const [calories, setCalories] = useState('');
  const { setExercise, isLoading } = useRecordStore();
  const today = format(new Date(), 'yyyy-MM-dd');

  const handleSave = async () => {
    if (!calories) return;
    await setExercise(today, parseInt(calories));
    router.push('/');
  };

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans">
      <header className="bg-white p-4 border-b flex items-center gap-4">
        <button onClick={() => router.back()}><ArrowLeft size={24} /></button>
        <h1 className="text-lg font-bold">记录运动</h1>
      </header>

      <main className="p-4 space-y-6 max-w-md mx-auto w-full flex-1 flex flex-col items-center justify-center text-black">
        <div className="bg-red-500 text-white p-6 rounded-full shadow-xl mb-8">
          <Dumbbell size={48} />
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-zinc-100 w-full text-center">
          <h2 className="text-xl font-bold text-zinc-800 mb-8">今天消耗了多少热量？</h2>
          
          <div className="flex items-center justify-center gap-4 mb-2">
            <input 
              type="number" 
              placeholder="0"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              className="w-40 text-center text-5xl font-black border-b-4 border-red-500 focus:outline-none bg-transparent placeholder:text-zinc-200"
              autoFocus
            />
            <span className="text-2xl font-bold text-zinc-400">kcal</span>
          </div>
        </div>

        <button 
          onClick={handleSave}
          disabled={isLoading || !calories}
          className="w-full py-5 bg-zinc-900 text-white font-black rounded-2xl shadow-xl active:scale-95 transition-transform disabled:opacity-30 flex items-center justify-center gap-2"
        >
          {isLoading && <Loader2 size={20} className="animate-spin" />}
          确认记录
        </button>
      </main>
    </div>
  );
}
