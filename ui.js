export class TestFailureError extends Error {
  constructor(message, expected, found) {
    super(message);
    this.expected = expected;
    this.found = found;
    this.originalMessage = message;
  }
}

const svgPathRegexDetailed = /^[Mm]\s*[0-9.\-]+/;

export function isValidSVGPath(pathString) {
  const normalized = pathString.trim().replace(/\s+/g, " ");
  if (normalized && !normalized.match(/^[Mm]/)) return false;
  return svgPathRegexDetailed.test(pathString);
}

const yes = `✅`;
const nope = `❌`;

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

function displayTwoPaths(expected, found) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");

  let xMin = Number.POSITIVE_INFINITY;
  let yMin = Number.POSITIVE_INFINITY;
  let xMax = Number.NEGATIVE_INFINITY;
  let yMax = Number.NEGATIVE_INFINITY;

  const paths = [];
  for (const [d, color] of [
    [expected, "yellow"],
    [found, "red"],
  ]) {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", d);
    path.setAttribute("stroke", color);
    path.setAttribute("style", "opacity: 0.8");
    path.setAttribute("fill", "none");
    path.setAttribute("marker-mid", "url(#arrow)");
    path.setAttribute("marker-end", "url(#arrow)");

    const totalLength = path.getTotalLength();
    for (let i = 0; i < 1; i += 0.01) {
      const p = path.getPointAtLength(totalLength * i);
      xMin = Math.min(xMin, p.x);
      yMin = Math.min(yMin, p.y);
      xMax = Math.max(xMax, p.x);
      yMax = Math.max(yMax, p.y);
    }
    paths.push(path);
    svg.appendChild(path);
  }

  const size = Math.max(xMax - xMin, yMax - yMin);
  paths[1].setAttribute("transform", `translate(${size / 80}, ${size / 80})`);

  const mgn = size * 0.1;
  svg.setAttribute(
    "viewBox",
    `${xMin - mgn} ${yMin - mgn} ${xMax - xMin + 2 * mgn} ${yMax - yMin + 2 * mgn}`,
  );

  svg.innerHTML = `
  <defs>
      <marker
        id="arrow"
        viewBox="0 0 10 10"
        refX="1"
        refY="5"
        markerUnits="strokeWidth"
        markerWidth="5"
        markerHeight="10"
        orient="auto">
        <path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke" />
      </marker>
  </defs>
  <line class="axes" x1="${xMin - mgn / 2}" x2=${xMax + mgn / 2} stroke="black" marker-end="url(#arrow)"/>
  <line class="axes" y1="${yMin - mgn / 2}" y2=${yMax + mgn / 2} stroke="black" marker-end="url(#arrow)"/>
   ${svg.innerHTML}`;

  svg.setAttribute(
    "style",
    `font-size: ${size / 100}; stroke-width: 0.2em; transform: scale(1, -1); max-height: 100vh;`,
  );

  return svg;
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
    this.visualDiff = elements.querySelector("#visual-diff");
    this.line = elements.querySelector("#line");

    this.container.removeChild(this.file);
    this.file.removeChild(this.block);
    this.block.removeChild(this.test);
    this.test.removeChild(this.message);
    this.message.removeChild(this.diff);
    this.message.removeChild(this.visualDiff);

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
        test.innerText = `${yes} ${name}`;
        return;
      }

      test.innerText = `${nope} ${name}`;
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

      const diffSection = this.diff.cloneNode(true);
      diffSection.removeAttribute("id");

      message.appendChild(diffSection);
      const code = diffSection.querySelector("code");
      console.error(error.found);

      for (const line of diffStrings(
        ensureString(error.expected),
        ensureString(error.found),
      ).split("\n")) {
        const div = this.line.cloneNode(true);
        div.removeAttribute("id");
        div.innerText = line;
        if (!line.startsWith(" "))
          div.classList.add(line.startsWith("+") ? "added" : "removed");
        code.appendChild(div);
      }

      // display visual error if possible
      if (error.expected === "" || !isValidSVGPath(error.expected)) return;

      const visualDiff = this.visualDiff.cloneNode(true);
      visualDiff.removeAttribute("id");
      message.appendChild(visualDiff);
      visualDiff.appendChild(displayTwoPaths(error.expected, error.found));
    };
  }

  finished(success, total, failed, skipped) {
    let message = success
      ? `All ${total} test ran successfully.`
      : `${failed} out of ${total} tests failed.`;

    if (skipped) message += ` (${skipped} skipped)`;

    document.querySelector("h1").innerText = `brotest ${success ? yes : nope}`;
    this.footer.innerText = message;
    this.footer.setAttribute("class", success ? "success" : "failiure"),
      console.log(`%c${message}`, `color: ${success ? "green" : "red"}`);
  }
}

export default new UI();
