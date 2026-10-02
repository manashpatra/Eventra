import{o as Rt,z as It,j as e,d as h,aI as x,aB as At,bv as Tt,bw as Ft,aF as Wt,a_ as Lt,F as Mt,ah as pe,ai as we,f as l,ak as z,al as qe,aT as Et,h as F,I as k,aQ as Ge,bu as Ce,as as H,at as Q,au as q,M as b,k as Z,bx as Oe,l as ae,aw as _t,by as Ye,b0 as Je,b1 as Ze,a2 as Xe,aU as Ut,aV as Bt,aW as Ht,aX as ze,aY as f,aZ as Qt,V as $e,b3 as qt,m as Ke,aq as Ve,x as et,b8 as Gt,b6 as Ot,b7 as Yt,av as Jt,ad as Zt,q as tt,L as W,b4 as nt,s as L,bh as Xt,D as Kt,aM as Vt,bd as en,bz as tn}from"./mui-zF2F5Mg6.js";import{r as v,e as nn,a as sn}from"./vendor-Eb6I9DOa.js";import{g as on,a as an,u as rn,c as ln,d as cn}from"./sponsorshipService-CfRIloRG.js";import{_ as dn,j as p,c as ie,u as xn,q as pn,a as mn,k as D,s as c,A as ke,h as st,m as hn}from"./index-DI06tiVg.js";import{e as ot,b as G,f as De,c as Pe}from"./dateUtils-B51heJDl.js";import{printHTML as at,generateImageFromHTML as Ne,generatePDFFromHTML as it}from"./core-DAhjXDl_.js";import{S as un,a as gn,g as rt}from"./receiptTemplate-DCxfz2bi.js";import{b as fn}from"./upiHelper-CLcM_b2x.js";import{s as y,g as xt,a as pt,f as he,b as bn}from"./shared-CV6vT0xK.js";import{n as me,m as vn}from"./flatHelper-BWQVbCP2.js";import{C as jn}from"./ConfirmDialog-Cww8gLSu.js";import{g as lt}from"./firebase-C8g9S9QQ.js";import{u as yn}from"./useDebounce-7lEYopbX.js";import{D as Re}from"./DatePicker-BD0tk4u3.js";function Sn(o){if(o===0)return"Zero";const d=["","One ","Two ","Three ","Four ","Five ","Six ","Seven ","Eight ","Nine ","Ten ","Eleven ","Twelve ","Thirteen ","Fourteen ","Fifteen ","Sixteen ","Seventeen ","Eighteen ","Nineteen "],i=["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"],M=P=>{if((P=P.toString()).length>9)return"overflow";const g=("000000000"+P).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);if(!g)return"";let w="";return w+=g[1]!=0?(d[Number(g[1])]||i[g[1][0]]+" "+d[g[1][1]])+"Crore ":"",w+=g[2]!=0?(d[Number(g[2])]||i[g[2][0]]+" "+d[g[2][1]])+"Lakh ":"",w+=g[3]!=0?(d[Number(g[3])]||i[g[3][0]]+" "+d[g[3][1]])+"Thousand ":"",w+=g[4]!=0?(d[Number(g[4])]||i[g[4][0]]+" "+d[g[4][1]])+"Hundred ":"",w+=g[5]!=0?(w!=""?"and ":"")+(d[Number(g[5])]||i[g[5][0]]+" "+d[g[5][1]]):"",w.trim()},A=Math.floor(o);return M(A)+" only"}async function wn(o,d={},i=!1){const M=o.invoiceDate?ot(o.invoiceDate,d==null?void 0:d.dateFormat):ot(new Date,d==null?void 0:d.dateFormat),A=o.invoiceRef||(o.id?o.id.substring(0,6).toUpperCase():"001"),P=((d.committeeName||"DPC")+" "+(d.year||"")).trim().toUpperCase(),g=(d.societyName||"Society").trim().toUpperCase(),w=o.sponsorType==="External",O=fn({amount:o.amount||0,flatNumber:"",mode:"sponsor",pa:(d==null?void 0:d.upiPayeeAddress)||"",pn:(d==null?void 0:d.upiPayeeName)||"",tn:o.sponsorName});let S="";try{S=await(await dn(async()=>{const{default:Y}=await import("./browser-BJzWpxwN.js").then(ee=>ee.b);return{default:Y}},[])).default.toDataURL(O,{margin:1,width:120})}catch(N){console.error("Failed to generate QR code",N)}const X=i?"20px":"28px",a="800px",ue=i?"13px":"14px",E=i?"10px":"11px",K=i?"12px":"13px",V=`
  <div id="invoice-container" style="font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: ${X}; width: ${a}; max-width: ${a}; background: ${p.white}; color: ${p.slateBody}; margin: 0 auto; box-sizing: border-box; border: ${y(i,"none",`1px solid ${p.borderGray}`)}; border-radius: 10px; box-shadow: ${y(i,"none","0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -1px rgba(0,0,0,0.04)")};">
    
    <style>
      #invoice-container * { box-sizing: border-box; }
      ${xt(i)}
      #invoice-container .inv-title-bar {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 24px;
        background: linear-gradient(135deg, ${ie.orangeDeep}, ${ie.orange});
        color: ${p.white};
        border-radius: 6px;
        padding: ${y(i,"8px 16px","10px 20px")};
        margin: ${y(i,"12px 0 18px","16px 0 24px")};
      }
      #invoice-container .inv-title-bar .inv-title {
        font-size: ${y(i,"14px","16px")};
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 2px;
      }
      #invoice-container .inv-title-bar .inv-badge {
        font-size: ${E};
        font-weight: 700;
        background: rgba(255,255,255,0.2);
        padding: 3px 10px;
        border-radius: 20px;
        letter-spacing: 1px;
        text-transform: uppercase;
      }
      #invoice-container .inv-meta {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: ${y(i,"18px","24px")};
        padding: 0 4px;
      }
      #invoice-container .inv-meta .meta-item {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      #invoice-container .inv-meta .meta-label {
        font-size: ${E};
        color: ${p.slateLight};
        text-transform: uppercase;
        letter-spacing: 0.5px;
        font-weight: 600;
      }
      #invoice-container .inv-meta .meta-value {
        font-size: ${ue};
        color: ${p.slateHead};
        font-weight: 700;
      }
      #invoice-container .inv-to {
        background: ${p.bgSlateLight};
        border: 1px solid ${p.borderSlate};
        border-radius: 8px;
        padding: ${y(i,"12px 14px","14px 18px")};
        margin-bottom: ${y(i,"18px","24px")};
      }
      #invoice-container .inv-to .to-label {
        font-size: ${E};
        color: ${p.slateLight};
        text-transform: uppercase;
        letter-spacing: 0.5px;
        font-weight: 600;
        margin-bottom: 4px;
      }
      #invoice-container .inv-to .to-name {
        font-size: ${y(i,"15px","17px")};
        color: ${p.slateHead};
        font-weight: 800;
        margin-bottom: 2px;
      }
      #invoice-container .inv-to .to-org {
        font-size: ${K};
        color: ${p.slateSubtle};
        font-weight: 500;
      }
      #invoice-container .inv-table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
        margin-bottom: 0;
        border-radius: 8px;
        overflow: hidden;
        border: 1px solid ${p.borderSlate};
      }
      #invoice-container .inv-table th {
        background: ${p.bgSlateSubtle};
        color: ${p.slateMedium};
        font-size: ${E};
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        padding: ${y(i,"8px 10px","10px 14px")};
        border-bottom: 2px solid ${p.borderSlate};
      }
      #invoice-container .inv-table td {
        padding: ${y(i,"8px 10px","10px 14px")};
        font-size: ${K};
        color: ${p.slateMedium};
        border-bottom: 1px solid ${p.bgSlateSubtle};
      }
      #invoice-container .inv-table .item-cell {
        vertical-align: top;
        min-height: ${y(i,"100px","120px")};
        height: ${y(i,"100px","120px")};
      }
      #invoice-container .inv-table .total-row td {
        background: ${p.bgSlateLight};
        font-weight: 800;
        border-bottom: none;
      }
      #invoice-container .inv-table .total-row .total-amount {
        color: ${p.orangeBanner};
        font-size: ${y(i,"16px","18px")};
      }
      #invoice-container .inv-table .total-row .words-cell {
        font-weight: 600;
        font-size: ${E};
        color: ${p.slateSubtle};
        font-style: italic;
      }
      #invoice-container .inv-footer {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        margin-top: ${y(i,"30px","40px")};
        padding: 0 4px;
      }
      #invoice-container .inv-qr {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
      }
      #invoice-container .inv-qr .qr-label {
        font-size: ${y(i,"8px","9px")};
        color: ${p.slateLight};
        text-transform: uppercase;
        letter-spacing: 0.5px;
        font-weight: 600;
      }
      #invoice-container .inv-stamp {
        text-align: right;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 4px;
      }
      #invoice-container .inv-stamp .stamp-label {
        font-size: ${E};
        color: ${p.slateLight};
        text-transform: uppercase;
        letter-spacing: 0.5px;
        font-weight: 600;
        border-top: 2px solid ${p.borderSlate};
        padding-top: 6px;
        margin-top: 4px;
      }
      #invoice-container .inv-stamp .stamp-committee {
        font-size: ${K};
        color: ${p.slateMedium};
        font-weight: 700;
      }
      #invoice-container .inv-generated {
        text-align: center;
        color: ${p.slateLight};
        font-size: ${y(i,"8px","9px")};
        margin-top: ${y(i,"16px","24px")};
        text-transform: uppercase;
        letter-spacing: 0.5px;
        font-weight: 600;
        border-top: 1px dashed ${p.borderGray};
        padding-top: ${y(i,"10px","14px")};
      }
    </style>
    
    ${pt(d)}
    
    <div class="inv-title-bar">
      <span class="inv-title">${o.status==="Received"?"Invoice":"Pro Forma Invoice"}</span>
      <span class="inv-badge">Original</span>
    </div>
    
    <div class="inv-meta">
      <div class="meta-item">
        <span class="meta-label">Reference No.</span>
        <span class="meta-value">${A}</span>
      </div>
      <div class="meta-item" style="text-align: right;">
        <span class="meta-label">Invoice Date</span>
        <span class="meta-value">${M}</span>
      </div>
    </div>
    
    <div class="inv-to">
      <div class="to-label">Bill To</div>
      <div class="to-name">${o.sponsorName||"____________________"}</div>
      ${o.organization?`<div class="to-org">${o.organization}</div>`:""}
    </div>
    
    <table class="inv-table">
      <thead>
        <tr>
          <th style="text-align: left; width: 5%;">Sl.</th>
          <th style="text-align: left; width: 45%;">Description</th>
          <th style="text-align: right; width: 15%;">Rate</th>
          <th style="text-align: center; width: 15%;">Qty</th>
          <th style="text-align: right; width: 20%;">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="item-cell">1</td>
          <td class="item-cell">
            <div style="font-weight: 500;">${o.invoiceDescription||"Sponsorship / Stall arrangement"}</div>
            ${o.remarks?`<div style="font-size: \${sz(forImage, '9px', '10px')}; color: ${p.slateMuted}; font-weight: normal; margin-top: 2px;">${o.remarks}</div>`:""}
          </td>
          <td class="item-cell" style="text-align: right;">${he((o.amount||0)/(o.invoiceQuantity||1))}</td>
          <td class="item-cell" style="text-align: center;">${o.invoiceQuantity||1}</td>
          <td class="item-cell" style="text-align: right; font-weight: 700;">${he(o.amount||0)}</td>
        </tr>
        <tr class="total-row">
          <td colspan="4" class="words-cell">
            Rupees in Words — ${Sn(o.amount||0)}
          </td>
          <td style="text-align: right;" class="total-amount">
            ${he(o.amount||0)}
          </td>
        </tr>
      </tbody>
    </table>
    ${w?`<div style="display: flex; justify-content: flex-end; margin-top: 50px; margin-bottom: 30px; align-items: flex-end;">
      <img src="${un}" alt="Stamp" style="height: 105px; margin-right: 20px; opacity: 0.9;" />
      <div style="text-align: center;">
        <div style="font-weight: bold; font-size: 12px;">For ${P} ${g} Flat Owners</div>
        <img src="${gn}" alt="Signature" style="height: 50px; margin: 10px auto; display: block;" />
        <div style="border-top: 1px solid ${p.black}; padding-top: 5px; width: 150px; font-weight: bold; margin: 0 auto;">Authorized Signatory</div>
      </div>
    </div>`:""}

    <div style="display: flex; justify-content: space-between; align-items: stretch; border: 1px solid ${p.black};">
      <div style="padding: 10px; font-size: 12px; line-height: 1.5; flex: 1; border-right: 1px solid ${p.black};">
        <div>Cheque/ DD in favour of : <strong>${d.chequeFavourName||`Association of ${d.societyName||"Society"} Flat Owners DA`}</strong></div>
        <div>A/C No: <strong>627505031179</strong>; IFSC Code: <strong>ICIC0006275</strong>, Bank Name: ICICI Bank</div>
        <div>PAN: <strong>AAVCA0550H</strong></div>
      </div>
      <div style="padding: 5px; text-align: center; width: 140px;">
        <img src="${S}" alt="UPI QR" style="width: 100px; height: 100px; display: block; margin: 0 auto;"/>
        <div style="font-size: 10px; font-weight: bold; margin-top: 5px;">Scan to Pay via UPI</div>
      </div>
    </div>  
  </div>`;return i?V:`<html><head><title>${o.status==="Received"?"Invoice":"Pro Forma Invoice"}</title><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="margin:0;display:flex;justify-content:center;background:${p.bgGray};padding:40px 20px;">${V}</body></html>`}function ct(o,d={}){(d.committeeName||"Committee").trim().toUpperCase(),(d.year||"").trim().toUpperCase();const i=new Date,M=String(i.getDate()).padStart(2,"0"),A=i.toLocaleString("en-GB",{month:"short"}).toUpperCase(),P=i.getFullYear(),w=`${d.societyName?d.societyName.toUpperCase().replace(/\s+/g,"_"):"SOCIETY"}_DPC_SPO_${M}_${A}_${P}`,O=o.map((S,X)=>`
    <tr>
      <td>${X+1}</td>
      <td>${S.sponsorName||"-"}</td>
      <td>${S.organization||"-"}</td>
      <td>${S.amount?he(S.amount):"-"}</td>
      <td>${S.trackingLead||"-"}</td>
      <td>${S.status||"-"}</td>
      <td>${S.statusNote||"-"}</td>
    </tr>
  `).join("");return`
    <html>
      <head>
        <title>${w}</title>
        <style>
          ${xt()}
          body { font-family: system-ui, -apple-system, sans-serif; padding: 20px; color: ${p.slateBody}; }
          .report-title { text-align: center; margin-bottom: 20px; color: ${p.orangeBanner}; font-size: 16px; font-weight: bold; text-transform: uppercase; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid ${p.borderGray}; padding: 10px; text-align: left; font-size: 13px; }
          th { background: ${p.bgGray}; color: ${p.slateMedium}; font-weight: 700; }
        </style>
      </head>
      <body>
        ${pt(d)}
        <div class="report-title">Sponsorships Status Report</div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Sponsor</th>
              <th>Organization</th>
              <th>Amount</th>
              <th>Tracking Lead</th>
              <th>Status</th>
              <th>Status Note</th>
            </tr>
          </thead>
          <tbody>
            ${O}
          </tbody>
        </table>
        ${bn(d)}
      </body>
    </html>
  `}const dt=o=>{if(!o)return"-";const d=/\b(?:\d{1,2}(?:st|nd|rd|th)?\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*(?:\s+\d{2,4})?|\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})\b/gi,i=o.match(d);return i&&i.length>0?i.join(", "):"-"},Mn=()=>{const{user:o}=xn(),{startProcessing:d,stopProcessing:i}=pn(),M=Rt(),A=It(M.breakpoints.down("md")),P=(o==null?void 0:o.role)==="Auditor",g=(o==null?void 0:o.role)==="Super Admin",w=(o==null?void 0:o.role)==="Super Admin"||(o==null?void 0:o.role)==="Admin"||(o==null?void 0:o.role)==="Treasurer",O=g||(o==null?void 0:o.role)==="Admin"||(o==null?void 0:o.role)==="Collection"||(o==null?void 0:o.role)==="Treasurer",[S,X]=v.useState([]),[a,ue]=v.useState(null),[E,K]=v.useState(!0),[V,N]=v.useState(!1),[Y,ee]=v.useState(null),[Ie,mt]=v.useState(""),te=yn(Ie,300),ht=nn(),Ae=new URLSearchParams(ht.search),ut=Ae.get("lead")||"All",gt=Ae.get("status")||"All",[re,ft]=v.useState("All"),[J,bt]=v.useState(ut),[le,vt]=v.useState(gt),[T,jt]=v.useState({totalSponsorships:0,pendingSponsorships:0,totalAmount:0,externalCount:0,externalAmount:0,internalCount:0,internalAmount:0,totalCamAmount:0,totalNetAmount:0}),[ce,ge]=v.useState({open:!1,title:"",message:"",onConfirm:null}),[Te,fe]=v.useState(!1),[ne,yt]=v.useState([]),[se,Fe]=v.useState(0),[_,St]=v.useState(25),[We,be]=v.useState(null),[de,ve]=v.useState(null),je=()=>{be(null),ve(null)},[xe,Le]=v.useState(null),[C,Me]=v.useState(null),Ee=(t,n)=>{Le(t.currentTarget),Me(n)},U=()=>{Le(null),Me(null)},[s,u]=v.useState({sponsorName:"",sponsorType:"External",contactNumber:"",email:"",trackingLead:null,statusNote:"",organization:"",amount:"",paymentMode:"",remarks:"",proofFiles:[],existingProofs:[],paymentProofUrl:null,transactionDate:null,invoiceRef:"",invoiceDate:G(),invoiceDescription:"",invoiceQuantity:1,status:"Pending",refundDate:null,refundMode:"",refundRemarks:""});v.useEffect(()=>{ye()},[]);const ye=async()=>{try{const[t,n]=await Promise.all([on(),mn()]),r=await an(t);X(t),ue(n),jt(r)}catch(t){console.error("Error:",t)}finally{K(!1)}},B=v.useMemo(()=>{let t=[...S];if(re!=="All"&&(t=t.filter(n=>(n.sponsorType||"External")===re)),J!=="All")if(J==="Unassigned")t=t.filter(n=>!n.trackingLead);else if(J==="me"){const n=(o==null?void 0:o.fullName)||(o==null?void 0:o.displayName),r=o==null?void 0:o.email;t=t.filter(m=>m.trackingLead&&(m.trackingLead===n||m.trackingLead===r||n&&m.trackingLead.includes(n)||r&&m.trackingLead.includes(r)))}else t=t.filter(n=>n.trackingLead===J);if(le!=="All"&&(t=t.filter(n=>(n.status||"Received")===le)),te){const n=te.toLowerCase(),r=me(te),m=r.length>0?new RegExp(r.split("").join("0*")):null;t=t.filter(j=>!!(vn(j,te)||(j.organization||"").toLowerCase().includes(n)||(j.remarks||"").toLowerCase().includes(n)||(j.invoiceDescription||"").toLowerCase().includes(n)||m&&(m.test(me(j.organization))||m.test(me(j.remarks))||m.test(me(j.invoiceDescription)))))}return t.sort((n,r)=>new Date(r.createdAt)-new Date(n.createdAt))},[S,te,re,J,le,o]),wt=v.useMemo(()=>{const t=new Set;return S.forEach(n=>{n.trackingLead&&t.add(n.trackingLead)}),Array.from(t).sort()},[S]),Ct=async()=>{d("Saving sponsorship...");try{if(s.status==="Received"&&!s.transactionDate){alert("Transaction Date is required when status is marked as Received.");return}const t={sponsorName:s.sponsorName,sponsorType:s.sponsorType||"External",contactNumber:s.contactNumber,email:s.email,trackingLead:s.trackingLead,statusNote:s.statusNote,organization:s.organization,amount:Number(s.amount)||0,paymentMode:s.paymentMode,remarks:s.remarks,transactionDate:s.transactionDate||null,paymentProofUrl:s.paymentProofUrl||null,invoiceRef:s.invoiceRef,invoiceDate:s.invoiceDate,invoiceDescription:s.invoiceDescription,invoiceQuantity:s.invoiceQuantity,status:s.status,refundDate:s.status==="Cancelled"&&s.refundDate||null,refundMode:s.status==="Cancelled"&&s.refundMode||"",refundRemarks:s.status==="Cancelled"&&s.refundRemarks||""};Y?await rn(Y,t,s.proofFiles,s.existingProofs):await ln(t,s.proofFiles),N(!1),Se(),await ye()}catch(t){console.error("Error:",t)}finally{i()}},_e=async t=>{if(ee(t.id),u({sponsorName:t.sponsorName,sponsorType:t.sponsorType||"External",contactNumber:t.contactNumber||"",email:t.email||"",trackingLead:t.trackingLead||null,statusNote:t.statusNote||"",organization:t.organization||"",amount:t.amount||"",paymentMode:t.paymentMode,remarks:t.remarks||"",proofFiles:[],existingProofs:[],paymentProofUrl:t.paymentProofUrl||null,transactionDate:t.transactionDate||null,invoiceRef:t.invoiceRef||"",invoiceDate:t.invoiceDate||G(),invoiceDescription:t.invoiceDescription||"",invoiceQuantity:t.invoiceQuantity||1,status:t.status||"Pending",refundDate:t.refundDate||null,refundMode:t.refundMode||"",refundRemarks:t.refundRemarks||""}),N(!0),t.paymentProofUrl){const n=await lt(t.id,t.paymentProofUrl);n&&u(r=>r.paymentProofUrl!==t.paymentProofUrl?r:{...r,existingProofs:Array.isArray(n)?n:[n]})}},zt=t=>{ee(null),u({sponsorName:t.sponsorName||"",sponsorType:t.sponsorType||"External",contactNumber:t.contactNumber||"",email:t.email||"",trackingLead:t.trackingLead||null,statusNote:t.statusNote||"",organization:t.organization||"",amount:t.amount?t.amount.toString():"",paymentMode:"",remarks:t.remarks||"",proofFiles:[],existingProofs:[],paymentProofUrl:null,transactionDate:null,invoiceRef:Ue(),invoiceDate:G(),invoiceDescription:t.invoiceDescription||"",invoiceQuantity:t.invoiceQuantity||1,status:"Pending",refundDate:null,refundMode:"",refundRemarks:""}),N(!0)},$t=t=>{ge({open:!0,title:"Delete Sponsorship",message:"Are you sure you want to delete this sponsorship? This action cannot be undone.",onConfirm:async()=>{d("Deleting sponsorship...");try{await cn(t),await ye()}finally{i(),ge(n=>({...n,open:!1}))}}})},Ue=()=>{let t=0;const n=`DPC/${(a==null?void 0:a.year)||"2026-27"}/`;return S.forEach(r=>{if(r.invoiceRef&&r.invoiceRef.startsWith(n)){const m=r.invoiceRef.substring(n.length),j=parseInt(m,10);!isNaN(j)&&j>t&&(t=j)}}),`${n}${String(t+1).padStart(4,"0")}`},Se=()=>{ee(null),u({sponsorName:"",sponsorType:"External",contactNumber:"",email:"",trackingLead:null,statusNote:"",organization:"",amount:"",paymentMode:"",remarks:"",proofFiles:[],existingProofs:[],paymentProofUrl:null,transactionDate:null,invoiceRef:Ue(),invoiceDate:G(),invoiceDescription:"",invoiceQuantity:1,status:"Pending",refundDate:null,refundMode:"",refundRemarks:""})},Be=t=>{const n=Array.from(t.target.files);n.length>0&&u(r=>({...r,proofFiles:[...r.proofFiles||[],...n]}))},kt=t=>{u(n=>({...n,proofFiles:n.proofFiles.filter((r,m)=>m!==t)}))},Dt=t=>{u(n=>({...n,existingProofs:n.existingProofs.filter((r,m)=>m!==t)}))},R=t=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",minimumFractionDigits:0}).format(t),He=async(t,n="image")=>{try{const r=await wn(t,a||{},!0);if(n==="pdf")(await it(r)).save(`${t.status==="Received"?"Invoice":"Pro_Forma_Invoice"}_${t.sponsorName.replace(/\s+/g,"_")}.pdf`);else{const j=(await Ne(r)).toDataURL("image/jpeg",1),$=document.createElement("a");$.href=j,$.download=`${t.status==="Received"?"Invoice":"Pro_Forma_Invoice"}_${t.sponsorName.replace(/\s+/g,"_")}.jpg`,document.body.appendChild($),$.click(),document.body.removeChild($)}}catch(r){console.error("Error downloading invoice:",r),alert("Failed to download invoice. "+r.message)}},Qe=async(t,n="image")=>{try{const r=rt(t,a||{},!0,"Sponsorship Receipt");if(n==="pdf")(await it(r)).save(`Sponsorship_Receipt_${t.sponsorName.replace(/\s+/g,"_")}.pdf`);else{const m=await Ne(r),j=await new Promise(oe=>m.toBlob(oe,"image/jpeg",.9)),$=window.URL.createObjectURL(j),I=document.createElement("a");I.href=$,I.download=`Sponsorship_Receipt_${t.sponsorName.replace(/\s+/g,"_")}.jpg`,document.body.appendChild(I),I.click(),document.body.removeChild(I),window.URL.revokeObjectURL($)}}catch(r){console.error("Error downloading receipt:",r),alert("Failed to download receipt. "+r.message)}},Pt=async t=>{try{const n=rt(t,a||{},!0,"Sponsorship Receipt"),r=await Ne(n),m=await new Promise(I=>r.toBlob(I,"image/jpeg",.9)),j=new File([m],`Sponsorship_Receipt_${t.sponsorName.replace(/\\s+/g,"_")}.jpg`,{type:"image/jpeg"}),$=`🙏 Thank You from ${(a==null?void 0:a.committeeName)||"Committee"} ${(a==null?void 0:a.year)||""} 🙏

The ${(a==null?void 0:a.committeeName)||"Committee"} sincerely thanks ${t.sponsorName} for your generous sponsorship of ₹${t.amount} towards Durga Puja.

Your kind support and contribution inspire us to make this year's celebration even more memorable for the entire ${(a==null?void 0:a.societyName)||"society"} family.

With heartfelt gratitude.
Jai Maa Durga! 🌺🙏
— ${(a==null?void 0:a.committeeName)||"Committee"} ${(a==null?void 0:a.year)||""}`;if(navigator.share){try{await navigator.clipboard.writeText($)}catch(I){console.warn("Clipboard write failed",I)}await navigator.share({files:[j],text:$,title:"Sponsorship Receipt"})}else{const I=window.URL.createObjectURL(m),oe=document.createElement("a");oe.href=I,oe.download=j.name,oe.click();const Nt=`https://api.whatsapp.com/send?text=${encodeURIComponent($)}`;window.open(Nt,"_blank")}}catch(n){console.error("Error sharing receipt:",n),alert("Failed to share receipt. "+n.message)}};return e.jsxs(h,{children:[e.jsx(x,{container:!0,spacing:{xs:1,md:2},sx:{mb:{xs:1.5,md:2},flexShrink:0},children:[{label:`Internal (${T.internalCount||0})`,value:R(T.internalAmount||0),color:D.internal,icon:e.jsx(At,{}),xs:6},{label:`External (${T.externalCount||0})`,value:R(T.externalAmount||0),color:D.external,icon:e.jsx(Tt,{}),xs:6},{label:"CAM (10% Ext.)",value:R(T.totalCamAmount||0),color:D.cam,icon:e.jsx(Ft,{}),xs:6},{label:`Total (${T.totalSponsorships||0})`,value:R(T.totalAmount||0),color:D.gross,icon:e.jsx(Wt,{}),xs:6},{label:`Pending (${T.pendingSponsorships||0})`,value:R(T.pendingAmount||0),color:D.pending,icon:e.jsx(Lt,{}),xs:12}].map((t,n)=>e.jsx(x,{size:{xs:t.xs,sm:4,md:2.4},children:e.jsx(Mt,{in:!0,timeout:400+n*100,children:e.jsx(pe,{sx:{textAlign:{xs:"left",sm:"center"},position:"relative",overflow:"hidden",height:"100%","&::before":{content:'""',position:"absolute",top:0,left:0,right:0,height:3,background:`linear-gradient(90deg, ${t.color}, ${t.color}88)`}},children:e.jsxs(we,{sx:{p:{xs:1,sm:2},"&:last-child":{pb:{xs:1,sm:2}},display:"flex",flexDirection:{xs:"row",sm:"column"},alignItems:"center",gap:{xs:1,sm:0}},children:[e.jsx(h,{sx:{width:{xs:32,sm:36},height:{xs:32,sm:36},borderRadius:"8px",background:`${t.color}15`,display:"flex",alignItems:"center",justifyContent:"center",mx:{xs:0,sm:"auto"},mb:{xs:0,sm:1},flexShrink:0},children:sn.cloneElement(t.icon,{sx:{color:t.color,fontSize:{xs:16,sm:20}}})}),e.jsxs(h,{sx:{flex:1,overflow:"hidden"},children:[e.jsx(l,{variant:"h6",sx:{fontWeight:800,color:t.color,fontSize:{xs:"0.85rem",sm:"1.15rem"},lineHeight:1.2},children:t.value}),e.jsx(l,{variant:"caption",sx:{color:"text.secondary",fontSize:{xs:"0.65rem",sm:"0.75rem"},lineHeight:1,display:"block",whiteSpace:"nowrap",textOverflow:"ellipsis",overflow:"hidden"},children:t.label})]})]})})})},t.label))}),e.jsx(pe,{sx:{mb:{xs:1.5,sm:3}},children:e.jsx(we,{sx:{p:{xs:1,sm:2},"&:last-child":{pb:{xs:1,sm:2}}},children:e.jsxs(h,{sx:{display:"flex",gap:{xs:1,sm:2},flexWrap:"wrap",alignItems:"center"},children:[e.jsxs(h,{sx:{display:"flex",gap:1,flex:{xs:"1 1 100%",sm:1},minWidth:{xs:"100%",sm:200}},children:[e.jsx(z,{size:"small",placeholder:"Search...",value:Ie,onChange:t=>mt(t.target.value),slotProps:{input:{startAdornment:e.jsx(qe,{position:"start",children:e.jsx(Et,{sx:{color:"text.secondary",fontSize:"1.2rem"}})})}},sx:{flex:1}}),A&&e.jsxs(e.Fragment,{children:[e.jsx(F,{title:"Print Status",children:e.jsx(k,{onClick:()=>{const t=ct(B,a);at(t)},sx:{border:`1px solid ${c.warning.border}`,color:c.warning.text,borderRadius:1,p:.75},children:e.jsx(Ge,{sx:{fontSize:"1.2rem"}})})}),!P&&e.jsx(F,{title:"Add Sponsor",children:e.jsx(k,{onClick:()=>{Se(),N(!0)},sx:{bgcolor:ie.orange,color:ke.contrastText,borderRadius:1,p:.75,"&:hover":{bgcolor:ie.orangeDark}},children:e.jsx(Ce,{sx:{fontSize:"1.2rem"}})})})]})]}),e.jsxs(H,{size:"small",sx:{flex:{xs:"1 1 30%",sm:"none"},minWidth:{xs:"30%",sm:150}},children:[e.jsx(Q,{sx:{fontSize:{xs:"0.8rem",sm:"1rem"}},children:"Type"}),e.jsxs(q,{value:re,label:"Type",onChange:t=>ft(t.target.value),sx:{fontSize:{xs:"0.8rem",sm:"1rem"}},children:[e.jsx(b,{value:"All",children:"All Types"}),e.jsx(b,{value:"External",children:"External"}),e.jsx(b,{value:"Internal",children:"Internal"})]})]}),e.jsxs(H,{size:"small",sx:{flex:{xs:"1 1 30%",sm:"none"},minWidth:{xs:"30%",sm:150}},children:[e.jsx(Q,{sx:{fontSize:{xs:"0.8rem",sm:"1rem"}},children:"Lead"}),e.jsxs(q,{value:J,label:"Lead",onChange:t=>bt(t.target.value),sx:{fontSize:{xs:"0.8rem",sm:"1rem"}},children:[e.jsx(b,{value:"All",children:"All Leads"}),e.jsx(b,{value:"me",children:"My Leads"}),e.jsx(b,{value:"Unassigned",children:"Unassigned"}),wt.map(t=>e.jsx(b,{value:t,children:t},t))]})]}),e.jsxs(H,{size:"small",sx:{flex:{xs:"1 1 30%",sm:"none"},minWidth:{xs:"30%",sm:150}},children:[e.jsx(Q,{sx:{fontSize:{xs:"0.8rem",sm:"1rem"}},children:"Status"}),e.jsxs(q,{value:le,label:"Status",onChange:t=>vt(t.target.value),sx:{fontSize:{xs:"0.8rem",sm:"1rem"}},children:[e.jsx(b,{value:"All",children:"All Status"}),e.jsx(b,{value:"Pending",children:"Pending"}),e.jsx(b,{value:"Received",children:"Received"}),e.jsx(b,{value:"Cancelled",children:"Cancelled"})]})]}),!A&&e.jsxs(h,{sx:{display:"flex",gap:1},children:[e.jsx(Z,{variant:"outlined",startIcon:e.jsx(Ge,{}),onClick:()=>{const t=ct(B,a);at(t)},children:"Print Status"}),!P&&e.jsx(Z,{variant:"contained",startIcon:e.jsx(Ce,{}),onClick:()=>{Se(),N(!0)},children:"Sponsor"})]})]})})}),e.jsxs(pe,{children:[A?e.jsxs(h,{sx:{p:{xs:1.5,sm:2},display:"flex",flexDirection:"column",gap:2},children:[B.slice(se*_,se*_+_).map(t=>{const n=(t.sponsorType||"External")==="External",r=n&&t.status!=="Cancelled"?Math.round((t.amount||0)*.1):0;return e.jsx(pe,{variant:"outlined",sx:{borderRadius:2,borderColor:"rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.02)"},children:e.jsxs(we,{sx:{p:1,"&:last-child":{pb:1}},children:[e.jsxs(h,{sx:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",mb:.5},children:[e.jsxs(h,{sx:{pr:1,display:"flex",alignItems:"flex-start",gap:1},children:[e.jsx(h,{sx:{display:"flex",alignItems:"center",justifyContent:"center",height:18,width:18,minWidth:18,flexShrink:0,borderRadius:1,fontSize:"0.65rem",fontWeight:700,mt:.2,backgroundColor:n?c.warning.bg:c.expense.bg,color:n?D.cam:D.gross,border:`1px solid ${n?c.warning.border:c.expense.border}`},children:n?"E":"I"}),e.jsxs(h,{children:[e.jsx(l,{variant:"body2",sx:{fontWeight:700,lineHeight:1.2,fontSize:"0.8rem"},children:t.sponsorName}),t.organization&&e.jsx(l,{sx:{color:"text.secondary",display:"block",fontSize:"0.65rem",mt:.25,lineHeight:1.2},children:t.organization})]})]}),t.status==="Pending"?e.jsx(F,{title:"Pending",placement:"left",children:e.jsx(h,{sx:{display:"flex",alignItems:"center",justifyContent:"center",height:22,width:22,borderRadius:"50%",backgroundColor:c.warning.bg,color:c.warning.text,flexShrink:0},children:e.jsx(Oe,{sx:{fontSize:"1rem"}})})}):t.status==="Cancelled"?e.jsx(F,{title:"Cancelled",placement:"left",children:e.jsx(h,{sx:{display:"flex",alignItems:"center",justifyContent:"center",height:22,width:22,borderRadius:"50%",backgroundColor:c.error.bg,color:c.error.text,flexShrink:0},children:e.jsx(ae,{sx:{fontSize:"1rem"}})})}):e.jsx(F,{title:t.status||"Received",placement:"left",children:e.jsx(h,{sx:{display:"flex",alignItems:"center",justifyContent:"center",height:22,width:22,borderRadius:"50%",backgroundColor:c.success.bg,color:c.success.text,flexShrink:0},children:e.jsx(_t,{sx:{fontSize:"1rem"}})})})]}),e.jsxs(x,{container:!0,spacing:0,sx:{mb:.5},children:[e.jsxs(x,{sx:{display:"flex",alignItems:"center",minWidth:0,pr:.5,mb:{xs:.5,sm:0},width:"38%"},children:[e.jsx(l,{sx:{color:"text.secondary",mr:.5,flexShrink:0,fontSize:"0.65rem"},children:"Inv:"}),e.jsx(l,{sx:{fontWeight:500,fontSize:"0.65rem"},noWrap:!0,children:t.invoiceRef||"-"})]}),e.jsxs(x,{sx:{display:"flex",alignItems:"center",minWidth:0,mb:{xs:.5,sm:0},width:"62%"},children:[e.jsx(l,{sx:{color:"text.secondary",mr:.5,flexShrink:0,fontSize:"0.65rem"},children:"For:"}),e.jsx(F,{title:t.invoiceDescription||"",children:e.jsx(l,{sx:{fontWeight:500,fontSize:"0.65rem"},noWrap:!0,children:t.invoiceDescription||"-"})})]}),e.jsxs(x,{sx:{display:"flex",alignItems:"center",minWidth:0,pr:.5,mb:{xs:.5,sm:0},width:"38%"},children:[e.jsx(l,{sx:{color:"text.secondary",mr:.5,flexShrink:0,fontSize:"0.65rem"},children:"Phone:"}),t.contactNumber?e.jsxs(h,{sx:{display:"flex",alignItems:"center",gap:1,minWidth:0},children:[e.jsx(l,{sx:{fontWeight:500,fontSize:"0.65rem"},noWrap:!0,children:t.contactNumber}),e.jsx(k,{size:"small",component:"a",href:`tel:${t.contactNumber}`,sx:{p:.2,color:c.success.text,bgcolor:c.success.bg,flexShrink:0},children:e.jsx(Ye,{sx:{fontSize:"0.75rem"}})})]}):e.jsx(l,{sx:{fontWeight:500,fontSize:"0.65rem"},children:"-"})]}),e.jsxs(x,{sx:{display:"flex",alignItems:"center",minWidth:0,width:"62%"},children:[e.jsx(l,{sx:{color:"text.secondary",mr:.5,flexShrink:0,fontSize:"0.65rem"},children:"Lead:"}),e.jsx(l,{sx:{fontWeight:500,fontSize:"0.65rem"},noWrap:!0,children:t.trackingLead||"-"})]}),(()=>{const m=dt(t.remarks),j=m!=="-";return e.jsxs(x,{size:12,sx:{display:"flex",alignItems:"center"},children:[e.jsx(l,{sx:{color:"text.secondary",mr:.5,flexShrink:0,whiteSpace:"nowrap",fontSize:"0.65rem"},children:j?"Event On:":"Desc:"}),e.jsx(F,{title:t.remarks||"",children:e.jsx(l,{sx:{fontWeight:500,fontSize:"0.65rem"},noWrap:!0,children:j?m:t.remarks||"-"})})]})})()]}),e.jsxs(h,{sx:{display:"flex",justifyContent:"space-between",alignItems:"center",borderTop:"1px solid rgba(255,255,255,0.05)",pt:.5},children:[e.jsxs(h,{sx:{display:"flex",alignItems:"center",gap:1,flexWrap:"wrap"},children:[e.jsxs(h,{sx:{display:"flex",alignItems:"baseline",gap:.5},children:[e.jsx(l,{sx:{color:"text.secondary",fontSize:"0.65rem"},children:"Amount:"}),e.jsx(l,{sx:{fontWeight:700,color:D.gross,fontSize:"0.8rem"},children:R(t.amount)})]}),t.transactionDate&&e.jsxs(h,{sx:{display:"flex",alignItems:"baseline",gap:.5},children:[e.jsx(l,{sx:{color:"text.secondary",fontSize:"0.65rem"},children:"Paid On:"}),e.jsx(l,{sx:{color:c.success.text,fontWeight:600,fontSize:"0.75rem"},children:De(t.transactionDate,a==null?void 0:a.dateFormat)})]}),n&&e.jsxs(h,{sx:{display:"flex",alignItems:"baseline",gap:.5},children:[e.jsx(l,{sx:{color:"text.secondary",fontSize:"0.65rem"},children:"CAM:"}),e.jsx(l,{sx:{color:t.status==="Cancelled"?"text.secondary":c.warning.text,fontWeight:t.status==="Cancelled"?400:600,fontSize:"0.75rem"},children:t.status==="Cancelled"?"-":R(r)})]})]}),e.jsxs(h,{sx:{display:"flex",alignItems:"center"},children:[O&&!((o==null?void 0:o.role)==="Collection"&&t.status!=="Pending")&&e.jsx(k,{size:"small",onClick:()=>_e(t),sx:{color:c.warning.text,p:.5},children:e.jsx(Je,{sx:{fontSize:"1.1rem"}})}),e.jsx(k,{size:"small",onClick:m=>Ee(m,t),sx:{p:.5},children:e.jsx(Ze,{sx:{fontSize:"1.1rem"}})})]})]})]})},t.id)}),B.length===0&&e.jsxs(h,{sx:{py:6,textAlign:"center"},children:[e.jsx(Xe,{sx:{fontSize:48,color:"rgba(255,255,255,0.1)",mb:1}}),e.jsx(l,{sx:{color:"text.secondary"},children:"No sponsors recorded yet"})]})]}):e.jsx(Ut,{children:e.jsxs(Bt,{size:"small",children:[e.jsx(Ht,{children:e.jsxs(ze,{children:[e.jsx(f,{children:"Invoice No"}),e.jsx(f,{children:"Sponsor"}),e.jsx(f,{children:"Organization"}),e.jsx(f,{children:"Amount"}),e.jsx(f,{children:"Status"}),e.jsx(f,{children:"Paid On"}),e.jsx(f,{children:"Mode"}),e.jsx(f,{children:"Contact"}),e.jsx(f,{children:"Event On"}),e.jsx(f,{children:"CAM (10%)"}),e.jsx(f,{children:"Lead"}),e.jsx(f,{align:"right",sx:{position:"sticky",right:0,zIndex:2,backgroundColor:"background.paper",borderLeft:"1px solid rgba(128,128,128,0.2)",whiteSpace:"nowrap",width:80,minWidth:80},children:"Actions"})]})}),e.jsxs(Qt,{children:[B.slice(se*_,se*_+_).map(t=>{const n=(t.sponsorType||"External")==="External",r=n&&t.status!=="Cancelled"?Math.round((t.amount||0)*.1):0;return e.jsxs(ze,{children:[e.jsx(f,{children:e.jsx(l,{variant:"body2",sx:{color:"text.secondary",fontSize:"0.75rem"},children:t.invoiceRef||"-"})}),e.jsx(f,{children:e.jsxs(h,{sx:{display:"flex",alignItems:"flex-start",gap:1},children:[e.jsx(h,{sx:{display:"flex",alignItems:"center",justifyContent:"center",height:20,width:20,minWidth:20,flexShrink:0,borderRadius:1,fontSize:"0.75rem",fontWeight:700,mt:.2,backgroundColor:n?c.warning.bg:c.expense.bg,color:n?D.cam:D.gross,border:`1px solid ${n?c.warning.border:c.expense.border}`},children:n?"E":"I"}),e.jsx(l,{variant:"body2",sx:{fontWeight:500,lineHeight:1.3},children:t.sponsorName})]})}),e.jsx(f,{children:e.jsx(l,{variant:"body2",sx:{color:"text.secondary"},children:t.organization||"-"})}),e.jsx(f,{children:e.jsx(l,{variant:"body2",sx:{fontWeight:600,color:D.gross},children:R(t.amount)})}),e.jsx(f,{children:t.status==="Pending"?e.jsx($e,{icon:e.jsx(Oe,{sx:{fontSize:"1rem !important",color:`${ie.orange} !important`}}),label:"Pending",size:"small",sx:{height:22,fontSize:"0.7rem",fontWeight:600,backgroundColor:c.warning.bg,color:c.warning.text,border:`1px solid ${c.warning.border}`}}):t.status==="Cancelled"?e.jsx($e,{label:"Cancelled",size:"small",sx:{height:22,fontSize:"0.7rem",fontWeight:600,backgroundColor:c.error.bg,color:c.error.text,border:`1px solid ${c.error.border}`}}):e.jsx($e,{label:t.status||"Received",size:"small",color:"success",variant:"outlined",sx:{height:22,fontSize:"0.7rem",fontWeight:600,border:`1px solid ${c.success.border}`,backgroundColor:c.success.bg}})}),e.jsx(f,{children:t.statusNote?e.jsx(F,{title:t.statusNote,placement:"top",children:e.jsx(l,{variant:"body2",sx:{color:"text.secondary",fontSize:"0.8rem",cursor:"help"},children:t.transactionDate?De(t.transactionDate,a==null?void 0:a.dateFormat):"-"})}):e.jsx(l,{variant:"body2",sx:{color:"text.secondary",fontSize:"0.8rem"},children:t.transactionDate?De(t.transactionDate,a==null?void 0:a.dateFormat):"-"})}),e.jsx(f,{children:e.jsx(l,{variant:"body2",sx:{color:"text.secondary"},children:t.paymentMode})}),e.jsx(f,{children:t.contactNumber?e.jsxs(h,{sx:{display:"flex",alignItems:"center",gap:.5},children:[e.jsx(l,{variant:"body2",sx:{color:"text.secondary"},children:t.contactNumber}),e.jsx(k,{size:"small",component:"a",href:`tel:${t.contactNumber}`,sx:{p:.5,color:c.success.text,bgcolor:c.success.bg},children:e.jsx(Ye,{sx:{fontSize:"0.9rem"}})})]}):e.jsx(l,{variant:"body2",sx:{color:"text.secondary"},children:"-"})}),e.jsx(f,{children:e.jsx(F,{title:t.remarks||"",placement:"top",children:e.jsx(l,{variant:"body2",sx:{color:"text.secondary",maxWidth:120},noWrap:!0,children:dt(t.remarks)})})}),e.jsx(f,{children:e.jsx(l,{variant:"body2",sx:{color:n&&t.status!=="Cancelled"?c.warning.text:"text.secondary",fontWeight:n&&t.status!=="Cancelled"?600:400},children:n&&t.status!=="Cancelled"?R(r):"-"})}),e.jsx(f,{children:e.jsx(l,{variant:"body2",sx:{color:"text.secondary",fontWeight:500},children:t.trackingLead||"-"})}),e.jsx(f,{align:"right",sx:{position:"sticky",right:0,zIndex:1,backgroundColor:"background.paper",borderLeft:"1px solid rgba(128,128,128,0.2)",whiteSpace:"nowrap"},children:e.jsxs(h,{sx:{display:"flex",justifyContent:"flex-end",alignItems:"center"},children:[O&&!((o==null?void 0:o.role)==="Collection"&&t.status!=="Pending")&&e.jsx(k,{size:"small",onClick:()=>_e(t),sx:{color:c.warning.text},children:e.jsx(Je,{fontSize:"small"})}),e.jsx(k,{size:"small",onClick:m=>Ee(m,t),children:e.jsx(Ze,{fontSize:"small"})})]})})]},t.id)}),B.length===0&&e.jsx(ze,{children:e.jsxs(f,{colSpan:12,align:"center",sx:{py:6},children:[e.jsx(Xe,{sx:{fontSize:48,color:"rgba(255,255,255,0.1)",mb:1}}),e.jsx(l,{sx:{color:"text.secondary"},children:"No sponsors recorded yet"})]})})]})]})}),e.jsx(qt,{rowsPerPageOptions:[10,25,50,100],component:"div",count:B.length,rowsPerPage:_,page:se,onPageChange:(t,n)=>Fe(n),onRowsPerPageChange:t=>{St(parseInt(t.target.value,10)),Fe(0)},sx:{borderTop:"1px solid rgba(255,255,255,0.05)"}})]}),e.jsx(Ke,{open:V,onClose:()=>N(!1),maxWidth:"sm",fullWidth:!0,children:V&&e.jsxs(e.Fragment,{children:[e.jsxs(Ve,{sx:{display:"flex",justifyContent:"space-between",alignItems:"center",p:{xs:1.5,sm:2}},children:[e.jsx(l,{variant:"h6",component:"div",sx:{fontWeight:600},children:Y?"Edit Sponsorship":"New Sponsorship"}),e.jsx(k,{onClick:()=>N(!1),children:e.jsx(ae,{})})]}),e.jsx(et,{sx:{p:{xs:1.5,sm:2}},children:e.jsxs(x,{container:!0,spacing:{xs:1.5,sm:2},sx:{pt:1},children:[e.jsx(x,{size:{xs:6,sm:6},children:e.jsx(z,{fullWidth:!0,size:"small",label:"Invoice No",value:s.invoiceRef,onChange:t=>u({...s,invoiceRef:t.target.value}),placeholder:"e.g. DPC/2026-27/0001"})}),e.jsx(x,{size:{xs:6,sm:6},children:e.jsx(Re,{label:"Invoice Date",value:new Date(s.invoiceDate),onChange:t=>{t&&!isNaN(t.getTime())&&u({...s,invoiceDate:G(t)})},format:Pe(a==null?void 0:a.dateFormat),sx:{width:"100%"},slotProps:{actionBar:{actions:["clear","cancel","accept"]},textField:{fullWidth:!0,size:"small"}}})}),e.jsx(x,{size:{xs:12,sm:12},children:e.jsx(z,{fullWidth:!0,size:"small",label:"Invoice Description",value:s.invoiceDescription,onChange:t=>u({...s,invoiceDescription:t.target.value}),placeholder:"e.g. Stall arrangement charges"})}),e.jsx(x,{size:{xs:12,sm:6},children:e.jsx(z,{fullWidth:!0,label:"Sponsor Name",value:s.sponsorName,onChange:t=>u({...s,sponsorName:t.target.value}),required:!0})}),e.jsx(x,{size:{xs:6,sm:3},children:e.jsxs(H,{fullWidth:!0,children:[e.jsx(Q,{children:"Sponsor Type"}),e.jsxs(q,{value:s.sponsorType,onChange:t=>u({...s,sponsorType:t.target.value}),label:"Sponsor Type",children:[e.jsx(b,{value:"External",children:"External"}),e.jsx(b,{value:"Internal",children:"Internal"})]})]})}),e.jsx(x,{size:{xs:6,sm:3},children:e.jsx(z,{fullWidth:!0,type:"number",label:"Quantity",value:s.invoiceQuantity||1,onChange:t=>u({...s,invoiceQuantity:parseInt(t.target.value)||1}),slotProps:{htmlInput:{min:1}}})}),e.jsx(x,{size:12,children:e.jsx(z,{fullWidth:!0,label:"Organization",value:s.organization,onChange:t=>u({...s,organization:t.target.value})})}),e.jsx(x,{size:{xs:6,sm:6},children:e.jsx(z,{fullWidth:!0,label:"Contact Number",value:s.contactNumber,onChange:t=>u({...s,contactNumber:t.target.value})})}),e.jsx(x,{size:{xs:6,sm:6},children:e.jsx(z,{fullWidth:!0,label:"Email",type:"email",value:s.email,onChange:t=>u({...s,email:t.target.value})})}),e.jsx(x,{size:12,children:e.jsx(z,{fullWidth:!0,label:"Description",multiline:!0,rows:2,value:s.remarks,onChange:t=>u({...s,remarks:t.target.value})})}),e.jsx(x,{size:{xs:12,sm:6},children:e.jsx(Gt,{freeSolo:!0,options:((a==null?void 0:a.userRoles)||[]).map(t=>t.fullName||t.email),value:s.trackingLead,onChange:(t,n)=>u({...s,trackingLead:n}),onInputChange:(t,n)=>u({...s,trackingLead:n}),renderInput:t=>e.jsx(z,{...t,label:"Tracking Lead"})})}),e.jsx(x,{size:{xs:12,sm:6},children:e.jsx(z,{fullWidth:!0,label:"Amount",type:"number",value:s.amount,onChange:t=>u({...s,amount:t.target.value}),slotProps:{input:{startAdornment:e.jsx(qe,{position:"start",children:"₹"})}}})}),s.sponsorType==="External"&&s.amount>0&&e.jsx(x,{size:12,children:e.jsxs(h,{sx:{p:1.5,borderRadius:1,backgroundColor:c.info.bg,border:`1px solid ${c.info.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"},children:[e.jsxs(l,{variant:"caption",sx:{color:c.warning.text,fontWeight:600},children:["CAM Allocation (10%): ",R(Math.round(s.amount*.1))]}),e.jsxs(l,{variant:"caption",sx:{color:c.success.text,fontWeight:600},children:["Net Fund (90%): ",R(Math.round(s.amount*.9))]})]})}),e.jsx(x,{size:{xs:12,sm:4},children:e.jsxs(H,{fullWidth:!0,children:[e.jsx(Q,{children:"Status"}),e.jsx(q,{value:s.status,onChange:t=>u({...s,status:t.target.value}),label:"Status",disabled:!w,children:["Received","Pending","Cancelled"].map(t=>e.jsx(b,{value:t,children:t},t))})]})}),e.jsx(x,{size:{xs:6,sm:4},children:e.jsxs(H,{fullWidth:!0,children:[e.jsx(Q,{children:"Payment Mode"}),e.jsx(q,{value:s.paymentMode||"",onChange:t=>u({...s,paymentMode:t.target.value}),label:"Payment Mode",disabled:s.status!=="Received",children:["UPI","Cash","Cheque","Net Banking"].map(t=>e.jsx(b,{value:t,children:t},t))})]})}),e.jsx(x,{size:{xs:6,sm:4},children:e.jsx(Re,{label:"Transaction Date",value:s.transactionDate?new Date(s.transactionDate):null,onChange:t=>{t&&!isNaN(t.getTime())?u({...s,transactionDate:G(t)}):u({...s,transactionDate:null})},disabled:s.status==="Pending",format:Pe(a==null?void 0:a.dateFormat),sx:{width:"100%"},slotProps:{actionBar:{actions:["clear","cancel","accept"]},textField:{fullWidth:!0,error:s.status==="Received"&&!s.transactionDate,helperText:s.status==="Received"&&!s.transactionDate?"Required":""}}})}),s.status==="Cancelled"&&e.jsxs(x,{size:12,sx:{mt:1},children:[e.jsx(l,{variant:"subtitle2",sx:{mb:1,color:"text.secondary",fontWeight:600,borderBottom:"1px solid",borderColor:"divider",pb:.5},children:"Refund Details"}),e.jsxs(x,{container:!0,spacing:2,children:[e.jsx(x,{size:{xs:6,sm:4},children:e.jsx(Re,{label:"Refund Date",value:s.refundDate?new Date(s.refundDate):null,onChange:t=>{t&&!isNaN(t.getTime())?u({...s,refundDate:G(t)}):u({...s,refundDate:null})},format:Pe(a==null?void 0:a.dateFormat),sx:{width:"100%"},slotProps:{actionBar:{actions:["clear","cancel","accept"]},textField:{fullWidth:!0,size:"small"}}})}),e.jsx(x,{size:{xs:6,sm:4},children:e.jsxs(H,{fullWidth:!0,size:"small",children:[e.jsx(Q,{children:"Refund Mode"}),e.jsx(q,{value:s.refundMode||"",onChange:t=>u({...s,refundMode:t.target.value}),label:"Refund Mode",children:["UPI","Cash","Cheque","Net Banking"].map(t=>e.jsx(b,{value:t,children:t},t))})]})}),e.jsx(x,{size:{xs:12,sm:4},children:e.jsx(z,{fullWidth:!0,size:"small",label:"Refund Remarks",value:s.refundRemarks,onChange:t=>u({...s,refundRemarks:t.target.value}),placeholder:"Reference / Note"})})]})]}),e.jsxs(x,{size:12,children:[e.jsx(l,{variant:"body2",sx:{mb:1,color:"text.secondary"},children:"Upload Payment Proof (Optional)"}),e.jsxs(x,{container:!0,spacing:2,children:[e.jsx(x,{size:6,children:e.jsxs(Z,{variant:"outlined",component:"label",startIcon:e.jsx(Ot,{}),fullWidth:!0,sx:{py:1.5,borderStyle:"dashed",borderWidth:2},children:["Camera",e.jsx("input",{type:"file",hidden:!0,accept:"image/*",capture:"environment",onChange:Be})]})}),e.jsx(x,{size:6,children:e.jsxs(Z,{variant:"outlined",component:"label",startIcon:e.jsx(Yt,{}),fullWidth:!0,sx:{py:1.5,borderStyle:"dashed",borderWidth:2},children:["Gallery",e.jsx("input",{type:"file",hidden:!0,multiple:!0,accept:"image/*",onChange:Be})]})})]})]}),(s.existingProofs&&s.existingProofs.length>0||s.proofFiles&&s.proofFiles.length>0)&&e.jsxs(x,{size:12,children:[e.jsx(l,{variant:"caption",sx:{color:"text.secondary",display:"block",mb:1},children:"Attached Proofs:"}),e.jsxs(h,{sx:{display:"flex",gap:1.5,flexWrap:"wrap"},children:[s.existingProofs&&s.existingProofs.map((t,n)=>e.jsxs(h,{sx:{position:"relative",width:64,height:64},children:[e.jsx("img",{src:t,alt:"Existing proof",style:{width:"100%",height:"100%",objectFit:"cover",borderRadius:4,border:"1px solid rgba(128,128,128,0.2)"}}),e.jsx(k,{size:"small",onClick:()=>Dt(n),sx:{position:"absolute",top:-6,right:-6,backgroundColor:c.error.text,color:ke.contrastText,"&:hover":{backgroundColor:st.error.dark(!0)},p:.2},children:e.jsx(ae,{sx:{fontSize:14}})})]},`exist-${n}`)),s.proofFiles&&s.proofFiles.map((t,n)=>{const r=URL.createObjectURL(t);return e.jsxs(h,{sx:{position:"relative",width:64,height:64},children:[e.jsx("img",{src:r,alt:"New proof",style:{width:"100%",height:"100%",objectFit:"cover",borderRadius:4,border:"1px solid rgba(128,128,128,0.2)"}}),e.jsx(k,{size:"small",onClick:()=>kt(n),sx:{position:"absolute",top:-6,right:-6,backgroundColor:c.error.text,color:ke.contrastText,"&:hover":{backgroundColor:st.error.dark(!0)},p:.2},children:e.jsx(ae,{sx:{fontSize:14}})})]},`new-${n}`)})]})]}),e.jsx(x,{size:12,children:e.jsx(z,{fullWidth:!0,label:"Status Note",multiline:!0,rows:2,value:s.statusNote,onChange:t=>u({...s,statusNote:t.target.value}),placeholder:"Any specific note on current status"})})]})}),e.jsxs(Jt,{sx:{p:{xs:1.5,sm:2},borderTop:"1px solid",borderColor:"divider"},children:[e.jsx(Z,{onClick:()=>N(!1),children:"Cancel"}),e.jsx(Z,{variant:"contained",onClick:Ct,disabled:!s.sponsorName||Number(s.amount)<=0||s.status==="Received"&&!s.paymentMode,startIcon:e.jsx(Zt,{}),children:Y?"Update":"Save"})]})]})}),e.jsx(Ke,{open:Te,onClose:()=>fe(!1),maxWidth:"md",fullWidth:!0,children:Te&&e.jsxs(e.Fragment,{children:[e.jsxs(Ve,{sx:{display:"flex",justifyContent:"space-between",alignItems:"center"},children:[e.jsx(l,{variant:"h6",component:"span",children:"Payment Proof"}),e.jsx(k,{onClick:()=>fe(!1),children:e.jsx(ae,{})})]}),e.jsx(et,{sx:{p:2,textAlign:"center",maxHeight:"80vh",overflowY:"auto"},children:ne&&ne.map((t,n)=>e.jsxs(h,{sx:{mb:n===ne.length-1?0:3,position:"relative"},children:[ne.length>1&&e.jsxs(l,{variant:"caption",sx:{color:"text.secondary",display:"block",mb:1},children:["Image ",n+1," of ",ne.length]}),e.jsx("img",{src:t,alt:`Payment Proof ${n+1}`,style:{maxWidth:"100%",maxHeight:"70vh",objectFit:"contain",borderRadius:8}})]},n))})]})}),e.jsx(jn,{open:ce.open,title:ce.title,message:ce.message,onConfirm:ce.onConfirm,onCancel:()=>ge(t=>({...t,open:!1}))}),e.jsxs(tt,{anchorEl:xe,open:!!xe,onClose:U,anchorOrigin:{vertical:"bottom",horizontal:"right"},transformOrigin:{vertical:"top",horizontal:"right"},children:[(C==null?void 0:C.paymentProofUrl)&&e.jsxs(b,{onClick:async()=>{U();const t=await lt(C.id,C.paymentProofUrl);t&&t.length>0&&(yt(t),fe(!0))},children:[e.jsx(W,{children:e.jsx(nt,{fontSize:"small",sx:{color:c.success.text}})}),e.jsx(L,{children:"View Proof"})]}),e.jsxs(b,{onClick:t=>{const n=xe;U(),be(n),ve({s:C,type:"invoice"})},children:[e.jsx(W,{children:e.jsx(Xt,{fontSize:"small",sx:{color:D.internal}})}),e.jsx(L,{children:"Download Invoice"})]}),(C==null?void 0:C.status)!=="Pending"&&[e.jsxs(b,{onClick:t=>{const n=xe;U(),be(n),ve({s:C,type:"receipt"})},children:[e.jsx(W,{children:e.jsx(Kt,{fontSize:"small",sx:{color:c.info.text}})}),e.jsx(L,{children:"Download Receipt"})]},"receipt"),P?null:e.jsxs(b,{onClick:()=>{U(),Pt(C)},children:[e.jsx(W,{children:e.jsx(Vt,{fontSize:"small",sx:{color:hn.whatsapp}})}),e.jsx(L,{children:"Share to WhatsApp"})]},"whatsapp")],g&&[e.jsxs(b,{onClick:()=>{U(),zt(C)},children:[e.jsx(W,{children:e.jsx(Ce,{fontSize:"small",sx:{color:c.success.text}})}),e.jsx(L,{children:"Duplicate"})]},"duplicate"),e.jsxs(b,{onClick:()=>{U(),$t(C.id)},children:[e.jsx(W,{children:e.jsx(en,{fontSize:"small",sx:{color:c.error.text}})}),e.jsx(L,{children:"Delete"})]},"delete")]]}),e.jsxs(tt,{anchorEl:We,open:!!We,onClose:je,anchorOrigin:{vertical:"bottom",horizontal:"right"},transformOrigin:{vertical:"top",horizontal:"right"},children:[e.jsxs(b,{onClick:()=>{if(de){const{s:t,type:n}=de;n==="invoice"?He(t,"image"):Qe(t,"image")}je()},children:[e.jsx(W,{children:e.jsx(nt,{fontSize:"small"})}),e.jsx(L,{children:"Download as Image"})]}),e.jsxs(b,{onClick:()=>{if(de){const{s:t,type:n}=de;n==="invoice"?He(t,"pdf"):Qe(t,"pdf")}je()},children:[e.jsx(W,{children:e.jsx(tn,{fontSize:"small"})}),e.jsx(L,{children:"Download as PDF"})]})]})]})};export{Mn as default};
