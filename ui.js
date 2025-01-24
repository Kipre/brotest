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

class UI {
  constructor() {
    elements.head
      .querySelector("link")
      .setAttribute("href", resolve("style.css"));
    [...elements.head.children].forEach((el) => document.head.appendChild(el));

    this.container = elements.querySelector("#container");
    this.footer = elements.querySelector("#footer");

    this.file = elements.querySelector("#file");

    this.block = elements.querySelector("#block");

    this.test = elements.querySelector("#test");
    this.message = elements.querySelector("#message");
    this.diff = elements.querySelector("#diff");
    this.line = elements.querySelector("#line");

    this.container.removeChild(this.file);
    this.file.removeChild(this.block);
    this.block.removeChild(this.test);
    this.test.removeChild(this.message);
    this.message.removeChild(this.diff);

    [...this.diff.querySelectorAll("div")].map((el) => el.remove());

    this.dom = {};
    document.body.appendChild(this.container);

    document.querySelector("#reload").onclick = () => location.reload(true);
  }

  addTest(filename, blockname, name) {
    let file = document.querySelector(`.file[data-name="${filename}"]`);
    if (!file) {
      file = this.file.cloneNode(true);
      file.removeAttribute("id");
      file.dataset.name = filename;
      file.children[0].innerText = filename;
      this.container.insertBefore(file, this.footer);
    }
    let parent = file;

    let block = null;
    if (blockname) {
      block = document.querySelector(`.block[data-name="${blockname}"`);
      if (!block) {
        block = this.block.cloneNode(true);
        block.removeAttribute("id");
        block.dataset.name = blockname;
        block.children[0].innerText = blockname;
        file.appendChild(block);
      }
      parent = block;
    }

    const test = this.test.cloneNode(true);
    test.removeAttribute("id");
    test.innerText = `❓ ${name}`;

    parent.appendChild(test);

    return (passed, msg, error) => {
      if (passed) {
        test.innerText = `✅ ${name}`;
        return;
      }

      test.innerText = `❌ ${name}`;
      console.error(error);

      const message = this.message.cloneNode(true);
      message.removeAttribute("id");
      const text = message.children[0];
      test.appendChild(message);

      // error is from code
      if (!(error instanceof TestFailureError)) {
        text.innerText = error.toString();
        return;
      }

      // error from unmatched expectation
      text.innerText = msg + error.originalMessage;

      if (false) return;

      const diffSection = this.diff.cloneNode(true);
      diffSection.removeAttribute("id");

      message.appendChild(diffSection);
      const code = diffSection.querySelector("code");
      diffStrings(ensureString(error.expected), ensureString(error.found))
        .split("\n")
        .forEach((line) => {
          const div = this.line.cloneNode(true);
          div.removeAttribute("id");
          div.innerText = line;
          if (!line.startsWith(" "))
            div.classList.add(line.startsWith("+") ? "added" : "removed");
          code.appendChild(div);
        });
    };
  }

  finished(success, total, failed) {
    const message = success
      ? `All ${total} test ran successfully.`
      : `${failed} out of ${total} tests failed.`;

    this.footer.innerText = message;
    this.footer.setAttribute("class", success ? "success" : "failiure"),
      console.log(`%c${message}`, `color: ${success ? "green" : "red"}`);
  }
}

export default new UI();
