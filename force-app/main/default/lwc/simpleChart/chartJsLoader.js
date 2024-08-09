// chartJsLoader.js
import { loadScript } from 'lightning/platformResourceLoader';
import chartJs from '@salesforce/resourceUrl/chartJs';

let isChartJsInitialized = false;

const loadChartJs = (context) => {
    if (!isChartJsInitialized) {
        isChartJsInitialized = loadScript(context, chartJs)
            .then(() => {
                // Chart.js loaded successfully
                return window.Chart;
            })
            .catch(error => {
                console.error('Error loading Chart.js', error);
                throw error;
            });
    }
    return isChartJsInitialized;
};

export { loadChartJs };
