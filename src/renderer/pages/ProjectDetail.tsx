import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, ChevronRight, CheckCircle2 } from 'lucide-react';

interface Props {
  projectId: number;
  onNavigate: (route: any) => void;
  onRefresh: () => void;
}

export default function ProjectDetail({ projectId, onNavigate, onRefresh }: Props) {
  const [project, setProject] = useState<any>(null);
  const [groups, setGroups] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ batchCode: '', plannedSpecimenCount: 48, notes: '' });

  const load = async () => {
    const p = await window.api.getProject(projectId);
    setProject(p);
    const g = await window.api.getGroupsByProject(projectId);
    setGroups(g);
  };

  useEffect(() => { load(); }, [projectId]);

  const handleCreate = async () => {
    if (!form.batchCode.trim()) return;
    await window.api.createGroup({
      projectId,
      batchCode: form.batchCode,
      plannedSpecimenCount: form.plannedSpecimenCount,
      notes: form.notes || undefined,
    });
    setForm({ batchCode: '', plannedSpecimenCount: 48, notes: '' });
    setShowForm(false);
    load();
  };

  const handleDelete = async (id: number, code: string) => {
    if (confirm(`Удалить выборку «${code}» и все связанные данные?`)) {
      await window.api.deleteGroup(id);
      load();
    }
  };

  if (!project) return <div className="text-muted-foreground">Загрузка...</div>;

  return (
    <div className="max-w-5xl space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => onNavigate({ page: 'projects' })}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h2 className="text-lg font-semibold">{project.name}</h2>
          <div className="flex gap-3 text-xs text-muted-foreground">
            {project.project_type && <span>{project.project_type}</span>}
            <span>Приоритет: {project.priority}</span>
            <span>Размер выборки: {project.default_batch_size}</span>
          </div>
        </div>
      </div>

      {project.description && (
        <p className="text-sm text-muted-foreground">{project.description}</p>
      )}

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Выборки ({groups.length})</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm hover:opacity-90 transition-opacity"
        >
          <Plus size={14} />
          Добавить выборку
        </button>
      </div>

      {showForm && (
        <div className="bg-card rounded-lg border border-border p-4 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Код выборки *</label>
              <input
                value={form.batchCode}
                onChange={e => setForm({ ...form, batchCode: e.target.value })}
                className="w-full px-3 py-1.5 text-sm rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Например: 01-01"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Экземпляров (план)</label>
              <input
                type="number"
                value={form.plannedSpecimenCount}
                onChange={e => setForm({ ...form, plannedSpecimenCount: parseInt(e.target.value) || 48 })}
                className="w-full px-3 py-1.5 text-sm rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Примечания</label>
              <input
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                className="w-full px-3 py-1.5 text-sm rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Заметки..."
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} className="px-4 py-1.5 bg-primary text-primary-foreground rounded text-sm hover:opacity-90">Создать</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-1.5 bg-muted text-foreground rounded text-sm hover:opacity-80">Отмена</button>
          </div>
          <p className="text-[10px] text-muted-foreground">При создании выборки автоматически создаются записи для всех 10 локусов из справочника.</p>
        </div>
      )}

      {groups.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          Нет выборок в этом проекте.
        </div>
      ) : (
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-3 py-2 text-xs text-muted-foreground font-medium">Выборка</th>
                <th className="text-left px-3 py-2 text-xs text-muted-foreground font-medium">Экз.</th>
                <th className="text-left px-3 py-2 text-xs text-muted-foreground font-medium">Локусов</th>
                <th className="text-left px-3 py-2 text-xs text-muted-foreground font-medium">Не начато</th>
                <th className="text-left px-3 py-2 text-xs text-muted-foreground font-medium">Повтор ПЦР</th>
                <th className="text-left px-3 py-2 text-xs text-muted-foreground font-medium">Повтор фореза</th>
                <th className="text-left px-3 py-2 text-xs text-muted-foreground font-medium">Проблемы</th>
                <th className="text-left px-3 py-2 text-xs text-muted-foreground font-medium">Готово</th>
                <th className="w-16"></th>
              </tr>
            </thead>
            <tbody>
              {groups.map((g: any) => {
                const allReady = g.total_loci > 0 && g.ready_loci === g.total_loci;
                return (
                  <tr
                    key={g.id}
                    className="border-b border-border/50 last:border-0 hover:bg-accent/20 cursor-pointer transition-colors"
                    onClick={() => onNavigate({ page: 'batch', groupId: g.id, projectId })}
                  >
                    <td className="px-3 py-2 font-medium">
                      <div className="flex items-center gap-1.5">
                        {allReady && <CheckCircle2 size={12} className="text-emerald-500" />}
                        {g.batch_code}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{g.planned_specimen_count}</td>
                    <td className="px-3 py-2">{g.total_loci}</td>
                    <td className="px-3 py-2 text-muted-foreground">{g.not_started_loci}</td>
                    <td className="px-3 py-2">{g.pcr_repeat_loci > 0 ? <span className="text-amber-500 font-medium">{g.pcr_repeat_loci}</span> : '—'}</td>
                    <td className="px-3 py-2">{g.electro_repeat_loci > 0 ? <span className="text-orange-500 font-medium">{g.electro_repeat_loci}</span> : '—'}</td>
                    <td className="px-3 py-2">{g.problem_loci > 0 ? <span className="text-red-500 font-medium">{g.problem_loci}</span> : '—'}</td>
                    <td className="px-3 py-2">
                      <span className={allReady ? 'text-emerald-500 font-semibold' : ''}>{g.ready_loci}/{g.total_loci}</span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={e => { e.stopPropagation(); handleDelete(g.id, g.batch_code); }}
                          className="text-muted-foreground hover:text-destructive p-1 opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={12} />
                        </button>
                        <ChevronRight size={14} className="text-muted-foreground" />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
