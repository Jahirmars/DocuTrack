import { Router } from 'express';
import pool from '../db.js';
import PDFDocument from 'pdfkit';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

router.get('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;

  try {
    const r = await pool.query('SELECT * FROM requests WHERE id=$1', [id]);
    if (!r.rowCount) {
      return res.status(404).json({ error: 'Solicitud no encontrada' });
    }

    const solicitud = r.rows[0];

    if (req.user.role !== 'ADMIN' && solicitud.user_id !== req.user.id) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    if (solicitud.status !== 'Emitido') {
      return res.status(400).json({ error: 'El certificado solo está disponible cuando el estado es "Emitido"' });
    }

    const { nombre, cedula } = solicitud.details || {};
    const fechaEmision = new Date().toLocaleDateString('es-PA');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=certificado-${id}.pdf`);

    const doc = new PDFDocument();
    doc.pipe(res);

    doc.fontSize(18).text('CERTIFICADO DOCUTRACK', { align: 'center' });
    doc.moveDown(2);

    doc.fontSize(12).text(`Se certifica que: ${nombre || 'N/D'}`);
    doc.text(`Cédula: ${cedula || 'N/D'}`);
    doc.moveDown();
    doc.text(`Ha completado satisfactoriamente el trámite solicitado.`);
    doc.moveDown();
    doc.text(`Fecha de emisión: ${fechaEmision}`);

    doc.moveDown(3);
    doc.text('_________________________', { align: 'center' });
    doc.text('Firma autorizada', { align: 'center' });

    doc.end();

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al generar el certificado' });
  }
});

export default router;