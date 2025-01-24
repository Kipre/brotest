export class TestFailureError extends Error {
  constructor(message, expected, found) {
    super(message);
    this.expected = expected;
    this.found = found;
    this.originalMessage = message;
  }
}

const parser = new DOMParser();

function resolve(file) {
  return window.location.pathname.includes("brotest")
    ? file
    : "brotest/" + file;
}

const elements = parser.parseFromString(
  await fetch(resolve("elements.html")).then((r) => r.text()),
  "text/html",
);

function attachCSS() {
  const link = document.createElement("link");
  link.type = "text/css";
  link.rel = "stylesheet";
  link.href = resolve("style.css");
  document.head.appendChild(link);
}

function ensureString(value) {
  if (typeof value == "string") return value;
  return JSON.stringify(value, null, 2);
}

const wasm = await WebAssembly.instantiateStreaming(
  fetch(resolve("diff/main.wasm")),
);

export function diffStrings(a, b) {
  const { wasmDiff, memory } = wasm.instance.exports;

  const memoryView = new Uint8Array(memory.buffer).subarray(1);
  const { written } = new TextEncoder().encodeInto(a, memoryView);

  const secondView = memoryView.subarray(written);
  const { written: written2 } = new TextEncoder().encodeInto(b, secondView);

  const end = written + written2 + 2;

  const outputLength = wasmDiff(0, written + 1, end, memoryView.byteLength);
  if (outputLength < 0) throw new Error("diff failed");

  const outputView = new Uint8Array(memory.buffer, 0, outputLength);
  return new TextDecoder().decode(outputView);
}

const elem = (type, firstClass, content) => {
  const element = document.createElement(type);
  if (firstClass) element.classList.add(firstClass);
  if (typeof content == "string") element.innerHTML = content;
  if (content && typeof content == "object") element.appendChild(content);
  return element;
};

class UI {
  constructor() {
    attachCSS();
    this.dom = {};
    this.container = elem("div", "container", `<h1>brotest</h1>`);
    const reload = elem("button", null, "reload/run");
    reload.onclick = (_) => location.reload(true);
    this.container.appendChild(reload);
    document.body.appendChild(this.container);
  }

  addTest(filename, blockname, name) {
    const test = elem("div", "test", `❓ ${name}`);
    this.getDom(filename, blockname).appendChild(test);
    return (passed, message, error) => {
      if (passed) {
        test.innerText = `✅ ${name}`;
      } else {
        test.innerText = `❌ ${name}`;
        console.error(error);

        // error is from code
        if (!(error instanceof TestFailureError))
          return test.appendChild(elem("div", "message", error.toString()));

        /* if the error comes from an umatched expectation */
        message = message + error.originaMessage;

        const messageBody = elem("div", "message", message);
        test.appendChild(messageBody);
        messageBody.appendChild(
          elem(
            "div",
            "message",
            elem(
              "pre",
              null,
              elem(
                "code",
                null,
                diffStrings(
                  ensureString(error.expected),
                  ensureString(error.found),
                ),
              ),
            ),
          ),
        );

        console.error(message);
      }
    };
  }

  finished(success, total, failed) {
    const message = success
      ? `All ${total} test ran successfully.`
      : `${failed} out of ${total} tests failed.`;
    this.container.appendChild(
      elem("div", success ? "success" : "failiure", message),
    );
    console.log(`%c${message}`, `color: ${success ? "green" : "red"}`);
  }

  getDom(filename, blockname) {
    if (!(filename in this.dom)) {
      this.dom[filename] = elem("div", "file", `<h2>${filename}</h2>`);
      this.container.appendChild(this.dom[filename]);
    }
    if (blockname) {
      let blockDom = this.dom[filename].lastChild;
      if (blockDom?.dataset.name == blockname) {
        return blockDom;
      } else {
        blockDom = elem("div", "block", `<h3>${blockname}</h3>`);
        blockDom.dataset.name = blockname;
        this.dom[filename].appendChild(blockDom);
        return blockDom;
      }
    }
    return this.dom[filename];
  }
}

export default new UI();
