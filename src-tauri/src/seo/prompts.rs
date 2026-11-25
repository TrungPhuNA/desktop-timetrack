use crate::seo::models::{CompetitorAnalysis, OutlineNode, SeoInternalLink, SeoSite, SeoTemplate};

/// Tính chi phí ước tính (USD) dựa trên bảng giá tham chiếu của Claude và Gemini
/// Mục đích: Giúp người dùng kiểm soát ngân sách API ngay trên từng bài viết và theo tháng
pub fn estimate_cost_usd(
    provider: &str,
    model: &str,
    input_tokens: i64,
    output_tokens: i64,
) -> f64 {
    let m = model.to_lowercase();
    let (in_per_million, out_per_million) = if provider == "claude" {
        if m.contains("opus") {
            (15.0, 75.0)
        } else if m.contains("haiku") {
            (0.8, 4.0)
        } else {
            // Mặc định Claude Sonnet 3.5 / 3.7 / 4
            (3.0, 15.0)
        }
    } else if m.contains("flash") {
        (0.15, 0.60)
    } else {
        // Mặc định Gemini Pro
        (1.25, 5.0)
    };

    let in_cost = (input_tokens as f64 / 1_000_000.0) * in_per_million;
    let out_cost = (output_tokens as f64 / 1_000_000.0) * out_per_million;
    ((in_cost + out_cost) * 100_000.0).round() / 100_000.0
}

/// Bóc tách khối JSON hợp lệ từ câu trả lời của LLM (xử lý case AI bọc ```json ... ``` hoặc có lời dẫn)
pub fn extract_json_block(raw: &str) -> Option<String> {
    let trimmed = raw.trim();
    if trimmed.starts_with('{') && trimmed.ends_with('}') {
        return Some(trimmed.to_string());
    }

    // Tìm cặp dấu ngoặc nhọn ngoài cùng
    let start = trimmed.find('{')?;
    let end = trimmed.rfind('}')?;
    if end > start {
        Some(trimmed[start..=end].to_string())
    } else {
        None
    }
}

/// Tạo khối ngữ cảnh Brand Voice từ cấu hình Website
fn format_site_context(site: Option<&SeoSite>) -> String {
    match site {
        Some(s) => format!(
            "- Website: {} ({})\n- Lĩnh vực: {}\n- Giọng văn (Brand Voice): {}\n- Độc giả mục tiêu: {}\n- CTA cuối bài: {}",
            s.name,
            s.domain,
            if s.niche.is_empty() { "Đa ngành" } else { &s.niche },
            if s.brand_voice.is_empty() { "Chuyên gia thân thiện, dễ hiểu" } else { &s.brand_voice },
            if s.target_audience.is_empty() { "Người dùng tìm hiểu sản phẩm/kiến thức tại Việt Nam" } else { &s.target_audience },
            if s.cta_template.is_empty() { "Mời độc giả để lại bình luận hoặc liên hệ tư vấn" } else { &s.cta_template }
        ),
        None => "- Giọng văn: Chuyên gia thực chiến, gần gũi, dễ hiểu cho độc giả Việt Nam.".to_string(),
    }
}

/// Định dạng danh sách Heading đối thủ đã cào để AI phân tích khoảng trống nội dung (Content Gap)
fn format_competitors_context(competitors: &[CompetitorAnalysis]) -> String {
    if competitors.is_empty() {
        return "Chưa có dữ liệu đối thủ (hãy tự phân tích Search Intent chuẩn Google Việt Nam).".to_string();
    }

    let mut out = String::new();
    for (idx, comp) in competitors.iter().enumerate() {
        if comp.error.is_some() {
            continue;
        }
        out.push_str(&format!(
            "\nĐối thủ #{}: {} (~{} từ)\nTiêu đề: {}\nCác Heading chính:\n",
            idx + 1,
            comp.url,
            comp.word_count,
            comp.title
        ));
        for h in comp.headings.iter().take(25) {
            out.push_str(&format!("  - [{}] {}\n", h.level.to_uppercase(), h.text));
        }
    }

    if out.is_empty() {
        "Không cào được dữ liệu đối thủ.".to_string()
    } else {
        out
    }
}

