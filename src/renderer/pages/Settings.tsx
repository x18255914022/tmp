import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Save, X, Settings as SettingsIcon } from 'lucide-react';

interface Props {
  onRefresh: () => void;
}

export default function Settings({ onRefresh }: Props) {
  const [loci, setLoci] = useState<any[]>([]);
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ locusCode: '', annealingTemp: '', electrophoresisTime: '', notes: '' });
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ locusCode: '', annealingTemp: '', electrophoresisTime: '', notes: '' });

  const load = () => window.api.getLoci().then(setLoci);
  useEffect(() => { load(); }, []);

  const startEdit = (l: any) => {
    setEditId(l.id);
    setEditForm({
      locusCode: l.locus_code,
      annealingTemp: l.annealing_temp || '',
      electrophoresisTime: l.electrophoresis_time || '',
      notes: l.notes || '',
    });
  };

  const handleSave = async () => {
    if (editId && editForm.locusCode.trim()) {
      await window.api.updateLocus(editId, editForm);
      setEditId(null);
      load();
    }
  };

  const handleAdd = async () => {
    if (addForm.locusCode.trim()) {
      await window.api.createLocus(addForm);
      setAddForm({ locusCode: '', annealingTemp: '', electrophoresisTime: '', notes: '' });
      setShowAdd(false);
      load();
    }
  };

  const handleDelete = async (id: number, code: string) => {
    if (confirm(`Удалить локус «${code}»? Это может повлиять на существующие записи.`)) {
      await window.api.deleteLocus(id);
      load();
    }
  };

  return (
    <div className="max-w-4xl space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <SettingsIcon size={18} />
          Справочник локусов
        </h2>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm hover:opacity-90 transition-opacity"
        >
          <Plus size={14} />
          Добавить локус
        </button>
      </div>

      <p className="text-xs text-muted-foreground">
        Справочник локусов используется при создании выборок. Температура отжига и время электрофореза подставляются автоматически.
      </p>

      {showAdd && (
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="grid grid-cols-4 gap-3">
            <input
              value={addForm.locusCode}
              onChange={e => setAddForm({ ...addForm, locusCode: e.target.value })}
              className="px-3 py-1.5 text-sm rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Код локуса"
            />
            <input
              value={addForm.annealingTemp}
              onChange={e => setAddForm({ ...addForm, annealingTemp: e.target.value })}
              className="px-3 py-1.5 text-sm rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Темп. отжига"
            />
            <input
              value={addForm.electrophoresisTime}
              onChange={e => setAddForm({ ...addForm, electrophoresisTime: e.target.value })}
              className="px-3 py-1.5 text-sm rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Время фореза"
            />
            <div className="flex gap-2">
              <button onClick={handleAdd} className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-sm hover:opacity-90">Добавить</button>
              <button onClick={() => setShowAdd(false)} className="px-3 py-1.5 bg-muted text-foreground rounded text-sm hover:opacity-80">Отмена</button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-3 py-2 text-xs text-muted-foreground font-medium w-32">Код локуса</th>
              <th className="text-left px-3 py-2 text-xs text-muted-foreground font-medium w-36">Темп. отжига</th>
              <th className="text-left px-3 py-2 text-xs text-muted-foreground font-medium w-36">Время электрофореза</th>
              <th className="text-left px-3 py-2 text-xs text-muted-foreground font-medium">Примечания</th>
              <th className="w-20"></th>
            </tr>
          </thead>
          <tbody>
            {loci.map((l: any) => (
              <tr key={l.id} className="border-b border-border/50 last:border-0">
                {editId === l.id ? (
                  <>
                    <td className="px-3 py-1.5">
                      <input value={editForm.locusCode} onChange={e => setEditForm({ ...editForm, locusCode: e.target.value })} className="w-full px-2 py-1 text-sm rounded border border-border bg-background" />
                    </td>
                    <td className="px-3 py-1.5">
                      <input value={editForm.annealingTemp} onChange={e => setEditForm({ ...editForm, annealingTemp: e.target.value })} className="w-full px-2 py-1 text-sm rounded border border-border bg-background" />
                    </td>
                    <td className="px-3 py-1.5">
                      <input value={editForm.electrophoresisTime} onChange={e => setEditForm({ ...editForm, electrophoresisTime: e.target.value })} className="w-full px-2 py-1 text-sm rounded border border-border bg-background" />
                    </td>
                    <td className="px-3 py-1.5">
                      <input value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} className="w-full px-2 py-1 text-sm rounded border border-border bg-background" />
                    </td>
                    <td className="px-3 py-1.5">
                      <div className="flex gap-1">
                        <button onClick={handleSave} className="text-emerald-500 hover:text-emerald-600 p-1"><Save size={14} /></button>
                        <button onClick={() => setEditId(null)} className="text-muted-foreground hover:text-foreground p-1"><X size={14} /></button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-3 py-2 font-mono text-xs font-medium">{l.locus_code}</td>
                    <td className="px-3 py-2 text-muted-foreground">{l.annealing_temp || '—'}</td>
                    <td className="px-3 py-2 text-muted-foreground">{l.electrophoresis_time || '—'}</td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">{l.notes || '—'}</td>
                    <td className="px-3 py-2">
                      <div className="flex gap-1">
                        <button onClick={() => startEdit(l)} className="text-muted-foreground hover:text-primary p-1"><Pencil size={12} /></button>
                        <button onClick={() => handleDelete(l.id, l.locus_code)} className="text-muted-foreground hover:text-destructive p-1"><Trash2 size={12} /></button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
