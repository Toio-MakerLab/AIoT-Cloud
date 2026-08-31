'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { IconDeviceUnknown, IconPlus, IconTrash } from '@tabler/icons-react';
import { useFieldArray, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { SelectDropdown } from '@/components/select-dropdown';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useCreateDeviceTemplateMutation, useUpdateDeviceTemplateMutation } from '../api/queries';
import { deviceTemplateTypes, getDeviceTemplateTypeMeta } from '../data/data';
import type { DeviceTemplate } from '../data/schema';
import { actionFieldSchema, deviceTemplateTypeSchema } from '../data/schema';

const formSchema = z.object({
  name: z.string().min(1, { message: 'Name is required.' }),
  type: deviceTemplateTypeSchema,
  manufacturer: z.string().optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
  isActive: z.boolean(),
  actionSchema: z.array(actionFieldSchema),
});
type DeviceTemplateForm = z.infer<typeof formSchema>;

function newChannel(index: number) {
  return {
    key: `channel${index}`,
    label: `Channel ${index}`,
    type: 'TOGGLE' as const,
    onValue: 'ON',
    offValue: 'OFF',
  };
}

interface Props {
  currentRow?: DeviceTemplate;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeviceTemplatesActionDialog({ currentRow, open, onOpenChange }: Props) {
  const isEdit = !!currentRow;
  const createDeviceTemplate = useCreateDeviceTemplateMutation();
  const updateDeviceTemplate = useUpdateDeviceTemplateMutation();
  const isSubmitting = createDeviceTemplate.isPending || updateDeviceTemplate.isPending;

  const form = useForm<DeviceTemplateForm>({
    resolver: zodResolver(formSchema),
    defaultValues: isEdit
      ? {
          name: currentRow.name,
          type: currentRow.type,
          manufacturer: currentRow.manufacturer ?? '',
          description: currentRow.description ?? '',
          icon: currentRow.icon ?? undefined,
          isActive: currentRow.isActive,
          actionSchema: currentRow.actionSchema ?? [],
        }
      : {
          name: '',
          type: 'SENSOR_NODE',
          manufacturer: '',
          description: '',
          icon: '',
          isActive: true,
          actionSchema: [],
        },
  });
  const actionFields = useFieldArray({
    control: form.control,
    name: 'actionSchema',
  });

  const onSubmit = async (values: DeviceTemplateForm) => {
    try {
      if (isEdit && currentRow) {
        await updateDeviceTemplate.mutateAsync({
          id: currentRow.id,
          data: values,
        });
        toast.success('Device template updated');
      } else {
        await createDeviceTemplate.mutateAsync(values);
        toast.success('Device template created');
      }
      form.reset();
      onOpenChange(false);
    } catch (error) {
      // The backend returns business failures (e.g. duplicate name) as
      // HTTP 200 with a non-zero `error` code, so they surface here as a
      // thrown Error rather than an AxiosError the global mutation error
      // handler can parse — toast the message explicitly.
      toast.error(error instanceof Error ? error.message : 'Something went wrong!');
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(state) => {
        form.reset();
        onOpenChange(state);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="text-left">
          <DialogTitle>{isEdit ? 'Edit Template' : 'Add Template'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update the device template here.' : 'Create a new device template here.'} Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form id="device-template-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-0.5">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1">
                  <FormLabel className="col-span-2 text-right">Name</FormLabel>
                  <FormControl className="col-span-4">
                    <Input placeholder="Soil Moisture Sensor v2" {...field} />
                  </FormControl>
                  <FormMessage className="col-span-4 col-start-3" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem className="grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1">
                  <FormLabel className="col-span-2 text-right">Type</FormLabel>
                  <SelectDropdown
                    defaultValue={field.value}
                    onValueChange={field.onChange}
                    placeholder="Select a type"
                    className="col-span-4"
                    items={deviceTemplateTypes.map(({ label, value }) => ({
                      label,
                      value,
                    }))}
                  />
                  <FormMessage className="col-span-4 col-start-3" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="manufacturer"
              render={({ field }) => (
                <FormItem className="grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1">
                  <FormLabel className="col-span-2 text-right">Manufacturer</FormLabel>
                  <FormControl className="col-span-4">
                    <Input placeholder="Acme Sensors Inc." {...field} />
                  </FormControl>
                  <FormMessage className="col-span-4 col-start-3" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => {
                // No icon set (or not an image URL) -> preview the same type-based fallback
                // DeviceImage (dashboard/components/device-panel.tsx) falls back to at display time,
                // so what's shown here is exactly what devices using this template will get.
                const FallbackIcon = getDeviceTemplateTypeMeta(form.watch('type'))?.icon ?? IconDeviceUnknown;
                const isImageUrl = !!field.value && /^(https?:\/\/|\/)/.test(field.value);
                return (
                  <FormItem className="grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1">
                    <FormLabel className="col-span-2 text-right">Icon</FormLabel>
                    <div className="col-span-4 flex items-center gap-2">
                      <div className="bg-muted flex h-8 w-8 shrink-0 items-center justify-center rounded">
                        {isImageUrl ? (
                          <img src={field.value} alt="" className="h-8 w-8 rounded object-cover" />
                        ) : (
                          <FallbackIcon className="text-muted-foreground h-4 w-4" />
                        )}
                      </div>
                      <FormControl>
                        <Input placeholder="Optional image URL" {...field} />
                      </FormControl>
                    </div>
                    <FormDescription className="col-span-4 col-start-3">Leave blank to use the default icon for this device type.</FormDescription>
                    <FormMessage className="col-span-4 col-start-3" />
                  </FormItem>
                );
              }}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1">
                  <FormLabel className="col-span-2 text-right">Description</FormLabel>
                  <FormControl className="col-span-4">
                    <Textarea placeholder="What this template represents..." className="resize-none" {...field} />
                  </FormControl>
                  <FormMessage className="col-span-4 col-start-3" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1">
                  <FormLabel className="col-span-2 text-right">Active</FormLabel>
                  <FormControl className="col-span-4">
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormMessage className="col-span-4 col-start-3" />
                </FormItem>
              )}
            />
            {form.watch('type') === 'RELAY_NODE' ? (
              <div className="grid grid-cols-6 items-start gap-x-4 gap-y-1">
                <FormLabel className="col-span-2 pt-2 text-right">Channels</FormLabel>
                <div className="col-span-4 space-y-3">
                  {actionFields.fields.map((field, index) => {
                    const type = form.watch(`actionSchema.${index}.type`);
                    return (
                      <div key={field.id} className="space-y-2 rounded-md border p-3">
                        <div className="flex items-center gap-2">
                          <FormField
                            control={form.control}
                            name={`actionSchema.${index}.key`}
                            render={({ field: keyField }) => (
                              <FormItem className="flex-1 space-y-0">
                                <FormControl>
                                  <Input placeholder="key" {...keyField} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`actionSchema.${index}.label`}
                            render={({ field: labelField }) => (
                              <FormItem className="flex-1 space-y-0">
                                <FormControl>
                                  <Input placeholder="label" {...labelField} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button type="button" variant="ghost" size="icon" onClick={() => actionFields.remove(index)}>
                            <IconTrash className="size-4" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-2">
                          <FormField
                            control={form.control}
                            name={`actionSchema.${index}.type`}
                            render={({ field: typeField }) => (
                              <FormItem className="w-32 space-y-0">
                                <SelectDropdown
                                  defaultValue={typeField.value}
                                  onValueChange={typeField.onChange}
                                  placeholder="Type"
                                  items={[
                                    { label: 'Toggle', value: 'TOGGLE' },
                                    { label: 'Button', value: 'BUTTON' },
                                  ]}
                                />
                              </FormItem>
                            )}
                          />
                          {type === 'TOGGLE' ? (
                            <>
                              <FormField
                                control={form.control}
                                name={`actionSchema.${index}.onValue`}
                                render={({ field: onField }) => (
                                  <FormItem className="flex-1 space-y-0">
                                    <FormControl>
                                      <Input placeholder="on value" {...onField} value={onField.value ?? ''} />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name={`actionSchema.${index}.offValue`}
                                render={({ field: offField }) => (
                                  <FormItem className="flex-1 space-y-0">
                                    <FormControl>
                                      <Input placeholder="off value" {...offField} value={offField.value ?? ''} />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            </>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                  <Button type="button" variant="outline" size="sm" onClick={() => actionFields.append(newChannel(actionFields.fields.length + 1))}>
                    <IconPlus className="size-4" />
                    Add Channel
                  </Button>
                </div>
              </div>
            ) : null}
          </form>
        </Form>
        <DialogFooter>
          <Button type="submit" form="device-template-form" disabled={isSubmitting}>
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
