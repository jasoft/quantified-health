'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { addDays, addWeeks, format, isSameDay, isToday, parseISO, startOfWeek } from 'date-fns';
import { Camera, ChevronLeft, ChevronRight } from 'lucide-react';
import { CalorieRing } from '@/components/dashboard/CalorieRing';
import { FloatingActionButton } from '@/components/dashboard/FloatingActionButton';
import { WaterTracker } from '@/components/dashboard/WaterTracker';
import { NOCODB_URL } from '@/lib/nocodb';
import { NocoAttachment } from '@/services/recordService';
import { useRecordStore } from '@/store/useRecordStore';
import { useUserStore } from '@/store/useUserStore';

const WEEKDAY_LABELS = ['一', '二', '三', '四', '五', '六', '日'];

const MEAL_ORDER = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
const MEAL_LABELS: Record<(typeof MEAL_ORDER)[number], string> = {
  breakfast: '早餐',
  lunch: '午餐',
  dinner: '晚餐',
  snack: '加餐',
};
const MEAL_TARGET_RATIOS: Record<(typeof MEAL_ORDER)[number], number> = {
  breakfast: 0.25,
  lunch: 0.35,
  dinner: 0.3,
  snack: 0.1,
};

function resolveAttachmentUrl(photo?: NocoAttachment): string | null {
  if (!photo) return null;
  const raw = photo.url ?? photo.signedPath ?? photo.path ?? '';
  if (!raw) return null;
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
  return `${NOCODB_URL}${raw.startsWith('/') ? '' : '/'}${raw}`;
}

function dateLabel(date: Date): string {
  if (isToday(date)) return '今天';
  return format(date, 'M月d日');
}

