import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/tasks/$taskId/edit')({
  component: EditTaskRoute,
});

function EditTaskRoute() {
  return <h1 className="text-2xl font-bold">Edit Task</h1>;
}
