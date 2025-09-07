<script lang="ts">
	let { data, children } = $props();
</script>

{#if data.user}{/if}
<main class="global-wrapper__app">
	<header class="global-header__app">
		<form method="POST" action="/logout" style="display:inline">
			<button type="submit">Logout</button>
		</form>
	</header>

	{@render children()}
</main>

<style>
	main {
		position: fixed;
		inset: 0;
		display: grid;
		grid-template-rows: auto 1fr;
	}
</style>
