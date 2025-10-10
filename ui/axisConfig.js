// Axis configuration system for customizable scales, ranges, grids, and tick marks

class AxisConfig {
    constructor() {
        // Scale settings
        this.xScale = 'linear'; // 'linear', 'log'
        this.yScale = 'linear';

        // Range settings (null = auto)
        this.xMin = null;
        this.xMax = null;
        this.yMin = null;
        this.yMax = null;

        // Grid settings
        this.gridEnabled = true;
        this.gridColor = '#e0e0e0';
        this.gridStyle = 'solid'; // 'solid', 'dashed', 'dotted'
        this.gridOpacity = 0.5;
        this.xGridFrequency = 5; // Number of grid lines
        this.yGridFrequency = 5;

        // Tick mark settings
        this.ticksEnabled = true;
        this.tickColor = '#2c3e50';
        this.tickLength = 8;
        this.tickWidth = 2;
        this.xTickFrequency = 5; // Number of ticks
        this.yTickFrequency = 5;
        this.tickLabelsEnabled = true;
        this.tickLabelFontSize = 12;
    }

    // Calculate actual range based on data and settings
    calculateRange(dataMin, dataMax, userMin, userMax, scale) {
        const min = userMin !== null ? userMin : dataMin;
        const max = userMax !== null ? userMax : dataMax;

        if (scale === 'log') {
            // For log scale, ensure positive values
            return {
                min: Math.max(0.0001, min),
                max: Math.max(0.001, max)
            };
        }

        return { min, max };
    }

    // Apply scale transformation
    applyScale(value, scale) {
        if (scale === 'log') {
            return Math.log10(Math.max(0.0001, value));
        }
        return value;
    }

    // Inverse scale transformation (for tick labels)
    inverseScale(value, scale) {
        if (scale === 'log') {
            return Math.pow(10, value);
        }
        return value;
    }

    // Generate tick positions
    generateTicks(min, max, frequency, scale) {
        const ticks = [];

        if (scale === 'log') {
            // For log scale, use powers of 10
            const logMin = Math.floor(Math.log10(min));
            const logMax = Math.ceil(Math.log10(max));

            for (let i = logMin; i <= logMax; i++) {
                const value = Math.pow(10, i);
                if (value >= min && value <= max) {
                    ticks.push(value);
                }
            }
        } else {
            // Linear ticks
            const range = max - min;
            const step = range / (frequency - 1);

            for (let i = 0; i < frequency; i++) {
                ticks.push(min + step * i);
            }
        }

        return ticks;
    }

    // Format tick label
    formatTickLabel(value, scale) {
        // Special case: always display 0 as "0"
        if (value === 0) {
            return '0';
        }

        if (scale === 'log') {
            // Use scientific notation for very small/large values
            if (value >= 1000 || value <= 0.001) {
                return value.toExponential(0);
            }
            return value.toString();
        }

        // Round to reasonable precision
        if (Math.abs(value) < 0.01) {
            return value.toExponential(2);
        } else if (Math.abs(value) < 1) {
            return value.toFixed(3);
        } else if (Math.abs(value) < 100) {
            return value.toFixed(2);
        } else {
            return Math.round(value).toString();
        }
    }

    // Get grid line style
    getGridStrokeDasharray() {
        switch (this.gridStyle) {
            case 'dashed':
                return '5,5';
            case 'dotted':
                return '2,2';
            default:
                return 'none';
        }
    }
}

export default AxisConfig;
