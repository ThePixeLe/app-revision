/**
 * server.js
 *
 * Mini serveur Express pour l'upload de PDFs.
 *
 * Ce serveur tourne en parallèle d'Angular et permet :
 * - Upload de fichiers PDF vers src/assets/docs/
 * - Liste des PDFs disponibles
 * - Suppression de PDFs
 *
 * Auteur: H1m0t3p3
 * Date: 25 décembre 2024
 */

const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3001;

// Dossier de destination des PDFs
const DOCS_DIR = path.join(__dirname, 'src', 'assets', 'docs');

// Fichier resources.json
const RESOURCES_FILE = path.join(__dirname, 'src', 'assets', 'data', 'resources.json');

// Assure que le dossier existe
if (!fs.existsSync(DOCS_DIR)) {
  fs.mkdirSync(DOCS_DIR, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json());

// Configuration de Multer pour l'upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, DOCS_DIR);
  },
  filename: (req, file, cb) => {
    // Garde le nom original du fichier
    // Remplace les caractères spéciaux pour éviter les problèmes
    const safeName = file.originalname
      .replace(/[^a-zA-Z0-9àâäéèêëïîôùûüç\s\-_.]/g, '')
      .replace(/\s+/g, ' ');
    cb(null, safeName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50 MB max
  },
  fileFilter: (req, file, cb) => {
    // Accepte uniquement les PDFs
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers PDF sont acceptés'), false);
    }
  }
});

// ============================================================
// ROUTES
// ============================================================

/**
 * GET /api/health
 * Vérifie que le serveur est en ligne
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Serveur PDF actif' });
});

/**
 * GET /api/pdfs
 * Liste tous les PDFs dans le dossier docs
 */
app.get('/api/pdfs', (req, res) => {
  try {
    const files = fs.readdirSync(DOCS_DIR)
      .filter(file => file.toLowerCase().endsWith('.pdf'))
      .map(file => {
        const stats = fs.statSync(path.join(DOCS_DIR, file));
        return {
          name: file,
          size: stats.size,
          createdAt: stats.birthtime,
          modifiedAt: stats.mtime
        };
      });

    res.json({ success: true, files });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/upload
 * Upload un fichier PDF
 */
app.post('/api/upload', upload.single('pdf'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Aucun fichier reçu' });
    }

    const filename = req.file.filename;
    console.log(`✅ PDF uploadé: ${filename}`);

    // Ajoute le PDF au fichier resources.json
    addToResourcesJson(filename);

    res.json({
      success: true,
      message: 'PDF uploadé avec succès',
      file: {
        name: filename,
        size: req.file.size,
        path: `/assets/docs/${filename}`
      }
    });
  } catch (error) {
    console.error('❌ Erreur upload:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Ajoute un PDF au fichier resources.json
 */
function addToResourcesJson(filename) {
  try {
    // Charge le fichier resources.json
    let resources = { pdfs: [], links: [] };
    if (fs.existsSync(RESOURCES_FILE)) {
      const content = fs.readFileSync(RESOURCES_FILE, 'utf8');
      resources = JSON.parse(content);
    }

    // Vérifie si le PDF existe déjà
    const exists = resources.pdfs.some(pdf => pdf.filename === filename);
    if (exists) {
      console.log(`📄 PDF déjà dans resources.json: ${filename}`);
      return;
    }

    // Détecte la catégorie depuis le nom du fichier
    const category = detectCategory(filename);

    // Crée le titre à partir du nom du fichier
    const title = filename
      .replace('.pdf', '')
      .replace(/[-_]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Génère un ID unique
    const id = `pdf-${Date.now()}`;

    // Ajoute le nouveau PDF
    const newPdf = {
      id,
      title,
      description: `Document ajouté le ${new Date().toLocaleDateString('fr-FR')}`,
      category,
      filename
    };

    resources.pdfs.push(newPdf);

    // Sauvegarde le fichier
    fs.writeFileSync(RESOURCES_FILE, JSON.stringify(resources, null, 2), 'utf8');
    console.log(`📝 PDF ajouté à resources.json: ${filename}`);

  } catch (error) {
    console.error('❌ Erreur mise à jour resources.json:', error);
  }
}

/**
 * Détecte la catégorie depuis le nom du fichier
 */
function detectCategory(filename) {
  const lower = filename.toLowerCase();

  if (lower.includes('boole') || lower.includes('algebre') || lower.includes('algèbre')) {
    return 'algebre';
  }
  if (lower.includes('algo')) {
    return 'algo';
  }
  if (lower.includes('java')) {
    return 'java';
  }
  if (lower.includes('poo') || lower.includes('objet') || lower.includes('classe')) {
    return 'poo';
  }
  if (lower.includes('sql') || lower.includes('bdd') || lower.includes('base')) {
    return 'bdd';
  }

  return 'general';
}

/**
 * DELETE /api/pdfs/:filename
 * Supprime un PDF
 */
app.delete('/api/pdfs/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filepath = path.join(DOCS_DIR, filename);

    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ success: false, error: 'Fichier non trouvé' });
    }

    fs.unlinkSync(filepath);
    console.log(`🗑️ PDF supprimé: ${filename}`);

    res.json({ success: true, message: 'PDF supprimé' });
  } catch (error) {
    console.error('❌ Erreur suppression:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Gestion des erreurs Multer
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'Fichier trop volumineux (max 50 MB)'
      });
    }
  }
  res.status(500).json({ success: false, error: error.message });
});

// ============================================================
// DÉMARRAGE
// ============================================================

app.listen(PORT, () => {
  console.log('');
  console.log('📁 ═══════════════════════════════════════════');
  console.log('📁  Serveur PDF démarré');
  console.log(`📁  http://localhost:${PORT}`);
  console.log(`📁  Dossier: ${DOCS_DIR}`);
  console.log('📁 ═══════════════════════════════════════════');
  console.log('');
});
