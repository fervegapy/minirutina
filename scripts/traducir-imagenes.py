# Genera las versiones en inglés y portugués de las ilustraciones que traen
# texto en español dibujado (íconos de actividades, niño/niña y los adornos
# del tablero de recompensas).
#
#   python3 scripts/traducir-imagenes.py
#
# Salida: public/icons/{en,pt}/*.png y public/recompensas/{en,pt}/*.png, con
# el mismo nombre de archivo que la original. lib/iconAssets.ts y
# lib/pdfImages.ts las eligen según el idioma del pedido.
#
# Cómo funciona: la etiqueta de cada ícono es un renglón en mayúsculas en la
# franja de abajo (≈ 83–94 % del alto), en KG Primary Penmanship. Se borra el
# renglón original (solo su caja, para no tocar marcos ni la ilustración) y se
# escribe la traducción con la misma fuente, color y alto de letra, apoyada en
# la misma línea de base. Si un ícono nuevo cambia de diseño, revisar acá.
# Requiere Pillow (pip install pillow).
import os
from collections import Counter
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ICONS = os.path.join(ROOT, "public", "icons")
RECOMPENSAS = os.path.join(ROOT, "public", "recompensas")
FONTS = os.path.join(ROOT, "public", "fonts")
KG = os.path.join(FONTS, "KGPrimaryPenmanship.ttf")

# Texto dibujado en cada PNG → (español tal como está, inglés, portugués).
# Ojo: es lo que dice la imagen, que no siempre coincide con la etiqueta de la
# web (p. ej. cama-nino.png dice "DORMIR").
ETIQUETAS = {
    "agua":           ("TOMAR AGUA", "DRINK WATER", "BEBER ÁGUA"),
    "bano":           ("BAÑARSE", "TAKE A BATH", "TOMAR BANHO"),
    "calendario":     ("REVISAR CALENDARIO", "CHECK THE CALENDAR", "VER O CALENDÁRIO"),
    "calma":          ("RELAJARSE Y RESPIRAR", "RELAX AND BREATHE", "RELAXAR E RESPIRAR"),
    "cama-gen":       ("DORMIR", "SLEEP", "DORMIR"),
    "cama":           ("HACER LA CAMA", "MAKE THE BED", "ARRUMAR A CAMA"),
    "cancion":        ("CANTAR UNA CANCION", "SING A SONG", "CANTAR UMA MÚSICA"),
    "cara":           ("LAVARSE LA CARA", "WASH YOUR FACE", "LAVAR O ROSTO"),
    "cena":           ("CENA", "DINNER", "JANTAR"),
    "cepillarse":     ("CEPILLARSE", "BRUSH YOUR TEETH", "ESCOVAR OS DENTES"),
    "cepillo":        ("CEPILLARSE", "BRUSH YOUR TEETH", "ESCOVAR OS DENTES"),
    "charla":         ("CONVERSAR", "TALK ABOUT THE DAY", "CONVERSAR"),
    "cole":           ("IR AL COLE", "GO TO SCHOOL", "IR PARA A ESCOLA"),
    "cuento":         ("LEER UN CUENTO", "READ A STORY", "LER UMA HISTÓRIA"),
    "desayunar":      ("DESAYUNAR", "EAT BREAKFAST", "TOMAR CAFÉ DA MANHÃ"),
    "dormir":         ("DORMIR", "SLEEP", "DORMIR"),
    "guarde":         ("IR A LA GUARDE", "GO TO DAYCARE", "IR PARA A CRECHE"),
    "ir_bano":        ("IR AL BAÑO", "USE THE BATHROOM", "IR AO BANHEIRO"),
    "leche":          ("TOMAR LECHE", "DRINK MILK", "TOMAR LEITE"),
    "leer":           ("LEER", "READ", "LER"),
    "levantarse":     ("LEVANTARSE", "GET UP", "LEVANTAR"),
    "luces":          ("APAGAMOS LAS LUCES", "LIGHTS OUT", "APAGAR AS LUZES"),
    "mamallega":      ("MAMÁ LLEGA A CASA", "MOM COMES HOME", "MAMÃE CHEGA EM CASA"),
    "manos":          ("LAVARSE LAS MANOS", "WASH YOUR HANDS", "LAVAR AS MÃOS"),
    "mochila":        ("PREPARAR MOCHILA", "PACK YOUR BACKPACK", "ARRUMAR A MOCHILA"),
    "nina":           ("NIÑA", "GIRL", "MENINA"),
    "nino":           ("NIÑO", "BOY", "MENINO"),
    "orar":           ("ORAR", "PRAY", "ORAR"),
    "ordenar":        ("ORDENAR LAS COSAS", "TIDY UP", "ARRUMAR AS COISAS"),
    "papallega":      ("PAPÁ LLEGA A CASA", "DAD COMES HOME", "PAPAI CHEGA EM CASA"),
    "papamamallegan": ("LLEGAN PAPÁ Y MAMÁ", "MOM AND DAD COME HOME", "PAPAI E MAMÃE CHEGAM"),
    "peinarse":       ("PEINARSE", "BRUSH YOUR HAIR", "PENTEAR O CABELO"),
    "pijama":         ("PONER PIJAMA", "PUT ON PAJAMAS", "VESTIR O PIJAMA"),
    "preparar":       ("PREPARAR MIS COSAS", "GET READY FOR TOMORROW", "PREPARAR AS COISAS"),
    "remedios":       ("TOMAR REMEDIOS", "TAKE MEDICINE", "TOMAR O REMÉDIO"),
    "vestirse":       ("VESTIRSE", "GET DRESSED", "SE VESTIR"),
    "zapatos":        ("PONERSE LOS ZAPATOS", "PUT ON YOUR SHOES", "CALÇAR OS SAPATOS"),
}


