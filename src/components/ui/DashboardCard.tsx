import { ReactNode } from 'react';

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  description?: string;
  trend?: string;
}

export function DashboardCard({ title, value, icon, description, trend }: DashboardCardProps) {
  return (
    <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-white/60 p-6 flex flex-col justify-between transition-all hover:shadow-xl hover:-translate-y-1 cursor-default group shadow-indigo-100/10">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{title}</h3>
        <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl group-hover:bg-white transition-colors shadow-inner">
          {icon}
        </div>
      </div>
      <div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-black text-slate-900 tracking-tight">{value}</span>
        </div>
        {trend && (
          <div className={`mt-2 flex items-center text-[10px] font-black uppercase tracking-wider ${trend.includes('⚠️') ? 'text-orange-500' : 'text-emerald-500'}`}>
            {trend}
          </div>
        )}
      </div>
      {description && <p className="text-[10px] text-slate-400 mt-3 font-bold italic line-clamp-1">{description}</p>}
    </div>
  )
}
