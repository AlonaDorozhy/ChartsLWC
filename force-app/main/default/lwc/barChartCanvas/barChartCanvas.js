import {
    LightningElement,
    api
} from 'lwc';

export default class BarChart extends LightningElement {
    @api isTestMode = false;
    @api chartType = 'horizontalBar';
    @api chartHeader = 'AAH Turnover sales';
    @api chartData = 17203.79;
    @api chartColors = '#B7312C';
    @api chartInfoText = 'Note: Fuel charges do not apply to AAH Hospital Services customers. You can find out more about fuel and low surcharges here ';
    @api chartInfoTextLink = '';
    @api lowSurcharge = 4000;
    @api fuelSurcharge = 7500;
    formatedValue;
    formatedChartData;
    targetNameLow = 'Low surcharge';
    targetNameFuel = 'Fuel surcharge';
    targetLines = [];
    canvas;
    ctx;
    targetsOverlap;

    renderedCallback() {
        this.formatedChartData = this.formatCurrency(Number(this.chartData), false, false);
        this.formatedValue = `£${this.formatedChartData}`;

        // Get the canvas element
        this.canvas = this.template.querySelector('canvas');
        this.ctx = this.canvas.getContext('2d');

        if (!this.canvas) return;

        this.drawChart(false);
        requestAnimationFrame(() => {
            // Add mouse event listener
            this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        });


    }

    drawChart(isHighlite = false) {
        const { canvas, ctx } = this
        const targetsHeight = 28;
        const chartBackground = 62;
        const rangeHeight = 20;

        // Data for the bar chart
        const data = Number(this.chartData);
        const minMaxVal = 10000;

        // Chart configuration
        const barHeight = 22;
        const chartWidth = 529; // Width of the bar
        // const maxValue = data * 1.4; // Maximum value for the data
        const maxValue = data < minMaxVal ? minMaxVal : data * 1.4; // Maximum value for the data

        // Set canvas dimensions
        canvas.width = chartWidth;
        canvas.height = targetsHeight + chartBackground + rangeHeight;
        
        // Draw the background
        ctx.fillStyle = '#E8F5FA';
        ctx.fillRect(0, targetsHeight, canvas.width, canvas.height - targetsHeight - rangeHeight);

        // Draw the bar
        const barWidth = (data / maxValue) * chartWidth;
        ctx.fillStyle = '#B7312C';
        ctx.fillRect(0, (canvas.height - (barHeight - targetsHeight + rangeHeight)) / 2, barWidth, barHeight);

        // Calculate positions and dimensions of the target boxes
        let lowSurchargeX = (this.lowSurcharge / maxValue) * chartWidth;
        let fuelSurchargeX = (this.fuelSurcharge / maxValue) * chartWidth;

        const lowSurchargeWidth = ctx.measureText(this.targetNameLow).width + 32;
        const fuelSurchargeWidth = ctx.measureText(this.targetNameFuel).width + 32;

        const minDistance = 5;

        const lowSurchargeBox = {
            x: lowSurchargeX < minDistance ? 6 : lowSurchargeX,
            xOverlap: lowSurchargeX - lowSurchargeWidth / 2,
            width: lowSurchargeWidth
        };

        const fuelSurchargeBox = {
            x: lowSurchargeX < minDistance && Math.abs(fuelSurchargeX - lowSurchargeX) < 9 ? 14 : fuelSurchargeX,
            xOverlap: fuelSurchargeX - fuelSurchargeWidth / 2,
            width: fuelSurchargeWidth
        };

        this.targetsOverlap = lowSurchargeBox.xOverlap < fuelSurchargeBox.xOverlap + fuelSurchargeBox.width &&
            lowSurchargeBox.xOverlap + lowSurchargeBox.width > fuelSurchargeBox.xOverlap;

        this.targetLines = [{
            x: lowSurchargeBox.x,
            targetValue: this.lowSurcharge,
            targetName: this.targetNameLow
        },
        {
            x: fuelSurchargeBox.x,
            targetValue: this.fuelSurcharge,
            targetName: this.targetNameFuel
        }
        ];

      // Draw the targets
        this.drawTargetPoint(this.targetNameLow, this.lowSurcharge, targetsHeight, isHighlite, lowSurchargeBox.x);
        this.drawTargetPoint(this.targetNameFuel, this.fuelSurcharge, targetsHeight, isHighlite, fuelSurchargeBox.x);

        // Draw the scale text
        this.drawScale(maxValue, targetsHeight, rangeHeight, chartBackground);
    }


