<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';

	// Define the exact form shape this page expects
	type RegisterForm = {
		message?: string;
		fieldErrors?: Record<string, string[]>;
		values?: {
			username: string;
			email: string;
			first_name: string;
			last_name: string;
		};
	} | null;

	// Svelte 5 runes: type the incoming props explicitly
	let { data, form } = $props<{ data: PageData; form: RegisterForm }>();

	const ui = $state({ showPw: false, showPw2: false });

	// helper
	const err = (k: keyof NonNullable<NonNullable<typeof form>['fieldErrors']>) =>
		form?.fieldErrors?.[k]?.[0];
</script>

<form method="POST" action="?/register" use:enhance class="nb-card nb-stack">
	<h1 class="nb-h3">Create your account</h1>

	{#if form?.message}
		<p class="nb-alert nb-alert-error" role="alert">{form.message}</p>
	{/if}

	{#if data?.next}
		<input type="hidden" name="next" value={data.next} />
	{/if}

	<div class="nb-grid">
		<label class="nb-field">
			<span class="nb-label">First name</span>
			<input
				name="first_name"
				type="text"
				required
				aria-invalid={!!err('first_name')}
				value={form?.values?.first_name ?? ''}
			/>
			{#if err('first_name')}<small class="nb-error">{err('first_name')}</small>{/if}
		</label>

		<label class="nb-field">
			<span class="nb-label">Last name</span>
			<input
				name="last_name"
				type="text"
				required
				aria-invalid={!!err('last_name')}
				value={form?.values?.last_name ?? ''}
			/>
			{#if err('last_name')}<small class="nb-error">{err('last_name')}</small>{/if}
		</label>
	</div>

	<label class="nb-field">
		<span class="nb-label">Email</span>
		<input
			name="email"
			type="email"
			required
			autocomplete="email"
			aria-invalid={!!err('email')}
			value={form?.values?.email ?? ''}
		/>
		{#if err('email')}<small class="nb-error">{err('email')}</small>{/if}
	</label>

	<label class="nb-field">
		<span class="nb-label">Username</span>
		<input
			name="username"
			type="text"
			required
			autocomplete="username"
			aria-invalid={!!err('username')}
			value={form?.values?.username ?? ''}
		/>
		{#if err('username')}<small class="nb-error">{err('username')}</small>{/if}
	</label>

	<label class="nb-field">
		<span class="nb-label">Password</span>
		<div class="nb-input-with-button">
			<input
				name="password"
				type={ui.showPw ? 'text' : 'password'}
				required
				autocomplete="new-password"
				aria-invalid={!!err('password')}
			/>
			<button type="button" class="nb-btn nb-btn-ghost" onclick={() => (ui.showPw = !ui.showPw)}
				>{ui.showPw ? 'Hide' : 'Show'}</button
			>
		</div>
		{#if err('password')}<small class="nb-error">{err('password')}</small>{/if}
	</label>

	<label class="nb-field">
		<span class="nb-label">Confirm password</span>
		<div class="nb-input-with-button">
			<input
				name="confirm"
				type={ui.showPw2 ? 'text' : 'password'}
				required
				autocomplete="new-password"
				aria-invalid={!!err('confirm')}
			/>
			<button type="button" class="nb-btn nb-btn-ghost" onclick={() => (ui.showPw2 = !ui.showPw2)}
				>{ui.showPw2 ? 'Hide' : 'Show'}</button
			>
		</div>
		{#if err('confirm')}<small class="nb-error">{err('confirm')}</small>{/if}
	</label>

	<button class="nb-btn nb-btn-primary" type="submit" formaction="?/register">Create account</button
	>

	<p class="nb-muted">Already have an account? <a href="/login">Sign in</a></p>
</form>

<style>
	/* swap for design-system classes when ready */
	.nb-card {
		max-width: 520px;
		margin: 4rem auto;
		padding: 1.25rem;
		border: 1px solid var(--nb-border, #e5e7eb);
		border-radius: 12px;
	}
	.nb-stack {
		display: grid;
		gap: 0.75rem;
	}
	.nb-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
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
	input[type='email'],
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
