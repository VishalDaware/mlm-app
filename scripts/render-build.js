// scripts/render-build.js
// Intended for use in Render's build command. It will:
// - Run `npm install` (Render already does this)
// - If DATABASE_URL starts with 'postgres://' or 'postgresql://', run migrations then generate
// - If DATABASE_URL starts with 'prisma://', skip `prisma migrate deploy` and run `prisma generate --data-proxy`
// - Finally run the Next.js build

const { execSync } = require('child_process');

function getEnv(name) {
  if (process.env[name]) return process.env[name];
  try {
    const fs = require('fs');
    const path = require('path');
    const dotenvPath = path.resolve(__dirname, '..', '.env');
    if (fs.existsSync(dotenvPath)) {
      const content = fs.readFileSync(dotenvPath, 'utf8');
      const match = content.match(new RegExp('^' + name + "=(.*)$", 'm'));
      if (match) return match[1].trim().replace(/^"|"$/g, '');
    }
  } catch (e) {}
  return undefined;
}

try {
  const dbUrl = getEnv('DATABASE_URL') || '';
  if (dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://')) {
    console.log('Detected Postgres URL. Running migrations and prisma generate...');
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    execSync('npx prisma generate', { stdio: 'inherit' });
  } else if (dbUrl.startsWith('prisma://')) {
    console.log('Detected Prisma Data Proxy URL. Skipping migrate; running `prisma generate --data-proxy`...');
    execSync('npx prisma generate --data-proxy', { stdio: 'inherit' });
  } else {
    console.log('No DATABASE_URL detected; running `prisma generate` only (safe default).');
    execSync('npx prisma generate', { stdio: 'inherit' });
  }

  console.log('Running Next.js build...');
  execSync('npm run build', { stdio: 'inherit' });
} catch (err) {
  console.error('render-build failed:', err.message || err);
  process.exit(1);
}
