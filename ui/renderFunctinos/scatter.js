
import { createElement } from '../../util/util.js'
import AxisConfig from '../axisConfig.js'

class Scatter {
    constructor() {
        //data window dimensions
        this.width = 0;
        this.height = 0;
        //data
        this.x = []; //[x0,x1,...]
        this.y = []; //[y0,y1,...]
        this.allColumns = [];
        this.headers = [];
        this.colors = ['#4a90e2', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'];

        // Axis configuration
        this.axisConfig = new AxisConfig();

        this.initialize();
    }

    initialize() {

    }

    setData(cols, headers) {
        this.allColumns = cols;
        this.headers = headers || [];
        // First column is X axis
        this.x = cols[0] || [];
        // Remaining columns are Y series
        this.y = cols[1] || [];
    }


    renderData() {
        // Clear previous data and tooltip
        const existingData = document.getElementById("data");
        if (existingData) existingData.remove();
        const existingTooltip = document.getElementById("data-tooltip");
        if (existingTooltip) existingTooltip.remove();

        // Update axis labels from headers
        const xAxisLabel = document.getElementById("x-axis-label");
        const yAxisLabel = document.getElementById("y-axis-label");
        if (xAxisLabel && this.headers[0]) {
            xAxisLabel.textContent = this.headers[0];
        }
        if (yAxisLabel && this.headers.length > 1) {
            // If multiple Y series, join them
            const yLabels = this.headers.slice(1).join(', ');
            yAxisLabel.textContent = yLabels;
        }

        const plotArea = document.getElementById("plot-area");
        const plotAreaX = Number(plotArea.attributes.x.value);
        const plotAreaY = Number(plotArea.attributes.y.value);
        const width = Number(plotArea.attributes.width.value);
        const height = Number(plotArea.attributes.height.value);

        // Parse X data
        const xData = this.allColumns[0].map(v => parseFloat(v));

        // Get all Y series (columns 1+)
        const ySeriesData = [];
        for (let i = 1; i < this.allColumns.length; i++) {
            ySeriesData.push(this.allColumns[i].map(v => parseFloat(v)));
        }

        // Calculate global scale bounds across all series
        const dataMinX = Math.min(...xData);
        const dataMaxX = Math.max(...xData);
        let dataMinY = Infinity, dataMaxY = -Infinity;
        ySeriesData.forEach(series => {
            dataMinY = Math.min(dataMinY, ...series);
            dataMaxY = Math.max(dataMaxY, ...series);
        });

        // Apply axis configuration ranges
        const xRange = this.axisConfig.calculateRange(dataMinX, dataMaxX, this.axisConfig.xMin, this.axisConfig.xMax, this.axisConfig.xScale);
        const yRange = this.axisConfig.calculateRange(dataMinY, dataMaxY, this.axisConfig.yMin, this.axisConfig.yMax, this.axisConfig.yScale);

        const minX = xRange.min;
        const maxX = xRange.max;
        const minY = yRange.min;
        const maxY = yRange.max;

        // Apply scale transformations
        const scaledMinX = this.axisConfig.applyScale(minX, this.axisConfig.xScale);
        const scaledMaxX = this.axisConfig.applyScale(maxX, this.axisConfig.xScale);
        const scaledMinY = this.axisConfig.applyScale(minY, this.axisConfig.yScale);
        const scaledMaxY = this.axisConfig.applyScale(maxY, this.axisConfig.yScale);

        const rangeX = scaledMaxX - scaledMinX || 1;
        const rangeY = scaledMaxY - scaledMinY || 1;
        const sX = width / rangeX;
        const sY = height / rangeY;

        const data = {
            "type": "g",
            "id": "data",
            "attributes": {
                "transform": `translate(${plotAreaX},${plotAreaY})`,
            },
            "children": []
        };

        // Render grid if enabled
        if (this.axisConfig.gridEnabled) {
            this.renderGrid(data, width, height, minX, maxX, minY, maxY, scaledMinX, scaledMaxX, scaledMinY, scaledMaxY, sX, sY);
        }

        // Render tick marks if enabled
        if (this.axisConfig.ticksEnabled) {
            this.renderTicks(data, width, height, minX, maxX, minY, maxY, scaledMinX, scaledMaxX, scaledMinY, scaledMaxY, sX, sY, plotAreaX, plotAreaY);
        }

        // Create tooltip element (text only, no background)
        const tooltip = {
            "type": "g",
            "id": "data-tooltip",
            "attributes": {
                "transform": `translate(${plotAreaX},${plotAreaY})`,
                "style": "pointer-events: none; opacity: 0; transition: opacity 0.2s;"
            },
            "children": [
                {
                    "type": "text",
                    "id": "tooltip-text",
                    "attributes": {
                        "x": 0, "y": 0,
                        "fill": "#000000", "font-size": 14, "font-family": "monospace",
                        "font-weight": "bold",
                        "text-anchor": "middle"
                    },
                    "textContent": ""
                }
            ]
        };

        // Helper for smooth curves (Catmull-Rom spline)
        const getCurvePoint = (p0, p1, p2, p3, t) => {
            const t2 = t * t;
            const t3 = t2 * t;
            return 0.5 * ((2 * p1) + (-p0 + p2) * t +
                (2*p0 - 5*p1 + 4*p2 - p3) * t2 +
                (-p0 + 3*p1 - 3*p2 + p3) * t3);
        };

        // Render each Y series
        ySeriesData.forEach((ySeries, seriesIdx) => {
            const color = this.colors[seriesIdx % this.colors.length];

            // Create smooth curve path with data filtering
            let pathData = '';
            const points = [];
            for (let i = 0; i < xData.length; i++) {
                // Filter data based on range
                if (xData[i] < minX || xData[i] > maxX || ySeries[i] < minY || ySeries[i] > maxY) {
                    continue;
                }

                const scaledX = this.axisConfig.applyScale(xData[i], this.axisConfig.xScale);
                const scaledY = this.axisConfig.applyScale(ySeries[i], this.axisConfig.yScale);
                const xSvg = (scaledX - scaledMinX) * sX;
                const ySvg = height - (scaledY - scaledMinY) * sY;
                points.push({x: xSvg, y: ySvg, dataX: xData[i], dataY: ySeries[i]});
            }

            if (points.length > 2) {
                pathData = `M${points[0].x},${points[0].y}`;
                for (let i = 0; i < points.length - 1; i++) {
                    const p0 = points[Math.max(0, i - 1)];
                    const p1 = points[i];
                    const p2 = points[i + 1];
                    const p3 = points[Math.min(points.length - 1, i + 2)];

                    for (let t = 0; t <= 1; t += 0.1) {
                        const x = getCurvePoint(p0.x, p1.x, p2.x, p3.x, t);
                        const y = getCurvePoint(p0.y, p1.y, p2.y, p3.y, t);
                        pathData += ` L${x},${y}`;
                    }
                }
            }

            // Add smooth curve
            data.children.push({
                "type": "path",
                "attributes": {
                    "d": pathData,
                    "stroke": color,
                    "stroke-width": "2.5",
                    "fill": "none",
                    "opacity": "0.8"
                }
            });

            // Add data points (using filtered points)
            for (let i = 0; i < points.length; i++) {
                data.children.push({
                    "type": "circle",
                    "classes": ["data-point"],
                    "attributes": {
                        "cx": points[i].x,
                        "cy": points[i].y,
                        "r": 4,
                        "fill": color,
                        "stroke": "#ffffff",
                        "stroke-width": 2,
                        "style": "cursor: pointer;",
                        "data-x": points[i].dataX,
                        "data-y": points[i].dataY,
                        "data-series": this.headers[seriesIdx + 1] || `Series ${seriesIdx + 1}`
                    }
                });
            }
        });

        const svg = document.getElementById('chart-svg');
        const dataElement = createElement(data);
        const tooltipElement = createElement(tooltip);

        // Add hover effects
        const circles = dataElement.querySelectorAll('.data-point');
        circles.forEach(circle => {
            circle.addEventListener('mouseenter', function() {
                this.setAttribute('r', 7);
                const x = this.getAttribute('data-x');
                const y = this.getAttribute('data-y');
                const series = this.getAttribute('data-series');
                const tooltipText = tooltipElement.querySelector('#tooltip-text');
                tooltipText.textContent = `${series}: (${x}, ${y})`;
                tooltipText.setAttribute('x', this.getAttribute('cx'));
                tooltipText.setAttribute('y', parseFloat(this.getAttribute('cy')) - 15);
                tooltipElement.setAttribute('style', 'pointer-events: none; opacity: 1; transition: opacity 0.2s;');
            });
            circle.addEventListener('mouseleave', function() {
                this.setAttribute('r', 4);
                tooltipElement.setAttribute('style', 'pointer-events: none; opacity: 0; transition: opacity 0.2s;');
            });
        });

        svg.appendChild(dataElement);
        svg.appendChild(tooltipElement);
    }

    renderGrid(data, width, height, minX, maxX, minY, maxY, scaledMinX, scaledMaxX, scaledMinY, scaledMaxY, sX, sY) {
        const gridGroup = {
            "type": "g",
            "id": "grid-lines",
            "attributes": {
                "opacity": this.axisConfig.gridOpacity
            },
            "children": []
        };

        // X grid lines (vertical)
        const xTicks = this.axisConfig.generateTicks(minX, maxX, this.axisConfig.xGridFrequency, this.axisConfig.xScale);
        xTicks.forEach(tick => {
            const scaledTick = this.axisConfig.applyScale(tick, this.axisConfig.xScale);
            const x = (scaledTick - scaledMinX) * sX;

            gridGroup.children.push({
                "type": "line",
                "attributes": {
                    "x1": x,
                    "y1": 0,
                    "x2": x,
                    "y2": height,
                    "stroke": this.axisConfig.gridColor,
                    "stroke-width": "1",
                    "stroke-dasharray": this.axisConfig.getGridStrokeDasharray()
                }
            });
        });

        // Y grid lines (horizontal)
        const yTicks = this.axisConfig.generateTicks(minY, maxY, this.axisConfig.yGridFrequency, this.axisConfig.yScale);
        yTicks.forEach(tick => {
            const scaledTick = this.axisConfig.applyScale(tick, this.axisConfig.yScale);
            const y = height - (scaledTick - scaledMinY) * sY;

            gridGroup.children.push({
                "type": "line",
                "attributes": {
                    "x1": 0,
                    "y1": y,
                    "x2": width,
                    "y2": y,
                    "stroke": this.axisConfig.gridColor,
                    "stroke-width": "1",
                    "stroke-dasharray": this.axisConfig.getGridStrokeDasharray()
                }
            });
        });

        // Insert grid at beginning so it's behind data
        data.children.unshift(gridGroup);
    }

    renderTicks(data, width, height, minX, maxX, minY, maxY, scaledMinX, scaledMaxX, scaledMinY, scaledMaxY, sX, sY, plotAreaX, plotAreaY) {
        const tickGroup = {
            "type": "g",
            "id": "tick-marks",
            "attributes": {},
            "children": []
        };

        // X axis ticks (bottom)
        const xTicks = this.axisConfig.generateTicks(minX, maxX, this.axisConfig.xTickFrequency, this.axisConfig.xScale);
        xTicks.forEach(tick => {
            const scaledTick = this.axisConfig.applyScale(tick, this.axisConfig.xScale);
            const x = (scaledTick - scaledMinX) * sX;

            // Tick mark
            tickGroup.children.push({
                "type": "line",
                "attributes": {
                    "x1": x,
                    "y1": height,
                    "x2": x,
                    "y2": height + this.axisConfig.tickLength,
                    "stroke": this.axisConfig.tickColor,
                    "stroke-width": this.axisConfig.tickWidth
                }
            });

            // Tick label
            if (this.axisConfig.tickLabelsEnabled) {
                const label = this.axisConfig.formatTickLabel(tick, this.axisConfig.xScale);
                tickGroup.children.push({
                    "type": "text",
                    "attributes": {
                        "x": x,
                        "y": height + this.axisConfig.tickLength + 15,
                        "fill": this.axisConfig.tickColor,
                        "font-size": this.axisConfig.tickLabelFontSize,
                        "font-family": "Arial, sans-serif",
                        "text-anchor": "middle"
                    },
                    "textContent": label
                });
            }
        });

        // Y axis ticks (left)
        const yTicks = this.axisConfig.generateTicks(minY, maxY, this.axisConfig.yTickFrequency, this.axisConfig.yScale);
        yTicks.forEach(tick => {
            const scaledTick = this.axisConfig.applyScale(tick, this.axisConfig.yScale);
            const y = height - (scaledTick - scaledMinY) * sY;

            // Tick mark
            tickGroup.children.push({
                "type": "line",
                "attributes": {
                    "x1": -this.axisConfig.tickLength,
                    "y1": y,
                    "x2": 0,
                    "y2": y,
                    "stroke": this.axisConfig.tickColor,
                    "stroke-width": this.axisConfig.tickWidth
                }
            });

            // Tick label
            if (this.axisConfig.tickLabelsEnabled) {
                const label = this.axisConfig.formatTickLabel(tick, this.axisConfig.yScale);
                tickGroup.children.push({
                    "type": "text",
                    "attributes": {
                        "x": -this.axisConfig.tickLength - 5,
                        "y": y + 4,
                        "fill": this.axisConfig.tickColor,
                        "font-size": this.axisConfig.tickLabelFontSize,
                        "font-family": "Arial, sans-serif",
                        "text-anchor": "end"
                    },
                    "textContent": label
                });
            }
        });

        data.children.unshift(tickGroup);
    }
}

export default Scatter;
