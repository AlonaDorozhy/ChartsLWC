import {
    LightningElement,
    api,
    track
} from 'lwc';

export default class GenericChart extends LightningElement {
    @api isTestMode = false;
    @api chartType = 'doughnut'; // Default chart type
    @api chartData = ''; // String representing array of data values
    @api chartLabels = ''; // String representing array of labels
    @api chartColors = ''; // String representing array of colors
    @api subTitle = ''; // String representing array of colors
    @api title = ''; // Title to be displayed in the center for doughnut/pie charts
    @api header = ''; // Sub-title to be displayed in the center for doughnut/pie charts
    chartInitialized = false;

    @track legendItems = [];
    @track chartHeader = '';
    chart; // Store chart instance
    canvas; // Store canvas element
    ctx; // Store canvas context
    data;
    labels;
    colors;
    totalAmount;
    chartParameters = {}

    chartStyles = {
        innerBackground: '#FFF',
        fontInnerText: '16px system-ui',
        fontInnerSum: '26px Open Sans',
        fontColorInnerText: '#595959',
        fontColorInnerSum: '#1A1A1A',

    }

    renderedCallback() {
        if (this.chartInitialized) return;
        // console.log(this.chartStyles.fontColorInnerText)
        this.chartInitialized = true;
        this.canvas = this.template.querySelector('canvas[data-id="chartCanvas"]');
        this.ctx = this.canvas.getContext('2d');
        this.data = this.parseStringToArray(this.chartData);
        this.labels = this.chartLabels.split(',').map(label => label.trim());
        this.colors = this.chartColors.split(',').map(color => color.trim());
        this.totalAmount = this.data.reduce((acc, value) => acc + value, 0);
        this.chartHeader = `${this.header} - £${this.totalAmount}`
        this.chartParameters = {
            centerX: 150,
            centerY: 150,
            outerRadius: 143,
            innerRadius: 88,
        }
        this.drawChart();

        requestAnimationFrame(() => {
            const elements = this.template.querySelectorAll(".legend-color");
            elements.forEach((element, i) => {
                element.style.backgroundColor = this.colors[i];
            });
            this.addHoverEffects();
        });
    }

    drawChart() {
        const canvas = this.template.querySelector('canvas[data-id="chartCanvas"]');
        if (!canvas) return;
        const total = this.data.reduce((acc, value) => acc + value, 0)
        const currency = this.formatCurrency(total)

        this.chartHeader = `${this.header} - £${currency}`
        this.legendItems = this.labels.map((label, index) => ({
            label,
            color: this.colors[index],
            value: this.formatCurrency(this.data[index]),
            index
        }));
        switch (this.chartType) {
            case 'doughnut':
                this.drawDoughnutChart();
                break;
            default:
                console.error('Unsupported chart type');
        }
    }

    addHoverEffects() {
        const legendItems = this.template.querySelectorAll('.legend-item');

        legendItems.forEach((item) => {
            item.addEventListener('mouseenter', (event) => {
                const index = event.currentTarget.dataset.index;
                this.highlightSegment(index);
                this.hideTooltip()
                event.currentTarget.querySelector('.legend-text').classList.add('underline');
            });
            item.addEventListener('mouseleave', (event) => {
                this.clearHighlight();
                event.currentTarget.querySelector('.legend-text').classList.remove('underline');
            });
            item.addEventListener('mouseover', (event) => {
                const index = event.currentTarget.dataset.index;
                this.highlightSegment(index);
                this.hideTooltip()
                event.currentTarget.querySelector('.legend-text').classList.add('underline');
            });
            item.addEventListener('click', (event) => {
                const index = event.currentTarget.dataset.index;
                this.handleClick(index);
            });

        });

        this.canvas.addEventListener('mousemove', (event) => {
            const mousePos = this.getMousePos(event);
            const index = this.getSegmentIndex(mousePos);

            if (index !== -1) {
                legendItems.forEach((item) => item.querySelector('.legend-text').classList.remove('underline'));
                const legendItem = this.template.querySelector(`.legend-item[data-index="${index}"]`);
                if (legendItem) {
                    legendItem.querySelector('.legend-text').classList.add('underline');
                    this.highlightSegment(index, mousePos);
                }
            } else {
                legendItems.forEach((item) => item.querySelector('.legend-text').classList.remove('underline'));
                this.hideTooltip()
                this.clearHighlight();
            }
        });

        this.canvas.addEventListener('mouseout', () => {
            legendItems.forEach((item) => item.querySelector('.legend-text').classList.remove('underline'));
            this.clearHighlight();
        });

        this.canvas.addEventListener('click', (event) => {
            const mousePos = this.getMousePos(event);
            const index = this.getSegmentIndex(mousePos);
            if (index !== -1) {
                this.handleClick(index);
            }
        });
    }

    handleClick(index) {
        // Implement the action to be taken when a segment is clicked
        alert(`${this.labels[index]} - ${this.data[index]} clicked`);
    }


