// backend/src/routes/auth.js
import { Router } from 'express';
import pool  from '../db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const router = Router();


// POST /api/auth/register
router.post('/register', async (req, res) => {
     console.log('REQ.BODY:', req.body);
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'name, email y password son requeridos' });
  }

  try {
    // Verificar si el email ya existe
    const exists = await pool.query('SELECT id FROM user WHERE email=$1', [email]);
    if (exists.rowCount > 0) return res.status(409).json({ error: 'Email ya registrado' });

    // Hashear la contraseña
    const hash = await bcrypt.hash(password, 10);

    // Insertar el usuario con role 'USER'
    const inserted = await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1,$2,$3,'USER')
       RETURNING id, name, email, role`,
      [name, email, hash]
    );

    const user = inserted.rows[0];

    // Generar token JWT
    const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ user, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

export default router;
