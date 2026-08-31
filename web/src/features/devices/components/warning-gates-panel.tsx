import { IconLoader2 } from '@tabler/icons-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useIsGuest } from '@/hooks/use-is-guest';
import { getResponseMessage } from '@/lib/response-codes';
import { cn } from '@/lib/utils';
import { useUpdateDeviceConfigMutation } from '../api/queries';
import type { IDeviceWarningThreshold, ITelemetryFieldDefinition, NotificationChannel } from '../api/types';
import { NOTIFICATION_CHANNEL_OPTIONS } from '../api/types';

interface Props {
  deviceId: string;
  telemetrySchema: ITelemetryFieldDefinition[] | null | undefined;
  warningOverrides: Record<string, IDeviceWarningThreshold> | null | undefined;
}

/** Local editable draft for one telemetry field's warning gate row. */
interface FieldDraft {
  min: string;
  max: string;
  enabled: boolean;
  channels: NotificationChannel[];
}

function draftFromOverride(field: ITelemetryFieldDefinition, override: IDeviceWarningThreshold | undefined): FieldDraft {
  const hasRange = override?.min !== undefined || override?.max !== undefined || field.warningMin !== undefined || field.warningMax !== undefined;

  return {
    min: override?.min !== undefined ? String(override.min) : '',
    max: override?.max !== undefined ? String(override.max) : '',
    enabled: override?.enabled ?? hasRange,
    channels: override?.channels ?? [],
  };
}

function GateRow({
  field,
  override,
  deviceId,
  warningOverrides,
}: {
  field: ITelemetryFieldDefinition;
  override: IDeviceWarningThreshold | undefined;
  deviceId: string;
  warningOverrides: Record<string, IDeviceWarningThreshold> | null | undefined;
}) {
  const updateConfig = useUpdateDeviceConfigMutation();
  const isGuest = useIsGuest();
  const [draft, setDraft] = useState<FieldDraft>(() => draftFromOverride(field, override));

  const toggleChannel = (channel: NotificationChannel) => {
    setDraft((prev) => ({
      ...prev,
      channels: prev.channels.includes(channel) ? prev.channels.filter((c) => c !== channel) : [...prev.channels, channel],
    }));
  };

  const handleSave = async () => {
    const nextThreshold: IDeviceWarningThreshold = {
      enabled: draft.enabled,
      min: draft.min === '' ? undefined : Number(draft.min),
      max: draft.max === '' ? undefined : Number(draft.max),
      channels: draft.channels.length > 0 ? draft.channels : undefined,
    };

    try {
      await updateConfig.mutateAsync({
        id: deviceId,
        data: {
          warningOverrides: {
            ...warningOverrides,
            [field.key]: nextThreshold,
          },
        },
      });
      toast.success(`Warning gate for "${field.label}" saved`);
    } catch (error) {
      toast.error(getResponseMessage(error));
    }
  };

  return (
    <div className="space-y-3 rounded-md border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <span className="font-medium">{field.label}</span>
          {field.unit && <span className="text-muted-foreground ml-1 text-sm">({field.unit})</span>}
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor={`enabled-${field.key}`} className="text-muted-foreground text-sm">
            Enabled
          </Label>
          <Switch
            id={`enabled-${field.key}`}
            checked={draft.enabled}
            disabled={isGuest}
            onCheckedChange={(enabled) => setDraft((prev) => ({ ...prev, enabled }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="space-y-1">
          <Label htmlFor={`min-${field.key}`} className="text-muted-foreground text-xs">
            Min
          </Label>
          <Input
            id={`min-${field.key}`}
            type="number"
            value={draft.min}
            disabled={isGuest}
            placeholder={field.warningMin !== undefined ? String(field.warningMin) : undefined}
            onChange={(e) => setDraft((prev) => ({ ...prev, min: e.target.value }))}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`max-${field.key}`} className="text-muted-foreground text-xs">
            Max
          </Label>
          <Input
            id={`max-${field.key}`}
            type="number"
            value={draft.max}
            disabled={isGuest}
            placeholder={field.warningMax !== undefined ? String(field.warningMax) : undefined}
            onChange={(e) => setDraft((prev) => ({ ...prev, max: e.target.value }))}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-muted-foreground text-xs">Notify via</Label>
        <div className="flex flex-wrap gap-1.5">
          {NOTIFICATION_CHANNEL_OPTIONS.map((channel) => {
            const selected = draft.channels.includes(channel.value);
            return (
              <button key={channel.value} type="button" disabled={isGuest} onClick={() => toggleChannel(channel.value)}>
                <Badge variant={selected ? 'default' : 'outline'} className={cn('cursor-pointer', selected && 'hover:bg-primary/90')}>
                  {channel.label}
                </Badge>
              </button>
            );
          })}
        </div>
        <p className="text-muted-foreground text-xs">No channels selected: warnings for this field go to all your enabled channels.</p>
      </div>

      {!isGuest && (
        <Button size="sm" onClick={() => void handleSave()} disabled={updateConfig.isPending}>
          {updateConfig.isPending && <IconLoader2 className="h-4 w-4 animate-spin" />}
          Save
        </Button>
      )}
    </div>
  );
}

export function WarningGatesPanel({ deviceId, telemetrySchema, warningOverrides }: Props) {
  if (!telemetrySchema || telemetrySchema.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Warning Gates</CardTitle>
        <CardDescription>Configure min/max thresholds per telemetry field and which notification channels a breach should send to.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {telemetrySchema.map((field) => (
          <GateRow key={field.key} field={field} override={warningOverrides?.[field.key]} deviceId={deviceId} warningOverrides={warningOverrides} />
        ))}
      </CardContent>
    </Card>
  );
}