    getMousePos(evt) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    }

    getSegmentIndex(mousePos) {
        const {
            ctx
        } = this
        const total = this.data.reduce((acc, value) => acc + value, 0);
        let startAngle = (270 * Math.PI) / 180; // Starting at the top (270 degrees)
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const outerRadius = 150;
        const innerRadius = 88;

        for (let i = 0; i < this.data.length; i++) {
            const angle = (this.data[i] / total) * 2 * Math.PI;
            const endAngle = startAngle + angle;
            ctx.beginPath();
            ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle);
            ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
            ctx.closePath();
            if (ctx.isPointInPath(mousePos.x, mousePos.y)) {
                return i;
            }
            startAngle = endAngle;
        }
        return -1;
    }
    highlightSegment(index, mousePos = {}) {
        const {
            centerX,
            centerY,
            outerRadius,
            innerRadius
        } = this.chartParameters;
        const {
            ctx,
            data
        } = this
        const totalAmount = data.reduce((acc, value) => acc + value, 0);
        const enlargedInnerRadius = innerRadius * 1.1;
        const enlargedOuterRadius = outerRadius * 1.03;

        let startAngle = (270 * Math.PI) / 180; // Starting at the top
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawChart();
        data.forEach((value, idx) => {
            const angle = (value / totalAmount) * 2 * Math.PI;
            let endAngle = startAngle + angle;

            if (idx != index || value === 0) {
                // No highlight
            } else {
                // Adjusted the padding to be a fixed small value to avoid overly wide highlights
                const padding = 0.03;
                ctx.beginPath();

                ctx.arc(centerX, centerY, enlargedOuterRadius, startAngle - padding, endAngle + padding);
                ctx.arc(centerX, centerY, 85, endAngle + padding, startAngle - padding, true);
                ctx.fillStyle = this.colors[idx];
                ctx.fill();

                let formatAmount = '£' + this.formatCurrency(value, true);

                const middleAngle = startAngle + angle / 2;
                const labelX = centerX + Math.cos(middleAngle) * (innerRadius + enlargedOuterRadius) / 2;
                const labelY = centerY + 5 + Math.sin(middleAngle) * (innerRadius + enlargedOuterRadius) / 2;

                ctx.fillStyle = this.getTextColor(this.hexToRgb(this.colors[index]));
                ctx.font = '16px system-ui';
                ctx.textAlign = 'center';
                if (this.isTextWithinSegment(ctx, formatAmount, labelX, labelY - 5)) {
                    ctx.fillText(formatAmount, labelX, labelY);
                    this.hideTooltip();
                } else {
                    if (mousePos) {
                        this.showTooltip(formatAmount, mousePos.x, mousePos.y);
                    }
                }
            }

            startAngle = endAngle;
        });

        this.drawInnerText(centerX, centerY, totalAmount, 60);
    }

    drawDoughnutChart() {
        const {
            centerX,
            centerY,
            outerRadius,
            innerRadius
        } = this.chartParameters;
        const {
            ctx,
            data
        } = this
        let startAngle = (270 * Math.PI) / 180; // Starting at the top
        const totalAmount = this.data.reduce((acc, value) => acc + value, 0);

        data.forEach((value, index) => {
            const angle = (value / totalAmount) * 2 * Math.PI;
            const endAngle = startAngle + angle;
            ctx.beginPath();
            ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle);
            ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
            ctx.closePath();
            ctx.fillStyle = this.colors[index];
            ctx.fill();

            // Link segment to legend item
            ctx.segmentIndex = index;
            const middleAngle = startAngle + angle / 2;
            const labelX = centerX + Math.cos(middleAngle) * (innerRadius + outerRadius) / 2;
            const labelY = centerY + 5 + Math.sin(middleAngle) * (innerRadius + outerRadius) / 2;
            ctx.fillStyle = this.getTextColor(this.hexToRgb(this.colors[index]));
            ctx.font = '14px system-ui';
            ctx.textAlign = 'center';
            let formatAmount = '£' + this.formatCurrency(value, true);

            if (this.isTextWithinSegment(ctx, formatAmount, labelX, labelY - 5)) {
                ctx.fillText(formatAmount, labelX, labelY);
            }

            startAngle = endAngle;
        });

        this.drawInnerText(centerX, centerY, totalAmount, innerRadius);
    }

    drawInnerText(centerX, centerY, totalAmount, innerRadius) {
        const {
            ctx
        } = this
        // Inner background
        ctx.fillStyle = this.chartStyles.innerBackground;
        ctx.beginPath();
        ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.fill();
        // Inner text header
        ctx.fillStyle = this.chartStyles.fontColorInnerText;
        ctx.font = `normal 400 16px system-ui`;
        ctx.textAlign = 'center';
        ctx.fillText(this.title, centerX, centerY - 23);
        // Inner total amount
        ctx.fillStyle = this.chartStyles.fontColorInnerSum;
        ctx.font = `normal 600 26px system-ui`;
        const formatAmount = '£' + this.formatCurrency(totalAmount, false, true);
        ctx.fillText(formatAmount, centerX, centerY + 9);
    }

    clearHighlight() {
        this.hideTooltip()
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const legendItems = this.template.querySelectorAll('.legend-text');
        legendItems.forEach((item) => {
            item.classList.remove('underline');
        });

        this.drawChart(); // Re-draw the original chart
    }

    parseStringToArray(str) {
        if (!str) {
            return [];
        }
        return str.split(',').map(item => parseFloat(item.trim()));
    }

    formatCurrency(amount, useAbbreviations = false, isCenter = false) {
        let formattedAmount;

        if (useAbbreviations) {
            if (amount > 999999) {
                formattedAmount = Math.floor(amount / 1000000) + 'M';
            } else if (amount >= 1_000) {
                formattedAmount = Math.floor(amount / 1000) + 'K';
            } else {
                formattedAmount = Math.floor(amount).toString();
            }
        } else {
            if (isCenter) {
                formattedAmount = Math.floor(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            } else {
                formattedAmount = amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            }
        }

        return formattedAmount;
    }


    isTextWithinSegment(ctx, text, x, y) {
        const textMetrics = ctx.measureText(text);
        const textWidth = textMetrics.width;
        const textHeight = textMetrics.actualBoundingBoxAscent + textMetrics.actualBoundingBoxDescent;
        const bottomLeftVertexX = x - textWidth / 2;
        const bottomLeftVertexY = y + textHeight / 2;

        const vertexBL = [bottomLeftVertexX, bottomLeftVertexY]; // bottom left vertex coordinates
        const vertexBR = [bottomLeftVertexX + textWidth, bottomLeftVertexY]; // bottom right vertex coordinates
        const vertexTL = [bottomLeftVertexX, bottomLeftVertexY - textHeight]; // top left vertex coordinates
        const vertexTR = [bottomLeftVertexX + textWidth, bottomLeftVertexY - textHeight]; // top right vertex coordinates

        // Enhanced check to ensure all vertices are within the segment
        return this.areVertexColorsEqual(ctx, [vertexBL, vertexBR, vertexTL, vertexTR]) &&
            this.isInsideSegment(ctx, vertexBL) &&
            this.isInsideSegment(ctx, vertexBR) &&
            this.isInsideSegment(ctx, vertexTL) &&
            this.isInsideSegment(ctx, vertexTR);
    }

    // Helper function to check if a point is inside the current segment
    isInsideSegment(ctx, vertex) {
        // Use the ctx.isPointInPath to determine if the vertex is inside the current path
        return ctx.isPointInPath(vertex[0], vertex[1]);
    }

    areVertexColorsEqual(ctx, vertexes) {
        const vertexColor0 = this.getBackgroundColor(ctx, vertexes[0]);
        const vertexColor1 = this.getBackgroundColor(ctx, vertexes[1]);
        const vertexColor2 = this.getBackgroundColor(ctx, vertexes[2]);
        const vertexColor3 = this.getBackgroundColor(ctx, vertexes[3]);
        return JSON.stringify(vertexColor0) === JSON.stringify(vertexColor1) &&
            JSON.stringify(vertexColor1) === JSON.stringify(vertexColor2) &&
            JSON.stringify(vertexColor2) === JSON.stringify(vertexColor3);

    }

    getBackgroundColor(ctx, coordinates) {
        const imageData = ctx.getImageData(coordinates[0], coordinates[1], 1, 1);
        const data = imageData.data;

        return {
            r: data[0],
            g: data[1],
            b: data[2],
            a: data[3],
        };
    }

    hexToRgb(hex) {
        hex = hex.replace(/^#/, "");

        if (hex.length !== 3 && hex.length !== 6) {
            throw new Error("Invalid hex color format. Use #RGB or #RRGGBB.");
        }

        if (hex.length === 3) {
            hex = hex.split("").map((char) => char + char).join("");
        }

        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);

        return [r, g, b];
    }

    getTextColor(rgbColor) {
        let color =
            Math.round(
                (parseInt(rgbColor[0]) * 299 +
                    parseInt(rgbColor[1]) * 587 +
                    parseInt(rgbColor[2]) * 114
                ) / 1000
            );

        return color > 125 ? "#1A1A1A" : "#FFFFFF";
    }

    showTooltip(text, x, y) {
        const tooltip = this.template.querySelector('div[data-id="tooltip"]');
        tooltip.style.left = `${x + 10}px`;
        tooltip.style.top = `${y + 10}px`;
        tooltip.style.visibility = 'visible';
        tooltip.innerHTML = text;
    }

    hideTooltip() {
        const tooltip = this.template.querySelector('.tooltip');
        tooltip.style.visibility = 'hidden';
    }

    //test mode

    onblur(event) {
        this.data[event.target.dataset.index] = parseFloat(event.target.value.replace(/,/g, ''))
        this.chartData = this.data.toString();
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawChart();
    }
}