const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const context = { window: {} };
for (const name of ["curso", "repaso-visual", "finales-cualitativos"]) {
  vm.runInNewContext(readFileSync(path.join(__dirname, "../data", name + ".js"), "utf8"), context);
}
const { CURSO, REPASO_VISUAL, FINALES_CUALITATIVOS } = context.window;

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
