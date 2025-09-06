<script lang="ts">
	import { writable } from 'svelte/store';
	import { validateField, type FormValidation } from '$lib/components/form/form-validation';
	import type { MessageMap, ExtraValidator } from '$lib/components/form/validation';

	let {
		label = '',
		value = $bindable(''),
		help = '',
		errors = $bindable<string[]>([]), // external errors (prop)
		form = null as FormValidation | null, // pass createFormValidation()
		messages = null as MessageMap | null,
		extra = null as ExtraValidator[] | null,
		id = globalThis.crypto?.randomUUID?.() ?? `nb-${Math.random().toString(36).slice(2)}`,
		...props
	} = $props();

	// use a store to avoid "state_referenced_locally" lint
	const formErrors = writable<string[]>([]);

	// subscribe to the form error map (when present)
	$effect(() => {
		if (!form) {
			formErrors.set([]);
			return;
		}
		const key = (props as any).name ?? id;
		const unsub = form.errors.subscribe((map) => {
			const entry = map.get(key);
			formErrors.set(entry ? entry.map((e) => e.message) : []);
		});
		return unsub;
	});

	// merge form-derived + external errors
	let shownErrors = $derived([...$formErrors, ...errors]);

	// a11y
	let describedBy = $derived(shownErrors.length ? `${id}-err` : help ? `${id}-help` : undefined);
</script>

<div class="nb-field">
	<label for={id} class="nb-label">{label}</label>

	<input
		{id}
		{...props}
		bind:value
		aria-invalid={shownErrors.length > 0}
		aria-describedby={describedBy}
		use:validateField={form
			? { form, messages: messages ?? undefined, extra: extra ?? undefined }
			: undefined}
	/>

	{#if shownErrors.length}
		<div id={`${id}-err`} class="nb-field__error" role="alert">
			{shownErrors.join(', ')}
		</div>
	{:else if help}
		<div id={`${id}-help`} class="nb-field__help">{help}</div>
	{/if}
</div>
