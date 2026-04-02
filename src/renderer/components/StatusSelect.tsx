interface Props {
  value: string;
  type: 'dna' | 'pcr' | 'electro';
  onChange: (val: string) => void;
}

const dnaOptions = [
  { value: 'not_started', label: 'Не начато' },
  { value: 'completed', label: 'Выполнено' },
  { value: 'problem', label: 'Проблема' },
];

const pcrOptions = [
  { value: 'not_started', label: 'Не начато' },
  { value: 'completed', label: 'Выполнено' },
  { value: 'pcr_repeat_needed', label: 'Повтор ПЦР нужен' },
  { value: 'pcr_repeat_performed', label: 'Повтор ПЦР выполнен' },
  { value: 'problem', label: 'Проблема' },
];

const electroOptions = [
  { value: 'not_started', label: 'Не начато' },
  { value: 'completed', label: 'Выполнено' },
  { value: 'electrophoresis_repeat_needed', label: 'Повтор фореза нужен' },
  { value: 'electrophoresis_repeat_performed', label: 'Повтор фореза выполнен' },
  { value: 'problem', label: 'Проблема' },
];

const colorMap: Record<string, string> = {
  not_started: '',
  completed: 'text-emerald-600 dark:text-emerald-400',
  pcr_repeat_needed: 'text-amber-600 dark:text-amber-400',
  pcr_repeat_performed: 'text-yellow-700 dark:text-yellow-300',
  electrophoresis_repeat_needed: 'text-orange-600 dark:text-orange-400',
  electrophoresis_repeat_performed: 'text-orange-700 dark:text-orange-300',
  problem: 'text-red-600 dark:text-red-400',
};

export default function StatusSelect({ value, type, onChange }: Props) {
  const options = type === 'dna' ? dnaOptions : type === 'pcr' ? pcrOptions : electroOptions;

  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className={`block w-full text-xs rounded border border-border bg-background px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-primary ${colorMap[value] || ''}`}
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
}
