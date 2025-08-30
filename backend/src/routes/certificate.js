import { Router } from "express";
import pool from "../db.js";
import PDFDocument from "pdfkit";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

// Mantiene la misma funcionalidad del primer código:
// - Autorización (ADMIN o dueño)
// - Solo genera si status === "Emitido"
// - Usa nombre y cédula desde details
// - Devuelve attachment certificado-<id>.pdf
// Con un estilo minimalista y limpio (sin fondos ni composiciones complejas).
router.get("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;

  try {
    const r = await pool.query("SELECT * FROM requests WHERE id=$1", [id]);
    if (!r.rowCount) return res.status(404).json({ error: "Solicitud no encontrada" });

    const solicitud = r.rows[0];

    // Autorización: admin o dueño de la solicitud
    if (req.user.role !== "ADMIN" && solicitud.user_id !== req.user.id) {
      return res.status(403).json({ error: "No autorizado" });
    }

    if (solicitud.status !== "Emitido") {
      return res
        .status(400)
        .json({ error: 'El certificado solo está disponible cuando el estado es "Emitido"' });
    }

    // details seguro (puede venir como JSON o string)
    let details = solicitud.details || {};
    if (typeof details === "string") {
      try {
        details = JSON.parse(details);
      } catch {
        details = {};
      }
    }
    const nombre = details.nombre || "N/D";
    const cedula = details.cedula || "N/D";

    const fechaEmision = new Date().toLocaleDateString("es-PA");
    const certId = `DT-${String(id).padStart(6, "0")}`;

    // Encabezados
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=certificado-${id}.pdf`);

    // Documento PDF
    const doc = new PDFDocument({
      size: "A4",
      margin: 54,
      info: { Title: `Certificado ${certId}`, Author: "DocuTrack" },
    });

    doc.pipe(res);

    // Paleta muy sobria
    const colors = {
      title: "#0f172a", // slate-900
      text: "#1e293b", // slate-800
      mut: "#475569", // slate-600
      line: "#e2e8f0", // slate-200
      brand: "#0891b2", // cyan-700
      success: "#059669", // emerald-600
    };

    // Header simple
    doc
      .fillColor(colors.title)
      .font("Helvetica-Bold")
      .fontSize(14)
      .text("DocuTrack");
    doc
      .moveTo(doc.page.margins.left, doc.y + 6)
      .lineTo(doc.page.width - doc.page.margins.right, doc.y + 6)
      .lineWidth(1)
      .strokeColor(colors.line)
      .stroke();
    doc.moveDown(1);

    // Título
    doc
      .fillColor(colors.brand)
      .font("Helvetica-Bold")
      .fontSize(20)
      .text("CERTIFICADO DE EMISIÓN", { align: "center" });
    doc
      .fillColor(colors.mut)
      .font("Helvetica")
      .fontSize(10.5)
      .text("Documento electrónico válido para constancia y verificación.", { align: "center" });
    doc.moveDown(1.2);

    // Datos del titular (mismo contenido que el original, mejor maquetado)
    doc.fillColor(colors.text).font("Helvetica-Bold").fontSize(12).text("Datos del titular");
    doc.moveDown(0.4);

    const field = (label, value) => {
      const labelWidth = 110;
      const x0 = doc.x;
      const y0 = doc.y;
      doc.fillColor(colors.mut).font("Helvetica").fontSize(10).text(label, x0, y0, { width: labelWidth });
      doc
        .fillColor(colors.text)
        .font("Helvetica-Bold")
        .fontSize(12)
        .text(value, x0 + labelWidth + 8, y0);
      doc.moveDown(0.5);
    };

    field("Nombre:", nombre);
    field("Cédula:", cedula);
    doc.moveDown(0.8);

    // Mensaje central (contenido original conservado)
    doc
      .fillColor(colors.text)
      .font("Helvetica")
      .fontSize(11.5)
      .text("Se certifica que el titular ha completado satisfactoriamente el trámite solicitado.");
    doc.moveDown(0.8);

    // Detalles de emisión (fecha + estado chip simple)
    doc.fillColor(colors.text).font("Helvetica-Bold").fontSize(12).text("Detalles de emisión");
    doc.moveDown(0.4);

    const usableW = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const gap = 16;
    const colW = (usableW - gap) / 2;
    const leftX = doc.x;
    const y = doc.y;
    const boxH = 48;

    // Caja: Fecha
    doc.roundedRect(leftX, y, colW, boxH, 6).lineWidth(1).strokeColor(colors.line).stroke();
    doc.fillColor(colors.mut).font("Helvetica").fontSize(10).text("Fecha de emisión", leftX + 12, y + 9);
    doc.fillColor(colors.text).font("Helvetica-Bold").fontSize(12).text(fechaEmision, leftX + 12, y + 24);

    // Caja: Estado
    const rightX = leftX + colW + gap;
    doc.roundedRect(rightX, y, colW, boxH, 6).lineWidth(1).strokeColor(colors.line).stroke();
    doc.fillColor(colors.mut).font("Helvetica").fontSize(10).text("Estado", rightX + 12, y + 9);

    // Chip emitido
    doc
      .roundedRect(rightX + 12, y + 24, 78, 18, 9)
      .fillColor("#eafaf3")
      .fill()
      .strokeColor("#d1fae5")
      .lineWidth(1)
      .stroke();
    doc
      .fillColor(colors.success)
      .font("Helvetica-Bold")
      .fontSize(10)
      .text("EMITIDO", rightX + 12, y + 25, { width: 78, align: "center" });

    doc.y = y + boxH + 14;

    // Línea separadora
    doc
      .moveTo(doc.page.margins.left, doc.y)
      .lineTo(doc.page.width - doc.page.margins.right, doc.y)
      .lineWidth(1)
      .strokeColor(colors.line)
      .stroke();
    doc.moveDown(1.2);

    // Fecha en texto (como en el original) + ID
    doc.fillColor(colors.mut).font("Helvetica").fontSize(10).text(`Fecha de emisión: ${fechaEmision}`);
    doc.fillColor(colors.mut).font("Helvetica").fontSize(10).text(`ID de certificado: ${certId}`);
    doc.moveDown(2.2);

    // Firma simple (alineada al centro)
    const lineW = 200;
    const centerX =
      (doc.page.width - doc.page.margins.left - doc.page.margins.right) / 2 + doc.page.margins.left;
    const sigY = doc.y + 8;

    doc
      .moveTo(centerX - lineW / 2, sigY)
      .lineTo(centerX + lineW / 2, sigY)
      .lineWidth(1)
      .strokeColor(colors.line)
      .stroke();

    doc
      .fillColor(colors.text)
      .font("Helvetica-Bold")
      .fontSize(10.5)
      .text("Firma autorizada", centerX - lineW / 2, sigY + 6, { width: lineW, align: "center" });

    doc.end();
  } catch (err) {
    console.error(err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Error al generar el certificado" });
    }
  }
});

export default router;