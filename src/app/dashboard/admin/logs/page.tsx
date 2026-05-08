import { getRecentLogs } from '../actions'
import { History, Search, FileText, Calendar, User } from 'lucide-react'

export default async function LogsPage() {
  const logs = await getRecentLogs()

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">System Logs</h1>
          <p className="text-slate-500 mt-1 font-medium">Audit trail of critical system actions and events.</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-2xl border border-slate-100 flex items-center gap-3 shadow-sm text-xs font-black text-slate-500 uppercase tracking-widest">
          <History className="w-4 h-4 text-indigo-500" /> Real-time Audit
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {logs.length === 0 ? (
          <div className="p-20 text-center flex flex-col items-center">
            <FileText className="w-12 h-12 text-slate-200 mb-4" />
            <p className="text-slate-500 font-medium">No activity logs recorded yet.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="text-left px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Timestamp</th>
                <th className="text-left px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</th>
                <th className="text-left px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Details</th>
                <th className="text-right px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Target ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Calendar className="w-3.5 h-3.5" />
                      <span className="text-xs font-bold">{new Date(log.createdAt).toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase border ${
                      log.action.startsWith('UPDATE') ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 
                      'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <p className="text-sm font-medium text-slate-700">{log.details}</p>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <span className="text-[10px] font-mono text-slate-400 uppercase">
                      {log.restaurantId?.slice(-12) || 'SYSTEM'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
