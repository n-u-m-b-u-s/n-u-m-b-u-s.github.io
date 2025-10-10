
import SVG from './svg.js'


class UI {
    constructor() {
        // create ui 
        this.svg = new SVG(); // does svg chart rendering
        //this.canvas = new Canvas(); // does canvas data rendering (i.e. showing csv data)
        
        this.elements = {};
        this.storeFile = null;

        //viewport stuff
        this.isPanning = false;
        this.startPan = { x: 0, y: 0 };
        this.currentPan = { x: 0, y: 0 };
        this.panBoundaryPercent = 0.7;

        //zoom stuff
        this.currentZoom = 1.0;
        this.minZoom = 0.1;
        this.maxZoom = 5.0;
        this.zoomStep = 0.1;

    }

    initialize() {
        this.elements = {
            results: document.getElementById('results'),
            svgContainer: document.getElementById('svgContainer'),
            viewport: document.getElementById('viewport'),
            zoomLevel: document.getElementById('zoomLevel'),
            graphTypeMenu: document.getElementById('graphTypeMenu'),
            dataSelectMenu: document.getElementById('dataSelectMenu'),
            colorPickerMenu: document.getElementById('colorPickerMenu'),
            axisSettingsMenu: document.getElementById('axisSettingsMenu'),
            fileInput: document.getElementById('fileInput'),
            tool0: document.getElementById('tool-0'),
            tool1: document.getElementById('tool-1'),
            tool2: document.getElementById('tool-2'),
            tool3: document.getElementById('tool-3'),
            tool4: document.getElementById('tool-4'),
            tool5: document.getElementById('tool-5'),
            toolCenter: document.getElementById('tool-center'),
            toolAbout: document.getElementById('tool-about'),
            aboutModal: document.getElementById('aboutModal')
        };

        this.attachEventListeners();
        this.attachViewControls();
        console.log("UI initialized");
    }

