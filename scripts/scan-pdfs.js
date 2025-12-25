#!/usr/bin/env node

/**
 * scan-pdfs.js
 *
 * Script pour scanner automatiquement les PDFs et mettre à jour resources.json
 *
 * Usage :
 *   node scripts/scan-pdfs.js
 *   npm run scan-pdfs
 *
 * Ce script :
 * 1. Scanne le dossier assets/docs/
 * 2. Détecte les nouveaux PDFs
 * 3. Déduit la catégorie et le titre depuis le nom du fichier
 * 4. Met à jour resources.json automatiquement
 *
 * Nomenclature recommandée des fichiers :
 * - "Algo XX - Titre du cours.pdf" → catégorie: algo
 * - "Java XX - Titre du cours.pdf" → catégorie: java
 * - "Boole XX - Titre.pdf" → catégorie: algebre
 *
 * Auteur: H1m0t3p3
 * Date: 25 décembre 2024
 */

const fs = require('fs');
const path = require('path');

// Chemins
const DOCS_DIR = path.join(__dirname, '..', 'src', 'assets', 'docs');
const RESOURCES_JSON = path.join(__dirname, '..', 'src', 'assets', 'data', 'resources.json');

/**
 * Détecte la catégorie depuis le nom du fichier
 */
function detectCategory(filename) {
  const lower = filename.toLowerCase();

  // POO - Programmation Orientée Objet
  if (lower.startsWith('poo') || lower.includes('poo') ||
      lower.includes('objet') || lower.includes('classe') ||
      lower.includes('heritage') || lower.includes('polymorphisme') ||
      lower.includes('encapsulation') || lower.includes('interface')) {
    return 'poo';
  }

  // Base de données
  if (lower.startsWith('bdd') || lower.startsWith('sql') || lower.startsWith('db') ||
      lower.includes('base de donn') || lower.includes('database') ||
      lower.includes('mysql') || lower.includes('postgresql') ||
      lower.includes('requete') || lower.includes('select') ||
      lower.includes('table sql')) {
    return 'bdd';
  }

  // Java
  if (lower.startsWith('java') || lower.includes('java')) {
    return 'java';
  }

  // Algorithmique
  if (lower.startsWith('algo') || lower.includes('algorithme') || lower.includes('algo')) {
    return 'algo';
  }

  // Algèbre de Boole
  if (lower.startsWith('boole') || lower.includes('boole') || lower.includes('boolean')) {
    return 'algebre';
  }

  // Autres détections pour algo
  if (lower.includes('condition')) {
    return 'algo';
  }
  if (lower.includes('boucle') || lower.includes('loop')) {
    return 'algo';
  }
  if (lower.includes('tableau') || lower.includes('array')) {
    return 'algo';
  }

  // Par défaut
  return 'algo';
}

/**
 * Génère un titre lisible depuis le nom du fichier
 */
function generateTitle(filename) {
  // Enlève l'extension .pdf
  let title = filename.replace(/\.pdf$/i, '');

  // Enlève les numéros de version (v1.0.0, 1.0.1, etc.)
  title = title.replace(/\s*[-_]?\s*v?\d+\.\d+(\.\d+)?\s*(MD|MA)?$/i, '');

  // Enlève les suffixes comme "1.pdf" ou " 1"
  title = title.replace(/\s+\d+$/, '');

  // Nettoie les underscores et tirets multiples
  title = title.replace(/_/g, ' ').replace(/-/g, ' - ').replace(/\s+/g, ' ').trim();

  return title;
}

/**
 * Génère un ID unique depuis le nom du fichier
 */
function generateId(filename) {
  return 'pdf-' + filename
    .toLowerCase()
    .replace(/\.pdf$/i, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);
}

/**
 * Génère une description basique
 */
function generateDescription(filename, category) {
  const lower = filename.toLowerCase();

  if (lower.includes('exercice')) {
    return 'Exercices pratiques';
  }
  if (lower.includes('introduction') || lower.includes('intro')) {
    return 'Cours d\'introduction';
  }
  if (lower.includes('base') || lower.includes('syntaxe')) {
    return 'Notions de base';
  }
  if (lower.includes('tableau') || lower.includes('array')) {
    return 'Cours sur les tableaux';
  }
  if (lower.includes('scanner')) {
    return 'Utilisation de Scanner pour les entrées';
  }
  if (lower.includes('condition')) {
    return 'Structures conditionnelles';
  }
  if (lower.includes('boucle')) {
    return 'Les boucles (for, while)';
  }
  if (lower.includes('heritage')) {
    return 'Héritage et hiérarchie de classes';
  }
  if (lower.includes('polymorphisme')) {
    return 'Polymorphisme et abstraction';
  }
  if (lower.includes('classe') || lower.includes('objet')) {
    return 'Classes et objets';
  }
  if (lower.includes('sql') || lower.includes('requete')) {
    return 'Requêtes SQL';
  }
  if (lower.includes('mysql') || lower.includes('postgresql')) {
    return 'Base de données relationnelle';
  }

  const categoryLabels = {
    'java': 'Cours Java',
    'algo': 'Cours d\'algorithmique',
    'algebre': 'Algèbre de Boole',
    'poo': 'Programmation Orientée Objet',
    'bdd': 'Base de données'
  };

  return categoryLabels[category] || 'Document PDF';
}

