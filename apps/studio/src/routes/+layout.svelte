<script>
	import '@nublox/design-system/dist/index.css';
	let { data, children } = $props();
</script>

<svelte:head>
	<title>NuBlox Studio</title>
</svelte:head>

<div class="nbx-app">
	{@render children()}
</div>

<style>
	.nbx-app {
		min-height: 100dvh;
		display: grid;
	}
</style>
