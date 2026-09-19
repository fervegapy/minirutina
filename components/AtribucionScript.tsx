import { ATRIBUCION_KEY } from "@/lib/atribucion";

/**
 * Guarda de dónde vino la persona (UTMs, fbclid, referrer) en cada carga de
 * página, incluida la landing, que no carga PostHog. Es un <script> inline por
 * lo mismo que el Pixel de Meta: corre antes de hidratar y no suma nada al
 * bundle ni al LCP. Las navegaciones internas no lo vuelven a correr, y está
 * bien: el origen solo viene en la URL con la que se aterriza.
 *
 * Se ignora el referrer de la pasarela de pago (checkout.dlocalgo.com): la
 * vuelta a /confirmacion lo trae y pisaría el origen real.
 *
 * Formato y reglas en lib/atribucion.ts.
 */
export default function AtribucionScript() {
  const snippet = `(function(){try{
if(location.pathname.indexOf('/admin')===0)return;
var q=new URLSearchParams(location.search),t={},hay=false;
['utm_source','utm_medium','utm_campaign','utm_content','utm_term','fbclid','gclid'].forEach(function(k){
var v=q.get(k);if(v){t[k]=v.slice(0,300);hay=true;}});
try{if(document.referrer){
var h=new URL(document.referrer).hostname.replace(/^www\\./,'');
var propio=location.hostname.replace(/^www\\./,'');
if(h!==propio&&!/dlocal/.test(h)){t.referrer=h;hay=true;}}}catch(e){}
t.landing=location.pathname;t.ts=new Date().toISOString();
var a={};try{a=JSON.parse(localStorage.getItem('${ATRIBUCION_KEY}')||'{}')||{};}catch(e){}
if(!a.primero)a.primero=t;
if(hay)a.ultimo=t;
localStorage.setItem('${ATRIBUCION_KEY}',JSON.stringify(a));
}catch(e){}})();`;
  return <script id="atribucion" dangerouslySetInnerHTML={{ __html: snippet }} />;
}
