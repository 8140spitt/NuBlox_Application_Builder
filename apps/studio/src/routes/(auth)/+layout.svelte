<script lang="ts">
	let { children } = $props();
</script>

<main>
	{@render children()}
</main>

<style>
	main {
		position: fixed;
		inset: 0;
		display: grid;
		align-content: center;
	}
</style>
