import Router  from 'express';
import pool from '../db.js';
import { requireAuth } from '../middlewares/auth.js';

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
      [req.user.id, 'Certificado simple', { nombre, cedula }]
    );

    res.status(201).json(inserted.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear la solicitud' });
  }
});
 export default router;