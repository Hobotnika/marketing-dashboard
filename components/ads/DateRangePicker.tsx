'use client';

interface DateRange {
  start: Date | null;
  end: Date | null;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

export default function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const subDays = (date: Date, days: number) => {
    const result = new Date(date);
    result.setDate(result.getDate() - days);
    return result;
  };

  const presets = [
    {
      label: 'All Time',
      getValue: () => ({ start: null, end: null }),
    },
    {
      label: 'Last 7 Days',
      getValue: () => ({ start: subDays(new Date(), 7), end: new Date() }),
    },
    {
      label: 'Last 30 Days',
      getValue: () => ({ start: subDays(new Date(), 30), end: new Date() }),
    },
    {
      label: 'Last 90 Days',
      getValue: () => ({ start: subDays(new Date(), 90), end: new Date() }),
    },
  ];

  const isActive = (preset: typeof presets[0]) => {
    const presetRange = preset.getValue();
    if (!presetRange.start && !value.start) return true;
    if (!presetRange.start || !value.start) return false;

    const presetStart = presetRange.start.toDateString();
    const valueStart = value.start.toDateString();
    return presetStart === valueStart;
  };

  return (
    <div className="flex flex-wrap gap-2">
      {presets.map((preset) => (
        <button
          key={preset.label}
          onClick={() => onChange(preset.getValue())}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
            isActive(preset)
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-700'
          }`}
        >
          {preset.label}
        </button>
      ))}
    </div>
  );
}
