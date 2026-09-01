import { Toaster as Sonner, type ToasterProps } from 'sonner';
import { useTheme } from '@/context/theme-context';

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group [&_div[data-content]]:w-full"
      // Without richColors, every toast.<type>() renders in the same neutral --normal-* colors
      // below — success/warning/error/info become visually indistinguishable. This turns on
      // sonner's built-in per-type palette (it already tracks the `theme` prop above for
      // light/dark), so e.g. the live-alert `toast.warning(...)` (see notifications-listener.tsx)
      // actually reads as a warning instead of a plain message.
      richColors
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
