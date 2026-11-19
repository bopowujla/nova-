// Nova service worker: Cache-First. Чтобы выпустить обновление, увеличьте номер в C.
const C='nova-v4';
const CORE=['./','./index.html','./manifest.json','./icon-180.png','./icon-192.png','./icon-512.png','./icon-1024.png'];
const FONT_CSS='https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,400;6..72,500&family=Inter:wght@400;500;600&display=swap';
self.addEventListener('install',e=>{e.waitUntil((async()=>{
  const c=await caches.open(C);
  await c.addAll(CORE);
  try{ // шрифты: сам CSS и все файлы шрифтов из него
    const r=await fetch(FONT_CSS,{mode:'cors'});
    if(r.ok){
      const css=await r.clone().text();
      await c.put(FONT_CSS,r);
      const urls=[...new Set(css.match(/https:\/\/[^)'"\s]+/g)||[])];
      await Promise.all(urls.map(async u=>{try{const f=await fetch(u,{mode:'cors'});if(f.ok)await c.put(u,f)}catch(x){}}));
    }
  }catch(x){}
  self.skipWaiting();
})())});
self.addEventListener('activate',e=>{e.waitUntil((async()=>{
  for(const k of await caches.keys())if(k!==C)await caches.delete(k);
  await self.clients.claim();
})())});
self.addEventListener('fetch',e=>{
  const q=e.request;if(q.method!=='GET')return;
  e.respondWith((async()=>{
    const hit=await caches.match(q,{ignoreSearch:q.mode==='navigate'});
    if(hit)return hit;                       // строго из кэша
    try{
      const res=await fetch(q);
      if(res&&(res.ok||res.type==='opaque')){const c=await caches.open(C);c.put(q,res.clone())}
      return res;
    }catch(err){
      if(q.mode==='navigate')return (await caches.match('./index.html'))||(await caches.match('./'));
      throw err;
    }
  })());
});
