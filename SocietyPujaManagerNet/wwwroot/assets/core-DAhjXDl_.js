const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/jspdf.es.min-dQ5sdeqt.js","assets/index-DI06tiVg.js","assets/mui-zF2F5Mg6.js","assets/vendor-Eb6I9DOa.js","assets/index-BhhVEUhy.css"])))=>i.map(i=>d[i]);
import{_ as p,j as g,Q as y}from"./index-DI06tiVg.js";import"./mui-zF2F5Mg6.js";import"./vendor-Eb6I9DOa.js";function u(i){return new Promise(n=>{const e=i.querySelectorAll("img");if(e.length===0){setTimeout(n,100);return}let c=0;const o=()=>{c++,c>=e.length&&n()};e.forEach(t=>{t.complete?o():(t.onload=o,t.onerror=o)}),setTimeout(n,2e3)})}function E(i){const n=i.match(/<title>(.*?)<\/title>/i),e=n?n[1]:null;if(y()){const r=window.open("","_blank");if(r){r.document.open(),r.document.write(i),r.document.close(),setTimeout(()=>{r.focus(),r.print(),r.close()},500);return}}const o=document.getElementById("__print_frame__");o&&o.remove();const t=document.createElement("iframe");t.id="__print_frame__",t.style.position="fixed",t.style.right="0",t.style.bottom="0",t.style.width="1px",t.style.height="1px",t.style.opacity="0",t.style.pointerEvents="none",t.style.border="none",document.body.appendChild(t);let a=i;a.trim().toLowerCase().startsWith("<!doctype")||(a=`<!DOCTYPE html>
`+a),a=a.replace(/<\/head>/i,`
    <style>
      *, *::before, *::after { box-sizing: border-box; }
      table { border-collapse: collapse !important; border-spacing: 0 !important; }
      th, td { 
        padding: 4px 8px !important; 
        line-height: 1.3 !important; 
        height: auto !important; 
        margin: 0 !important;
      }
      p, h1, h2, h3, h4, h5, h6 { margin-top: 0; margin-bottom: 0.5em; }
    </style>
  </head>`);const h=new Blob([a],{type:"text/html;charset=utf-8"}),l=URL.createObjectURL(h);t.onload=()=>{const r=t.contentDocument||t.contentWindow.document;let d=!1;const f=()=>{if(d)return;d=!0;const _=document.title;e&&(document.title=e);const m=()=>{e&&document.title===e&&(document.title=_),URL.revokeObjectURL(l)};t.contentWindow.onafterprint=m,t.contentWindow.focus(),t.contentWindow.print(),setTimeout(m,1e4)};u(r).then(f)},t.src=l}async function L(i){const n=await w(i),e=n.toDataURL("image/jpeg",1),{jsPDF:c}=await p(async()=>{const{jsPDF:a}=await import("./jspdf.es.min-dQ5sdeqt.js").then(s=>s.j);return{jsPDF:a}},__vite__mapDeps([0,1,2,3,4])),o=n.width>n.height?"landscape":"portrait",t=new c({orientation:o,unit:"px",format:[n.width,n.height]});return t.addImage(e,"JPEG",0,0,n.width,n.height),t}async function w(i){const n=(await p(async()=>{const{default:t}=await import("./html2canvas.esm-CBrSDip1.js");return{default:t}},[])).default,e=document.createElement("div");e.style.position="fixed",e.style.top="-9999px",e.style.left="-9999px",e.style.zIndex="-1",e.innerHTML=i,document.body.appendChild(e),await u(e);const c=e.firstElementChild||e,o=await n(c,{useCORS:!0,scale:2,backgroundColor:g.white});return document.body.removeChild(e),o}export{w as generateImageFromHTML,L as generatePDFFromHTML,E as printHTML};
