
export function createElement(elementData) {
    const element = document.createElementNS('http://www.w3.org/2000/svg', elementData.type);

    if (elementData.attributes) {
        Object.entries(elementData.attributes).forEach(([key,value]) => {
            element.setAttribute(key, value);
        });
    }

    if (elementData.id) element.setAttribute('id', elementData.id);

    if (elementData.classes) element.setAttribute(`class`, elementData.classes.join(' '));

    if (elementData.textContent) {
        element.textContent = elementData.textContent; }

    if (elementData.children) {
        elementData.children.forEach(childData => {
            const child = createElement(childData);
            element.appendChild(child);
        });
    }
    return element;
}

