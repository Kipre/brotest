const elem = (type, firstClass, content) => {
    const element = document.createElement(type);
    if (firstClass) element.classList.add(firstClass);
    if (content) element.innerHTML = content;
    return element;
}

class UI {
    constructor() {
        this.dom = {};
        this.container = elem('div', 'container', `<h1>brotest</h1>`);
        document.body.appendChild(this.container);
    }

    addTest(filename, blockname, name) {
        const test = elem('div', 'test', `❓ ${name}`);
        this.getDom(filename, blockname).appendChild(test);
        return (passed, message) => {
            if (passed) {
                test.innerText = `✅ ${name}`;
            } else {
                test.innerText = `❌ ${name}`;
                test.appendChild(elem('span', 'message', '<br>' + message))
            }
        }
    }

    getDom(filename, blockname) {
        if (!(filename in this.dom)) {
            this.dom[filename] = elem('div', 'file', `<h2>${filename}</h2>`);
            this.container.appendChild(this.dom[filename]);
        }
        if (blockname) {
            let blockDom = this.dom[filename].lastChild;
            if (blockDom?.dataset.name == blockname) {
                return blockDom;
            } else {
                blockDom = elem('div', 'block', `<h3>${blockname}</h3>`);
                blockDom.dataset.name = blockname;
                this.dom[filename].appendChild(blockDom);
                return blockDom;
            }
        }
        return this.dom[filename];
    }
}

export default new UI();