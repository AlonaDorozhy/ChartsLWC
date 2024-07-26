
const chartColors = ['#B7312C', '#D40069', '#007AA3', '#003B6A', '#96C7C4', '#F2A900', '#547487', '#547487', '#5CB8B2', '#803C6E', '#29873C', '#949494', '#BC3927']
const chartData = [30, 50, 26, 13, 1.7, 1.6, 2.9, 1, 9, 3.9];
const chartLabels = ['Agency', 'Ethicals ', 'Parallel imports', 'Generics', 'Pharmacy medicines', 'Health & beauty', 'GSL medicines', 'Surgicals/Healthcare', 'Zds'];

import { LightningElement, api } from 'lwc';
import { loadScript } from 'lightning/platformResourceLoader';
import ChartJs from '@salesforce/resourceUrl/chartJs';
import ChartjsPluginDatalabels from '@salesforce/resourceUrl/ChartjsPluginDatalabels';

export default class DoughnutChart extends LightningElement {
    chart;
    totalAmount;
    chartInitialized = false;
    backgroundColors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FFCE56'];
    chartData = [
        { label: 'Red', value: 12 },
        { label: 'Blue', value: 19 },
        { label: 'Yellow', value: 3 },
        { label: 'Green', value: 5 },
        { label: 'Purple', value: 2 },
        { label: 'Yellow small', value: 1 }
    ];

    renderedCallback() {
        if (this.chartInitialized) {
            return;
        }
        this.chartInitialized = true;

        Promise.all([
            loadScript(this, ChartJs),

        ])
            .then(() => {
                Promise.all([

                    loadScript(this, ChartjsPluginDatalabels)
                ]).then(() => {
                    window.Chart.register(window.ChartDataLabels);
                    this.initializeChart();
                })

            })
            .catch(error => {
                console.error("Error loading ChartJS or plugin", error);
            });
    }
    initializeChart() {
        const ctx = this.template.querySelector('canvas').getContext('2d');
        const data = this.chartData.map(item => item.value);
        const labels = this.chartData.map(item => item.label);
        const backgroundColors = this.backgroundColors;
        this.totalAmount = data.reduce((a, b) => a + b, 0);

        this.chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                datasets: [{
                    data: data,
                    backgroundColor: backgroundColors,
                    hoverBackgroundColor: backgroundColors,
                    hoverBorderColor: backgroundColors,
                    borderOffset: 0,
                    borderWidth: 0,
                    // borderAlign: 'inner',
                    borderColor: 'transparent',
                    hoverOffset: 10,
                    hoverBorderWidth: 15,
                }],
                labels: labels
            },
            options: {
                plugins: {
                    legend: {
                        display: true,
                        position: 'right',
                        onClick: (evt, item, legend) => {
                            alert(`Clicked on legend item: ${item.text}`);
                        },
                        labels: {
                            usePointStyle: true,
                            generateLabels: (chart) => {
                                const original = Chart.overrides.doughnut.plugins.legend.labels.generateLabels;
                                const labelsOriginal = original.call(this, chart);
                              
                                labelsOriginal.forEach(label => {
                                    label.cursor = 'pointer';

                                });
                                return labelsOriginal;
                            }
                        },
                        onHover: (event, legendItem, legend) => {
                            const chart = legend.chart;
                            const index = legendItem.index;
                            const segment = chart.getDatasetMeta(0).data[index];
                            segment.outerRadius += segment.outerRadius * 0.1; //  radius +  10%
                            chart.update();
                        },
                    },
                    datalabels: {
                        color: (context) => {
                            const bgColor = context.dataset.backgroundColor[context.dataIndex];
                            if (bgColor === '#FFCE56' || bgColor === '#9966FF') {
                                return 'black';
                            }
                            return 'white';
                        },
                        display: (context) => {
                            // Display label only if the segment is large enough more than 5%
                            const dataset = context.dataset;
                            const index = context.dataIndex;
                            const value = dataset.data[index];
                            const total = dataset.data.reduce((sum, val) => sum + val, 0);
                            const percentage = (value / total) * 100;

                            return percentage > 5;
                        },
                        // display: true,
                        font: {
                            weight: 'bold'
                        },
                        formatter: (value, ctx) => {
                            let sum = 0;
                            let dataArr = ctx.chart.data.datasets[0].data;
                            dataArr.map(data => {
                                sum += data;
                            });
                            let percentage = (value * 100 / sum).toFixed(2) + "%";
                            return percentage;
                        }
                    }
                },
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    animateScale: true,
                    animateRotate: true
                },
                hover: {
                    onHover: (event, activeElements) => {
                
                        if (activeElements.length) {
                            const chart = activeElements[0].chart;
                            const index = activeElements[0].index;
                            const segment = chart.getDatasetMeta(0).data[index];
                            segment.outerRadius += segment.outerRadius * 0.1; // Increase radius by 10%
                            chart.update();
                        }
                    },
                },
            }
        });
        this.createCustomLegend();
    }
    createCustomLegend() {
        const legendContainer = this.template.querySelector('.legend');
        const legendHtml = this.chart.data.labels.map((label, index) => {
            const color = this.chart.data.datasets[0].backgroundColor[index];
            return `
                <div class="legend-item">
                    <span class="legend-color" style="background-color: ${color};"></span>
                    <span class="legend-label">${label}</span>
                </div>
            `;
        }).join('');

        legendContainer.innerHTML = legendHtml;
    }

}