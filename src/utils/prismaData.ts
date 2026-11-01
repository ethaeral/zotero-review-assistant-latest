import { PRISMACategory } from "../types/addon"
import { countArticlesWithTag, getComments } from "./utils"

export type PRISMAFormData = {
    databases: number
    registers: number
    useOtherReasons: boolean
}

export function buildPrismaData(
    articles: Zotero.Item[],
    categories: PRISMACategory[],
    commentsTagPrefix: string,
    formData: PRISMAFormData,
) {
    const counts = Object.fromEntries(categories.map(cat => [cat.name, countArticlesWithTag(articles, cat.tag)]))
    const count = (name: string) => counts[name] ?? 0

    // Stage totals are independent of whether comments are used as reasons.
    const screened = articles.length - count("identification:duplicated") - count("identification:automation") - count("identification:other")
    const sought = screened - count("screening:screen:excluded")
    const assessed = sought - count("screening:retrieval:excluded")
    if (Math.min(screened, sought, assessed) < 0) {
        throw new Error("PRISMA categories produce negative totals. Check for conflicting category tags.")
    }

    const exclusionCategory = categories.find(cat => cat.name === "screening:eligibility:excluded")
    const reasons = new Map<string, number>()
    for (const article of articles) {
        if (!exclusionCategory || !article.hasTag(exclusionCategory.tag)) continue
        const comment = getComments(commentsTagPrefix, article)[0]?.slice(commentsTagPrefix.length).trim()
        const label = formData.useOtherReasons && exclusionCategory.allowCustomReason
            ? comment || "No reason provided"
            : exclusionCategory.label
        reasons.set(label, (reasons.get(label) ?? 0) + 1)
    }

    return {
        ...formData,
        ...counts,
        totalArticles: articles.length,
        "screening:screen": screened,
        "screening:retrieval": sought,
        "screening:eligibility": assessed,
        "screening:eligibility:excluded": Array.from(reasons, ([label, records]) => ({ label, records })),
        "included:studies": count("included:studies"),
        "included:reports": count("included:reports"),
    }
}
