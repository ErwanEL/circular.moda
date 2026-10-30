const { PGlite } = require('@electric-sql/pglite');
const assert = require('node:assert/strict');
const fs = require('node:fs');
(async () => {
  const db = new PGlite();
  await db.exec('create role anon; create role authenticated; create table public.users(id bigint primary key); create table public.products(id bigint primary key,owner bigint references users(id)); insert into users values(1),(2); insert into products values(1,1),(2,1),(3,2),(4,1);');
  const sql = fs.readFileSync('docs/sql/seller-storefront.sql','utf8');
  await db.exec(sql); await db.exec(sql);
  await db.exec("update users set boutique_name='Dressing',pinned_product_ids='{2,1}' where id=1");
  for (const value of ['{3}', '{1,1}', '{1,2,3,4}', '{999}', '{NULL}']) {
    await assert.rejects(db.exec(`update users set pinned_product_ids='${value}' where id=1`), e => e.code === '23514');
  }
  await assert.rejects(db.exec("update users set bio=repeat('x',301) where id=1"), e => e.code === '23514');
  // Deleting a selected article must still allow identity/bio edits. Rendering filters stale IDs.
  await db.exec("delete from products where id=2; update users set bio='New bio' where id=1");
  assert.deepEqual((await db.query('select pinned_product_ids from users where id=1')).rows[0].pinned_product_ids, [2,1]);
  await db.exec("update users set pinned_product_ids='{1}' where id=1");
  const locationSql = fs.readFileSync('docs/sql/seller-caba-neighborhoods.sql', 'utf8');
  await db.exec(locationSql); await db.exec(locationSql);
  await db.exec("update users set neighborhood='Palermo' where id=1");
  await assert.rejects(db.exec("update users set city='Rosario' where id=1"), e => e.code === '23514');
  await assert.rejects(db.exec("update users set neighborhood='Olivos' where id=1"), e => e.code === '23514');
  await db.exec('insert into users(id) values(3)');
  assert.equal((await db.query('select city from users where id=3')).rows[0].city, 'Buenos Aires (CABA)');
  await db.close(); console.log('Storefront database checks passed');
})().catch(e=>{console.error(e);process.exitCode=1;});
