const PRICES={24:50.6,40:75.9,60:107.8,96:236.5,150:450,216:750,375:2600,600:4750};
const MEAL=0.8,YEAR=0.8*3*365;
export async function onRequest(ctx){
  const cache=caches.default,key=new Request('https://cache.local/flags-api');
  let hit=await cache.match(key);if(hit)return hit;
  try{
    const s=(await (await fetch('https://anatar.com/us-flags',{headers:{'User-Agent':'Mozilla/5.0 flags-or-food'}})).text()).replace(/\\"/g,'"');
    const re=/\{"city":"([^"]+)","state":"([^"]+)","country":"[^"]*","lat":[^,]+,"lng":[^,]+,"flags":(\d+),"sqFt":(\d+)\}/g;
    const seen=new Set(),rows=[];let m;
    while((m=re.exec(s))){const k=m[1]+m[2];if(seen.has(k))continue;seen.add(k);
      const flags=+m[3],sqft=+m[4],each=sqft/flags;let usd,est=false;
      if(PRICES[each])usd=PRICES[each]*flags;else{usd=Math.round(sqft*4750/600*100)/100;est=true}
      rows.push({city:m[1]+', '+m[2],flags,sqft,usd,est,person_months:Math.round(usd/YEAR*120)/10});}
    if(!rows.length)throw new Error('no flag data found on anatar.com');
    const tot=rows.reduce((a,r)=>a+r.usd,0);
    const body=JSON.stringify({rows,total_usd:Math.round(tot*100)/100,total_sqft:rows.reduce((a,r)=>a+r.sqft,0),meals:Math.floor(tot/MEAL),people_year:Math.round(tot/YEAR*10)/10,updated:new Date().toISOString()});
    const res=new Response(body,{headers:{'content-type':'application/json','cache-control':'public, max-age=300'}});
    ctx.waitUntil(cache.put(key,res.clone()));return res;
  }catch(e){return new Response(JSON.stringify({error:String(e)}),{status:502,headers:{'content-type':'application/json'}})}
}