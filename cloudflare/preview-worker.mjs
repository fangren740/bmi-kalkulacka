// Preview-only Worker: never bind a custom domain. Exact .html URLs must remain 200.
const ROBOTS='User-agent: *\nDisallow: /\n';
function safeHeaders(input){
  const h=new Headers(input);
  h.set('X-Robots-Tag','noindex, nofollow, noarchive');
  h.set('X-Content-Type-Options','nosniff');
  h.set('Referrer-Policy','strict-origin-when-cross-origin');
  return h;
}
export default {
 async fetch(request,env){
   if(request.method!=='GET' && request.method!=='HEAD'){
     return new Response(null,{status:405,headers:safeHeaders({'Allow':'GET, HEAD'})});
   }
   const url=new URL(request.url);
   if(url.pathname==='/robots.txt'){
     return new Response(request.method==='HEAD'?null:ROBOTS,{status:200,headers:safeHeaders({'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'})});
   }
   if(url.pathname==='/')url.pathname='/index.html';
   // Explicit exact-path lookup; Wrangler's html_handling:none stops implicit .html -> extensionless redirects.
   const assetRequest=new Request(url,request);
   const response=await env.ASSETS.fetch(assetRequest);
   return new Response(request.method==='HEAD'?null:response.body,{
     status:response.status,statusText:response.statusText,headers:safeHeaders(response.headers)
   });
 }
};
