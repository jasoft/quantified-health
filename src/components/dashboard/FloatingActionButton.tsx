'use client';

import React, { useMemo, useState } from 'react';
import { Plus, Coffee, Utensils, Moon, Dumbbell, Droplet, Scale, Camera } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
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
  const today = format(new Date(), 'yyyy-MM-dd');

  const actions = useMemo<(LinkAction | ButtonAction)[]>(
    () => [
      { kind: 'link', icon: <Coffee size={20} />, label: '早餐', href: '/record/food?type=breakfast', color: 'bg-orange-400' },
      { kind: 'link', icon: <Utensils size={20} />, label: '午餐', href: '/record/food?type=lunch', color: 'bg-green-400' },
      { kind: 'link', icon: <Utensils size={20} />, label: '晚餐', href: '/record/food?type=dinner', color: 'bg-blue-400' },
      { kind: 'link', icon: <Moon size={20} />, label: '加餐', href: '/record/food?type=snack', color: 'bg-purple-400' },
      { kind: 'link', icon: <Dumbbell size={20} />, label: '运动', href: '/record/exercise', color: 'bg-red-400' },
      { kind: 'link', icon: <Droplet size={20} />, label: '饮水', href: '/record/water', color: 'bg-cyan-500' },
      { kind: 'link', icon: <Scale size={20} />, label: '体重', href: '/record/weight', color: 'bg-slate-600' },
      { kind: 'link', icon: <Camera size={20} />, label: '体型照', href: '/record/photo', color: 'bg-indigo-500' },
    ],
    []
  );

  return (
    <div className="fixed bottom-24 right-6 z-50">
      {isOpen && (
        <div className="absolute bottom-16 right-0 flex flex-col gap-3 items-end">
          {actions.map((action, index) => {
            if (action.kind === 'link') {
              return (
                <Link
                  key={index}
                  href={action.href}
                  className="flex items-center gap-2 group"
                  onClick={() => setIsOpen(false)}
                  aria-label={action.label}
                >
                  <span className="bg-white px-2 py-1 rounded text-xs font-medium shadow-md text-gray-700 whitespace-nowrap">{action.label}</span>
                  <div className={`${action.color} text-white p-3 rounded-full shadow-lg active:scale-90 transition-transform`}>
                    {action.icon}
                  </div>
                </Link>
              );
            }

            return (
              <button
                key={index}
                type="button"
                className="flex items-center gap-2 group"
                onClick={async () => {
                  await action.onClick();
                  setIsOpen(false);
                }}
                aria-label={action.label}
              >
                <span className="bg-white px-2 py-1 rounded text-xs font-medium shadow-md text-gray-700">{action.label}</span>
                <div className={`${action.color} text-white p-3 rounded-full shadow-lg active:scale-90 transition-transform`}>
                  {action.icon}
                </div>
              </button>
            );
          })}
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`bg-blue-600 text-white p-4 rounded-full shadow-2xl transition-transform active:scale-90 ${isOpen ? 'rotate-45' : ''}`}
        aria-label="快捷记录"
      >
        <Plus size={24} />
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 -z-10"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
