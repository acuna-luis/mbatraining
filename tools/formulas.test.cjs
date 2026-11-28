const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const katex = require("../assets/katex-0.19.1/katex.min.js");

test("cada fórmula tiene una fuente única en el curso y genera notación matemática", () => {
  const context = { window: {} };
  for (const file of ["curso", "finales", "referencias", "formulas"]) {
    const contents = readFileSync(path.join(__dirname, "../data", file + ".js"), "utf8");
    vm.runInNewContext(contents, context);
  }
  const { CURSO, FINALES, REFERENCIAS, FORMULAS } = context.window;
  const texts = new Set();
  function collect(value) {
    if (typeof value === "string") texts.add(value);
    else if (value && typeof value === "object") Object.values(value).forEach(collect);
  }
  [CURSO, FINALES, REFERENCIAS].forEach(collect);
  const catalog = [...texts];
  assert.ok(FORMULAS.length > 0);
  assert.equal(new Map(FORMULAS).size, FORMULAS.length);
  for (const [source, tex] of FORMULAS) {
    assert.ok(source && catalog.some(text => text.includes(source)), source);
    const html = katex.renderToString(tex, { strict: "ignore", throwOnError: true, trust: false });
    assert.match(html, /<math\b/, source);
    assert.match(html, /class="katex-html"/, source);
  }
});
