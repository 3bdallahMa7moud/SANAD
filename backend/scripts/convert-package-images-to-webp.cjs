const fs = require('node:fs/promises');
const path = require('node:path');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');

const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const { imageSize } = require('image-size');

const runFile = promisify(execFile);

dotenv.config({
  path: process.env.SANAD_ENV_FILE || '/etc/sanad/sanad.env',
  quiet: true,
});

if (!process.env.DATABASE_URL) {
  const databaseUrl = new URL('postgresql://127.0.0.1:5432');
  databaseUrl.username = process.env.POSTGRES_USER || 'sanad';
  databaseUrl.password = process.env.POSTGRES_PASSWORD || '';
  databaseUrl.pathname = `/${process.env.POSTGRES_DB || 'sanad_db'}`;
  databaseUrl.searchParams.set('schema', 'public');
  process.env.DATABASE_URL = databaseUrl.toString();
}

const prisma = new PrismaClient();
const uploadsDir = path.resolve(
  process.env.SANAD_UPLOADS_DIR || path.join(__dirname, '..', 'uploads'),
);

function resolveUpload(relativePath) {
  const normalized = relativePath.replace(/\\/g, '/').replace(/^\/+/, '');
  const resolved = path.resolve(uploadsDir, normalized);
  const prefix = `${uploadsDir}${path.sep}`;

  if (!resolved.startsWith(prefix)) {
    throw new Error(`Unsafe upload path: ${relativePath}`);
  }

  return { normalized, resolved };
}

async function main() {
  const images = await prisma.package_images.findMany({
    where: { image_path: { endsWith: '.png', mode: 'insensitive' } },
    orderBy: { id: 'asc' },
  });

  let originalBytes = 0;
  let webpBytes = 0;
  let converted = 0;

  for (const image of images) {
    if (image.image_path.startsWith('/images/')) continue;

    const source = resolveUpload(image.image_path);
    const webpPath = source.normalized.replace(/\.png$/i, '.webp');
    const destination = resolveUpload(webpPath);
    const temporaryPath = `${destination.resolved}.tmp-${process.pid}`;
    const sourceStat = await fs.stat(source.resolved);
    const dimensions = imageSize(await fs.readFile(source.resolved));
    if (
      !dimensions.width ||
      !dimensions.height ||
      dimensions.width * dimensions.height > 40_000_000
    ) {
      throw new Error(`Image #${image.id} exceeds the pixel limit`);
    }
    const scale = Math.min(
      1,
      2400 / dimensions.width,
      2400 / dimensions.height,
    );

    await fs.mkdir(path.dirname(destination.resolved), { recursive: true });
    const resizeArguments =
      scale < 1
        ? [
            '-resize',
            String(Math.max(1, Math.round(dimensions.width * scale))),
            String(Math.max(1, Math.round(dimensions.height * scale))),
          ]
        : [];
    await runFile(
      process.env.CWEBP_PATH?.trim() || 'cwebp',
      [
        '-preset',
        'picture',
        '-quiet',
        '-noasm',
        '-q',
        '82',
        '-m',
        '4',
        '-metadata',
        'none',
        '-low_memory',
        ...resizeArguments,
        source.resolved,
        '-o',
        temporaryPath,
      ],
      { maxBuffer: 64 * 1024, timeout: 20_000 },
    );

    await fs.rename(temporaryPath, destination.resolved);

    try {
      await prisma.package_images.update({
        data: { image_path: webpPath },
        where: { id: image.id },
      });
    } catch (error) {
      await fs.rm(destination.resolved, { force: true });
      throw error;
    }

    const destinationStat = await fs.stat(destination.resolved);
    await fs.rm(source.resolved);
    originalBytes += sourceStat.size;
    webpBytes += destinationStat.size;
    converted += 1;
    console.log(
      `Converted package image #${image.id}: ${source.normalized} -> ${webpPath}`,
    );
  }

  console.log(
    JSON.stringify({ converted, originalBytes, webpBytes, uploadsDir }),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
