// form-validation.ts
import { writable, get, type Readable } from "svelte/store";
import type {
    ValidatedEl,
    ControlError,
    MessageMap,
    ExtraValidator,
} from "./validation"; // from the utility you pasted before
import { readControlErrors, reflectValidity } from "./validation";

type Options = { messages?: MessageMap; extra?: ExtraValidator[] };

function keyFor(el: ValidatedEl): string {
    return el.getAttribute("name") || el.id || el.tagName.toLowerCase();
}

export interface FormValidation {
    errors: Readable<Map<string, ControlError[]>>;
    register(el: ValidatedEl): void;
    unregister(el: ValidatedEl): void;
    validateAll(): boolean;
    getErrors(nameOrId: string): ControlError[];
    focusFirstInvalid(): void;
    setOptions(o: Options): void;
}

export function createFormValidation(opts: Options = {}): FormValidation {
    const controls = new Set<ValidatedEl>();
    const errorsStore = writable<Map<string, ControlError[]>>(new Map());
    let options: Options = opts;

    function setOptions(o: Options) {
        options = { ...options, ...o };
        // re-evaluate with new messages/rules
        validateAll();
    }

    function updateControl(el: ValidatedEl) {
        const errs = readControlErrors(el, options);
        const k = keyFor(el);
        errorsStore.update((m) => {
            const next = new Map(m);
            if (errs.length) next.set(k, errs);
            else next.delete(k);
            return next;
        });
    }

    function onEvt(this: ValidatedEl) {
        reflectValidity(this, options);
        updateControl(this);
    }

    function register(el: ValidatedEl) {
        if (controls.has(el)) return;
        controls.add(el);
        // initial reflect + collect
        reflectValidity(el, options);
        updateControl(el);
        el.addEventListener("input", onEvt as any);
        el.addEventListener("change", onEvt as any);
        el.addEventListener("blur", onEvt as any);
    }

    function unregister(el: ValidatedEl) {
        if (!controls.delete(el)) return;
        el.removeEventListener("input", onEvt as any);
        el.removeEventListener("change", onEvt as any);
        el.removeEventListener("blur", onEvt as any);
        const k = keyFor(el);
        errorsStore.update((m) => {
            const next = new Map(m);
            next.delete(k);
            return next;
        });
    }

    function validateAll(): boolean {
        let ok = true;
        for (const el of controls) {
            const errs = readControlErrors(el, options);
            if (errs.length) ok = false;
            const k = keyFor(el);
            errorsStore.update((m) => {
                const next = new Map(m);
                if (errs.length) next.set(k, errs);
                else next.delete(k);
                return next;
            });
            reflectValidity(el, options);
        }
        return ok;
    }

    function focusFirstInvalid() {
        const m = get(errorsStore);
        const firstKey = m.keys().next().value as string | undefined;
        if (!firstKey) return;
        for (const el of controls) {
            if (keyFor(el) === firstKey) {
                el.focus();
                break;
            }
        }
    }

    function getErrors(nameOrId: string): ControlError[] {
        return get(errorsStore).get(nameOrId) ?? [];
    }

    return {
        errors: { subscribe: errorsStore.subscribe },
        register,
        unregister,
        validateAll,
        getErrors,
        focusFirstInvalid,
        setOptions,
    };
}

/** Action for any input/select/textarea: use:validateField={{ form }} */
// form-validation.ts (action fix)
export function validateField(
    node: ValidatedEl,
    params?: { form: FormValidation; messages?: MessageMap; extra?: ExtraValidator[] } | null
) {
    let form: FormValidation | null = null;

    function attach(p: NonNullable<typeof params>) {
        form = p.form;
        form.setOptions({ messages: p.messages, extra: p.extra });
        form.register(node);
    }

    if (params?.form) attach(params);

    return {
        update(next?: typeof params | null) {
            // detach if form removed
            if (form && (!next || !next.form)) {
                form.unregister(node);
                form = null;
                return;
            }
            // attach if previously not attached
            if (!form && next?.form) {
                attach(next);
                return;
            }
            // update options
            if (form && next) {
                form.setOptions({ messages: next.messages, extra: next.extra });
            }
        },
        destroy() {
            if (form) form.unregister(node);
        }
    };
}

/** Action for the <form>: registers children, observes dynamic changes, and guards submit */
export function validateForm(
    node: HTMLFormElement,
    params: { form: FormValidation; onValid?: (form: HTMLFormElement) => void }
) {
    const { form, onValid } = params;

    // initial register
    node
        .querySelectorAll<ValidatedEl>("input, select, textarea")
        .forEach((el) => form.register(el));

    // watch dynamic add/remove for the builder canvas
    const mo = new MutationObserver((mut) => {
        for (const m of mut) {
            m.addedNodes.forEach((n) => {
                if (!(n instanceof Element)) return;
                n.querySelectorAll<ValidatedEl>("input, select, textarea").forEach((el) =>
                    form.register(el)
                );
                if (
                    n instanceof HTMLInputElement ||
                    n instanceof HTMLSelectElement ||
                    n instanceof HTMLTextAreaElement
                ) form.register(n as ValidatedEl);
            });
            m.removedNodes.forEach((n) => {
                if (!(n instanceof Element)) return;
                n.querySelectorAll<ValidatedEl>("input, select, textarea").forEach((el) =>
                    form.unregister(el)
                );
                if (
                    n instanceof HTMLInputElement ||
                    n instanceof HTMLSelectElement ||
                    n instanceof HTMLTextAreaElement
                ) form.unregister(n as ValidatedEl);
            });
        }
    });
    mo.observe(node, { childList: true, subtree: true });

    function onSubmit(e: Event) {
        if (!form.validateAll()) {
            e.preventDefault();
            form.focusFirstInvalid();
            return;
        }
        onValid?.(node);
    }

    node.addEventListener("submit", onSubmit);

    return {
        update(next: typeof params) {
            // swap onValid if needed
            (params as any).onValid = next.onValid;
        },
        destroy() {
            mo.disconnect();
            node.removeEventListener("submit", onSubmit);
        },
    };
}
