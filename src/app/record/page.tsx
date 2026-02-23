'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Camera, Coffee, Droplets, Dumbbell, Moon, Scale, Utensils } from 'lucide-react';
import { useRecordStore } from '@/store/useRecordStore';

const TODAY = new Date().toISOString().split('T')[0];

export default function RecordHubPage() {
  const router = useRouter();
  const { addWater } = useRecordStore();
  const cardClass =
    'w-full p-4 bg-white border border-zinc-100 rounded-xl shadow-sm flex items-center gap-3 text-left font-semibold text-zinc-800';

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans pb-24">
      <header className="bg-white p-4 border-b flex items-center gap-4">
        <button onClick={() => router.back()} aria-label="返回">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-bold text-zinc-900">快捷记录</h1>
      </header>

      <main className="p-4 max-w-md mx-auto w-full space-y-3">
        <p className="text-sm text-zinc-500">选择一个项目，快速完成记录。</p>

        <Link className={cardClass} href="/record/food?type=breakfast">
          <Coffee size={20} className="text-orange-500" />
          <span>早餐</span>
        </Link>
        <Link className={cardClass} href="/record/food?type=lunch">
          <Utensils size={20} className="text-green-600" />
          <span>午餐</span>
        </Link>
        <Link className={cardClass} href="/record/food?type=dinner">
          <Utensils size={20} className="text-blue-600" />
          <span>晚餐</span>
        </Link>
        <Link className={cardClass} href="/record/food?type=snack">
          <Moon size={20} className="text-purple-500" />
          <span>加餐</span>
        </Link>
        <Link className={cardClass} href="/record/exercise">
          <Dumbbell size={20} className="text-red-500" />
          <span>运动</span>
        </Link>
        <button
          type="button"
          className={cardClass}
          onClick={() => void addWater(TODAY, 250)}
          aria-label="饮水 +250ml"
        >
          <Droplets size={20} className="text-cyan-600" />
          <span>饮水 +250ml</span>
        </button>
        <Link className={cardClass} href="/record/weight" aria-label="体重记录">
          <Scale size={20} className="text-slate-600" />
          <span>体重记录</span>
        </Link>
        <Link className={cardClass} href="/record/photo" aria-label="体型照记录">
          <Camera size={20} className="text-indigo-500" />
          <span>体型照记录</span>
        </Link>
      </main>
    </div>
  );
}
