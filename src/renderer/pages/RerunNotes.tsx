import { useState, useEffect } from 'react';
import { Plus, Trash2, RefreshCw } from 'lucide-react';

interface Props {
  onRefresh: () => void;
}

export default function RerunNotes({ onRefresh }: Props) {
  const [notes, setNotes] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [loci, setLoci] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ projectId: 0, sampleGroupId: 0, locusId: 0, specimenNumbers: '', rerunDate: '', comment: '' });

  const load = async () => {
    const [n, p, l] = await Promise.all([
      window.api.getRerunNotes(),
      window.api.getProjects(),
      window.api.getLoci(),
    ]);
    setNotes(n);
    setProjects(p);
    setLoci(l);
  };

  useEffect(() => { load(); }, []);

  const loadGroups = async (projectId: number) => {
    if (projectId > 0) {
      const g = await window.api.getGroupsByProject(projectId);
      setGroups(g);
    } else {
      setGroups([]);
    }
  };

  const handleCreate = async () => {
    if (!form.projectId || !form.sampleGroupId || !form.locusId) return;
    await window.api.createRerunNote({
      projectId: form.projectId,
      sampleGroupId: form.sampleGroupId,
      locusId: form.locusId,
      specimenNumbers: form.specimenNumbers || undefined,
      rerunDate: form.rerunDate || undefined,
      comment: form.comment || undefined,
    });
    setForm({ projectId: 0, sampleGroupId: 0, locusId: 0, specimenNumbers: '', rerunDate: '', comment: '' });
    setShowForm(false);
    load();
  };

  const handleDelete = async (id: number) => {
    if (confirm('Удалить запись?')) {
      await window.api.deleteRerunNote(id);
      load();
    }
  };

  return (
    <div className="max-w-5xl space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <RefreshCw size={18} />
          Заметки повторов ПЦР
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm hover:opacity-90 transition-opacity"
        >
          <Plus size={14} />
          Добавить запись
        </button>
      </div>

      {showForm && (
        <div className="bg-card rounded-lg border border-border p-4 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Проект *</label>
              <select
                value={form.projectId}
                onChange={e => {
                  const pid = parseInt(e.target.value);
                  setForm({ ...form, projectId: pid, sampleGroupId: 0 });
                  loadGroups(pid);
                }}
                className="w-full px-3 py-1.5 text-sm rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value={0}>Выбрать...</option>
                {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Выборка *</label>
              <select
                value={form.sampleGroupId}
                onChange={e => setForm({ ...form, sampleGroupId: parseInt(e.target.value) })}
                className="w-full px-3 py-1.5 text-sm rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value={0}>Выбрать...</option>
                {groups.map((g: any) => <option key={g.id} value={g.id}>{g.batch_code}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Локус *</label>
              <select
                value={form.locusId}
                onChange={e => setForm({ ...form, locusId: parseInt(e.target.value) })}
                className="w-full px-3 py-1.5 text-sm rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value={0}>Выбрать...</option>
                {loci.map((l: any) => <option key={l.id} value={l.id}>{l.locus_code}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Номера экземпляров</label>
              <input
                value={form.specimenNumbers}
                onChange={e => setForm({ ...form, specimenNumbers: e.target.value })}
                className="w-full px-3 py-1.5 text-sm rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="1, 5, 12, 33"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Дата повтора</label>
              <input
                type="date"
                value={form.rerunDate}
                onChange={e => setForm({ ...form, rerunDate: e.target.value })}
                className="w-full px-3 py-1.5 text-sm rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Комментарий</label>
              <input
                value={form.comment}
                onChange={e => setForm({ ...form, comment: e.target.value })}
                className="w-full px-3 py-1.5 text-sm rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Заметка..."
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} className="px-4 py-1.5 bg-primary text-primary-foreground rounded text-sm hover:opacity-90">Создать</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-1.5 bg-muted text-foreground rounded text-sm hover:opacity-80">Отмена</button>
          </div>
        </div>
      )}

      {notes.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          Нет записей о повторах.
        </div>
      ) : (
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-3 py-2 text-xs text-muted-foreground font-medium">Проект</th>
                <th className="text-left px-3 py-2 text-xs text-muted-foreground font-medium">Выборка</th>
                <th className="text-left px-3 py-2 text-xs text-muted-foreground font-medium">Локус</th>
                <th className="text-left px-3 py-2 text-xs text-muted-foreground font-medium">Экземпляры</th>
                <th className="text-left px-3 py-2 text-xs text-muted-foreground font-medium">Дата</th>
                <th className="text-left px-3 py-2 text-xs text-muted-foreground font-medium">Комментарий</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {notes.map((n: any) => (
                <tr key={n.id} className="border-b border-border/50 last:border-0">
                  <td className="px-3 py-1.5">{n.project_name}</td>
                  <td className="px-3 py-1.5">{n.batch_code}</td>
                  <td className="px-3 py-1.5 font-mono text-xs">{n.locus_code}</td>
                  <td className="px-3 py-1.5 text-xs">{n.specimen_numbers || '—'}</td>
                  <td className="px-3 py-1.5 text-xs text-muted-foreground">{n.rerun_date || '—'}</td>
                  <td className="px-3 py-1.5 text-xs">{n.comment || '—'}</td>
                  <td className="px-3 py-1.5">
                    <button onClick={() => handleDelete(n.id)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
