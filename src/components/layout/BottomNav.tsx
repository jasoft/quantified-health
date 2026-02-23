import Link from 'next/link';
import { Home, PlusCircle, User } from 'lucide-react';

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 w-full bg-white border-t border-gray-200 flex justify-around p-3 pb-safe z-50">
      <Link href="/" className="flex flex-col items-center text-gray-500 hover:text-blue-500">
        <Home size={24} />
        <span className="text-xs mt-1">首页</span>
      </Link>
      <Link href="/record" className="flex flex-col items-center text-gray-500 hover:text-blue-500">
        <PlusCircle size={32} className="text-blue-500" />
      </Link>
      <Link href="/profile" className="flex flex-col items-center text-gray-500 hover:text-blue-500">
        <User size={24} />
        <span className="text-xs mt-1">我的</span>
      </Link>
    </nav>
  );
}
