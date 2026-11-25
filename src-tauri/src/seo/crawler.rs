use scraper::{Html, Selector};

use crate::seo::models::{CompetitorAnalysis, CompetitorHeading};

/// Cào tối đa 5 URL đối thủ để bóc tách Title, số lượng từ và cấu trúc Heading (H1, H2, H3)
/// Mục đích: Giúp AI nắm bắt được dàn ý các bài Top Google mà không bị chặn CORS như trình duyệt
pub async fn crawl_competitor_urls(urls: Vec<String>) -> Vec<CompetitorAnalysis> {
    let client = match reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(15))
        .user_agent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36")
        .build()
    {
        Ok(c) => c,
        Err(e) => {
            return vec![CompetitorAnalysis {
                url: String::new(),
                title: String::new(),
                word_count: 0,
                headings: vec![],
                error: Some(format!("Lỗi khởi tạo trình cào HTTP: {}", e)),
            }];
        }
    };

    let mut results = Vec::new();
    for raw_url in urls.into_iter().take(5) {
        let url = raw_url.trim().to_string();
        if url.is_empty() {
            continue;
        }
        results.push(crawl_single_page(&client, &url).await);
    }
    results
}

/// Cào và phân tích HTML của một trang web đối thủ
async fn crawl_single_page(client: &reqwest::Client, url: &str) -> CompetitorAnalysis {
    let resp = match client.get(url).send().await {
        Ok(r) => r,
        Err(e) => {
            return CompetitorAnalysis {
                url: url.to_string(),
                title: String::new(),
                word_count: 0,
                headings: vec![],
                error: Some(format!("Không thể tải trang: {}", e)),
            };
        }
    };

    if !resp.status().is_success() {
        return CompetitorAnalysis {
            url: url.to_string(),
            title: String::new(),
            word_count: 0,
            headings: vec![],
            error: Some(format!("Trang trả về mã HTTP {}", resp.status().as_u16())),
        };
    }

    let html_text = match resp.text().await {
        Ok(t) => t,
        Err(e) => {
            return CompetitorAnalysis {
                url: url.to_string(),
                title: String::new(),
                word_count: 0,
                headings: vec![],
                error: Some(format!("Lỗi đọc nội dung HTML: {}", e)),
            };
        }
    };

    let document = Html::parse_document(&html_text);

    // Trích xuất thẻ <title>
    let title = Selector::parse("title")
        .ok()
        .and_then(|sel| document.select(&sel).next())
        .map(|el| el.text().collect::<Vec<_>>().join(" ").trim().to_string())
        .unwrap_or_default();

    // Đếm sơ bộ số từ trong thẻ <body>
    let word_count = Selector::parse("body")
        .ok()
        .and_then(|sel| document.select(&sel).next())
        .map(|el| {
            el.text()
                .collect::<Vec<_>>()
                .join(" ")
                .split_whitespace()
                .count()
        })
        .unwrap_or(0);

    // Bóc tách danh sách H1, H2, H3 theo đúng thứ tự xuất hiện trong DOM
    let mut headings = Vec::new();
    if let Ok(h_sel) = Selector::parse("h1, h2, h3") {
        for el in document.select(&h_sel) {
            let level = el.value().name().to_string();
            let text = el
                .text()
                .collect::<Vec<_>>()
                .join(" ")
                .split_whitespace()
                .collect::<Vec<_>>()
                .join(" ");
            if !text.is_empty() && text.len() <= 240 {
                headings.push(CompetitorHeading { level, text });
            }
            if headings.len() >= 45 {
                break;
            }
        }
    }

    CompetitorAnalysis {
        url: url.to_string(),
        title,
        word_count,
        headings,
        error: None,
    }
}

/// Tải và phân tích sitemap.xml của Website để lấy danh sách URL làm Internal Link thật
pub async fn fetch_sitemap_links(sitemap_url: &str) -> Result<Vec<(String, String)>, String> {
    let url = sitemap_url.trim();
    if url.is_empty() {
        return Err("Chưa nhập đường dẫn Sitemap XML".to_string());
    }

    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(20))
        .user_agent("Mozilla/5.0 (compatible; TimeTrackSeoBot/1.0)")
        .build()
        .map_err(|e| format!("Lỗi khởi tạo HTTP client: {}", e))?;

    let xml_body = client
        .get(url)
        .send()
        .await
        .map_err(|e| format!("Không thể tải sitemap: {}", e))?
        .text()
        .await
        .map_err(|e| format!("Lỗi đọc nội dung sitemap: {}", e))?;

    let mut links = Vec::new();
    let mut rest = xml_body.as_str();

    // Bóc thẻ <loc>...</loc> trực tiếp, chịu lỗi tốt với mọi biến thể namespace XML
    while let Some(start_idx) = rest.find("<loc>") {
        let after_start = &rest[start_idx + 5..];
        if let Some(end_idx) = after_start.find("</loc>") {
            let raw_loc = after_start[..end_idx].trim();
            let clean_loc = raw_loc
                .trim_start_matches("<![CDATA[")
                .trim_end_matches("]]>")
                .trim()
                .to_string();

            if !clean_loc.is_empty()
                && !clean_loc.ends_with(".xml")
                && !clean_loc.ends_with(".jpg")
                && !clean_loc.ends_with(".png")
            {
                let inferred_title = infer_title_from_url(&clean_loc);
                links.push((clean_loc, inferred_title));
                if links.len() >= 200 {
                    break;
                }
            }
            rest = &after_start[end_idx + 6..];
        } else {
            break;
        }
    }

    if links.is_empty() {
        return Err("Không tìm thấy URL bài viết nào trong Sitemap (hoặc đây là sitemap index chứa sitemap con .xml). Hãy dán trực tiếp link post-sitemap.xml.".to_string());
    }

    Ok(links)
}

/// Suy đoán tiêu đề dễ đọc từ slug cuối của URL (ví dụ /tu-bep-inox -> "Tu bep inox")
fn infer_title_from_url(url: &str) -> String {
    let trimmed = url.trim_end_matches('/');
    let slug = trimmed.rsplit('/').next().unwrap_or(trimmed);
    let no_ext = slug
        .trim_end_matches(".html")
        .trim_end_matches(".htm")
        .replace('-', " ")
        .replace('_', " ");

    let mut chars = no_ext.chars();
    match chars.next() {
        Some(first) => first.to_uppercase().collect::<String>() + chars.as_str(),
        None => url.to_string(),
    }
}
