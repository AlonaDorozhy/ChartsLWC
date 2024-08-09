import { LightningElement, api, track } from 'lwc';

export default class GenericLineChart extends LightningElement {
    // @api chartData = [100, 150, 620, 130, 140, 480, 180, 0, 140, 470, 110, 100];
    @api chartData = [635, 420, 55, 200, 520, 250, 0, 15,490, 47, 250, 215];
    @api chartBackgroundColor = 'rgba(0, 53, 186, 0.08)';
    @api chartBorderColor = '#0036ba';
    @api chartBorderWidth = 2;
    @api chartLineWidth = 2;
    @api chartLabels = ['September 2022', 'October 2022', 'November 2022', 'December 2022', 'January 2023', 'February 2023', 'March 2023', 'April 2023', 'May 2023', 'June 2023', 'July 2023', 'August 2023'];
    @api chartBackground = '#E8F5FA';
    @api chartHeader = 'Enterprise total volume'
    @api chartSubHeader = 'Sum of Enterprise Total Volume'

    @track totalVolume = 0;
    canvas;
    labels;
    data;
    ctx;
    gridColor = '#ecf0f4';
    textColorLight = '#706e6c';
    textColorDark = '#080707';

    renderedCallback() {
        this.canvas = this.template.querySelector('canvas.chart');
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.data = this.chartData;
        this.labels = this.chartLabels;

        this.drawLineChart();
    }

    drawLineChart() {
        const {
            ctx,
            canvas,
            labels,
            data
        } = this;

        // Calculate total volume
        const dataSum = data.reduce((acc, val) => acc + val, 0);
        this.totalVolume = this.formatNumberWithCommas(dataSum)

        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const padding = 85; // Increased left padding for the vertical text
        const bottomPadding = 95; // Increased bottom padding for x-axis labels
        const chartWidth = canvas.width - padding - 10;
        const chartHeight = canvas.height - bottomPadding - 26;
        const maxDataValue = Math.max(...data);
        ctx.textAlign = 'right';
        const step = this.stepNumber(maxDataValue / 4);
        const xStep = chartWidth / (data.length - 1);
        const yStep = chartHeight / (step * 4);

        // Draw y-axis grid lines and labels
        for (let i = 0; i <= step * 4; i += step) {
            const y = canvas.height - bottomPadding - i * yStep;
            const label = this.formatNumberToShortForm(i);
            ctx.fillText(label, padding - 26, y);
            ctx.beginPath();
            ctx.moveTo(padding - 20, y);
            ctx.lineTo(canvas.width, y); //right
            ctx.strokeStyle = this.gridColor;
            ctx.fillStyle = this.textColorLight;
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        // Draw the x-axis labels at an angle
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.font = '12px system-ui';
        ctx.letterSpacing = '0.5px';
        labels.forEach((label, index) => {
            const x = padding + index * xStep;
            const y = canvas.height - bottomPadding + 20; // Adjust position for increased padding
  
            ctx.fillStyle = this.textColorDark;
            ctx.font = 'normal 600 12px system-ui';

            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(-Math.PI / 4); // Rotate 45 degrees counterclockwise
            ctx.fillText(label, 0, 0);
            ctx.restore();
        });

        // Draw the line
        ctx.beginPath();
        ctx.moveTo(padding, canvas.height - bottomPadding - data[0] * yStep - 2); 

        data.forEach((point, index) => {
            const x = padding + index * xStep;
            const y = canvas.height - bottomPadding - point * yStep;
            ctx.lineTo(x, y - 2);
        });

        ctx.strokeStyle = this.chartBorderColor;
        ctx.lineWidth = this.chartLineWidth;
        ctx.stroke();


        // Draw the area under the line
        ctx.lineTo(canvas.width - 10, canvas.height - bottomPadding); 
        ctx.lineTo(padding, canvas.height - bottomPadding);
        ctx.closePath();
        ctx.fillStyle = this.chartBackgroundColor;
        ctx.fill();

        ctx.fillStyle = this.textColorLight; //zero style

        // Draw vertical text on the left side of the chart
        ctx.save();
        ctx.translate(5, bottomPadding + 25); // Adjusted position for extra left padding
        ctx.rotate(-Math.PI / 2); // Rotate 90 degrees counterclockwise
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillStyle = this.textColorDark;
        ctx.font = 'normal 600 13px system-ui';
        ctx.letterSpacing = '0.3px';
        ctx.fillText(this.chartSubHeader, 0, 0);
        ctx.restore();
    }

    stepNumber(number) {
        if (number < 1000) {
            return Math.ceil(number / 100) * 100;
        } else if (number < 10000) {
            return Math.ceil(number / 1000) * 1000;
        } else if (number < 100000) {
            return Math.ceil(number / 5000) * 5000;
        } else {
            return Math.ceil(number / 10000) * 10000;
        }
    }

     formatNumberToShortForm(number) {
        let result;
        if (number >= 1_000_000) {
            result = (number / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
        } else if (number >= 1_000) {
            result = (number / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
        } else {
            result = number.toString();
        }
        return result;
    }
   
    formatNumberWithCommas(number) {
        const parts = number.toString().split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        return parts[1] && parseInt(parts[1], 10) !== 0 ? parts.join('.') : parts[0];
    }

}
