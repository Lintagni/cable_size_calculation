import type { CalcResultPayload } from '../store/aiChatStore'

// Lazy-load jsPDF so it doesn't bloat the initial bundle
async function getPdf() {
  const { jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')
  return { jsPDF, autoTable }
}

const ACCENT = [230, 160, 20] as [number, number, number]   // amber
const OK     = [34,  197,  94] as [number, number, number]  // green
const FAIL   = [239,  68,  68] as [number, number, number]  // red

function header(doc: InstanceType<typeof import('jspdf').jsPDF>, title: string) {
  doc.setFillColor(...ACCENT)
  doc.rect(0, 0, 210, 16, 'F')
  doc.setTextColor(30, 20, 0)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('CableCalc  ·  BS7671 / NFC 33-209 / IEC 60439', 10, 10)
  doc.setTextColor(255, 255, 255)
  doc.text(title, 200, 10, { align: 'right' })
  doc.setTextColor(80, 80, 80)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text(`Generated: ${new Date().toLocaleString()}`, 10, 21)
}

export async function generateReport(payload: CalcResultPayload): Promise<void> {
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

    // Footer
    doc.setFontSize(7)
    doc.setTextColor(160, 160, 160)
    doc.text('CableCalc · AI-assisted calculation · Verify against project-specific conditions before use', 105, 290, { align: 'center' })

    doc.save(`CableCalc-LV-${r.input.description || 'report'}.pdf`)
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
    doc.text('CableCalc · AI-assisted calculation · Verify against project-specific conditions before use', 105, 290, { align: 'center' })
    doc.save(`CableCalc-ABC-report.pdf`)
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
    doc.text('CableCalc · AI-assisted calculation · Verify against project-specific conditions before use', 105, 290, { align: 'center' })
    doc.save(`CableCalc-Busbar-report.pdf`)
  }
}
