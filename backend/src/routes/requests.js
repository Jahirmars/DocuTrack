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
        file.path, 
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

// Listar solicitudes del usuario autenticado (o todas si es ADMIN)
router.get('/', requireAuth, async (req, res) => {
  try {
    let result;

    if (req.user.role === 'ADMIN') {
  result = await pool.query(
    `SELECT r.id, r.user_id, u.name AS user_name, u.email AS user_email,
      r.request_type, r.status, r.status_note, r.details,
      r.created_at, r.updated_at
     FROM requests r
     JOIN users u ON r.user_id = u.id
     ORDER BY r.created_at DESC`
  );
}
 else {
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
router.patch("/:id/status", requireAuth, async (req, res) => {
  const { id } = req.params;
  let { status, note } = req.body;

  // Solo ADMIN puede cambiar estado
  if (req.user.role !== "ADMIN") {
    return res.status(403).json({ error: "Solo un ADMIN puede cambiar el estado" });
  }

  // Estados que TU DB permite (coincide con la restricción CHECK)
  const ALLOWED_DB = new Set(["Pendiente", "Emitido", "Rechazado"]);

  // Mapeos UI -> DB (lo que se muestra vs lo que acepta la DB)
  const UI_TO_DB = {
    "En revisión": "Pendiente",
    "Corrección solicitada": "Pendiente", // si quieres mapearla a pendiente
  };

  // Mapeo DB -> UI (para responder algo amigable si quieres)
  const DB_TO_UI = (s) => (s === "Pendiente" ? "En revisión" : s);

  // Normaliza el estado entrante
  if (!status || typeof status !== "string") {
    return res.status(400).json({ error: "Estado es requerido" });
  }
  status = UI_TO_DB[status] || status;

  // Valida contra lo que permite la DB
  if (!ALLOWED_DB.has(status)) {
    return res.status(400).json({
      error: `Estado inválido. Debe ser uno de: ${Array.from(ALLOWED_DB).join(", ")}`,
    });
  }

  // Normaliza la nota (opcional)
  if (note != null && typeof note === "string") {
    note = note.trim() || null;
  } else {
    note = null;
  }

  try {
    const exists = await pool.query("SELECT id FROM requests WHERE id=$1", [id]);
    if (!exists.rowCount) {
      return res.status(404).json({ error: "Solicitud no encontrada" });
    }

    const updated = await pool.query(
      `UPDATE requests
       SET status = $1, status_note = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING id, status, status_note, updated_at`,
      [status, note, id]
    );

    const row = updated.rows[0];

    // Respuesta clara: qué se guardó en DB y cómo mostrarlo en la UI
    return res.json({
      ok: true,
      id: row.id,
      status_db: row.status,
      status_ui: DB_TO_UI(row.status),
      status_note: row.status_note,
      updated_at: row.updated_at,
      message: `Estado actualizado a "${DB_TO_UI(row.status)}"`,
    });
  } catch (err) {
    console.error("PATCH /requests/:id/status error:", err);
    return res.status(500).json({ error: "Error al actualizar el estado" });
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

//ruta para obtener el pdf subido por el user
router.get('/:id/file', requireAuth, async (req, res) => {
  const { id } = req.params;

  try {
    const r = await pool.query(
      `SELECT file_url FROM documents WHERE request_id = $1 ORDER BY uploaded_at DESC LIMIT 1`,
      [id]
    );

    if (!r.rowCount || !r.rows[0].file_url) {
      return res.status(404).json({ error: 'Archivo no encontrado o sin URL válida' });
    }

    const { file_url } = r.rows[0];
    res.json({ file_url });
  } catch (err) {
    console.error("Error al obtener archivo:", err);
    res.status(500).json({ error: 'Error interno al recuperar el archivo' });
  }
});



 export default router;