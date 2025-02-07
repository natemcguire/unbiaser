import { exec } from 'child_process';
import fs from 'fs-extra';
import archiver from 'archiver';

async function buildTestExtension() {
  const buildDir = './extension-test-build';
  const zipFile = './political-compass-test.zip';

  // Clear previous build
  await fs.remove(buildDir);
  await fs.remove(zipFile);
  await fs.mkdir(buildDir);

  // Copy required files
  const filesToCopy = [
    'manifest.json',
    'popup.html',
    'popup.js',
    'content.js',
    'background.js',
    'icons'
  ];

  for (const file of filesToCopy) {
    await fs.copy(`./extension/${file}`, `${buildDir}/${file}`);
  }

  // Create zip
  const output = fs.createWriteStream(zipFile);
  const archive = archiver('zip');

  archive.pipe(output);
  archive.directory(buildDir, false);
  await archive.finalize();

  console.log('Test build created: political-compass-test.zip');
}

buildTestExtension().catch(console.error); 