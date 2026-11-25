import { FaqItem } from "../types/seo";

/**
 * Chuyển đổi inline Markdown (bold, italic, code, links) sang HTML sạch
 */
function formatInlineMarkdown(text: string): string {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/`([^`]+)`/g, "<code>$1</code>")
        .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
        .replace(/\*([^*]+)\*/g, "<em>$1</em>")
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" rel="noopener noreferrer">$1</a>');
}

/**
 * Chuyển đổi Markdown sang HTML sạch (không dính CSS/class rác) để dán thẳng vào WordPress / CMS
 */
export function markdownToCleanHtml(markdown: string): string {
    const lines = markdown.split(/\r?\n/);
    const htmlParts: string[] = [];
    let i = 0;

    while (i < lines.length) {
        const line = lines[i].trim();

        if (!line) {
            i += 1;
            continue;
        }

        // Heading H1 - H4
        const hMatch = line.match(/^(#{1,4})\s+(.+)$/);
        if (hMatch) {
            const level = hMatch[1].length;
            htmlParts.push(`<h${level}>${formatInlineMarkdown(hMatch[2])}</h${level}>`);
            i += 1;
            continue;
        }

        // Blockquote
        if (line.startsWith(">")) {
            const quoteText = line.replace(/^>\s?/, "");
            htmlParts.push(`<blockquote><p>${formatInlineMarkdown(quoteText)}</p></blockquote>`);
            i += 1;
            continue;
        }

        // Markdown Table (| col | col |)
        if (line.startsWith("|") && i + 1 < lines.length && lines[i + 1].trim().startsWith("|")) {
            const tableLines: string[] = [];
            while (i < lines.length && lines[i].trim().startsWith("|")) {
                tableLines.push(lines[i].trim());
                i += 1;
            }
            const parseRow = (rowLine: string) =>
                rowLine
                    .replace(/^\|/, "")
                    .replace(/\|$/, "")
                    .split("|")
                    .map((cell) => cell.trim());

            const headers = parseRow(tableLines[0]);
            const bodyRows = tableLines.slice(2).map(parseRow);

            const thead = `<thead><tr>${headers.map((h) => `<th>${formatInlineMarkdown(h)}</th>`).join("")}</tr></thead>`;
            const tbody = `<tbody>${bodyRows
                .map((cols) => `<tr>${cols.map((c) => `<td>${formatInlineMarkdown(c)}</td>`).join("")}</tr>`)
                .join("")}</tbody>`;
            htmlParts.push(`<table>${thead}${tbody}</table>`);
            continue;
        }

        // Unordered List (- hoặc *)
        if (/^[-*]\s+/.test(line)) {
            const items: string[] = [];
            while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
                items.push(`<li>${formatInlineMarkdown(lines[i].trim().replace(/^[-*]\s+/, ""))}</li>`);
                i += 1;
            }
            htmlParts.push(`<ul>\n${items.join("\n")}\n</ul>`);
            continue;
        }

        // Ordered List (1. 2. ...)
        if (/^\d+\.\s+/.test(line)) {
            const items: string[] = [];
            while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
                items.push(`<li>${formatInlineMarkdown(lines[i].trim().replace(/^\d+\.\s+/, ""))}</li>`);
                i += 1;
            }
            htmlParts.push(`<ol>\n${items.join("\n")}\n</ol>`);
            continue;
        }

        // Paragraph thường
        const paraLines: string[] = [];
        while (
            i < lines.length &&
            lines[i].trim() !== "" &&
            !/^(#{1,4}\s+|>\s?|[-*]\s+|\d+\.\s+|\|)/.test(lines[i].trim())
        ) {
            paraLines.push(lines[i].trim());
            i += 1;
        }
        htmlParts.push(`<p>${formatInlineMarkdown(paraLines.join(" "))}</p>`);
    }

    return htmlParts.join("\n\n");
}

/**
 * Tạo đoạn mã JSON-LD Schema FAQPage chuẩn Google Rich Results
 */
export function buildFaqJsonLd(faqs: FaqItem[]): string {
    const valid = faqs.filter((f) => f.question.trim() && f.answer.trim());
    if (valid.length === 0) return "";

    const schema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: valid.map((item) => ({
            "@type": "Question",
            name: item.question.trim(),
            acceptedAnswer: {
                "@type": "Answer",
                text: item.answer.trim(),
            },
        })),
    };

    return `<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n</script>`;
}