def clave(nombre):
    """agua-nino → agua; cama-nino → cama-gen (dice otra cosa que cama.png)."""
    base = nombre[:-4]
    if base in ETIQUETAS:
        return base
    raiz = base.rsplit("-", 1)[0]
    if raiz == "cama":
        return "cama-gen"
    return raiz if raiz in ETIQUETAS else None


def oscuro(p):
    r, g, b, a = p
    return a > 40 and r + g + b < 600


def tramos(valores, hueco):
    """Agrupa enteros ordenados en tramos separados por más de `hueco`."""
    out = []
    for v in valores:
        if out and v - out[-1][1] <= hueco + 1:
            out[-1][1] = v
        else:
            out.append([v, v])
    return out


def caja_etiqueta(im):
    """Caja (x0, y0, x1, y1) del renglón de texto más bajo del ícono.

    Las etiquetas van centradas en la franja de abajo; a veces un pedazo de
    la ilustración (una trenza, el piso) baja hasta esa franja por el costado,
    así que se toman solo las columnas del grupo que pasa por el centro."""
    w, h = im.size
    px = im.load()
    franja = range(int(h * 0.78), h)
    x0, x1 = 3, w - 4
    for _ in range(3):
        filas = [y for y in franja if any(oscuro(px[x, y]) for x in range(x0, x1 + 1))]
        y0, y1 = tramos(filas, 0)[-1]
        cols = [x for x in range(3, w - 3) if any(oscuro(px[x, y]) for y in range(y0, y1 + 1))]
        centro = [t for t in tramos(cols, int(w * 0.05)) if t[0] < w * 0.65 and t[1] > w * 0.35]
        x0, x1 = min(t[0] for t in centro), max(t[1] for t in centro)
    return x0, y0, x1, y1


