use std::time::Instant;

use futures_util::StreamExt;
use serde_json::{json, Value};
use tokio_util::sync::CancellationToken;

use crate::seo::ai_claude::AiStreamResult;
use crate::seo::models::TestAiConnectionResult;

/// Chuẩn hóa endpoint gọi Google Gemini API (hỗ trợ non-stream hoặc SSE stream + Custom Base URL)
fn build_gemini_endpoint(base_url: &str, model: &str, api_key: &str, stream: bool) -> String {
    let clean_base = base_url.trim().trim_end_matches('/');
    let host = if clean_base.is_empty() {
        "https://generativelanguage.googleapis.com"
    } else {
        clean_base
    };

    let clean_model = model.trim().trim_start_matches("models/");
    let action = if stream {
        "streamGenerateContent?alt=sse&"
    } else {
        "generateContent?"
    };

    format!(
        "{}/v1beta/models/{}:{}key={}",
        host,
        clean_model,
        action,
        api_key.trim()
    )
}

/// Kiểm tra kết nối API Google Gemini và đo độ trễ thực tế
pub async fn test_gemini_connection(
    api_key: &str,
    base_url: &str,
    model: &str,
) -> TestAiConnectionResult {
    let started = Instant::now();
    let endpoint = build_gemini_endpoint(base_url, model, api_key, false);

    let client = match reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(20))
        .build()
    {
        Ok(c) => c,
        Err(e) => {
            return TestAiConnectionResult {
                success: false,
                message: format!("Lỗi khởi tạo HTTP client: {}", e),
                latency_ms: started.elapsed().as_millis() as u64,
                model: model.to_string(),
            }
        }
    };

    let body = json!({
        "contents": [{ "role": "user", "parts": [{ "text": "Trả lời đúng 1 từ: OK" }] }],
        "generationConfig": { "maxOutputTokens": 16 }
    });

    let resp = client.post(&endpoint).json(&body).send().await;
    let latency_ms = started.elapsed().as_millis() as u64;

    match resp {
        Ok(r) => {
            let status = r.status();
            let text = r.text().await.unwrap_or_default();
            if status.is_success() {
                TestAiConnectionResult {
                    success: true,
                    message: format!("Kết nối Gemini thành công ({} ms)", latency_ms),
                    latency_ms,
                    model: model.to_string(),
                }
            } else {
                let err_msg = serde_json::from_str::<Value>(&text)
                    .ok()
                    .and_then(|v| v["error"]["message"].as_str().map(|s| s.to_string()))
                    .unwrap_or(text);
                TestAiConnectionResult {
                    success: false,
                    message: format!("Gemini trả về lỗi HTTP {}: {}", status.as_u16(), err_msg),
                    latency_ms,
                    model: model.to_string(),
                }
            }
        }
        Err(e) => TestAiConnectionResult {
            success: false,
            message: format!("Không thể kết nối tới Gemini API: {}", e),
            latency_ms,
            model: model.to_string(),
        },
    }
}

/// Gọi Google Gemini với chế độ Streaming SSE, tùy chọn Google Search Grounding và CancellationToken
pub async fn stream_gemini<F>(
    api_key: &str,
    base_url: &str,
    model: &str,
    system_prompt: &str,
    user_prompt: &str,
    max_tokens: i64,
    use_search_grounding: bool,
    cancel_token: CancellationToken,
    mut on_chunk: F,
) -> Result<AiStreamResult, String>
where
    F: FnMut(&str),
{
    let endpoint = build_gemini_endpoint(base_url, model, api_key, true);
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(300))
        .build()
        .map_err(|e| format!("Lỗi khởi tạo HTTP client: {}", e))?;

    let mut body = json!({
        "system_instruction": {
            "parts": [{ "text": system_prompt }]
        },
        "contents": [{
            "role": "user",
            "parts": [{ "text": user_prompt }]
        }],
        "generationConfig": {
            "maxOutputTokens": max_tokens,
            "temperature": 0.7
        }
    });

    // Bật Google Search Grounding để Gemini tra cứu dữ liệu mới nhất khi nghiên cứu từ khóa / dàn ý
    if use_search_grounding {
        body["tools"] = json!([{ "google_search": {} }]);
    }

    let response = client
        .post(&endpoint)
        .header("content-type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Lỗi kết nối Google Gemini API: {}", e))?;

    if !response.status().is_success() {
        let status = response.status();
        let err_body = response.text().await.unwrap_or_default();
        let detail = serde_json::from_str::<Value>(&err_body)
            .ok()
            .and_then(|v| v["error"]["message"].as_str().map(|s| s.to_string()))
            .unwrap_or(err_body);
        return Err(format!("Gemini API lỗi ({}): {}", status.as_u16(), detail));
    }

    let mut stream = response.bytes_stream();
    let mut line_buffer = String::new();
    let mut full_text = String::new();
    let mut input_tokens: i64 = 0;
    let mut output_tokens: i64 = 0;
    let mut cancelled = false;

    loop {
        tokio::select! {
            _ = cancel_token.cancelled() => {
                cancelled = true;
                break;
            }
            next_item = stream.next() => {
                match next_item {
                    Some(Ok(bytes)) => {
                        let chunk_str = String::from_utf8_lossy(&bytes);
                        line_buffer.push_str(&chunk_str);

                        while let Some(pos) = line_buffer.find('\n') {
                            let line = line_buffer[..pos].trim().to_string();
                            line_buffer.drain(..=pos);

                            if !line.starts_with("data:") {
                                continue;
                            }
                            let payload = line.trim_start_matches("data:").trim();
                            if payload.is_empty() || payload == "[DONE]" {
                                continue;
                            }

                            if let Ok(json_val) = serde_json::from_str::<Value>(payload) {
                                if let Some(err_msg) = json_val["error"]["message"].as_str() {
                                    return Err(format!("Gemini stream lỗi: {}", err_msg));
                                }

                                if let Some(parts) = json_val["candidates"][0]["content"]["parts"].as_array() {
                                    for part in parts {
                                        if let Some(text) = part["text"].as_str() {
                                            full_text.push_str(text);
                                            on_chunk(text);
                                        }
                                    }
                                }

                                if let Some(in_tok) = json_val["usageMetadata"]["promptTokenCount"].as_i64() {
                                    input_tokens = in_tok;
                                }
                                if let Some(out_tok) = json_val["usageMetadata"]["candidatesTokenCount"].as_i64() {
                                    output_tokens = out_tok;
                                }
                            }
                        }
                    }
                    Some(Err(e)) => {
                        return Err(format!("Mất kết nối giữa chừng khi đọc stream Gemini: {}", e));
                    }
                    None => break,
                }
            }
        }
    }

    Ok(AiStreamResult {
        full_text,
        input_tokens,
        output_tokens,
        cancelled,
    })
}
