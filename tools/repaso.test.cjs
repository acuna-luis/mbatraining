const assert = require("node:assert/strict");
const { readFileSync, readdirSync } = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const context = { window: {} };
for (const name of ["curso", "repaso-visual", "escenarios", "finales-cualitativos"]) {
  vm.runInNewContext(readFileSync(path.join(__dirname, "../data", name + ".js"), "utf8"), context);
}
const { CURSO, REPASO_VISUAL, ESCENARIOS, FINALES_CUALITATIVOS } = context.window;

test("cada recurso visual del curso tiene una pregunta de repaso y una explicación", () => {
  const expected = new Set(["portada"]);
  for (const module of CURSO) {
    for (const unit of module.items) {
      if (unit.figure || unit.table) expected.add(unit.id);
    }
  }
  assert.deepEqual(new Set(Object.keys(REPASO_VISUAL)), expected);
  for (const [id, review] of Object.entries(REPASO_VISUAL)) {
    assert.ok(review.prompt.trim() && review.answer.trim(), id);
  }
});

test("cada escenario corresponde a un apartado, a un gráfico ampliable y a su propio repaso", () => {
  const units = new Map(CURSO.flatMap(m => m.items.map(a => [a.id, a])));
  const directory = path.join(__dirname, "../assets/figuras/escenarios");
  const files = new Set();
  for (const [unit, group] of Object.entries(ESCENARIOS)) {
    assert.ok(units.get(unit)?.questions, unit);
    if (units.get(unit).figure) assert.ok(group.originalTitle?.trim(), unit);
    assert.ok(group.figures.length, unit);
    for (const chart of group.figures) {
      assert.ok(chart.id.startsWith(unit + "-") && /^[\w.-]+$/.test(chart.id), chart.id);
      for (const key of ["title", "alt", "prompt", "answer"]) assert.ok(chart[key]?.trim(), chart.id + " " + key);
      const file = chart.id + ".svg";
      assert.ok(!files.has(file), file);
      files.add(file);
      assert.match(readFileSync(path.join(directory, file), "utf8"), /viewBox="0 0 540 324"/, file);
    }
  }
  assert.deepEqual(files, new Set(readdirSync(directory).filter(name => name.endsWith(".svg"))));
});

test("cada opción incorrecta de los finales cualitativos tiene un motivo propio", () => {
  for (const q of FINALES_CUALITATIVOS) {
    assert.equal(q.optionReasons.length, q.options.length, q.id);
    assert.equal(new Set(q.optionReasons).size, q.options.length, q.id);
    q.optionReasons.forEach((reason, i) => {
      if (i === q.correctIndex) assert.equal(reason, null, q.id);
      else assert.ok(typeof reason === "string" && reason.trim(), q.id);
    });
  }
});
