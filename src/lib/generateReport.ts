import type { CalcResultPayload } from '../store/aiChatStore'
import type { LvCableInput } from '../calculators/lvCableSizing'
import { ladderRows } from './sizeLadder'
import { findTable } from '../data/appendix4'
import { BRAND_NAME } from '../config/brand'

/** Safe filename stem derived from the brand. */
const FILE_PREFIX = BRAND_NAME.replace(/[^A-Za-z0-9]+/g, '-')
const DISCLAIMER_SHORT = 'Design aid — verify against project-specific conditions before use'
import type { BoardResult, BoardMeta, BoardDefaults } from '../calculators/boardSchedule'

/**
 * Project identification carried onto the report.
 *
 * The point of the PDF is that it can go in a project file and be defended to
 * a checker, so it needs to say which circuit on which job it belongs to and
 * who is responsible for it — a bare set of numbers is not a deliverable.
 */
export interface ReportMeta {
  project?: string
  circuitId?: string
  designer?: string
  system?: string
}

const DISCLAIMER =
  'Calculated to BS7671:2018+A2 Appendix 4 and Section 525. This report is a design aid: '
  + 'the designer named above remains responsible for verifying the installation method, '
  + 'ambient temperature, grouping and thermal insulation against site conditions.'

function downloadCsv(rows: string[][], filename: string) {
  const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\r\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

export function generateExcelReport(payload: CalcResultPayload): void {
  if (payload.type === 'lv') {
    const { result: r } = payload
    const res = r.results
    const cf  = r.correctionFactors
    const rows: string[][] = [
      [`${BRAND_NAME} — LV Cable Sizing Report (BS7671:2018+A2)`],
      ['Generated', new Date().toLocaleString()],
      [],
      ['INPUTS'],
      ['Circuit description', r.input.description || '—'],
      ['Voltage (V)', String(r.input.voltage)],
      ['Phases', String(r.input.phases)],
      ['Design current Ib (A)', String(r.input.designCurrent)],
      ['Protective device', r.input.protectiveDevice],
      ['Device rating In (A)', String(r.input.deviceRating)],
      ['Reference method', r.input.referenceMethod],
      ['Cable length (m)', String(r.input.cableLength)],
      ['Insulation', r.input.insulation],
      ['Configuration', r.input.cableConfig],
      ['Conductor material', r.input.conductorMaterial ?? 'copper'],
      ['Parallel circuits', String(r.input.parallelCircuits)],
      ['Ambient temp (°C)', String(r.input.ambientTemp)],
      ['Grouped circuits', String(r.input.groupedCircuits)],
      ['Thermal insulation', r.input.thermalInsulation],
      [],
      ['RESULTS'],
      ['Recommended CSA (mm²)', String(r.recommendedCsa)],
      ['Tabulated rating It (A)', String(res.tabulatedRating)],
      ['Derated rating Iz (A)', res.deRatedRating.toFixed(1)],
      ['Voltage drop (V)', res.voltageDrop.toFixed(3)],
      ['Voltage drop (%)', res.voltageDropPct.toFixed(2)],
      ['VD limit (V)', res.maxAllowedVdrop.toFixed(2)],
      ['VD limit (%)', String(res.maxAllowedVdropPct)],
      ['Compliant', res.compliant ? 'YES' : 'NO'],
      [],
      ['CORRECTION FACTORS'],
      ['Ca (ambient temp)', cf.Ca.toFixed(3)],
      ['Cg (grouping)', cf.Cg.toFixed(3)],
      ['Ci (thermal insulation)', cf.Ci.toFixed(3)],
      ['Cc (device type)', cf.Cc.toFixed(3)],
      ['Combined factor', cf.combined.toFixed(3)],
    ]
    if (!res.compliant) {
      rows.push([], ['FAIL REASONS'])
      res.reasons.forEach(r2 => rows.push([r2]))
    }
    downloadCsv(rows, `${FILE_PREFIX}-LV-${r.input.description || 'report'}.csv`)
    return
  }

  if (payload.type === 'abc') {
    const { result: r } = payload
    const rec = r.recommended
    const rows: string[][] = [
      [`${BRAND_NAME} — ABC Cable Sizing Report (NFC 33-209)`],
      ['Generated', new Date().toLocaleString()],
      [],
      ['INPUTS'],
      ['Design current Ib (A)', String(r.input.designCurrent)],
      ['Voltage (V)', String(r.input.voltage)],
      ['Cable length (m)', String(r.input.cableLength)],
      ['Circuit type', r.input.isLighting ? 'Lighting (3% VD limit)' : 'Power (5% VD limit)'],
      [],
      ['RESULTS'],
      ['Recommended cable', rec.config.label],
      ['Current rating (A)', String(rec.config.currentRating)],
      ['Voltage drop (V)', rec.voltageDrop.toFixed(3)],
      ['Voltage drop (%)', rec.voltageDropPct.toFixed(2)],
      ['VD limit (V)', rec.maxAllowedVdrop.toFixed(2)],
      ['VD limit (%)', String(rec.maxAllowedVdropPct)],
      ['Current OK', rec.currentOk ? 'YES' : 'NO'],
      ['VD OK', rec.vdropOk ? 'YES' : 'NO'],
      ['Compliant', rec.compliant ? 'YES' : 'NO'],
    ]
    if (!rec.compliant) {
      rows.push([], ['FAIL REASONS'])
      rec.reasons.forEach(r2 => rows.push([r2]))
    }
    downloadCsv(rows, `${FILE_PREFIX}-ABC-report.csv`)
    return
  }

  if (payload.type === 'busbar') {
    const { result: r } = payload
    const rec = r.recommended
    const f   = rec.factors
    const rows: string[][] = [
      [`${BRAND_NAME} — Busbar Sizing Report (IEC 60439 / BS EN 61439)`],
      ['Generated', new Date().toLocaleString()],
      [],
      ['INPUTS'],
      ['Design current (A)', String(r.input.designCurrent)],
      ['Voltage (V)', String(r.input.voltage)],
      ['Phases', String(r.input.phases)],
      ['Material', r.input.material],
      ['Installation', r.input.installation],
      ['Arrangement', r.input.arrangement],
      ['Ambient temp (°C)', String(r.input.ambientTemp)],
      ['Bars per phase', String(r.input.barsPerPhase)],
      ['Busbar length (m)', String(r.input.busbarLength)],
      [],
      ['RESULTS'],
      ['Recommended bar', rec.size.label + ' mm'],
      ['CSA (mm²)', String(rec.size.csa)],
      ['Derated per bar (A)', rec.deratedCurrent.toFixed(1)],
      ['Total capacity (A)', rec.totalCurrent.toFixed(0)],
      ['Current density (A/mm²)', rec.currentDensity.toFixed(2)],
      ['Voltage drop (V)', rec.voltageDrop.toFixed(3)],
      ['Voltage drop (%)', rec.voltageDropPct.toFixed(2)],
      ['Compliant', rec.compliant ? 'YES' : 'NO'],
      [],
      ['CORRECTION FACTORS'],
      ['Temperature factor', f.tempFactor.toFixed(3)],
      ['Arrangement factor', f.arrangementFactor.toFixed(3)],
      ['Enclosure factor', f.enclosureFactor.toFixed(3)],
      ['Material factor', f.materialFactor.toFixed(3)],
    ]
    if (!rec.compliant) {
      rows.push([], ['FAIL REASONS'])
      rec.reasons.forEach(r2 => rows.push([r2]))
    }
    downloadCsv(rows, `${FILE_PREFIX}-Busbar-report.csv`)
  }
}

// Lazy-load jsPDF so it doesn't bloat the initial bundle
async function getPdf() {
  const { jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')
  return { jsPDF, autoTable }
}

const ACCENT = [230, 160, 20] as [number, number, number]   // amber
const OK     = [34,  197,  94] as [number, number, number]  // green
const FAIL   = [239,  68,  68] as [number, number, number]  // red

type Pdf = InstanceType<typeof import('jspdf').jsPDF>
/** jspdf-autotable stamps lastAutoTable onto the doc; it isn't in jsPDF's types. */
type AutoTableDoc = { lastAutoTable: { finalY: number } }

/** Which Appendix 4 table the rating was read from, for the reference line. */
function appendix4Table(input: LvCableInput): string {
  return findTable({
    insulation: input.insulation,
    config: input.cableConfig,
    material: input.conductorMaterial ?? 'copper',
    armoured: input.armoured ?? false,
  })?.id ?? 'n/a';
}

/** Wrapped disclaimer pinned to the bottom of the page. */
function footer(doc: Pdf) {
  doc.setFontSize(6.5)
  doc.setTextColor(150, 150, 150)
  doc.setFont('helvetica', 'normal')
  doc.text(doc.splitTextToSize(DISCLAIMER, 190), 10, 283)
  doc.text(`Generated by ${BRAND_NAME}`, 10, 293)
}

function header(doc: Pdf, title: string) {
  doc.setFillColor(...ACCENT)
  doc.rect(0, 0, 210, 16, 'F')
  doc.setTextColor(30, 20, 0)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text(`${BRAND_NAME}  ·  BS7671 / NFC 33-209 / IEC 60439`, 10, 10)
  doc.setTextColor(255, 255, 255)
  doc.text(title, 200, 10, { align: 'right' })
  doc.setTextColor(80, 80, 80)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text(`Generated: ${new Date().toLocaleString()}`, 10, 21)
}

export async function generateReport(payload: CalcResultPayload, meta?: ReportMeta): Promise<void> {
  const { jsPDF, autoTable } = await getPdf()

  if (payload.type === 'lv') {
    const { result: r } = payload
    const res = r.results
    const cf  = r.correctionFactors

    const doc = new jsPDF()
    header(doc, 'LV Cable Sizing Report')

    // ── Summary box ──
    const ok = r.results.compliant
    doc.setFillColor(...(ok ? OK : FAIL))
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.rect(10, 28, 190, 10, 'F')
    doc.text(
      ok ? `✓ COMPLIANT  —  Recommended: ${r.recommendedCsa} mm²  ${r.input.insulation}  ${r.input.cableConfig}  ${r.input.conductorMaterial}`
         : `✗ NON-COMPLIANT  —  ${res.reasons.join(' | ')}`,
      105, 35, { align: 'center' },
    )
    doc.setTextColor(60, 60, 60)

    // ── Circuit details ──
    autoTable(doc, {
      startY: 42,
      head: [['Parameter', 'Value', 'Parameter', 'Value']],
      body: [
        ['Circuit description', r.input.description || '—', 'Voltage', `${r.input.voltage} V (${r.input.phases}φ)`],
        ['Design current  Ib', `${r.input.designCurrent} A`, 'Device rating  In', `${r.input.deviceRating} A`],
        ['Tabulated rating  It', `${res.tabulatedRating} A`, 'Derated rating  Iz', `${res.deRatedRating.toFixed(1)} A`],
        ['Reference method', r.input.referenceMethod, 'Cable length', `${r.input.cableLength} m`],
        ['Insulation', r.input.insulation, 'Configuration', r.input.cableConfig],
        ['Conductor', r.input.conductorMaterial, 'Parallel circuits', String(r.input.parallelCircuits)],
        ['Ambient temp', `${r.input.ambientTemp} °C`, 'Grouped circuits', String(r.input.groupedCircuits)],
        ['Power factor', String(r.input.powerFactor), 'Thermal insulation', r.input.thermalInsulation],
      ],
      theme: 'grid',
      headStyles: { fillColor: ACCENT, textColor: [30, 20, 0], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      alternateRowStyles: { fillColor: [250, 248, 240] },
    })

    const y2 = (doc as any).lastAutoTable.finalY + 6
    // ── Correction factors ──
    autoTable(doc, {
      startY: y2,
      head: [['Ca (temp)', 'Cg (grouping)', 'Ci (insulation)', 'Cc (device)', 'Combined']],
      body: [[
        cf.Ca.toFixed(3), cf.Cg.toFixed(3), cf.Ci.toFixed(3), cf.Cc.toFixed(3), cf.combined.toFixed(3),
      ]],
      theme: 'grid',
      headStyles: { fillColor: [80, 80, 80], textColor: [255, 255, 255], fontSize: 8 },
      bodyStyles: { fontSize: 8, halign: 'center' },
    })

    const y3 = (doc as any).lastAutoTable.finalY + 6
    // ── Voltage drop ──
    const vdOk = res.voltageDropPct <= res.maxAllowedVdropPct
    autoTable(doc, {
      startY: y3,
      head: [['Voltage drop (V)', 'Voltage drop (%)', 'Limit (V)', 'Limit (%)', 'Status']],
      body: [[
        res.voltageDrop.toFixed(3),
        `${res.voltageDropPct.toFixed(2)}%`,
        res.maxAllowedVdrop.toFixed(2),
        `${res.maxAllowedVdropPct}%`,
        vdOk ? '✓ Pass' : '✗ Fail',
      ]],
      theme: 'grid',
      headStyles: { fillColor: [80, 80, 80], textColor: [255, 255, 255], fontSize: 8 },
      bodyStyles: { fontSize: 8, halign: 'center' },
    })

    // ── Size selection ladder ──
    // The sizes that were rejected, and which check rejected them. This is the
    // part a checker actually reads: it shows the selection was not a guess and
    // makes the binding constraint explicit.
    const y4 = (doc as unknown as AutoTableDoc).lastAutoTable.finalY + 6
    const ladder = ladderRows(r)
    if (ladder.length) {
      autoTable(doc, {
        startY: y4,
        head: [['CSA mm²', 'It (A)', 'Iz (A)', 'Iz ≥ In', 'Vd (V)', 'Vd %', 'Vd ≤ limit', 'Outcome']],
        body: ladder.map(row => [
          String(row.csa),
          row.It, row.Iz, row.izOk ? 'Pass' : 'FAIL',
          row.vd, row.vdPct, row.vdOk ? 'Pass' : 'FAIL',
          row.outcome,
        ]),
        theme: 'grid',
        headStyles: { fillColor: [80, 80, 80], textColor: [255, 255, 255], fontSize: 7.5 },
        bodyStyles: { fontSize: 7.5, halign: 'center' },
        columnStyles: { 7: { halign: 'left' } },
        // Highlight the selected row so the eye lands on it first.
        didParseCell: data => {
          if (data.section === 'body' && ladder[data.row.index]?.selected) {
            data.cell.styles.fillColor = [255, 244, 214]
            data.cell.styles.fontStyle = 'bold'
          }
        },
      })
    }

    // ── Responsibility block ──
    const y5 = (doc as unknown as AutoTableDoc).lastAutoTable.finalY + 6
    autoTable(doc, {
      startY: y5,
      head: [['Project', 'Circuit ref', 'System', 'Designed by', 'Date', 'Checked by']],
      body: [[
        meta?.project || '—',
        meta?.circuitId || r.input.description || '—',
        meta?.system || `${r.input.voltage} V ${r.input.phases}φ`,
        meta?.designer || '—',
        new Date().toLocaleDateString('en-GB'),
        '',
      ]],
      theme: 'grid',
      headStyles: { fillColor: ACCENT, textColor: [30, 20, 0], fontStyle: 'bold', fontSize: 7.5 },
      bodyStyles: { fontSize: 8, minCellHeight: 12 },
    })

    // ── Regulation references ──
    const y6 = (doc as unknown as AutoTableDoc).lastAutoTable.finalY + 5
    doc.setFontSize(7)
    doc.setTextColor(110, 110, 110)
    doc.setFont('helvetica', 'normal')
    doc.text(
      [
        `Current rating: BS7671 Appendix 4 Table ${appendix4Table(r.input)}, ${r.input.phases === 3 ? 'three/four-core three-phase' : 'two-core single-phase'} column · Regulation 433.1.1 (In >= Ib, Iz >= In)`,
        'Correction factors: Table 4B1 (Ca), Table 4C1 (Cg), Regulation 523.9 / Table 52.2 (Ci)',
        `Voltage drop: Section 525, Table 4Ab — limit ${res.maxAllowedVdropPct}% of ${r.input.voltage} V nominal`,
      ],
      10, y6,
    )

    footer(doc)
    doc.save(`${FILE_PREFIX}-LV-${meta?.circuitId || r.input.description || 'report'}.pdf`)
    return
  }

  if (payload.type === 'abc') {
    const { result: r } = payload
    const rec = r.recommended

    const doc = new jsPDF()
    header(doc, 'ABC Cable Sizing Report')

    const ok = rec.compliant
    doc.setFillColor(...(ok ? OK : FAIL))
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.rect(10, 28, 190, 10, 'F')
    doc.text(
      ok ? `✓ COMPLIANT  —  Recommended: ${rec.config.label}`
         : `✗ NON-COMPLIANT  —  ${rec.reasons.join(' | ')}`,
      105, 35, { align: 'center' },
    )
    doc.setTextColor(60, 60, 60)

    autoTable(doc, {
      startY: 42,
      head: [['Parameter', 'Value', 'Parameter', 'Value']],
      body: [
        ['Design current  Ib', `${r.input.designCurrent} A`, 'Voltage', `${r.input.voltage} V`],
        ['Cable length', `${r.input.cableLength} m`, 'Circuit type', r.input.isLighting ? 'Lighting (3%)' : 'Power (5%)'],
        ['Selected config', rec.config.label, 'Current rating', `${rec.config.currentRating} A`],
        ['Voltage drop', `${rec.voltageDrop.toFixed(3)} V  (${rec.voltageDropPct.toFixed(2)}%)`, 'VD limit', `${rec.maxAllowedVdrop.toFixed(2)} V  (${rec.maxAllowedVdropPct}%)`],
      ],
      theme: 'grid',
      headStyles: { fillColor: ACCENT, textColor: [30, 20, 0], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      alternateRowStyles: { fillColor: [250, 248, 240] },
    })

    doc.setFontSize(7)
    doc.setTextColor(160, 160, 160)
    doc.text(DISCLAIMER_SHORT, 105, 290, { align: 'center' })
    doc.save(`${FILE_PREFIX}-ABC-report.pdf`)
    return
  }

  if (payload.type === 'busbar') {
    const { result: r } = payload
    const rec = r.recommended
    const f   = rec.factors

    const doc = new jsPDF()
    header(doc, 'Busbar Sizing Report')

    const ok = rec.compliant
    doc.setFillColor(...(ok ? OK : FAIL))
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.rect(10, 28, 190, 10, 'F')
    doc.text(
      ok ? `✓ COMPLIANT  —  Recommended: ${r.input.barsPerPhase} × ${rec.size.label} mm  ${r.input.material}`
         : `✗ NON-COMPLIANT  —  ${rec.reasons.join(' | ')}`,
      105, 35, { align: 'center' },
    )
    doc.setTextColor(60, 60, 60)

    autoTable(doc, {
      startY: 42,
      head: [['Parameter', 'Value', 'Parameter', 'Value']],
      body: [
        ['Design current  Ib', `${r.input.designCurrent} A`, 'Voltage', `${r.input.voltage} V (${r.input.phases}φ)`],
        ['Material', r.input.material, 'Installation', r.input.installation],
        ['Arrangement', r.input.arrangement, 'Ambient temp', `${r.input.ambientTemp} °C`],
        ['Bars per phase', String(r.input.barsPerPhase), 'Busbar length', `${r.input.busbarLength} m`],
        ['Bar size', `${rec.size.label} mm (${rec.size.csa} mm²)`, 'Total capacity', `${rec.totalCurrent.toFixed(0)} A`],
        ['Current density', `${rec.currentDensity.toFixed(2)} A/mm²`, 'Voltage drop', `${rec.voltageDrop.toFixed(3)} V  (${rec.voltageDropPct.toFixed(2)}%)`],
        ['Temp factor', f.tempFactor.toFixed(3), 'Arrangement factor', f.arrangementFactor.toFixed(3)],
        ['Enclosure factor', f.enclosureFactor.toFixed(3), 'Material factor', f.materialFactor.toFixed(3)],
      ],
      theme: 'grid',
      headStyles: { fillColor: ACCENT, textColor: [30, 20, 0], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      alternateRowStyles: { fillColor: [250, 248, 240] },
    })

    doc.setFontSize(7)
    doc.setTextColor(160, 160, 160)
    doc.text(DISCLAIMER_SHORT, 105, 290, { align: 'center' })
    doc.save(`${FILE_PREFIX}-Busbar-report.pdf`)
  }
}

/**
 * Distribution board schedule as a landscape PDF.
 *
 * This is the deliverable the board feature exists to produce: one document
 * covering every way, with the derived grouping factor shown per circuit so a
 * checker can see where each Cg came from.
 */
export async function generateBoardReport(
  board: BoardResult,
  meta: BoardMeta,
  defaults: BoardDefaults,
): Promise<void> {
  const { jsPDF, autoTable } = await getPdf()
  const doc = new jsPDF({ orientation: 'landscape' })

  doc.setFillColor(...ACCENT)
  doc.rect(0, 0, 297, 16, 'F')
  doc.setTextColor(30, 20, 0)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text(`${BRAND_NAME}  ·  BS7671:2018+A2`, 10, 10)
  doc.setTextColor(255, 255, 255)
  doc.text('Distribution Board Schedule', 287, 10, { align: 'right' })

  doc.setTextColor(60, 60, 60)
  autoTable(doc, {
    startY: 22,
    head: [['Project', 'Board ref', 'Location', 'Designer', 'Supply', 'Ambient', 'Date']],
    body: [[
      meta.project || '—',
      meta.boardRef || '—',
      meta.location || '—',
      meta.designer || '—',
      `${defaults.voltage} V ${defaults.phases}φ`,
      `${defaults.ambientTemp} °C`,
      new Date().toLocaleDateString('en-GB'),
    ]],
    theme: 'grid',
    headStyles: { fillColor: ACCENT, textColor: [30, 20, 0], fontStyle: 'bold', fontSize: 7.5 },
    bodyStyles: { fontSize: 8 },
  })

  const rows = board.rows.map(row => {
    const res = row.result?.results
    return [
      row.circuit.ref,
      row.circuit.description || '—',
      row.circuit.designCurrent ? String(row.circuit.designCurrent) : '—',
      row.circuit.deviceRating ? String(row.circuit.deviceRating) : '—',
      row.circuit.cableLength ? String(row.circuit.cableLength) : '—',
      row.circuit.referenceMethod ?? defaults.referenceMethod,
      row.circuit.route || '—',
      row.result ? row.result.correctionFactors.Cg.toFixed(2) : '1.00',
      res ? `${row.result!.recommendedCsa}` : '—',
      res ? res.deRatedRating.toFixed(1) : '—',
      res ? `${res.voltageDropPct.toFixed(2)}%` : '—',
      res ? `${res.maxAllowedVdropPct}%` : '—',
      row.error ? 'ERROR' : res ? (res.compliant ? 'Pass' : 'FAIL') : 'Incomplete',
    ]
  })

  autoTable(doc, {
    startY: (doc as unknown as AutoTableDoc).lastAutoTable.finalY + 5,
    head: [['Way', 'Description', 'Ib', 'In', 'Length', 'Method', 'Route', 'Cg', 'CSA mm²', 'Iz A', 'Vd %', 'Limit', 'Status']],
    body: rows,
    theme: 'grid',
    headStyles: { fillColor: [80, 80, 80], textColor: [255, 255, 255], fontSize: 7.5 },
    bodyStyles: { fontSize: 7.5 },
    columnStyles: { 1: { cellWidth: 46 } },
    didParseCell: data => {
      if (data.section !== 'body') return
      const status = rows[data.row.index]?.[12]
      if (status === 'FAIL' || status === 'ERROR') data.cell.styles.textColor = FAIL
      if (data.column.index === 8) data.cell.styles.fontStyle = 'bold'
    },
  })

  const t = board.totals
  autoTable(doc, {
    startY: (doc as unknown as AutoTableDoc).lastAutoTable.finalY + 5,
    head: [['Circuits', 'Connected load (before diversity)', 'Largest circuit', 'Worst voltage drop', 'Non-compliant']],
    body: [[
      String(t.circuitCount),
      `${t.connectedLoad.toFixed(1)} A`,
      `${t.largestCircuit.toFixed(1)} A`,
      `${t.worstVoltageDropPct.toFixed(2)}%`,
      String(t.nonCompliant),
    ]],
    theme: 'grid',
    headStyles: { fillColor: ACCENT, textColor: [30, 20, 0], fontStyle: 'bold', fontSize: 7.5 },
    bodyStyles: { fontSize: 8, halign: 'center' },
  })

  const y = (doc as unknown as AutoTableDoc).lastAutoTable.finalY + 5
  doc.setFontSize(7)
  doc.setTextColor(110, 110, 110)
  doc.setFont('helvetica', 'normal')
  doc.text(
    [
      'Cg is derived from the Route column: circuits sharing a route are counted as a group per BS7671 Table 4C1. A blank route is treated as a single circuit, Cg = 1.00.',
      'Connected load is the arithmetic sum of design currents before diversity. Apply diversity per BS7671 Appendix 1 before selecting the incoming device.',
    ],
    10, y,
  )

  doc.setFontSize(6.5)
  doc.setTextColor(150, 150, 150)
  doc.text(doc.splitTextToSize(DISCLAIMER, 277), 10, 197)
  doc.text(`Generated by ${BRAND_NAME}`, 10, 205)

  doc.save(`${FILE_PREFIX}-Board-${meta.boardRef || 'schedule'}.pdf`)
}
