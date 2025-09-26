use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

macro_rules! console_log {
    ($($t:tt)*) => (log(&format_args!($($t)*).to_string()))
}

#[derive(Serialize, Deserialize)]
pub struct DataPoint {
    pub label: String,
    pub value: f64,
}

#[derive(Serialize, Deserialize)]
pub struct ChartData {
    pub data_points: Vec<DataPoint>,
    pub max_value: f64,
    pub min_value: f64,
}

#[derive(Serialize, Deserialize)]
pub struct BarElement {
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
    pub label: String,
    pub value: f64,
}

#[derive(Serialize, Deserialize)]
pub struct ChartTemplate {
    pub bars: Vec<BarElement>,
    pub chart_width: f64,
    pub chart_height: f64,
    pub max_value: f64,
}

#[wasm_bindgen]
pub fn process_bar_chart_data(data_json: &str, width: f64, height: f64) -> JsValue {
    console_log!("Processing bar chart data");
    
    let data: Vec<DataPoint> = match serde_json::from_str(data_json) {
        Ok(data) => data,
        Err(_) => return JsValue::NULL,
    };
    
    if data.is_empty() {
        return JsValue::NULL;
    }
    
    let max_value = data.iter().map(|d| d.value).fold(0.0, f64::max);
    let min_value = data.iter().map(|d| d.value).fold(f64::INFINITY, f64::min);
    
    let chart_margin = 60.0;
    let bar_width = (width - 2.0 * chart_margin) / data.len() as f64 * 0.8;
    let bar_spacing = (width - 2.0 * chart_margin) / data.len() as f64 * 0.2;
    let chart_height_usable = height - 2.0 * chart_margin;
    
    let bars: Vec<BarElement> = data
        .iter()
        .enumerate()
        .map(|(i, point)| {
            let normalized_height = (point.value / max_value) * chart_height_usable;
            let x = chart_margin + (i as f64) * (bar_width + bar_spacing);
            let y = height - chart_margin - normalized_height;
            
            BarElement {
                x,
                y,
                width: bar_width,
                height: normalized_height,
                label: point.label.clone(),
                value: point.value,
            }
        })
        .collect();
    
    let template = ChartTemplate {
        bars,
        chart_width: width,
        chart_height: height,
        max_value,
    };
    
    serde_wasm_bindgen::to_value(&template).unwrap_or(JsValue::NULL)
}

#[wasm_bindgen(start)]
pub fn main() {
    console_log!("Numbus WASM module loaded");
}