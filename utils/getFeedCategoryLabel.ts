export type ReelCategory =
    | string
    | { en?: string; ur?: string; icon?: string }
    | { name?: string | { en?: string; ur?: string }; icon?: string };

function pickLocalized(value: { en?: string; ur?: string } | undefined, lang: string): string {
    if (!value) return "";
    const key = lang === "ur" ? "ur" : "en";
    return value[key] ?? value.en ?? value.ur ?? "";
}

/** Resolves feed category from string, { en, ur }, or legacy { name } / { name: { en, ur } }. */
export function getFeedCategoryLabel(category: ReelCategory | null | undefined, lang: string): string {
    if (category == null) return "";
    if (typeof category === "string") return category;
    if ("name" in category && category.name != null) {
        if (typeof category.name === "string") return category.name;
        return pickLocalized(category.name, lang);
    }
    return pickLocalized(category as { en?: string; ur?: string }, lang);
}

export function getFeedCategoryIcon(
    category: ReelCategory | null | undefined,
): string | undefined {
    if (category == null || typeof category === "string") return undefined;
    const icon = category.icon;
    return typeof icon === "string" && icon.trim() ? icon : undefined;
}
