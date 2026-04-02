import { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import StatusSelect from '../components/StatusSelect';

interface Props {
  groupId: number;
  projectId: number;
  onNavigate: (route: any) => void;
  onRefresh: () => void;
}

export default function BatchDetail({ groupId, projectId, onNavigate, onRefresh }: Props) {
  const [group, setGroup] = useState<any>(null);
  const [loci, setLoci] = useState<any[]>([]);
  const [saving, setSaving] = useState<number | null>(null);

  const load = async () => {
    const g = await window.api.getGroup(groupId);
    setGroup(g);
    const bl = await window.api.getBatchLoci(groupId);
    setLoci(bl);
  };

  useEffect(() => { load(); }, [groupId]);

  const handleStatusChange = async (blId: number, field: string, value: string) => {
    setSaving(blId);
    await window.api.updateBatchLocus(blId, { [field]: value });
    await load();
    setSaving(null);
  };

  const handleNotesChange = async (blId: number, notes: string) => {
    await window.api.updateBatchLocus(blId, { notes });
  };

  if (!group) return <div className="text-muted-foreground">Загрузка...</div>;

  const readyCount = loci.filter(l => l.ready_for_calculations === 1).length;
  const totalCount = loci.length;
  const allReady = totalCount > 0 && readyCount === totalCount;

  return (
    <div className="max-w-6xl space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => onNavigate({ page: 'project', projectId })}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Выборка: {group.batch_code}</h2>
            {allReady && (
              <span className="flex items-center gap-1 text-xs text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
                <CheckCircle2 size={12} />
                Все готово
              </span>
            )}
          </div>
          <div className="flex gap-4 text-xs text-muted-foreground mt-0.5">
            <span>Экземпляров: {group.planned_specimen_count}{group.actual_specimen_count ? ` (факт: ${group.actual_specimen_count})` : ''}</span>
            <span className={allReady ? 'text-emerald-500 font-medium' : ''}>
              Готово к расчётам: {readyCount}/{totalCount}
            </span>
          </div>
        </div>
      </div>

      {group.notes && (
        <p className="text-xs text-muted-foreground bg-accent/30 rounded px-3 py-1.5">{group.notes}</p>
      )}

      {/* Loci table */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-3 py-2 text-xs text-muted-foreground font-medium w-24">Локус</th>
              <th className="text-left px-3 py-2 text-xs text-muted-foreground font-medium w-24">Темп. отжига</th>
              <th className="text-left px-3 py-2 text-xs text-muted-foreground font-medium w-24">Время фореза</th>
              <th className="text-left px-3 py-2 text-xs text-muted-foreground font-medium w-36">ДНК</th>
              <th className="text-left px-3 py-2 text-xs text-muted-foreground font-medium w-36">ПЦР</th>
              <th className="text-left px-3 py-2 text-xs text-muted-foreground font-medium w-36">Электрофорез</th>
              <th className="text-center px-3 py-2 text-xs text-muted-foreground font-medium w-16">Готово</th>
              <th className="text-left px-3 py-2 text-xs text-muted-foreground font-medium">Прим.</th>
            </tr>
          </thead>
          <tbody>
            {loci.map((bl: any) => {
              const isReady = bl.ready_for_calculations === 1;
              const hasProblem = bl.dna_status === 'problem' || bl.pcr_status === 'problem' || bl.electrophoresis_status === 'problem';
              const hasRepeat = bl.pcr_status === 'pcr_repeat_needed' || bl.electrophoresis_status === 'electrophoresis_repeat_needed';
              const rowBg = isReady
                ? 'bg-emerald-50/50 dark:bg-emerald-900/10'
                : hasProblem
                ? 'bg-red-50/50 dark:bg-red-900/10'
                : hasRepeat
                ? 'bg-amber-50/50 dark:bg-amber-900/10'
                : '';

              return (
                <tr key={bl.id} className={`border-b border-border/50 last:border-0 ${rowBg}`}>
                  <td className="px-3 py-2 font-mono text-xs font-medium">{bl.locus_code}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{bl.annealing_temp_override || bl.ref_temp || '—'}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{bl.electrophoresis_time_override || bl.ref_time || '—'}</td>
                  <td className="px-3 py-2">
                    <StatusSelect
                      value={bl.dna_status}
                      type="dna"
                      onChange={v => handleStatusChange(bl.id, 'dnaStatus', v)}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <StatusSelect
                      value={bl.pcr_status}
                      type="pcr"
                      onChange={v => handleStatusChange(bl.id, 'pcrStatus', v)}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <StatusSelect
                      value={bl.electrophoresis_status}
                      type="electro"
                      onChange={v => handleStatusChange(bl.id, 'electrophoresisStatus', v)}
                    />
                  </td>
                  <td className="px-3 py-2 text-center">
                    {isReady
                      ? <CheckCircle2 size={16} className="text-emerald-500 mx-auto" />
                      : <XCircle size={16} className="text-muted-foreground/30 mx-auto" />
                    }
                  </td>
                  <td className="px-3 py-1">
                    <input
                      defaultValue={bl.notes || ''}
                      onBlur={e => {
                        if (e.target.value !== (bl.notes || '')) {
                          handleNotesChange(bl.id, e.target.value);
                        }
                      }}
                      className="w-full text-xs px-1.5 py-1 rounded border border-transparent hover:border-border focus:border-primary bg-transparent focus:bg-background focus:outline-none"
                      placeholder="—"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Summary at bottom */}
      <div className="flex gap-4 text-xs text-muted-foreground">
        <span>Всего локусов: {totalCount}</span>
        <span className="text-emerald-500">Готово: {readyCount}</span>
        <span className="text-amber-500">Повтор ПЦР: {loci.filter(l => l.pcr_status === 'pcr_repeat_needed').length}</span>
        <span className="text-orange-500">Повтор фореза: {loci.filter(l => l.electrophoresis_status === 'electrophoresis_repeat_needed').length}</span>
        <span className="text-red-500">Проблемы: {loci.filter(l => l.dna_status === 'problem' || l.pcr_status === 'problem' || l.electrophoresis_status === 'problem').length}</span>
      </div>
    </div>
  );
}
