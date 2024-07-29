import { LightningElement, api, track } from 'lwc';

export default class GenericChart extends LightningElement {
    @api isTestMode = false;
    @api chartType = 'doughnut'; // Default chart type
    @api chartData = ''; // String representing array of data values
    @api chartLabels = ''; // String representing array of labels
    @api chartColors = ''; // String representing array of colors
    @api title = ''; // Title to be displayed in the center for doughnut/pie charts
    @api subTitle = ''; // Sub-title to be displayed in the center for doughnut/pie charts
    chartInitialized = false;

    @track legendItems = [];
    chart; // Store chart instance

    renderedCallback() {
        if (this.chartInitialized) {
            return;
        }
        // console.log('Test mode: ' + this.isTestMode);
        this.chartInitialized = true;
        this.drawChart();
        const colors = this.chartColors.split(',').map(color => color.trim());

        setTimeout(() => {
            let elements = this.template.querySelectorAll(".legend-color");
            for (let i = 0; i < elements.length; i++) {
                elements[i].setAttribute("style", "background-color:" + colors[i] + ";");
            }
            this.addHoverEffects();
        }, 0);

        
    }

    drawChart() {
        const canvas = this.template.querySelector('canvas[data-id="chartCanvas"]');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        const data = this.parseStringToArray(this.chartData);
        const labels = this.chartLabels.split(',').map(label => label.trim());
        const colors = this.chartColors.split(',').map(color => color.trim());

        this.legendItems = labels.map((label, index) => ({
            label,
            color: colors[index],
            value: parseFloat(data[index]).toFixed(2),
            index
        }));

        switch (this.chartType) {
            case 'doughnut':
                this.drawDoughnutChart(ctx, data, labels, colors);
                break;
            default:
                console.error('Unsupported chart type');
        }
    }

    addHoverEffects() {
        const legendItems = this.template.querySelectorAll('.legend-item');
        const canvas = this.template.querySelector('canvas[data-id="chartCanvas"]');
        // console.log(legendItems);
        legendItems.forEach((item) => {
            item.addEventListener('mouseenter', (event) => {
                // console.log('legend hover')
                const index = event.currentTarget.dataset.index;
                this.highlightSegment(index, true);
                event.currentTarget.querySelector('.legend-text').classList.add('underline');
            });
            item.addEventListener('mouseleave', (event) => {
                // console.log('legend hover')
                this.clearHighlight();
                event.currentTarget.querySelector('.legend-text').classList.remove('underline');
            });
            item.addEventListener('mouseover', (event) => {
                // console.log('legend hover')
                const index = event.currentTarget.dataset.index;
                this.highlightSegment(index, true);
                event.currentTarget.querySelector('.legend-text').classList.add('underline');
            });

        });

        canvas.addEventListener('mousemove', (event) => {
            const mousePos = this.getMousePos(canvas, event);
            const index = this.getSegmentIndex(mousePos, canvas);
            if (index !== -1) {
                legendItems.forEach((item) => item.querySelector('.legend-text').classList.remove('underline'));
                const legendItem = this.template.querySelector(`.legend-item[data-index="${index}"]`);
                if (legendItem) {
                    legendItem.querySelector('.legend-text').classList.add('underline');
                    this.highlightSegment(index, true, mousePos);
                }
            } else {
                legendItems.forEach((item) => item.querySelector('.legend-text').classList.remove('underline'));
                this.clearHighlight();
            }
        });

        canvas.addEventListener('mouseout', () => {
            legendItems.forEach((item) => item.querySelector('.legend-text').classList.remove('underline'));
            this.clearHighlight();
        });
    }

    getMousePos(canvas, evt) {
        const rect = canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    }

    getSegmentIndex(mousePos, canvas) {
        const ctx = canvas.getContext('2d');
        const data = this.parseStringToArray(this.chartData);
        const total = data.reduce((acc, value) => acc + value, 0);
        let startAngle = 0;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = 150;

        for (let i = 0; i < data.length; i++) {
            const angle = (data[i] / total) * 2 * Math.PI;
            const endAngle = startAngle + angle;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.arc(centerX, centerY, 90, endAngle, startAngle, true);
            ctx.closePath();
            if (ctx.isPointInPath(mousePos.x, mousePos.y)) {
                return i;
            }
            startAngle = endAngle;
        }
        return -1;
    }

