const { execSync } = require('child_process');

console.log('🗑️ Resetting database...');

try {
  // Reset database with force
  execSync('npx prisma migrate reset --force', { stdio: 'inherit' });
  console.log('✅ Database reset completed!');
} catch (error) {
  console.error('❌ Error resetting database:', error.message);
  process.exit(1);
}
