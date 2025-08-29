import { Router } from 'express';
import pool from '../db.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

/**
 * Vista detallada de una solicitud para ADMIN
 * Incluye datos del solicitante y documentos asociados
 */
router.get('/:id/admin-view', requireAuth, async (req, res) => {
  const { id } = req.params;

  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Solo ADMIN puede ver esta información' });
  }

  try {
    const solicitud = await pool.query(
      `SELECT r.*, u.name AS user_name, u.email AS user_email
       FROM requests r
       JOIN users u ON r.user_id = u.id
       WHERE r.id = $1`,
      [id]
    );

    if (!solicitud.rowCount) {
      return res.status(404).json({ error: 'Solicitud no encontrada' });
    }

    const documentos = await pool.query(
      `SELECT id, file_name, file_url, file_type, uploaded_at
       FROM documents
       WHERE request_id = $1
       ORDER BY uploaded_at DESC`,
      [id]
    );

    res.json({
      solicitud: solicitud.rows[0],
      documentos: documentos.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener datos de la solicitud' });
  }
});

/**
 * Actualizar estado de una solicitud (ADMIN)
 * Estados permitidos: Emitido, Rechazado, Corrección solicitada
 */
router.patch('/:id/status', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Solo ADMIN puede cambiar el estado' });
  }

  const estadosPermitidos = ['Emitido', 'Rechazado', 'Corrección solicitada'];

  if (!estadosPermitidos.includes(status)) {
    return res.status(400).json({ error: `Estado inválido. Permitidos: ${estadosPermitidos.join(', ')}` });
  }

  try {
    const updated = await pool.query(
      `UPDATE requests
       SET status = $1
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );

    if (!updated.rowCount) {
      return res.status(404).json({ error: 'Solicitud no encontrada' });
    }

    res.json({
      message: `Estado actualizado a "${status}"`,
      solicitud: updated.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar el estado' });
  }
});

export default router;