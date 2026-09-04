import { IconPower } from '@tabler/icons-react';
import type * as React from 'react';
import { cn } from '@/lib/utils';

export type PowerSwitchButtonVariant = 'pill' | 'rocker' | 'round';
export type PowerSwitchButtonSize = 'sm' | 'default' | 'lg';

export interface PowerSwitchButtonProps extends Omit<React.ComponentProps<'button'>, 'onClick' | 'children'> {
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
  variant?: PowerSwitchButtonVariant;
  size?: PowerSwitchButtonSize;
  onLabel?: string;
  offLabel?: string;
}

// `pill` variant's thumb travel distance (= track width - 2*padding - thumb size) has to be a
// concrete Tailwind arbitrary-value class, not something computed at runtime, hence a lookup
// keyed by size instead of measuring the DOM.
const PILL_SIZES: Record<PowerSwitchButtonSize, { track: string; thumb: string; translate: string; text: string }> = {
  sm: { track: 'h-7 w-16 p-1', thumb: 'size-5', translate: 'translate-x-[34px]', text: 'text-[9px]' },
  default: { track: 'h-9 w-20 p-1', thumb: 'size-7', translate: 'translate-x-[44px]', text: 'text-[10px]' },
  lg: { track: 'h-11 w-24 p-1', thumb: 'size-9', translate: 'translate-x-[52px]', text: 'text-xs' },
};

const ROCKER_SIZES: Record<PowerSwitchButtonSize, string> = {
  sm: 'h-7 w-20 text-[10px]',
  default: 'h-9 w-24 text-xs',
  lg: 'h-11 w-28 text-sm',
};

const ROUND_SIZES: Record<PowerSwitchButtonSize, { box: string; icon: string }> = {
  sm: { box: 'size-9', icon: 'h-4 w-4' },
  default: { box: 'size-12', icon: 'h-5 w-5' },
  lg: { box: 'size-16', icon: 'h-7 w-7' },
};

// Shared focus/disabled treatment, matching Button/Switch's own conventions elsewhere in ui/.
const FOCUS_DISABLED = 'outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50';

/**
 * Physical on/off "công tắc" style toggle button — an alternative to the minimal shadcn `Switch`
 * for places where the on/off state should read at a glance (relay/action panels, touch targets
 * on mobile). Built on a plain `<button>` (defaults to `type="button"` so it never submits an
 * enclosing form by accident — always pass `type="button"` explicitly too if you spread other
 * button props that might override it) rather than `SwitchPrimitive.Root`/`input[type=checkbox]`,
 * so it composes like any other button while keeping the same `checked`/`onCheckedChange` shape
 * as `Switch` plus `role="switch"`/`aria-checked` for a11y and native Enter/Space handling.
 *
 * Three visual variants (`variant` prop):
 * - `pill` (default): a large sliding track with the ON/OFF text printed inside the track itself.
 * - `rocker`: two labeled halves side by side, the active half lit — like a physical wall switch.
 * - `round`: a circular power button, lit green when on, for compact/icon-only spots.
 */
export function PowerSwitchButton({
  checked,
  onCheckedChange,
  variant = 'pill',
  size = 'default',
  onLabel = 'ON',
  offLabel = 'OFF',
  disabled,
  className,
  type = 'button',
  ...props
}: PowerSwitchButtonProps) {
  const handleClick = () => {
    if (disabled) return;
    onCheckedChange?.(!checked);
  };

  const shared = {
    type,
    role: 'switch' as const,
    'aria-checked': checked,
    disabled,
    onClick: handleClick,
    'data-slot': 'power-switch-button',
    'data-state': (checked ? 'checked' : 'unchecked') as 'checked' | 'unchecked',
  };

  if (variant === 'round') {
    const s = ROUND_SIZES[size];
    return (
      <button
        {...shared}
        aria-label={checked ? onLabel : offLabel}
        className={cn(
          'inline-flex shrink-0 items-center justify-center rounded-full border shadow-xs transition-colors',
          FOCUS_DISABLED,
          checked ? 'border-transparent bg-green-500 text-white ring-4 ring-green-500/20' : 'bg-muted text-muted-foreground border-input',
          s.box,
          className,
        )}
        {...props}
      >
        <IconPower className={s.icon} />
      </button>
    );
  }

  if (variant === 'rocker') {
    return (
      <button
        {...shared}
        className={cn('inline-flex shrink-0 overflow-hidden rounded-md border font-semibold', FOCUS_DISABLED, ROCKER_SIZES[size], className)}
        {...props}
      >
        <span className={cn('flex flex-1 items-center justify-center transition-colors', checked ? 'bg-green-500 text-white' : 'text-muted-foreground')}>
          {onLabel}
        </span>
        <span
          className={cn('flex flex-1 items-center justify-center border-l transition-colors', !checked ? 'bg-muted text-foreground' : 'text-muted-foreground')}
        >
          {offLabel}
        </span>
      </button>
    );
  }

  // pill
  const s = PILL_SIZES[size];
  return (
    <button
      {...shared}
      className={cn(
        'relative inline-flex shrink-0 items-center rounded-full border border-transparent transition-colors',
        FOCUS_DISABLED,
        checked ? 'bg-green-500' : 'bg-input dark:bg-input/80',
        s.track,
        className,
      )}
      {...props}
    >
      <span
        className={cn(
          'pointer-events-none absolute top-1/2 left-2 -translate-y-1/2 font-bold text-white transition-opacity',
          s.text,
          checked ? 'opacity-100' : 'opacity-0',
        )}
      >
        {onLabel}
      </span>
      <span
        className={cn(
          'text-muted-foreground pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 font-bold transition-opacity',
          s.text,
          checked ? 'opacity-0' : 'opacity-100',
        )}
      >
        {offLabel}
      </span>
      <span
        className={cn('bg-background pointer-events-none block rounded-full shadow-xs ring-0 transition-transform', s.thumb, checked ? s.translate : 'translate-x-0')}
      />
    </button>
  );
}
