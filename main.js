import init, { process_bar_chart_data } from './pkg/numbus.js';

let wasmModule = null;
let currentChartData = null;
let currentData = null;
let currentChartType = 'bar';

async function initWasm() {
    try {
        wasmModule = await init();
        console.log('WASM module loaded successfully');
    } catch (error) {
        console.error('Failed to load WASM module:', error);
    }
}

function createChart(data, chartType = 'bar') {
    if (!wasmModule) {
        console.error('WASM module not loaded');
        return;
    }
    
    currentData = data;
    currentChartType = chartType;
    
    const svg = document.getElementById('chart');
    const size = parseInt(document.getElementById('canvas-size').value) || 800;
    const width = size;
    const height = size;
    
    // Set fixed dimensions on the SVG element
    svg.style.width = `${size}px`;
    svg.style.height = `${size}px`;
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.setAttribute('width', size);
    svg.setAttribute('height', size);
    svg.innerHTML = '';
    svg.removeAttribute('class');
    
    try {
        switch (chartType) {
            case 'bar':
                createBarChart(data, width, height);
                break;
            case 'line':
                createLineChart(data, width, height);
                break;
            case 'scatter':
                createScatterChart(data, width, height);
                break;
        }
    } catch (error) {
        console.error('Error creating chart:', error);
    }
}

function createBarChart(data, width, height) {
    const dataJson = JSON.stringify(data);
    const chartTemplate = process_bar_chart_data(dataJson, width, height);
    
    if (!chartTemplate) {
        console.error('Failed to process chart data');
        return;
    }
    
    currentChartData = chartTemplate;
    renderBarChart(chartTemplate);
}

function createLineChart(data, width, height) {
    const max_value = Math.max(...data.map(d => d.value));
    const chartMargin = 60;
    const chartWidth = width - 2 * chartMargin;
    const chartHeight = height - 2 * chartMargin;
    
    const points = data.map((point, i) => {
        const x = chartMargin + (i / (data.length - 1)) * chartWidth;
        const y = height - chartMargin - (point.value / max_value) * chartHeight;
        return { x, y, label: point.label, value: point.value };
    });
    
    currentChartData = { points, max_value, chart_width: width, chart_height: height };
    renderLineChart(currentChartData);
}

function createScatterChart(data, width, height) {
    const max_value = Math.max(...data.map(d => d.value));
    const chartMargin = 60;
    const chartWidth = width - 2 * chartMargin;
    const chartHeight = height - 2 * chartMargin;
    
    const points = data.map((point, i) => {
        const x = chartMargin + Math.random() * chartWidth;
        const y = height - chartMargin - (point.value / max_value) * chartHeight;
        return { x, y, label: point.label, value: point.value };
    });
    
    currentChartData = { points, max_value, chart_width: width, chart_height: height };
    renderScatterChart(currentChartData);
}

function addTooltipEvents(element, label, value) {
    const tooltip = document.getElementById('tooltip');
    
    element.addEventListener('mouseenter', () => {
        tooltip.style.opacity = '1';
        tooltip.innerHTML = `${label}: ${value}`;
    });
    
    element.addEventListener('mousemove', (e) => {
        tooltip.style.left = (e.pageX + 10) + 'px';
        tooltip.style.top = (e.pageY - 10) + 'px';
    });
    
    element.addEventListener('mouseleave', () => {
        tooltip.style.opacity = '0';
    });
}

