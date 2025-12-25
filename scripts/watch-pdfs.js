#!/usr/bin/env node

/**
 * watch-pdfs.js
 *
 * Surveille le dossier assets/docs/ et met à jour resources.json
 * automatiquement quand un nouveau PDF est ajouté.
 *
 * Usage : node scripts/watch-pdfs.js
 *
 * Auteur: H1m0t3p3
 * Date: 25 décembre 2024
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DOCS_DIR = path.join(__dirname, '..', 'src', 'assets', 'docs');

console.log('👀 Surveillance du dossier assets/docs/...');
console.log('   Dépose un PDF et il sera ajouté automatiquement !\n');

// Lance un premier scan
execSync('node scripts/scan-pdfs.js', {
  cwd: path.join(__dirname, '..'),
  stdio: 'inherit'
});

// Surveille les changements
fs.watch(DOCS_DIR, (eventType, filename) => {
  if (filename && filename.toLowerCase().endsWith('.pdf')) {
    console.log(`\n📄 Détecté: ${filename}`);

    // Attend un peu que le fichier soit complètement copié
    setTimeout(() => {
      execSync('node scripts/scan-pdfs.js', {
        cwd: path.join(__dirname, '..'),
        stdio: 'inherit'
      });
    }, 1000);
  }
});

console.log('\n✅ Watcher actif. Ctrl+C pour arrêter.\n');
