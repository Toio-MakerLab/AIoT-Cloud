import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/tasks/$taskId/view')({
  component: ViewTaskRoute,
});

function ViewTaskRoute() {
  return <h1 className="text-2xl font-bold"> View task </h1>;
}