function renderAxes(svg, template) {
    // Use consistent, readable font sizes
    const titleFontSize = 16;
    const axisLabelFontSize = 11;
    const axisTextFontSize = 10;
    
    // Add chart title as SVG text with high contrast for legibility
    const chartTitle = document.getElementById('chart-title').value;
    if (chartTitle) {
        const titleText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        titleText.setAttribute('class', 'chart-title-svg');
        titleText.setAttribute('x', template.chart_width / 2);
        titleText.setAttribute('y', titleFontSize + 10);
        titleText.setAttribute('text-anchor', 'middle');
        titleText.setAttribute('font-size', `${titleFontSize}px`);
        titleText.setAttribute('font-weight', '600');
        titleText.setAttribute('font-family', 'Arial, sans-serif');
        titleText.setAttribute('fill', '#000');
        titleText.textContent = chartTitle;
        svg.appendChild(titleText);
    }
    
    // Simple, clean axes following Tufte principles
    const yAxisLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    yAxisLine.setAttribute('class', 'axis-line');
    yAxisLine.setAttribute('x1', 60);
    yAxisLine.setAttribute('y1', 60);
    yAxisLine.setAttribute('x2', 60);
    yAxisLine.setAttribute('y2', template.chart_height - 60);
    svg.appendChild(yAxisLine);
    
    const xAxisLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    xAxisLine.setAttribute('class', 'axis-line');
    xAxisLine.setAttribute('x1', 60);
    xAxisLine.setAttribute('y1', template.chart_height - 60);
    xAxisLine.setAttribute('x2', template.chart_width - 60);
    xAxisLine.setAttribute('y2', template.chart_height - 60);
    svg.appendChild(xAxisLine);
    
    // Y-axis labels with proper scaling
    for (let i = 0; i <= 5; i++) {
        const value = (template.max_value / 5) * i;
        const y = template.chart_height - 60 - (i * (template.chart_height - 120) / 5);
        
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('class', 'axis-text');
        label.setAttribute('x', 50);
        label.setAttribute('y', y + 4);
        label.setAttribute('text-anchor', 'end');
        label.setAttribute('font-size', `${axisTextFontSize}px`);
        label.setAttribute('font-family', 'Arial, sans-serif');
        label.setAttribute('fill', '#000');
        label.textContent = Math.round(value);
        svg.appendChild(label);
    }
    
    // Axis titles with proper contrast and positioning
    const yAxisTitle = document.getElementById('y-axis-title').value;
    if (yAxisTitle) {
        const yTitle = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        yTitle.setAttribute('class', 'axis-text');
        yTitle.setAttribute('x', 20);
        yTitle.setAttribute('y', template.chart_height / 2);
        yTitle.setAttribute('text-anchor', 'middle');
        yTitle.setAttribute('font-size', `${axisLabelFontSize}px`);
        yTitle.setAttribute('font-weight', '500');
        yTitle.setAttribute('font-family', 'Arial, sans-serif');
        yTitle.setAttribute('fill', '#000');
        yTitle.setAttribute('transform', `rotate(-90, 20, ${template.chart_height / 2})`);
        yTitle.textContent = yAxisTitle;
        svg.appendChild(yTitle);
    }
    
    const xAxisTitle = document.getElementById('x-axis-title').value;
    if (xAxisTitle) {
        const xTitle = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        xTitle.setAttribute('class', 'axis-text');
        xTitle.setAttribute('x', template.chart_width / 2);
        xTitle.setAttribute('y', template.chart_height - 20);
        xTitle.setAttribute('text-anchor', 'middle');
        xTitle.setAttribute('font-size', `${axisLabelFontSize}px`);
        xTitle.setAttribute('font-weight', '500');
        xTitle.setAttribute('font-family', 'Arial, sans-serif');
        xTitle.setAttribute('fill', '#000');
        xTitle.textContent = xAxisTitle;
        svg.appendChild(xTitle);
    }
}

function renderBarChart(template) {
    const svg = document.getElementById('chart');
    const labelFontSize = 10;
    
    template.bars.forEach((bar) => {
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('class', 'bar');
        rect.setAttribute('x', bar.x);
        rect.setAttribute('y', bar.y);
        rect.setAttribute('width', bar.width);
        rect.setAttribute('height', bar.height);
        
        addTooltipEvents(rect, bar.label, bar.value);
        svg.appendChild(rect);
        
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('class', 'axis-text');
        text.setAttribute('x', bar.x + bar.width / 2);
        text.setAttribute('y', template.chart_height - 40);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('font-size', `${labelFontSize}px`);
        text.setAttribute('font-family', 'Arial, sans-serif');
        text.setAttribute('fill', '#000');
        text.textContent = bar.label;
        svg.appendChild(text);
    });
    
    renderAxes(svg, template);
}

