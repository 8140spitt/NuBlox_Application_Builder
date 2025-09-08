<script lang="ts">
	let sql = $state('SELECT 1 AS ok');
	let params = $state('[]');
	let res: any = $state(null);
	let err = $state('');
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

<h1>SQL Studio</h1>
<textarea bind:value={sql} rows="6" class="w-full border p-2 rounded"></textarea>
<div class="flex gap-2 my-2">
	<input bind:value={params} class="flex-1 border p-2 rounded" placeholder="Params JSON" />
	<button onclick={() => run('query')}>Run Query</button>
	<button onclick={() => run('exec')}>Run Exec</button>
</div>
{#if err}<pre style="color:#b00">{err}</pre>{/if}
{#if res}<pre>{JSON.stringify(res, null, 2)}</pre>{/if}
