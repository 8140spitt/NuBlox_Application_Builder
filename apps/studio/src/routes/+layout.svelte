<script>
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import faviconDark from '$lib/assets/favicon-dark.svg';

	let { data, children } = $props();
</script>

<svelte:head>
	<title>NuBloxStudio</title>
	<meta
		name="description"
		content="NuBloxStudio - Your go-to platform for building applications with ease."
	/>

	<link rel="icon" type="image/x-icon" href="/favicon.ico" />
	<link rel="icon" type="image/svg+xml" href={faviconDark} />
	<link rel="icon" type="image/svg+xml" href={favicon} media="(prefers-color-scheme: dark)" />
</svelte:head>

{@render children()}

<style>
</style>
