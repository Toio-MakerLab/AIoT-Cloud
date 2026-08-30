import { IconLoader2 } from '@tabler/icons-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { getResponseMessage } from '@/lib/response-codes';
import { useUpdateDeviceConfigMutation } from '../api/queries';
import type { DeviceTemplateType, IDeviceAlertRule, IDeviceFailsafeConfig } from '../api/types';

interface Props {
  deviceId: string;
  templateType: DeviceTemplateType | undefined;
  alertRules: IDeviceAlertRule[] | null | undefined;
  failsafe: IDeviceFailsafeConfig | null | undefined;
}

/** One rule per line -> trimmed, empty lines dropped. Same shape both text areas below use. */
function parseRuleLines(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/**
 * Gateways bridge nodes they don't directly own (e.g. a current-sensing node feeding a relay
 * node), so reacting to a condition fast enough to matter (tripping a relay on over-current)
 * can't wait on a cloud round-trip. These rules are cached and evaluated on the gateway itself —
 * the cloud only stores and ships them down via boot-config, see DeviceAlertRule/DeviceFailsafeConfig.
 */
export function GatewayAutomationPanel({ deviceId, templateType, alertRules, failsafe }: Props) {
  const updateConfig = useUpdateDeviceConfigMutation();
  const [rulesText, setRulesText] = useState((alertRules ?? []).join('\n'));
  const [failsafeEnabled, setFailsafeEnabled] = useState(failsafe?.enabled ?? false);
  const [failsafeRulesText, setFailsafeRulesText] = useState((failsafe?.rules ?? []).join('\n'));

  if (templateType !== 'GATEWAY') {
    return null;
  }

  const handleSaveRules = async () => {
    const rules = parseRuleLines(rulesText);
    try {
      await updateConfig.mutateAsync({ id: deviceId, data: { alertRules: rules.length > 0 ? rules : null } });
      toast.success('Alert rules saved');
    } catch (error) {
      toast.error(getResponseMessage(error));
    }
  };

  const handleSaveFailsafe = async () => {
    const rules = parseRuleLines(failsafeRulesText);
    try {
      await updateConfig.mutateAsync({
        id: deviceId,
        data: { failsafe: { enabled: failsafeEnabled, rules: rules.length > 0 ? rules : undefined } },
      });
      toast.success('Failsafe config saved');
    } catch (error) {
      toast.error(getResponseMessage(error));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gateway Automation</CardTitle>
        <CardDescription>Rules the gateway itself caches and acts on, without a cloud round-trip.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-1.5">
          <Label htmlFor="alert-rules" className="text-muted-foreground text-xs">
            Alert rules — one per line, "&lt;field&gt;&lt;operator&gt;&lt;threshold&gt;:&lt;actionKey&gt;=&lt;actionValue&gt;"
          </Label>
          <Textarea
            id="alert-rules"
            rows={4}
            value={rulesText}
            placeholder="amps.value>10:relay_2=OFF"
            onChange={(e) => setRulesText(e.target.value)}
            className="font-mono text-sm"
          />
          <Button size="sm" onClick={() => void handleSaveRules()} disabled={updateConfig.isPending}>
            {updateConfig.isPending && <IconLoader2 className="h-4 w-4 animate-spin" />}
            Save rules
          </Button>
        </div>

        <div className="space-y-3 rounded-md border p-3">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <span className="font-medium">Failsafe</span>
              <p className="text-muted-foreground text-sm">Safe state the gateway applies on its own when it can't reach the cloud.</p>
            </div>
            <Switch checked={failsafeEnabled} onCheckedChange={setFailsafeEnabled} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="failsafe-rules" className="text-muted-foreground text-xs">
              Actions — one per line, "&lt;actionKey&gt;=&lt;actionValue&gt;"
            </Label>
            <Textarea
              id="failsafe-rules"
              rows={3}
              value={failsafeRulesText}
              placeholder="relay_2=OFF"
              onChange={(e) => setFailsafeRulesText(e.target.value)}
              className="font-mono text-sm"
            />
          </div>
          <Button size="sm" onClick={() => void handleSaveFailsafe()} disabled={updateConfig.isPending}>
            {updateConfig.isPending && <IconLoader2 className="h-4 w-4 animate-spin" />}
            Save failsafe
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
