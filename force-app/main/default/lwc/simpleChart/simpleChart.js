import { LightningElement, api, track } from 'lwc';


export default class GenericChart extends LightningElement {
    @api chartType = 'doughnut'; // Default chart type
    // @api chartData = ''; // String representing array of data values
    // @api chartLabels = ''; // String representing array of labels
    // @api chartColors = ''; // String representing array of colors
    @api chartData = '30, 50, 26, 13, 1.7, 1.6, 2.9, 1, 9, 3.9'; 
    @api chartLabels = ' Agency ,  Ethicals ,  Parallel imports ,  Generics ,  Pharmacy medicines ,  Health & beauty ,  GSL medicines ,  Surgicals/Healthcare ,  Zds , text '; // String representing array of labels
    @api chartColors = ' #B7312C ,  #D40069 ,  #007AA3 ,  #003B6A ,  #96C7C4 ,  #F2A900 ,  #547487 ,  #547487 , #5CB8B2 ,  #803C6E ,  #29873C ,  #949494 ,  #BC3927 '; // String representing array of colors
  
    @api title = ''; // Title to be displayed in the center for doughnut/pie charts
    @api subTitle = ''; // Sub-title to be displayed in the center for doughnut/pie charts
    chartInitialized = false;

    @track legendItems = [];
    chart; // Store chart instance
    canvas; // Store canvas element
    ctx; // Store canvas context
    data;
    labels;
    colors;
    renderedCallback() {
        if (this.chartInitialized) return;
    
        this.chartInitialized = true;
        this.canvas = this.template.querySelector('canvas[data-id="chartCanvas"]');
        this.ctx = this.canvas.getContext('2d');
        this.data = this.parseStringToArray(this.chartData);
        this.labels = this.chartLabels.split(',').map(label => label.trim());
        this.colors = this.chartColors.split(',').map(color => color.trim());
        this.drawChart();
    //Replaced setTimeout with requestAnimationFrame for better performance.
        requestAnimationFrame(() => {
            const elements = this.template.querySelectorAll(".legend-color");
            elements.forEach((element, i) => {
                element.style.backgroundColor = this.colors[i];
            });
            this.addHoverEffects();
        });
    }

    drawChart() {
        if (!this.canvas) return;
  

        this.legendItems = this.labels.map((label, index) => ({
            label,
            color: this.colors[index],
            value: parseFloat(this.data[index]).toFixed(2),
            index
        }));

        switch (this.chartType) {
            case 'doughnut':
                this.drawDoughnutChart(this.ctx, this.data, this.labels, this.colors);
                break;
            default:
                console.error('Unsupported chart type');
        }
    }

    addHoverEffects() {
        const legendItems = this.template.querySelectorAll('.legend-item');
        const chartTooltip =   this.template.querySelector('span[data-id="tooltip"]')
                
    
        legendItems.forEach((item) => {
            item.addEventListener('mouseenter', (event) => {
                const index = event.currentTarget.dataset.index;
                this.highlightSegment(index, true);
                event.currentTarget.querySelector('.legend-text').classList.add('underline');
            });
            item.addEventListener('mouseleave', (event) => {
                this.clearHighlight();
                this.hideTooltip()
                event.currentTarget.querySelector('.legend-text').classList.remove('underline');
            });
            item.addEventListener('mouseover', (event) => {
                const mousePos = this.getMousePos(this.canvas, event);
                chartTooltip.display = 'block';
                chartTooltip.textContent = 'text ' 
                const index = event.currentTarget.dataset.index;
                this.highlightSegment(index, true);
                event.currentTarget.querySelector('.legend-text').classList.add('underline');
            });

        });

        this.canvas.addEventListener('mousemove', (event) => {
            const mousePos = this.getMousePos(this.canvas, event);
            const index = this.getSegmentIndex(mousePos, this.canvas);
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
                this.hideTooltip()
            }
        });

