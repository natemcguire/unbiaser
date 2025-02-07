import { watch } from 'chokidar';
import { exec } from 'child_process';
import lodash from 'lodash';
const { debounce } = lodash;

const buildExtension = () => {
  console.log('\n🔨 Building extension...');
  exec('node scripts/build-extension.ts', (error, stdout, stderr) => {
    if (error) {
      console.error('❌ Build failed:', error);
      return;
    }
    if (stderr) {
      console.error('⚠️ Build warnings:', stderr);
    }
    console.log('✅ Build complete:', stdout);
    console.log('👀 Watching for changes...\n');
  });
};

// Debounce build to prevent multiple builds when multiple files change
const debouncedBuild = debounce(buildExtension, 500);

console.log('🚀 Starting development build...');
buildExtension();

// Watch for changes in extension directory
const watcher = watch('extension/**/*', {
  ignored: /(^|[\/\\])\../, // ignore dotfiles
  persistent: true
});

watcher
  .on('change', path => {
    console.log(`📝 ${path} changed`);
    debouncedBuild();
  })
  .on('add', path => {
    console.log(`➕ ${path} added`);
    debouncedBuild();
  })
  .on('unlink', path => {
    console.log(`➖ ${path} removed`);
    debouncedBuild();
  });

// Handle exit
process.on('SIGINT', () => {
  console.log('\n👋 Stopping development build...');
  watcher.close();
  process.exit(0);
}); 