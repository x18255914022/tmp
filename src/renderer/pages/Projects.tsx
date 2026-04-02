import { useState, useEffect } from 'react';
import { Plus, Trash2, FolderOpen, ChevronRight } from 'lucide-react';

interface Props {
  onNavigate: (route: any) => void;
  onRefresh: () => void;
}

export default function Projects({ onNavigate, onRefresh }: Props) {
  const [projects, setProjects] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', projectType: '', priority: 'средний', defaultBatchSize: 48 });

  const load = () => window.api.getProjects().then(setProjects);
  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    await window.api.createProject(form);
    setForm({ name: '', description: '', projectType: '', priority: 'средний', defaultBatchSize: 48 });
    setShowForm(false);
    load();
  };

  const handleDelete = async (id: number, name: string) => {
    if (confirm(`Удалить проект «${name}» и все его данные?`)) {
      await window.api.deleteProject(id);
      load();
    }
  };

  return (
    <div className="max-w-4xl space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Проекты</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm hover:opacity-90 transition-opacity"
        >
          <Plus size={14} />
          Новый проект
        </button>
      </div>

      {showForm && (
        <div className="bg-card rounded-lg border border-border p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Название *</label>
              <input
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-1.5 text-sm rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Название проекта"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Тип</label>
              <input
                value={form.projectType}
                onChange={e => setForm({ ...form, projectType: e.target.value })}
                className="w-full px-3 py-1.5 text-sm rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Промысловая, научная..."
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Приоритет</label>
              <select
                value={form.priority}
                onChange={e => setForm({ ...form, priority: e.target.value })}
                className="w-full px-3 py-1.5 text-sm rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="высокий">Высокий</option>
                <option value="средний">Средний</option>
                <option value="низкий">Низкий</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Размер выборки</label>
              <input
                type="number"
                value={form.defaultBatchSize}
                onChange={e => setForm({ ...form, defaultBatchSize: parseInt(e.target.value) || 48 })}
                className="w-full px-3 py-1.5 text-sm rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Описание</label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-1.5 text-sm rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary h-16 resize-none"
              placeholder="Описание проекта..."
            />
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} className="px-4 py-1.5 bg-primary text-primary-foreground rounded text-sm hover:opacity-90">Создать</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-1.5 bg-muted text-foreground rounded text-sm hover:opacity-80">Отмена</button>
          </div>
        </div>
      )}

      {projects.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FolderOpen size={32} className="mx-auto mb-3 opacity-40" />
          <p>Пока нет проектов.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {projects.map((p: any) => (
            <div
              key={p.id}
              className="bg-card rounded-lg border border-border p-4 flex items-center gap-4 hover:bg-accent/30 transition-colors cursor-pointer group"
              onClick={() => onNavigate({ page: 'project', projectId: p.id })}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{p.name}</span>
                  {p.priority === 'высокий' && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">высокий</span>}
                  {p.project_type && <span className="text-[10px] text-muted-foreground">({p.project_type})</span>}
                </div>
                {p.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{p.description}</p>}
                <div className="flex gap-4 mt-1.5 text-xs text-muted-foreground">
                  <span>Выборок: {p.batch_count}</span>
                  <span className="text-emerald-500">Готово: {p.ready_bl}/{p.total_bl}</span>
                  {p.problem_bl > 0 && <span className="text-amber-500">Проблемы: {p.problem_bl}</span>}
                </div>
              </div>
              <button
                onClick={e => { e.stopPropagation(); handleDelete(p.id, p.name); }}
                className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity p-1"
              >
                <Trash2 size={14} />
              </button>
              <ChevronRight size={16} className="text-muted-foreground" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
