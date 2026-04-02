interface Props {
  status: string;
  type?: 'dna' | 'pcr' | 'electro' | 'repeat';
}

const labelMap: Record<string, string> = {
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

const colorMap: Record<string, string> = {
  not_started: 'bg-muted text-muted-foreground',
  completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  pcr_repeat_needed: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  pcr_repeat_performed: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  electrophoresis_repeat_needed: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  electrophoresis_repeat_performed: 'bg-orange-200 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
  NONE: 'bg-muted text-muted-foreground',
  PCR_REPEAT_NEEDED: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  PCR_REPEAT_PERFORMED: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  ELECTROPHORESIS_REPEAT_NEEDED: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  ELECTROPHORESIS_REPEAT_PERFORMED: 'bg-orange-200 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
  problem: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export default function StatusBadge({ status }: Props) {
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${colorMap[status] || 'bg-muted text-muted-foreground'}`}>
      {labelMap[status] || status}
    </span>
  );
}
