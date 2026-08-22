import { createFileRoute } from '@tanstack/react-router';

function TasksRoute() {
  return <h1 className="text-2xl font-bold">Tasks</h1>;
}

export const Route = createFileRoute('/_authenticated/tasks/')({
  component: TasksRoute,
});
