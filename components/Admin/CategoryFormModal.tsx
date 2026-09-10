"use client";

import { useEffect, useRef, useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { BeatLoader } from "react-spinners";
import Image from "next/image";
import { toast } from "react-hot-toast";
import DoodleButton from "@/components/Ui/DoodleButton";
import Modal from "@/components/Ui/Modals/Modal";
import { Check, ChevronDown, ChevronUp, Plus, Tag, X } from "lucide-react";
import {
    useCreateNewCategoryMutation,
    useUpdateCategoryMutation,
} from "@/store/services/adminService";
import noImageIcon from "@/assets/images/new-no-image-placeholder.png";

export type CategoryType = "product" | "service" | "shop";

/**
 * One localised parameter definition as the API stores it — mirrors
 * `CategoryParameter` in the backend (`src/category/model/category.model.ts`).
 *
 * The admin editor never works with this shape directly (see `ParameterPair`
 * below); it only serialises to it on save and hydrates from it on open.
 */
export type CategoryParameter = {
    name: string;
    values: string[];
    isOptional?: boolean;
    /** Lets the end-user type their own value on top of the fixed list below. */
    allowCustomValue?: boolean;
    /** Lets the end-user pick more than one value from the list below. */
    allowMultiple?: boolean;
    /** Stable ids parallel to `values`, identical in spirit across en/ur (the
     *  server does not require them to match text-for-text, only that each
     *  locale's own array resolves against itself). Present once some other
     *  parameter depends on this one. */
    valueKeys?: string[];
    /** Name of an earlier parameter in the SAME locale array whose chosen
     *  value narrows this parameter's options. */
    dependsOn?: string;
    /** Present when `dependsOn` is set: parent value key -> this parameter's
     *  values under that parent value. `values` above is always the union of
     *  these lists — a plain client that has never heard of `dependsOn` still
     *  gets a full, usable option list. */
    valuesByParent?: Record<string, string[]>;
    /** Same shape as `valuesByParent`, but holding THIS parameter's own value
     *  keys instead of display text — what a grandchild parameter (depending
     *  on this one) resolves against once a cascade has narrowed this
     *  parameter down to one bucket. Sent explicitly so the server never has
     *  to fall back to guessing keys for us. */
    valueKeysByParent?: Record<string, string[]>;
};

export type CategoryParameters = {
    en: CategoryParameter[];
    ur: CategoryParameter[];
};

export type CategoryFormCategory = {
    id: string;
    name: { en: string; ur: string };
    type: CategoryType;
    icon?: string;
    parameters?: CategoryParameters;
    sortNumber?: number;
};

export type CategoryFormMode = "add" | { type: "edit"; category: CategoryFormCategory };

const CATEGORY_TYPE_OPTIONS: { value: CategoryType; label: string }[] = [
    { value: "product", label: "Product" },
    { value: "service", label: "Service" },
    { value: "shop", label: "Shop" },
];

type FormErrors = {
    nameEn?: string;
    nameUr?: string;
    sortNumber?: string;
    parameters?: string;
};

// ---------------------------------------------------------------------------
// Parameter editor — internal "paired" model
//
// The API keeps English and Urdu parameters as two independent arrays, lined
// up only by array position. Editing them as two independent lists (the old
// design) let that pairing drift silently — reorder one side, or add a value
// to only one, and English parameter 3 quietly becomes Urdu parameter 4.
//
// Internally the editor keeps ONE list of pairs — each pair carries both
// locales' text for one parameter and one set of values — so "same count in
// both languages" and "value N has both an English and an Urdu string" are
// true by construction instead of a submit-time check. It only splits back
// into { en: [...], ur: [...] } at save time (`pairsToApiParameters`) and
// only merges the two back together on open (`hydratePairs`).
// ---------------------------------------------------------------------------

/** One value inside a parameter — `key` is what a dependent (child) parameter
 *  addresses it by, never shown to the admin. */
type ParameterValue = {
    key: string;
    en: string;
    ur: string;
};

type ParameterPair = {
    /** Client-only id, used to reference this parameter as another one's
     *  parent. Never sent to the API — `pairsToApiParameters` turns it into
     *  the parent's actual name for `dependsOn`. */
    id: string;
    nameEn: string;
    nameUr: string;
    isOptional: boolean;
    allowCustomValue: boolean;
    allowMultiple: boolean;
    /** Another pair's `id`, or null. Must resolve to a pair EARLIER in the
     *  list — enforced wherever this can change (see `wouldBreakOrder`). */
    dependsOnId: string | null;
    /** Used when `dependsOnId` is null. */
    values: ParameterValue[];
    /** Used when `dependsOnId` is set: parent value key -> this parameter's
     *  values under that parent value. */
    valuesByParent: Record<string, ParameterValue[]>;
};

function randomId(prefix: string): string {
    return `${prefix}${Math.random().toString(36).slice(2, 9)}`;
}

function emptyPair(): ParameterPair {
    return {
        id: randomId("p"),
        nameEn: "",
        nameUr: "",
        isOptional: false,
        allowCustomValue: false,
        allowMultiple: false,
        dependsOnId: null,
        values: [],
        valuesByParent: {},
    };
}

/** The values a pair itself "owns" — its flat list if it isn't dependent,
 *  otherwise every value across every parent bucket (what a parameter
 *  further down the chain would see as this one's options). */
function ownValues(pair: ParameterPair): ParameterValue[] {
    if (pair.dependsOnId === null) return pair.values;
    return Object.values(pair.valuesByParent).flat();
}

/** Would swapping the pairs at these two adjacent indexes place a parameter
 *  after its own parent (or its parent after it)? Only the two swapped
 *  parameters' relative order can change in an adjacent swap, so this is the
 *  only case that needs checking. */
function wouldBreakOrder(pairs: ParameterPair[], indexA: number, indexB: number): boolean {
    const a = pairs[indexA];
    const b = pairs[indexB];
    return a.dependsOnId === b.id || b.dependsOnId === a.id;
}

/** Every pair, transitively, that depends on `pairId`. */
function descendantsOf(pairs: ParameterPair[], pairId: string): ParameterPair[] {
    const direct = pairs.filter((pair) => pair.dependsOnId === pairId);
    return direct.concat(direct.flatMap((child) => descendantsOf(pairs, child.id)));
}

/**
 * Removes the given value keys from `pairId`'s own store, then — because
 * those keys may be exactly what a child parameter's `valuesByParent` is
 * keyed on — removes the matching buckets from every direct child, and
 * recurses into whichever of THEIR keys just disappeared as a result. This is
 * what keeps a multi-level chain (e.g. Variant depending on Model depending
 * on Make) consistent when a value anywhere in the middle is deleted.
 */
function removeValuesCascade(
    pairs: ParameterPair[],
    pairId: string,
    keysToRemove: string[],
): ParameterPair[] {
    if (keysToRemove.length === 0) return pairs;

    let next = pairs;
    const removeSet = new Set(keysToRemove);

    for (const child of pairs.filter((pair) => pair.dependsOnId === pairId)) {
        const removedFromChild: string[] = [];
        const nextValuesByParent: Record<string, ParameterValue[]> = {};

        for (const [key, values] of Object.entries(child.valuesByParent)) {
            if (removeSet.has(key)) {
                removedFromChild.push(...values.map((value) => value.key));
            } else {
                nextValuesByParent[key] = values;
            }
        }

        next = next.map((pair) =>
            pair.id === child.id ? { ...pair, valuesByParent: nextValuesByParent } : pair,
        );

        if (removedFromChild.length > 0) {
            next = removeValuesCascade(next, child.id, removedFromChild);
        }
    }

    return next;
}

/** Splits the paired model back into the API's two-array shape. Assumes every
 *  pair is already complete (see `validateParameters`) — it does not filter. */
/** Urdu is no longer collected in the parameter editor — the admin only ever
 *  types English now. A parameter created since that change has a blank
 *  `.ur`/`nameUr`, so the Urdu locale array falls back to the English text
 *  rather than submitting an empty string; a category whose Urdu was
 *  genuinely translated before this change keeps that real text untouched,
 *  since the fallback only applies when `.ur` is blank. */
function urOrFallback(ur: string, en: string): string {
    return ur.trim() || en.trim();
}

function pairsToApiParameters(pairs: ParameterPair[]): CategoryParameters {
    const nameById = new Map(
        pairs.map((pair) => [pair.id, { en: pair.nameEn.trim(), ur: urOrFallback(pair.nameUr, pair.nameEn) }]),
    );

    function toEntry(pair: ParameterPair, locale: "en" | "ur"): CategoryParameter {
        const own = ownValues(pair);
        const entry: CategoryParameter = {
            name: locale === "en" ? pair.nameEn.trim() : urOrFallback(pair.nameUr, pair.nameEn),
            values: own.map((value) =>
                locale === "en" ? value.en.trim() : urOrFallback(value.ur, value.en),
            ),
            isOptional: pair.isOptional,
            allowCustomValue: pair.allowCustomValue,
            allowMultiple: pair.allowMultiple,
            valueKeys: own.map((value) => value.key),
        };

        if (pair.dependsOnId) {
            const parentName = nameById.get(pair.dependsOnId)?.[locale];
            const valuesByParent: Record<string, string[]> = {};
            const valueKeysByParent: Record<string, string[]> = {};
            for (const [key, values] of Object.entries(pair.valuesByParent)) {
                valuesByParent[key] = values.map((value) =>
                    locale === "en" ? value.en.trim() : urOrFallback(value.ur, value.en),
                );
                // Sent explicitly, bucket by bucket, so the server never has to
                // guess which of this parameter's own keys belongs to which of
                // ITS parent's buckets — that pairing is what a grandchild
                // parameter (e.g. Variant, off Model, off Make) resolves
                // against once a cascade has narrowed this one down to a
                // single bucket.
                valueKeysByParent[key] = values.map((value) => value.key);
            }
            entry.dependsOn = parentName ?? "";
            entry.valuesByParent = valuesByParent;
            entry.valueKeysByParent = valueKeysByParent;
        }

        return entry;
    }

    return {
        en: pairs.map((pair) => toEntry(pair, "en")),
        ur: pairs.map((pair) => toEntry(pair, "ur")),
    };
}

/** Rebuilds the paired model from the API's two-array shape (used when
 *  opening the modal to edit an existing category). Positional alignment
 *  between `en[i]`/`ur[i]` is the same convention the API has always used. */
function hydratePairs(en: CategoryParameter[], ur: CategoryParameter[]): ParameterPair[] {
    const ids = en.map(() => randomId("p"));
    const nameToIndex = new Map(en.map((entry, index) => [entry.name, index]));

    return en.map((entry, index) => {
        const urEntry = ur[index];
        const base = {
            id: ids[index],
            nameEn: typeof entry?.name === "string" ? entry.name : "",
            nameUr: typeof urEntry?.name === "string" ? urEntry.name : "",
            isOptional: entry?.isOptional ?? false,
            allowCustomValue: entry?.allowCustomValue ?? false,
            allowMultiple: entry?.allowMultiple ?? false,
        };

        const parentIndex = entry?.dependsOn ? nameToIndex.get(entry.dependsOn) : undefined;
        // Guard against stored data that is malformed (a forward or unknown
        // reference) rather than let it crash the editor — it just opens as a
        // flat, non-dependent parameter, which the admin can re-link.
        const dependsOnId =
            parentIndex !== undefined && parentIndex < index ? ids[parentIndex] : null;

        if (dependsOnId && entry?.valuesByParent) {
            const urByParent = urEntry?.valuesByParent ?? {};
            const enKeysByParent = entry.valueKeysByParent ?? {};
            const valuesByParent: Record<string, ParameterValue[]> = {};
            for (const [key, values] of Object.entries(entry.valuesByParent)) {
                const urValues = urByParent[key] ?? [];
                const storedKeys = enKeysByParent[key];
                const hasStoredKeys = Array.isArray(storedKeys) && storedKeys.length === values.length;
                valuesByParent[key] = values.map((text, valueIndex) => ({
                    // Preserve the API's own key for this value when available
                    // — a grandchild parameter's `valuesByParent` is keyed
                    // against THESE. Regenerating them at random here (as this
                    // used to) left a saved cascade with two disconnected key
                    // spaces: this parameter's own values kept the real keys,
                    // but the pair only ever saw the random ones, so master/
                    // detail lookups here and the whole thing further down the
                    // chain came up empty even though the data was intact.
                    key: hasStoredKeys ? storedKeys[valueIndex] : randomId("v"),
                    en: text,
                    ur: urValues[valueIndex] ?? "",
                }));
            }
            return { ...base, dependsOnId, values: [], valuesByParent };
        }

        const enValues = Array.isArray(entry?.values) ? entry.values : [];
        const urValues = Array.isArray(urEntry?.values) ? urEntry.values : [];
        const storedKeys = entry?.valueKeys;
        const hasStoredKeys = Array.isArray(storedKeys) && storedKeys.length === enValues.length;
        const values: ParameterValue[] = enValues.map((text, valueIndex) => ({
            key: hasStoredKeys ? storedKeys[valueIndex] : randomId("v"),
            en: text,
            ur: urValues[valueIndex] ?? "",
        }));

        return { ...base, dependsOnId: null, values, valuesByParent: {} };
    });
}

function validateParameters(pairs: ParameterPair[]): string | undefined {
    for (const pair of pairs) {
        const label = pair.nameEn.trim() || pair.nameUr.trim() || "(unnamed)";

        if (!pair.nameEn.trim()) return `Enter a name for "${label}"`;

        if (pair.dependsOnId === null) {
            if (pair.values.length === 0) {
                return `Add at least one value for the parameter "${label}"`;
            }
            continue;
        }

        const parent = pairs.find((candidate) => candidate.id === pair.dependsOnId);
        if (!parent) {
            return `"${label}" depends on a parameter that no longer exists — pick another one`;
        }
        const buckets = Object.values(pair.valuesByParent);
        if (buckets.every((values) => values.length === 0)) {
            return `Add values for "${label}" under at least one value of "${parent.nameEn.trim() || parent.nameUr.trim()}"`;
        }
    }

    return undefined;
}

function buildParametersPayload(pairs: ParameterPair[]): CategoryParameters | undefined {
    if (pairs.length === 0) return undefined;
    return pairsToApiParameters(pairs);
}

/** A row of paired EN/UR text inputs plus a delete button — the atomic unit
 *  for a value, used both for a flat parameter's list and for one bucket
 *  inside a dependent parameter's master/detail editor. */
function ValueList({
    idPrefix,
    values,
    onChange,
}: {
    idPrefix: string;
    values: ParameterValue[];
    onChange: (values: ParameterValue[]) => void;
}) {
    const [draftEn, setDraftEn] = useState("");

    function addValue() {
        const en = draftEn.trim();
        if (!en) return;
        onChange([...values, { key: randomId("v"), en, ur: en }]);
        setDraftEn("");
    }

    function updateValue(key: string, patch: Partial<ParameterValue>) {
        onChange(values.map((value) => (value.key === key ? { ...value, ...patch } : value)));
    }

    function removeValue(key: string) {
        onChange(values.filter((value) => value.key !== key));
    }

    return (
        <div>
            {values.length > 0 && (
                <div className="space-y-1.5">
                    {values.map((value) => (
                        <div key={value.key} className="flex items-center gap-1.5">
                            <input
                                type="text"
                                value={value.en}
                                placeholder="English"
                                onChange={(event) => updateValue(value.key, { en: event.target.value })}
                                className="w-full rounded-[6px] border border-gray-9 bg-white px-2 py-1 text-[13px] text-[#001907] outline-none focus:border-green-1"
                            />
                            <button
                                type="button"
                                onClick={() => removeValue(value.key)}
                                className="inline-flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center text-gray-11 hover:text-red-1"
                                aria-label="Remove value"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
            <div className={`flex items-center gap-1.5 ${values.length > 0 ? "mt-2" : ""}`}>
                <input
                    id={`${idPrefix}-add-en`}
                    type="text"
                    value={draftEn}
                    placeholder="Add value (English)"
                    onChange={(event) => setDraftEn(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === "Enter") {
                            event.preventDefault();
                            addValue();
                        }
                    }}
                    // A value typed here isn't part of the parameter until it's
                    // committed — without this, clicking straight from this box
                    // to Save/Save as draft (skipping Enter or the + button)
                    // silently discarded whatever was typed, saving the
                    // parameter's name with no values at all.
                    onBlur={addValue}
                    className="w-full rounded-[6px] border border-dashed border-gray-9 bg-white px-2 py-1 text-[13px] text-[#001907] outline-none focus:border-green-1"
                />
                <button
                    type="button"
                    onClick={addValue}
                    disabled={!draftEn.trim()}
                    className="inline-flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-green-1 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Add value"
                >
                    <Plus className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}

/** The value editor for one dependent parameter: pick one of the parent's
 *  values on the left, edit that value's children on the right. Modeled on
 *  the same parent/child split as PermissionsPicker. */
function DependentValueEditor({
    idPrefix,
    parent,
    pair,
    onChange,
}: {
    idPrefix: string;
    parent: ParameterPair;
    pair: ParameterPair;
    onChange: (valuesByParent: Record<string, ParameterValue[]>) => void;
}) {
    const parentValues = ownValues(parent);
    const [selectedKey, setSelectedKey] = useState<string | null>(parentValues[0]?.key ?? null);

    useEffect(() => {
        if (selectedKey && parentValues.some((value) => value.key === selectedKey)) return;
        setSelectedKey(parentValues[0]?.key ?? null);
        // Only re-run when the parent's own value set changes shape, not on
        // every render of this component.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [parentValues.map((value) => value.key).join(",")]);

    if (parentValues.length === 0) {
        return (
            <p className="mt-3 text-[12px] italic text-gray-11">
                Add values to &quot;{parent.nameEn.trim() || parent.nameUr.trim() || "the parent parameter"}&quot; first.
            </p>
        );
    }

    return (
        <div className="mt-3 grid grid-cols-[minmax(0,140px)_1fr] gap-3 rounded-[8px] border border-gray-9 p-2">
            <div className="max-h-[220px] space-y-1 overflow-y-auto border-r border-gray-9 pr-2">
                {parentValues.map((value) => {
                    const count = pair.valuesByParent[value.key]?.length ?? 0;
                    return (
                        <button
                            key={value.key}
                            type="button"
                            onClick={() => setSelectedKey(value.key)}
                            className={`block w-full cursor-pointer rounded-[6px] px-2 py-1.5 text-left text-[13px] ${
                                selectedKey === value.key
                                    ? "bg-[#E6FBFB] font-medium text-[#001907]"
                                    : "text-gray-11 hover:bg-gray-13"
                            }`}
                        >
                            {value.en || value.ur || "—"}
                            <span className="ml-1 text-[11px] text-gray-11">({count})</span>
                        </button>
                    );
                })}
            </div>
            <div>
                {selectedKey ? (
                    <ValueList
                        idPrefix={`${idPrefix}-${selectedKey}`}
                        values={pair.valuesByParent[selectedKey] ?? []}
                        onChange={(values) =>
                            onChange({ ...pair.valuesByParent, [selectedKey]: values })
                        }
                    />
                ) : null}
            </div>
        </div>
    );
}

function ParameterPairRow({
    idPrefix,
    index,
    pairs,
    pair,
    onChange,
    onRemove,
    onMove,
}: {
    idPrefix: string;
    index: number;
    pairs: ParameterPair[];
    pair: ParameterPair;
    onChange: (pair: ParameterPair) => void;
    onRemove: () => void;
    onMove: (direction: -1 | 1) => void;
}) {
    const earlierPairs = pairs.slice(0, index);
    const dependents = descendantsOf(pairs, pair.id);
    const hasDependents = dependents.length > 0;
    const dependencyParent = pair.dependsOnId
        ? pairs.find((candidate) => candidate.id === pair.dependsOnId) ?? null
        : null;

    const canMoveUp = index > 0 && !wouldBreakOrder(pairs, index, index - 1);
    const canMoveDown = index < pairs.length - 1 && !wouldBreakOrder(pairs, index, index + 1);

    function handleDependsOnChange(nextParentId: string) {
        // Switching what this depends on invalidates the old parent-keyed
        // buckets — there's no sound way to carry values across to a
        // different parent, so it starts fresh rather than silently keeping
        // stale data under the wrong parent.
        onChange({
            ...pair,
            dependsOnId: nextParentId || null,
            values: [],
            valuesByParent: {},
        });
    }

    return (
        <div className="rounded-[8px] border border-gray-9 p-3">
            <div className="flex items-start gap-2">
                <div className="flex-1">
                    <input
                        id={`${idPrefix}-name-en-${index}`}
                        type="text"
                        value={pair.nameEn}
                        placeholder="Parameter name (English), e.g. Make"
                        onChange={(event) => onChange({ ...pair, nameEn: event.target.value })}
                        className="w-full border-0 border-b border-gray-9 bg-transparent py-1 text-[14px] font-medium text-[#001907] outline-none focus:border-green-1"
                    />
                </div>
                <div className="flex shrink-0 items-center gap-0.5">
                    <button
                        type="button"
                        onClick={() => onMove(-1)}
                        disabled={!canMoveUp}
                        title={!canMoveUp && index > 0 ? "Would move this above its parent" : undefined}
                        className="inline-flex h-7 w-7 cursor-pointer items-center justify-center text-gray-11 hover:text-green-1 disabled:cursor-not-allowed disabled:opacity-30"
                        aria-label={`Move parameter ${index + 1} up`}
                    >
                        <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => onMove(1)}
                        disabled={!canMoveDown}
                        title={
                            !canMoveDown && index < pairs.length - 1
                                ? "Would move a dependent parameter above this one"
                                : undefined
                        }
                        className="inline-flex h-7 w-7 cursor-pointer items-center justify-center text-gray-11 hover:text-green-1 disabled:cursor-not-allowed disabled:opacity-30"
                        aria-label={`Move parameter ${index + 1} down`}
                    >
                        <ChevronDown className="h-4 w-4" />
                    </button>
                    <button
                        type="button"
                        onClick={onRemove}
                        disabled={hasDependents}
                        title={
                            hasDependents
                                ? `Depended on by ${dependents.map((d) => d.nameEn.trim() || d.nameUr.trim() || "(unnamed)").join(", ")}`
                                : undefined
                        }
                        className="inline-flex h-7 w-7 cursor-pointer items-center justify-center text-gray-11 hover:text-red-1 disabled:cursor-not-allowed disabled:opacity-30"
                        aria-label={`Remove parameter ${index + 1}`}
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5">
                <label className="flex cursor-pointer items-center gap-1.5 text-[12px] text-gray-11">
                    <input
                        type="checkbox"
                        checked={pair.isOptional}
                        onChange={() => onChange({ ...pair, isOptional: !pair.isOptional })}
                        className="h-3.5 w-3.5 accent-green-1"
                    />
                    Optional
                </label>
                <label className="flex cursor-pointer items-center gap-1.5 text-[12px] text-gray-11">
                    <input
                        type="checkbox"
                        checked={pair.allowCustomValue}
                        onChange={() => onChange({ ...pair, allowCustomValue: !pair.allowCustomValue })}
                        className="h-3.5 w-3.5 accent-green-1"
                    />
                    Allow custom value
                </label>
                <label className="flex cursor-pointer items-center gap-1.5 text-[12px] text-gray-11">
                    <input
                        type="checkbox"
                        checked={pair.allowMultiple}
                        onChange={() => onChange({ ...pair, allowMultiple: !pair.allowMultiple })}
                        className="h-3.5 w-3.5 accent-green-1"
                    />
                    Allow multiple
                </label>
            </div>

            <div className="mt-2.5">
                <label
                    htmlFor={`${idPrefix}-depends-on-${index}`}
                    className="text-[12px] text-gray-11"
                >
                    Depends on
                </label>
                <select
                    id={`${idPrefix}-depends-on-${index}`}
                    value={pair.dependsOnId ?? ""}
                    onChange={(event) => handleDependsOnChange(event.target.value)}
                    disabled={earlierPairs.length === 0}
                    className="mt-1 block w-full max-w-[260px] rounded-[6px] border border-gray-9 bg-white px-2 py-1.5 text-[13px] text-[#001907] outline-none focus:border-green-1 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <option value="">Not dependent — its own value list</option>
                    {earlierPairs.map((candidate) => (
                        <option key={candidate.id} value={candidate.id}>
                            {candidate.nameEn.trim() || candidate.nameUr.trim() || "(unnamed)"}
                        </option>
                    ))}
                </select>
            </div>

            <div className="mt-3">
                {dependencyParent ? (
                    <DependentValueEditor
                        idPrefix={`${idPrefix}-${index}`}
                        parent={dependencyParent}
                        pair={pair}
                        onChange={(valuesByParent) => onChange({ ...pair, valuesByParent })}
                    />
                ) : (
                    <ValueList
                        idPrefix={`${idPrefix}-values-${index}`}
                        values={pair.values}
                        onChange={(values) => onChange({ ...pair, values })}
                    />
                )}
            </div>
        </div>
    );
}

function ParameterPairEditor({
    pairs,
    onChange,
}: {
    pairs: ParameterPair[];
    onChange: (pairs: ParameterPair[]) => void;
}) {
    function updatePair(index: number, next: ParameterPair) {
        // Any edit can shrink this pair's own value set — deleting a value
        // chip, deleting a value from one parent-bucket, or changing what
        // this parameter depends on (which resets it to empty). Whenever that
        // happens, cascade the same way `removeValuesCascade` does for an
        // explicit delete: a key that just disappeared from here can't be
        // left dangling in a child's `valuesByParent`.
        const previousKeys = new Set(ownValues(pairs[index]).map((value) => value.key));
        const nextKeys = new Set(ownValues(next).map((value) => value.key));
        const removedKeys = [...previousKeys].filter((key) => !nextKeys.has(key));

        let updated = pairs.map((pair, i) => (i === index ? next : pair));
        if (removedKeys.length > 0) {
            updated = removeValuesCascade(updated, next.id, removedKeys);
        }
        onChange(updated);
    }

    function removePair(index: number) {
        const removedId = pairs[index].id;
        const removedKeys = ownValues(pairs[index]).map((value) => value.key);
        let next = pairs.filter((_, i) => i !== index);
        // Nothing should still be depending on this row by the time we reach
        // here (the button is disabled otherwise), but clear any stray
        // references defensively rather than leave a dangling dependsOnId.
        next = next.map((pair) => (pair.dependsOnId === removedId ? { ...pair, dependsOnId: null, valuesByParent: {} } : pair));
        next = removeValuesCascade(next, removedId, removedKeys);
        onChange(next);
    }

    function movePair(index: number, direction: -1 | 1) {
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= pairs.length) return;
        if (wouldBreakOrder(pairs, index, targetIndex)) return;

        const next = [...pairs];
        [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
        onChange(next);
    }

    return (
        <div className="space-y-4">
            {pairs.map((pair, index) => (
                <ParameterPairRow
                    key={pair.id}
                    idPrefix="category-parameter"
                    index={index}
                    pairs={pairs}
                    pair={pair}
                    onChange={(next) => updatePair(index, next)}
                    onRemove={() => removePair(index)}
                    onMove={(direction) => movePair(index, direction)}
                />
            ))}
            <button
                type="button"
                onClick={() => onChange([...pairs, emptyPair()])}
                className="inline-flex cursor-pointer items-center gap-1 text-[14px] font-medium text-green-1"
            >
                <Plus className="h-4 w-4" />
                Add parameter
            </button>
        </div>
    );
}

type CategoryFormModalProps = {
    open: boolean;
    mode: CategoryFormMode;
    onClose: () => void;
    /** Pre-selected type for "add" mode — e.g. matching whichever tab is active. */
    defaultType?: CategoryType;
};

function CategoryFormModal({ open, mode, onClose, defaultType }: CategoryFormModalProps) {
    const isEdit = mode !== "add";
    const editCategory = isEdit ? mode.category : null;
    const modalRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [nameEn, setNameEn] = useState("");
    const [nameUr, setNameUr] = useState("");
    const [type, setType] = useState<CategoryType>("product");
    const [sortNumber, setSortNumber] = useState("1");
    const [iconPreview, setIconPreview] = useState<string | null>(null);
    const [iconFile, setIconFile] = useState<File | null>(null);
    const [pairs, setPairs] = useState<ParameterPair[]>([]);
    const [errors, setErrors] = useState<FormErrors>({});

    const [createNewCategory, { isLoading: isCreatingCategory }] = useCreateNewCategoryMutation();
    const [updateCategory, { isLoading: isUpdatingCategory }] = useUpdateCategoryMutation();
    const isSubmitting = isCreatingCategory || isUpdatingCategory;

    useEffect(() => {
        if (!open) return;

        setNameEn(editCategory?.name.en ?? "");
        setNameUr(editCategory?.name.ur ?? "");
        setType(editCategory?.type ?? defaultType ?? "product");
        setSortNumber(
            editCategory?.sortNumber !== undefined && editCategory?.sortNumber !== null
                ? String(editCategory.sortNumber)
                : "1",
        );
        setIconPreview(editCategory?.icon ?? null);
        setIconFile(null);
        setPairs(hydratePairs(editCategory?.parameters?.en ?? [], editCategory?.parameters?.ur ?? []));
        setErrors({});
    }, [open, editCategory, defaultType]);

    function clearParametersError() {
        setErrors((prev) => (prev.parameters ? { ...prev, parameters: undefined } : prev));
    }

    function handlePairsChange(next: ParameterPair[]) {
        setPairs(next);
        clearParametersError();
    }

    function handleSaveDraft() {
        void handleSubmit(true);
    }
    function handleSetOpen(value: React.SetStateAction<boolean>) {
        const nextOpen = typeof value === "function" ? value(open) : value;
        if (!nextOpen && !isSubmitting) {
            onClose();
        }
    }

    function handleClose() {
        if (isSubmitting) return;
        onClose();
    }

    async function handleSubmit(saveAsDraft = false) {
        const nextErrors: FormErrors = {};

        if (!saveAsDraft && !nameEn.trim()) {
            nextErrors.nameEn = "English category name is required";
        }

        if (!saveAsDraft && !nameUr.trim()) {
            nextErrors.nameUr = "Urdu category name is required";
        }

        const trimmedSortNumber = sortNumber.trim();
        let parsedSortNumber = trimmedSortNumber === "" ? NaN : Number(trimmedSortNumber);
        if (trimmedSortNumber === "") {
            if (saveAsDraft) {
                parsedSortNumber = 1;
            } else {
                nextErrors.sortNumber = "Sort number is required";
            }
        } else if (!Number.isInteger(parsedSortNumber) || parsedSortNumber < 1) {
            if (saveAsDraft) {
                parsedSortNumber = 1;
            } else {
                nextErrors.sortNumber = "Sort number must be an integer starting from 1";
            }
        }

        const parametersError = saveAsDraft ? undefined : validateParameters(pairs);
        if (parametersError) {
            nextErrors.parameters = parametersError;
        }

        if (Object.keys(nextErrors).length > 0) {
            setErrors(nextErrors);
            const firstErrorFieldId = nextErrors.sortNumber
                ? "category-sort-number"
                : nextErrors.nameEn
                    ? "category-name-en"
                    : nextErrors.nameUr
                        ? "category-name-ur"
                        : "category-parameters-section";
            document
                .getElementById(firstErrorFieldId)
                ?.scrollIntoView({ behavior: "smooth", block: "center" });
            return;
        }

        const trimmedNameEn = nameEn.trim();
        const trimmedNameUr = nameUr.trim();
        const name = { en: trimmedNameEn, ur: trimmedNameUr };
        const parameters = buildParametersPayload(pairs);
        // A draft isn't finished yet, so the backend keeps it out of every
        // public category list (findAll/findOne both filter isDraft: false)
        // regardless of isDisabled, which stays its own, unrelated
        // activate/deactivate concept — unaffected by draft status.
        const payload = {
            name,
            type,
            isDisabled: false,
            isDraft: saveAsDraft,
            sortNumber: parsedSortNumber,
            ...(parameters ? { parameters } : {}),
        };
        const body = iconFile
            ? (() => {
                const formData = new FormData();
                formData.append("name", JSON.stringify(name));
                formData.append("type", type);
                formData.append("icon", iconFile);
                formData.append("isDisabled", "false");
                formData.append("isDraft", String(saveAsDraft));
                formData.append("sortNumber", String(parsedSortNumber));
                if (parameters) {
                    formData.append("parameters", JSON.stringify(parameters));
                }
                return formData;
            })()
            : payload;

        try {
            if (isEdit && editCategory) {
                const response = await updateCategory({
                    id: editCategory.id,
                    body,
                }).unwrap();
                toast.success(
                    (response as { message?: string })?.message ?? (saveAsDraft ? "Category draft saved" : "Category updated successfully"),
                );
            } else {
                const response = await createNewCategory(body).unwrap();
                toast.success(
                    (response as { message?: string })?.message ?? (saveAsDraft ? "Category draft saved" : "Category created successfully"),
                );
            }
            onClose();
        } catch (err) {
            const errorData = err as { data?: { message?: string } };
            toast.error(errorData?.data?.message ?? "Something went wrong");
        }
    }

    return (
        <Modal editModalRef={modalRef} open={open} setOpen={handleSetOpen} centered>
            <div className="flex max-h-[85vh] w-[92vw] max-w-[800px] flex-col rounded-[12px] bg-white shadow-xl">
                <div className="flex shrink-0 items-start justify-between gap-4 border-b border-gray-9 px-6 pb-4 pt-6">
                    <h2 className="flex items-center gap-2 text-[18px] font-semibold text-[#001907]">
                        <Tag className="h-5 w-5 text-green-1" strokeWidth={2} />
                        {isEdit ? "Edit category" : "Add category"}
                    </h2>
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={isSubmitting}
                        aria-label="Close"
                        className="inline-flex h-8 w-8 items-center justify-center disabled:opacity-60"
                    >
                        <XMarkIcon className="h-5 w-5 text-[#001907]" />
                    </button>
                </div>

                <div className="hide-scrollbar min-h-0 flex-1 overflow-y-auto px-6 py-4">
                <p className="text-[14px] leading-6 text-gray-11">
                    {isEdit
                        ? "You can update the name of this category. Changes will reflect immediately across all associated listings."
                        : "Add a new category. It will be available immediately across all associated listings."}
                </p>
                <div className="mt-6 flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#E6FBFB]">
                        {iconPreview ? (
                            <Image
                                src={iconPreview}
                                alt=""
                                width={24}
                                height={24}
                                unoptimized
                                className="h-6 w-6 object-contain"
                            />
                        ) : (
                            <Image src={noImageIcon} alt="no image" className="w-10  object-cover" />
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-[14px] cursor-pointer font-medium text-green-1"
                    >
                        {isEdit ? "Edit icon" : "Add icon"}
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (!file) return;
                            setIconFile(file);
                            setIconPreview(URL.createObjectURL(file));
                        }}
                    />
                </div>
                <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                        <label
                            htmlFor="category-type"
                            className="text-[14px] font-normal text-gray-11"
                        >
                            Type
                        </label>
                        <div className="relative mt-2">
                            <select
                                id="category-type"
                                value={type}
                                onChange={(event) => setType(event.target.value as CategoryType)}
                                className="w-full appearance-none border-0 border-b border-gray-9 bg-transparent py-2 pr-8 text-[14px] text-[#001907] outline-none focus:border-green-1"
                            >
                                {CATEGORY_TYPE_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="pointer-events-none cursor-pointer absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-11" />
                        </div>
                    </div>

                    <div>
                        <label
                            htmlFor="category-sort-number"
                            className={`text-[14px] font-normal ${errors.sortNumber ? "text-red-1" : "text-gray-11"}`}
                        >
                            Sort number
                        </label>
                        <input
                            id="category-sort-number"
                            type="number"
                            min={1}
                            step={1}
                            required
                            value={sortNumber}
                            onChange={(event) => {
                                setSortNumber(event.target.value);
                                if (errors.sortNumber) {
                                    setErrors((prev) => ({ ...prev, sortNumber: undefined }));
                                }
                            }}
                            placeholder="1"
                            className={`mt-2 w-full border-0 border-b bg-transparent py-2 text-[14px] text-[#001907] outline-none ${errors.sortNumber ? "border-red-1 focus:border-red-1" : "border-gray-9 focus:border-green-1"}`}
                        />
                        {errors.sortNumber && (
                            <p className="mt-1 text-[12px] font-normal text-red-1">{errors.sortNumber}</p>
                        )}
                    </div>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                        <label
                            htmlFor="category-name-en"
                            className={`text-[14px] font-normal ${errors.nameEn ? "text-red-1" : "text-gray-11"}`}
                        >
                            Category name (English)
                        </label>
                        <input
                            id="category-name-en"
                            type="text"
                            value={nameEn}
                            onChange={(event) => {
                                setNameEn(event.target.value);
                                if (errors.nameEn) {
                                    setErrors((prev) => ({ ...prev, nameEn: undefined }));
                                }
                            }}
                            placeholder="Enter category name"
                            className={`mt-2 w-full border-0 border-b bg-transparent py-2 text-[14px] text-[#001907] outline-none ${errors.nameEn ? "border-red-1 focus:border-red-1" : "border-gray-9 focus:border-green-1"}`}
                        />
                        {errors.nameEn && (
                            <p className="mt-1 text-[12px] font-normal text-red-1">{errors.nameEn}</p>
                        )}
                    </div>

                    <div>
                        <label
                            htmlFor="category-name-ur"
                            className={`text-[14px] font-normal ${errors.nameUr ? "text-red-1" : "text-gray-11"}`}
                        >
                            Category name (Urdu)
                        </label>
                        <input
                            id="category-name-ur"
                            type="text"
                            value={nameUr}
                            onChange={(event) => {
                                setNameUr(event.target.value);
                                if (errors.nameUr) {
                                    setErrors((prev) => ({ ...prev, nameUr: undefined }));
                                }
                            }}
                            placeholder="کیٹیگری کا نام لکھیں"
                            dir="rtl"
                            className={`mt-2 w-full border-0 border-b bg-transparent py-2 text-[14px] text-[#001907] outline-none ${errors.nameUr ? "border-red-1 focus:border-red-1" : "border-gray-9 focus:border-green-1"}`}
                        />
                        {errors.nameUr && (
                            <p className="mt-1 text-[12px] font-normal text-red-1">{errors.nameUr}</p>
                        )}
                    </div>
                </div>

                <div id="category-parameters-section" className="mt-8 border-t border-gray-9 pt-6">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                            <p className="text-[12px] font-medium uppercase tracking-wide text-gray-6">
                                Parameters (optional)
                            </p>
                            <p className="mt-0.5 text-[12px] text-gray-11">
                                Set &quot;Depends on&quot; to make a parameter&apos;s options change with an
                                earlier one — e.g. Model depends on Make, Variant depends on Model.
                            </p>
                        </div>
                    </div>
                    <div className="mt-4">
                        <ParameterPairEditor pairs={pairs} onChange={handlePairsChange} />
                    </div>
                    {errors.parameters && (
                        <p className="mt-3 text-[12px] font-normal text-red-1">{errors.parameters}</p>
                    )}
                </div>
                </div>
                <div className="flex shrink-0 justify-end gap-3 border-t border-gray-9 px-6 py-4">
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={isSubmitting}
                        className="h-[40px] min-w-[100px] cursor-pointer rounded-[8px] border border-green-1 px-4 text-[14px] font-medium text-green-1 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSaveDraft}
                        disabled={isSubmitting}
                        className="h-[40px] min-w-[120px] cursor-pointer rounded-[8px] border border-green-1 px-4 text-[14px] font-medium text-green-1 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        Save as draft
                    </button>
                    <DoodleButton
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => void handleSubmit()}
                        className="h-[40px] min-w-[150px] cursor-pointer rounded-[8px] border border-green-1 bg-green-1 px-4 text-[14px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isSubmitting ? (
                            <BeatLoader color="white" size={8} />
                        ) : isEdit ? (
                            <>
                                <Check className="h-4 w-4" strokeWidth={2} />
                                Confirm Changes
                            </>
                        ) : (
                            <>
                                <Plus className="h-4 w-4" strokeWidth={2} />
                                Add category
                            </>
                        )}
                    </DoodleButton>
                </div>
            </div>
        </Modal>
    );
}

export default CategoryFormModal;
