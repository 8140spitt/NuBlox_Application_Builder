<script lang="ts">
	let { data, children } = $props();
</script>

{#if data.user}
	<form method="POST" action="/logout" style="display:inline">
		<button type="submit">Logout</button>
	</form>
{/if}
<main class="global-wrapper__app">
	{@render children()}
</main>

<style>
	main {
		position: fixed;
		inset: 0;
		display: grid;
		align-content: center;
		z-index: -100;
	}
</style>
