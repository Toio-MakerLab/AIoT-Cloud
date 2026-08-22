export const RESOURCES = {
	POSTS: "cms/posts",
	CATEGORIES: "cms/categories",
	TAGS: "cms/tags",
	TASKS: "cms/tasks",
	NOTES: "cms/notes",
	QUIZZES: "cms/quizzes",
	FLASHCARDS: "cms/flashcards",
	DRAWINGS: "cms/drawings",
	TIMETABLES: "cms/timetables",
	MENUS: "cms/menus",
	UPLOAD: "cms/upload",
	MESSAGES: "messages",
	ACCOUNT: "users",
} as const;

export type Resource = (typeof RESOURCES)[keyof typeof RESOURCES];