        this.canvas.addEventListener('mouseout', () => {
   
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
        // const ctx = canvas.getContext('2d');
        const data = this.parseStringToArray(this.chartData);
        const total = data.reduce((acc, value) => acc + value, 0);
        let startAngle = 0;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = 150;

        for (let i = 0; i < data.length; i++) {
            const angle = (data[i] / total) * 2 * Math.PI;
            const endAngle = startAngle + angle;
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            this.ctx.arc(centerX, centerY, 90, endAngle, startAngle, true);
            this.ctx.closePath();
            if (this.ctx.isPointInPath(mousePos.x, mousePos.y)) {
                return i;
            }
            startAngle = endAngle;
        }
        return -1;
    }

    highlightSegment(index, highlight, mousePos = {}) {
      
console.log('mousePos 1111111111', mousePos, mousePos.x)
 
        const innerRadius = 90;
        const outerRadius = 150;
        const enlargedInnerRadius = innerRadius * 1.1;
        const enlargedOuterRadius = outerRadius * 1.05;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawChart();

        const total = this.data.reduce((acc, value) => acc + value, 0);
        let startAngle = 0;

        this.data.forEach((value, idx) => {
            const angle = (value / total) * 2 * Math.PI;
            let endAngle = startAngle + angle;
            // showTooltip('text',)
            if (highlight && idx != index) {
                // Do nothing
            } else {
                this.ctx.beginPath();
                this.ctx.arc(200, 200, enlargedOuterRadius, startAngle - (startAngle * 0.01), endAngle + (endAngle * 0.01));
                this.ctx.arc(200, 200, 85, endAngle + (endAngle * 0.01), startAngle - (startAngle * 0.01), true);
                this.ctx.closePath();
                this.ctx.fillStyle = this.colors[idx];
                this.ctx.fill();

                const text = '£' + this.kFormatter(value.toFixed(0));
                const middleAngle = startAngle + angle / 2;
                const labelX = 200 + Math.cos(middleAngle) * (innerRadius + enlargedOuterRadius) / 2;
                const labelY = 200 + 5 + Math.sin(middleAngle) * (innerRadius + enlargedOuterRadius) / 2;

                if (this.isTextWithinSegment(this.ctx, text, labelX, labelY - 5)) {
                    this.ctx.fillStyle = this.getTextColor(this.hexToRgb(this.colors[index]));
                    this.ctx.font = '16px Open Sans';
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText(text, labelX, labelY);
                } else{
                    if(mousePos){
                        this.showTooltip(text, mousePos.x, mousePos.y)
                    }
                }
            }

            startAngle = endAngle;
        });

        this.ctx.fillStyle = '#FFF';
        this.ctx.beginPath();
        this.ctx.arc(200, 200, 60, 0, 2 * Math.PI);
        this.ctx.closePath();
        this.ctx.fill();

        this.ctx.fillStyle = '#5d5d5d';
        this.ctx.font = '14px Open Sans';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(this.title, 200, 190);
        this.ctx.fillStyle = '#000';
        this.ctx.font = '24px Open Sans';
        let sum = 0;
        this.data.forEach(num => {
            sum += num;
        });
        this.ctx.fillText('£' + sum.toLocaleString(), 200, 220);
    }



    showTooltip(text, x, y) {
        console.log('showTooltip')
        const tooltip = this.template.querySelector('div[data-id="tooltip"]');
        console.log('tooltip', tooltip)
        tooltip.style.left = `${x + 10}px`;
        tooltip.style.top = `${y + 10}px`;
        tooltip.style.display = 'block';
        tooltip.innerHTML = text;
    }

    hideTooltip() {
        const tooltip = this.template.querySelector('div[data-id="tooltip"]');
        tooltip.style.display = 'none';
    }

    clearHighlight() {
      
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

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
        const total = this.data.reduce((acc, value) => acc + value, 0);
console.log('drawDoughnutChart drawDoughnutChart')
        this.data.forEach((value, index) => {
            const angle = (value / total) * 2 * Math.PI;
            const endAngle = startAngle + angle;

            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle);
            this.ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
            this.ctx.closePath();
            this.ctx.fillStyle = this.colors[index];
            this.ctx.fill();

            // Link segment to legend item
            this.ctx.segmentIndex = index;

            const middleAngle = startAngle + angle / 2;
            const labelX = centerX + Math.cos(middleAngle) * (innerRadius + outerRadius) / 2;
            const labelY = centerY + 5 + Math.sin(middleAngle) * (innerRadius + outerRadius) / 2;
            this.ctx.fillStyle = this.getTextColor(this.hexToRgb(this.colors[index]));
            this.ctx.font = '13px Open Sans';
            this.ctx.textAlign = 'center';
            

            let text = '£' + this.kFormatter(value.toFixed(0));

            if (this.isTextWithinSegment(this.ctx, text, labelX, labelY - 5)) {
                this.ctx.fillText(text, labelX, labelY);
            }

            startAngle = endAngle;
        });

        this.ctx.fillStyle = '#FFF';
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI);
        this.ctx.closePath();
        this.ctx.fill();

        this.ctx.fillStyle = '#595959';
        this.ctx.font = '14px Open Sans';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(this.title, centerX, centerY - 10);
        this.ctx.fillStyle = '#1A1A1A';
        this.ctx.font = '24px Open Sans';
        let sum = 0;
        this.data.forEach(num => {
            sum += num;
        });
        this.ctx.fillText('£' + sum.toLocaleString(), centerX, centerY + 20);
    }



    kFormatter(num) {
        return Math.abs(num) > 999 ? Math.sign(num) * ((Math.abs(num) / 1000).toFixed(1)) + 'K' : Math.sign(num) * Math.abs(num);
    }

    isTextWithinSegment(ctx, text, x, y) {
        const textMetrics = this.ctx.measureText(text);
        const textWidth = textMetrics.width;
        const textHeight = parseInt(this.ctx.font, 8);
        const bottomLeftVertexX = x - textWidth / 2;
        const bottomLeftVertexY = y + textHeight / 2;

        const vertexBL = [bottomLeftVertexX, bottomLeftVertexY]; // bottom left vertex coordinates
        const vertexBR = [bottomLeftVertexX + textWidth, bottomLeftVertexY]; // bottom right vertex coordinates
        const vertexTL = [bottomLeftVertexX, bottomLeftVertexY - textHeight]; // top left vertex coordinates
        const vertexTR = [bottomLeftVertexX + textWidth, bottomLeftVertexY - textHeight]; // top right vertex coordinates

        return this.areVertexColorsEqual(this.ctx, [vertexBL, vertexBR, vertexTL, vertexTR]);
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
        const imageData = this.ctx.getImageData(coordinates[0], coordinates[1], 1, 1);
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
        // const ctx = this.canvas.getContext('2d');
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawChart();
    }
}
