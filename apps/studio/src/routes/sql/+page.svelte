<script lang="ts">
	import { onMount } from 'svelte';

	let sql = $state('SELECT 1 AS ok');
	let params = $state('[]');
	let res: any = $state(null),
		err = $state('');
	let schemas: string[] = $state([]);
	let tables: Record<string, string[]> = $state({});
	let selectedSchema = $state('');
	let selectedTable = $state('');
	let tableMeta: any = $state(null);

	// paging
	let page = $state(1);
	let pageSize = $state(50);
	let total: number | undefined = $state(undefined);

	onMount(async () => {
		const r = await fetch('/api/sql/schema').then((r) => r.json());
		schemas = r.schemas;
		tables = r.tables;
	});

	async function run(mode: 'query' | 'exec', withCount = false) {
		err = '';
		res = null;
		total = undefined;
		const body = {
			sql,
			params: safeJSON(params),
			mode,
			page,
			pageSize,
			wantCount: withCount
		};
		const r = await fetch('/api/sql/run', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(body)
		}).then((r) => r.json());
		if (!r.ok) err = r.error;
		else {
			res = r.result;
			total = r.total;
		}
	}

	function safeJSON(s: string) {
		try {
			const v = JSON.parse(s || '[]');
			return Array.isArray(v) ? v : [];
		} catch {
			return [];
		}
	}

	async function inspect(schema: string, table: string) {
		selectedSchema = schema;
		selectedTable = table;
		tableMeta = null;
		const r = await fetch(
			`/api/sql/table?schema=${encodeURIComponent(schema)}&table=${encodeURIComponent(table)}`
		).then((r) => r.json());
		tableMeta = r;
		sql = `SELECT *\nFROM \`${schema}\`.\`${table}\`\nLIMIT 100;`;
	}

	async function exportCSV() {
		const r = await fetch('/api/sql/export', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ sql, params: safeJSON(params), filename: 'results.csv' })
		});
		const blob = await r.blob();
		const a = document.createElement('a');
		a.href = URL.createObjectURL(blob);
		a.download = 'results.csv';
		document.body.appendChild(a);
		a.click();
		a.remove();
	}
</script>