    drawTargetPoint(targetName, targetValue, targetsHeight, isHighlite, xPosition) {

        if (!this.targetsOverlap || isHighlite) {
            this.drawTargetScale(xPosition, targetsHeight, targetValue);
            this.drawTargetLabel(targetName, xPosition, targetsHeight, isHighlite);
        }

        this.drawTargetLine(xPosition, targetsHeight, isHighlite);
    }


    drawTargetLine(xPosition, targetsHeight, isHighlite) {
        const { ctx } = this;
        const canvasHeight = this.canvas.height;
        const fillColor = '#1B9FD0';
        const moveToHeight = this.targetsOverlap && !isHighlite ? targetsHeight : targetsHeight - 8;

        ctx.strokeStyle = fillColor;
        ctx.lineWidth = 3;

        if (this.targetsOverlap && !isHighlite) {
            ctx.setLineDash([5, 5]); // Create dashed line
        } else {
            ctx.setLineDash([]); // Reset to solid line
        }

        ctx.beginPath();
        ctx.moveTo(xPosition, moveToHeight);
        ctx.lineTo(xPosition, canvasHeight - targetsHeight + 8);
        ctx.stroke();
    }

    drawTargetLabel(targetName, xPosition, targetsHeight, isHighlite) {
        const { ctx } = this;
        const fillColor = '#1B9FD0';
        const padding = 5;
        const borderRadius = 12;
        const fontSize = 12;
        const lineHeight = 18; // 150% of 12px font size

        ctx.font = 'normal 400 12px system-ui';
        ctx.letterSpacing = '0.5px'; // Set letter spacing
        ctx.textAlign = 'center';
        ctx.fillStyle = fillColor;

        // Calculate text width and box dimensions
        const textWidth = ctx.measureText(targetName).width;
        const rectWidth = textWidth + 2 * padding + 4;
        const rectHeight = lineHeight + padding;
        const rectX = xPosition - rectWidth / 2;
        const extraTopPadding = 8; // Add extra padding
        const rectY = targetsHeight - rectHeight - fontSize + extraTopPadding;

        // Adjust label position if it doesn't fit within chart boundaries
        const chartWidth = this.canvas.width; // Assuming you have the canvas width available
        const chartPadding = 10; // Padding from the chart edge to keep space

        let adjustedX = rectX;
        let textX = adjustedX + padding + 2;
        if (rectX < chartPadding) {
            // Label is too far left, reposition to the right of the target line
            adjustedX = xPosition - 5; // Add some offset
            textX = xPosition + rectWidth / 2 - 5;
        } else if (rectX + rectWidth > chartWidth - chartPadding) {
            // Label is too far right, reposition to the left of the target line
            adjustedX = xPosition - rectWidth - 10; // Subtract some offset
        } else if (isHighlite && rectX >= chartPadding) {
            textX = xPosition;
        } else {
            textX = xPosition;
        }

        // Redraw the rounded rectangle with adjusted position
        ctx.beginPath();
        ctx.moveTo(adjustedX + borderRadius, rectY);
        ctx.lineTo(adjustedX + rectWidth - borderRadius, rectY);
        ctx.quadraticCurveTo(adjustedX + rectWidth, rectY, adjustedX + rectWidth, rectY + borderRadius);
        ctx.lineTo(adjustedX + rectWidth, rectY + rectHeight - borderRadius);
        ctx.quadraticCurveTo(adjustedX + rectWidth, rectY + rectHeight, adjustedX + rectWidth - borderRadius, rectY + rectHeight);
        ctx.lineTo(adjustedX + borderRadius, rectY + rectHeight);
        ctx.quadraticCurveTo(adjustedX, rectY + rectHeight, adjustedX, rectY + rectHeight - borderRadius);
        ctx.lineTo(adjustedX, rectY + borderRadius);
        ctx.quadraticCurveTo(adjustedX, rectY, adjustedX + borderRadius, rectY);
        ctx.closePath();
        ctx.fill();

        // Draw the top label
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        const textYPosition = rectY + rectHeight - extraTopPadding;
        // ctx.fillText(targetName, adjustedX + padding + 2, textYPosition); // Adjust text position within the rectangle
        ctx.fillText(targetName, textX, textYPosition); // Adjust text position within the rectangle
    }

