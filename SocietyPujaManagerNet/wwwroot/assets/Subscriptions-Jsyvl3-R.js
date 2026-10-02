import{j as e,m as Fe,aq as Ne,d as b,aM as we,f as y,I as V,l as he,x as Be,as as ne,at as le,au as re,M as z,V as ge,$ as Lt,a8 as yt,ak as oe,h as pe,k as R,aN as Ot,aO as Ye,aP as We,av as Je,aQ as Me,aR as _t,ay as qt,aj as Ht,aS as Yt,q as xt,L as xe,s as ce,r as Gt,ah as ht,ai as Kt,al as gt,aT as Jt,aU as Vt,aV as Xt,aW as Qt,aX as Ae,aY as I,aZ as Zt,aw as es,a_ as ts,a$ as ss,b0 as ft,b1 as as,b2 as ns,b3 as ls,b4 as rs,b5 as os,aI as D,b6 as is,b7 as cs,ad as ds}from"./mui-zF2F5Mg6.js";import{r,u as ps}from"./vendor-Eb6I9DOa.js";import{printHTML as us,generateImageFromHTML as ms}from"./core-DAhjXDl_.js";import{g as xs}from"./receiptTemplate-DCxfz2bi.js";import{g as hs,a as gs,f as de,b as fs}from"./shared-CV6vT0xK.js";import{f as Ve,g as kt,a as vt,b as ae,c as Ge}from"./dateUtils-B51heJDl.js";import{j as M,c as q,m as ue,s as g,n as bs,u as js,q as ys,a as ks,h as Te}from"./index-DI06tiVg.js";import{s as vs,d as Cs,u as Ss,c as ws,r as Ps,g as $s}from"./residentService-Bz9_NWqE.js";import{g as Is}from"./dashboardStatsService-zoCeqmX6.js";import{m as Ds}from"./flatHelper-BWQVbCP2.js";import{C as zs}from"./ConfirmDialog-Cww8gLSu.js";import{g as bt}from"./firebase-C8g9S9QQ.js";import{u as As}from"./useDebounce-7lEYopbX.js";import{D as Ke}from"./DatePicker-BD0tk4u3.js";function E(f){return f?String(f).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;"):""}function Ts({residents:f=[],selectedBlock:k="all",config:p={},daysToGo:l=null,pujaStartDate:L=""}){const F=k==="all",P=F?"ALL BLOCKS":`BLOCK ${k}`,n=F?"All Blocks":`Block ${k}`,O=Number(p==null?void 0:p.subscriptionAmount)||1500,x=f.length*O,X=new Date,me=String(X.getDate()).padStart(2,"0"),Q=X.toLocaleString("en-GB",{month:"short"}).toUpperCase(),A=X.getFullYear(),Y=`${p!=null&&p.societyName?p.societyName.toUpperCase().replace(/\s+/g,"_"):"SOCIETY"}_PENDING_SUBSCRIPTIONS_${P.replace(/\s+/g,"_")}_${me}_${Q}_${A}`;let d="";l!=null&&(l>1?d=`${l} Days to Go`:l===1?d="1 Day to Go":l===0?d="Starts Today":d=`${(p==null?void 0:p.pujaName)||"Puja"} Underway`);const N={};F&&f.forEach(h=>{const o=h.block?String(h.block):"Other";N[o]||(N[o]=[]),N[o].push(h)});const B=Object.keys(N).sort((h,o)=>{const T=Number(h),u=Number(o);return!isNaN(T)&&!isNaN(u)?T-u:h.localeCompare(o)});return`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${E(Y)}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      padding: 16px 20px;
      color: ${M.text};
      background: #fff;
      margin: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    ${hs(!1)}

    .report-title-container {
      text-align: center;
      margin: 12px 0 16px 0;
      border-bottom: 2px solid ${q.orangeDark};
      padding-bottom: 8px;
    }
    .report-title {
      color: ${q.orangeDark};
      font-size: 18px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin: 0 0 4px 0;
    }
    .report-subtitle {
      color: ${M.textSecondary};
      font-size: 12px;
      font-weight: 600;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    .highlight-pill {
      background: ${M.priceBg};
      border: 1px solid ${M.borderTable};
      padding: 2px 8px;
      border-radius: 12px;
      color: ${q.orangeDeep};
      font-weight: 700;
    }

    /* Summary KPI Bar */
    .summary-bar {
      display: flex;
      justify-content: space-between;
      background: ${M.summaryBg};
      border: 1px solid ${M.borderTable};
      border-radius: 6px;
      padding: 10px 14px;
      margin-bottom: 16px;
      gap: 10px;
    }
    .summary-item {
      text-align: center;
      flex: 1;
    }
    .summary-label {
      font-size: 11px;
      text-transform: uppercase;
      color: ${M.textSecondary};
      font-weight: 600;
      letter-spacing: 0.4px;
    }
    .summary-val {
      font-size: 16px;
      font-weight: 800;
      color: ${q.orangeDeep};
      margin-top: 2px;
    }

    /* Table styles */
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
      font-size: 11px;
    }
    thead {
      display: table-header-group;
    }
    tr {
      page-break-inside: avoid;
    }
    th {
      background: ${M.priceBg};
      color: ${M.text};
      font-weight: 700;
      padding: 7px 8px;
      border: 1px solid ${M.borderTable};
      text-align: left;
      font-size: 11px;
    }
    td {
      padding: 6px 8px;
      border: 1px solid ${M.borderTable};
      font-size: 11px;
      vertical-align: middle;
    }
    .flat-cell {
      font-weight: 700;
      color: ${q.orangeDeep};
      white-space: nowrap;
    }
    .name-cell {
      font-weight: 500;
    }
    .amount-cell {
      text-align: right;
      font-weight: 700;
      white-space: nowrap;
    }
    .block-header-row td {
      background: rgba(255, 143, 0, 0.12) !important;
      color: ${q.orangeDeep};
      font-weight: 800;
      font-size: 12px;
      padding: 8px 10px;
      border-top: 2px solid ${q.orangeDark};
    }
    .block-subtotal-row td {
      background: #fafafa;
      font-weight: 700;
      font-size: 11px;
      border-bottom: 2px solid ${M.borderTable};
    }
    .grand-total-row td {
      background: ${M.priceBg};
      font-weight: 800;
      font-size: 12px;
      color: ${q.orangeDeep};
      border-top: 2px solid ${q.orangeDark};
      padding: 8px;
    }

    /* Collection Guidelines Note */
    .note-box {
      margin-top: 16px;
      padding: 8px 12px;
      background: #fdfdfd;
      border-left: 3px solid ${q.orangeDark};
      border-top: 1px solid #eee;
      border-right: 1px solid #eee;
      border-bottom: 1px solid #eee;
      font-size: 10px;
      color: ${M.textSecondary};
      line-height: 1.4;
    }

    .footer {
      margin-top: 20px;
      text-align: center;
      font-size: 10px;
      color: #888;
      border-top: 1px solid #ddd;
      padding-top: 8px;
    }

    @media print {
      body { padding: 8px 12px; }
      @page {
        size: A4 portrait;
        margin: 10mm 8mm;
      }
    }
  </style>
</head>
<body>
  ${gs(p)}

  <div class="report-title-container">
    <div class="report-title">Pending Puja Subscriptions</div>
    <div class="report-subtitle">
      <span>Block: <strong>${E(n)}</strong></span>
      <span>•</span>
      <span>Puja Start: <strong>${Ve(L,p==null?void 0:p.dateFormat)}</strong></span>
      ${d?`<span>•</span><span class="highlight-pill">${d}</span>`:""}
      <span>•</span>
      <span>Subscription: <strong>${de(O)}</strong></span>
    </div>
  </div>

  <div class="summary-bar">
    <div class="summary-item">
      <div class="summary-label">Target Block</div>
      <div class="summary-val">${E(n)}</div>
    </div>
    <div class="summary-item">
      <div class="summary-label">Pending Flats</div>
      <div class="summary-val">${f.length}</div>
    </div>
    <div class="summary-item">
      <div class="summary-label">Total Amount Due</div>
      <div class="summary-val">${de(x)}</div>
    </div>
    <div class="summary-item">
      <div class="summary-label">Countdown</div>
      <div class="summary-val" style="font-size: 14px;">${d||"Active"}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 40px; text-align: center;">#</th>
        <th style="width: 90px;">Flat</th>
        <th>Resident Name</th>
        <th style="width: 120px;">Mobile</th>
        <th style="width: 100px; text-align: right;">Amount Due</th>
      </tr>
    </thead>
    <tbody>
      ${F?B.map(h=>{const o=N[h],T=o.length*O;return`
            <tr class="block-header-row">
              <td colspan="5">
                BLOCK ${E(h)} &mdash; ${o.length} Pending Flats (${de(T)})
              </td>
            </tr>
            ${o.map((u,ee)=>`
              <tr>
                <td style="text-align: center; color: #777;">${ee+1}</td>
                <td class="flat-cell">${E(u.flatNumber||`${u.block}-${u.floor}-${u.flatType}`)}</td>
                <td class="name-cell">${E(u.name||"Resident")}</td>
                <td>${E(u.mobile||"—")}</td>
                <td class="amount-cell">${de(O)}</td>
              </tr>
            `).join("")}
            <tr class="block-subtotal-row">
              <td colspan="4" style="text-align: right; text-transform: uppercase;">
                Subtotal Block ${E(h)} (${o.length} Flats):
              </td>
              <td class="amount-cell" style="color: ${q.orangeDeep};">${de(T)}</td>
            </tr>
          `}).join(""):f.length>0?f.map((h,o)=>`
            <tr>
              <td style="text-align: center; color: #777;">${o+1}</td>
              <td class="flat-cell">${E(h.flatNumber||`${h.block}-${h.floor}-${h.flatType}`)}</td>
              <td class="name-cell">${E(h.name||"Resident")}</td>
              <td>${E(h.mobile||"—")}</td>
              <td class="amount-cell">${de(O)}</td>
            </tr>
          `).join(""):'<tr><td colspan="5" style="text-align: center; padding: 24px; color: #888;">No pending subscriptions for this block.</td></tr>'}
      <tr class="grand-total-row">
        <td colspan="4" style="text-align: right; text-transform: uppercase;">
          Grand Total (${f.length} Pending Flats):
        </td>
        <td class="amount-cell" style="font-size: 13px;">${de(x)}</td>
      </tr>
    </tbody>
  </table>

  <div class="note-box">
    <strong>Committee Note:</strong> Subscriptions can be paid via UPI (${E((p==null?void 0:p.upiPayeeAddress)||"N/A")}) or Cash/Cheque to the Puja Committee.
  </div>

  ${fs(p)}
</body>
</html>`}const jt=(f,k,p,l="Durga Puja")=>{const L=f&&f!=="all"?`Dear Block ${f} Neighbors,`:`Dear ${p?`${p} `:""}Neighbors,`;let F="a few days to go";return k!=null&&(k>1?F=`${k} days to go`:k===1?F="1 day to go":k===0?F="0 days to go (starts today)":F="the festival is underway"),`${L}
Just a gentle reminder to please pay the ${l||"Durga Puja"} subscriptions at your earliest convenience as we are just ${F}. 
Thank you for your continued support!`},Fs=({open:f,onClose:k,initialBlock:p="all",config:l={},allPendingResidents:L=[],onPrintPending:F})=>{const[P,n]=r.useState(p||"all"),[O,x]=r.useState(!1),[X,me]=r.useState(!1),[Q,A]=r.useState(!1),[H,Y]=r.useState(""),[d,N]=r.useState(!1),[B,h]=r.useState({open:!1,message:"",severity:"success"});r.useEffect(()=>{f&&(n(p||"all"),N(!1),x(!1),me(!1),A(!1))},[f,p]);const o=r.useMemo(()=>kt(l),[l]),T=r.useMemo(()=>vt(o),[o]),u=r.useMemo(()=>P==="all"?L:L.filter(i=>String(i.block)===String(P)),[L,P]),ee=r.useMemo(()=>u.map(v=>v.flatNumber||(v.block&&v.floor&&v.flatType?`${v.block}-${v.floor}-${v.flatType}`:null)).filter(Boolean).join(", "),[u]);r.useEffect(()=>{if(d)return;let i=jt(P,T,l==null?void 0:l.societyName,l==null?void 0:l.pujaName);O&&u.length>0&&(i+=`

📋 Pending Flats (${u.length}):
${ee}`),X&&(l!=null&&l.upiPayeeAddress||l!=null&&l.subscriptionAmount)&&(i+=`

💳 Payment Details:
UPI ID: ${(l==null?void 0:l.upiPayeeAddress)||""}
Amount: ₹${(l==null?void 0:l.subscriptionAmount)||1500}`,l!=null&&l.upiPayeeName&&(i+=`
Payee: ${l.upiPayeeName}`)),Q&&(i+=`

— ${(l==null?void 0:l.committeeName)||"Puja Committee"} ${(l==null?void 0:l.year)||""}`,l!=null&&l.societyName&&(i+=`
${l.societyName}`)),Y(i)},[P,T,O,X,Q,d,l,u,ee]);const U=()=>{N(!1),x(!1),me(!1),A(!1);const i=jt(P,T,l==null?void 0:l.societyName,l==null?void 0:l.pujaName);Y(i),h({open:!0,message:"Message reset to default format.",severity:"info"})},fe=async()=>{try{await navigator.clipboard.writeText(H),h({open:!0,message:"Message copied to clipboard!",severity:"success"})}catch(i){console.warn("Clipboard write failed:",i),h({open:!0,message:"Failed to copy to clipboard.",severity:"error"})}},Xe=async()=>{try{try{await navigator.clipboard.writeText(H)}catch(v){console.warn("Clipboard write failed:",v)}if(bs()&&navigator.share)await navigator.share({text:H,title:`Durga Puja Subscription Reminder - ${P==="all"?"All Blocks":`Block ${P}`}`});else{const v=`https://api.whatsapp.com/send?text=${encodeURIComponent(H)}`;window.open(v,"_blank")}}catch(i){if(console.error("Error sharing to WhatsApp:",i),i.name!=="AbortError"){const v=`https://api.whatsapp.com/send?text=${encodeURIComponent(H)}`;window.open(v,"_blank")}}},Qe=()=>{F&&F(P)},be=(l==null?void 0:l.blocks)||Array.from({length:13},(i,v)=>v+1);return e.jsxs(e.Fragment,{children:[e.jsxs(Fe,{open:f,onClose:k,maxWidth:"sm",fullWidth:!0,children:[e.jsxs(Ne,{sx:{display:"flex",alignItems:"center",justifyContent:"space-between",pb:1},children:[e.jsxs(b,{sx:{display:"flex",alignItems:"center",gap:1},children:[e.jsx(we,{sx:{color:ue.whatsapp,fontSize:28}}),e.jsx(y,{variant:"h6",sx:{fontWeight:700},children:"Pending Payment Reminder"})]}),e.jsx(V,{onClick:k,size:"small",children:e.jsx(he,{})})]}),e.jsxs(Be,{dividers:!0,sx:{pt:2,pb:2},children:[e.jsxs(b,{sx:{display:"flex",gap:1.5,flexWrap:"wrap",alignItems:"center",mb:2},children:[e.jsxs(ne,{size:"small",sx:{minWidth:160},children:[e.jsx(le,{children:"Select Block"}),e.jsxs(re,{value:P,label:"Select Block",onChange:i=>{n(i.target.value),N(!1)},children:[e.jsx(z,{value:"all",children:e.jsx("em",{children:"All Blocks"})}),be.map(i=>e.jsxs(z,{value:String(i),children:["Block ",i]},i))]})]}),e.jsx(ge,{icon:e.jsx(Lt,{sx:{fontSize:16}}),label:`${u.length} Pending Flats`,size:"small",sx:{fontWeight:600,backgroundColor:g.warning.bg,color:g.warning.text}}),T!==null&&e.jsx(ge,{icon:e.jsx(yt,{sx:{fontSize:16}}),label:T>1?`${T} days to Puja`:T===1?"1 day to Puja":T===0?"Puja starts today":"Puja underway",size:"small",sx:{fontWeight:600,backgroundColor:g.info.bg,color:g.info.text}})]}),e.jsxs(b,{sx:{position:"relative",mb:2},children:[e.jsx(oe,{fullWidth:!0,multiline:!0,rows:6,label:"WhatsApp Sharing Message",value:H,onChange:i=>{Y(i.target.value),N(!0)},helperText:d?"Custom modified. Click Reset to return to the template.":`Dynamic countdown based on Puja start date (${Ve(o,l==null?void 0:l.dateFormat)})`,slotProps:{input:{sx:{fontFamily:"inherit",fontSize:"0.92rem",lineHeight:1.5}}}}),d&&e.jsx(pe,{title:"Reset to default message template",children:e.jsx(R,{size:"small",startIcon:e.jsx(Ot,{}),onClick:U,sx:{position:"absolute",top:8,right:8,fontSize:"0.75rem",py:.2,textTransform:"none"},children:"Reset"})})]}),e.jsxs(b,{sx:{border:"1px solid",borderColor:"divider",borderRadius:2,p:1.5,mb:1,backgroundColor:"background.default"},children:[e.jsx(y,{variant:"caption",sx:{fontWeight:700,color:"text.secondary",textTransform:"uppercase",letterSpacing:.5},children:"Optional Additions to Message"}),e.jsxs(b,{sx:{display:"flex",flexWrap:"wrap",gap:{xs:.5,sm:2},mt:.5},children:[e.jsx(Ye,{control:e.jsx(We,{size:"small",checked:O,onChange:i=>{x(i.target.checked),N(!1)}}),label:e.jsx(y,{variant:"body2",children:"Include Pending Flat Numbers"})}),e.jsx(Ye,{control:e.jsx(We,{size:"small",checked:X,onChange:i=>{me(i.target.checked),N(!1)}}),label:e.jsx(y,{variant:"body2",children:"Include UPI Payment Info"})}),e.jsx(Ye,{control:e.jsx(We,{size:"small",checked:Q,onChange:i=>{A(i.target.checked),N(!1)}}),label:e.jsx(y,{variant:"body2",children:"Include Committee Sign-off"})})]})]})]}),e.jsxs(Je,{sx:{px:3,py:2,justifyContent:"space-between",flexWrap:"wrap",gap:1},children:[e.jsxs(b,{sx:{display:"flex",gap:1},children:[e.jsx(R,{variant:"outlined",size:"small",startIcon:e.jsx(Me,{}),onClick:Qe,sx:{fontWeight:600,textTransform:"none"},children:"Print Pending List"}),e.jsx(R,{variant:"outlined",size:"small",startIcon:e.jsx(_t,{}),onClick:fe,sx:{fontWeight:600,textTransform:"none"},children:"Copy"})]}),e.jsxs(b,{sx:{display:"flex",gap:1},children:[e.jsx(R,{onClick:k,color:"inherit",size:"small",sx:{textTransform:"none"},children:"Cancel"}),e.jsx(R,{variant:"contained",size:"small",startIcon:e.jsx(we,{}),onClick:Xe,sx:{background:`${ue.whatsapp} !important`,backgroundColor:`${ue.whatsapp} !important`,backgroundImage:"none !important",color:"#fff !important",fontWeight:700,textTransform:"none",boxShadow:"0 2px 8px rgba(37, 211, 102, 0.4)","&:hover":{background:"#1ebe5d !important",backgroundColor:"#1ebe5d !important",backgroundImage:"none !important"}},children:"Share on WhatsApp"})]})]})]}),e.jsx(qt,{open:B.open,autoHideDuration:3e3,onClose:()=>h(i=>({...i,open:!1})),anchorOrigin:{vertical:"bottom",horizontal:"center"},children:e.jsx(Ht,{severity:B.severity,sx:{width:"100%"},children:B.message})})]})},Ns=["UPI","Cash","Cheque","Net Banking"],Vs=()=>{ps();const{user:f}=js(),{startProcessing:k,stopProcessing:p}=ys(),l=(f==null?void 0:f.role)==="Auditor",L=(f==null?void 0:f.role)==="Super Admin",[F,P]=r.useState([]),[n,O]=r.useState(null),[x,X]=r.useState(null),[me,Q]=r.useState(!0),[A,H]=r.useState(""),Y=As(A,300),[d,N]=r.useState("all"),[B,h]=r.useState("all"),[o,T]=r.useState([]),[u,ee]=r.useState(null),[U,fe]=r.useState(null),[Xe,Qe]=r.useState(0),[be,i]=r.useState(0),[v,Ct]=r.useState(10),[Ze,je]=r.useState(!1),[et,tt]=r.useState(null),[G,st]=r.useState(null),St=(t,s)=>{tt(t.currentTarget),st(s)},Pe=()=>{tt(null),st(null)},[at,ye]=r.useState(!1),[nt,Re]=r.useState(!1),[te,$e]=r.useState(null),[ke,wt]=r.useState([]),[Ie,Ue]=r.useState({open:!1,title:"",message:"",onConfirm:null}),[Pt,lt]=r.useState(!1),[$t,It]=r.useState("all"),[Ee,Le]=r.useState([]),[rt,ve]=r.useState(null),Oe=r.useMemo(()=>kt(n),[n]),Ce=r.useMemo(()=>vt(Oe),[Oe]),ot=async()=>{try{const s=(await $s()).filter(a=>a.subscriptionStatus==="pending");return s.sort((a,c)=>{const S=Number(a==null?void 0:a.block)||0,w=Number(c==null?void 0:c.block)||0;if(S!==w)return S-w;const m=Number(a==null?void 0:a.floor)||0,W=Number(c==null?void 0:c.floor)||0;if(m!==W)return m-W;const J=String((a==null?void 0:a.flatNumber)||(a==null?void 0:a.flat)||""),ie=String((c==null?void 0:c.flatNumber)||(c==null?void 0:c.flat)||"");return J.localeCompare(ie,void 0,{numeric:!0,sensitivity:"base"})}),Le(s),s}catch(t){return console.error("Error loading pending residents:",t),[]}},it=async(t=null)=>{if(It(t!==null?t:d!=="all"?d:"all"),lt(!0),Ee.length===0){k("Loading pending residents...");try{await ot()}finally{p()}}},_e=async(t="all")=>{let s=Ee;if(!s||s.length===0){k("Preparing pending list for print...");try{s=await ot()}finally{p()}}const a=t==="all"?s:s.filter(S=>String(S.block)===String(t)),c=Ts({residents:a,selectedBlock:t,config:n,daysToGo:Ce,pujaStartDate:Oe});us(c)},[C,Z]=r.useState({name:"",mobile:"",email:"",block:"",floor:"",flatType:"",remarks:""}),[j,_]=r.useState({amount:"",paymentMode:"UPI",remarks:"",proofFiles:[],existingProofs:[],transactionDate:ae()}),[qe,ct]=r.useState(!1),[Dt,dt]=r.useState(0);r.useEffect(()=>{De()},[]);const De=async()=>{try{const[t,s]=await Promise.all([ks(),Is(!1)]);O(t),_(a=>({...a,amount:(t==null?void 0:t.subscriptionAmount)||0})),s!=null&&s.subscription&&X(s.subscription)}catch(t){console.error("Error loading config:",t)}finally{Q(!1)}};r.useEffect(()=>{const t=setTimeout(async()=>{const s=(A||"").trim(),a=s.length>0,c=a&&/^[0-9]/.test(s),S=a&&!c,w=d!=="all",m=B!=="all",W=o&&o.length>0,J=u!==null||U!==null,ie=s.toLowerCase()==="all";if(!a&&!w&&!m&&!W&&!J){P([]);return}if(c&&s.length<3&&!w&&!m&&!W&&!J&&!ie){P([]);return}if(S&&!w&&s.length<3&&!ie){P([]);return}Q(!0);try{const Se=await vs(A,d,B,o&&o.length>0?o:"all",J);P(Se)}catch(Se){console.error("Search failed:",Se)}finally{Q(!1)}},500);return()=>clearTimeout(t)},[A,d,B,o,u,U,Dt]);const se=r.useMemo(()=>{let t=[...F];return Y&&Y.trim().toLowerCase()!=="all"&&(t=t.filter(s=>Ds(s,Y))),d!=="all"&&(t=t.filter(s=>String(s.block)===d)),B!=="all"&&(t=t.filter(s=>s.subscriptionStatus===B)),o&&o.length>0&&(t=t.filter(s=>s.subscriptionStatus!=="paid"?!1:o.includes("Bank")&&["UPI","Net Banking","Cheque"].includes(s.paymentMode)?!0:o.includes(s.paymentMode))),(u||U)&&(t=t.filter(s=>{const a=s.transactionDate||s.paymentDate||s.createdAt;if(!a)return!1;const c=a.split("T")[0];return!(u&&c<u||U&&c>U)})),t.sort((s,a)=>{const c=$=>{let He=($==null?void 0:$.flatNumber)||($==null?void 0:$.flat)||"";return!He&&($==null?void 0:$.block)!==void 0&&($==null?void 0:$.floor)!==void 0&&($!=null&&$.flatType)&&(He=`${$.block}-${$.floor}-${$.flatType}`),String(He).trim()},S=c(s),w=c(a),m=Number(s==null?void 0:s.block)||0,W=Number(a==null?void 0:a.block)||0;if(m!==W)return m-W;if(S&&w)return S.localeCompare(w,void 0,{numeric:!0,sensitivity:"base"});const J=Number(s==null?void 0:s.floor)||0,ie=Number(a==null?void 0:a.floor)||0;if(J!==ie)return J-ie;const Se=String((s==null?void 0:s.flatType)||""),Et=String((a==null?void 0:a.flatType)||"");return Se.localeCompare(Et)}),t},[F,Y,d,B,o,u,U]),zt=r.useMemo(()=>{const t=se.length,s=se.filter(m=>m.subscriptionStatus==="paid").length,a=t-s,c=se.filter(m=>m.subscriptionStatus==="paid").reduce((m,W)=>m+(Number(W.subscriptionAmount)||0),0),S=se.filter(m=>m.subscriptionStatus==="paid"&&m.paymentMode&&String(m.paymentMode).toLowerCase()==="cash").length,w=s-S;return{total:t,paid:s,pending:a,totalAmount:c,accountCount:w,cashCount:S}},[se]),K=!!A||d!=="all"||B!=="all"||o&&o.length>0||!!u||!!U?zt:{total:(x==null?void 0:x.totalFlats)||0,paid:(x==null?void 0:x.paidCount)||0,pending:(x==null?void 0:x.pendingCount)||0,totalAmount:(x==null?void 0:x.totalCollected)||0,accountCount:(x==null?void 0:x.accountCount)||0,cashCount:(x==null?void 0:x.cashCount)||0},At=()=>{H(""),N("all"),h("all"),T([]),ee(null),fe(null)},Tt=!!(A||d!=="all"||B!=="all"||o&&o.length>0||u||U),Ft=async()=>{k("Saving resident details...");try{qe&&te?await Ss(te.id,C):await ws(C),je(!1),ze(),await De(),dt(t=>t+1)}catch(t){console.error("Error saving resident:",t)}finally{p()}},Nt=async()=>{k("Recording payment...");try{await Ps(te.id,j,j.proofFiles,j.existingProofs),ye(!1),$e(null),_({amount:(n==null?void 0:n.subscriptionAmount)||0,paymentMode:"UPI",remarks:"",proofFiles:[],existingProofs:[],transactionDate:ae()}),Le([]),await De(),dt(t=>t+1)}catch(t){console.error("Error recording payment:",t)}finally{p()}},Bt=t=>{Ue({open:!0,title:"Delete Payment",message:"Are you sure you want to delete this payment? This will mark the flat as pending.",onConfirm:async()=>{k("Deleting payment...");try{await Cs(t),Le([]),await De()}finally{p(),Ue(s=>({...s,open:!1}))}}})},Wt=t=>{Z({name:t.name,mobile:t.mobile,email:t.email,block:t.block,floor:t.floor,flatType:t.flatType,remarks:t.remarks||""}),$e(t),ct(!0),je(!0)},pt=async t=>{if($e(t),_({amount:t.subscriptionAmount||(n==null?void 0:n.subscriptionAmount)||"",paymentMode:t.paymentMode||"UPI",remarks:t.remarks||"",proofFiles:[],existingProofs:[],transactionDate:t.transactionDate?ae(t.transactionDate):t.paymentDate?ae(t.paymentDate):ae()}),ye(!0),t.paymentProofUrl){const s=await bt(t.id,t.paymentProofUrl);s&&_(a=>te&&te.id!==t.id?a:{...a,existingProofs:Array.isArray(s)?s:[s]})}},ze=()=>{Z({name:"",mobile:"",email:"",block:"",floor:"",flatType:"",remarks:""}),ct(!1),$e(null)},ut=t=>{const s=Array.from(t.target.files);s.length>0&&_(a=>({...a,proofFiles:[...a.proofFiles||[],...s]}))},Mt=t=>{_(s=>({...s,proofFiles:s.proofFiles.filter((a,c)=>c!==t)}))},Rt=t=>{_(s=>({...s,existingProofs:s.existingProofs.filter((a,c)=>c!==t)}))},mt=t=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",minimumFractionDigits:0}).format(t),Ut=async t=>{try{const s=xs(t,n,!0,"Subscription Receipt"),a=await ms(s),c=await new Promise(m=>a.toBlob(m,"image/jpeg",.9)),S=new File([c],`Subscription_Receipt_${t.name.replace(/\\s+/g,"_")}.jpg`,{type:"image/jpeg"}),w=`🙏 Thank You from ${(n==null?void 0:n.committeeName)||"Committee"} ${(n==null?void 0:n.year)||""} 🙏

The ${(n==null?void 0:n.committeeName)||"Committee"} sincerely thanks ${t.name} for your prompt subscription payment of ₹${t.subscriptionAmount||(n==null?void 0:n.subscriptionAmount)||0} towards Durga Puja.

Your kind support and contribution inspire us to make this year's celebration even more memorable for the entire ${(n==null?void 0:n.societyName)||"society"} family.

With heartfelt gratitude.
Jai Maa Durga! 🌺🙏
— ${(n==null?void 0:n.committeeName)||"Committee"} ${(n==null?void 0:n.year)||""}`;if(navigator.share){try{await navigator.clipboard.writeText(w)}catch(m){console.warn("Clipboard write failed",m)}await navigator.share({files:[S],text:w,title:"Subscription Receipt"})}else{const m=window.URL.createObjectURL(c),W=document.createElement("a");W.href=m,W.download=S.name,W.click();const J=`https://api.whatsapp.com/send?text=${encodeURIComponent(w)}`;window.open(J,"_blank")}}catch(s){console.error("Error sharing receipt:",s),alert("Failed to share receipt. "+s.message)}};return e.jsxs(b,{children:[e.jsxs(b,{sx:{display:"flex",justifyContent:"space-between",alignItems:"center",mb:{xs:1.25,sm:2},gap:{xs:.5,sm:1},flexWrap:"nowrap",width:"100%"},children:[e.jsxs(b,{sx:{display:"flex",alignItems:"center",gap:{xs:.5,sm:1},minWidth:0,flexWrap:"nowrap",flexShrink:1},children:[K&&e.jsx(ge,{label:`${K.pending||0} Pending`,size:"small",sx:{height:26,fontSize:{xs:"0.72rem",sm:"0.78rem"},fontWeight:700,backgroundColor:g.warning.bg,color:g.warning.text,whiteSpace:"nowrap","& .MuiChip-label":{px:{xs:.75,sm:1}}}}),Ce!==null&&e.jsx(ge,{icon:e.jsx(yt,{sx:{"&&":{fontSize:13,ml:.5}}}),label:e.jsx(b,{component:"span",sx:{whiteSpace:"nowrap"},children:Ce>0?e.jsxs(e.Fragment,{children:[Ce,"d",e.jsx(b,{component:"span",sx:{display:{xs:"none",sm:"inline"}},children:" to Puja"})]}):Ce===0?"Today":"Active"}),size:"small",sx:{height:26,fontSize:{xs:"0.72rem",sm:"0.78rem"},fontWeight:600,backgroundColor:g.info.bg,color:g.info.text,whiteSpace:"nowrap","& .MuiChip-label":{px:{xs:.5,sm:1}}}})]}),e.jsxs(b,{sx:{display:"flex",gap:{xs:.75,sm:1},alignItems:"center",flexShrink:0},children:[!l&&e.jsx(pe,{title:"Pending WhatsApp Reminder",children:e.jsxs(R,{variant:"contained",size:"small",onClick:()=>it(d!=="all"?d:"all"),sx:{background:`${ue.whatsapp} !important`,backgroundColor:`${ue.whatsapp} !important`,backgroundImage:"none !important",color:"#fff !important",fontWeight:700,textTransform:"none",fontSize:{xs:"0.75rem",sm:"0.82rem"},height:{xs:28,sm:32},px:{xs:.9,sm:1.5},minWidth:{xs:32,sm:"auto"},boxShadow:"0 2px 6px rgba(37, 211, 102, 0.35)","&:hover":{background:"#1ebe5d !important",backgroundColor:"#1ebe5d !important",backgroundImage:"none !important"}},children:[e.jsx(we,{sx:{fontSize:{xs:18,sm:18},mr:{xs:0,sm:.75}}}),e.jsx(b,{component:"span",sx:{display:{xs:"none",sm:"inline"}},children:"Reminder"})]})}),e.jsx(R,{variant:"outlined",size:"small",startIcon:e.jsx(Me,{sx:{fontSize:{xs:15,sm:18}}}),endIcon:e.jsx(Yt,{sx:{fontSize:16,ml:-.5}}),onClick:t=>ve(t.currentTarget),sx:{fontWeight:600,textTransform:"none",fontSize:{xs:"0.75rem",sm:"0.82rem"},height:{xs:28,sm:32},px:{xs:1,sm:1.5},minWidth:0},children:"Print"}),e.jsxs(xt,{anchorEl:rt,open:!!rt,onClose:()=>ve(null),children:[d!=="all"&&e.jsxs(z,{onClick:()=>{ve(null),_e(d)},children:[e.jsx(xe,{children:e.jsx(Me,{fontSize:"small"})}),e.jsx(ce,{primary:`Print Pending — Block ${d}`})]}),e.jsxs(z,{onClick:()=>{ve(null),_e("all")},children:[e.jsx(xe,{children:e.jsx(Me,{fontSize:"small"})}),e.jsx(ce,{primary:"Print Pending — All Blocks"})]}),e.jsx(Gt,{}),e.jsxs(z,{onClick:()=>{ve(null),it(d)},children:[e.jsx(xe,{children:e.jsx(we,{fontSize:"small",sx:{color:ue.whatsapp}})}),e.jsx(ce,{primary:"WhatsApp Reminder Dialog..."})]})]}),Tt&&e.jsx(R,{variant:"text",size:"small",onClick:At,sx:{color:"text.secondary",textTransform:"none",fontSize:"0.75rem",p:.5,minWidth:0},children:"Clear"})]})]}),e.jsx(ht,{sx:{mb:{xs:1.5,sm:2.5}},children:e.jsx(Kt,{sx:{p:{xs:1,sm:2},"&:last-child":{pb:{xs:1.5,sm:2}}},children:e.jsxs(b,{sx:{display:"flex",gap:{xs:1,sm:2},flexWrap:"wrap",alignItems:"center"},children:[e.jsx(oe,{size:"small",placeholder:"Search Flat / Name...",value:A,onChange:t=>H(t.target.value),slotProps:{input:{startAdornment:e.jsx(gt,{position:"start",children:e.jsx(Jt,{sx:{color:"text.secondary"}})})}},sx:{width:{xs:"calc(100% - 110px)",sm:200},flex:{sm:1}}}),e.jsxs(ne,{size:"small",sx:{width:{xs:"100px",sm:120}},children:[e.jsx(le,{children:"Block"}),e.jsxs(re,{value:d,onChange:t=>N(t.target.value),label:"Block",children:[e.jsx(z,{value:"all",children:"All Blocks"}),((n==null?void 0:n.blocks)||[]).map(t=>e.jsxs(z,{value:String(t),children:["Block ",t]},t))]})]}),e.jsxs(ne,{size:"small",sx:{width:{xs:"calc(50% - 4px)",sm:120}},children:[e.jsx(le,{children:"Status"}),e.jsxs(re,{value:B,onChange:t=>h(t.target.value),label:"Status",children:[e.jsx(z,{value:"all",children:"All"}),e.jsx(z,{value:"paid",children:"Paid"}),e.jsx(z,{value:"pending",children:"Pending"})]})]}),e.jsxs(ne,{size:"small",sx:{width:{xs:"calc(50% - 4px)",sm:160}},children:[e.jsx(le,{shrink:!0,children:"Payment Mode"}),e.jsx(re,{multiple:!0,value:o,label:"Payment Mode",onChange:t=>{const s=t.target.value;let a=typeof s=="string"?s.split(","):[...s];const c=o.includes("Bank"),S=a.includes("Bank");if(S&&!c)a=[...new Set([...a,"UPI","Net Banking","Cheque"])];else if(!S&&c)a=a.filter(w=>!["UPI","Net Banking","Cheque"].includes(w));else{const w=["UPI","Net Banking","Cheque"].every(m=>a.includes(m));w&&!S?a.push("Bank"):!w&&S&&(a=a.filter(m=>m!=="Bank"))}T(a)},renderValue:t=>{if(t.length===0)return"All Modes";let s=[...t];return s.includes("Bank")&&(s=s.filter(a=>!["UPI","Net Banking","Cheque"].includes(a))),s.join(", ")},displayEmpty:!0,children:[{value:"Cash",label:"Cash"},{value:"Bank",label:"Bank"},{value:"UPI",label:"UPI",isSub:!0},{value:"Net Banking",label:"Net Banking",isSub:!0},{value:"Cheque",label:"Cheque",isSub:!0}].map(t=>e.jsxs(z,{value:t.value,sx:t.isSub?{pl:4}:{},children:[e.jsx(We,{checked:o.indexOf(t.value)>-1,size:"small",sx:{py:0}}),e.jsx(ce,{primary:t.label,sx:{my:0}})]},t.value))})]}),e.jsx(Ke,{label:"From Date",value:u?new Date(u):null,onChange:t=>{t&&!isNaN(t.getTime())?ee(ae(t)):ee(null)},format:Ge(n==null?void 0:n.dateFormat),sx:{width:{xs:"calc(50% - 4px)",sm:190}},slotProps:{actionBar:{actions:["clear","cancel","accept"]},textField:{size:"small"}}}),e.jsx(Ke,{label:"To Date",value:U?new Date(U):null,onChange:t=>{t&&!isNaN(t.getTime())?fe(ae(t)):fe(null)},format:Ge(n==null?void 0:n.dateFormat),sx:{width:{xs:"calc(50% - 4px)",sm:190}},slotProps:{actionBar:{actions:["clear","cancel","accept"]},textField:{size:"small"}}})]})})}),e.jsxs(ht,{children:[e.jsx(Vt,{sx:{overflowX:"auto"},children:e.jsxs(Xt,{size:"small",sx:{minWidth:{xs:800,md:1e3}},children:[e.jsx(Qt,{children:e.jsxs(Ae,{children:[e.jsx(I,{sx:{position:"sticky",left:0,zIndex:2,backgroundColor:"background.paper",width:80,minWidth:80,borderRight:"1px solid rgba(128,128,128,0.2)"},children:"Flat"}),e.jsx(I,{sx:{minWidth:200,width:220},children:"Name"}),e.jsx(I,{children:"Mobile"}),e.jsx(I,{children:"Status"}),e.jsx(I,{children:"Amount"}),e.jsx(I,{children:"Mode"}),e.jsx(I,{children:"Date"}),e.jsx(I,{align:"right",sx:{position:"sticky",right:0,zIndex:2,backgroundColor:"background.paper",borderLeft:"1px solid rgba(128,128,128,0.2)",whiteSpace:"nowrap",width:80,minWidth:80},children:"Actions"})]})}),e.jsxs(Zt,{children:[se.slice(be*v,be*v+v).map(t=>e.jsxs(Ae,{children:[e.jsx(I,{sx:{position:"sticky",left:0,zIndex:1,backgroundColor:"background.paper",borderRight:"1px solid rgba(128,128,128,0.2)"},children:e.jsx(ge,{label:t.flatNumber,size:"small",sx:{fontWeight:600,backgroundColor:g.info.bg,color:g.info.text}})}),e.jsx(I,{sx:{minWidth:200,maxWidth:220},children:e.jsx(pe,{title:t.name,children:e.jsx(y,{variant:"body2",sx:{fontWeight:500,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden",textOverflow:"ellipsis"},children:t.name})})}),e.jsx(I,{children:e.jsx(y,{variant:"body2",sx:{color:"text.secondary"},children:t.mobile})}),e.jsx(I,{children:e.jsx(ge,{icon:t.subscriptionStatus==="paid"?e.jsx(es,{}):e.jsx(ts,{}),label:t.subscriptionStatus==="paid"?"Paid":"Pending",size:"small",sx:{fontWeight:500,backgroundColor:t.subscriptionStatus==="paid"?g.success.bg:g.warning.bg,color:t.subscriptionStatus==="paid"?g.success.text:g.warning.text,"& .MuiChip-icon":{color:t.subscriptionStatus==="paid"?g.success.text:g.warning.text}}})}),e.jsx(I,{children:t.subscriptionStatus==="paid"?mt(t.subscriptionAmount):"-"}),e.jsx(I,{children:e.jsx(y,{variant:"body2",sx:{color:"text.secondary"},children:t.paymentMode||"-"})}),e.jsx(I,{children:e.jsx(y,{variant:"body2",sx:{color:"text.secondary",fontSize:"0.8rem"},children:t.transactionDate||t.paymentDate?Ve(t.transactionDate||t.paymentDate,n==null?void 0:n.dateFormat):"-"})}),e.jsx(I,{align:"right",sx:{position:"sticky",right:0,zIndex:1,backgroundColor:"background.paper",borderLeft:"1px solid rgba(128,128,128,0.2)",whiteSpace:"nowrap"},children:e.jsxs(b,{sx:{display:"flex",justifyContent:"flex-end",gap:.5},children:[!l&&t.subscriptionStatus==="pending"&&e.jsx(pe,{title:"Record Payment",children:e.jsx(V,{size:"small",onClick:()=>pt(t),sx:{color:g.success.text},children:e.jsx(ss,{fontSize:"small"})})}),t.subscriptionStatus==="paid"&&!l&&e.jsx(e.Fragment,{children:e.jsx(pe,{title:"Share to WhatsApp",children:e.jsx(V,{size:"small",onClick:()=>Ut(t),sx:{color:ue.whatsapp},children:e.jsx(we,{fontSize:"small"})})})}),L&&e.jsx(pe,{title:"Edit Flat",children:e.jsx(V,{size:"small",onClick:()=>Wt(t),sx:{color:g.warning.text},children:e.jsx(ft,{fontSize:"small"})})}),e.jsx(pe,{title:"More Actions",children:e.jsx("span",{children:e.jsx(V,{size:"small",onClick:s=>St(s,t),disabled:!(t.paymentProofUrl||L&&t.subscriptionStatus==="paid"),children:e.jsx(as,{fontSize:"small"})})})})]})})]},t.id)),se.length===0&&e.jsx(Ae,{children:e.jsx(I,{colSpan:8,align:"center",sx:{py:6},children:e.jsx(y,{variant:"body1",sx:{color:"text.secondary"},children:!A&&d==="all"&&B==="all"&&(!o||o.length===0)&&!u&&!U?"Search by Flat (e.g. 104) or Name, or select any filter above.":A&&!/^[0-9]/.test(A)&&d==="all"&&A.trim().length<3?"Type at least 3 characters to search by Name.":"No matching residents found."})})})]}),e.jsx(ns,{children:e.jsx(Ae,{children:e.jsx(I,{colSpan:8,sx:{p:{xs:1,sm:2}},children:e.jsxs(b,{sx:{display:"flex",justifyContent:"space-between",flexWrap:"wrap",alignItems:"center",py:.5,gap:1},children:[e.jsxs(y,{variant:"subtitle2",sx:{fontWeight:700,color:g.info.text},children:["Total Flats: ",K.total]}),e.jsxs(y,{variant:"subtitle2",sx:{fontWeight:700,color:g.success.text},children:["Paid: ",K.paid,(K.accountCount>0||K.cashCount>0)&&` (Acc: ${K.accountCount}, Cash: ${K.cashCount})`]}),e.jsxs(y,{variant:"subtitle2",sx:{fontWeight:700,color:g.warning.text},children:["Pending: ",K.pending]}),e.jsxs(y,{variant:"subtitle2",sx:{fontWeight:700,color:g.donation.text},children:["Collected: ",mt(K.totalAmount)]})]})})})})]})}),e.jsx(ls,{rowsPerPageOptions:[10,25,50,100],component:"div",count:se.length,rowsPerPage:v,page:be,onPageChange:(t,s)=>i(s),onRowsPerPageChange:t=>{Ct(parseInt(t.target.value,10)),i(0)},sx:{borderTop:"1px solid rgba(255,255,255,0.06)","& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows":{color:"text.secondary"}}})]}),e.jsxs(xt,{anchorEl:et,open:!!et,onClose:Pe,transformOrigin:{horizontal:"right",vertical:"top"},anchorOrigin:{horizontal:"right",vertical:"bottom"},slotProps:{paper:{sx:{mt:.5,minWidth:150}}},children:[(G==null?void 0:G.paymentProofUrl)&&e.jsxs(z,{onClick:async()=>{Pe();const t=await bt(G.id,G.paymentProofUrl);t&&t.length>0&&(wt(t),Re(!0))},children:[e.jsx(xe,{children:e.jsx(rs,{fontSize:"small",sx:{color:g.info.text}})}),e.jsx(ce,{children:"View Proof"})]},"view-proof"),L&&(G==null?void 0:G.subscriptionStatus)==="paid"&&e.jsxs(e.Fragment,{children:[e.jsxs(z,{onClick:()=>{pt(G),Pe()},children:[e.jsx(xe,{children:e.jsx(ft,{fontSize:"small",sx:{color:g.success.text}})}),e.jsx(ce,{children:"Edit Payment"})]},"edit-payment"),e.jsxs(z,{onClick:()=>{Bt(G.id),Pe()},children:[e.jsx(xe,{children:e.jsx(os,{fontSize:"small",sx:{color:g.error.text}})}),e.jsx(ce,{children:"Undo Payment"})]},"undo-payment")]})]}),e.jsx(Fe,{open:Ze,onClose:()=>{je(!1),ze()},maxWidth:"sm",fullWidth:!0,children:Ze&&e.jsxs(e.Fragment,{children:[e.jsxs(Ne,{sx:{display:"flex",alignItems:"center",justifyContent:"space-between"},children:[e.jsx(y,{variant:"h6",component:"div",sx:{fontWeight:600},children:qe?"Edit Flat Owner":"Register New Flat Owner"}),e.jsx(V,{onClick:()=>{je(!1),ze()},children:e.jsx(he,{})})]}),e.jsx(Be,{children:e.jsxs(D,{container:!0,spacing:2,sx:{mt:.5},children:[e.jsx(D,{size:12,children:e.jsx(oe,{fullWidth:!0,label:"Owner Name",value:C.name,onChange:t=>Z({...C,name:t.target.value}),required:!0})}),e.jsx(D,{size:{xs:4},children:e.jsxs(ne,{fullWidth:!0,required:!0,children:[e.jsx(le,{children:"Block"}),e.jsx(re,{value:C.block,onChange:t=>Z({...C,block:t.target.value}),label:"Block",children:((n==null?void 0:n.blocks)||[]).map(t=>e.jsxs(z,{value:t,children:["Block ",t]},t))})]})}),e.jsx(D,{size:{xs:4},children:e.jsxs(ne,{fullWidth:!0,required:!0,children:[e.jsx(le,{children:"Floor"}),e.jsx(re,{value:C.floor,onChange:t=>Z({...C,floor:t.target.value}),label:"Floor",children:((n==null?void 0:n.floors)||[]).map(t=>e.jsxs(z,{value:t,children:["Floor ",t]},t))})]})}),e.jsx(D,{size:{xs:4},children:e.jsxs(ne,{fullWidth:!0,required:!0,children:[e.jsx(le,{children:"Type"}),e.jsx(re,{value:C.flatType,onChange:t=>Z({...C,flatType:t.target.value}),label:"Type",children:((n==null?void 0:n.flatTypes)||[]).map(t=>e.jsxs(z,{value:t,children:["Type ",t]},t))})]})}),e.jsx(D,{size:{xs:6},children:e.jsx(oe,{fullWidth:!0,label:"Mobile Number",value:C.mobile,onChange:t=>Z({...C,mobile:t.target.value})})}),e.jsx(D,{size:{xs:6},children:e.jsx(oe,{fullWidth:!0,label:"Email",type:"email",value:C.email,onChange:t=>Z({...C,email:t.target.value})})}),e.jsx(D,{size:12,children:e.jsx(oe,{fullWidth:!0,label:"Remarks",multiline:!0,rows:2,value:C.remarks,onChange:t=>Z({...C,remarks:t.target.value})})})]})}),e.jsxs(Je,{sx:{p:3},children:[e.jsx(R,{onClick:()=>{je(!1),ze()},children:"Cancel"}),e.jsx(R,{variant:"contained",onClick:Ft,disabled:!C.name||!C.block||!C.floor||!C.flatType,children:qe?"Update":"Register"})]})]})}),e.jsx(Fe,{open:at,onClose:()=>ye(!1),maxWidth:"sm",fullWidth:!0,children:at&&e.jsxs(e.Fragment,{children:[e.jsxs(Ne,{sx:{display:"flex",alignItems:"center",justifyContent:"space-between"},children:[e.jsxs(b,{children:[e.jsx(y,{variant:"h6",component:"div",sx:{fontWeight:600},children:"Record Subscription Payment"}),te&&e.jsxs(y,{variant:"body2",sx:{color:"text.secondary"},children:[te.name," — ",te.flatNumber]})]}),e.jsx(V,{onClick:()=>ye(!1),children:e.jsx(he,{})})]}),e.jsx(Be,{children:e.jsxs(D,{container:!0,spacing:2,sx:{mt:.5},children:[e.jsx(D,{size:{xs:6},children:e.jsx(oe,{fullWidth:!0,label:"Amount",type:"number",value:j.amount,onChange:t=>_({...j,amount:t.target.value}),slotProps:{input:{startAdornment:e.jsx(gt,{position:"start",children:"₹"})}}})}),e.jsx(D,{size:{xs:6},children:e.jsx(Ke,{label:"Transaction Date",value:new Date(j.transactionDate),onChange:t=>{t&&!isNaN(t.getTime())&&_({...j,transactionDate:ae(t)})},format:Ge(n==null?void 0:n.dateFormat),sx:{width:"100%"},slotProps:{actionBar:{actions:["clear","cancel","accept"]},textField:{fullWidth:!0}}})}),e.jsx(D,{size:{xs:6},children:e.jsxs(ne,{fullWidth:!0,children:[e.jsx(le,{children:"Payment Mode"}),e.jsx(re,{value:j.paymentMode,onChange:t=>_({...j,paymentMode:t.target.value}),label:"Payment Mode",children:Ns.map(t=>e.jsx(z,{value:t,children:t},t))})]})}),e.jsxs(D,{size:12,children:[e.jsx(y,{variant:"body2",sx:{mb:1,color:"text.secondary"},children:"Upload Payment Proof (Screenshots)"}),e.jsxs(D,{container:!0,spacing:2,children:[e.jsx(D,{size:6,children:e.jsxs(R,{variant:"outlined",component:"label",startIcon:e.jsx(is,{}),fullWidth:!0,sx:{py:1.5,borderStyle:"dashed",borderWidth:2},children:["Camera",e.jsx("input",{type:"file",hidden:!0,accept:"image/*",capture:"environment",onChange:ut})]})}),e.jsx(D,{size:6,children:e.jsxs(R,{variant:"outlined",component:"label",startIcon:e.jsx(cs,{}),fullWidth:!0,sx:{py:1.5,borderStyle:"dashed",borderWidth:2},children:["Gallery",e.jsx("input",{type:"file",hidden:!0,multiple:!0,accept:"image/*",onChange:ut})]})})]})]}),(j.existingProofs&&j.existingProofs.length>0||j.proofFiles&&j.proofFiles.length>0)&&e.jsxs(D,{size:12,children:[e.jsx(y,{variant:"caption",sx:{color:"text.secondary",display:"block",mb:1},children:"Attached Proofs:"}),e.jsxs(b,{sx:{display:"flex",gap:1.5,flexWrap:"wrap"},children:[j.existingProofs&&j.existingProofs.map((t,s)=>e.jsxs(b,{sx:{position:"relative",width:64,height:64},children:[e.jsx("img",{src:t,alt:"Existing proof",style:{width:"100%",height:"100%",objectFit:"cover",borderRadius:4,border:"1px solid rgba(128,128,128,0.2)"}}),e.jsx(V,{size:"small",onClick:()=>Rt(s),sx:{position:"absolute",top:-6,right:-6,backgroundColor:Te.error.main(!0),color:"white","&:hover":{backgroundColor:Te.error.dark(!0)},p:.2},children:e.jsx(he,{sx:{fontSize:14}})})]},`exist-${s}`)),j.proofFiles&&j.proofFiles.map((t,s)=>{const a=URL.createObjectURL(t);return e.jsxs(b,{sx:{position:"relative",width:64,height:64},children:[e.jsx("img",{src:a,alt:"New proof",style:{width:"100%",height:"100%",objectFit:"cover",borderRadius:4,border:"1px solid rgba(128,128,128,0.2)"}}),e.jsx(V,{size:"small",onClick:()=>Mt(s),sx:{position:"absolute",top:-6,right:-6,backgroundColor:Te.error.main(!0),color:"white","&:hover":{backgroundColor:Te.error.dark(!0)},p:.2},children:e.jsx(he,{sx:{fontSize:14}})})]},`new-${s}`)})]})]}),e.jsx(D,{size:12,children:e.jsx(oe,{fullWidth:!0,label:"Remarks",multiline:!0,rows:2,value:j.remarks,onChange:t=>_({...j,remarks:t.target.value})})})]})}),e.jsxs(Je,{sx:{p:3},children:[e.jsx(R,{onClick:()=>ye(!1),children:"Cancel"}),e.jsx(R,{variant:"contained",onClick:Nt,disabled:!(Number(j.amount)>0)||!j.paymentMode,startIcon:e.jsx(ds,{}),children:"Record Payment"})]})]})}),e.jsx(Fe,{open:nt,onClose:()=>Re(!1),maxWidth:"md",fullWidth:!0,children:nt&&e.jsxs(e.Fragment,{children:[e.jsxs(Ne,{sx:{display:"flex",justifyContent:"space-between",alignItems:"center"},children:[e.jsx(y,{variant:"h6",component:"span",children:"Payment Proof"}),e.jsx(V,{onClick:()=>Re(!1),children:e.jsx(he,{})})]}),e.jsx(Be,{sx:{p:2,textAlign:"center",maxHeight:"80vh",overflowY:"auto"},children:ke&&ke.map((t,s)=>e.jsxs(b,{sx:{mb:s===ke.length-1?0:3,position:"relative"},children:[ke.length>1&&e.jsxs(y,{variant:"caption",sx:{color:"text.secondary",display:"block",mb:1},children:["Image ",s+1," of ",ke.length]}),e.jsx("img",{src:t,alt:`Payment Proof ${s+1}`,style:{maxWidth:"100%",maxHeight:"70vh",objectFit:"contain",borderRadius:8}})]},s))})]})}),e.jsx(Fs,{open:Pt,onClose:()=>lt(!1),initialBlock:$t,config:n,allPendingResidents:Ee,onPrintPending:_e}),e.jsx(zs,{open:Ie.open,title:Ie.title,message:Ie.message,onConfirm:Ie.onConfirm,onCancel:()=>Ue(t=>({...t,open:!1}))})]})};export{Vs as default};
