<script lang="ts">
	import { onMount } from 'svelte';
	let sql = 'SELECT 1 AS ok';
	let params = '[]';
	let res: any = null,
		err = '';
	let schemas: string[] = [];
	let tables: Record<string, string[]> = {};

	onMount(async () => {
		const r = await fetch('/api/sql/schema').then((r) => r.json());
		schemas = r.schemas;
		tables = r.tables;
	});

	async function run(mode: 'query' | 'exec') {
		err = '';
		res = null;
		const r = await fetch('/api/sql/run', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ sql, params: JSON.parse(params || '[]'), mode })
		}).then((r) => r.json());
		if (!r.ok) err = r.error;
		else res = r.result;
	}
</script>

<div class="grid grid-cols-12 gap-4">
	<aside class="col-span-3 border rounded p-2">
		<h2 class="font-semibold mb-2">Schemas</h2>
		{#each schemas as s}
			<details class="mb-1">
				<summary>{s}</summary>
				<ul class="ml-4">
					{#each tables[s] || [] as t}<li class="text-sm">{t}</li>{/each}
				</ul>
			</details>
		{/each}
	</aside>

	<main class="col-span-9">
		<h1 class="text-xl font-semibold mb-2">SQL Studio</h1>
		<textarea bind:value={sql} rows="8" class="w-full border p-2 rounded mb-2"></textarea>
		<div class="flex gap-2 mb-2">
			<input bind:value={params} class="flex-1 border p-2 rounded" placeholder="Params JSON" />
			<button on:click={() => run('query')} class="border rounded px-3 py-2">Run Query</button>
			<button on:click={() => run('exec')} class="border rounded px-3 py-2">Run Exec</button>
		</div>
		{#if err}<pre class="text-red-600">{err}</pre>{/if}
		{#if res}<pre class="text-sm bg-gray-50 border rounded p-2 overflow-auto">{JSON.stringify(
					res,
					null,
					2
				)}</pre>{/if}
	</main>
</div>
