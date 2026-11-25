export function onRequest({request,next}) {
 const url=new URL(request.url);
 if(url.hostname==='flags-or-food.pages.dev'){url.hostname='flags.yv3.uk';return Response.redirect(url.toString(),301);}
 return next();
}
