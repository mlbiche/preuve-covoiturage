import {
  PDFDocument,
  PageSizes,
  StandardFonts,
  rgb,
  PDFPage,
  PDFFont,
  PDFPageDrawTextOptions,
  RotationTypes,
} from 'pdf-lib';

import { provider } from '@ilos/common';
import { MariannePaths } from './assets/marianne';

import {
  PdfCertProviderInterface,
  PdfCertProviderInterfaceResolver,
} from './interfaces/PdfCertProviderInterfaceResolver';
import { PdfTemplateData } from './interfaces/PdfTemplateData';
import { PdfCertRow } from './interfaces/PdfCertRow';

@provider({
  identifier: PdfCertProviderInterfaceResolver,
})
export class PdfCertProvider implements PdfCertProviderInterface {
  private size = 12;
  private tableX = 60;
  private tableY = 460;
  private tableLineHeight = 20;

  private pdfDoc: PDFDocument;
  private page: PDFPage;
  private fonts: {
    regular?: PDFFont;
    bold?: PDFFont;
    italic?: PDFFont;
    monospace?: PDFFont;
  } = {};

  async pdf(data: PdfTemplateData): Promise<Buffer> {
    // Create a new PDFDocument
    this.pdfDoc = await PDFDocument.create();

    // embed fonts
    this.fonts.regular = await this.pdfDoc.embedFont(StandardFonts.Helvetica);
    this.fonts.bold = await this.pdfDoc.embedFont(StandardFonts.HelveticaBold);
    this.fonts.monospace = await this.pdfDoc.embedFont(StandardFonts.Courier);

    // Add a blank page to the document
    this.page = this.pdfDoc.addPage(PageSizes.A4);

    // header
    this.page.drawRectangle({
      x: 28,
      y: 28,
      width: 540,
      height: 614,
      borderWidth: 0.5,
      borderColor: rgb(0.1, 0.1, 0.1),
      color: rgb(1, 1, 1),
    });
    this.marianne({ x: 57, y: 612, scale: 0.06 });
    this.text(data.title, { x: 170, y: 600, size: 15, font: this.fonts.bold });

    this.text("Date d'émission :", { x: 170, y: 564, font: this.fonts.bold });
    this.text(data.certificate.created_at, { x: 280, y: 564 });
    this.text('Opérateur :', { x: 170, y: 548, font: this.fonts.bold });
    this.text(data.data.operator.name, { x: 280, y: 548 });

    this.text(`Période : du ${data.certificate.start_at} au ${data.certificate.end_at}`, { x: 160, y: 511 });

    // table
    for (let i = 0; i < data.data.rows.length; i++) {
      this.drawRow(i, data.data.rows[i]);
    }

    // summary
    const totalY = this.tableY - 13 * this.tableLineHeight;

    this.page.drawRectangle({
      x: this.tableX - 12,
      y: totalY - 1.5 * this.tableLineHeight,
      width: 490,
      height: 2.5 * this.tableLineHeight,
      color: rgb(0.95, 0.95, 0.95),
    });

    this.text('Total :', { x: 60, y: totalY, font: this.fonts.bold });
    this.text(`${data.data.total_km} km`, { x: 360, y: totalY, font: this.fonts.bold });
    this.text(`${this.currency(data.data.total_cost)} €`, { x: 460, y: totalY, font: this.fonts.bold });

    this.text('Reste à charge :', { x: 60, y: totalY - this.tableLineHeight, font: this.fonts.bold });
    this.text(`${this.currency(data.data.remaining)} €`, {
      x: 460,
      y: totalY - this.tableLineHeight,
      font: this.fonts.bold,
    });

    // identification
    this.text("Identification de l'attestation", { x: 48, y: 80, font: this.fonts.bold });
    this.text(`Personne  : ${data.identity}`, { x: 48, y: 60, font: this.fonts.monospace, size: 10 });
    this.text(`Opérateur : ${data.operator}`, { x: 48, y: 44, font: this.fonts.monospace, size: 10 });

    // QR-code
    this.page.drawSvgPath(data.validation.qrcode, { x: 450, y: 128, color: rgb(0, 0, 0), scale: 0.3333 });
    this.text(`Vérifiez la validité de cette attestation sur ${data.validation.url}`, {
      x: 558,
      y: 44,
      size: 9,
      rotate: { type: RotationTypes.Degrees, angle: 90 },
    });

    return Buffer.from(await this.pdfDoc.save());
  }

  private text(str: string, opts: Partial<PDFPageDrawTextOptions> = {}): void {
    const options = {
      font: this.fonts.regular,
      size: this.size,
      color: rgb(0, 0, 0),
      ...opts,
    };

    // positions can be inherited from moveDown(), etc.
    if ('x' in opts) options.x = opts.x;
    if ('y' in opts) options.y = opts.y;

    this.page.drawText(str, options);
  }

  private drawRow(index: number, row: PdfCertRow): void {
    const rowY = this.tableY - index * this.tableLineHeight;

    if (index % 2 === 0) {
      this.page.drawRectangle({
        x: this.tableX - 12,
        y: rowY - 6,
        width: 490,
        height: this.tableLineHeight,
        color: rgb(0.95, 0.95, 0.95),
      });
    }

    this.text(row.month, { x: this.tableX, y: rowY });
    this.text(row.trips, { x: this.tableX + 150, y: rowY });
    this.text(`${row.distance} km`, { x: this.tableX + 300, y: rowY });
    this.text(`${this.currency(row.cost)} €`, { x: this.tableX + 400, y: rowY });
  }

  private marianne(opts: { x: number; y: number; scale: number }): void {
    const { x, y, scale } = opts;
    for (const { fill, path } of MariannePaths) {
      this.page.drawSvgPath(path, { x, y, scale, color: rgb.call(null, ...fill) });
    }
  }

  private currency(nb: number): string {
    return String((nb || 0).toFixed(2)).replace('.', ',');
  }
}