def color_texto(px, caja):
    """Color de la tinta: mediana del 30 % más oscuro (el más común suele ser
    un gris del antialias cuando el texto es chico)."""
    x0, y0, x1, y1 = caja
    pts = sorted(
        (px[x, y][:3] for x in range(x0, x1 + 1) for y in range(y0, y1 + 1) if oscuro(px[x, y])),
        key=sum,
    )
    return pts[: max(1, len(pts) * 3 // 10)][len(pts) * 3 // 20]


def tamano_para(texto, alto):
    """Tamaño de fuente con el que `texto` mide `alto` px de alto."""
    for size in range(4, 120):
        f = ImageFont.truetype(KG, size)
        b = f.getbbox(texto, anchor="ls")
        if b[3] - b[1] >= alto:
            return size
    return 120


def traducir_icono(path, es, txt, out):
    im = Image.open(path).convert("RGBA")
    w, h = im.size
    x0, y0, x1, y1 = caja_etiqueta(im)
    px = im.load()
    color = color_texto(px, (x0, y0, x1, y1))

    # Las tildes (Á, Ñ) a veces quedan separadas del renglón por un píxel:
    # se borran aparte, solo lo que tenga el color de la tinta.
    alto = y1 - y0 + 1
    for y in range(max(0, y0 - int(alto * 0.45)), y0):
        for x in range(x0, x1 + 1):
            p = px[x, y]
            if oscuro(p) and sum(abs(a - b) for a, b in zip(p[:3], color)) < 120:
                px[x, y] = (255, 255, 255, 255)

    # Alto de letra: el del renglón sin tildes pegadas (filas de arriba con
    # mucha menos tinta que el resto).
    cuenta = [sum(oscuro(px[x, y]) for x in range(x0, x1 + 1)) for y in range(y0, y1 + 1)]
    mediana = sorted(cuenta)[len(cuenta) // 2]
    tope = 0
    while tope < len(cuenta) // 3 and cuenta[tope] < mediana * 0.5:
        tope += 1
    size = tamano_para("H", alto - tope)
    font = ImageFont.truetype(KG, size)
    # Que entre a lo ancho con margen; si no, se achica.
    while size > 6 and font.getlength(txt) > w * 0.92:
        size -= 1
        font = ImageFont.truetype(KG, size)

    d = ImageDraw.Draw(im)
    d.rectangle((x0 - 2, y0 - 2, x1 + 2, y1 + 2), fill=(255, 255, 255, 255))
    # Línea de base: el pie del texto original (son mayúsculas, sin descendentes).
    d.text((w / 2, y1 + 1), txt, font=font, fill=color + (255,), anchor="ms")
    im.save(out, optimize=True)


# ─── Recompensas ─────────────────────────────────────────────────────────────

def componentes(im):
    """Manchas conectadas (alpha > 30) con su caja y sus píxeles."""
    w, h = im.size
    px = im.load()
    visto = [[False] * h for _ in range(w)]
    out = []
    for sx in range(w):
        for sy in range(h):
            if visto[sx][sy] or px[sx, sy][3] <= 30:
                continue
            pila, pts = [(sx, sy)], []
            visto[sx][sy] = True
            while pila:
                x, y = pila.pop()
                pts.append((x, y))
                for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                    if 0 <= nx < w and 0 <= ny < h and not visto[nx][ny] and px[nx, ny][3] > 30:
                        visto[nx][ny] = True
                        pila.append((nx, ny))
            xs = [p[0] for p in pts]
            ys = [p[1] for p in pts]
            out.append(((min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2, pts))
    return out


def borrar(im, pts):
    """Borra la mancha y un halo de 2 px (el antialias queda fuera de la
    mancha y dejaba un fantasma de las letras)."""
    px = im.load()
    w, h = im.size
    for x, y in pts:
        for dx in range(-2, 3):
            for dy in range(-2, 3):
                nx, ny = x + dx, y + dy
                if 0 <= nx < w and 0 <= ny < h:
                    px[nx, ny] = (0, 0, 0, 0)


def color_dominante(im):
    px = im.load()
    w, h = im.size
    return Counter(px[x, y][:3] for x in range(w) for y in range(h) if px[x, y][3] > 240).most_common(1)[0][0]


def lineas_centradas(im, lineas, font, cx, cy, color, gap):
    d = ImageDraw.Draw(im)
    altos = [font.getbbox(l, anchor="ls") for l in lineas]
    alto_linea = max(b[3] - b[1] for b in altos)
    total = alto_linea * len(lineas) + gap * (len(lineas) - 1)
    y = cy - total / 2 + alto_linea
    for l in lineas:
        d.text((cx, y), l, font=font, fill=color + (255,), anchor="ms")
        y += alto_linea + gap


def traducir_lo_lograste(path, lineas, out):
    # Se trabaja a 4x para que el texto nuevo no quede pixelado; los rayos se
    # reescalan de la original.
    src = Image.open(path).convert("RGBA")
    color = color_dominante(src)
    w, h = src.size
    for cx, cy, pts in componentes(src):
        # Las letras ocupan el centro; los rayos laterales de arriba quedan.
        if 62 <= cy <= 150 and not (cy < 92 and (cx < 62 or cx > 165)):
            borrar(src, pts)
    k = 4
    im = src.resize((w * k, h * k), Image.LANCZOS)
    font_path = os.path.join(FONTS, "Nunito-ExtraBold.woff")
    size = 160
    font = ImageFont.truetype(font_path, size)
    while max(font.getlength(l) for l in lineas) > 172 * k:
        size -= 2
        font = ImageFont.truetype(font_path, size)
    lineas_centradas(im, lineas, font, w * k / 2, 106 * k, color, 6 * k)
    im.resize((w * 2, h * 2), Image.LANCZOS).save(out, optimize=True)


def traducir_comienza(path, texto, out):
    src = Image.open(path).convert("RGBA")
    w, h = src.size
    texto_cx = []
    for cx, cy, pts in componentes(src):
        if cy < 110:  # el texto; la flecha está abajo
            texto_cx.append(cx)
            borrar(src, pts)
    k = 4
    im = src.resize((w * k, h * k), Image.LANCZOS)
    font = ImageFont.truetype(os.path.join(FONTS, "Nunito-Regular.woff"), 31 * k)
    ImageDraw.Draw(im).text((w * k / 2, 98 * k), texto, font=font, fill=(0, 0, 0, 255), anchor="ms")
    im.resize((w * 2, h * 2), Image.LANCZOS).save(out, optimize=True)


def main():
    for idioma, i in (("en", 1), ("pt", 2)):
        dir_icons = os.path.join(ICONS, idioma)
        os.makedirs(dir_icons, exist_ok=True)
        for nombre in sorted(os.listdir(ICONS)):
            if not nombre.endswith(".png"):
                continue
            k = clave(nombre)
            if not k:
                print("sin traducción, se omite:", nombre)
                continue
            fila = ETIQUETAS[k]
            traducir_icono(os.path.join(ICONS, nombre), fila[0], fila[i], os.path.join(dir_icons, nombre))

        dir_rec = os.path.join(RECOMPENSAS, idioma)
        os.makedirs(dir_rec, exist_ok=True)
        lineas = ["YOU", "DID IT!"] if idioma == "en" else ["VOCÊ", "CONSEGUIU!"]
        for g in ("nino", "nina"):
            traducir_lo_lograste(
                os.path.join(RECOMPENSAS, f"lo-lograste-{g}.png"), lineas,
                os.path.join(dir_rec, f"lo-lograste-{g}.png"),
            )
        traducir_comienza(
            os.path.join(RECOMPENSAS, "comienza-aqui.png"),
            "start here" if idioma == "en" else "comece aqui",
            os.path.join(dir_rec, "comienza-aqui.png"),
        )
    print("listo")


if __name__ == "__main__":
    main()
