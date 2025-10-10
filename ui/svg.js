import Scatter from './renderFunctinos/scatter.js'
import { createElement } from '../util/util.js'


class SVG {
    constructor() {

        //edit stuff
        this.selectedElement = null;
        this.editingElement = null;
        this.editInput = null;

        this.curTemplate = {};
        this.dataRenderer = new Scatter(); // class to render data (scatter, line, bar, etc...)

        this.initialize();
    }

    initialize(){
        this.elements = {
            svgContainer: document.getElementById('svgContainer'),
            viewport: document.getElementById('viewport'),
        }

    }

    attachEventListeners() {
        // svg element click
        const { svgContainer } = this.elements;

        svgContainer.addEventListener('click', (e) => {
            if (e.target === svgContainer) {
                this.clearSelectedElement();
                return; //ignore clicks on svgContainer (only want children)
                //TODO only allow clicks on editable elements
            }
            this.handleSvgClick(e.target);

        });

        // Double-click on text elements to edit
        svgContainer.addEventListener('dblclick', (e) => {
            if (e.target.tagName === 'text') {
                e.preventDefault();
                e.stopPropagation();
                this.startEditing(e.target);
            }
        });
    }
    



    handleSvgClick(element) {
        this.clearSelectedElement();
        
        // Get element's position
        const bbox = element.getBoundingClientRect();
        const viewport = this.elements.viewport.getBoundingClientRect();
        
        // Create selection box
        this.selectionBox = document.createElement('div');
        this.selectionBox.style.position = 'absolute';
        this.selectionBox.style.left = (bbox.left - viewport.left) + 'px';
        this.selectionBox.style.top = (bbox.top - viewport.top) + 'px';
        this.selectionBox.style.width = bbox.width + 'px';
        this.selectionBox.style.height = bbox.height + 'px';
        this.selectionBox.style.border = '1px solid #3bb0ff';
        this.selectionBox.style.pointerEvents = 'none';
        this.selectionBox.style.boxSizing = 'border-box';
        
        this.elements.viewport.appendChild(this.selectionBox);
        this.selectedElement = element;
        
        console.log('Selected:', element);
    }

    clearSelectedElement() {
        if (this.selectionBox) {
            this.selectionBox.remove();
            this.selectionBox = null;
        }
        this.selectedElement = null;
    }

    startEditing(textElement) {
        if (this.editingElement) {
            this.finishEditing();
        }

        this.editingElement = textElement;
        this.originalText = textElement.textContent;

        // Get text element position and styles
        const bbox = textElement.getBoundingClientRect();
        const svgContainer = this.elements.svgContainer;
        const svg = svgContainer.querySelector('svg');
        const svgRect = svg.getBoundingClientRect();

        // Create a foreignObject to hold HTML contenteditable div
        const foreignObject = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');

        // Get text position in SVG coordinates
        const x = parseFloat(textElement.getAttribute('x'));
        const y = parseFloat(textElement.getAttribute('y'));
        const fontSize = parseFloat(textElement.getAttribute('font-size'));

        // Set foreignObject size and position
        foreignObject.setAttribute('x', x - 200);
        foreignObject.setAttribute('y', y - fontSize);
        foreignObject.setAttribute('width', '400');
        foreignObject.setAttribute('height', fontSize * 2);

        // Create contenteditable div
        const editDiv = document.createElement('div');
        editDiv.contentEditable = 'true';
        editDiv.textContent = this.originalText;
        editDiv.style.fontSize = textElement.getAttribute('font-size') + 'px';
        editDiv.style.fontFamily = textElement.getAttribute('font-family') || 'Arial, sans-serif';
        editDiv.style.fontWeight = textElement.getAttribute('font-weight') || 'normal';
        editDiv.style.color = textElement.getAttribute('fill');
        editDiv.style.textAlign = 'center';
        editDiv.style.outline = 'none';
        editDiv.style.border = 'none';
        editDiv.style.background = 'transparent';
        editDiv.style.width = '100%';
        editDiv.style.whiteSpace = 'nowrap';
        editDiv.style.overflow = 'visible';
        editDiv.style.caretColor = '#4a90e2';

        // Add subtle underline indicator
        editDiv.style.textDecoration = 'underline';
        editDiv.style.textDecorationStyle = 'dotted';
        editDiv.style.textDecorationColor = '#4a90e2';

        foreignObject.appendChild(editDiv);

        // Hide original text
        textElement.style.opacity = '0';

        // Add foreignObject to SVG
        svg.appendChild(foreignObject);
        this.editForeignObject = foreignObject;

        // Focus and select text
        editDiv.focus();
        const range = document.createRange();
        range.selectNodeContents(editDiv);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);

        // Handle events
        const keydownHandler = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.finishEditing(editDiv.textContent);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                this.cancelEditing();
            }
        };

        const blurHandler = () => {
            this.finishEditing(editDiv.textContent);
        };

        editDiv.addEventListener('keydown', keydownHandler);
        editDiv.addEventListener('blur', blurHandler);

        // Store handlers for cleanup
        this.editHandlers = { keydownHandler, blurHandler, editDiv };
    }

    finishEditing(newText) {
        if (!this.editingElement) return;

        const trimmedText = newText ? newText.trim() : '';
        if (trimmedText) {
            this.editingElement.textContent = trimmedText;
        } else {
            // Restore original if empty
            this.editingElement.textContent = this.originalText;
        }

        // Restore visibility
        this.editingElement.style.opacity = '1';

        // Remove foreignObject
        if (this.editForeignObject) {
            this.editForeignObject.remove();
            this.editForeignObject = null;
        }

        // Remove event listeners
        if (this.editHandlers) {
            this.editHandlers.editDiv.removeEventListener('keydown', this.editHandlers.keydownHandler);
            this.editHandlers.editDiv.removeEventListener('blur', this.editHandlers.blurHandler);
            this.editHandlers = null;
        }

        this.editingElement = null;
        this.originalText = null;
    }

    cancelEditing() {
        if (!this.editingElement) return;

        // Restore visibility without saving
        this.editingElement.style.opacity = '1';

        // Remove foreignObject
        if (this.editForeignObject) {
            this.editForeignObject.remove();
            this.editForeignObject = null;
        }

        // Remove event listeners
        if (this.editHandlers) {
            this.editHandlers.editDiv.removeEventListener('keydown', this.editHandlers.keydownHandler);
            this.editHandlers.editDiv.removeEventListener('blur', this.editHandlers.blurHandler);
            this.editHandlers = null;
        }

        this.editingElement = null;
        this.originalText = null;
    }

    renderTemplate() {

        const { svgContainer } = this.elements;

        if (Object.keys(this.curTemplate).length === 0) {
            console.warn('No template loaded yet');
            return;
        }
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        const viewBox = this.curTemplate.svg.viewBox;
        svg.setAttribute('viewBox', `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`);
        svg.setAttribute('width', viewBox.width);
        svg.setAttribute('height', viewBox.height);
        if (this.curTemplate.svg.id) {
            svg.setAttribute('id', this.curTemplate.svg.id);
        }

        this.curTemplate.svg.elements.forEach(elementData => {
            svg.appendChild(createElement(elementData))
        });

        svgContainer.innerHTML = '';
        svgContainer.appendChild(svg);

    }
    

    
}

export default SVG;
