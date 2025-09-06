<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	// Svelte 5: receive page props via $props()
	// - data: from +page.server.ts load()
	// - form: from action returns (typed as ActionData | null)
	let { data, form } = $props<{ data: PageData; form: ActionData | null }>();

	// local UI state using runes
	const ui = $state({ showPw: false });

	// convenience getters (keeps markup tidy)
	const usernameError = () => form?.fieldErrors?.username?.[0];
	const passwordError = () => form?.fieldErrors?.password?.[0];
</script>

<!-- Progressive enhancement: use:enhance keeps SPA feel; no JS → normal POST -->
<form method="POST" action="?/login" use:enhance class="nb-card nb-stack">
	<h1 class="nb-h3">Sign in</h1>

	{#if form?.message}
		<p class="nb-alert nb-alert-error" role="alert">{form.message}</p>
	{/if}

	<!-- Preserve redirect target if server provided it -->
	{#if data?.next}
		<input type="hidden" name="next" value={data.next} />
	{/if}

	<label class="nb-field">
		<span class="nb-label">Username</span>
		<input
			name="username"
			type="text"
			autocomplete="username"
			required
			value={form?.values?.username ?? ''}
			aria-invalid={!!usernameError()}
			aria-describedby="username-error"
		/>
		{#if usernameError()}
			<small id="username-error" class="nb-error">{usernameError()}</small>
		{/if}
	</label>

	<label class="nb-field">
		<span class="nb-label">Password</span>
		<div class="nb-input-with-button">
			<input
				name="password"
				type={ui.showPw ? 'text' : 'password'}
				autocomplete="current-password"
				required
				aria-invalid={!!passwordError()}
				aria-describedby="password-error"
			/>
			<button type="button" class="nb-btn nb-btn-ghost" onclick={() => (ui.showPw = !ui.showPw)}>
				{ui.showPw ? 'Hide' : 'Show'}
			</button>
		</div>
		{#if passwordError()}
			<small id="password-error" class="nb-error">{passwordError()}</small>
		{/if}
	</label>

	<button class="nb-btn nb-btn-primary" type="submit" formaction="?/login">Sign in</button>
	<p class="nb-muted">Don't have an account? <a href="/register">Register</a></p>
</form>

<style>
	/* minimal styles (replace with your design-system classes) */
	.nb-card {
		max-width: 420px;
		margin: 4rem auto;
		padding: 1.25rem;
		border: 1px solid var(--nb-border, #e5e7eb);
		border-radius: 12px;
	}
	.nb-stack {
		display: grid;
		gap: 0.75rem;
	}
	.nb-h3 {
		margin: 0 0 0.25rem 0;
		font:
			600 1.25rem/1.3 system-ui,
			sans-serif;
	}
	.nb-field {
		display: grid;
		gap: 0.25rem;
	}
	.nb-label {
		font:
			600 0.875rem/1.2 system-ui,
			sans-serif;
	}
	input[type='text'],
	input[type='password'] {
		padding: 0.5rem 0.625rem;
		border: 1px solid var(--nb-border, #e5e7eb);
		border-radius: 8px;
		width: 100%;
	}
	.nb-input-with-button {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 0.5rem;
		align-items: center;
	}
	.nb-btn {
		padding: 0.5rem 0.75rem;
		border-radius: 8px;
		border: 1px solid transparent;
		cursor: pointer;
	}
	.nb-btn-primary {
		background: #111827;
		color: white;
	}
	.nb-btn-ghost {
		background: transparent;
		border-color: var(--nb-border, #e5e7eb);
	}
	.nb-error {
		color: #b91c1c;
	}
	.nb-alert {
		padding: 0.5rem 0.75rem;
		border-radius: 8px;
	}
	.nb-alert-error {
		background: #fee2e2;
		color: #7f1d1d;
	}
	.nb-muted {
		color: #6b7280;
		font-size: 0.9rem;
	}
</style>
