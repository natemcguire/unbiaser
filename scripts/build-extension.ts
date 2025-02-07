import { zip } from 'zip-a-folder';
import { copyFile, mkdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function copyToDir(sourceDir: string, targetDir: string, files: string[]) {
  await mkdir(targetDir, { recursive: true });
  await mkdir(join(targetDir, 'icons'), { recursive: true });

  // Copy main files
  for (const file of files) {
    try {
      await copyFile(
        join(sourceDir, file),
        join(targetDir, file)
      );
      console.log(`Copied ${file} to ${targetDir}`);
    } catch (error) {
      console.error(`Failed to copy ${file}:`, error);
    }
  }

  // Copy icons
  const iconSizes = [16, 32, 48, 128];
  for (const size of iconSizes) {
    await copyFile(
      join(sourceDir, `icons/icon${size}.png`),
      join(targetDir, `icons/icon${size}.png`)
    );
    console.log(`Copied icon${size}.png to ${targetDir}`);
  }
}

async function buildExtension() {
  const sourceDir = join(__dirname, '../extension');
  const distDir = join(__dirname, '../dist/extension');
  const chromeDir = join(__dirname, '../extension-dev'); // For unpacked extension
  
  try {
    // Read package.json for version
    const packageJson = JSON.parse(
      await readFile(join(__dirname, '../package.json'), 'utf8')
    );
    const version = packageJson.version;

    const files = [
      'manifest.json',
      'popup.html',
      'popup.js',
      'styles.css',
      'background.js',
      'content.js'
    ];

    // Copy files to both directories
    await copyToDir(sourceDir, distDir, files);
    await copyToDir(sourceDir, chromeDir, files);

    // Update versions in both directories
    for (const dir of [distDir, chromeDir]) {
      // Update manifest version
      const manifestPath = join(dir, 'manifest.json');
      const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
      manifest.version = version;
      await writeFile(manifestPath, JSON.stringify(manifest, null, 2));

      // Update popup.html version
      const popupPath = join(dir, 'popup.html');
      let popupHtml = await readFile(popupPath, 'utf8');
      popupHtml = popupHtml.replace(
        /<div class="version">.*?<\/div>/,
        `<div class="version">v${version}</div>`
      );
      await writeFile(popupPath, popupHtml);
    }

    console.log('Updated versions');

    // Create zip
    try {
      await zip(distDir, 'public/extension.zip');
      console.log('Created extension.zip');
    } catch (error) {
      console.error('Failed to create zip:', error);
    }

  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

buildExtension(); 