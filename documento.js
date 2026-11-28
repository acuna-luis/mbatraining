// Documento Word Open XML. El archivo ZIP se construye en el navegador.
(() => {
  const enc = new TextEncoder();
  const crcTable = Array.from({ length: 256 }, (_, i) => {
    for (let j = 0; j < 8; j++) i = i & 1 ? 0xedb88320 ^ (i >>> 1) : i >>> 1;
    return i >>> 0;
  });
  function crc32(bytes) {
    let crc = 0xffffffff;
    for (const byte of bytes) crc = crcTable[(crc ^ byte) & 255] ^ (crc >>> 8);
    return (crc ^ 0xffffffff) >>> 0;
  }
  function zip(files, mime) {
    const contents = [],
      directory = [];
    let offset = 0,
      dirSize = 0;
    const record = (size) => new DataView(new ArrayBuffer(size));
    for (const [name, text] of Object.entries(files)) {
      const filename = enc.encode(name),
        bytes = enc.encode(text),
        crc = crc32(bytes);
      const head = record(30),
        entry = record(46);
      head.setUint32(0, 0x04034b50, true);
      head.setUint16(4, 20, true);
      head.setUint16(12, 33, true);
      head.setUint32(14, crc, true);
      head.setUint32(18, bytes.length, true);
      head.setUint32(22, bytes.length, true);
      head.setUint16(26, filename.length, true);
      entry.setUint32(0, 0x02014b50, true);
      entry.setUint16(4, 20, true);
      entry.setUint16(6, 20, true);
      entry.setUint16(14, 33, true);
      entry.setUint32(16, crc, true);
      entry.setUint32(20, bytes.length, true);
      entry.setUint32(24, bytes.length, true);
      entry.setUint16(28, filename.length, true);
      entry.setUint32(42, offset, true);
      contents.push(head.buffer, filename, bytes);
      directory.push(entry.buffer, filename);
      offset += 30 + filename.length + bytes.length;
      dirSize += 46 + filename.length;
    }
    const end = record(22),
      count = Object.keys(files).length;
    end.setUint32(0, 0x06054b50, true);
    end.setUint16(8, count, true);
    end.setUint16(10, count, true);
    end.setUint32(12, dirSize, true);
    end.setUint32(16, offset, true);
    return new Blob([...contents, ...directory, end.buffer], { type: mime });
  }
  const xml = (value) =>
    String(value)
      .replace(
        /[^\u0009\u000a\u000d\u0020-\ud7ff\ue000-\ufffd\u{10000}-\u{10ffff}]/gu,
        "",
      )
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  const declaration = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
  function para(value, style) {
    const text = String(value)
      .split(/\r\n|\r|\n/)
      .map((line) => '<w:t xml:space="preserve">' + xml(line) + "</w:t>")
      .join("<w:br/>");
    return (
      "<w:p>" +
      (style ? '<w:pPr><w:pStyle w:val="' + style + '"/></w:pPr>' : "") +
      "<w:r>" +
      text +
      "</w:r></w:p>"
    );
  }
  const ns = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
  const relations =
    "http://schemas.openxmlformats.org/package/2006/relationships";
  const officeRel =
    "http://schemas.openxmlformats.org/officeDocument/2006/relationships/";
  const mime =
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  function word(report) {
    const body = [
      para("Fundamentos de Economía", "Title"),
      para("Cuaderno de respuestas", "H1"),
      para(
        new Date(report.fecha).toLocaleString("es-ES") +
          " · " +
          report.respondidas +
          " de " +
          report.total +
          " preguntas respondidas.",
      ),
    ];
    const puntos = report.puntuacion;
    if (puntos) {
      body.push(
        para("Puntuación automática", "H2"),
        para(
          puntos.evaluadas
            ? `${puntos.aciertos} / ${puntos.evaluadas} puntos (${puntos.porcentaje} % de acierto).`
            : "Aún no hay respuestas de elección para puntuar.",
        ),
        para(
          `Aciertos: ${puntos.aciertos} · Errores: ${puntos.errores} · Máximo del curso: ${puntos.maximo_curso} puntos.`,
        ),
        para(`Respuestas escritas pendientes de revisión: ${puntos.escritas}.`),
      );
    }
    for (const m of report.modulos) {
      body.push(para("Módulo " + m.numero + " · " + m.titulo, "H1"));
      for (const a of m.apartados) {
        body.push(para(a.pagina_compendio ? a.numero + ". " + a.titulo : a.titulo, "H2"));
        if (a.pagina_compendio) {
          body.push(para(`Compendio, p. ${a.pagina_compendio} · Lectura de origen, pp. ${a.paginas_origen}`, "Meta"));
        }
        for (const q of a.preguntas) {
          if (q.caso) body.push(para(q.caso));
          body.push(para(q.id + " · " + q.enunciado, "Question"));
          if (q.tipo === "final") q.opciones.forEach((option, index) => {
            body.push(para(String.fromCharCode(65 + index) + ". " + option));
          });
          const respuesta = q.modalidad === "eleccion" ? "Opción elegida: " : "Respuesta escrita: ";
          body.push(para(q.respuesta === null ? "Pendiente" : respuesta + q.respuesta));
        }
      }
    }
    if (report.incluye_referencias) {
      body.push(
        para("Referencias para la evaluación", "H1"),
        para(
          "Respuestas de referencia del solucionario. Utiliza los identificadores para contrastarlas con las respuestas del estudiante.",
        ),
      );
      for (const m of report.modulos)
        for (const a of m.apartados) {
          body.push(para(a.pagina_compendio ? a.numero + ". " + a.titulo : a.titulo, "H2"));
          for (const q of a.preguntas) {
            body.push(para(q.id + " · " + q.referencia));
            if (q.explicacion) body.push(para(q.explicacion));
            if (q.motivos_descarte) {
              body.push(para("Por qué se descartan las otras opciones", "Question"));
              q.motivos_descarte.forEach((reason, i) => {
                if (reason) body.push(para("Opción " + String.fromCharCode(65 + i) + ". " + reason));
              });
            }
          }
        }
    }
    const style = (id, size, bold, color, space, heading = false) =>
      '<w:style w:type="paragraph" w:styleId="' +
      id +
      '"><w:name w:val="' +
      id +
      '"/><w:pPr>' +
      (heading ? "<w:keepNext/>" : "") +
      '<w:spacing w:before="' +
      space +
      '" w:after="85"/></w:pPr><w:rPr>' +
      (bold ? "<w:b/>" : "") +
      '<w:color w:val="' +
      color +
      '"/><w:sz w:val="' +
      size +
      '"/></w:rPr></w:style>';
    return zip(
      {
        "[Content_Types].xml":
          declaration +
          '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="' +
          mime +
          '.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>',
        "_rels/.rels":
          declaration +
          '<Relationships xmlns="' +
          relations +
          '"><Relationship Id="rId1" Type="' +
          officeRel +
          'officeDocument" Target="word/document.xml"/></Relationships>',
        "word/_rels/document.xml.rels":
          declaration +
          '<Relationships xmlns="' +
          relations +
          '"><Relationship Id="rId1" Type="' +
          officeRel +
          'styles" Target="styles.xml"/></Relationships>',
        "word/styles.xml":
          declaration +
          '<w:styles xmlns:w="' +
          ns +
          '"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="22"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="100"/></w:pPr></w:pPrDefault></w:docDefaults>' +
          style("Title", 44, true, "164737", 120, true) +
          style("H1", 32, true, "154F3A", 240, true) +
          style("H2", 27, true, "244A3B", 180, true) +
          style("Question", 22, true, "222222", 110, true) +
          style("Meta", 19, false, "52665C", 10) +
          "</w:styles>",
        "word/document.xml":
          declaration +
          '<w:document xmlns:w="' +
          ns +
          '"><w:body>' +
          body.join("") +
          '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:bottom="1134" w:left="1134" w:right="1134"/></w:sectPr></w:body></w:document>',
      },
      mime,
    );
  }
  window.crearDocumentoWord = word;
})();
