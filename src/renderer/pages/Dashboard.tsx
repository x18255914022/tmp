import { useState, useEffect } from 'react';
import { BarChart3, CheckCircle2, AlertTriangle, Clock, PauseCircle } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';

interface Props {
  onNavigate: (route: any) => void;
}

function StatCard({ label, value, total, icon: Icon, color }: { label: string; value: number; total: number; icon: any; color: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="bg-card rounded-lg border border-border p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground">{label}</span>
        <Icon size={14} className={color} />
      </div>
      <div className="text-2xl font-bold">{value}<span className="text-sm text-muted-foreground font-normal"> / {total}</span></div>
      <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full ${color.replace('text-', 'bg-')}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="text-[10px] text-muted-foreground mt-1">{pct}%</div>
    </div>
  );
}

export default function Dashboard({ onNavigate }: Props) {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    window.api.getDashboardStats().then(setStats);
  }, []);

  if (!stats) return <div className="text-muted-foreground">Загрузка...</div>;

  const { totalProjects, totalBatches, totalBl, dnaCompleted, pcrCompleted, pcrRepeat, electroCompleted, electroRepeat, ready, problems, partialCount, problemList, readyList } = stats;

  return (
    <div className="max-w-5xl space-y-6">
      <h2 className="text-lg font-semibold">Панель управления</h2>

      {/* Summary numbers */}
      <div className="flex gap-4 text-sm">
        <div className="bg-card rounded-lg border border-border px-4 py-3">
          <div className="text-muted-foreground text-xs">Проектов</div>
          <div className="text-xl font-bold">{totalProjects}</div>
        </div>
        <div className="bg-card rounded-lg border border-border px-4 py-3">
          <div className="text-muted-foreground text-xs">Выборок</div>
          <div className="text-xl font-bold">{totalBatches}</div>
        </div>
        <div className="bg-card rounded-lg border border-border px-4 py-3">
          <div className="text-muted-foreground text-xs">Выборка × локус</div>
          <div className="text-xl font-bold">{totalBl}</div>
        </div>
      </div>

      {/* Progress cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="ДНК выполнено" value={dnaCompleted} total={totalBl} icon={BarChart3} color="text-blue-500" />
        <StatCard label="ПЦР выполнено" value={pcrCompleted} total={totalBl} icon={BarChart3} color="text-violet-500" />
        <StatCard label="Форез выполнено" value={electroCompleted} total={totalBl} icon={BarChart3} color="text-indigo-500" />
        <StatCard label="Готово к расчётам" value={ready} total={totalBl} icon={CheckCircle2} color="text-emerald-500" />
      </div>

      {/* Repeat/problem counts */}
      <div className="flex gap-4 text-sm">
        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/20 rounded-lg px-3 py-2 border border-slate-200 dark:border-slate-800">
          <PauseCircle size={14} className="text-slate-500" />
          <span>Не начато / частично: <strong>{partialCount}</strong></span>
        </div>
        <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-2 border border-amber-200 dark:border-amber-800">
          <AlertTriangle size={14} className="text-amber-500" />
          <span>Повтор ПЦР: <strong>{pcrRepeat}</strong></span>
        </div>
        <div className="flex items-center gap-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg px-3 py-2 border border-orange-200 dark:border-orange-800">
          <AlertTriangle size={14} className="text-orange-500" />
          <span>Повтор фореза: <strong>{electroRepeat}</strong></span>
        </div>
        <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2 border border-red-200 dark:border-red-800">
          <AlertTriangle size={14} className="text-red-500" />
          <span>Проблемы: <strong>{problems}</strong></span>
        </div>
      </div>

      {/* Problem list */}
      {problemList.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
            <AlertTriangle size={14} className="text-amber-500" />
            Требуют внимания
          </h3>
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-3 py-2 text-xs text-muted-foreground font-medium">Проект</th>
                  <th className="text-left px-3 py-2 text-xs text-muted-foreground font-medium">Выборка</th>
                  <th className="text-left px-3 py-2 text-xs text-muted-foreground font-medium">Локус</th>
                  <th className="text-left px-3 py-2 text-xs text-muted-foreground font-medium">ДНК</th>
                  <th className="text-left px-3 py-2 text-xs text-muted-foreground font-medium">ПЦР</th>
                  <th className="text-left px-3 py-2 text-xs text-muted-foreground font-medium">Форез</th>
                  <th className="text-left px-3 py-2 text-xs text-muted-foreground font-medium">Тип повтора</th>
                </tr>
              </thead>
              <tbody>
                {problemList.map((row: any) => (
                  <tr key={row.id} className="border-b border-border/50 last:border-0">
                    <td className="px-3 py-1.5">{row.project_name}</td>
                    <td className="px-3 py-1.5">{row.batch_code}</td>
                    <td className="px-3 py-1.5 font-mono text-xs">{row.locus_code}</td>
                    <td className="px-3 py-1.5"><StatusBadge status={row.dna_status} type="dna" /></td>
                    <td className="px-3 py-1.5"><StatusBadge status={row.pcr_status} type="pcr" /></td>
                    <td className="px-3 py-1.5"><StatusBadge status={row.electrophoresis_status} type="electro" /></td>
                    <td className="px-3 py-1.5"><StatusBadge status={row.repeat_type} type="repeat" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Ready list */}
      {readyList.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-emerald-500" />
            Готовы к расчётам ({readyList.length})
          </h3>
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-3 py-2 text-xs text-muted-foreground font-medium">Проект</th>
                  <th className="text-left px-3 py-2 text-xs text-muted-foreground font-medium">Выборка</th>
                  <th className="text-left px-3 py-2 text-xs text-muted-foreground font-medium">Локус</th>
                </tr>
              </thead>
              <tbody>
                {readyList.map((row: any) => (
                  <tr key={row.id} className="border-b border-border/50 last:border-0">
                    <td className="px-3 py-1.5">{row.project_name}</td>
                    <td className="px-3 py-1.5">{row.batch_code}</td>
                    <td className="px-3 py-1.5 font-mono text-xs">{row.locus_code}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {totalBl === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Clock size={32} className="mx-auto mb-3 opacity-40" />
          <p>Пока нет данных. Создайте проект и добавьте выборки.</p>
          <button
            onClick={() => onNavigate({ page: 'projects' })}
            className="mt-3 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:opacity-90 transition-opacity"
          >
            Перейти к проектам
          </button>
        </div>
      )}
    </div>
  );
}