export default function Home() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const [selectedDate, setSelectedDate] = useState(today);
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date(), { weekStartsOn: 1 }));

  const { target, fetchTarget, isLoading: userLoading } = useUserStore();
  const {
    foodRecords,
    waterIntake,
    exerciseCalories,
    weightRecordsByDate,
    fetchRecordsForDate,
    fetchWeightRecordByDate,
    addWater,
    removeWeightPhoto,
    isLoading,
    error,
  } = useRecordStore();

  useEffect(() => {
    void fetchTarget();
  }, [fetchTarget]);

  useEffect(() => {
    void fetchRecordsForDate(selectedDate);
    void fetchWeightRecordByDate(selectedDate);
  }, [fetchWeightRecordByDate, fetchRecordsForDate, selectedDate]);

  const userTarget = target || {
    target_calories: 2000,
    target_carbs: 250,
    target_protein: 150,
    target_fat: 55,
    target_water: 2000,
    tdee: 2000,
  };

  const selectedDateObj = parseISO(`${selectedDate}T00:00:00`);
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  const groupedMeals = useMemo(() => {
    const grouped = {
      breakfast: [],
      lunch: [],
      dinner: [],
      snack: [],
    } as Record<(typeof MEAL_ORDER)[number], typeof foodRecords>;

    for (const record of foodRecords) {
      if (record.mealType in grouped) {
        grouped[record.mealType as keyof typeof grouped].push(record);
      }
    }

    return grouped;
  }, [foodRecords]);

  const consumedCalories = foodRecords.reduce((sum, item) => sum + Number(item.calories), 0);
  const consumedCarbs = foodRecords.reduce((sum, item) => sum + Number(item.carbs), 0);
  const consumedProtein = foodRecords.reduce((sum, item) => sum + Number(item.protein), 0);
  const consumedFat = foodRecords.reduce((sum, item) => sum + Number(item.fat), 0);
  const burnedCalories = exerciseCalories[selectedDate] || 0;
  const currentWater = waterIntake[selectedDate] || 0;
  const safeWeightRecordsByDate = weightRecordsByDate ?? {};
  const dailyPhotoUrl = resolveAttachmentUrl(safeWeightRecordsByDate[selectedDate]?.photo?.[0]);

  const macroItems = [
    { label: '蛋白质', current: consumedProtein, target: userTarget.target_protein, color: 'from-sky-400 to-sky-600' },
    { label: '脂肪', current: consumedFat, target: userTarget.target_fat, color: 'from-rose-300 to-rose-500' },
    { label: '碳水化合物', current: consumedCarbs, target: userTarget.target_carbs, color: 'from-amber-300 to-amber-500' },
  ];

  if (userLoading && !target) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="neo-card flex h-28 w-full max-w-xs items-center justify-center rounded-3xl border border-cyan-100/80">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-200 border-t-cyan-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col pb-36">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-16 top-20 h-48 w-48 rounded-full bg-cyan-200/40 blur-3xl" />
        <div className="absolute -right-16 top-48 h-56 w-56 rounded-full bg-teal-200/40 blur-3xl" />
      </div>

      <section className="mx-auto w-full max-w-xl px-4 pt-5">
        <div className="neo-card rounded-[30px] border border-cyan-100/80 px-4 pb-5 pt-4 sm:px-5">
          <div className="mb-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setWeekStart((prev) => addWeeks(prev, -1));
                setSelectedDate((prev) => format(addWeeks(parseISO(`${prev}T00:00:00`), -1), 'yyyy-MM-dd'));
              }}
              aria-label="上一周"
              className="neo-card flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-cyan-100 text-cyan-900 transition-colors duration-200 hover:bg-cyan-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
            >
              <ChevronLeft size={20} />
            </button>
            <h1 className="font-display text-4xl font-bold leading-none text-cyan-950">{dateLabel(selectedDateObj)}</h1>
            <button
              type="button"
              onClick={() => {
                setWeekStart((prev) => addWeeks(prev, 1));
                setSelectedDate((prev) => format(addWeeks(parseISO(`${prev}T00:00:00`), 1), 'yyyy-MM-dd'));
              }}
              aria-label="下一周"
              className="neo-card flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-cyan-100 text-cyan-900 transition-colors duration-200 hover:bg-cyan-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="mb-3 grid grid-cols-7 gap-2">
            {WEEKDAY_LABELS.map((label) => (
              <div key={label} className="text-center text-xs font-semibold tracking-wide text-cyan-800/70">
                {label}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((date, index) => {
              const active = isSameDay(date, selectedDateObj);
              return (
                <button
                  key={date.toISOString()}
                  type="button"
                  onClick={() => setSelectedDate(format(date, 'yyyy-MM-dd'))}
                  className={`mx-auto flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-sm font-semibold transition-all duration-200 ease-out motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${
                    active
                      ? 'bg-cyan-600 text-white shadow-md shadow-cyan-200'
                      : 'neo-card border border-cyan-100 text-cyan-900 hover:bg-cyan-50'
                  }`}
                  aria-label={`${WEEKDAY_LABELS[index]} ${format(date, 'd')}日`}
                >
                  {format(date, 'd')}
                </button>
              );
            })}
          </div>

          <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-3">
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-cyan-800/70">饮食摄入</p>
              <p className="font-display mt-1 text-4xl font-bold leading-none text-cyan-950">{consumedCalories}</p>
              <p className="text-[11px] text-cyan-800/70">kcal</p>
            </div>
            <CalorieRing target={userTarget.target_calories} consumed={consumedCalories} burned={burnedCalories} />
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-cyan-800/70">运动消耗</p>
              <p className="font-display mt-1 text-4xl font-bold leading-none text-cyan-950">{burnedCalories}</p>
              <p className="text-[11px] text-cyan-800/70">kcal</p>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto w-full max-w-xl space-y-4 px-4 py-4">
        <section className="neo-card rounded-3xl border border-cyan-100/80 p-4">
          <div className="grid grid-cols-3 gap-3">
            {macroItems.map((item) => {
              const ratio = Math.min(100, (item.current / Math.max(1, item.target)) * 100);
              return (
                <div key={item.label} className="space-y-2 rounded-2xl bg-white/75 p-3">
                  <h3 className="text-xs font-semibold text-cyan-900">{item.label}</h3>
                  <div className="h-2 overflow-hidden rounded-full bg-cyan-100">
                    <div className={`h-full rounded-full bg-gradient-to-r ${item.color}`} style={{ width: `${ratio}%` }} />
                  </div>
                  <p className="text-sm font-semibold text-cyan-950">
                    {Math.round(item.current)}/{Math.round(item.target)}g
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {MEAL_ORDER.map((mealType) => {
          const mealFoods = groupedMeals[mealType];
          const mealCalories = mealFoods.reduce((sum, item) => sum + Number(item.calories), 0);
          const mealTarget = Math.round(userTarget.target_calories * MEAL_TARGET_RATIOS[mealType]);
          const intakeText = mealFoods.length > 0 ? `已摄入 ${mealCalories}/${mealTarget} 千卡` : `目标 ${mealTarget} 千卡`;

          return (
            <section key={mealType} className="neo-card rounded-3xl border border-cyan-100/80 p-5">
              <div className="mb-4 flex items-end justify-between gap-2">
                <h2 className="font-display text-5xl font-bold leading-none text-cyan-950">{MEAL_LABELS[mealType]}</h2>
                <p className="text-sm font-medium text-cyan-700">{intakeText}</p>
              </div>

              {mealFoods.length > 0 ? (
                <div className="space-y-3">
                  {mealFoods.map((food) => (
                    <div key={`${food.name}-${food.Id ?? food.amount}`} className="neo-inset rounded-2xl bg-white/80 px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-2xl font-semibold leading-tight text-cyan-950">{food.name}</p>
                          <p className="mt-1 text-sm text-cyan-700">{Math.round(food.amount)} 克</p>
                        </div>
                        <p className="font-display whitespace-nowrap text-3xl font-bold leading-none text-cyan-900">
                          {Math.round(food.calories)}
                          <span className="ml-1 text-sm font-semibold text-cyan-700">kcal</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-cyan-200 bg-white/70 px-4 py-5 text-sm text-cyan-700">
                  当前餐次暂无记录
                </div>
              )}
            </section>
          );
        })}

        <section className="neo-card rounded-3xl border border-cyan-100/80 p-5">
          <div className="flex items-end justify-between gap-2">
            <h2 className="font-display text-5xl font-bold leading-none text-cyan-950">运动</h2>
            <p className="text-sm font-medium text-cyan-700">已消耗 {burnedCalories} 千卡</p>
          </div>
        </section>

        <section className="neo-card rounded-3xl border border-cyan-100/80 p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-display text-5xl font-bold leading-none text-cyan-950">体型照</h2>
            <Link
              href="/record/photo"
              className="inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-xl border border-cyan-200 px-3 py-2 text-sm font-semibold text-cyan-700 transition-colors duration-200 hover:bg-cyan-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
            >
              <Camera size={16} />
              {dailyPhotoUrl ? '重新上传' : '去记录'}
            </Link>
          </div>

          <div className="relative h-56 overflow-hidden rounded-2xl border border-cyan-200 bg-cyan-50">
            {dailyPhotoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={dailyPhotoUrl} alt={`${selectedDate}体型照`} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-cyan-700/75">当日暂无体型照</div>
            )}
          </div>

          <button
            type="button"
            disabled={!dailyPhotoUrl || isLoading}
            onClick={() => void removeWeightPhoto(selectedDate)}
            className="mt-4 min-h-[44px] w-full cursor-pointer rounded-xl border border-cyan-200 px-4 py-2.5 text-sm font-semibold text-cyan-700 transition-colors duration-200 hover:bg-cyan-50 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
          >
            移除
          </button>

          {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
        </section>

        <section>
          <h2 className="mb-3 px-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-800/70">水分补给</h2>
          <WaterTracker current={currentWater} target={userTarget.target_water} onAdd={(amount) => addWater(selectedDate, amount)} />
        </section>
      </main>

      <FloatingActionButton />
    </div>
  );
}
