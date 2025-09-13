<script lang="ts">
	import { onMount } from 'svelte';
	// IMPORTANT: adjust this import path to your monorepo layout
	// apps/studio/src/routes/palette-preview/+page.svelte
	import {
		buildTheme,
		buildThemeQuick,
		contrastRatio,
		type BrandSeed
	} from '@nublox/design-system/api';

	type SeedRow = BrandSeed & { id: string };
	let seeds: SeedRow[] = [
		{ id: crypto.randomUUID(), name: 'brand1', hex: '#a65de9' },
		{ id: crypto.randomUUID(), name: 'brand2', hex: '#47a4ff' },
		{ id: crypto.randomUUID(), name: 'brand3', hex: '#47ffd7' },
		{ id: crypto.randomUUID(), name: 'brand4', hex: '#fba94c' }
	];
	let brandOrder: string[] = ['brand1', 'brand2', 'brand3', 'brand4'];
	let theme = buildTheme({ seeds, brandOrder });
	let dark = false;

	const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;

	function rebuild() {
		// sanitize names and ensure uniqueness
		const seen = new Set<string>();
		seeds.forEach((s, i) => {
			s.name = s.name.trim().replace(/\s+/g, '-').toLowerCase() || `brand${i + 1}`;
			if (seen.has(s.name)) s.name = `${s.name}-${i + 1}`;
			seen.add(s.name);
		});
		// keep brandOrder aligned
		brandOrder = seeds.map((s) => s.name);
		theme = buildTheme({ seeds, brandOrder });
		save();
	}
	function addSeed() {
		seeds = [
			...seeds,
			{ id: crypto.randomUUID(), name: `brand${seeds.length + 1}`, hex: '#6699ff' }
		];
		rebuild();
	}
	function removeSeed(id: string) {
		seeds = seeds.filter((s) => s.id !== id);
		rebuild();
	}
	function move(idx: number, dir: -1 | 1) {
		const j = idx + dir;
		if (j < 0 || j >= seeds.length) return;
		const arr = [...seeds];
		const [row] = arr.splice(idx, 1);
		arr.splice(j, 0, row);
		seeds = arr;
		rebuild();
	}

	function save() {
		localStorage.setItem('nbx_palette_seeds', JSON.stringify(seeds));
	}
	function load() {
		const raw = localStorage.getItem('nbx_palette_seeds');
		if (raw) {
			try {
				const list = JSON.parse(raw) as SeedRow[];
				if (Array.isArray(list) && list.length) {
					seeds = list;
				}
			} catch {}
		}
		rebuild();
	}
	onMount(load);

	function copy(text: string) {
		navigator.clipboard.writeText(text);
	}
</script>

<div
	class="grid {dark ? 'theme-dark' : 'theme-light'}"
	style="grid-template-columns: 1fr; max-width: 1100px; margin: 16px auto; padding: 16px;"
