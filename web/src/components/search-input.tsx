import { IconSearch } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Input } from './ui/input';

interface Props {
  className?: string;
  type?: React.HTMLInputTypeAttribute;
  placeholder?: string;
  onSearch?: (value: string) => void;
  debounceMs?: number;
}

export function SearchInput({ className = '', type = 'text', placeholder = 'Search', onSearch, debounceMs = 500 }: Props) {
  const [value, setValue] = useState('');
  const [debouncedValue, setDebouncedValue] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [value, debounceMs]);

  useEffect(() => {
    onSearch?.(debouncedValue);
  }, [debouncedValue, onSearch]);

  return (
    <div className={cn('relative flex w-full max-w-sm items-center', className)}>
      <IconSearch aria-hidden="true" className="text-muted-foreground pointer-events-none absolute left-3 size-4 -translate-y-1/2" />

      <Input type={type} value={value} onChange={(e) => setValue(e.target.value)} placeholder={placeholder} className="pl-9" />
    </div>
  );
}
