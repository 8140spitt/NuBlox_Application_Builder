// validation.ts
export type ValidatedEl = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

export type ValidityKey =
    | "badInput"
    | "customError"
    | "patternMismatch"
    | "rangeOverflow"
    | "rangeUnderflow"
    | "stepMismatch"
    | "tooLong"
    | "tooShort"
    | "typeMismatch"
    | "valueMissing";

export type ControlError = { key: ValidityKey; message: string };

export type MessageMap = Partial<
    Record<
        ValidityKey,
        string | ((el: ValidatedEl) => string)
    >
>;

export type ExtraValidator = (el: ValidatedEl) => ControlError | null;

function getReadableLabel(el: ValidatedEl): string {
    // 1) <label for="id">
    const id = el.getAttribute("id");
    if (id) {
        const forLabel = document.querySelector(`label[for="${CSS.escape(id)}"]`);
        if (forLabel?.textContent?.trim()) return forLabel.textContent.trim();
    }
    // 2) <label><input .../></label>
    const wrapping = el.closest("label");
    if (wrapping?.textContent?.trim()) return wrapping.textContent.trim();

    // 3) aria-label, name, placeholder, or tag
    return (
        el.getAttribute("aria-label") ||
        el.getAttribute("name") ||
        el.getAttribute("placeholder") ||
        el.tagName.toLowerCase()
    );
}

const defaultMessages: Record<ValidityKey, (el: ValidatedEl) => string> = {
    valueMissing: (el) => `${getReadableLabel(el)} is required.`,
    typeMismatch: (el) => {
        const t = el.getAttribute("type") || "value";
        return `Enter a valid ${t}.`;
    },
    patternMismatch: (el) =>
        el.getAttribute("title")?.trim() ||
        `Value doesn't match the required format.`,
    tooShort: (el) =>
        `Must be at least ${el.getAttribute("minlength")} characters.`,
    tooLong: (el) =>
        `Must be at most ${el.getAttribute("maxlength")} characters.`,
    rangeUnderflow: (el) => `Must be ≥ ${el.getAttribute("min")}.`,
    rangeOverflow: (el) => `Must be ≤ ${el.getAttribute("max")}.`,
    stepMismatch: (el) => {
        const step = el.getAttribute("step") ?? "1";
        const min = el.getAttribute("min") ?? "0";
        return `Use a valid step of ${step} starting from ${min}.`;
    },
    badInput: (el) => {
        const type = el.getAttribute("type");
        return type === "number" ? `Enter a number.` : `Enter a valid value.`;
    },
    customError: (el) => el.validationMessage || `This value is invalid.`,
};

function resolveMessage(
    key: ValidityKey,
    el: ValidatedEl,
    messages?: MessageMap
): string {
    const custom = messages?.[key];
    if (typeof custom === "function") return custom(el);
    if (typeof custom === "string") return custom;
    return defaultMessages[key](el);
}

/**
 * Read all active validity errors on a single control.
 * Skips disabled/readonly and non-validatable controls.
 */
export function readControlErrors(
    el: ValidatedEl,
    options?: { messages?: MessageMap; extra?: ExtraValidator[] }
): ControlError[] {
    // Skip non-interactive/disabled controls
    if ((el as HTMLInputElement).disabled || el.hasAttribute("readonly")) return [];
    if (!("willValidate" in el) || !(el as any).willValidate) return [];

    // Special-case radio groups: required means "one of the group is checked"
    if ((el as HTMLInputElement).type === "radio") {
        const name = el.getAttribute("name");
        if (name && el.hasAttribute("required")) {
            const group = el.form?.elements.namedItem(name);
            const nodes: HTMLInputElement[] = group
                ? (group instanceof RadioNodeList ? Array.from(group) : [group]).filter(
                    (n: any): n is HTMLInputElement => n?.type === "radio"
                )
                : [];
            const anyChecked = nodes.some((r) => r.checked);
            if (!anyChecked) {
                return [{ key: "valueMissing", message: resolveMessage("valueMissing", el, options?.messages) }];
            }
        }
    }

    const v = (el as any).validity as ValidityState;
    const map: Array<[ValidityKey, boolean]> = [
        ["valueMissing", v.valueMissing],
        ["typeMismatch", v.typeMismatch],
        ["patternMismatch", v.patternMismatch],
        ["tooLong", v.tooLong],
        ["tooShort", v.tooShort],
        ["rangeUnderflow", v.rangeUnderflow],
        ["rangeOverflow", v.rangeOverflow],
        ["stepMismatch", v.stepMismatch],
        ["badInput", v.badInput],
        ["customError", v.customError],
    ];

    const errors: ControlError[] = [];
    for (const [key, active] of map) {
        if (active) errors.push({ key, message: resolveMessage(key, el, options?.messages) });
    }

    // Run any domain-specific extra validators
    if (options?.extra?.length) {
        for (const fn of options.extra) {
            const result = fn(el);
            if (result) errors.push(result);
        }
    }

    return errors;
}

/**
 * Validate a whole form and return a Map keyed by control name/id.
 * Only includes fields with errors.
 */
export function validateForm(
    form: HTMLFormElement,
    options?: { messages?: MessageMap; extra?: ExtraValidator[] }
): Map<string, ControlError[]> {
    const controls = Array.from(
        form.querySelectorAll<ValidatedEl>("input, select, textarea")
    );

    const out = new Map<string, ControlError[]>();
    for (const el of controls) {
        const errs = readControlErrors(el, options);
        if (errs.length) {
            const key = el.getAttribute("name") || el.id || el.tagName.toLowerCase();
            out.set(key, errs);
        }
    }
    return out;
}

/**
 * Optional helper to reflect state on the DOM (aria-invalid + data-error).
 * Call on input/change/blur as you prefer.
 */
export function reflectValidity(
    el: ValidatedEl,
    options?: { messages?: MessageMap; extra?: ExtraValidator[] }
) {
    const errs = readControlErrors(el, options);
    if (errs.length) {
        el.setAttribute("aria-invalid", "true");
        el.setAttribute("data-error", errs[0].message);
    } else {
        el.removeAttribute("aria-invalid");
        el.removeAttribute("data-error");
    }
    return errs;
}
