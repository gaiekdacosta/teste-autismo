import jsPDF from 'jspdf'
import type { Teste } from './testes'

export type PdfUserInfo = {
  name?: string
  email?: string
  phone?: string
  birthDate?: string
  gender?: string
}

type RgbColor = {
  r: number
  g: number
  b: number
}

type ScoreInterpretation = {
  label: string
  maxScore: number
  description: string
}

const PAGE_MARGIN = 14
const PRIMARY: RgbColor = { r: 76, g: 175, b: 80 }
const PRIMARY_DARK: RgbColor = { r: 56, g: 142, b: 60 }
const TEXT: RgbColor = { r: 51, g: 51, b: 51 }
const MUTED: RgbColor = { r: 102, g: 102, b: 102 }
const BORDER: RgbColor = { r: 28, g: 28, b: 28 }
const SOFT_SURFACE: RgbColor = { r: 247, g: 250, b: 247 }

export function generateTestResultPDF(teste: Teste, userInfo: PdfUserInfo = {}): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const testeId = getTesteId(teste)
  const score = getTotalScore(teste)
  const interpretation = buildScoreInterpretation(score)

  addHeader(doc)

  let yPosition = 55
  yPosition = addPatientSection(doc, yPosition, teste, userInfo)
  yPosition = addTestSection(doc, yPosition, teste)
  yPosition = addResultAndInterpretationSection(doc, yPosition, score, interpretation)
  // yPosition = addDatesSection(doc, yPosition, teste, generatedAt)
  addValidationAndTechnicianSection(doc, yPosition, testeId)
  addFooter(doc)

  doc.save(buildFilename(teste))
}

