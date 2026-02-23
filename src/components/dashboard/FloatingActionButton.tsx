'use client';

import React, { useMemo, useState } from 'react';
import { Plus, Coffee, Utensils, Moon, Dumbbell, Droplet, Scale, Camera } from 'lucide-react';
import Link from 'next/link';
import { useRecordStore } from '@/store/useRecordStore';

interface LinkAction {
  kind: 'link';
  label: string;
  href: string;
  color: string;
  icon: React.ReactNode;
}

interface ButtonAction {
  kind: 'button';
  label: string;
  color: string;
  icon: React.ReactNode;
  onClick: () => Promise<void> | void;
}

export function FloatingActionButton() {
  const [isOpen, setIsOpen] = useState(false);
  const { addWater } = useRecordStore();
  const today = new Date().toISOString().split('T')[0];

  const actions = useMemo<(LinkAction | ButtonAction)[]>(
    () => [
      { kind: 'link', icon: <Coffee size={18} />, label: '早餐', href: '/record/food?type=breakfast', color: 'bg-amber-500' },
      { kind: 'link', icon: <Utensils size={18} />, label: '午餐', href: '/record/food?type=lunch', color: 'bg-emerald-500' },
      { kind: 'link', icon: <Utensils size={18} />, label: '晚餐', href: '/record/food?type=dinner', color: 'bg-cyan-600' },
      { kind: 'link', icon: <Moon size={18} />, label: '加餐', href: '/record/food?type=snack', color: 'bg-sky-500' },
      { kind: 'link', icon: <Dumbbell size={18} />, label: '运动', href: '/record/exercise', color: 'bg-rose-500' },
      {
        kind: 'button',
        icon: <Droplet size={18} />,
        label: '饮水 +250ml',
        color: 'bg-cyan-500',
        onClick: () => addWater(today, 250),
      },
      { kind: 'link', icon: <Scale size={18} />, label: '体重', href: '/record/weight', color: 'bg-slate-600' },
      { kind: 'link', icon: <Camera size={18} />, label: '体型照', href: '/record/photo', color: 'bg-teal-600' },
    ],
    [addWater, today]
  );

  return (
    <div className="fixed bottom-24 right-6 z-50">
      {isOpen && (
        <div className="absolute bottom-16 right-0 flex flex-col items-end gap-2.5">
          {actions.map((action, index) => {
            if (action.kind === 'link') {
              return (
                <Link
                  key={index}
                  href={action.href}
                  className="group flex cursor-pointer items-center gap-2"
                  onClick={() => setIsOpen(false)}
                  aria-label={action.label}
                >
                  <span className="neo-card rounded-lg px-2.5 py-1.5 text-xs font-medium text-cyan-950">{action.label}</span>
                  <div className={`${action.color} flex h-11 w-11 items-center justify-center rounded-full text-white shadow-lg transition-all duration-200 ease-out group-hover:-translate-y-0.5 group-focus-visible:ring-2 group-focus-visible:ring-cyan-400 motion-reduce:transition-none`}>
                    {action.icon}
                  </div>
                </Link>
              );
            }

            return (
              <button
                key={index}
                type="button"
                className="group flex cursor-pointer items-center gap-2"
                onClick={async () => {
                  await action.onClick();
                  setIsOpen(false);
                }}
                aria-label={action.label}
              >
                <span className="neo-card rounded-lg px-2.5 py-1.5 text-xs font-medium text-cyan-950">{action.label}</span>
                <div className={`${action.color} flex h-11 w-11 items-center justify-center rounded-full text-white shadow-lg transition-all duration-200 ease-out group-hover:-translate-y-0.5 motion-reduce:transition-none`}>
                  {action.icon}
                </div>
              </button>
            );
          })}
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`neo-card flex h-14 w-14 cursor-pointer items-center justify-center rounded-full border border-cyan-200 bg-cyan-600 text-white shadow-2xl transition-all duration-200 ease-out hover:bg-cyan-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 motion-reduce:transition-none ${isOpen ? 'rotate-45' : ''}`}
        aria-label="快捷记录"
      >
        <Plus size={24} />
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 -z-10 bg-cyan-950/25 backdrop-blur-[1px]"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