function renderLineChart(template) {
    const svg = document.getElementById('chart');
    const labelFontSize = 10;
    const pointRadius = 4;
    
    const pathData = template.points
        .map((point, i) => `${i === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
        .join(' ');
    
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('class', 'line-path');
    path.setAttribute('d', pathData);
    svg.appendChild(path);
    
    template.points.forEach((point, i) => {
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('class', 'line-point');
        circle.setAttribute('cx', point.x);
        circle.setAttribute('cy', point.y);
        circle.setAttribute('r', pointRadius);
        
        addTooltipEvents(circle, point.label, point.value);
        svg.appendChild(circle);
        
        if (i % Math.ceil(template.points.length / 6) === 0) {
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('class', 'axis-text');
            text.setAttribute('x', point.x);
            text.setAttribute('y', template.chart_height - 40);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('font-size', `${labelFontSize}px`);
            text.setAttribute('font-family', 'Arial, sans-serif');
            text.setAttribute('fill', '#000');
            text.textContent = point.label;
            svg.appendChild(text);
        }
    });
    
    renderAxes(svg, template);
}

function renderScatterChart(template) {
    const svg = document.getElementById('chart');
    const pointRadius = 5;
    
    template.points.forEach((point, i) => {
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('class', 'scatter-point');
        circle.setAttribute('cx', point.x);
        circle.setAttribute('cy', point.y);
        circle.setAttribute('r', pointRadius);
        
        addTooltipEvents(circle, point.label, point.value);
        svg.appendChild(circle);
    });
    
    renderAxes(svg, template);
}

window.loadSampleData = function() {
    const sampleData = [
        { label: 'Jan', value: 120 },
        { label: 'Feb', value: 190 },
        { label: 'Mar', value: 300 },
        { label: 'Apr', value: 500 },
        { label: 'May', value: 200 },
        { label: 'Jun', value: 300 }
    ];
    
    createChart(sampleData, currentChartType);
};

window.handleFileUpload = function(event) {
    const file = event.target.files[0];
    if (!file || !file.name.endsWith('.csv')) {
        alert('Please select a CSV file');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const csv = e.target.result;
            const lines = csv.trim().split('\n');
            const data = [];
            
            for (let i = 1; i < lines.length; i++) {
                const [label, value] = lines[i].split(',');
                if (label && value) {
                    data.push({
                        label: label.trim(),
                        value: parseFloat(value.trim())
                    });
                }
            }
            
            if (data.length === 0) {
                alert('No valid data found in CSV file');
                return;
            }
            
            createChart(data, currentChartType);
        } catch (error) {
            alert('Error parsing CSV file: ' + error.message);
        }
    };
    
    reader.readAsText(file);
};

window.changeChartType = function() {
    const chartTypeSelect = document.getElementById('chart-type');
    currentChartType = chartTypeSelect.value;
    
    if (currentData) {
        createChart(currentData, currentChartType);
    }
};

window.updateChart = function() {
    if (currentData) {
        createChart(currentData, currentChartType);
    }
};

window.updateCanvasSize = function() {
    if (currentData) {
        createChart(currentData, currentChartType);
    }
};

window.exportConfig = function() {
    if (!currentData) {
        alert('No data to export');
        return;
    }
    
    const config = {
        data: currentData,
        chartType: currentChartType,
        chartTitle: document.getElementById('chart-title').value,
        xAxisTitle: document.getElementById('x-axis-title').value,
        yAxisTitle: document.getElementById('y-axis-title').value,
        canvasSize: parseInt(document.getElementById('canvas-size').value),
        timestamp: new Date().toISOString()
    };
    
    const configJson = JSON.stringify(config, null, 2);
    const blob = new Blob([configJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `numbus-config-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
};

window.importConfig = function(event) {
    const file = event.target.files[0];
    if (!file || !file.name.endsWith('.json')) {
        alert('Please select a JSON config file');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const config = JSON.parse(e.target.result);
            
            // Restore data and settings
            currentData = config.data;
            currentChartType = config.chartType;
            
            document.getElementById('chart-title').value = config.chartTitle || 'numbus';
            document.getElementById('x-axis-title').value = config.xAxisTitle || '';
            document.getElementById('y-axis-title').value = config.yAxisTitle || '';
            document.getElementById('canvas-size').value = config.canvasSize || config.canvasWidth || 800;
            document.getElementById('chart-type').value = config.chartType || 'bar';
            
            // Recreate the chart
            createChart(currentData, currentChartType);
            
        } catch (error) {
            alert('Error parsing config file: ' + error.message);
        }
    };
    
    reader.readAsText(file);
};

