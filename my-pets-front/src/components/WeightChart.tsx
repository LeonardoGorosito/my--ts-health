import { useId, useMemo, useRef, useState } from 'react'

export type WeightPoint = { id: string; date: string; weightKg: number; note?: string | null }

// Línea #059669 (emerald-600): validada con la guía de visualización contra el fondo
// claro (#ffffff) y el oscuro de las tarjetas (#18181b).
const LINE = '#059669'

const W = 640 // ancho lógico del SVG (se escala al contenedor)
const H = 220
const PAD = { top: 16, right: 16, bottom: 28, left: 44 }

const fmtKg = (kg: number) => `${kg.toLocaleString('es-AR', { maximumFractionDigits: 2 })} kg`
const fmtDate = (iso: string, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }) =>
  new Date(iso).toLocaleDateString('es-AR', { ...opts, timeZone: 'UTC' })

// Escala "redonda" para el eje Y: 3 a 5 marcas en pasos de 0,1 / 0,2 / 0,5 / 1 / 2 / 5 / 10 kg
function niceTicks(min: number, max: number) {
  if (min === max) {
    min -= 1
    max += 1
  }
  const span = max - min
  const raw = span / 4
  const pow = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 5, 10].map((m) => m * pow).find((s) => s >= raw) ?? 10 * pow
  const lo = Math.floor(min / step) * step
  const hi = Math.ceil(max / step) * step
  const ticks: number[] = []
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(Math.round(v * 100) / 100)
  return { lo, hi, ticks }
}

