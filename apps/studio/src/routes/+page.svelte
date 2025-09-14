<script>
	export let data;
</script>

<h1>NuBlox Studio</h1>
{#if data.user}
	<p>Signed in as {data.user.email}</p>
	<form method="POST" action="/api/auth/logout">
		<button>Sign out</button>
	</form>
{:else}
	<form method="POST" action="/api/auth/login">
		<label>Email <input name="email" /></label>
		<label>Password <input name="password" type="password" /></label>
		<button>Sign in</button>
	</form>
{/if}
