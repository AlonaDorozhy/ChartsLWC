import { LightningElement, api, track } from 'lwc';

export default class GenericChart extends LightningElement {
    @api chartType = 'doughnut'; // Default chart type
    @api chartData = '30, 50, 26, 13, 1.7, 1.6, 2.9, 1, 9, 3.9'; 

    @api chartLabels = ' Agency ,  Ethicals ,  Parallel imports ,  Generics ,  Pharmacy medicines ,  Health & beauty ,  GSL medicines ,  Surgicals/Healthcare ,  Zds '; // String representing array of labels
    @api chartColors = ' #B7312C ,  #D40069 ,  #007AA3 ,  #003B6A ,  #96C7C4 ,  #F2A900 ,  #547487 ,  #547487 , #5CB8B2 ,  #803C6E ,  #29873C ,  #949494 ,  #BC3927 '; // String representing array of colors
    @api title = ''; // Title to be displayed in the center for doughnut/pie charts
    @api subTitle = ''; // Sub-title to be displayed in the center for doughnut/pie charts
    chartInitialized = false;

    @track legendItems = [];
    chart; // Store chart instance

    renderedCallback() {
        if (this.chartInitialized) {
            return;
        }
        this.chartInitialized = true;
        this.drawChart();
        const colors = this.chartColors.split(',').map(color => color.trim());

        setTimeout(() => {
            console.log('timeout')
            let elements = this.template.querySelectorAll(".legend-color");
            for (let i = 0; i < elements.length; i++) {
                elements[i].setAttribute("style", "background-color:" + colors[i] + ";");
            }
        }, 0);

        this.addHoverEffects();
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
            // case 'bar':
            //     this.drawBarChart(ctx, data, labels, colors);
            //     break;
            // case 'line':
            //     this.drawLineChart(ctx, data, labels, colors);
            //     break;
            // case 'pie':
            //     this.drawPieChart(ctx, data, labels, colors);
            //     break;
            default:
                console.error('Unsupported chart type');
        }
    }

    addHoverEffects() {
        const legendItems = this.template.querySelectorAll('.legend-item');
        const canvas = this.template.querySelector('canvas[data-id="chartCanvas"]');
console.log("addHoverEffects")
        legendItems.forEach((item) => {
            item.addEventListener('mouseenter', (event) => {
                const index = event.currentTarget.dataset.index;
                console.log(index)
                this.highlightSegment(index, true, true);
                event.currentTarget.querySelector('.legend-text').classList.add('underline');
            });
            item.addEventListener('mouseleave', (event) => {
                this.clearHighlight();
                event.currentTarget.querySelector('.legend-text').classList.remove('underline');
            });
        });

        canvas.addEventListener('mousemove', (event) => {
            const mousePos = this.getMousePos(canvas, event);
            const index = this.getSegmentIndex(mousePos, canvas);
            console.log(index , "text")
            if (index !== -1) {
                legendItems.forEach((item) => item.querySelector('.legend-text').classList.remove('underline'));
                const legendItem = this.template.querySelector(`.legend-item[data-index="${index}"]`);
                if (legendItem) {
                    legendItem.querySelector('.legend-text').classList.add('underline');
                    this.highlightSegment(index, true, true);
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

    highlightSegment(index, highlight, showValues = false) {
        const canvas = this.template.querySelector('canvas[data-id="chartCanvas"]');
        const ctx = canvas.getContext('2d');
        const data = this.parseStringToArray(this.chartData);
        const labels = this.chartLabels.split(',').map(label => label.trim());
        const colors = this.chartColors.split(',').map(color => color.trim());

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const total = data.reduce((acc, value) => acc + value, 0);
        let startAngle = 0;

        data.forEach((value, idx) => {
            const angle = (value / total) * 2 * Math.PI;
            const endAngle = startAngle + angle;

            if (highlight && idx == index) {
                ctx.beginPath();
                ctx.arc(200, 200, 160, startAngle, endAngle);
                ctx.arc(200, 200, 100, endAngle, startAngle, true);
                ctx.closePath();
                ctx.fillStyle = colors[idx];
                ctx.fill();

                if (showValues) {
                    const middleAngle = startAngle + angle / 2;
                    const labelX = 200 + Math.cos(middleAngle) * (100 + 160) / 2;
                    const labelY = 200 + 5 + Math.sin(middleAngle) * (100 + 160) / 2;
                    ctx.fillStyle = '#fff';
                    ctx.font = '16px Open Sans';
                    ctx.textAlign = 'center';
                    ctx.fillText('£' + this.kFormatter(value.toFixed(0)), labelX, labelY);
                }
            } else {
                ctx.beginPath();
                ctx.arc(200, 200, 150, startAngle, endAngle);
                ctx.arc(200, 200, 90, endAngle, startAngle, true);
                ctx.closePath();
                ctx.fillStyle = colors[idx];
                ctx.fill();

                const middleAngle = startAngle + angle / 2;
                const labelX = 200 + Math.cos(middleAngle) * (90 + 150) / 2;
                const labelY = 200 + 5 + Math.sin(middleAngle) * (90 + 150) / 2;
                ctx.fillStyle = '#fff';
                ctx.font = '13px Open Sans';
                ctx.textAlign = 'center';
                ctx.fillText('£' + this.kFormatter(value.toFixed(0)), labelX, labelY);
            }

            startAngle = endAngle;
        });

        // Redraw inner text
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(200, 200, 90, 0, 2 * Math.PI);
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

            const middleAngle = startAngle + angle / 2;
            const labelX = centerX + Math.cos(middleAngle) * (innerRadius + outerRadius) / 2;
            const labelY = centerY + 5 + Math.sin(middleAngle) * (innerRadius + outerRadius) / 2;
            ctx.fillStyle = '#fff';
            ctx.font = '13px Open Sans';
            ctx.textAlign = 'center';
            ctx.fillText('£' + this.kFormatter(value.toFixed(0)), labelX, labelY);

            startAngle = endAngle;
        });

        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#5d5d5d';
        ctx.font = '14px Open Sans';
        ctx.textAlign = 'center';
        ctx.fillText(this.title, centerX, centerY - 10);
        ctx.fillStyle = '#000';
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

  

    hexToRgba(hex, alpha) {
        let r = 0, g = 0, b = 0;
        if (hex.length === 4) {
            r = parseInt(hex[1] + hex[1], 16);
            g = parseInt(hex[2] + hex[2], 16);
            b = parseInt(hex[3] + hex[3], 16);
        } else if (hex.length === 7) {
            r = parseInt(hex[1] + hex[2], 16);
            g = parseInt(hex[3] + hex[4], 16);
            b = parseInt(hex[5] + hex[6], 16);
        }
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
}
