"""Genera las narraciones del aula con la voz femenina española de Sharvard.

Requiere piper-tts==1.8.0 y ffmpeg con libmp3lame. Descarga los archivos
es_ES-sharvard-medium.onnx y .onnx.json de la revisión indicada en
assets/audio/CREDITOS.txt. Colócalos juntos, fuera del directorio público.

    python tools/generar_audio.py --model /ruta/es_ES-sharvard-medium.onnx

Por defecto genera una pista por lectura de data/curso.js. Para otros textos,
--input ARCHIVO (o --input - para usar stdin) acepta un objeto JSON que asocia
cada identificador a un texto o lista de párrafos. Ejemplo de entrada:
{"ejemplo": ["Economía.", "El precio aumentó un 10,7 %."]}.
Usa --out-dir para elegir el directorio de destino. Se sustituye cada archivo
completo al terminar su síntesis y codificación.
"""
import argparse
import hashlib
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MODEL_SHA = "234dc4cf0fdb53ccb76b9b2c4d7ef1330364762674c1b78c1b62d8608c528a54"
CONFIG_SHA = "c3d92a576c2fb5ac5120c9feeb6dd09e6577a564e20c75b91981ee1ceb441a90"
VOICE_CREDIT = (
    "Voz Sharvard de Piper. Sharvard_IJA de V. Aubanel, M. L. García Lecumberri y M. Cooke, "
    "CC BY 3.0 (https://doi.org/10.7488/ds/75). "
    "Base Hi-Fi TTS de E. Bakhturina, V. Lavrukhin, B. Ginsburg y Y. Zhang, "
    "con la voz de Cori Samuel (lectora 92), CC BY 4.0 (https://www.openslr.org/109/)."
)


def lecturas():
    raw = (ROOT / "data/curso.js").read_text(encoding="utf-8")
    modules = json.loads(raw.split("=", 1)[1].strip().rstrip(";"))
    tracks = {}
    for module in modules:
        for item in module["items"]:
            if not item.get("ideas"):
                continue
            blocks = [item["title"], *item["ideas"]]
            if item.get("table"):
                headers, *rows = item["table"]
                for row in rows:
                    blocks.append(". ".join(f"{label}: {value}" for label, value in zip(headers, row)))
            if item.get("figure"):
                blocks.append("Gráfico. " + item["figure"]["alt"])
            tracks[item["id"]] = blocks
    return tracks


def normalizar(texto):
    # El separador de millares no marca un final de frase. Mantener cada cero
    # tras la coma permite distinguir una centésima de una décima.
    texto = re.sub(r"\b\d{1,3}(?:\.\d{3})+\b", lambda m: m[0].replace(".", ""), texto)
    texto = re.sub(r"(?<![\d.,])1\s*€", "un euro", texto)
    texto = re.sub(r"(?<![\d.,])1\s*kg\b", "un kilogramo", texto)
    def decimal(match):
        parte = match[2]
        significativos = parte.lstrip("0")
        ceros = "cero " * (len(parte) - len(significativos))
        return match[1] + " coma " + ceros + significativos

    texto = re.sub(r"(\d+),(\d+)", decimal, texto)
    texto = re.sub(r"\|([^|]+)\|", r" valor absoluto de \1 ", texto)
    texto = re.sub(r"(?<=\d)–(?=\d)", " a ", texto)
    texto = texto.replace("I+D", "investigación y desarrollo").replace("€/kg", "euros por kilogramo")
    texto = texto.replace("euro/kg", "euro por kilogramo").replace("euro/mes", "euro al mes")
    texto = texto.replace("€/mes", "euros al mes").replace("€/unidad", "euros por unidad")
    texto = texto.replace("u. m./unidad", "unidades monetarias por unidad").replace("kg/año", "kilogramos al año")
    texto = texto.replace("Δ", " variación de ").replace("½", "un medio")
    texto = re.sub(r"\bkg\b", "kilogramos", texto)
    for simbolo, palabra in {
        "€": "euros", "%": "por ciento", "−": "menos", "+": "más", "×": "por",
        "÷": "dividido entre", "/": "dividido entre", "=": "igual a", "≈": "aproximadamente",
        "≤": "menor o igual que", "<": "menor que", ">": "mayor que", "→": "pasa a",
        "^": "elevado a", "₁": "sub uno", "₀": "sub cero", "·": ",",
    }.items():
        texto = texto.replace(simbolo, " " + palabra + " ")
    return " ".join(texto.split())