/// Định dạng tối đa 12 Internal Links phù hợp ngữ cảnh để AI tự chèn link thật
fn format_internal_links_context(links: &[SeoInternalLink], primary_keyword: &str) -> String {
    if links.is_empty() {
        return String::new();
    }

    let kw_words: Vec<String> = primary_keyword
        .to_lowercase()
        .split_whitespace()
        .map(|s| s.to_string())
        .collect();

    let mut scored: Vec<(usize, &SeoInternalLink)> = links
        .iter()
        .map(|l| {
            let hay = format!("{} {}", l.title.to_lowercase(), l.url.to_lowercase());
            let score = kw_words.iter().filter(|w| hay.contains(w.as_str())).count();
            (score, l)
        })
        .collect();

    scored.sort_by(|a, b| b.0.cmp(&a.0));

    let mut out = String::from(
        "\nDANH SÁCH INTERNAL LINK THẬT CỦA WEBSITE (Chọn 2-4 link phù hợp nhất để chèn tự nhiên bằng Markdown [Anchor Text](URL), TUYỆT ĐỐI KHÔNG tự bịa URL ngoài danh sách này):\n",
    );
    for (_, link) in scored.into_iter().take(12) {
        out.push_str(&format!("- [{}]({})\n", link.title, link.url));
    }
    out
}

/// Xây dựng System + User Prompt cho bước tạo Dàn ý (Outline) trả về JSON chuẩn
pub fn build_outline_prompts(
    primary_keyword: &str,
    secondary_keywords: &[String],
    search_intent: &str,
    site: Option<&SeoSite>,
    template: Option<&SeoTemplate>,
    competitors: &[CompetitorAnalysis],
) -> (String, String) {
    let sys_base = template
        .map(|t| t.system_prompt.clone())
        .unwrap_or_else(|| {
            "Bạn là chuyên gia SEO & Content Strategist hàng đầu tại Việt Nam, am hiểu sâu sắc Search Intent và tiêu chuẩn E-E-A-T của Google.".to_string()
        });

    let system_prompt = format!(
        "{}\n\nNHIỆM VỤ: Phân tích từ khóa, đối thủ và trả về DUY NHẤT một khối JSON hợp lệ (không thêm lời bình luận thừa ngoài JSON).",
        sys_base
    );

    let tpl_outline_guide = template
        .map(|t| format!("- Loại bài mẫu: {} (~{} từ)\n- Hướng dẫn dàn ý: {}", t.name, t.target_word_count, t.outline_prompt))
        .unwrap_or_else(|| "- Độ dài mục tiêu: ~1.800 - 2.200 từ".to_string());

    let user_prompt = format!(
        "Hãy lập dàn ý bài viết SEO vượt trội đối thủ cho từ khóa chính: \"{}\"\n\
        - Từ khóa phụ / LSI hiện có: {}\n\
        - Search Intent: {}\n\
        {}\n\
        {}\n\n\
        DỮ LIỆU BÀI VIẾT TOP ĐỐI THỦ:\n{}\n\n\
        YÊU CẦU ĐẦU RA (BẮT BUỘC ĐÚNG ĐỊNH DẠNG JSON SAU):\n\
        {{\n\
          \"title\": \"Tiêu đề H1 hấp dẫn chứa từ khóa chính (55-65 ký tự)\",\n\
          \"secondary_keywords\": [\"từ khóa phụ 1\", \"từ khóa phụ 2\", \"từ khóa LSI 3\", \"từ khóa LSI 4\", \"từ khóa LSI 5\"],\n\
          \"outline\": [\n\
            {{\"id\": \"sec-1\", \"level\": \"h2\", \"title\": \"Tên mục H2\", \"notes\": \"Ý chính cần triển khai, bảng biểu hoặc dẫn chứng\", \"target_words\": 350}},\n\
            {{\"id\": \"sec-2\", \"level\": \"h3\", \"title\": \"Tên mục con H3\", \"notes\": \"Chi tiết kỹ thuật/ví dụ\", \"target_words\": 250}},\n\
            {{\"id\": \"sec-faq\", \"level\": \"faq\", \"title\": \"Câu hỏi thường gặp về ...\", \"notes\": \"3-4 câu hỏi ngắn gọn chuẩn FAQ Schema\", \"target_words\": 250}}\n\
          ]\n\
        }}",
        primary_keyword,
        if secondary_keywords.is_empty() { "Chưa có (hãy đề xuất thêm 5-7 từ khóa LSI sát nghĩa nhất)".to_string() } else { secondary_keywords.join(", ") },
        search_intent,
        format_site_context(site),
        tpl_outline_guide,
        format_competitors_context(competitors)
    );

    (system_prompt, user_prompt)
}

