/**
 * Build a real .docx from a PolicyPackage using the `docx` npm package.
 *
 * We render via the shared `renderBlocks` so the document stays consistent with
 * the HTML/Markdown exports and the client preview. The disclaimer is always
 * present because `renderBlocks` already appends it.
 *
 * Block -> docx mapping:
 *   h1    -> Title
 *   h2    -> Heading2
 *   h3    -> Heading3
 *   p     -> Paragraph
 *   li    -> bullet Paragraph
 *   table -> Table (header row + body rows)
 */

import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";

import type { Lang, PolicyPackage } from "../../shared/index";
import { renderBlocks } from "../../shared/index";
import type { RenderedBlock, Section } from "../../shared/index";

function cellBorders() {
  const single = { style: BorderStyle.SINGLE, size: 4, color: "CFD6E2" };
  return { top: single, bottom: single, left: single, right: single };
}

function headerCell(text: string): TableCell {
  return new TableCell({
    shading: { fill: "15233F" },
    borders: cellBorders(),
    children: [
      new Paragraph({
        children: [new TextRun({ text, bold: true, color: "FFFFFF" })],
      }),
    ],
  });
}

function bodyCell(text: string): TableCell {
  return new TableCell({
    borders: cellBorders(),
    children: [new Paragraph({ children: [new TextRun({ text })] })],
  });
}

function blockToTable(block: RenderedBlock): Table {
  const head = block.head ?? [];
  const rows = block.rows ?? [];
  const headerRow = new TableRow({
    tableHeader: true,
    children: head.map((h) => headerCell(h)),
  });
  const bodyRows = rows.map(
    (r) => new TableRow({ children: r.map((c) => bodyCell(c)) }),
  );
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...bodyRows],
  });
}

function blocksToChildren(blocks: RenderedBlock[]): (Paragraph | Table)[] {
  const children: (Paragraph | Table)[] = [];
  for (const b of blocks) {
    switch (b.type) {
      case "h1":
        children.push(
          new Paragraph({
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.LEFT,
            children: [new TextRun({ text: b.text ?? "" })],
          }),
        );
        break;
      case "h2":
        children.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: b.text ?? "" })],
          }),
        );
        break;
      case "h3":
        children.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_3,
            children: [new TextRun({ text: b.text ?? "" })],
          }),
        );
        break;
      case "p":
        children.push(
          new Paragraph({ children: [new TextRun({ text: b.text ?? "" })] }),
        );
        break;
      case "li":
        children.push(
          new Paragraph({
            bullet: { level: 0 },
            children: [new TextRun({ text: b.text ?? "" })],
          }),
        );
        break;
      case "table":
        children.push(blockToTable(b));
        // a spacer paragraph after tables for readability
        children.push(new Paragraph({ children: [] }));
        break;
    }
  }
  return children;
}

/**
 * Build a .docx Buffer for the given package/section/language.
 */
export async function buildDocx(
  pkg: PolicyPackage,
  lang: Lang,
  section: Section = "full",
): Promise<Buffer> {
  const blocks = renderBlocks(pkg, lang, section);
  const doc = new Document({
    sections: [{ properties: {}, children: blocksToChildren(blocks) }],
  });
  return Packer.toBuffer(doc);
}
