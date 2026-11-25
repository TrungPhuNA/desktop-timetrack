/**
 * Bộ chấm điểm SEO On-Page 100% Local (Không tốn Token AI)
 * Mục đích: Kiểm tra realtime các tiêu chí Google E-E-A-T & On-Page căn bản khi biên tập bài
 */

export interface SeoCheckItem {
    id: string;
    label: string;
    status: "pass" | "warn" | "fail";
    detail: string;
    points: number;
    maxPoints: number;
}

export interface SeoAuditResult {
    score: number;
    wordCount: number;
    h2Count: number;
    h3Count: number;
    keywordCount: number;
    keywordDensity: number;
    internalLinkCount: number;
    checks: SeoCheckItem[];
}

/**
 * Chuẩn hóa chuỗi tiếng Việt có dấu thành URL Slug chuẩn SEO
 */
export function toSeoSlug(text: string): string {
    return text
        .toLowerCase()
        .replace(/đ/g, "d")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s-]/g, " ")
        .trim()
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
}

/**
 * Đếm số từ thực tế trong Markdown (loại bỏ cú pháp #, *, links URL)
 */
export function countMarkdownWords(markdown: string): number {
    const plain = markdown
        .replace(/```[\s\S]*?```/g, " ")
        .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
        .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
        .replace(/[#>*_`|~-]/g, " ")
        .trim();

    if (!plain) return 0;
    return plain.split(/\s+/).filter(Boolean).length;
}

/**
 * Đếm số lần xuất hiện cụm từ khóa chính (không phân biệt hoa thường)
 */
function countKeywordOccurrences(text: string, keyword: string): number {
    const kw = keyword.trim().toLowerCase();
    if (!kw) return 0;
    const lowerText = text.toLowerCase();
    let count = 0;
    let pos = 0;
    while (true) {
        const idx = lowerText.indexOf(kw, pos);
        if (idx === -1) break;
        count += 1;
        pos = idx + kw.length;
    }
    return count;
}

/**
 * Phân tích & chấm điểm SEO On-Page tổng hợp (Thang điểm 0 - 100)
 */
export function analyzeSeoOnPage(params: {
    primaryKeyword: string;
    title: string;
    slug: string;
    metaTitle: string;
    metaDescription: string;
    contentMarkdown: string;
    targetWordCount?: number;
}): SeoAuditResult {
    const {
        primaryKeyword,
        title,
        slug,
        metaTitle,
        metaDescription,
        contentMarkdown,
        targetWordCount = 1800,
    } = params;

    const kw = primaryKeyword.trim().toLowerCase();
    const wordCount = countMarkdownWords(contentMarkdown);
    const lines = contentMarkdown.split(/\r?\n/);

    const h2Count = lines.filter((l) => /^##\s+/.test(l.trim())).length;
    const h3Count = lines.filter((l) => /^###\s+/.test(l.trim())).length;

    // Đếm internal/markdown links
    const linkMatches = contentMarkdown.match(/\[[^\]]+\]\((https?:\/\/[^)]+|\/[^)]+)\)/g) || [];
    const internalLinkCount = linkMatches.length;

    const kwWords = kw ? kw.split(/\s+/).length : 1;
    const keywordCount = countKeywordOccurrences(contentMarkdown, kw);
    const keywordDensity =
        wordCount > 0 ? Number((((keywordCount * kwWords) / wordCount) * 100).toFixed(2)) : 0;

    // 100 từ đầu tiên (bỏ qua dòng H1 # ...)
    const bodyWithoutH1 = lines
        .filter((l) => !/^#\s+/.test(l.trim()))
        .join(" ")
        .trim();
    const first100Words = bodyWithoutH1.split(/\s+/).slice(0, 100).join(" ").toLowerCase();

    const checks: SeoCheckItem[] = [];

    // 1. Từ khóa chính trong H1 (15đ)
    const hasKwInH1 = Boolean(kw) && title.toLowerCase().includes(kw);
    checks.push({
        id: "h1_kw",
        label: "Từ khóa chính trong Tiêu đề H1",
        status: hasKwInH1 ? "pass" : "fail",
        detail: hasKwInH1 ? "Đạt" : "Chưa chứa từ khóa chính",
        points: hasKwInH1 ? 15 : 0,
        maxPoints: 15,
    });

    // 2. Từ khóa chính trong 100 từ đầu (15đ)
    const hasKwIntro = Boolean(kw) && first100Words.includes(kw);
    checks.push({
        id: "intro_kw",
        label: "Từ khóa chính trong 100 từ đầu",
        status: hasKwIntro ? "pass" : wordCount > 0 ? "warn" : "fail",
        detail: hasKwIntro ? "Đạt" : "Nên đưa vào đoạn mở bài",
        points: hasKwIntro ? 15 : 0,
        maxPoints: 15,
    });

    // 3. Mật độ từ khóa 0.5% - 2.5% (15đ)
    let densityPts = 0;
    let densityStatus: "pass" | "warn" | "fail" = "fail";
    let densityDetail = `${keywordDensity}% (${keywordCount} lần)`;
    if (keywordDensity >= 0.5 && keywordDensity <= 2.5) {
        densityPts = 15;
        densityStatus = "pass";
    } else if (keywordDensity > 0 && keywordDensity < 0.5) {
        densityPts = 8;
        densityStatus = "warn";
        densityDetail = `${keywordDensity}% (Hơi thấp)`;
    } else if (keywordDensity > 2.5) {
        densityPts = 5;
        densityStatus = "warn";
        densityDetail = `${keywordDensity}% (Coi chừng nhồi từ khóa)`;
    }
    checks.push({
        id: "density",
        label: "Mật độ từ khóa (0.5% - 2.5%)",
        status: densityStatus,
        detail: densityDetail,
        points: densityPts,
        maxPoints: 15,
    });

    // 4. Phân cấp Heading H2 / H3 (15đ)
    const headingPts = h2Count >= 3 ? (h3Count >= 1 ? 15 : 12) : h2Count >= 1 ? 6 : 0;
    checks.push({
        id: "headings",
        label: "Cấu trúc Heading (≥ 3 H2, có H3)",
        status: headingPts === 15 ? "pass" : headingPts > 0 ? "warn" : "fail",
        detail: `${h2Count} H2 • ${h3Count} H3`,
        points: headingPts,
        maxPoints: 15,
    });

    // 5. Độ dài bài viết đạt mục tiêu (15đ)
    const ratio = targetWordCount > 0 ? wordCount / targetWordCount : 1;
    const lenPts = ratio >= 0.85 ? 15 : ratio >= 0.5 ? 8 : 0;
    checks.push({
        id: "length",
        label: `Độ dài bài (${targetWordCount.toLocaleString("vi-VN")} từ)`,
        status: lenPts === 15 ? "pass" : lenPts > 0 ? "warn" : "fail",
        detail: `${wordCount.toLocaleString("vi-VN")} từ`,
        points: lenPts,
        maxPoints: 15,
    });

    // 6. Meta Title 40-60 ký tự & có từ khóa (10đ)
    const mtLen = metaTitle.trim().length;
    const mtHasKw = Boolean(kw) && metaTitle.toLowerCase().includes(kw);
    const mtPts = mtLen >= 40 && mtLen <= 65 && mtHasKw ? 10 : mtLen > 0 ? 5 : 0;
    checks.push({
        id: "meta_title",
        label: "Meta Title (40-65 ký tự + từ khóa)",
        status: mtPts === 10 ? "pass" : mtPts > 0 ? "warn" : "fail",
        detail: `${mtLen}/60 ký tự`,
        points: mtPts,
        maxPoints: 10,
    });

    // 7. Meta Description 120-160 ký tự & có từ khóa (10đ)
    const mdLen = metaDescription.trim().length;
    const mdHasKw = Boolean(kw) && metaDescription.toLowerCase().includes(kw);
    const mdPts = mdLen >= 120 && mdLen <= 165 && mdHasKw ? 10 : mdLen > 0 ? 5 : 0;
    checks.push({
        id: "meta_desc",
        label: "Meta Description (120-165 ký tự)",
        status: mdPts === 10 ? "pass" : mdPts > 0 ? "warn" : "fail",
        detail: `${mdLen}/160 ký tự`,
        points: mdPts,
        maxPoints: 10,
    });

    // 8. URL Slug chuẩn SEO (5đ)
    const kwSlug = toSeoSlug(primaryKeyword);
    const slugOk = Boolean(slug.trim()) && (!kwSlug || slug.toLowerCase().includes(kwSlug));
    checks.push({
        id: "slug",
        label: "URL Slug ngắn gọn chứa từ khóa",
        status: slugOk ? "pass" : slug.trim() ? "warn" : "fail",
        detail: slugOk ? "Chuẩn SEO" : "Nên tối ưu lại slug",
        points: slugOk ? 5 : 0,
        maxPoints: 5,
    });

    const score = checks.reduce((sum, item) => sum + item.points, 0);

    return {
        score,
        wordCount,
        h2Count,
        h3Count,
        keywordCount,
        keywordDensity,
        internalLinkCount,
        checks,
    };
}
