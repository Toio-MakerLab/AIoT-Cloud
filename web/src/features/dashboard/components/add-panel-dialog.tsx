import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { IDashboardWidget, IDevice, WidgetType } from '../api/types';

const formSchema = z.object({
  deviceId: z.string().min(1, { message: 'Device is required.' }),
  widgetType: z.enum(['VALUE', 'CHART']),
  field: z.string().min(1, { message: 'Field is required.' }),
  title: z.string().min(1, { message: 'Title is required.' }),
});
type AddPanelForm = z.infer<typeof formSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  devices: IDevice[];
  nextSlot: { x: number; y: number };
  onAdd: (widget: IDashboardWidget) => void;
}

export function AddPanelDialog({ open, onOpenChange, devices, nextSlot, onAdd }: Props) {
  const form = useForm<AddPanelForm>({
    resolver: zodResolver(formSchema),
    defaultValues: { deviceId: '', widgetType: 'VALUE', field: '', title: '' },
  });

  // Reset the form each time the dialog is (re)opened so stale values from a previous
  // panel don't leak into the next one.
  useEffect(() => {
    if (open) {
      form.reset({ deviceId: '', widgetType: 'VALUE', field: '', title: '' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, form.reset]);

  const onSubmit = (values: AddPanelForm) => {
    onAdd({
      id: crypto.randomUUID(),
      deviceId: values.deviceId,
      widgetType: values.widgetType as WidgetType,
      field: values.field,
      title: values.title,
      x: nextSlot.x,
      y: nextSlot.y,
      w: 3,
      h: 2,
    });
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(state) => {
        onOpenChange(state);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Panel</DialogTitle>
          <DialogDescription>Pick a device and telemetry field to display on this dashboard.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form id="add-panel-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="deviceId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Device</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a device" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {devices.length === 0 && <div className="text-muted-foreground px-2 py-1.5 text-sm">No devices found</div>}
                      {devices.map((device) => (
                        <SelectItem key={device.id} value={device.id}>
                          {device.name} ({device.deviceId})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="widgetType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Widget Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="VALUE">Value</SelectItem>
                      <SelectItem value="CHART">Chart</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="field"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telemetry Field</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. temperature" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Panel title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <DialogFooter>
          <Button type="submit" form="add-panel-form">
            Add Panel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
