import{d as l}from"./dateUtils-B51heJDl.js";import{j as s}from"./index-DI06tiVg.js";function t(e,i,a){return e?i:a}function d(e){return new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",minimumFractionDigits:0}).format(e)}function x(e={}){const i=window.location.origin,a=(e.societyName||"Society Name").trim().toUpperCase(),o=(e.committeeName||"Committee").trim().toUpperCase(),n=(e.year||"").trim().toUpperCase(),r=(e.societyAddress||"").trim(),p=`${a} Logo`;return`
    <div class="consistent-header">
      <img class="logo-left" src="${i}/MaaLogo.png" alt="Maa Durga" onerror="this.style.display='none'" />
      <div class="header-center">
        <div class="society-name">${a}</div>
        <div class="committee-name">${o}${n?` <span class="year">${n}</span>`:""}</div>
        ${r?`<div class="header-subtitle">${r}</div>`:""}
      </div>
      <img class="logo-right" src="${i}/logo.png" alt="${p}" onerror="this.style.display='none'" />
    </div>
  `}function h(e={}){return`<div class="footer">GENERATED ON ${l(new Date,e==null?void 0:e.dateFormat)} | ${(e==null?void 0:e.societyName)||""} ${(e==null?void 0:e.committeeName)||""} ${(e==null?void 0:e.year)||""}</div>`}function y(e=!1){return`
    .consistent-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 2px solid ${s.orangeBanner};
      padding-bottom: ${t(e,"12px","16px")};
      margin-bottom: ${t(e,"12px","16px")};
      gap: ${t(e,"8px","16px")};
    }
    .consistent-header img.logo-left,
    .consistent-header img.logo-right {
      height: ${t(e,"44px","56px")};
      width: auto;
      object-fit: contain;
    }
    .consistent-header .header-center {
      flex: 1;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: ${t(e,"2px","4px")};
    }
    .consistent-header .society-name {
      font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: ${t(e,"14px","17px")};
      font-weight: 800;
      color: ${s.orangeBanner};
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      line-height: 1.1;
    }
    .consistent-header .committee-name {
      font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: ${t(e,"11px","13px")};
      font-weight: 700;
      color: ${s.slateMedium};
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 0.2px;
      line-height: 1.2;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-wrap: wrap;
    }
    .consistent-header .year {
      margin-left: 5px;
      color: ${s.slateHead};
    }
    .consistent-header .header-subtitle {
      font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: ${t(e,"8px","10px")};
      font-weight: 500;
      color: ${s.slateSubtle};
      margin: 2px 0 0 0;
      text-transform: uppercase;
      letter-spacing: 0.2px;
      line-height: 1.4;
      max-width: ${t(e,"240px","280px")};
    }
    @media (min-width: 500px) {
      .consistent-header img.logo-left,
      .consistent-header img.logo-right {
        height: ${t(e,"56px","68px")};
      }
      .consistent-header .society-name {
        font-size: ${t(e,"18px","22px")};
      }
      .consistent-header .committee-name {
        font-size: ${t(e,"13px","15px")};
      }
      .consistent-header .header-subtitle {
        font-size: ${t(e,"10px","12px")};
        max-width: ${t(e,"300px","380px")};
      }
    }
    .footer {
      text-align: center;
      color: ${s.slateLight};
      font-size: 11px;
      margin-top: 20px;
      border-top: 1px dashed ${s.borderDashedLight};
      padding-top: 8px;
      text-transform: uppercase;
      font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }
  `}export{x as a,h as b,d as f,y as g,t as s};
