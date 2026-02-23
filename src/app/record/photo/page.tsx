'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Camera, Loader2, Trash2 } from 'lucide-react';
import { NOCODB_URL } from '@/lib/nocodb';
import { NocoAttachment } from '@/services/recordService';
import { useRecordStore } from '@/store/useRecordStore';

function resolveAttachmentUrl(photo?: NocoAttachment): string | null {
  if (!photo) return null;
  const raw = photo.url ?? photo.signedPath ?? photo.path ?? '';
  if (!raw) return null;
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
  return `${NOCODB_URL}${raw.startsWith('/') ? '' : '/'}${raw}`;
}

export default function PhotoRecordPage() {
  const router = useRouter();
  const today = new Date().toISOString().split('T')[0];
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { weightRecordsByDate, fetchWeightRecordByDate, saveWeightPhoto, removeWeightPhoto, isLoading, error } = useRecordStore();

  useEffect(() => {
    void fetchWeightRecordByDate(today);
  }, [fetchWeightRecordByDate, today]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const currentPhotoUrl = useMemo(
    () => resolveAttachmentUrl(weightRecordsByDate[today]?.photo?.[0]),
    [weightRecordsByDate, today]
  );

  const displayPhoto = previewUrl ?? currentPhotoUrl;

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const onSave = async () => {
    if (!selectedFile) return;
    try {
      await saveWeightPhoto(today, selectedFile);
      router.push('/');
    } catch {
      // Error state is surfaced from store; keep user on current page.
    }
  };

  const onRemove = async () => {
    try {
      await removeWeightPhoto(today);
      setSelectedFile(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
    } catch {
      // Error state is surfaced from store; keep UI state unchanged.
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans pb-24">
      <header className="bg-white p-4 border-b flex items-center gap-4">
        <button onClick={() => router.back()} aria-label="返回">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-bold text-zinc-900">体型照记录</h1>
      </header>

      <main className="p-4 max-w-md mx-auto w-full space-y-4">
        <p className="text-sm text-zinc-500">上传今日体型照，默认仅保留最新一张。</p>
        {error ? <p className="text-sm text-red-500">{error}</p> : null}

        <section className="bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm space-y-4">
          <div className="rounded-xl overflow-hidden border border-zinc-200 bg-zinc-100 h-72 flex items-center justify-center">
            {displayPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={displayPhoto} alt="今日体型照" className="w-full h-full object-cover" />
            ) : (
              <div className="text-zinc-400 text-sm flex flex-col items-center gap-2">
                <Camera size={32} />
                <span>暂无体型照</span>
              </div>
            )}
          </div>

          <label
            htmlFor="daily-photo-input"
            className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 text-white font-semibold cursor-pointer"
          >
            <Camera size={18} />
            选择体型照
          </label>
          <input
            id="daily-photo-input"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onFileChange}
          />

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => void onSave()}
              disabled={!selectedFile || isLoading}
              className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : null}
              保存
            </button>
            <button
              type="button"
              onClick={() => void onRemove()}
              disabled={!currentPhotoUrl || isLoading}
              className="px-4 py-3 border border-zinc-200 text-zinc-600 rounded-xl disabled:opacity-50 inline-flex items-center justify-center"
              aria-label="移除体型照"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
