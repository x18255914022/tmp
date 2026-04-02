interface Props {
  status: string;
  type: 'dna' | 'pcr' | 'electro';
}

const labels: Record<string, string> = {
  not_started: 'Не начато',
  completed: 'Выполнено',
  pcr_repeat_needed: 'Повтор ПЦР',
  electrophoresis_repeat_needed: 'Повтор фореза',
  problem: 'Проблема',
};

const colors: Record<string, string> = {
  not_started: 'bg-muted text-muted-foreground',
  completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  pcr_repeat_needed: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  electrophoresis_repeat_needed: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  problem: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export default function StatusBadge({ status }: Props) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${colors[status] || colors.not_started}`}>
      {labels[status] || status}
    </span>
  );
}
