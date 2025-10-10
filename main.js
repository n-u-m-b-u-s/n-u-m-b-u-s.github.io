// Tauri detection - only use if available
const isTauri = typeof window.__TAURI__ !== 'undefined';
const invoke = isTauri ? window.__TAURI__.core.invoke : null;

import FileProcessor from './util/fileProcessor.js'
import UI from './ui/ui.js'


class App {
    constructor() {
        this.fileProcessor = new FileProcessor();
        this.ui = new UI();
    }

    async initialize() {
        try {
            await this.fileProcessor.initialize();
            this.ui.initialize();
            this.ui.setStoreFile(this.handleFile.bind(this)); //set UI.storeFile to App.storeFile, make sure this still refers to App when calling from UI
            this.ui.setLoadTemplate(this.loadTemplate.bind(this)); //set UI.loadTemplate to App.loadTemplate
            this.ui.setLoadCSV(this.loadCSV.bind(this)); //set UI.loadCSV to App.loadCSV

            // Pre-load xy.json template
            await this.loadTemplate('/templates/xy.json');

            // Load test data
            await this.loadCSV('/data/test.csv');

            // Set initial zoom to 70% and center AFTER everything is loaded
            this.ui.currentZoom = 0.7;
            // Wait for layout to stabilize before centering
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    this.ui.zoom(0);
                });
            });

            console.log('App initialization sucess');
        } catch (error) {
            console.error('App initialization failed:', error);
        }
    }

    async loadTemplate(path) {
        try {
            const response = await fetch(path);
            const template = await response.json();
            this.ui.svg.curTemplate = template;
            this.ui.svg.renderTemplate();
            console.log('Template loaded:', path);
        } catch (error) {
            console.error('Failed to load template:', error);
        }
    }

    async loadCSV(path) {
        try {
            const response = await fetch(path);
            const text = await response.text();
            const blob = new Blob([text], { type: 'text/csv' });
            const file = new File([blob], path.split('/').pop(), { type: 'text/csv' });
            await this.handleFile(file);
        } catch (error) {
            console.error('Failed to load CSV:', error);
        }
    }

    
    async handleFile(file) {
        try {
            const fileId = await this.fileProcessor.storeFile(file);
            const result = await this.fileProcessor.parseFile(fileId);

            switch (result.type) {
                case 'json':
                    this.ui.svg.curTemplate = JSON.parse(result.content);
                    this.ui.svg.renderTemplate();
                    this.ui.svg.dataRenderer.renderData();
                    break;
                case 'csv':
                    console.log('CSV result:', result);
                    let content = result.content;

                    // Handle Map object from serde-wasm-bindgen
                    if (content instanceof Map) {
                        const headers = content.get('headers');
                        const cols = content.get('cols');

                        if (cols && cols.length >= 2) {
                            // Update chart title with data info
                            const titleElement = document.getElementById('chart-title');
                            if (titleElement && headers) {
                                const yColumns = headers.slice(1).join(', ');
                                titleElement.textContent = `${headers[0]} vs ${yColumns}`;
                            }

                            // Pass all data to renderer
                            this.ui.svg.dataRenderer.setData(cols, headers);
                            this.ui.svg.dataRenderer.renderData();
                            console.log('CSV data loaded successfully');
                        } else {
                            console.error('CSV needs at least 2 columns');
                        }
                    } else {
                        console.error('Unexpected CSV content format:', content);
                    }
                    break;
            }

            if (result.valid && (result.type === "json")) {
            }
        } catch (error) {
            console.error('File processing failed:', error);
            this.ui.displayError(error);
        }
    }
}

const app = new App();
app.initialize().catch(console.error);
