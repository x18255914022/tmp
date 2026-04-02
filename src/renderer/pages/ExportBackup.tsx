import { useState } from 'react';
import { Download, Upload, Database, FileSpreadsheet } from 'lucide-react';

interface Props {
  onRefresh: () => void;
}

// Status label translation for export
const statusLabels: Record<string, string> = {
  not_started: 'Не начато',
  completed: 'Выполнено',
  pcr_repeat_needed: 'Повтор ПЦР нужен',
  pcr_repeat_performed: 'Повтор ПЦР выполнен',
  electrophoresis_repeat_needed: 'Повтор фореза нужен',
  electrophoresis_repeat_performed: 'Повтор фореза выполнен',
  NONE: 'Нет',
  PCR_REPEAT_NEEDED: 'ПЦР: нужен повтор',
  PCR_REPEAT_PERFORMED: 'ПЦР: повтор выполнен',
  ELECTROPHORESIS_REPEAT_NEEDED: 'Форез: нужен повтор',
  ELECTROPHORESIS_REPEAT_PERFORMED: 'Форез: повтор выполнен',
  problem: 'Проблема',
};

export default function ExportBackup({ onRefresh }: Props) {
  const [msg, setMsg] = useState('');

  const handleExport = async () => {
    try {
      const filePath = await window.api.chooseExportFile();
      if (!filePath) return;

      const data = await window.api.getExportData();

      // We'll create the XLSX content in the main process
      // For now, send the data via IPC — but we need to use xlsx library in renderer
      // Since xlsx is a pure JS library, we can use it in renderer too
      const XLSX = await import('xlsx');

      const rows = data.map((r: any) => ({
        'Проект': r.project_name,
        'Выборка': r.batch_code,
        'Локус': r.locus_code,
        'Темп. отжига': r.annealing_temp || '',
        'Время фореза': r.electrophoresis_time || '',
        'ДНК': statusLabels[r.dna_status] || r.dna_status,
        'ПЦР': statusLabels[r.pcr_status] || r.pcr_status,
        'Электрофорез': statusLabels[r.electrophoresis_status] || r.electrophoresis_status,
        'Тип повтора': statusLabels[r.repeat_type] || r.repeat_type,
        'Готово к расчётам': r.ready_for_calculations ? 'Да' : 'Нет',
        'Примечания': r.notes || '',
        'Обновлено': r.updated_at || '',
      }));

      const ws = XLSX.utils.json_to_sheet(rows);
      // Set column widths
      ws['!cols'] = [
        { wch: 20 }, { wch: 15 }, { wch: 10 }, { wch: 14 }, { wch: 14 },
        { wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 16 }, { wch: 25 }, { wch: 20 },
      ];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Статусы');
      XLSX.writeFile(wb, filePath);

      setMsg(`Экспорт сохранён: ${filePath}`);
    } catch (err: any) {
      setMsg(`Ошибка экспорта: ${err.message}`);
    }
  };

  const handleBackup = async () => {
    const path = await window.api.backupSave();
    if (path) {
      setMsg(`Бэкап сохранён: ${path}`);
    }
  };

  const handleRestore = async () => {
    if (!confirm('Восстановить базу данных из файла? Текущие данные будут заменены.')) return;
    const ok = await window.api.backupRestore();
    if (ok) {
      setMsg('База данных восстановлена. Перезапустите приложение.');
      onRefresh();
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <Download size={18} />
        Экспорт и резервное копирование
      </h2>

      {/* Export */}
      <div className="bg-card rounded-lg border border-border p-5 space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <FileSpreadsheet size={16} className="text-emerald-500" />
          Экспорт в Excel
        </h3>
        <p className="text-xs text-muted-foreground">
          Экспортирует все записи «выборка × локус» со статусами в файл .xlsx.
          Файл совместим с Excel, LibreOffice Calc и Google Sheets.
        </p>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:opacity-90 transition-opacity"
        >
          <FileSpreadsheet size={14} />
          Экспортировать
        </button>
      </div>

      {/* Backup */}
      <div className="bg-card rounded-lg border border-border p-5 space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Database size={16} className="text-blue-500" />
          Резервное копирование
        </h3>
        <p className="text-xs text-muted-foreground">
          Создаёт полную копию базы данных SQLite. Для восстановления выберите ранее сохранённый файл .db.
        </p>
        <div className="flex gap-3">
          <button
            onClick={handleBackup}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:opacity-90 transition-opacity"
          >
            <Download size={14} />
            Сохранить бэкап
          </button>
          <button
            onClick={handleRestore}
            className="flex items-center gap-2 px-4 py-2 bg-muted text-foreground rounded-md text-sm hover:opacity-80 transition-opacity"
          >
            <Upload size={14} />
            Восстановить
          </button>
        </div>
      </div>

      {msg && (
        <div className="bg-accent/50 rounded-lg px-4 py-2 text-sm text-accent-foreground">
          {msg}
        </div>
      )}
    </div>
  );
}
