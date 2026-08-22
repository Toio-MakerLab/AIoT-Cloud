import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/tasks/create')({
  component: CreateTaskRoute,
});

function CreateTaskRoute() {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-bold">Create Task</h1>
    </div>
  );
}