/// Xây dựng System + User Prompt cho chế độ Viết Toàn Bài trong 1 lượt
pub fn build_full_article_prompts(
    primary_keyword: &str,
    secondary_keywords: &[String],
    title: &str,
    outline: &[OutlineNode],
    site: Option<&SeoSite>,
    template: Option<&SeoTemplate>,
    internal_links: &[SeoInternalLink],
) -> (String, String) {
    let sys_base = template
        .map(|t| t.system_prompt.clone())
        .unwrap_or_else(|| "Bạn là cây viết SEO chuyên nghiệp tại Việt Nam.".to_string());

    let system_prompt = format!(
        "{}\n\nQUY TẮC VIẾT BÀI BẮT BUỘC:\n\
        1. Viết bằng Markdown sạch (# cho H1 duy nhất ở đầu, ## cho H2, ### cho H3, bảng Markdown khi so sánh).\n\
        2. Đưa từ khóa chính vào ngay đoạn mở bài (100 từ đầu tiên) và rải tự nhiên (mật độ ~1% - 1.8%).\n\
        3. Đoạn văn ngắn gọn 3-4 dòng, tách ý rõ ràng, có bullet point và ví dụ thực tế tại Việt Nam.\n\
        4. Sau mỗi H2 lớn, chèn 1 dòng blockquote gợi ý ảnh: `> **[Gợi ý ảnh]**: <Mô tả ảnh> | **Alt**: <alt-chua-tu-khoa>`.\n\
        5. KHÔNG viết lời mở đầu thừa kiểu 'Dưới đây là bài viết...'. Xuất thẳng nội dung bài viết.",
        sys_base
    );

    let outline_text: String = outline
        .iter()
        .map(|n| {
            let prefix = match n.level.as_str() {
                "h3" => "  ###",
                "faq" => "## [FAQ]",
                _ => "##",
            };
            format!(
                "{} {} (~{} từ) — Ghi chú: {}",
                prefix, n.title, n.target_words, n.notes
            )
        })
        .collect::<Vec<_>>()
        .join("\n");

    let write_guide = template
        .map(|t| t.write_prompt.as_str())
        .unwrap_or("Viết chi tiết, dễ hiểu, có chiều sâu chuyên môn.");

    let user_prompt = format!(
        "Viết bài SEO hoàn chỉnh với thông tin sau:\n\
        - Tiêu đề H1: {}\n\
        - Từ khóa chính: {}\n\
        - Từ khóa phụ / LSI cần lồng ghép tự nhiên: {}\n\
        - Hướng dẫn phong cách: {}\n\
        {}\n{}\n\n\
        DÀN Ý CHI TIẾT CẦN BÁM SÁT:\n{}",
        title,
        primary_keyword,
        secondary_keywords.join(", "),
        write_guide,
        format_site_context(site),
        format_internal_links_context(internal_links, primary_keyword),
        outline_text
    );

    (system_prompt, user_prompt)
}

/// Xây dựng Prompt cho chế độ Viết Cuốn Chiếu Từng Mục (Section-by-Section) giúp bài Pillar dài và sâu
pub fn build_section_article_prompts(
    primary_keyword: &str,
    secondary_keywords: &[String],
    title: &str,
    full_outline: &[OutlineNode],
    current_section: &OutlineNode,
    section_index: usize,
    total_sections: usize,
    previous_tail: &str,
    site: Option<&SeoSite>,
    template: Option<&SeoTemplate>,
    internal_links: &[SeoInternalLink],
) -> (String, String) {
    let sys_base = template
        .map(|t| t.system_prompt.clone())
        .unwrap_or_else(|| "Bạn là cây viết SEO chuyên sâu tại Việt Nam.".to_string());

    let system_prompt = format!(
        "{}\n\nBạn đang viết CUỐN CHIẾU từng phần của một bài viết SEO dài.\n\
        - Chỉ viết đúng phần mục được giao, không viết lặp lại ý đã nói ở phần trước.\n\
        - Dùng Markdown chuẩn (## cho H2, ### cho H3). Không xuất lời chào hay giải thích thừa.",
        sys_base
    );

    let outline_overview: String = full_outline
        .iter()
        .map(|n| format!("- [{}] {}", n.level.to_uppercase(), n.title))
        .collect::<Vec<_>>()
        .join("\n");

    let intro_instruction = if section_index == 0 {
        format!(
            "Vì đây là PHẦN ĐẦU TIÊN: Hãy bắt đầu bằng `# {}` và viết một đoạn Sapo/Mở bài lôi cuốn (~120 từ) chứa từ khóa chính `{}` ngay trong 100 từ đầu, sau đó viết tiếp nội dung mục này.",
            title, primary_keyword
        )
    } else {
        "Hãy viết tiếp nối mạch văn tự nhiên từ phần trước (bắt đầu ngay bằng tiêu đề mục `## ...`).".to_string()
    };

    let cta_instruction = if section_index + 1 == total_sections {
        "Vì đây là PHẦN CUỐI: Hãy thêm mục `## Kết luận` ngắn gọn kèm CTA tự nhiên ở cuối."
    } else {
        "Không viết phần Kết luận ở mục này."
    };

    let user_prompt = format!(
        "Thông tin bài viết:\n\
        - Tiêu đề bài: {}\n\
        - Từ khóa chính: {} | Từ khóa phụ: {}\n\
        {}\n{}\n\n\
        TỔNG QUAN DÀN Ý TOÀN BÀI (để giữ mạch logic):\n{}\n\n\
        ĐOẠN CUỐI CỦA PHẦN TRƯỚC ĐÓ (để nối ý không bị trùng):\n{}\n\n\
        NHIỆM VỤ PHẦN NÀY ({}/{}):\n\
        - Tiêu đề mục: [{}] {}\n\
        - Định hướng nội dung: {}\n\
        - Độ dài mục tiêu: ~{} từ\n\
        - {}\n\
        - {}\n\
        - Kèm 1 dòng gợi ý ảnh minh họa: `> **[Gợi ý ảnh]**: ... | **Alt**: ...`",
        title,
        primary_keyword,
        secondary_keywords.join(", "),
        format_site_context(site),
        format_internal_links_context(internal_links, primary_keyword),
        outline_overview,
        if previous_tail.is_empty() { "(Đây là phần mở đầu)" } else { previous_tail },
        section_index + 1,
        total_sections,
        current_section.level.to_uppercase(),
        current_section.title,
        current_section.notes,
        current_section.target_words.max(250),
        intro_instruction,
        cta_instruction
    );

    (system_prompt, user_prompt)
}