/**
 * Génère des tags depuis le nom du fichier
 */
function generateTags(filename, category) {
  const tags = [category];
  const lower = filename.toLowerCase();

  if (lower.includes('exercice')) tags.push('exercices');
  if (lower.includes('introduction') || lower.includes('intro')) tags.push('introduction');
  if (lower.includes('base')) tags.push('bases');
  if (lower.includes('tableau') || lower.includes('array')) tags.push('tableaux');
  if (lower.includes('condition')) tags.push('conditions');
  if (lower.includes('boucle')) tags.push('boucles');
  if (lower.includes('scanner')) tags.push('scanner');
  if (lower.includes('syntaxe')) tags.push('syntaxe');

  // POO
  if (lower.includes('classe')) tags.push('classes');
  if (lower.includes('objet')) tags.push('objets');
  if (lower.includes('heritage')) tags.push('heritage');
  if (lower.includes('polymorphisme')) tags.push('polymorphisme');
  if (lower.includes('encapsulation')) tags.push('encapsulation');
  if (lower.includes('interface')) tags.push('interfaces');

  // BDD
  if (lower.includes('sql')) tags.push('sql');
  if (lower.includes('select')) tags.push('requetes');
  if (lower.includes('mysql')) tags.push('mysql');
  if (lower.includes('postgresql')) tags.push('postgresql');

  return [...new Set(tags)]; // Supprime les doublons
}

/**
 * Fonction principale
 */
function main() {
  console.log('🔍 Scan des PDFs dans assets/docs/...\n');

  // Vérifie que le dossier existe
  if (!fs.existsSync(DOCS_DIR)) {
    console.error('❌ Dossier non trouvé:', DOCS_DIR);
    process.exit(1);
  }

  // Liste les fichiers PDF
  const files = fs.readdirSync(DOCS_DIR)
    .filter(f => f.toLowerCase().endsWith('.pdf'))
    .sort();

  console.log(`📄 ${files.length} fichiers PDF trouvés\n`);

  // Charge le resources.json existant
  let resources = { pdfs: [], links: [], videos: [], tools: [] };
  if (fs.existsSync(RESOURCES_JSON)) {
    try {
      const content = fs.readFileSync(RESOURCES_JSON, 'utf8');
      resources = JSON.parse(content);
    } catch (e) {
      console.warn('⚠️  Impossible de lire resources.json, création d\'un nouveau fichier');
    }
  }

  // IDs existants
  const existingIds = new Set(resources.pdfs.map(p => p.id));
  const existingFilenames = new Set(resources.pdfs.map(p => p.filename));

  // Nouveaux PDFs à ajouter
  let newCount = 0;

  files.forEach(filename => {
    // Vérifie si le fichier existe déjà
    if (existingFilenames.has(filename)) {
      console.log(`✓ ${filename} (déjà dans resources.json)`);
      return;
    }

    // Génère les métadonnées
    const category = detectCategory(filename);
    const newPdf = {
      id: generateId(filename),
      title: generateTitle(filename),
      filename: filename,
      category: category,
      description: generateDescription(filename, category),
      tags: generateTags(filename, category)
    };

    // Vérifie l'unicité de l'ID
    let uniqueId = newPdf.id;
    let counter = 1;
    while (existingIds.has(uniqueId)) {
      uniqueId = `${newPdf.id}-${counter++}`;
    }
    newPdf.id = uniqueId;

    // Ajoute le PDF
    resources.pdfs.push(newPdf);
    existingIds.add(uniqueId);
    existingFilenames.add(filename);
    newCount++;

    console.log(`✚ ${filename}`);
    console.log(`   → Catégorie: ${category}, Titre: "${newPdf.title}"`);
  });

  // Sauvegarde le fichier JSON
  if (newCount > 0) {
    // Trie par catégorie puis par titre
    resources.pdfs.sort((a, b) => {
      if (a.category !== b.category) {
        const order = { 'algebre': 0, 'algo': 1, 'java': 2 };
        return (order[a.category] || 99) - (order[b.category] || 99);
      }
      return a.title.localeCompare(b.title);
    });

    // Écrit le fichier avec une belle indentation
    const jsonContent = JSON.stringify(resources, null, 2);
    fs.writeFileSync(RESOURCES_JSON, jsonContent, 'utf8');

    console.log(`\n✅ ${newCount} nouveau(x) PDF(s) ajouté(s) à resources.json`);
  } else {
    console.log('\n✅ Aucun nouveau PDF à ajouter');
  }

  console.log(`\n📊 Total: ${resources.pdfs.length} PDFs dans resources.json`);
}

// Exécute le script
main();
