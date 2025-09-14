<script lang="ts">
	let { data, children } = $props();
	const ws = data.workspace; // provided by the layout.server
</script>

<section class="p-6 space-y-4">
	<h1 class="text-2xl font-semibold">{ws.name}</h1>
	<p class="opacity-70">Welcome to {ws.slug}.</p>

	<nav class="mt-4 flex gap-3">
		<a class="underline" href="/workspace/{ws.slug}/projects">Projects</a>
		<a class="underline" href="/workspace/{ws.slug}/members">Members</a>
		<a class="underline" href="/workspace/{ws.slug}/settings">Settings</a>
	</nav>
</section>
{@render children()}