// Gráfico de evolución del peso (una sola serie: sin leyenda, el título de la tarjeta la nombra)
export function WeightChart({ points, petName }: { points: WeightPoint[]; petName: string }) {
  const [active, setActive] = useState<number | null>(null)
  const [showTable, setShowTable] = useState(false)
  const svgRef = useRef<SVGSVGElement>(null)
  const tableId = useId()

  const data = useMemo(() => [...points].sort((a, b) => a.date.localeCompare(b.date)), [points])

  const geo = useMemo(() => {
    const times = data.map((p) => new Date(p.date).getTime())
    const t0 = Math.min(...times)
    const t1 = Math.max(...times)
    const { lo, hi, ticks } = niceTicks(Math.min(...data.map((p) => p.weightKg)), Math.max(...data.map((p) => p.weightKg)))
    const innerW = W - PAD.left - PAD.right
    const innerH = H - PAD.top - PAD.bottom
    const x = (t: number) => PAD.left + (t1 === t0 ? innerW / 2 : ((t - t0) / (t1 - t0)) * innerW)
    const y = (kg: number) => PAD.top + innerH - ((kg - lo) / (hi - lo)) * innerH
    const coords = data.map((p, i) => ({ x: x(times[i]), y: y(p.weightKg) }))
    // Etiquetas del eje X: primera, última y (si hay lugar) una del medio
    const xLabels = data.length <= 2 ? data.map((_, i) => i) : [0, Math.floor((data.length - 1) / 2), data.length - 1]
    return { coords, ticks, y, xLabels }
  }, [data])

  // El mouse se engancha al punto más cercano en X (el área de detección es todo el gráfico)
  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const px = ((e.clientX - rect.left) / rect.width) * W
    let best = 0
    geo.coords.forEach((c, i) => {
      if (Math.abs(c.x - px) < Math.abs(geo.coords[best].x - px)) best = i
    })
    setActive(best)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
    e.preventDefault()
    setActive((a) => {
      const current = a ?? data.length - 1
      return e.key === 'ArrowLeft' ? Math.max(0, current - 1) : Math.min(data.length - 1, current + 1)
    })
  }

  const path = geo.coords.map((c, i) => `${i ? 'L' : 'M'}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ')
  const activePoint = active !== null ? data[active] : null
  const activeCoord = active !== null ? geo.coords[active] : null
  const first = data[0]
  const last = data[data.length - 1]

  return (
    <div>
      <div className="relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="block h-auto w-full touch-none select-none outline-none focus-visible:rounded-lg focus-visible:ring-2 focus-visible:ring-emerald-500"
          role="img"
          aria-label={`Peso de ${petName}: de ${fmtKg(first.weightKg)} el ${fmtDate(first.date)} a ${fmtKg(last.weightKg)} el ${fmtDate(last.date)}, ${data.length} registros. Usá las flechas para recorrer los valores.`}
          tabIndex={0}
          onPointerMove={onPointerMove}
          onPointerLeave={() => setActive(null)}
          onFocus={() => setActive(data.length - 1)}
          onBlur={() => setActive(null)}
          onKeyDown={onKeyDown}
        >
          {/* Grilla y eje Y (tenues) */}
          {geo.ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.left} x2={W - PAD.right} y1={geo.y(t)} y2={geo.y(t)} className="stroke-gray-200 dark:stroke-zinc-800" strokeWidth={1} />
              <text x={PAD.left - 8} y={geo.y(t)} textAnchor="end" dominantBaseline="middle" className="fill-gray-500 dark:fill-gray-400 text-[11px]">
                {t.toLocaleString('es-AR')}
              </text>
            </g>
          ))}

          {/* Eje X: fechas */}
          {geo.xLabels.map((i, k) => (
            <text
              key={data[i].id}
              x={geo.coords[i].x}
              y={H - 8}
              textAnchor={geo.xLabels.length > 1 && k === 0 ? 'start' : geo.xLabels.length > 1 && k === geo.xLabels.length - 1 ? 'end' : 'middle'}
              className="fill-gray-500 dark:fill-gray-400 text-[11px]"
            >
              {fmtDate(data[i].date, { day: 'numeric', month: 'short' })}
            </text>
          ))}

          {/* Línea vertical que sigue al puntero */}
          {activeCoord && (
            <line x1={activeCoord.x} x2={activeCoord.x} y1={PAD.top} y2={H - PAD.bottom} className="stroke-gray-400 dark:stroke-gray-500" strokeWidth={1} />
          )}

          {/* Serie */}
          {data.length > 1 && <path d={path} fill="none" stroke={LINE} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />}
          {geo.coords.map((c, i) => (
            <circle
              key={data[i].id}
              cx={c.x}
              cy={c.y}
              r={active === i ? 6 : 4}
              fill={LINE}
              strokeWidth={2}
              className="stroke-white dark:stroke-zinc-900"
            />
          ))}

          {/* Valor del último registro, rotulado directo (el resto, en el tooltip y la tabla) */}
          {active === null && (
            <text
              x={geo.coords[data.length - 1].x}
              y={geo.coords[data.length - 1].y - 12}
              textAnchor={data.length > 1 ? 'end' : 'middle'}
              className="fill-gray-900 dark:fill-white text-[12px] font-bold"
            >
              {fmtKg(last.weightKg)}
            </text>
          )}
        </svg>

        {/* Tooltip */}
        {activePoint && activeCoord && (
          <div
            role="status"
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg bg-gray-900 px-3 py-2 text-xs text-white shadow-lg dark:bg-white dark:text-gray-900"
            style={{
              left: `${Math.min(Math.max((activeCoord.x / W) * 100, 12), 88)}%`,
              top: `${(activeCoord.y / H) * 100}%`,
              marginTop: -10,
            }}
          >
            <p className="text-sm font-bold">{fmtKg(activePoint.weightKg)}</p>
            <p className="opacity-80">{fmtDate(activePoint.date)}</p>
            {activePoint.note && <p className="mt-0.5 max-w-[180px] opacity-80">{activePoint.note}</p>}
          </div>
        )}
      </div>

      {/* Vista de tabla: los mismos datos sin depender del gráfico */}
      <button
        type="button"
        aria-expanded={showTable}
        aria-controls={tableId}
        onClick={() => setShowTable((v) => !v)}
        className="mt-2 text-xs font-semibold text-emerald-700 hover:underline dark:text-emerald-400"
      >
        {showTable ? 'Ocultar tabla' : 'Ver como tabla'}
      </button>
      {showTable && (
        <table id={tableId} className="mt-2 w-full text-left text-sm">
          <caption className="sr-only">Registros de peso de {petName}</caption>
          <thead>
            <tr className="text-xs text-gray-500 dark:text-gray-400">
              <th scope="col" className="py-1 font-semibold">Fecha</th>
              <th scope="col" className="py-1 text-right font-semibold">Peso</th>
            </tr>
          </thead>
          <tbody>
            {[...data].reverse().map((p) => (
              <tr key={p.id} className="border-t border-gray-100 text-gray-700 dark:border-zinc-800 dark:text-gray-300">
                <td className="py-1">{fmtDate(p.date)}</td>
                <td className="py-1 text-right font-semibold tabular-nums">{fmtKg(p.weightKg)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