>
	<header style="display:flex; justify-content:space-between; align-items:center; gap:12px;">
		<h1 style="margin:0">NuBlox Palette Preview</h1>
		<div class="toolbar">
			<label style="display:flex; gap:8px; align-items:center;">
				<input type="checkbox" bind:checked={dark} on:change={() => {}} /> Dark mode
			</label>
			<button class="btn" on:click={() => copy(theme.tokens.light)}>Copy Tokens (Light)</button>
			<button class="btn" on:click={() => copy(theme.tokens.dark)}>Copy Tokens (Dark)</button>
		</div>
	</header>

	<section>
		<table class="table">
			<thead>
				<tr><th style="width:190px">Brand</th><th>Hex</th><th style="width:220px">Actions</th></tr>
			</thead>
			<tbody>
				{#each seeds as s, i}
					<tr>
						<td>
							<input class="mono" style="width:180px" bind:value={s.name} on:change={rebuild} />
						</td>
						<td>
							<input class="mono" style="width:150px" bind:value={s.hex} on:change={rebuild} />
							<input type="color" bind:value={s.hex} on:change={rebuild} />
						</td>
						<td>
							<button class="btn" on:click={() => move(i, -1)}>↑</button>
							<button class="btn" on:click={() => move(i, 1)}>↓</button>
							<button class="btn" on:click={() => removeSeed(s.id)}>Remove</button>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
		<div style="margin-top:8px"><button class="btn" on:click={addSeed}>Add brand</button></div>
	</section>

	<section>
		<h3>Ramps</h3>
		{#each Object.entries(theme.brands) as [name, ramp]}
			<div style="margin: 8px 0 16px">
				<div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
					<strong style="min-width: 120px">{name}</strong>
					<span class="chip">primary candidate</span>
				</div>
				<div class="ramp">
					{#each STEPS as step}
						{#if ramp[step]}
							<div
								class="sw"
								style="background: {ramp[step].hex}; color: {ramp[step].on}"
								title={`Step ${step}  ${ramp[step].hex}`}
							>
								<span>{step}</span>
							</div>
						{/if}
					{/each}
				</div>
			</div>
		{/each}

		<div style="margin-top: 20px">
			<h3>Neutral & Status</h3>
			{#each Object.entries({ neutral: theme.neutral, ...theme.status }) as [name, ramp]}
				<div style="margin: 8px 0 16px">
					<strong style="min-width: 120px">{name}</strong>
					<div class="ramp">
						{#each STEPS as step}
							<div class="sw" style="background: {ramp[step].hex}; color: {ramp[step].on}">
								<span>{step}</span>
							</div>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	</section>

	<section>
		<h3>Live contrast check (example)</h3>
		<div style="display:flex; gap:12px; flex-wrap:wrap;">
			{#each [theme.resolveRole('primary'), theme.resolveRole('secondary'), theme.resolveRole('tertiary'), theme.resolveRole('link')] as sw}
				<div style="padding:12px; border-radius:12px; border:1px solid #e5e7eb; min-width:220px;">
					<div
						style={`background:${sw.hex}; color:${sw.on}; padding:12px; border-radius:8px; text-align:center;`}
					>
						{sw.brand}
						{sw.step}
					</div>
					<div style="margin-top:6px; font-size:12px;" class="mono">
						{sw.hex} / on {sw.on} — CR:{contrastRatio(sw.hex, sw.on).toFixed(2)}
					</div>
				</div>
			{/each}
		</div>
	</section>
</div>

<svelte:head>
	<style>
		.theme-dark {
			background: #0b0e12;
			color: #e5e7eb;
		}
		.theme-light {
			background: #ffffff;
			color: #111827;
		}
	</style>
</svelte:head>

<style>
	.grid {
		display: grid;
		gap: 0.75rem;
	}
	.ramp {
		display: grid;
		grid-template-columns: repeat(12, minmax(0, 1fr));
		gap: 4px;
	}
	.sw {
		height: 40px;
		border-radius: 8px;
		position: relative;
		overflow: hidden;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 12px;
	}
	.chip {
		font-size: 11px;
		padding: 2px 6px;
		border-radius: 999px;
		border: 1px solid #0003;
		background: #fff9;
		backdrop-filter: saturate(140%) blur(4px);
	}
	.toolbar {
		display: flex;
		gap: 12px;
		flex-wrap: wrap;
		align-items: center;
	}
	.table {
		width: 100%;
		border-collapse: collapse;
	}
	.table th,
	.table td {
		padding: 6px 8px;
		border-bottom: 1px solid #e5e7eb;
	}
	.btn {
		padding: 6px 10px;
		border-radius: 8px;
		border: 1px solid #e5e7eb;
		background: #f9fafb;
		cursor: pointer;
	}
	.btn:active {
		transform: translateY(1px);
	}
	.kbd {
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		font-size: 12px;
		background: #111;
		color: #fff;
		padding: 2px 6px;
		border-radius: 6px;
	}
	.mono {
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
	}
</style>
