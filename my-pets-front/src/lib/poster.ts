// ==========================================================
// AFICHE "SE BUSCA": se dibuja en un canvas del tamaño de una hoja A4 (150 dpi).
// La misma imagen sirve para la vista previa, para descargar/compartir por WhatsApp
// y para imprimir. No depende del DOM: recibe los datos y las imágenes ya cargadas.
// ==========================================================

export const POSTER_WIDTH = 1240
export const POSTER_HEIGHT = 1754

export type PosterTitle = 'SE BUSCA' | '¿ME VISTE?' | 'PERDIDO'

export type PosterData = {
  title: PosterTitle
  petName: string
  details: string // ej: "Gata · Mestiza · Hembra"
  lostDate: string // ya formateada, ej: "12/11/2026"
  place: string
  message: string
  careNote: string // cuidados especiales; vacío = no se muestra
  phone: string
  reward: boolean
  rewardText: string
}

export type PosterImages = {
  photo: HTMLImageElement | null // foto de la mascota; null = se dibuja a Placo
  placo: HTMLImageElement
  qr: HTMLImageElement
}

const COLORS = {
  red: '#DC2626',
  redDark: '#991B1B',
  ink: '#111827',
  muted: '#4B5563',
  emerald: '#047857',
  amber: '#B45309',
  amberBg: '#FEF3C7',
  redBg: '#FEF2F2',
  line: '#E5E7EB',
}

const BRAND_FONT = '"Space Grotesk", system-ui, sans-serif'
const BODY_FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'

// Espera a que la tipografía de la marca esté lista: si no, el canvas dibuja con la de respaldo
export async function loadPosterFonts() {
  if (!document.fonts) return
  await Promise.all([
    document.fonts.load(`700 120px ${BRAND_FONT}`),
    document.fonts.load(`500 40px ${BRAND_FONT}`),
  ]).catch(() => {})
}

// Carga una imagen permitiendo leerla desde el canvas (Cloudinary envía CORS)
export function loadImage(src: string, crossOrigin = true): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    if (crossOrigin) img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`No se pudo cargar la imagen: ${src}`))
    img.src = src
  })
}

