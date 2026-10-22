import type { ReportModel } from './buildReportModel';
// Fuente estándar WinAnsi: conservar acentos y ñ; sustituir símbolos no soportados.
export function pdfText(value: string): string {
    return value.normalize('NFC').replace(/[\u2010-\u2015]/g, '-').replace(/[←→↔]/g, ' -> ').replace(/≤/g, ' <= ').replace(/≥/g, ' >= ').replace(/[•●·]/g, ' - ').replace(/…/g, '...').replace(/[^\x20-\x7E\xA0-\xFF\n\r]/g, '?');
}
export async function renderReportPdf(model: ReportModel) {
    const [{ jsPDF }, { autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4', compress: true });
    doc.setProperties({ title: pdfText(model.title), subject: 'Prototipo académico - Protección de datos', author: 'ComplianceData / AndeClass', creator: 'ComplianceData' });
    doc.setLanguage('es');
    doc.setCreationDate(new Date(model.generatedAt));
    const width = doc.internal.pageSize.getWidth();
    const height = doc.internal.pageSize.getHeight();
    const margin = 15;
    doc.setFillColor(31, 56, 100);
    doc.rect(0, 0, width, 60, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(30);
    doc.text('ComplianceData', margin, 30);
    doc.setFontSize(16);
    doc.text('Expediente de cumplimiento', margin, 45);
    doc.setTextColor(31, 56, 100);
    doc.setFontSize(19);
    doc.text(pdfText(model.scenario), margin, 87);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.text(pdfText(`Generado: ${model.generatedLabel}`), margin, 104);
    doc.text(model.clockMode === 'simulated' ? 'Fecha del reloj simulado de la demo' : 'Fecha en modo tiempo real', margin, 115);
    doc.setFontSize(11);
    doc.text('Prototipo académico. No constituye asesoría legal', margin, 139);
    doc.text('Derecho Informático - UNDAC', margin, 151);
    const sectionPages: {
        id: string;
        start: number;
        end: number;
    }[] = [];
    const rowLayout: {
        section: string;
        row: number;
        page: number;
        top: number;
        bottom: number;
    }[] = [];
    for (const section of model.sections.filter(item => item.id !== 'cover')) {
        doc.addPage();
        const start = doc.getNumberOfPages();
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(31, 56, 100);
        doc.setFontSize(17);
        doc.text(pdfText(section.title), margin, 29);
        let y = 38;
        if (section.intro) {
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(75, 94, 119);
            doc.setFontSize(9);
            const lines = doc.splitTextToSize(pdfText(section.intro), width - 2 * margin);
            doc.text(lines, margin, y);
            y += lines.length * 4 + 5;
        }
        const widths: Record<string, number[]> = { executive: [70, 197], inventory: [34, 29, 25, 42, 65, 33, 39], providers: [42, 29, 27, 46, 123], findings: [25, 22, 31, 47, 42, 68, 32], incident: [58, 209], timeline: [40, 48, 179], notifications: [31, 23, 22, 25, 25, 32, 31, 49, 29], evidences: [93, 23, 34, 30, 32, 55], audit: [40, 38, 36, 153], sources: [58, 34, 90, 85], verification: [45, 112, 36, 74], limitations: [16, 251] };
        const columnStyles = Object.fromEntries((widths[section.id] || []).map((cellWidth, index) => [index, { cellWidth }]));
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        // Textos excepcionales se dividen en registros de continuación completos, nunca se omiten.
        const body = section.rows.flatMap(row => { const cells = row.map((value, index) => doc.splitTextToSize(pdfText(value), (widths[section.id]?.[index] || 40) - 7) as string[]); const count = Math.max(1, ...cells.map(lines => Math.ceil(lines.length / 35))); return Array.from({ length: count }, (_, part) => cells.map((lines, column) => { const text = lines.slice(part * 35, (part + 1) * 35).join('\n'); return column === 0 && part > 0 ? `${text || pdfText(row[0]).slice(0, 65)}\n[continuación ${part + 1}]` : text; })); });
        if (section.rows.length)
            autoTable(doc, { startY: y, head: [section.headers.map(pdfText)], body, columnStyles, theme: 'striped', margin: { top: 24, bottom: 20, left: margin, right: margin }, styles: { font: 'helvetica', fontSize: 8, cellPadding: section.id === "executive" ? 2 : 3, overflow: 'linebreak', valign: 'top', lineColor: [220, 229, 241], lineWidth: .1 }, headStyles: { fillColor: [31, 56, 100], textColor: 255, fontStyle: 'bold' }, alternateRowStyles: { fillColor: [245, 248, 253] }, rowPageBreak: 'avoid', showHead: 'everyPage', pageBreak: 'auto', didParseCell: data => { const column = { findings: 6, notifications: 8, sources: 1, verification: 2 }[section.id as 'findings' | 'notifications' | 'sources' | 'verification']; if (data.section === 'body' && data.column.index === column) {
                    const text = data.cell.text.join(' ');
                    if (text.startsWith('Fuente oficial')) {
                        data.cell.styles.fillColor = [231, 243, 237];
                        data.cell.styles.textColor = [32, 95, 76];
                    }
                    else if (text.startsWith('Fuente secundaria')) {
                        data.cell.styles.fillColor = [234, 240, 251];
                        data.cell.styles.textColor = [41, 79, 136];
                    }
                    else if (text.startsWith('Por contrastar')) {
                        data.cell.styles.fillColor = [255, 242, 220];
                        data.cell.styles.textColor = [131, 81, 19];
                    }
                } }, didDrawCell: data => {
                    if (data.section === 'body' && data.column.index === 0)
                        rowLayout.push({ section: section.id, row: data.row.index, page: doc.getNumberOfPages(), top: data.cell.y, bottom: data.cell.y + data.cell.height });
                } });
        else {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(11);
            doc.text('Sin registros para esta sección.', margin, y);
        }
        sectionPages.push({ id: section.id, start, end: doc.getNumberOfPages() });
    }
    const total = doc.getNumberOfPages();
    for (let page = 1; page <= total; page++) {
        doc.setPage(page);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(91, 111, 139);
        if (page > 1) {
            doc.text('ComplianceData - Expediente académico', margin, 13);
            doc.setDrawColor(218, 227, 239);
            doc.line(margin, 17, width - margin, 17);
        }
        doc.text('Prototipo académico. No constituye asesoría legal', margin, height - 9);
        doc.text(`Página ${page} de ${total}`, width - margin, height - 9, { align: 'right' });
    }
    return { document: doc, filename: model.filename, pageCount: total, sectionPages, rowLayout };
}