    drawTargetScale(xPosition, targetsHeight, targetValue) {
        const { ctx } = this;
        const canvasHeight = this.canvas.height;
        const chartPadding = 10; 
        // Draw the bottom label
        ctx.fillStyle = '#595959';
        ctx.font = '12px system-ui';
        ctx.textAlign = 'center';
        const targetValueText = this.formatCurrency(targetValue, true);
        const targetValueY = canvasHeight - targetsHeight + 26;

        const textWidth = ctx.measureText(`£${targetValueText}`).width;
        const rectWidth = textWidth + 2;
    
        const rectX = xPosition - rectWidth / 2;
        let textX = rectX + 2;

        if (rectX < chartPadding) {
            // Label is too far left, reposition to the right of the target line
            textX = xPosition + rectWidth / 2 - 5;
        } else{
            textX = xPosition;
        }

        ctx.fillText(`£${targetValueText}`, textX, targetValueY);

        // Draw the connecting line from the center of the number to the target line
        ctx.strokeStyle = '#595959';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(xPosition, targetValueY - 18); // Starting point (center of the number)
        ctx.lineTo(xPosition, targetValueY - 12); // End point (6px above the starting point)
        ctx.stroke();
    }

    drawScale(maxValue, targetsHeight, rangeHeight, chartBackground) {
        const { ctx } = this;
        const numberOfSteps = 5; // We want 4 steps plus the 0 scale

        // Helper function to round to the nearest significant value
        const roundToNearestSignificant = (value) => {
            const exponent = Math.floor(Math.log10(value));
            const base = 10 ** exponent;
            return Math.round(value / base) * base;
        };

        const step = roundToNearestSignificant(maxValue / numberOfSteps);
        ctx.fillStyle = '#595959';
        ctx.font = '12px system-ui';
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#595959';
        ctx.lineWidth = 3;

        // Draw the 0 scale value and line
        const drawScaleLine = (xPosition) => {
            ctx.beginPath();
            ctx.moveTo(xPosition, targetsHeight + chartBackground);
            ctx.lineTo(xPosition, this.canvas.height - targetsHeight + rangeHeight - 6);
            ctx.stroke();
        };

        // Draw 0 line
        drawScaleLine(3);

        for (let i = 1; i <= numberOfSteps; i++) {
            const value = step * i;
            const scaleValue = this.formatCurrency(value, true);
            const xPosition = (value / maxValue) * this.canvas.width;

            // Draw the scale value text and line
            if (i !== numberOfSteps) {
                ctx.fillText(`£${scaleValue}`, xPosition, this.canvas.height - targetsHeight + rangeHeight + 6);
                drawScaleLine(xPosition);
            } else {
                const position = this.canvas.width;
                drawScaleLine(position - 3);
            }
        }
    }


    handleMouseMove(event) {
        if (!this.targetsOverlap) return;

        const rect = this.canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        const targetLineYStart = 22; // Adjust based on your specific target line vertical position
        const targetLineYEnd = this.canvas.height - 28; // Adjust based on your specific target line vertical position

        let isMouseOverTarget = false;

        // Redraw the chart to clear previous drawings
        this.drawChart(false);

        // Check if mouse is over any target line and draw text box
        for (const line of this.targetLines) {
            if (Math.abs(mouseX - line.x) < 3 && mouseY >= targetLineYStart && mouseY <= targetLineYEnd) {
                isMouseOverTarget = true;
                this.drawTargetPoint(line.targetName, line.targetValue, 28, true, line.x);
            }
        }

        // If the mouse is not over any target line, redraw the chart without highlighting
        if (!isMouseOverTarget) {
            this.drawChart(false);
        }
    }

    formatCurrency(amount, useAbbreviations = false, noDecimals = false) {
        let formattedAmount;

        if (useAbbreviations) {
            if (amount > 999999) {
                formattedAmount = Math.floor(amount / 1000000) + 'M';
            } else if (amount >= 1000) {
                formattedAmount = Math.floor(amount / 1000) + 'K';
            } else {
                formattedAmount = Math.floor(amount).toString();
            }
        } else {
            if (noDecimals) {
                formattedAmount = Math.floor(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            } else {
                formattedAmount = amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            }
        }

        return formattedAmount;
    }

    onblur(event) {
        const canvas = this.template.querySelector('canvas');
        const ctx = canvas.getContext('2d');
        const data = parseFloat(event.target.value.replace(/,/g, ''))
        this.chartData = data.toString();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        this.drawChart();
    }
}