// Convierte un <svg> del DOM (QR, Placo) en una imagen dibujable
export function svgToImage(svg: SVGSVGElement): Promise<HTMLImageElement> {
  const clone = svg.cloneNode(true) as SVGSVGElement
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  const markup = new XMLSerializer().serializeToString(clone)
  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`
  return loadImage(url, false)
}

// Parte un texto en renglones que entren en maxWidth; corta con "…" si pasa de maxLines
function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number) {
  const lines: string[] = []
  for (const paragraph of text.split('\n')) {
    let line = ''
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const test = line ? `${line} ${word}` : word
      if (ctx.measureText(test).width <= maxWidth) {
        line = test
      } else {
        if (line) lines.push(line)
        line = word
      }
    }
    if (line) lines.push(line)
  }
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines)
    let last = kept[maxLines - 1]
    while (last && ctx.measureText(`${last}…`).width > maxWidth) last = last.slice(0, -1)
    kept[maxLines - 1] = `${last.trimEnd()}…`
    return kept
  }
  return lines
}

// Escribe un texto (centrado o alineado) y devuelve la Y donde termina
function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  opts: { x: number; y: number; maxWidth: number; font: string; color: string; lineHeight: number; maxLines?: number; align?: CanvasTextAlign },
) {
  ctx.font = opts.font
  ctx.fillStyle = opts.color
  ctx.textAlign = opts.align ?? 'center'
  ctx.textBaseline = 'top'
  const lines = wrapLines(ctx, text, opts.maxWidth, opts.maxLines ?? 1)
  lines.forEach((line, i) => ctx.fillText(line, opts.x, opts.y + i * opts.lineHeight))
  return opts.y + lines.length * opts.lineHeight
}

// Tamaño de letra más grande (entre max y min) con el que el texto entra en un renglón
function fitFontSize(ctx: CanvasRenderingContext2D, text: string, font: (size: number) => string, max: number, min: number, maxWidth: number) {
  let size = max
  ctx.font = font(size)
  while (size > min && ctx.measureText(text).width > maxWidth) {
    size -= 2
    ctx.font = font(size)
  }
  return size
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
}

// Dibuja la imagen recortada para llenar el cuadro (como object-fit: cover)
function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight)
  const sw = w / scale
  const sh = h / scale
  const sx = (img.naturalWidth - sw) / 2
  const sy = (img.naturalHeight - sh) / 2
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h)
}

export function drawPoster(canvas: HTMLCanvasElement, data: PosterData, images: PosterImages) {
  const W = POSTER_WIDTH
  const H = POSTER_HEIGHT
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const M = 80 // margen
  const inner = W - M * 2
  const cx = W / 2

  // Fondo
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, W, H)

  // --- Franja superior roja con el título ---
  const bandH = 320
  ctx.fillStyle = COLORS.red
  ctx.fillRect(0, 0, W, bandH)
  ctx.font = `700 200px ${BRAND_FONT}`
  let titleSize = 200
  while (ctx.measureText(data.title).width > inner && titleSize > 100) {
    titleSize -= 10
    ctx.font = `700 ${titleSize}px ${BRAND_FONT}`
  }
  drawText(ctx, data.title, { x: cx, y: 42, maxWidth: inner, font: `700 ${titleSize}px ${BRAND_FONT}`, color: '#FFFFFF', lineHeight: titleSize })
  drawText(ctx, 'Ayudame a volver a casa', { x: cx, y: 250, maxWidth: inner, font: `500 46px ${BRAND_FONT}`, color: '#FEE2E2', lineHeight: 50 })

  // --- Medimos los textos del medio para saber cuánto lugar le queda a la foto ---
  const footerTop = H - 400
  const when = [data.lostDate && `el ${data.lostDate}`, data.place && `en ${data.place}`].filter(Boolean).join(' ')
  const countLines = (font: string, text: string, maxWidth: number, maxLines: number) => {
    ctx.font = font
    return text.trim() ? wrapLines(ctx, text.trim(), maxWidth, maxLines).length : 0
  }
  const nameText = data.petName.toUpperCase()
  const nameFont = (size: number) => `700 ${size}px ${BRAND_FONT}`
  const nameSize = fitFontSize(ctx, nameText, nameFont, 104, 56, inner)
  const detailsFont = (size: number) => `500 ${size}px ${BODY_FONT}`
  const detailsSize = data.details ? fitFontSize(ctx, data.details, detailsFont, 42, 28, inner) : 42

  let textHeight = 36 + nameSize + 8 // nombre
  if (data.details) textHeight += 4 + detailsSize + 10
  if (when) textHeight += 18 + countLines(`700 42px ${BODY_FONT}`, `Se perdió ${when}`, inner, 2) * 52
  if (data.message.trim()) textHeight += 18 + countLines(`400 38px ${BODY_FONT}`, data.message, inner - 40, 3) * 50
  if (data.careNote.trim()) textHeight += 22 + countLines(`600 34px ${BODY_FONT}`, `Cuidado: ${data.careNote}`, inner - 80, 2) * 44 + 36
  const photoTop = bandH + 44
  const available = footerTop - 30 - photoTop - textHeight
  const photoSize = Math.max(300, Math.min(640, available))

  // --- Foto (o Placo si no hay foto) ---
  const photoX = (W - photoSize) / 2
  const photoY = photoTop
  ctx.save()
  roundRect(ctx, photoX, photoY, photoSize, photoSize, 48)
  ctx.clip()
  if (images.photo) {
    drawCover(ctx, images.photo, photoX, photoY, photoSize, photoSize)
  } else {
    ctx.fillStyle = '#ECFDF5'
    ctx.fillRect(photoX, photoY, photoSize, photoSize)
    const pw = photoSize * 0.56
    const ph = pw * 1.1
    ctx.drawImage(images.placo, cx - pw / 2, photoY + (photoSize - ph) / 2, pw, ph)
  }
  ctx.restore()
  ctx.lineWidth = 10
  ctx.strokeStyle = COLORS.red
  roundRect(ctx, photoX, photoY, photoSize, photoSize, 48)
  ctx.stroke()

  // --- Nombre y datos ---
  let y = photoY + photoSize + 36
  y = drawText(ctx, nameText, { x: cx, y, maxWidth: inner, font: nameFont(nameSize), color: COLORS.ink, lineHeight: nameSize + 8 })
  if (data.details) {
    y = drawText(ctx, data.details, { x: cx, y: y + 4, maxWidth: inner, font: detailsFont(detailsSize), color: COLORS.muted, lineHeight: detailsSize + 10 })
  }

  // Dónde y cuándo
  if (when) {
    y = drawText(ctx, `Se perdió ${when}`, { x: cx, y: y + 18, maxWidth: inner, font: `700 42px ${BODY_FONT}`, color: COLORS.redDark, lineHeight: 52, maxLines: 2 })
  }

  // Mensaje del dueño
  if (data.message.trim()) {
    y = drawText(ctx, data.message.trim(), { x: cx, y: y + 18, maxWidth: inner - 40, font: `400 38px ${BODY_FONT}`, color: COLORS.ink, lineHeight: 50, maxLines: 3 })
  }

  // Cuidados especiales (recuadro)
  if (data.careNote.trim()) {
    ctx.font = `600 34px ${BODY_FONT}`
    const lines = wrapLines(ctx, `Cuidado: ${data.careNote.trim()}`, inner - 80, 2)
    const boxH = lines.length * 44 + 36
    const boxY = y + 22
    ctx.fillStyle = COLORS.redBg
    roundRect(ctx, M, boxY, inner, boxH, 24)
    ctx.fill()
    lines.forEach((line, i) => {
      ctx.fillStyle = COLORS.redDark
      ctx.textAlign = 'center'
      ctx.fillText(line, cx, boxY + 18 + i * 44)
    })
    y = boxY + boxH
  }

  // --- Pie: contacto a la izquierda, QR a la derecha ---
  ctx.strokeStyle = COLORS.line
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(M, footerTop)
  ctx.lineTo(W - M, footerTop)
  ctx.stroke()

  const qrSize = 250
  const qrX = W - M - qrSize
  const qrY = footerTop + 36
  ctx.drawImage(images.qr, qrX, qrY, qrSize, qrSize)
  drawText(ctx, 'Escaneá para ver', { x: qrX + qrSize / 2, y: qrY + qrSize + 10, maxWidth: qrSize + 40, font: `500 26px ${BODY_FONT}`, color: COLORS.muted, lineHeight: 30 })
  drawText(ctx, 'su ficha y avisar', { x: qrX + qrSize / 2, y: qrY + qrSize + 40, maxWidth: qrSize + 40, font: `500 26px ${BODY_FONT}`, color: COLORS.muted, lineHeight: 30 })

  const leftW = qrX - M - 40
  let ly = footerTop + 44
  if (data.phone.trim()) {
    ly = drawText(ctx, 'Si la/o viste, llamá o escribí al', { x: M, y: ly, maxWidth: leftW, font: `500 36px ${BODY_FONT}`, color: COLORS.muted, lineHeight: 44, align: 'left' })
    ctx.font = `700 92px ${BRAND_FONT}`
    let phoneSize = 92
    while (ctx.measureText(data.phone.trim()).width > leftW && phoneSize > 50) {
      phoneSize -= 4
      ctx.font = `700 ${phoneSize}px ${BRAND_FONT}`
    }
    ly = drawText(ctx, data.phone.trim(), { x: M, y: ly + 6, maxWidth: leftW, font: `700 ${phoneSize}px ${BRAND_FONT}`, color: COLORS.ink, lineHeight: phoneSize + 8, align: 'left' })
  } else {
    ly = drawText(ctx, 'Escaneá el código QR para contactar a su familia', { x: M, y: ly, maxWidth: leftW, font: `700 44px ${BRAND_FONT}`, color: COLORS.ink, lineHeight: 54, maxLines: 3, align: 'left' })
  }

  if (data.reward) {
    const text = data.rewardText.trim() ? `Recompensa: ${data.rewardText.trim()}` : 'Se ofrece recompensa'
    ctx.font = `700 34px ${BODY_FONT}`
    const lines = wrapLines(ctx, text, leftW - 48, 2)
    const boxH = lines.length * 40 + 24
    const boxW = Math.min(leftW, Math.max(...lines.map((l) => ctx.measureText(l).width)) + 48)
    const boxY = ly + 22
    ctx.fillStyle = COLORS.amberBg
    roundRect(ctx, M, boxY, boxW, boxH, 20)
    ctx.fill()
    lines.forEach((line, i) => {
      ctx.fillStyle = COLORS.amber
      ctx.textAlign = 'left'
      ctx.fillText(line, M + 24, boxY + 12 + i * 40)
    })
  }

  // Firma
  const brandY = H - 52
  ctx.drawImage(images.placo, M, brandY - 8, 40, 44)
  drawText(ctx, 'Afiche generado con PetHealth', { x: M + 54, y: brandY, maxWidth: inner, font: `500 26px ${BODY_FONT}`, color: COLORS.muted, lineHeight: 30, align: 'left' })
}
