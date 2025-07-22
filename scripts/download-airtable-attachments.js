import fs from 'fs/promises';
import path from 'node:path';
import slugify from 'slugify';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import fsSync from 'node:fs';
dotenv.config({ path: '.env.local' });
console.log('CWD:', process.cwd());
console.log(
  'ENV FILES:',
  fsSync.readdirSync(process.cwd()).filter((f) => f.startsWith('.env'))
);
console.log('AIRTABLE_TOKEN in script:', process.env.AIRTABLE_TOKEN);
import Airtable from 'airtable';

// ① configure
const base = new Airtable({ apiKey: process.env.AIRTABLE_TOKEN }).base(
  process.env.AIRTABLE_BASE_ID
);
const tableName = process.env.AIRTABLE_TABLE_NAME || 'Products';
const outputDir = './public/airtable';

// ② helper – write only if the file doesn’t exist yet
async function download(url, dest) {
  try {
    await fs.access(dest);
    return; // already on disk
  } catch {}
  await fs.mkdir(path.dirname(dest), { recursive: true });
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Bad status ${res.status}`);
  await fs.writeFile(dest, Buffer.from(await res.arrayBuffer()));
  console.log('✔', dest);
}

// ③ main
(async () => {
  const records = await base(tableName).select().all();
  for (const r of records) {
    const attachments = r.get('Images'); // field name is 'Images' in this project
    if (!attachments) continue;

    for (const file of attachments) {
      const ext = path.extname(file.filename); // .png, .jpg, etc.
      const baseName = file.filename.replace(ext, '');
      const fileKey = `${r.id}-${slugify(baseName, { lower: true })}`;
      const local = path.join(outputDir, fileKey + ext);
      await download(file.url, local);
    }
  }
})();
