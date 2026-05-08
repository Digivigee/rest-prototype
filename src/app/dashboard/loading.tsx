import React from 'react';
import { Loader2 } from 'lucide-react';

export default function DashboardLoading() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in duration-500">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-indigo-600 animate-pulse" />
        </div>
      </div>
      <h2 className="mt-6 text-lg font-black text-slate-800 tracking-tight">Loading Data...</h2>
      <p className="mt-2 text-sm font-medium text-slate-500">Please wait while we fetch your dashboard.</p>
    </div>
  );
}
