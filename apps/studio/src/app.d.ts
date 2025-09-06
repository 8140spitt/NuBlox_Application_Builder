// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals { user: { id: number; username: string; status: 'active' | 'inactive' | 'banned' } | null; }
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export { };
