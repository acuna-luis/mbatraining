(() => {
  "use strict";

  // Cada clave es un fragmento literal del cuaderno, también cuando aparece
  // en una opción incorrecta. Las respuestas guardadas conservan esas claves.
  const tex = String.raw;
  const baseElasticidad = tex`\frac{\frac{Q_1-Q_0}{Q_0}}{\frac{P_1-P_0}{P_0}}`;
  const formulas = [
    // Sustitución, excedentes y valor presente.
    ["−ΔY/ΔX", tex`-\frac{\Delta Y}{\Delta X}`],
    ["ΔY/ΔX", tex`\frac{\Delta Y}{\Delta X}`],
    ["ΔX", tex`\Delta X`],
    ["ΔY", tex`\Delta Y`],
    ["−(8 − 12)/(2 − 1) = 4", tex`-\frac{8-12}{2-1}=4`],
    ["Excedente por unidad = disposición a pagar − precio",
      tex`\text{Excedente por unidad}=\text{disposición a pagar}-\text{precio}`],
    ["Excedente por unidad = precio recibido − precio mínimo aceptable",
      tex`\text{Excedente por unidad}=\text{precio recibido}-\text{precio mínimo aceptable}`],
    ["valor del producto marginal = productividad marginal física × precio del producto",
      tex`\text{valor del producto marginal}=\text{productividad marginal física}\times\text{precio del producto}`],
    ["VA = VF/(1 + i)^t", tex`\text{VA}=\frac{\text{VF}}{(1+i)^t}`],
    ["VF", tex`\text{VF}`],
    ["i = 100/90 − 1 ≈ 11,11 %", tex`i=\frac{100}{90}-1\approx 11{,}11\,\%`],
    ["1.000/1,10 = 909,09 €", tex`\frac{1.000}{1{,}10}=909{,}09\,\text{€}`],
    ["(100 − 90)/90 ≈ 11,11 %", tex`\frac{100-90}{90}\approx 11{,}11\,\%`],

    // Elasticidad e ingresos.
    ["Eprecio = [(Q₁ − Q₀)/Q₀] / [(P₁ − P₀)/P₀]", tex`E_{\text{precio}}=` + baseElasticidad],
    ["Ingreso por ventas = P × Q", tex`\text{Ingreso por ventas}=P\times Q`],
    ["Ingreso = P × (10 − P)", tex`\text{Ingreso}=P\times(10-P)`],
    ["Erenta = %ΔQ / %Δrenta real", tex`E_{\text{renta}}=\frac{\%\Delta Q}{\%\Delta\text{renta real}}`],
    ["Ecruzada = %ΔQ de A / %Δprecio de B",
      tex`E_{\text{cruzada}}=\frac{\%\Delta Q_A}{\%\Delta P_B}`],
    ["−10 %/5 % = −2", tex`\frac{-10\,\%}{5\,\%}=-2`],
    ["Ecruzada = −0,5", tex`E_{\text{cruzada}}=-0{,}5`],
    ["gasto = precio × cantidad", tex`\text{gasto}=\text{precio}\times\text{cantidad}`],
    ["Eoferta = [(Q₁ − Q₀)/Q₀] / [(P₁ − P₀)/P₀] = %ΔQ ofrecida / %ΔP",
      tex`E_{\text{oferta}}=` + baseElasticidad + tex`=\frac{\%\Delta Q_{\text{ofrecida}}}{\%\Delta P}`],
    ["Eoferta > 1", tex`E_{\text{oferta}}>1`],
    ["0 ≤ Eoferta < 1", tex`0\le E_{\text{oferta}}<1`],
    ["Eoferta = 1", tex`E_{\text{oferta}}=1`],
    ["Eoferta = 20 %/10 % = 2", tex`E_{\text{oferta}}=\frac{20\,\%}{10\,\%}=2`],
    ["Eoferta = 0,25", tex`E_{\text{oferta}}=0{,}25`],
    ["8 %/8 % = 1", tex`\frac{8\,\%}{8\,\%}=1`],
    ["d/(|Ed| + Es)", tex`\frac{d}{\lvert E_d\rvert+E_s}`],
    ["−s/(|Ed| + Es)", tex`-\frac{s}{\lvert E_d\rvert+E_s}`],
    ["|Ed|", tex`\lvert E_d\rvert`],
    ["|E| = 2", tex`\lvert E\rvert=2`],
    ["|E| = 0,5", tex`\lvert E\rvert=0{,}5`],
    ["Eprecio", tex`E_{\text{precio}}`],

    // Externalidades, impuestos, subsidios y comercio.
    ["Excedente social = excedente del consumidor + excedente del productor + saldo de los efectos sobre terceros",
      tex`\text{Excedente social}=\text{excedente del consumidor}+\text{excedente del productor}+\text{saldo de los efectos sobre terceros}`],
    ["coste marginal social = coste marginal privado + daño marginal externo",
      tex`\text{coste marginal social}=\text{coste marginal privado}+\text{daño marginal externo}`],
    ["Beneficio marginal social del consumo = beneficio marginal privado − molestia marginal a terceros",
      tex`\text{Beneficio marginal social del consumo}=\text{beneficio marginal privado}-\text{molestia marginal a terceros}`],
    ["beneficio marginal social = beneficio marginal privado + beneficio marginal externo",
      tex`\text{beneficio marginal social}=\text{beneficio marginal privado}+\text{beneficio marginal externo}`],
    ["Recaudación = tipo × base efectivamente gravada",
      tex`\text{Recaudación}=\text{tipo}\times\text{base efectivamente gravada}`],
    ["Pc − Pv = t", tex`P_c-P_v=t`],
    ["R = t × Q con impuesto", tex`R=t\times Q_{\text{con impuesto}}`],
    ["½ × t × (Q inicial − Q con impuesto)", tex`\frac{1}{2}\times t\times(Q_{\text{inicial}}-Q_{\text{con impuesto}})`],
    ["Pc = 3,70 €", tex`P_c=3{,}70\,\text{€}`],
    ["Pv = 2,70 €", tex`P_v=2{,}70\,\text{€}`],
    ["Pv − Pc = s", tex`P_v-P_c=s`],
    ["s × Q con subsidio", tex`s\times Q_{\text{con subsidio}}`],
    ["M = Qd interna − Qo interna", tex`M=Q_{d,\text{interna}}-Q_{o,\text{interna}}`],
    ["Importaciones = Qd − Qo", tex`\text{Importaciones}=Q_d-Q_o`],
    ["Qd − Qo", tex`Q_d-Q_o`],
    ["Qo − Qd", tex`Q_o-Q_d`],
    ["P mundial + arancel", tex`P_{\text{mundial}}+\text{arancel}`],
    ["P mundial", tex`P_{\text{mundial}}`],
    ["arancel por unidad × importaciones posteriores",
      tex`\text{arancel por unidad}\times\text{importaciones posteriores}`],
    ["equilibrio ≈ 5,50 €", tex`\text{equilibrio}\approx 5{,}50\,\text{€}`],
    ["Q social", tex`Q_{\text{social}}`],
    ["Q privada", tex`Q_{\text{privada}}`],
    ["E₀", "E_0"], ["E₁", "E_1"],
    ["Pc", "P_c"], ["Pv", "P_v"], ["Qd", "Q_d"], ["Qo", "Q_o"],

    // Cocientes y relaciones de los casos finales.
    ["132/1,20 = 110 €", tex`\frac{132}{1{,}20}=110\,\text{€}`],
    ["60/5 = 12 €", tex`\frac{60}{5}=12\,\text{€}`],
    ["1.200/1,20 = 1.000 €", tex`\frac{1.200}{1{,}20}=1.000\,\text{€}`],
    ["5/3 < r < 2,4", tex`\frac{5}{3}<r<2{,}4`], ["5/3", tex`\frac{5}{3}`],
    ["27 € < salario < 40 €", tex`27\,\text{€}<\text{salario}<40\,\text{€}`],
    ["30 € < salario < 36 €", tex`30\,\text{€}<\text{salario}<36\,\text{€}`],
    ["12/1,20 = 10 €", tex`\frac{12}{1{,}20}=10\,\text{€}`],
    ["−3 % / 2 % = −1,5", tex`\frac{-3\,\%}{2\,\%}=-1{,}5`],
    ["1 % / 2 % = 0,5", tex`\frac{1\,\%}{2\,\%}=0{,}5`],
    ["5 % / 2 % = 2,5", tex`\frac{5\,\%}{2\,\%}=2{,}5`],
    ["30 + x/4", tex`30+\frac{x}{4}`], ["50 − x/4", tex`50-\frac{x}{4}`],
    ["Q/2", tex`\frac{Q}{2}`],
    ["42/2 − 15 = 6 €", tex`\frac{42}{2}-15=6\,\text{€}`],
    ["3 × 7,5 / 2 = 11,25 €", tex`\frac{3\times7{,}5}{2}=11{,}25\,\text{€}`],
    ["(90 + 84)/2 = 87", tex`\frac{90+84}{2}=87`],
    ["80/10.000 = 0,008 €", tex`\frac{80}{10.000}=0{,}008\,\text{€}`],
    ["Qd = 140 − 2Pc", tex`Q_d=140-2P_c`], ["Qs = 10 + Pv", tex`Q_s=10+P_v`],
  ];

  // Estas expresiones literales solo necesitan sustituciones tipográficas.
  // La coma entre coordenadas conserva su espacio; la coma decimal no lo lleva.
  const operaciones = [
    "(1, 12)", "(2, 8)", "V ≤ P ≤ B", "B < V", "V = 180.000 €", "B = 300.000 €",
    "20 × 80 = 1.600 €", "1.000 € × 1,10", "Q = 10 − P", "P = 4", "P = 5", "P = 6",
    "4 × 6 = 24", "5 × 5 = 25", "6 × 4 = 24", "20 − 12 = 8 €", "12 − 5 = 7 €",
    "A > B > C", "B > C > A", "C > A > B", "A > C > B", "B > A > C", "C > B > A",
    "1 €/kg × 400 kg = 400 €", "½ × 100 kg × 1 €/kg = 50 €", "½ × 1 × 100 = 50 €",
    "3,00 € → 3,70 €", "3,00 € → 2,70 €", "½ × 1 × (300 − 260) = 20 €",
    "1 €/kg × 300 kg = 300 €", "½ × 40 kg × 1 €/kg = 20 €", "7 € + t",
    "3 × 0,5 = 1,5", "3 × 0,6 = 1,8", "0,6r > 1", "0,5r < 1,2", "1,5 × 0,6 = 0,9",
    "(22 + 18 + 14) − 3 × 12 = 18 €", "3 × 12 − (4 + 6 + 10) = 16 €",
    "19 + 15 + 11 − 24 = 21 €", "24 − (1 + 6 + 7) = 10 €",
    "18 + 15 + 12 − 30 = 15 €", "30 − (4 + 7 + 9) = 10 €",
    "6 − 1,5p", "2 + 0,5p", "2 + 2,5p", "130 − 2P", "10 + 2P", "200 − 2P", "2P",
    "112 − Q", "22 + Q", "Q = 45", "105 − 3Q", "Q = 35", "35 − 15 = 20 €", "105 − 2,5Q",
    "85 − 45 − 48 = −8 €", "20 + 0,8 × 80 = 84", "62 + 0,8 × 35 = 90",
    "2 × 10 = 20", "3 × 6 = 18", "0,10 × 15 × 40.000 − 45.000 = 15.000 €",
    "6 × 52 = 312", "20 + 6 = 26 €", "6 × 88 = 528", "6 × 36 = 216",
    "½ × 6 × (36 − 30) = 18", "½ × 6 × (100 − 88) = 36", "100 − 36 = 64",
    "−10 €", "−6 €", "−0,5", "−2", "+0,5", "+0,8", "+2", "+3", "+10 %", "−20 %", "−5 %",
    // En la prosa del catálogo estas letras designan siempre variables.
    "Q", "X", "V", "x", "d", "r", "s", "i",
  ];
  const simbolos = {
    "−": "-", "×": tex`\times `, "≤": tex`\le `, "→": tex`\to `, "½": tex`\frac{1}{2}`,
    "€": tex`\,\text{€}`, "€/kg": tex`\,\text{€/kg}`, "kg": tex`\,\mathrm{kg}`, "%": tex`\,\%`,
  };
  for (const original of operaciones) {
    const latex = original.replace(/,(?=\d)/g, "{,}")
      .replace(/€\/kg|kg|[−×≤→½€%]/g, (token) => simbolos[token]);
    formulas.push([original, latex]);
  }
  window.FORMULAS = formulas;
})();
