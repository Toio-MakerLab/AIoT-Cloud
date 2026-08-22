import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(auth)/post")({
	component: RouteComponent,
});

function RouteComponent() {
	return <div>Hello "/(auth)/post"!</div>;
}