<div class="grid grid-cols-12 gap-4">
	<aside class="col-span-3 border rounded p-2">
		<h2 class="font-semibold mb-2">Schemas</h2>
		{#each schemas as s}
			<details class="mb-1" open={schemas.length <= 3}>
				<summary class="cursor-pointer">{s}</summary>
				<ul class="ml-4">
					{#each tables[s] || [] as t}
						<li class="text-sm">
							<button class="underline" onclick={() => inspect(s, t)}>{t}</button>
						</li>
					{/each}
				</ul>
			</details>
		{/each}

		{#if tableMeta}
			<div class="mt-4">
				<h3 class="font-semibold">Table: {selectedSchema}.{selectedTable}</h3>
				<details open>
					<summary class="font-medium">Columns</summary>
					<ul class="ml-4 text-sm">
						{#each tableMeta.columns as c}
							<li>
								<code>{c.COLUMN_NAME}</code> — {c.COLUMN_TYPE}{c.IS_NULLABLE === 'NO'
									? ' NOT NULL'
									: ''}
							</li>
						{/each}
					</ul>
				</details>
				<details>
					<summary class="font-medium">Indexes</summary>
					<ul class="ml-4 text-sm">
						{#each tableMeta.indexes as i}
							<li>{i.Non_unique === 0 ? 'UNIQUE ' : ''}{i.Key_name}: {i.Column_name}</li>
						{/each}
					</ul>
				</details>
				<details>
					<summary class="font-medium">Foreign Keys</summary>
					<ul class="ml-4 text-sm">
						{#each tableMeta.foreignKeys as f}
							<li>
								{f.CONSTRAINT_NAME}: {f.COLUMN_NAME} → {f.REFERENCED_TABLE_SCHEMA}.{f.REFERENCED_TABLE_NAME}.{f.REFERENCED_COLUMN_NAME}
							</li>
						{/each}
					</ul>
				</details>
			</div>
		{/if}
	</aside>

	<main class="col-span-9">
		<h1 class="text-xl font-semibold mb-2">SQL Studio</h1>
		<textarea bind:value={sql} rows="8" class="w-full border p-2 rounded mb-2"></textarea>
		<div class="flex gap-2 mb-2">
			<input
				bind:value={params}
				class="flex-1 border p-2 rounded"
				placeholder="Params JSON (e.g. ['alpha'])"
			/>
			<input type="number" bind:value={page} min="1" class="w-20 border p-2 rounded" title="Page" />
			<input
				type="number"
				bind:value={pageSize}
				min="1"
				class="w-24 border p-2 rounded"
				title="Page size"
			/>
			<button onclick={() => run('query', true)} class="border rounded px-3 py-2">Run Query</button>
			<button onclick={() => run('exec')} class="border rounded px-3 py-2">Run Exec</button>
			<button onclick={exportCSV} class="border rounded px-3 py-2">Export CSV</button>
		</div>

		{#if err}<pre class="text-red-600">{err}</pre>{/if}
		{#if res}
			<div class="text-sm">
				{#if total !== undefined}
					<div class="mb-1">Total rows: {total} · Showing page {page} (size {pageSize})</div>
				{/if}
				<pre class="bg-gray-50 border rounded p-2 overflow-auto">{JSON.stringify(
						res,
						null,
						2
					)}</pre>
			</div>
		{/if}
	</main>
</div>

<style>
	:root {
		--bg: #0b0d12;
		--panel: #11141a;
		--card: #131821;
		--muted: #8fa1b3;
		--text: #e7eef7;
		--acc: #4ea1ff;
		--acc-2: #1f7ae0;
		--border: #1f2632;
		--success: #1f8b4c;
		--error: #c0392b;
		--mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace;
		--round: 14px;
		--shadow: 0 12px 30px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.02);
	}
	* {
		box-sizing: border-box;
	}
	html,
	body {
		height: 100%;
	}
	body {
		margin: 0;
		background: radial-gradient(1200px 800px at 0% -10%, #0e1421, #0b0d12 40%), var(--bg);
		color: var(--text);
		font:
			14px/1.45 Inter,
			system-ui,
			-apple-system,
			Segoe UI,
			Roboto,
			'Helvetica Neue',
			Arial,
			'Noto Sans',
			'Apple Color Emoji',
			'Segoe UI Emoji';
	}

	.wrap {
		display: grid;
		grid-template-columns: 320px 1fr;
		gap: 16px;
		padding: 16px;
		min-height: 100vh;
	}
	.sidebar {
		background: var(--panel);
		border: 1px solid var(--border);
		border-radius: var(--round);
		padding: 14px;
		box-shadow: var(--shadow);
		position: sticky;
		top: 16px;
		height: calc(100vh - 32px);
		overflow: auto;
	}
	.brand {
		font-weight: 700;
		letter-spacing: 0.3px;
		margin-bottom: 12px;
	}
	.brand span {
		color: var(--muted);
		font-weight: 600;
		margin-left: 6px;
	}
	.panel {
		margin-top: 10px;
	}
	.panel-title {
		font-weight: 600;
		font-size: 13px;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		margin-bottom: 8px;
		color: var(--muted);
	}
	.schema-list details {
		margin: 4px 0;
	}
	.schema-list summary {
		cursor: pointer;
		padding: 6px 8px;
		border-radius: 10px;
		transition: background 0.12s;
	}
	.schema-list summary:hover {
		background: rgba(255, 255, 255, 0.04);
	}
	.schema-list ul {
		list-style: none;
		margin: 4px 0 8px 8px;
		padding: 0;
	}
	.link {
		background: none;
		border: 0;
		padding: 4px 6px;
		border-radius: 8px;
		cursor: pointer;
		color: var(--text);
		text-align: left;
		width: 100%;
	}
	.link:hover {
		background: rgba(255, 255, 255, 0.06);
	}

	.mini-list {
		list-style: none;
		margin: 6px 0 8px;
		padding: 0;
	}
	.sub {
		color: var(--muted);
		margin: 6px 0;
		font-weight: 600;
	}

	.main {
		display: grid;
		grid-template-rows: auto 1fr;
		gap: 16px;
		min-height: calc(100vh - 32px);
	}
	.card {
		background: var(--card);
		border: 1px solid var(--border);
		border-radius: var(--round);
		box-shadow: var(--shadow);
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}
	.toolbar {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 12px 14px;
		border-bottom: 1px solid var(--border);
	}
	.title {
		font-weight: 600;
	}
	.meta {
		margin-left: auto;
		color: var(--muted);
		display: flex;
		gap: 12px;
		align-items: center;
	}
	.actions {
		display: flex;
		gap: 8px;
		margin-left: 8px;
	}

	.btn {
		background: linear-gradient(180deg, var(--acc), var(--acc-2));
		color: #fff;
		border: 0;
		padding: 8px 12px;
		border-radius: 10px;
		cursor: pointer;
		font-weight: 600;
	}
	.btn:hover {
		filter: brightness(1.05);
	}
	.btn.ghost {
		background: rgba(255, 255, 255, 0.06);
		color: var(--text);
		border: 1px solid var(--border);
	}
	.btn.ghost:hover {
		background: rgba(255, 255, 255, 0.1);
	}
	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.btn.mini {
		padding: 6px 10px;
		font-size: 12px;
	}

	.editor {
		display: grid;
		grid-template-columns: 1fr 310px;
		gap: 12px;
		padding: 12px;
	}
	.editor textarea {
		width: 100%;
		height: 200px;
		resize: vertical;
		background: #0d1220;
		border: 1px solid var(--border);
		border-radius: 12px;
		color: var(--text);
		font-family: var(--mono);
		padding: 12px;
		outline: none;
		box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
	}
	.params {
		display: grid;
		grid-template-rows: auto auto auto;
		gap: 8px;
	}
	.params label {
		color: var(--muted);
		font-weight: 600;
		font-size: 12px;
	}
	.params input {
		background: #0d1220;
		border: 1px solid var(--border);
		border-radius: 10px;
		padding: 10px;
		color: var(--text);
		font-family: var(--mono);
	}
	.pager {
		display: grid;
		grid-template-columns: auto 1fr auto 1fr auto;
		gap: 8px;
		align-items: center;
	}
	.pager input {
		width: 100%;
	}

	.error {
		color: #fff;
		background: linear-gradient(180deg, rgba(192, 57, 43, 0.9), rgba(192, 57, 43, 0.75));
		padding: 10px 12px;
		border-top: 1px solid rgba(255, 255, 255, 0.08);
		border-bottom-left-radius: var(--round);
		border-bottom-right-radius: var(--round);
	}

	.table-wrap {
		overflow: auto;
		max-height: 55vh;
	}
	table.grid {
		border-collapse: separate;
		border-spacing: 0;
		width: 100%;
		font-family: var(--mono);
		font-size: 12.5px;
	}
	.grid thead th {
		position: sticky;
		top: 0;
		background: #0e1526;
		color: #cfe3ff;
		text-align: left;
		padding: 10px;
		border-bottom: 1px solid var(--border);
		white-space: nowrap;
	}
	.grid tbody td {
		padding: 9px 10px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.04);
		max-width: 360px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.grid tbody tr:nth-child(odd) {
		background: rgba(255, 255, 255, 0.02);
	}
	.grid tbody tr:hover {
		background: rgba(78, 161, 255, 0.08);
	}

	.empty {
		padding: 22px;
		color: var(--muted);
		text-align: center;
	}
	.hint {
		color: #d2e7ff;
		font-weight: 600;
		margin-bottom: 6px;
	}

	@media (max-width: 1000px) {
		.wrap {
			grid-template-columns: 1fr;
		}
		.sidebar {
			position: static;
			height: auto;
		}
		.editor {
			grid-template-columns: 1fr;
		}
	}
</style>