    attachEventListeners() {
        this.svg.attachEventListeners();
        //this.canvas.attachEventListeners();

        const { zoomLevel, graphTypeMenu, dataSelectMenu, colorPickerMenu, axisSettingsMenu, tool0, tool1, tool3, tool4, tool5, toolAbout, aboutModal } = this.elements;

        // tool click
        const tools = document.querySelectorAll('.tool');
        tools.forEach((tool,index) => {
            tool.addEventListener('click', () => {
                this.handleToolClick(index);
            });
        });

        // zoom % button - reset to 100%
        zoomLevel.addEventListener('click', () => {
            this.currentPan = { x: 0, y:0 };
            this.currentZoom = 1.0;
            this.zoom(0.0);
        });

        // center button - center chart at current zoom
        const { toolCenter } = this.elements;
        toolCenter.addEventListener('click', () => {
            this.zoom(0);
        });

        // Graph type menu items
        graphTypeMenu.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const template = e.target.dataset.template;
                if (template && this.loadTemplate) {
                    this.loadTemplate(template);
                }
                graphTypeMenu.style.display = 'none';
            });
        });

        // Data select menu items
        dataSelectMenu.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', async (e) => {
                const file = e.target.dataset.file;
                if (file && this.loadCSV) {
                    await this.loadCSV(file);
                }
                dataSelectMenu.style.display = 'none';
            });
        });

        // File upload
        const { fileInput } = this.elements;
        if (fileInput) {
            fileInput.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (file && this.storeFile) {
                    await this.storeFile(file);
                    fileInput.value = ''; // Reset for next upload
                }
            });
        }

        // Color picker menu interaction
        this.currentColorIndex = 0;

        // About button and modal
        toolAbout.addEventListener('click', () => {
            aboutModal.classList.add('show');
        });

        const closeModal = aboutModal.querySelector('.modal-close');
        closeModal.addEventListener('click', () => {
            aboutModal.classList.remove('show');
        });

        aboutModal.addEventListener('click', (e) => {
            if (e.target === aboutModal) {
                aboutModal.classList.remove('show');
            }
        });

        // Hide menus when clicking outside
        document.addEventListener('click', (e) => {
            if (!graphTypeMenu.contains(e.target) && e.target !== tool0) {
                graphTypeMenu.style.display = 'none';
            }
            if (!dataSelectMenu.contains(e.target) && e.target !== tool1) {
                dataSelectMenu.style.display = 'none';
            }
            if (!colorPickerMenu.contains(e.target) && e.target !== tool4) {
                colorPickerMenu.style.display = 'none';
            }
            if (!axisSettingsMenu.contains(e.target) && e.target !== tool5) {
                axisSettingsMenu.style.display = 'none';
            }
        });

        // Auto-apply settings on change
        document.querySelectorAll('.auto-apply').forEach(input => {
            input.addEventListener('change', () => {
                this.applyAxisSettings();
            });
            input.addEventListener('input', (e) => {
                // For number inputs, debounce the input
                if (e.target.type === 'number') {
                    clearTimeout(this.axisDebounce);
                    this.axisDebounce = setTimeout(() => {
                        this.applyAxisSettings();
                    }, 500);
                }
            });
        });



    }

    attachViewControls() {
        const { viewport } = this.elements;
        viewport.style.cursor = 'default';

        // reset position to {x: 0,y: 0} on key press
        window.addEventListener('keydown', (e) => {
            if (e.key === 'r') {
                console.log('r pressed');
                this.currentPan = { x: 0, y:0 };
            }
            this.updatePan();
        });
        
        viewport.addEventListener('mousedown', (e) => {
            if (e.button === 1) {
                e.preventDefault();
                this.isPanning = true;
                this.startPan = {
                    x: e.clientX - this.currentPan.x,
                    y: e.clientY - this.currentPan.y
                };
                viewport.style.cursor = 'grabbing';
            }
        });

        viewport.addEventListener('mousemove', (e) => {
            if (this.isPanning) {
                this.currentPan = {
                    x: e.clientX - this.startPan.x,
                    y: e.clientY - this.startPan.y
                };
                this.updatePan();
            }
        });

        viewport.addEventListener('mouseup', (e) => {
            if (e.button === 1) {
                this.isPanning = false;
                viewport.style.cursor = 'default';
            }
        });

        viewport.addEventListener('wheel', (e) => {
            const isTrackpad = Math.abs(e.deltaY) < 50 || e.deltaMode === 0;

            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();


                const delta = -e.deltaY * 0.01;
                this.zoom(delta);

            } else if (isTrackpad) {
                e.preventDefault();

                this.currentPan.x -= e.deltaX;
                this.currentPan.y -= e.deltaY;
                this.updatePan();
            }
        }, { passive: false });

        // Touch support for mobile
        let touchStartX = 0;
        let touchStartY = 0;
        let touchStartDistance = 0;
        let wasPinching = false;

        viewport.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                // Single touch - only enable panning if not transitioning from pinch
                if (!wasPinching) {
                    this.isPanning = true;
                    touchStartX = e.touches[0].clientX - this.currentPan.x;
                    touchStartY = e.touches[0].clientY - this.currentPan.y;
                }
            } else if (e.touches.length === 2) {
                // Two finger touch - zooming
                this.isPanning = false;
                wasPinching = true;
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                touchStartDistance = Math.sqrt(dx * dx + dy * dy);
            }
        }, { passive: true });

        viewport.addEventListener('touchmove', (e) => {
            if (e.touches.length === 1 && this.isPanning && !wasPinching) {
                e.preventDefault();
                this.currentPan = {
                    x: e.touches[0].clientX - touchStartX,
                    y: e.touches[0].clientY - touchStartY
                };
                this.updatePan();
            } else if (e.touches.length === 2) {
                e.preventDefault();
                wasPinching = true;
                this.isPanning = false;

                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (touchStartDistance > 0) {
                    const scale = distance / touchStartDistance;
                    const delta = (scale - 1) * 0.5;
                    this.zoom(delta);
                    touchStartDistance = distance;
                }
            }
        }, { passive: false });

        viewport.addEventListener('touchend', (e) => {
            if (e.touches.length === 0) {
                // All fingers lifted - reset state
                this.isPanning = false;
                wasPinching = false;
                touchStartDistance = 0;
            } else if (e.touches.length === 1 && wasPinching) {
                // Went from 2 fingers to 1 - reset for potential new pan gesture
                wasPinching = false;
                touchStartDistance = 0;
                // Update touch start position for smooth transition if user wants to pan
                touchStartX = e.touches[0].clientX - this.currentPan.x;
                touchStartY = e.touches[0].clientY - this.currentPan.y;
                this.isPanning = true;
            }
        }, { passive: true });
    }

    zoom(delta) {
        this.svg.clearSelectedElement();
        const { viewport, svgContainer, zoomLevel } = this.elements;
        const svg = svgContainer.querySelector('svg');

        if (!svg) return;

        // Get the SVG's natural dimensions from viewBox
        const viewBox = svg.viewBox.baseVal;
        const svgWidth = viewBox.width;
        const svgHeight = viewBox.height;

        // Get viewport center - use actual client dimensions
        const viewportRect = viewport.getBoundingClientRect();
        const viewportCenterX = viewportRect.width / 2;
        const viewportCenterY = viewportRect.height / 2;

        // If delta is 0, always center the SVG (used on initial load)
        if (delta === 0) {
            // Center the SVG in the viewport
            this.currentPan.x = viewportCenterX - (svgWidth * this.currentZoom) / 2;
            this.currentPan.y = viewportCenterY - (svgHeight * this.currentZoom) / 2;
        } else {
            // Calculate what point in SVG coordinates is at viewport center BEFORE zoom
            const svgPointX = (viewportCenterX - this.currentPan.x) / this.currentZoom;
            const svgPointY = (viewportCenterY - this.currentPan.y) / this.currentZoom;

            // Normalize to 0.0 - 1.0
            const normalizedX = svgPointX / svgWidth;
            const normalizedY = svgPointY / svgHeight;

            // Apply zoom
            const oldZoom = this.currentZoom;
            this.currentZoom *= (1 + delta);
            this.currentZoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.currentZoom));

            // Convert normalized back to new scaled coordinates
            const newSvgPointX = normalizedX * svgWidth;
            const newSvgPointY = normalizedY * svgHeight;

            // Translate so this point appears at viewport center
            this.currentPan.x = viewportCenterX - (newSvgPointX * this.currentZoom);
            this.currentPan.y = viewportCenterY - (newSvgPointY * this.currentZoom);
        }

        svgContainer.style.transform = `translate(${this.currentPan.x}px, ${this.currentPan.y}px) scale(${this.currentZoom})`;

        if (zoomLevel) {
            zoomLevel.textContent = `${Math.round(this.currentZoom * 100)}%`;
        }
    }

    updatePan() {
        this.svg.clearSelectedElement();

        const { viewport, svgContainer } = this.elements;
        const svg = svgContainer.querySelector('svg');

        const svgRect = svg.getBoundingClientRect();
        const viewportRect = viewport.getBoundingClientRect();
        
        const leftBound = (viewportRect.left + viewportRect.width * 0.1);
        const rightBound = (viewportRect.right - viewportRect.width * 0.1);
        const topBound = (viewportRect.top + viewportRect.height * 0.1);
        const bottomBound = (viewportRect.bottom - viewportRect.height * 0.1);

        // Calculate min/max allowed pan values
        const maxPanX = rightBound;  // Can't pan further right than this
        const minPanX = leftBound - svgRect.width;  // Can't pan further left than this
        
        const maxPanY = bottomBound;  // Can't pan further down than this
        const minPanY = topBound - svgRect.height;  // Can't pan further up than this

        // Clamp the pan values
        this.currentPan.x = Math.max(minPanX, Math.min(maxPanX, this.currentPan.x));
        this.currentPan.y = Math.max(minPanY, Math.min(maxPanY, this.currentPan.y));

        svgContainer.style.transform = `translate(${this.currentPan.x}px, ${this.currentPan.y}px) scale(${this.currentZoom})`;
    }




    handleToolClick(toolIndex) {
        console.log(`Tool ${toolIndex} clicked`);

        const { graphTypeMenu, dataSelectMenu, colorPickerMenu, axisSettingsMenu, tool0, tool1, tool3, tool4, tool5, svgContainer } = this.elements;

        switch(toolIndex) {
            case 0:
                // Graph type selection
                dataSelectMenu.style.display = 'none';
                colorPickerMenu.style.display = 'none';
                const isVisible0 = graphTypeMenu.style.display === 'block';
                graphTypeMenu.style.display = isVisible0 ? 'none' : 'block';

                if (!isVisible0) {
                    const rect = tool0.getBoundingClientRect();
                    graphTypeMenu.style.top = `${rect.bottom + 5}px`;
                    graphTypeMenu.style.left = `${rect.left}px`;
                }
                break;
            case 1:
                // Data selection
                graphTypeMenu.style.display = 'none';
                colorPickerMenu.style.display = 'none';
                const isVisible1 = dataSelectMenu.style.display === 'block';
                dataSelectMenu.style.display = isVisible1 ? 'none' : 'block';

                if (!isVisible1) {
                    const rect = tool1.getBoundingClientRect();
                    dataSelectMenu.style.top = `${rect.bottom + 5}px`;
                    dataSelectMenu.style.left = `${rect.left}px`;
                }
                break;
            case 2:
                // Upload file
                const { fileInput } = this.elements;
                if (fileInput) {
                    fileInput.click();
                }
                break;
            case 3:
                // Screenshot - save canvas as PNG to clipboard
                this.takeScreenshot();
                break;
            case 4:
                // Color picker
                graphTypeMenu.style.display = 'none';
                dataSelectMenu.style.display = 'none';
                const isVisible4 = colorPickerMenu.style.display === 'block';
                colorPickerMenu.style.display = isVisible4 ? 'none' : 'block';

                if (!isVisible4) {
                    this.populateColorPicker();
                    const rect = tool4.getBoundingClientRect();
                    colorPickerMenu.style.top = `${rect.bottom + 5}px`;
                    colorPickerMenu.style.left = `${rect.left}px`;
                }
                break;
            case 5:
                // Axis settings
                graphTypeMenu.style.display = 'none';
                dataSelectMenu.style.display = 'none';
                colorPickerMenu.style.display = 'none';
                const isVisible5 = axisSettingsMenu.style.display === 'block';
                axisSettingsMenu.style.display = isVisible5 ? 'none' : 'block';

                if (!isVisible5) {
                    this.populateAxisSettings();
                    const rect = tool5.getBoundingClientRect();
                    axisSettingsMenu.style.top = `${rect.bottom + 5}px`;
                    axisSettingsMenu.style.left = `${rect.left}px`;
                }
                break;
        }

    }

    showNotification(message, type = 'info') {
        const notification = document.getElementById('notification');

        // Clear previous timeout if exists
        if (this.notificationTimeout) {
            clearTimeout(this.notificationTimeout);
        }

        // Remove all type classes
        notification.classList.remove('show', 'hide', 'success', 'error', 'info');

        // Set message and type
        notification.textContent = message;

        // Add appropriate type class
        if (type === 'error' || type === true) {
            notification.classList.add('error');
        } else if (type === 'success') {
            notification.classList.add('success');
        } else {
            notification.classList.add('info');
        }

        // Trigger reflow to restart animation
        void notification.offsetWidth;

        // Show with animation
        notification.classList.add('show');

        // Auto-hide after 3 seconds
        this.notificationTimeout = setTimeout(() => {
            notification.classList.remove('show');
            notification.classList.add('hide');
        }, 3000);
    }

    async takeScreenshot() {
        const svg = this.elements.svgContainer.querySelector('svg');
        if (!svg) {
            this.showNotification('No chart to screenshot', 'error');
            return;
        }

        // Check if running in Tauri
        const isTauri = typeof window.__TAURI__ !== 'undefined';

        try {
            // Serialize SVG to string
            const serializer = new XMLSerializer();
            const svgString = serializer.serializeToString(svg);
            const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(svgBlob);

            // Create image and canvas
            const img = new Image();

            // Use promise to maintain user gesture context
            const imageLoaded = new Promise((resolve, reject) => {
                img.onload = () => resolve();
                img.onerror = () => reject(new Error('Failed to load image'));
            });

            img.src = url;
            await imageLoaded;

            const canvas = document.createElement('canvas');
            const width = svg.viewBox.baseVal.width;
            const height = svg.viewBox.baseVal.height;
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            URL.revokeObjectURL(url);

            if (isTauri) {
                // Get RGBA pixel data
                const imageData = ctx.getImageData(0, 0, width, height);
                const rgbaBytes = Array.from(imageData.data);

                // Use Tauri's clipboard plugin with RGBA data
                const { writeImage } = window.__TAURI__.clipboardManager;
                await writeImage({
                    rgba: rgbaBytes,
                    width: width,
                    height: height
                });

                this.showNotification('✓ Chart copied to clipboard!', 'success');
            } else {
                // Web - convert to blob
                const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));

                // Check if Clipboard API is available
                if (navigator.clipboard && window.ClipboardItem) {
                    try {
                        const item = new ClipboardItem({ 'image/png': blob });
                        await navigator.clipboard.write([item]);
                        this.showNotification('✓ Chart copied to clipboard!', 'success');
                        return;
                    } catch (err) {
                        console.error('Clipboard write failed:', err);
                        // Fall through to download
                    }
                }

                // Fallback: download image
                const downloadUrl = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = downloadUrl;
                a.download = `numbus-chart-${Date.now()}.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(downloadUrl);
                this.showNotification('✓ Chart downloaded!', 'success');
            }
        } catch (err) {
            this.showNotification('Screenshot failed', 'error');
            console.error('Screenshot error:', err);
        }
    }

    populateColorPicker() {
        const colorOptions = document.getElementById('colorOptions');
        const colors = this.svg.dataRenderer.colors;

        colorOptions.innerHTML = '';
        colors.forEach((color, idx) => {
            const colorDiv = document.createElement('div');
            colorDiv.style.cssText = `
                display: flex;
                align-items: center;
                gap: 10px;
                margin-bottom: 10px;
            `;

            const label = document.createElement('span');
            label.textContent = `Series ${idx + 1}:`;
            label.style.cssText = 'color: #f0f0f0; font-size: 14px;';

            const colorInput = document.createElement('input');
            colorInput.type = 'color';
            colorInput.value = color;
            colorInput.style.cssText = 'cursor: pointer; width: 40px; height: 30px;';
            colorInput.addEventListener('change', (e) => {
                this.svg.dataRenderer.colors[idx] = e.target.value;
                this.svg.dataRenderer.renderData();
            });

            colorDiv.appendChild(label);
            colorDiv.appendChild(colorInput);
            colorOptions.appendChild(colorDiv);
        });
    }

    setStoreFile(callback) {
        this.storeFile = callback;
    }

    setLoadTemplate(callback) {
        this.loadTemplate = callback;
    }

    setLoadCSV(callback) {
        this.loadCSV = callback;
    }

    displayError(error) {
        console.error('UI Error:', error);
    }

    populateAxisSettings() {
        const config = this.svg.dataRenderer.axisConfig;

        // Populate with current values
        document.getElementById('xScale').value = config.xScale;

        document.getElementById('xMin').value = config.xMin !== null ? config.xMin : '';
        document.getElementById('xMax').value = config.xMax !== null ? config.xMax : '';
        document.getElementById('yMin').value = config.yMin !== null ? config.yMin : '';
        document.getElementById('yMax').value = config.yMax !== null ? config.yMax : '';

        document.getElementById('gridEnabled').checked = config.gridEnabled;
        document.getElementById('ticksEnabled').checked = config.ticksEnabled;
        document.getElementById('gridStyle').value = config.gridStyle;
        document.getElementById('gridColor').value = config.gridColor;
        document.getElementById('xGridFreq').value = config.xGridFrequency;
    }

    applyAxisSettings() {
        const config = this.svg.dataRenderer.axisConfig;

        // Update scale
        config.xScale = document.getElementById('xScale').value;
        config.yScale = config.xScale; // Keep Y same as X for simplicity

        // Update range (null for auto)
        const xMin = document.getElementById('xMin').value;
        const xMax = document.getElementById('xMax').value;
        const yMin = document.getElementById('yMin').value;
        const yMax = document.getElementById('yMax').value;

        config.xMin = xMin !== '' ? parseFloat(xMin) : null;
        config.xMax = xMax !== '' ? parseFloat(xMax) : null;
        config.yMin = yMin !== '' ? parseFloat(yMin) : null;
        config.yMax = yMax !== '' ? parseFloat(yMax) : null;

        // Update grid & ticks
        config.gridEnabled = document.getElementById('gridEnabled').checked;
        config.ticksEnabled = document.getElementById('ticksEnabled').checked;
        config.gridStyle = document.getElementById('gridStyle').value;
        config.gridColor = document.getElementById('gridColor').value;

        const gridFreq = parseInt(document.getElementById('xGridFreq').value);
        config.xGridFrequency = gridFreq;
        config.yGridFrequency = gridFreq;
        config.xTickFrequency = gridFreq;
        config.yTickFrequency = gridFreq;

        // Re-render data
        this.svg.dataRenderer.renderData();
    }
}

export default UI;
