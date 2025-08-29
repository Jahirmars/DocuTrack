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
  }
});

// DUBIR ARCHIVO PF
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

    const inserted = await pool.query(
      `INSERT INTO documents (request_id, file_url, file_type)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [id, file.path, file.mimetype.includes('pdf') ? 'PDF' : 'IMG']
    );

    res.status(201).json({
      message: 'Archivo subido correctamente',
      document: inserted.rows[0]
    });

    } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al subir el archivo' });
  }
});


//Listar documentos de una solicitud
router.get('/:id/documents', requireAuth, async (req, res) => {
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

    const docs = await pool.query(
      'SELECT * FROM documents WHERE request_id=$1 ORDER BY uploaded_at DESC',
      [id]
    );

    res.json(docs.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener documentos' });
  }
});



 export default router;