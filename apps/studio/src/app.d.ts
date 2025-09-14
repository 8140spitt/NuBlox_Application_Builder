// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			sessionId: string | null;
			user: { id: number; email: string } | null;
			auth: {
				signIn(userId: number): Promise<void>;
				signOut(): Promise<void>;
			};
			workspace?: { host: string; workspaceSlug: string | null };
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export { };