/// Xây dựng Prompt viết lại đoạn văn bản người dùng bôi đen
pub fn build_rewrite_prompts(
    selected_text: &str,
    instruction: &str,
    context_keyword: &str,
) -> (String, String) {
    let system_prompt = "Bạn là biên tập viên SEO tiếng Việt cao cấp. Chỉ trả về duy nhất đoạn nội dung đã biên tập lại (giữ nguyên định dạng Markdown nếu có), tuyệt đối không thêm lời dẫn hay giải thích.".to_string();
    let user_prompt = format!(
        "Ngữ cảnh từ khóa SEO của bài: \"{}\"\n\
        Yêu cầu biên tập: {}\n\n\
        ĐOẠN VĂN BẢN GỐC:\n{}",
        context_keyword, instruction, selected_text
    );
    (system_prompt, user_prompt)
}

/// Xây dựng Prompt sinh Meta Title, Meta Description, Slug, FAQ Schema và Alt ảnh từ nội dung bài
pub fn build_meta_faq_prompts(
    primary_keyword: &str,
    title: &str,
    content_markdown: &str,
) -> (String, String) {
    let system_prompt = "Bạn là chuyên gia Technical SEO. Trả về DUY NHẤT một khối JSON hợp lệ, không kèm text giải thích.".to_string();

    // Lấy tối đa ~4000 ký tự đầu của bài để tiết kiệm token khi sinh Meta & FAQ
    let snippet: String = content_markdown.chars().take(4000).collect();

    let user_prompt = format!(
        "Dựa trên bài viết SEO bên dưới, hãy tối ưu bộ thẻ Meta, Slug, FAQ Schema và gợi ý ảnh.\n\
        - Từ khóa chính: \"{}\"\n\
        - Tiêu đề H1: \"{}\"\n\
        - Trích đoạn nội dung:\n{}\n\n\
        TRẢ VỀ ĐÚNG CẤU TRÚC JSON SAU:\n\
        {{\n\
          \"meta_title\": \"Tiêu đề SEO hấp dẫn 50-60 ký tự, chứa từ khóa chính gần đầu\",\n\
          \"meta_description\": \"Mô tả SEO 140-158 ký tự, chứa từ khóa chính và lời kêu gọi click tự nhiên\",\n\
          \"slug\": \"url-slug-khong-dau-chuan-seo\",\n\
          \"faqs\": [\n\
            {{\"question\": \"Câu hỏi thực tế người dùng hay tìm?\", \"answer\": \"Câu trả lời súc tích 2-3 câu.\"}}\n\
          ],\n\
          \"image_prompts\": [\n\
            {{\"section\": \"Ảnh bìa / H2 #1\", \"prompt\": \"Mô tả chi tiết ảnh để vẽ/tìm ảnh\", \"alt_text\": \"alt-chua-tu-khoa\", \"caption\": \"Chú thích ngắn dưới ảnh\"}}\n\
          ]\n\
        }}",
        primary_keyword, title, snippet
    );

    (system_prompt, user_prompt)
}