function addHeader(doc: jsPDF): void {
  const pageWidth = doc.internal.pageSize.getWidth()

  setFill(doc, PRIMARY)
  doc.rect(0, 0, pageWidth, 50, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(24)
  doc.text('TESTE DE AUTISMO', pageWidth / 2, 24, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.text('DIAGNÓSTICO DE AUTISMO 100% ONLINE', pageWidth / 2, 36, { align: 'center' })
}

function addPatientSection(
  doc: jsPDF,
  yPosition: number,
  teste: Teste,
  userInfo: PdfUserInfo,
): number {
  return addBox(doc, yPosition, 44, () => {
    addSectionTitle(doc, 'Informações do Paciente', yPosition)
    addInfoRow(doc, 'Nome:', getPatientName(teste, userInfo), yPosition + 18)
    addInfoRow(doc, 'E-mail:', userInfo.email || 'Não informado', yPosition + 27)
    addInfoRow(doc, 'Nascimento:', formatDate(getPatientBirthDate(teste, userInfo)), yPosition + 35)
    addInfoRow(doc, 'Gênero:', formatGender(getPatientGender(teste, userInfo)), yPosition + 42)
  })
}

function addTestSection(doc: jsPDF, yPosition: number, teste: Teste): number {
  return addBox(doc, yPosition, 58, () => {
    addSectionTitle(doc, 'Informações do Teste', yPosition)
    addInfoRow(doc, 'Teste:', teste.questionario?.titulo || 'Teste de Autismo', yPosition + 18)

    addWrappedInfoRow(
      doc,
      'Descrição:',
      teste.questionario?.descricao || 'Não informado',
      yPosition + 27,
      3,
    )

    addInfoRow(doc, 'Data de Conclusão:', formatDateTimeWithFallback(teste.finished_at, teste.updated_at), yPosition + 46)
    addInfoRow(doc, 'Documento gerado em:', formatDateTime(new Date()), yPosition + 54)
  })
}

function formatDateTimeWithFallback(date?: string | Date | null, fallback?: string | Date | null): string {
  if (date) return formatDateTime(date)
  if (fallback) return formatDateTime(fallback)
  return 'Não registrada'
}

function addResultAndInterpretationSection(
  doc: jsPDF,
  yPosition: number,
  score: number,
  interpretation: ScoreInterpretation,
): number {
  const columnGap = 3
  const columnWidth = (getContentWidth(doc) - columnGap) / 2
  const height = 50
  const rightX = PAGE_MARGIN + columnWidth + columnGap

  addBoxAt(doc, PAGE_MARGIN, yPosition, columnWidth, height)
  addBoxAt(doc, rightX, yPosition, columnWidth, height)

  addSectionTitle(doc, 'Resultado', yPosition, PAGE_MARGIN, columnWidth, 'center')
  addSectionTitle(doc, 'Interpretação', yPosition, rightX, columnWidth)

  setFill(doc, SOFT_SURFACE)
  setDraw(doc, BORDER)
  doc.roundedRect(PAGE_MARGIN + 2, yPosition + 19, columnWidth - 4, 22, 1.5, 1.5, 'FD')

  setText(doc, TEXT)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text(String(score), PAGE_MARGIN + columnWidth / 2, yPosition + 31, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  setText(doc, MUTED)
  doc.text('Pontos', PAGE_MARGIN + columnWidth / 2, yPosition + 40, { align: 'center' })
  doc.text(`de ${interpretation.maxScore} pontos possíveis`, PAGE_MARGIN + columnWidth / 2, yPosition + 47, { align: 'center' })

  setFill(doc, { r: 241, g: 248, b: 241 })
  setDraw(doc, PRIMARY)
  doc.roundedRect(rightX + 2, yPosition + 19, columnWidth - 4, 12, 1.5, 1.5, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  setText(doc, PRIMARY_DARK)
  doc.text(interpretation.label, rightX + columnWidth / 2, yPosition + 27, { align: 'center' })

  doc.setFontSize(8.4)
  setText(doc, TEXT)
  const lines = doc.splitTextToSize(interpretation.description, columnWidth - 5).slice(0, 6)
  doc.text(lines, rightX + 2, yPosition + 39)

  return yPosition + height + 3
}

/*
function addDatesSection(doc: jsPDF, yPosition: number, teste: Teste, generatedAt: Date): number {
  return addBox(doc, yPosition, 25, () => {
    addInfoRow(doc, 'Data de Análise:', formatDateTime(teste.finished_at || teste.updated_at), yPosition + 9)
    addInfoRow(doc, 'Data de Liberação:', formatDateTime(teste.finished_at || teste.updated_at), yPosition + 17)
    addInfoRow(doc, 'Documento gerado em:', formatDateTime(generatedAt), yPosition + 24)
  })
}
  */

function addValidationAndTechnicianSection(doc: jsPDF, yPosition: number, testeId?: string): void {
  const columnGap = 3
  const columnWidth = (getContentWidth(doc) - columnGap) / 2
  const rightX = PAGE_MARGIN + columnWidth + columnGap
  const height = 60
  const code = buildValidationCode(testeId)
  const credentials = [
    'CRM-SP 256758',
    'Pós-graduado e com experiência em atendimento em TDAH e TEA',
    'Mestrando em Autismo - Madrid, Espanha',
    '4 formações em Psiquiatria pela Harvard University, com ênfase em TDAH e TEA',
    '+ 10.000 atendimentos realizados',
  ]

  addBoxAt(doc, PAGE_MARGIN, yPosition, columnWidth, height)
  addBoxAt(doc, rightX, yPosition, columnWidth, height)

  addSectionTitle(doc, 'Validação do Documento', yPosition, PAGE_MARGIN, columnWidth, 'center')
  addQrPlaceholder(doc, PAGE_MARGIN + 8, yPosition + 15, 22, code)

  doc.setFont('courier', 'bold')
  doc.setFontSize(10)
  setText(doc, TEXT)
  doc.text('Código:', PAGE_MARGIN + 40, yPosition + 24)
  doc.text(code, PAGE_MARGIN + 40, yPosition + 32)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  setText(doc, MUTED)
  doc.text('Escaneie o QR Code ou acesse o site', PAGE_MARGIN + 40, yPosition + 39)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  setText(doc, MUTED)
  doc.text('RESPONSÁVEL TÉCNICO PELO TESTE', rightX + columnWidth / 2, yPosition + 12, { align: 'center' })

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  setText(doc, TEXT)
  doc.text('Dr. Tiago Marinho', rightX + columnWidth / 2, yPosition + 22, { align: 'center' })

  doc.setFontSize(6.4)
  let credentialY = yPosition + 30
  credentials.forEach((credential) => {
    const lines = doc.splitTextToSize(credential, columnWidth - 8)
    doc.text(lines, rightX + columnWidth / 2, credentialY, { align: 'center' })
    credentialY += lines.length * 4 + 1.5
  })
}

function addFooter(doc: jsPDF): void {
  const pageHeight = doc.internal.pageSize.getHeight()
  const pageWidth = doc.internal.pageSize.getWidth()

  setFill(doc, PRIMARY)
  doc.rect(0, pageHeight - 18, pageWidth, 18, 'F')

  doc.setTextColor(20, 20, 20)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  const disclaimer = 'Este teste não possui valor diagnóstico. Para uma avaliação completa e especializada para confirmação do Transtorno do Espectro Autista (TEA), procure acompanhamento profissional.'
  doc.text(doc.splitTextToSize(disclaimer, 160), pageWidth / 2, pageHeight - 11, { align: 'center' })
}

function addBox(doc: jsPDF, yPosition: number, height: number, content: () => void): number {
  addBoxAt(doc, PAGE_MARGIN, yPosition, getContentWidth(doc), height)
  content()
  return yPosition + height + 3
}

function addBoxAt(doc: jsPDF, x: number, y: number, width: number, height: number): void {
  setDraw(doc, BORDER)
  doc.setLineWidth(0.35)
  doc.roundedRect(x, y, width, height, 1.5, 1.5)
}

function addSectionTitle(
  doc: jsPDF,
  title: string,
  yPosition: number,
  xPosition = PAGE_MARGIN,
  width = getContentWidth(doc),
  align: 'left' | 'center' = 'left',
): void {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11.5)
  setText(doc, TEXT)
  const textX = align === 'center' ? xPosition + width / 2 : xPosition + 3
  doc.text(title, textX, yPosition + 10, { align })

  doc.setDrawColor(230, 230, 230)
  doc.setLineWidth(0.5)
  doc.line(xPosition + 3, yPosition + 14, xPosition + width - 3, yPosition + 14)
}

function addInfoRow(doc: jsPDF, label: string, value: string, yPosition: number): void {
  doc.setFontSize(9.5)
  doc.setFont('helvetica', 'bold')
  setText(doc, MUTED)
  doc.text(label, PAGE_MARGIN + 3, yPosition)

  doc.setFont('helvetica', 'normal')
  setText(doc, TEXT)
  if (value) {
    doc.text(value, 78, yPosition)
  }
}

function addWrappedInfoRow(
  doc: jsPDF,
  label: string,
  value: string,
  yPosition: number,
  maxLines: number,
): void {
  doc.setFontSize(9.5)
  doc.setFont('helvetica', 'bold')
  setText(doc, MUTED)
  doc.text(label, PAGE_MARGIN + 3, yPosition)

  doc.setFont('helvetica', 'normal')
  setText(doc, TEXT)
  const lines = doc.splitTextToSize(value || 'Não informado', 112).slice(0, maxLines)
  doc.text(lines, 78, yPosition)
}

function addQrPlaceholder(doc: jsPDF, x: number, y: number, size: number, seed: string): void {
  setFill(doc, { r: 255, g: 255, b: 255 })
  doc.rect(x, y, size, size, 'F')
  setFill(doc, { r: 0, g: 0, b: 0 })

  const cell = size / 9
  const values = seed.split('').map((char) => char.charCodeAt(0))

  for (let row = 0; row < 9; row += 1) {
    for (let col = 0; col < 9; col += 1) {
      const value = values[(row + col) % values.length] ?? 1
      const isMarker = row < 3 && col < 3 || row < 3 && col > 5 || row > 5 && col < 3
      const shouldFill = isMarker || (value + row * 3 + col * 5) % 3 === 0

      if (shouldFill) {
        doc.rect(x + col * cell, y + row * cell, cell * 0.85, cell * 0.85, 'F')
      }
    }
  }
}

function buildScoreInterpretation(score: number): ScoreInterpretation {
  const maxScore = score > 10 ? 50 : 10

  if (maxScore === 10) {
    if (score >= 6) {
      return {
        label: 'Triagem positiva para TEA',
        maxScore,
        description:
          'NÍVEL DE RISCO: ELEVADO. Em escalas AQ-10, pontuações de 6 ou mais são comumente usadas como ponto de corte para indicar necessidade de avaliação especializada.',
      }
    }

    if (score >= 4) {
      return {
        label: 'Resultado limítrofe',
        maxScore,
        description:
          'NÍVEL DE RISCO: MODERADO. A pontuação está próxima do ponto de corte usado em rastreios AQ-10. Recomenda-se considerar histórico, funcionalidade e acompanhamento profissional.',
      }
    }

    return {
      label: 'Baixa probabilidade',
      maxScore,
      description:
        'NÍVEL DE RISCO: BAIXO. A pontuação ficou abaixo do ponto de corte mais utilizado em rastreios AQ-10. Persistindo dúvidas ou prejuízos funcionais, procure avaliação profissional.',
    }
  }

  if (score >= 32) {
    return {
      label: 'Alto risco para TEA',
      maxScore,
      description:
        'NÍVEL DE RISCO: ALTO. Em escalas AQ de 50 pontos, 32 ou mais é um ponto de corte amplamente usado para indicar traços autísticos elevados e necessidade de avaliação especializada.',
    }
  }

  if (score >= 26) {
    return {
      label: 'Indicadores moderados',
      maxScore,
      description:
        'NÍVEL DE RISCO: MODERADO. Em escalas AQ de 50 pontos, resultados entre 26 e 31 costumam indicar traços autísticos relevantes, mas abaixo do corte clássico de 32 pontos.',
    }
  }

  return {
    label: 'Baixa probabilidade',
    maxScore,
    description:
      'NÍVEL DE RISCO: BAIXO. Em escalas AQ de 50 pontos, pontuações abaixo de 26 tendem a indicar menor presença de traços autísticos no rastreio.',
  }
}

function getTotalScore(teste: Teste): number {
  if (typeof teste.pontuacao_total === 'number' && Number.isFinite(teste.pontuacao_total)) {
    return teste.pontuacao_total
  }

  if (typeof teste.pontuacao_total === 'string') {
    const parsedScore = Number(teste.pontuacao_total)
    return Number.isFinite(parsedScore) ? parsedScore : 0
  }

  return 0
}

function getPatientName(_teste: Teste, userInfo: PdfUserInfo): string {
  return userInfo.name || 'Não informado'
}

function getPatientBirthDate(_teste: Teste, userInfo: PdfUserInfo): string | null | undefined {
  return userInfo.birthDate
}

function getPatientGender(_teste: Teste, userInfo: PdfUserInfo): string | null | undefined {
  return userInfo.gender
}

function formatGender(gender?: string | null): string {
  if (!gender) return 'Não informado'

  const normalized = normalizeText(gender)
  const genderMap: Record<string, string> = {
    feminino: 'Feminino',
    female: 'Feminino',
    masculino: 'Masculino',
    male: 'Masculino',
    outro: 'Outro',
    other: 'Outro',
  }

  return genderMap[normalized] || gender
}

function formatDate(date?: string | null): string {
  if (!date) return 'Não informado'
  return new Date(date).toLocaleDateString('pt-BR')
}

function formatDateTime(date?: string | Date | null): string {
  if (!date) return 'Não informado'
  return new Date(date).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function buildFilename(teste: Teste): string {
  const title = teste.questionario?.titulo || 'resultado'
  const testeId = getTesteId(teste)
  const slug = title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

  return `${slug || 'resultado'}-${testeId ? testeId.slice(0, 8) : Date.now()}.pdf`
}

function buildValidationCode(testeId?: string): string {
  if (!testeId) return 'VALIDACAO'
  return testeId.replace(/-/g, '').slice(0, 16).toUpperCase()
}

function getTesteId(teste: Teste): string | undefined {
  return typeof teste.id === 'string' && teste.id.length > 0
    ? teste.id
    : undefined
}

function getContentWidth(doc: jsPDF): number {
  return doc.internal.pageSize.getWidth() - PAGE_MARGIN * 2
}

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function setFill(doc: jsPDF, color: RgbColor): void {
  doc.setFillColor(color.r, color.g, color.b)
}

function setDraw(doc: jsPDF, color: RgbColor): void {
  doc.setDrawColor(color.r, color.g, color.b)
}

function setText(doc: jsPDF, color: RgbColor): void {
  doc.setTextColor(color.r, color.g, color.b)
}