    highlightSegment(index, highlight,  mousePos = {}) {
        console.log('in highlightSegment')
        const canvas = this.template.querySelector('canvas[data-id="chartCanvas"]');
        const ctx = canvas.getContext('2d');
        const data = this.parseStringToArray(this.chartData);
        const labels = this.chartLabels.split(',').map(label => label.trim());
        const colors = this.chartColors.split(',').map(color => color.trim());

        const innerRadius = 90;
        const outerRadius = 150;
        const enlargedInnerRadius = innerRadius * 1.1;
        const enlargedOuterRadius = outerRadius * 1.05;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        this.drawChart();

        const total = data.reduce((acc, value) => acc + value, 0);
        let startAngle = 0;
        // console.log('index: ' + index);
        data.forEach((value, idx) => {
            const angle = (value / total) * 2 * Math.PI;
            let endAngle = startAngle + angle;

            if (highlight && idx != index) {
            } else {
                ctx.beginPath();
                ctx.arc(200, 200, enlargedOuterRadius, startAngle - (startAngle * 0.01), endAngle + (endAngle * 0.01));
                ctx.arc(200, 200, 85, endAngle + (endAngle * 0.01), startAngle - (startAngle * 0.01), true); // Inner radius remains the same
                ctx.closePath();
                ctx.fillStyle = colors[idx];
                ctx.fill();

                const text = '£' + this.kFormatter(value.toFixed(0));
                const middleAngle = startAngle + angle / 2;
                const labelX = 200 + Math.cos(middleAngle) * (innerRadius + enlargedOuterRadius) / 2;
                const labelY = 200 + 5 + Math.sin(middleAngle) * (innerRadius + enlargedOuterRadius) / 2;

                ctx.fillStyle = this.getTextColor(this.hexToRgb(colors[index]));
                ctx.font = '16px Open Sans';
                ctx.textAlign = 'center';
                if (this.isTextWithinSegment(ctx, text, labelX, labelY - 5)) {
                    ctx.fillText(text, labelX, labelY);
                }else{
                    if(mousePos){
                        this.showTooltip('text', mousePos.x, mousePos.y)
                    }
                }
            }

            startAngle = endAngle;
        });
        
         // Redraw inner text
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(200, 200, 60, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#5d5d5d';
        ctx.font = '14px Open Sans';
        ctx.textAlign = 'center';
        ctx.fillText(this.title, 200, 190);
        ctx.fillStyle = '#000';
        ctx.font = '24px Open Sans';
        let sum = 0;
        data.forEach(num => {
            sum += num;
        });
        ctx.fillText('£' + sum.toLocaleString(), 200, 220);
        
    }

    showTooltip(text, x, y) {
        console.log('showTooltip')
        const tooltip = this.template.querySelector('div[data-id="tooltip"]');
        tooltip.classList.add('tooltip-visible');
        console.log('tooltip', tooltip)
        tooltip.style.left = `${x + 10}px`;
        tooltip.style.top = `${y + 10}px`;
        // tooltip.style.display = 'block';
        // tooltip.style.display = 'block';

        tooltip.innerHTML = text;
    }

    hideTooltip() {
        const tooltip = this.template.querySelector('div[data-id="tooltip"]');
        tooltip.style.display = 'none';
    }

    clearHighlight() {
        const canvas = this.template.querySelector('canvas[data-id="chartCanvas"]');
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Remove underline from all legend items
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

    drawDoughnutChart(ctx, data, labels, colors) {
        const centerX = 200;
        const centerY = 200;
        const outerRadius = 150;
        const innerRadius = 90;
        let startAngle = 0;
        const total = data.reduce((acc, value) => acc + value, 0);

        data.forEach((value, index) => {
            const angle = (value / total) * 2 * Math.PI;
            const endAngle = startAngle + angle;

            ctx.beginPath();
            ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle);
            ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
            ctx.closePath();
            ctx.fillStyle = colors[index];
            ctx.fill();

            // Link segment to legend item
            ctx.segmentIndex = index;

            const middleAngle = startAngle + angle / 2;
            const labelX = centerX + Math.cos(middleAngle) * (innerRadius + outerRadius) / 2;
            const labelY = centerY + 5 + Math.sin(middleAngle) * (innerRadius + outerRadius) / 2;
            ctx.fillStyle = this.getTextColor(this.hexToRgb(colors[index]));
            ctx.font = '13px Open Sans';
            ctx.textAlign = 'center';

            let text = '£' + this.kFormatter(value.toFixed(0));

            if (this.isTextWithinSegment(ctx, text, labelX, labelY - 5)) {
                ctx.fillText(text, labelX, labelY);
            }

            startAngle = endAngle;
        });

        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#595959';
        ctx.font = '14px Open Sans';
        ctx.textAlign = 'center';
        ctx.fillText(this.title, centerX, centerY - 10);
        ctx.fillStyle = '#1A1A1A';
        ctx.font = '24px Open Sans';
        let sum = 0;
        data.forEach(num => {
            sum += num;
        });
        ctx.fillText('£' + sum.toLocaleString(), centerX, centerY + 20);
    }

    kFormatter(num) {
        return Math.abs(num) > 999 ? Math.sign(num) * ((Math.abs(num) / 1000).toFixed(1)) + 'K' : Math.sign(num) * Math.abs(num);
    }

    isTextWithinSegment(ctx, text, x, y) {
        const textMetrics = ctx.measureText(text);
        const textWidth = textMetrics.width;
        const textHeight = parseInt(ctx.font, 8);
        const bottomLeftVertexX = x - textWidth / 2;
        const bottomLeftVertexY = y + textHeight / 2;

        const vertexBL = [bottomLeftVertexX, bottomLeftVertexY]; // bottom left vertex coordinates
        const vertexBR = [bottomLeftVertexX + textWidth, bottomLeftVertexY]; // bottom right vertex coordinates
        const vertexTL = [bottomLeftVertexX, bottomLeftVertexY - textHeight]; // top left vertex coordinates
        const vertexTR = [bottomLeftVertexX + textWidth, bottomLeftVertexY - textHeight]; // top right vertex coordinates

        return this.areVertexColorsEqual(ctx, [vertexBL, vertexBR, vertexTL, vertexTR]);
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

    //test mode

    onblur(event) {
        const data = this.parseStringToArray(this.chartData);
        data[event.target.dataset.index] = Number(event.target.value);
        this.chartData = data.toString();
        const canvas = this.template.querySelector('canvas[data-id="chartCanvas"]');
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        this.drawChart();
    }
}