def cargar_voz(modelo, hilos):
    from onnxruntime import InferenceSession, SessionOptions
    from piper import PiperVoice
    from piper.config import PiperConfig

    config = Path(str(modelo) + ".json")
    for path, checksum in ((modelo, MODEL_SHA), (config, CONFIG_SHA)):
        if hashlib.sha256(path.read_bytes()).hexdigest() != checksum:
            raise ValueError(f"Revisa la versión de {path}. Su huella difiere de la voz documentada.")
    opciones = SessionOptions()
    opciones.intra_op_num_threads = hilos
    opciones.add_session_config_entry("session.intra_op.allow_spinning", "0")
    sesion = InferenceSession(str(modelo), opciones, providers=["CPUExecutionProvider"])
    return PiperVoice(session=sesion, config=PiperConfig.from_dict(json.loads(config.read_text())))


def generar(voz, bloques, destino):
    from piper import SynthesisConfig

    frecuencia = voz.config.sample_rate
    sintesis = SynthesisConfig(speaker_id=1, length_scale=1.04)
    pcm = bytearray()
    for bloque in bloques:
        if pcm:
            pcm.extend(bytes(2 * int(frecuencia * 0.35)))
        for frase in voz.synthesize(normalizar(bloque), syn_config=sintesis):
            pcm.extend(frase.audio_int16_bytes)
            pcm.extend(bytes(2 * int(frecuencia * 0.14)))
    if not pcm:
        raise ValueError(f"La pista {destino.stem} está vacía.")
    with tempfile.NamedTemporaryFile(dir=destino.parent, suffix=".mp3", delete=False) as tmp:
        ruta = Path(tmp.name)
    try:
        subprocess.run([
            "ffmpeg", "-nostdin", "-loglevel", "error", "-y", "-f", "s16le", "-ar", str(frecuencia),
            "-ac", "1", "-i", "pipe:0", "-codec:a", "libmp3lame", "-b:a", "48k",
            "-metadata", "comment=" + VOICE_CREDIT, str(ruta)
        ], input=pcm, check=True)
        ruta.chmod(0o644)
        ruta.replace(destino)
    finally:
        ruta.unlink(missing_ok=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--model", required=True, type=Path)
    parser.add_argument("--input", type=argparse.FileType("r", encoding="utf-8"))
    parser.add_argument("--out-dir", type=Path, default=ROOT / "assets/audio/lectura")
    parser.add_argument("--threads", type=int, default=3)
    args = parser.parse_args()
    tracks = json.load(args.input) if args.input else lecturas()
    if not isinstance(tracks, dict) or not tracks or args.threads < 1:
        parser.error("Se necesitan pistas identificadas y al menos un hilo de síntesis.")
    for key, value in tracks.items():
        if not re.fullmatch(r"[a-zA-Z0-9_-]+(?:\.[a-zA-Z0-9_-]+)*", key):
            parser.error(f"Identificador de pista inválido: {key!r}")
        blocks = [value] if isinstance(value, str) else value
        if not isinstance(blocks, list) or not blocks or not all(isinstance(b, str) and b.strip() for b in blocks):
            parser.error(f"Texto no válido para la pista {key}.")
        tracks[key] = blocks
    args.out_dir.mkdir(parents=True, exist_ok=True)
    voice = cargar_voz(args.model, args.threads)
    for index, (key, blocks) in enumerate(tracks.items(), 1):
        generar(voice, blocks, args.out_dir / f"{key}.mp3")
        print(f"{index}/{len(tracks)} · {key}", file=sys.stderr, flush=True)


if __name__ == "__main__":
    main()
