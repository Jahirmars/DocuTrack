import {Router}  from 'express';
import pool from '../db.js';
import { requireAuth } from '../middlewares/auth.js';
import{upload} from '../middlewares/upload.js';

const router = Router();

router.post('/', requireAuth, async (req, res) => {
  const { nombre, cedula } = req.body;

  if (!nombre || !cedula) {
    return res.status(400).json({ error: 'Nombre y cédula son requeridos' });
  }

  try {
    const inserted = await pool.query(
      `INSERT INTO requests (user_id, request_type, details)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [req.user.id, 'Certificado Docutrack', { nombre, cedula }]
    );

    res.status(201).json(inserted.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear la solicitud' });
    console.error(err);
  }
});

// SUBIR ARCHIVO PDF o imagen
router.post('/:id/upload', requireAuth, upload.single('file'), async (req, res) => {
  const { id } = req.params;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: 'Archivo requerido (PDF o imagen)' });
  }

  try {
    const r = await pool.query('SELECT * FROM requests WHERE id=$1', [id]);
    if (!r.rowCount) {
      return res.status(404).json({ error: 'Solicitud no encontrada' });
    }

    const solicitud = r.rows[0];
    if (solicitud.user_id !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'No autorizado para subir archivos a esta solicitud' });
    }

    // Usar nombre original o generar uno por defecto
    const fileName = file.originalname || `archivo_${Date.now()}`;

    const inserted = await pool.query(
      `INSERT INTO documents (request_id, file_name, file_url, file_type)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [
        id,
        fileName,
        file.path, // URL en Cloudinary
        file.mimetype.includes('pdf') ? 'PDF' : 'IMG'
      ]
    );

    res.status(201).json({
      message: 'Archivo subido correctamente',
      document: inserted.rows[0]
    });

  } catch (err) {
    res.status(500).json({ error: 'Error al subir el archivo' });
  }
});

//Listar documentos de una solicitud
// Listar solicitudes del usuario autenticado (o todas si es ADMIN)
router.get('/', requireAuth, async (req, res) => {
  try {
    let result;

    if (req.user.role === 'ADMIN') {
      // Admin ve todas las solicitudes
      result = await pool.query(
        `SELECT r.id, r.user_id, u.name AS user_name, u.email AS user_email,
                r.request_type, r.status, r.status_note, r.created_at, r.updated_at
         FROM requests r
         JOIN users u ON r.user_id = u.id
         ORDER BY r.created_at DESC`
      );
    } else {
      // Usuario ve solo las suyas
      result = await pool.query(
        `SELECT id, request_type, status, status_note, created_at, updated_at
         FROM requests
         WHERE user_id = $1
         ORDER BY created_at DESC`,
        [req.user.id]
      );
    }

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener las solicitudes' });
  }
});

//Cambiar estado de una solicitud (solo ADMIN)
router.patch('/:id/status', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { status, note } = req.body;

  // Solo ADMIN puede cambiar estado
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Solo un ADMIN puede cambiar el estado' });
  }

  // Validar estado permitido
  const estadosPermitidos = ['Pendiente', 'En revisión', 'Emitido', 'Rechazado', 'Corrección solicitada'];
  if (!estadosPermitidos.includes(status)) {
    return res.status(400).json({ error: `Estado inválido. Debe ser uno de: ${estadosPermitidos.join(', ')}` });
  }

  try {
    const r = await pool.query('SELECT * FROM requests WHERE id=$1', [id]);
    if (!r.rowCount) {
      return res.status(404).json({ error: 'Solicitud no encontrada' });
    }

    const updated = await pool.query(
      `UPDATE requests
       SET status = $1, status_note = $2
       WHERE id = $3
       RETURNING *`,
      [status, note || null, id]
    );

    res.json({
      message: `Estado actualizado a "${status}"`,
      request: updated.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar el estado' });
  }
});

// Ver detalles de una solicitud específica
router.get('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;

  try {
    const r = await pool.query('SELECT * FROM requests WHERE id = $1', [id]);

    if (!r.rowCount) {
      return res.status(404).json({ error: 'Solicitud no encontrada' });
    }

    const solicitud = r.rows[0];

    // Si el usuario no es admin, solo puede ver su propia solicitud
    if (req.user.role !== 'ADMIN' && solicitud.user_id !== req.user.id) {
      return res.status(403).json({ error: 'No autorizado para ver esta solicitud' });
    }

    res.json(solicitud);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener la solicitud' });
  }
});




 export default router;