window.copyToClipboard = async function(format) {
    if (!currentChartData) {
        alert('No chart data to copy');
        return;
    }
    
    if (format === 'png') {
        try {
            const svg = document.getElementById('chart');
            const size = parseInt(document.getElementById('canvas-size').value) || 800;
            const width = size;
            const height = size;
            
            // Create a clean SVG for conversion
            const svgData = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
                <defs>
                    <style>
                        .bar, .line-point, .scatter-point { fill: #000; }
                        .line-path { fill: none; stroke: #000; stroke-width: 1; }
                        .axis-line { stroke: #000; stroke-width: 0.5; }
                        .axis-text, .chart-title-svg { fill: #000; font-family: Arial, sans-serif; }
                    </style>
                </defs>
                <rect width="100%" height="100%" fill="white"/>
                ${svg.innerHTML}
            </svg>`;
            
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = width * 2;
            canvas.height = height * 2;
            
            const img = new Image();
            
            img.onload = async function() {
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                
                canvas.toBlob(async function(blob) {
                    try {
                        // Try the modern clipboard API first
                        if (navigator.clipboard && window.ClipboardItem) {
                            const item = new ClipboardItem({ 'image/png': blob });
                            await navigator.clipboard.write([item]);
                            alert('PNG copied to clipboard!');
                        } else {
                            // Fallback: create a download link
                            const url = URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.href = url;
                            link.download = 'chart-copy.png';
                            link.click();
                            URL.revokeObjectURL(url);
                            alert('Clipboard not available. PNG downloaded instead.');
                        }
                    } catch (err) {
                        console.error('Clipboard failed:', err);
                        // Fallback: download the file
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = 'chart-copy.png';
                        link.click();
                        URL.revokeObjectURL(url);
                        alert('Clipboard failed. PNG downloaded instead.');
                    }
                }, 'image/png');
            };
            
            img.onerror = function() {
                alert('Failed to convert chart to PNG');
            };
            
            const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(svgBlob);
            img.src = url;
            
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            
        } catch (err) {
            console.error('Copy operation failed:', err);
            alert('Copy to clipboard failed. Try using Export PNG instead.');
        }
    }
};

window.exportPNG = function() {
    if (!currentChartData) {
        alert('No chart data to export');
        return;
    }
    
    const svg = document.getElementById('chart');
    const chartTitle = document.getElementById('chart-title').value;
    const size = parseInt(document.getElementById('canvas-size').value) || 800;
    const width = size;
    const height = size;
    
    // Create a complete SVG with embedded styles
    const svgData = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
        <defs>
            <style>
                .bar, .line-point, .scatter-point { fill: #000; }
                .line-path { fill: none; stroke: #000; stroke-width: 1; }
                .axis-line { stroke: #000; stroke-width: 0.5; }
                .axis-text { fill: #000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
                .chart-title-svg { fill: #000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
            </style>
        </defs>
        <rect width="100%" height="100%" fill="white"/>
        ${svg.innerHTML}
    </svg>`;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    canvas.width = width * 2; // Higher resolution
    canvas.height = height * 2;
    
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    img.onload = function() {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob(function(blob) {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `${chartTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-${currentChartType}.png`;
            link.click();
            URL.revokeObjectURL(link.href);
        }, 'image/png', 0.95);
        
        URL.revokeObjectURL(url);
    };
    
    img.onerror = function() {
        alert('Error generating PNG. Please try again.');
        URL.revokeObjectURL(url);
    };
    
    img.src = url;
};

window.addEventListener('resize', function() {
    if (currentData) {
        createChart(currentData, currentChartType);
    }
});

initWasm();