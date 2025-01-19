function attachCSS() {
    const link = document.createElement("link");
    link.type = "text/css";
    link.rel = "stylesheet";
    link.href = window.location.pathname.includes('brotest') ? 'style.css' : 'brotest/style.css';
    document.head.appendChild(link);
}

const elem = (type,firstClass,content)=>{
    const element = document.createElement(type);
    if (firstClass)
        element.classList.add(firstClass);
    if (typeof content == "string")
        element.innerHTML = content;
    if (content && typeof content == "object")
        element.appendChild(content);
    return element;
}

class UI {
    constructor() {
        attachCSS();
        this.dom = {};
        this.container = elem('div', 'container', `<h1>brotest</h1>`);
        const reload = elem('button', null, 'reload/run');
        reload.onclick = _=>location.reload(true);
        this.container.appendChild(reload)
        document.body.appendChild(this.container);
    }

    addTest(filename, blockname, name) {
        const test = elem('div', 'test', `❓ ${name}`);
        this.getDom(filename, blockname).appendChild(test);
        return (passed,message,error)=>{
            if (passed) {
                test.innerText = `✅ ${name}`;
            } else {
                test.innerText = `❌ ${name}`;
                if (error.stack.includes('⚠')) {
                  console.dir(error);
                    /* if the error comes from an umatched expectation */
                    const [mess,_,position,] = error.stack.split('⚠');
                    message = message + mess.replace('Error:', '');
                    test.appendChild(elem('div', 'message', elem("pre", null, elem("code", null, message))));
                    console.error(message);
                } else {
                    /* if the error is from code */
                    test.appendChild(elem('div', 'message', error.toString()));
                    console.error(error);
                }
            }
        }
    }

    finished(success, total, failed) {
        const message = success ? `All ${total} test ran successfully.` : `${failed} out of ${total} tests failed.`;
        this.container.appendChild(elem('div', success ? 'success' : 'failiure', message));
        console.log(`%c${message}`, `color: ${success ? 'green' : 'red'}`);
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
