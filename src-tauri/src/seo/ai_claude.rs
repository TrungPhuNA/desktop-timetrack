use std::time::Instant;

use futures_util::StreamExt;
use serde_json::{json, Value};
use tokio_util::sync::CancellationToken;

use crate::seo::models::TestAiConnectionResult;

/// Kết quả tổng hợp sau một phiên stream AI hoàn tất hoặc bị hủy
pub struct AiStreamResult {
    pub full_text: String,
    pub input_tokens: i64,
    pub output_tokens: i64,
    pub cancelled: bool,
}

/// Chuẩn hóa endpoint gọi Anthropic Messages API (hỗ trợ custom Base URL)
fn build_claude_endpoint(base_url: &str) -> String {
    let clean = base_url.trim().trim_end_matches('/');
    if clean.is_empty() {
        "https://api.anthropic.com/v1/messages".to_string()
    } else if clean.ends_with("/v1/messages") {
        clean.to_string()
    } else if clean.ends_with("/v1") {
        format!("{}/messages", clean)
    } else {
        format!("{}/v1/messages", clean)
    }
}

/// Kiểm tra kết nối API Anthropic Claude và đo độ trễ thực tế
pub async fn test_claude_connection(
    api_key: &str,
    base_url: &str,
    model: &str,
) -> TestAiConnectionResult {
    let started = Instant::now();
    let endpoint = build_claude_endpoint(base_url);
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
        "model": model,
        "max_tokens": 16,
        "messages": [{"role": "user", "content": "Trả lời đúng 1 từ: OK"}]
    });

    let resp = client
        .post(&endpoint)
        .header("x-api-key", api_key.trim())
        .header("anthropic-version", "2023-06-01")
        .header("content-type", "application/json")
        .json(&body)
        .send()
        .await;

    let latency_ms = started.elapsed().as_millis() as u64;

    match resp {
        Ok(r) => {
            let status = r.status();
            let text = r.text().await.unwrap_or_default();
            if status.is_success() {
                TestAiConnectionResult {
                    success: true,
                    message: format!("Kết nối Claude thành công ({} ms)", latency_ms),
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
                    message: format!("Claude trả về lỗi HTTP {}: {}", status.as_u16(), err_msg),
                    latency_ms,
                    model: model.to_string(),
                }
            }
        }
        Err(e) => TestAiConnectionResult {
            success: false,
            message: format!("Không thể kết nối tới Claude API: {}", e),
            latency_ms,
            model: model.to_string(),
        },
    }
}

/// Gọi Anthropic Claude với chế độ Streaming SSE, hỗ trợ hủy giữa chừng qua CancellationToken
pub async fn stream_claude<F>(
    api_key: &str,
    base_url: &str,
    model: &str,
    system_prompt: &str,
    user_prompt: &str,
    max_tokens: i64,
    cancel_token: CancellationToken,
    mut on_chunk: F,
) -> Result<AiStreamResult, String>
where
    F: FnMut(&str),
{
    let endpoint = build_claude_endpoint(base_url);
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(300))
        .build()
        .map_err(|e| format!("Lỗi khởi tạo HTTP client: {}", e))?;

    let body = json!({
        "model": model,
        "max_tokens": max_tokens,
        "stream": true,
        "system": system_prompt,
        "messages": [
            { "role": "user", "content": user_prompt }
        ]
    });

    let response = client
        .post(&endpoint)
        .header("x-api-key", api_key.trim())
        .header("anthropic-version", "2023-06-01")
        .header("content-type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Lỗi kết nối Anthropic API: {}", e))?;

    if !response.status().is_success() {
        let status = response.status();
        let err_body = response.text().await.unwrap_or_default();
        let detail = serde_json::from_str::<Value>(&err_body)
            .ok()
            .and_then(|v| v["error"]["message"].as_str().map(|s| s.to_string()))
            .unwrap_or(err_body);
        return Err(format!("Claude API lỗi ({}): {}", status.as_u16(), detail));
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

                        // Xử lý từng dòng SSE hoàn chỉnh để tránh lỗi cắt ngang JSON giữa 2 TCP chunks
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
                                match json_val["type"].as_str().unwrap_or("") {
                                    "message_start" => {
                                        if let Some(tok) = json_val["message"]["usage"]["input_tokens"].as_i64() {
                                            input_tokens = tok;
                                        }
                                    }
                                    "content_block_delta" => {
                                        if let Some(text) = json_val["delta"]["text"].as_str() {
                                            full_text.push_str(text);
                                            on_chunk(text);
                                        }
                                    }
                                    "message_delta" => {
                                        if let Some(tok) = json_val["usage"]["output_tokens"].as_i64() {
                                            output_tokens = tok;
                                        }
                                    }
                                    "error" => {
                                        let msg = json_val["error"]["message"]
                                            .as_str()
                                            .unwrap_or("Lỗi stream không xác định từ Claude");
                                        return Err(format!("Claude stream lỗi: {}", msg));
                                    }
                                    _ => {}
                                }
                            }
                        }
                    }
                    Some(Err(e)) => {
                        return Err(format!("Mất kết nối giữa chừng khi đọc stream Claude: {}", e));
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
