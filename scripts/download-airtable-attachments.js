import Airtable from 'airtable';
import fs from 'fs/promises';
import path from 'path';
import slugify from 'slugify';
import fetch from 'node-fetch';

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
      const ext = path.extname(file.filename); // keep .jpg / .png / …
      const fileKey = `${r.id}-${slugify(file.filename, { lower: true })}`;
      const local = path.join(outputDir, fileKey + ext);
      await download(file.url, local);
    }
  }
})();
