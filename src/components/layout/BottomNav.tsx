import Link from 'next/link';
import { Home, PlusCircle, User } from 'lucide-react';

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 z-50 w-full border-t border-cyan-100/80 bg-white/90 p-3 pb-safe backdrop-blur">
      <div className="mx-auto flex w-full max-w-md justify-around">
        <Link href="/" className="flex min-w-[44px] cursor-pointer flex-col items-center text-cyan-700 transition-colors duration-200 hover:text-cyan-500">
          <Home size={24} />
          <span className="text-xs mt-1">首页</span>
        </Link>
        <Link href="/record" className="flex min-w-[44px] cursor-pointer flex-col items-center text-cyan-700 transition-colors duration-200 hover:text-cyan-500">
          <PlusCircle size={32} className="text-cyan-600" />
        </Link>
        <Link href="/profile" className="flex min-w-[44px] cursor-pointer flex-col items-center text-cyan-700 transition-colors duration-200 hover:text-cyan-500">
          <User size={24} />
          <span className="text-xs mt-1">我的</span>
        </Link>
      </div>
    </nav>
  );
}
