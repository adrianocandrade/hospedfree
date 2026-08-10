const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./animate-Bbp8YVpb.css","./browser-B0-gCI_h.js","./rolldown-runtime-Cyuzqnbw.js","./preload-helper-kNaey6uv.js","./browser-Bpi9SKu6.js","./browser-D52F4U_r.js","./browser-CzvC89n4.js","./browser-DziJFQdt.js","./browser-CilFyJRx.js","./plugin-D93BDZ0K.js","./browser-JpStxgo-.js","./browser-cwyolrZY.js","./browser-TFGW0Mpe.js","./browser-DKwryhoy.js","./browser-HLFDI3es.js","./browser-D7YD9wu7.js","./browser-1qbJl2eU.js","./browser-5ZGVZuI0.js","./browser-BX01vbW_.js","./browser-v0mmw2og.js","./browser-h6qnmf--.js","./browser-BVMa1l4J.js","./browser-BW8mClpT2.js","./browser-CVMUr3E2.js","./browser-DljgwFoQ.js","./browser-CP_DXT6h.js","./browser-CF9XtzC4.js","./browser-DkwN547x.js","./constants-CQSbXwlP.js","./browser-BA6pscNS.js","./browser-DPf7nwA3.js","./browser-CInEuLO4.js","./browser-eo6jk-IU.js","./browser-DsRF789p2.js","./browser-CCGoRhI52.js","./browser-CMYXdjqp2.js","./browser-B8hTdOPS2.js","./browser-BlthMkts2.js","./browser-CobSOMPS2.js","./browser-q0TTIMze2.js","./browser-BCiOnI5I2.js","./browser-BK3m4XW62.js","./browser-bKJfy2Nh2.js","./browser-Dx68QgRa2.js","./browser-DgRe2nlr2.js","./browser-r2I4mYNh2.js"])))=>i.map(i=>d[i]);
import{a as e}from"./rolldown-runtime-Cyuzqnbw.js";import{i as t,n}from"./query-client-DZzHQFAr.js";import{o as r}from"./toast-CCWK7eES.js";import{Bi as i,C as a,Cn as o,Dn as s,Gt as c,Ii as l,N as u,Ni as d,Pt as f,Ri as p,S as m,T as h,Xt as g,di as _,ii as v,k as y,na as b,ta as x,wr as S,wt as C,yi as w,zn as ee,zr as T}from"./icons-DFfxS4V_.js";import{t as E}from"./bootstrap-data-store--e6KmXCR.js";import{t as D}from"./use-settings-CDrL4v0x.js";import{t as O}from"./trans-BIcHQJKD.js";import{t as k}from"./use-trans-CtdeT6P3.js";import{On as A}from"./composite-TLKCZGS_.js";import{t as j}from"./preload-helper-kNaey6uv.js";import{t as M}from"./chunk-6CSD65Y2-dReXBpgA.js";import{C as te,a as ne,d as re,i as ie,t as ae}from"./react-simple-icons-DCF32m-k.js";import{t as oe}from"./button-uOhkHpvc.js";import{t as N}from"./message-BCKcasPr.js";import{F as se,Hr as ce,bi as le,it as ue,rt as de}from"./main-CqMJxonF.js";import{t as P}from"./drawer-BPszoeOx.js";import{t as fe}from"./skeleton-CwZp7fo9.js";import{t as F}from"./dialog-CvIcz_al.js";import{i as pe,t as me}from"./field-CnYxpX_-.js";import{t as I}from"./input-Drk0AvIu.js";import{t as he}from"./on-form-query-error-CuwiQZQ1.js";import{t as ge}from"./image-zoom-dialog-QpCTxJV_.js";import{t as _e}from"./use-clipboard-ESxXtQG3.js";import{t as ve}from"./remote-favicon-cKP3vdhP.js";import{t as L}from"./ad-host-C8egh9bL.js";import{C as ye,E as be,T as xe,_ as Se,a as Ce,f as we,g as R,n as Te,p as z,t as Ee,w as B}from"./css-props-from-bg-config-CZZClFCk.js";import{B as De,Ct as Oe,D as ke,F as Ae,J as je,K as V,M as Me,P as Ne,Q as Pe,R as Fe,S as Ie,St as Le,W as Re,X as ze,_ as Be,_t as H,at as Ve,b as He,bt as U,c as Ue,ct as W,dt as We,f as Ge,gt as Ke,h as G,i as qe,it as Je,lt as Ye,m as Xe,mt as K,n as Ze,o as Qe,pt as $e,tt as et,u as tt,ut as nt,vt as rt,yt as it}from"./enhanced-widgets-BrSEoGIS.js";import{t as at}from"./linkedin--sYoUWBg.js";var q=e(b()),J=x();function ot({widget:e,variant:t,appearance:n,biolink:r}){let{trans:i}=k(),[o,s]=(0,q.useState)(!1),c=W(e.config.type===`avatar`?`avatar`:`content`,[r?.id,e.id]),l=Ye([e.config.url,c]),d=e.config.imageZoom===!0&&!!e.config.url&&!e.config.destinationUrl&&e.config.type!==`avatar`,f=!l.failed&&l.src?(0,J.jsx)(`img`,{className:A(`object-cover`,st({widget:e,variant:t})),src:l.src,alt:``,loading:`lazy`,onError:l.onError}):(0,J.jsx)(`div`,{className:A(st({widget:e,variant:t}),`flex items-center justify-center bg-muted`),children:(0,J.jsx)(u,{className:A(t===`editor`?`size-3`:`size-10`,`text-muted-foreground`)})});if(t===`editor`)return e.config.destinationUrl?(0,J.jsx)(`a`,{href:e.config.destinationUrl,children:f}):f;let p=(0,J.jsx)(H,{appearance:n,config:e.config,className:A(`biolink-image-widget overflow-hidden !border-0 !bg-transparent !p-0`,e.config.type===`avatar`&&`mx-auto w-fit`),style:{borderWidth:0,background:`transparent`},children:e.config.destinationUrl?(0,J.jsx)(`a`,{href:e.config.destinationUrl,className:`block`,children:f}):d?(0,J.jsxs)(`button`,{type:`button`,className:`group relative block w-full cursor-zoom-in text-left`,onClick:()=>s(!0),"aria-label":i(N(`Open image`)),children:[f,(0,J.jsx)(`span`,{className:`pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-150 group-hover:opacity-100`,children:(0,J.jsx)(`span`,{className:`flex items-center justify-center rounded-full bg-black/55 p-3 backdrop-blur-sm`,children:(0,J.jsx)(a,{className:`size-5 text-white`})})})]}):f});return d&&e.config.url?(0,J.jsx)(ge,{images:[e.config.url],activeIndex:0,onActiveIndexChange:()=>{},open:o,onOpenChange:s,children:p}):p}function st({widget:e,variant:t}){let n=e.config.type;return t===`editor`?`size-5 ${n===`avatar`?`rounded-full`:`rounded-sm`}`:n===`avatar`?`size-24 rounded-full mx-auto`:`block w-full rounded-[inherit]`}var ct=(e,t)=>n({url:`/public/biolink/${e}/booking/services`,method:`GET`},t),lt=(e,t,r)=>n({url:`/public/biolink/${e}/booking/availability`,method:`GET`,params:t},r),ut=(e,t,r)=>n({url:`/public/biolink/${e}/booking/appointments`,method:`POST`,headers:{"Content-Type":`application/json`},data:t},r);function dt({type:e}){switch(e){case`meeting`:return(0,J.jsx)(O,{message:`Meeting`});case`class`:return(0,J.jsx)(O,{message:`Class or group`});case`consultation`:return(0,J.jsx)(O,{message:`Consultation`});case`salon`:return(0,J.jsx)(O,{message:`Salon`});case`barbershop`:return(0,J.jsx)(O,{message:`Barbershop`});case`online`:return(0,J.jsx)(O,{message:`Online service`});case`other`:return(0,J.jsx)(O,{message:`Other`});default:return(0,J.jsx)(O,{message:`Individual appointment`})}}function ft({widget:e,biolink:t,variant:n,appearance:r}){let[i,a]=(0,q.useState)(!1),[o,s]=(0,q.useState)(null),[c,l]=(0,q.useState)(gt),[u,d]=(0,q.useState)(``),[f,p]=(0,q.useState)(``),[m,h]=(0,q.useState)(``),[g,_]=(0,q.useState)(``),[v,y]=(0,q.useState)(!1),[b,x]=(0,q.useState)(!1),[S,C]=(0,q.useState)(null),[ee,T]=(0,q.useState)(!1),E=le({queryKey:[`public-booking-services`,t?.id],queryFn:()=>ct(Number(t.id)),enabled:!!t?.id&&n!==`editor`}),D=e.config?.serviceIds??[],k=E.data?.data??[],j=D.length?k.filter(e=>D.includes(Number(e.id))):k,M=le({queryKey:[`public-booking-availability`,t?.id,o?.id,c],queryFn:()=>lt(Number(t.id),{service_id:Number(o.id),from:c,to:c}),enabled:!!t?.id&&!!o&&i&&!v&&n!==`editor`});if(n===`editor`)return(0,J.jsxs)(`div`,{className:`w-full rounded-card border p-4`,children:[(0,J.jsx)(w,{className:`mb-2`}),(0,J.jsx)(`strong`,{children:e.config?.title||(0,J.jsx)(O,{message:`Booking`})}),(0,J.jsx)(`p`,{className:`text-sm text-muted-foreground`,children:(0,J.jsx)(O,{message:`Visitors can book your configured services here.`})})]});let te=M.data?.data??[],ne=Ve(e.config?.section),re=e=>{s(e),l(gt()),d(``),p(``),h(``),_(``),y(!1),C(null),T(!1),a(!0)};return(0,J.jsxs)(J.Fragment,{children:[(0,J.jsxs)(H,{appearance:r,config:e.config,className:`p-4 @2xl:p-5`,children:[ne?(0,J.jsxs)(`header`,{className:`mb-3 flex items-start gap-3`,children:[(0,J.jsx)(`span`,{className:`grid size-9 shrink-0 place-items-center rounded-lg bg-current/10`,children:(0,J.jsx)(w,{className:`size-4.5`})}),(0,J.jsxs)(`div`,{className:`min-w-0`,children:[(0,J.jsx)(`h2`,{className:`leading-5 font-semibold`,children:e.config?.title||(0,J.jsx)(O,{message:`Book an appointment`})}),e.config?.description?(0,J.jsx)(`p`,{className:`mt-1 text-sm leading-5 opacity-80`,children:e.config.description}):null]})]}):null,E.isLoading?(0,J.jsx)(`p`,{className:`text-sm opacity-80`,children:(0,J.jsx)(O,{message:`Loading booking services...`})}):E.isError?(0,J.jsx)(`p`,{className:`text-sm opacity-80`,children:(0,J.jsx)(O,{message:`Could not load booking services.`})}):j.length?(0,J.jsx)(`div`,{className:`flex flex-col gap-2.5`,children:j.map(t=>(0,J.jsx)(pt,{service:t,showDetails:e.config?.showServiceDetails!==!1,style:Le(Oe(r,e.config?.itemStyle)),onClick:()=>re(t)},t.id))}):(0,J.jsx)(`p`,{className:`text-sm opacity-80`,children:(0,J.jsx)(O,{message:`No booking services are available right now.`})})]}),(0,J.jsx)(F.Root,{open:i,onOpenChange:e=>{a(e),e||(s(null),d(``),y(!1),x(!1),C(null),T(!1))},children:o?(0,J.jsxs)(F.Portal,{children:[(0,J.jsx)(F.Backdrop,{className:`bg-black/75`}),(0,J.jsxs)(F.Content,{className:`w-[calc(100vw-2rem)] gap-0 overflow-hidden rounded-2xl bg-background p-0 text-foreground shadow-2xl @2xl:max-w-lg`,children:[(0,J.jsxs)(F.Header,{className:`border-b px-6 py-5 pe-14 text-center`,children:[(0,J.jsxs)(F.Title,{className:`justify-center text-base`,children:[(0,J.jsx)(w,{className:`size-4`}),o.name]}),(0,J.jsx)(F.Description,{className:`text-center`,children:(0,J.jsx)(O,{message:`Choose a time and complete your contact details.`})})]}),v&&S?(0,J.jsx)(ht,{confirmation:S}):(0,J.jsxs)(`form`,{onSubmit:async e=>{if(e.preventDefault(),!(!t?.id||!o||!u||!f||!m)){x(!0),T(!1);try{C((await ut(Number(t.id),{service_id:Number(o.id),date:c,time:u,name:f,email:m,phone:g||void 0})).data),y(!0)}catch{T(!0)}finally{x(!1)}}},children:[(0,J.jsxs)(F.Body,{className:`mx-0 max-h-[min(68vh,560px)] space-y-4 px-6 py-5`,children:[(0,J.jsx)(mt,{service:o}),(0,J.jsxs)(`label`,{className:`block text-sm`,children:[(0,J.jsx)(`span`,{className:`mb-1 block font-medium`,children:(0,J.jsx)(O,{message:`Date`})}),(0,J.jsx)(I,{type:`date`,min:gt(),value:c,onChange:e=>{l(e.target.value),d(``),T(!1)}})]}),(0,J.jsxs)(`div`,{children:[(0,J.jsx)(`div`,{className:`mb-2 text-sm font-medium`,children:(0,J.jsx)(O,{message:`Available times`})}),M.isFetching?(0,J.jsx)(`p`,{className:`rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground`,children:(0,J.jsx)(O,{message:`Loading available times...`})}):te.length?(0,J.jsx)(`div`,{className:`flex flex-wrap gap-2`,role:`radiogroup`,children:te.map(e=>(0,J.jsx)(oe,{type:`button`,size:`sm`,variant:`outline`,"aria-pressed":u===e.time,className:A(`min-w-16`,u===e.time&&`border-primary bg-primary/10 text-primary`),onClick:()=>{d(e.time),T(!1)},children:e.time},`${e.date??c}-${e.time}`))}):(0,J.jsx)(`p`,{className:`rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground`,children:(0,J.jsx)(O,{message:`No available times for this date.`})})]}),(0,J.jsxs)(`div`,{className:`grid gap-3 @2xl:grid-cols-2`,children:[(0,J.jsxs)(`label`,{className:`block text-sm`,children:[(0,J.jsx)(`span`,{className:`mb-1 block font-medium`,children:(0,J.jsx)(O,{message:`Name`})}),(0,J.jsx)(I,{required:!0,value:f,onChange:e=>p(e.target.value)})]}),(0,J.jsxs)(`label`,{className:`block text-sm`,children:[(0,J.jsx)(`span`,{className:`mb-1 block font-medium`,children:(0,J.jsx)(O,{message:`Email`})}),(0,J.jsx)(I,{required:!0,type:`email`,value:m,onChange:e=>h(e.target.value)})]}),(0,J.jsxs)(`label`,{className:`block text-sm @2xl:col-span-2`,children:[(0,J.jsx)(`span`,{className:`mb-1 block font-medium`,children:(0,J.jsx)(O,{message:`Phone (optional)`})}),(0,J.jsx)(I,{type:`tel`,value:g,onChange:e=>_(e.target.value)})]})]}),ee?(0,J.jsx)(`p`,{className:`text-sm text-destructive`,children:(0,J.jsx)(O,{message:`This time is no longer available. Please choose another one.`})}):null]}),(0,J.jsx)(`div`,{className:`border-t bg-muted/40 px-6 py-4`,children:(0,J.jsx)(oe,{type:`submit`,className:`w-full`,disabled:!u||!f||!m||b,children:b?(0,J.jsx)(O,{message:`Confirming...`}):(0,J.jsx)(O,{message:`Confirm booking`})})})]})]})]}):null})]})}function pt({service:e,showDetails:t,style:n,onClick:r}){let a=_t(e);return(0,J.jsxs)(`button`,{type:`button`,className:A(`biolink-product-card biolink-surface-item grid min-h-20 w-full min-w-0 grid-cols-[2.25rem_minmax(0,1fr)_1.25rem] items-center gap-3 rounded-lg border p-3.5 text-left text-inherit outline-none focus-visible:ring`),style:n,onClick:r,children:[(0,J.jsx)(`span`,{className:`grid size-9 shrink-0 place-items-center rounded-lg bg-current/10`,children:(0,J.jsx)(w,{className:`size-4.5`})}),(0,J.jsxs)(`span`,{className:`min-w-0 flex-1`,children:[(0,J.jsx)(`strong`,{className:`block leading-5 wrap-break-word`,children:e.name}),t&&e.description?(0,J.jsx)(`span`,{className:`mt-1 line-clamp-2 block text-sm leading-5 opacity-80`,children:e.description}):null,t?(0,J.jsxs)(`span`,{className:`mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-medium opacity-80`,children:[(0,J.jsx)(`span`,{children:(0,J.jsx)(dt,{type:e.service_type})}),(0,J.jsxs)(`span`,{className:`inline-flex items-center gap-1`,children:[(0,J.jsx)(w,{className:`size-3.5`}),e.duration_minutes,` `,(0,J.jsx)(O,{message:`minutes`})]}),a?(0,J.jsx)(`span`,{children:a}):null]}):null]}),(0,J.jsx)(i,{className:`size-4 shrink-0 justify-self-end opacity-65`})]})}function mt({service:e}){return(0,J.jsxs)(`div`,{className:`rounded-lg border border-border bg-muted/30 p-3 text-sm`,children:[(0,J.jsx)(`div`,{className:`font-medium`,children:e.name}),(0,J.jsxs)(`div`,{className:`mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground`,children:[(0,J.jsx)(`span`,{children:(0,J.jsx)(dt,{type:e.service_type})}),(0,J.jsxs)(`span`,{children:[e.duration_minutes,` `,(0,J.jsx)(O,{message:`minutes`})]}),_t(e)?(0,J.jsx)(`span`,{children:_t(e)}):null]})]})}function ht({confirmation:e}){return(0,J.jsxs)(`div`,{className:`space-y-4 px-6 py-6`,children:[(0,J.jsx)(`div`,{className:`rounded-lg bg-positive/10 p-4 text-sm text-positive`,children:(0,J.jsxs)(`div`,{className:`flex items-center gap-2 font-medium`,children:[(0,J.jsx)(v,{className:`size-5`}),(0,J.jsx)(O,{message:`Booking confirmed. Check your email for the management link.`})]})}),(0,J.jsxs)(`div`,{className:`space-y-3 text-sm`,children:[e.meeting_url?(0,J.jsx)(`a`,{className:`block underline underline-offset-2`,href:e.meeting_url,target:`_blank`,rel:`noreferrer`,children:(0,J.jsx)(O,{message:`Open meeting link`})}):null,e.payment_url?(0,J.jsx)(`a`,{className:`block underline underline-offset-2`,href:e.payment_url,target:`_blank`,rel:`noreferrer`,children:(0,J.jsx)(O,{message:`Open payment link`})}):null,e.pix_key?(0,J.jsxs)(`div`,{children:[(0,J.jsx)(`strong`,{className:`block`,children:(0,J.jsx)(O,{message:`PIX details`})}),(0,J.jsx)(`span`,{className:`break-all`,children:e.pix_key})]}):null,e.payment_confirmation_url?(0,J.jsx)(`a`,{className:`block underline underline-offset-2`,href:e.payment_confirmation_url,target:`_blank`,rel:`noreferrer`,children:(0,J.jsx)(O,{message:`Send payment receipt`})}):null,e.payment_confirmation_instructions?(0,J.jsx)(`p`,{children:e.payment_confirmation_instructions}):null]}),(0,J.jsx)(F.CloseButton,{className:`w-full`,color:`primary`,children:(0,J.jsx)(O,{message:`Done`})})]})}function gt(){return new Date().toISOString().slice(0,10)}function _t(e){if(!e.price)return null;let t=Number(e.price);if(Number.isNaN(t))return null;try{return new Intl.NumberFormat(void 0,{style:`currency`,currency:e.currency||`USD`}).format(t)}catch{return`${e.currency||``} ${t.toFixed(2)}`.trim()}}function vt({widget:e,variant:t,appearance:n}){return(0,J.jsx)(yt,{config:e.config,variant:t,appearance:n})}function yt({config:e,variant:t=`biolinkPage`,appearance:n,className:r}){let{trans:i}=k(),a=e.style??`icons`,o=n?.socialConfig?.colorMode,s=e.colorMode??o??`theme`,c=n?.btnConfig,l=U({btnConfig:c}),u=!!c?.blockStyle,d=it({btnConfig:c}),f=c?.radius??`rounded-sm`,p=Object.entries(e).filter(([e,t])=>e!==`style`&&e!==`colorMode`&&!!t&&!!$e[e]);return(0,J.jsx)(`div`,{className:A(`flex flex-wrap items-center gap-y-2`,r,t===`editor`?`mt-1 gap-x-3.5 text-muted-foreground`:t===`desktopHeader`?`mt-4 mb-6.5 justify-center gap-2`:a===`buttons`?`flex-col gap-2`:`justify-center gap-2`),children:p.map(([e,n])=>{let r=$e[e],o=r.icon;return o?(0,J.jsx)(`div`,{className:a===`buttons`?`w-full`:void 0,children:t===`editor`?o:(0,J.jsx)(`a`,{href:bt(e,n),className:A(`relative text-inherit no-underline outline-none focus-visible:ring motion-reduce:transform-none motion-reduce:transition-none`,a===`icons`?`flex size-11 items-center justify-center transition-transform duration-300 hover:scale-110 active:scale-95`:`transition-transform duration-[180ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-[1.015] active:scale-[0.98]`,a===`icons`&&!u&&`rounded-full`,a===`buttons`&&`flex h-12 w-full items-center justify-center gap-2 px-4 text-sm font-semibold`,a===`pills`&&`flex h-10 min-w-24 items-center justify-center gap-2 px-4 text-sm font-semibold`,a===`pills`&&!u&&`rounded-full`,a===`buttons`&&!u&&f,u&&`rounded-none`),style:{...l,...s===`brand`?r.brandStyle:null,...s===`monochrome`?{background:`transparent`,borderColor:`currentColor`,color:`currentColor`}:null,...s===`theme`?{color:d??l.color}:null},"aria-label":i(r.name),target:`_blank`,rel:`noreferrer`,children:(0,J.jsxs)(`span`,{className:`relative z-10 flex items-center justify-center gap-2 [&>svg]:size-[1.125rem] [&>svg]:shrink-0`,children:[o,a===`icons`?null:(0,J.jsx)(O,{...r.name})]})})},e):null})})}function bt(e,n){return!n||t(n)?n:e===K.Twitter?`https://twitter.com/${n.replace(`@`,``)}`:e===K.Instagram?`https://instagram.com/${n.replace(`@`,``)}`:e===K.Tiktok?`https://tiktok.com/${n}`:e===K.Mail?`mailto:${n}`:e===K.Whatsapp?`https://api.whatsapp.com/send?phone=${n}`:n}function Y({variant:e,embedUrl:t,appearance:n,config:r}){return t?e===`editor`?(0,J.jsxs)(`div`,{className:`flex max-w-[80%] min-w-0 items-center gap-2 truncate`,children:[(0,J.jsx)(ve,{url:t}),(0,J.jsx)(`a`,{href:t,target:`_blank`,className:`truncate text-sm text-muted-foreground hover:underline`,rel:`noreferrer`,children:t})]}):(0,J.jsx)(H,{appearance:n,config:r,className:`!p-0 !border-0`,style:{borderWidth:0},children:(0,J.jsxs)(`div`,{className:`relative aspect-video w-full overflow-hidden rounded-[inherit] bg-current/5`,children:[(0,J.jsx)(`div`,{className:`absolute inset-0 animate-pulse bg-current/10`}),(0,J.jsx)(`iframe`,{className:`relative z-10 block h-full w-full border-0 bg-transparent`,loading:`lazy`,src:t,allow:`autoplay; encrypted-media; picture-in-picture`,allowFullScreen:!0})]})}):null}function xt({widget:e,variant:t,appearance:n}){return e.config.url?(0,J.jsx)(Y,{variant:t,embedUrl:e.config.embedUrl,appearance:n,config:e.config}):null}function St({widget:e,variant:t,appearance:n}){let r=e.config.body,i=e.config.description,a=i||wt(r),o=e.config.variant??`text`;if(o!==`divider`&&!e.config.title&&!i&&!r)return null;if(t===`editor`)return(0,J.jsxs)(`div`,{className:`overflow-hidden text-sm whitespace-nowrap text-muted-foreground`,children:[(0,J.jsx)(`div`,{children:e.config.title||`Divider`}),o===`divider`?null:(0,J.jsx)(`div`,{className:`overflow-hidden text-ellipsis`,children:a})]});if(o===`divider`)return(0,J.jsxs)(`div`,{className:`my-5 flex items-center gap-3 px-4`,role:`separator`,children:[(0,J.jsx)(`span`,{className:`h-px flex-1 bg-current opacity-20`}),e.config.title?(0,J.jsx)(`span`,{className:`text-xs font-semibold tracking-wide uppercase opacity-70`,children:e.config.title}):null,(0,J.jsx)(`span`,{className:`h-px flex-1 bg-current opacity-20`})]});let s=(0,J.jsxs)(`div`,{className:A(`px-4 text-center @2xl:px-5`,o===`heading`?`my-8`:`mb-7.5`),role:o===`notice`?`note`:void 0,children:[e.config.title?o===`heading`?(0,J.jsx)(`h2`,{className:`text-xl leading-tight font-semibold`,children:e.config.title}):(0,J.jsx)(`div`,{className:`text-base font-medium`,children:e.config.title}):null,r?(0,J.jsx)(`div`,{className:`mt-2 text-sm leading-6 [&_p:not(:last-child)]:mb-2 [&_strong]:font-semibold [&_u]:underline`,dangerouslySetInnerHTML:{__html:r}}):(0,J.jsx)(`div`,{className:`mt-2 text-sm`,children:i})]});return e.config.showBackground||o===`notice`?(0,J.jsx)(H,{appearance:n,config:e.config,className:A(`py-5`,o===`notice`&&Ct(e.config.noticeTone)),children:s}):s}function Ct(e){return{neutral:`bg-current/5`,info:`bg-primary/10`,success:`bg-positive/10`,warning:`bg-warning/10`}[e??`neutral`]}function wt(e){return e?.replace(/<[^>]*>/g,` `).replace(/\s+/g,` `).trim()??``}var Tt=``+new URL(`tiktok-Dyu4PMxO.png`,import.meta.url).href;function Et({widget:e,variant:t,appearance:n}){if((0,q.useEffect)(()=>{ue.loadAsset(`https://www.tiktok.com/embed.js`,{type:`js`})},[]),!e.config.url)return null;if(t===`editor`)return(0,J.jsxs)(`div`,{className:`flex items-center gap-2`,children:[(0,J.jsx)(ve,{url:e.config.url}),(0,J.jsx)(`a`,{href:e.config.url,target:`_blank`,className:`max-w-[80%] overflow-hidden text-sm text-ellipsis whitespace-nowrap text-muted-foreground hover:underline`,rel:`noreferrer`,children:e.config.url})]});let r=e.config.presentation||`video`,a=new URL(e.config.url).pathname.split(`/`).filter(Boolean).pop()?.trim();return r===`video`?(0,J.jsx)(Y,{variant:t,embedUrl:`https://www.tiktok.com/embed/v2/${a}`,appearance:n,config:e.config}):r===`link`?(0,J.jsxs)(`a`,{href:e.config.url,target:`_blank`,rel:`noreferrer`,className:`biolink-public-action biolink-surface-item flex w-full min-h-12 items-center gap-3 rounded-lg border px-4 py-3 text-inherit no-underline outline-none focus-visible:ring`,style:U({btnConfig:e.config,override:void 0}),children:[(0,J.jsx)(`img`,{src:Tt,alt:``,className:`size-5 shrink-0 object-contain`}),(0,J.jsx)(`span`,{className:`min-w-0 flex-1 text-center font-semibold`,children:(0,J.jsx)(O,{message:`Watch on TikTok`})}),(0,J.jsx)(i,{className:`size-4 opacity-80 shrink-0`})]}):(0,J.jsx)(H,{appearance:n,config:e.config,className:`biolink-tiktok-widget p-0 overflow-hidden rounded-[inherit] [&_.tiktok-embed]:!m-0 [&_.tiktok-embed]:!max-w-none [&_iframe]:!block [&_iframe]:!w-full [&_iframe]:!border-0`,children:(0,J.jsx)(`blockquote`,{"data-video-id":a,className:`tiktok-embed`,children:(0,J.jsx)(`img`,{src:Tt,alt:``,className:`hidden`})})})}function Dt({widget:e,variant:t,appearance:n}){let{base_url:r}=D();return e.config.url?(0,J.jsx)(Y,{variant:t,embedUrl:Ot(e.config.url,r),appearance:n,config:e.config}):null}function Ot(e,t){let n,r=new URL(e).pathname.split(`/`).pop()?.trim();return n=e.includes(`clip`)?`https://clips.twitch.tv/embed?clip=${r}`:`https://player.twitch.tv/?channel=${r}`,`${n}&parent=${kt(t)}`}function kt(e){try{return new URL(e).hostname}catch{return e.replace(/^https?:\/\//,``).replace(/\/.*$/,``).replace(/:\d+$/,``)}}function At({widget:e,variant:t,appearance:n}){if(!e.config.url)return null;let{id:r}=We(e.config.url);return(0,J.jsx)(Y,{variant:t,embedUrl:`https://player.vimeo.com/video/${r}`,appearance:n,config:e.config})}var jt=(e,t=1)=>new Promise((n,r)=>{let i=new Image,a=()=>{delete i.onload,delete i.onerror,i.naturalWidth>=t?n(i):r(`Could not load youtube image`)};Object.assign(i,{onload:a,onerror:a,src:e})}),Mt=new Map;async function Nt(e){if(!e)return;if(Mt.has(e))return Mt.get(e);let t=t=>`https://i.ytimg.com/vi/${e}/${t}.jpg`;return jt(t(`maxresdefault`),121).catch(()=>jt(t(`sddefault`),121)).catch(()=>jt(t(`hqdefault`),121)).catch(()=>{}).then(t=>{if(!t)return;let n=t.src;return Mt.set(e,n),n})}function Pt({widget:e,variant:t,appearance:n}){let{trans:r}=k();if(!e.config.url)return null;let{id:i}=We(e.config.url);if(!i)return null;let a=`https://www.youtube.com/embed/${i}`;return t===`editor`?(0,J.jsx)(Y,{variant:t,embedUrl:a,appearance:n,config:e.config}):e.config.presentation===`cover`?(0,J.jsx)(nt,{appearance:n,config:e.config,playLabel:r(N(`Play :title`,{values:{title:r(N(`Youtube video`))}})),poster:e.config.coverImage,posterKey:i,loadPoster:()=>Nt(i),motion:e.config.playButtonMotion,children:(0,J.jsx)(`iframe`,{src:`https://www.youtube-nocookie.com/embed/${i}?autoplay=1`,title:r(N(`Youtube video`)),className:`size-full border-0`,allow:`accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share`,allowFullScreen:!0})}):(0,J.jsx)(Y,{variant:t,embedUrl:a,appearance:n,config:e.config})}var Ft=2e4;function It({widget:e,variant:t,appearance:n,biolink:r,isPreview:i}){let[a,o]=(0,q.useState)(t===`editor`||i?1:null);return(0,q.useEffect)(()=>{if(t!==`biolinkPage`||i||!r?.id)return;let e=!1,n=Lt(),a=async()=>{try{let t=await fetch(`/api/v1/public/biolink/${r.id}/viewer-count?visitor_token=${encodeURIComponent(n)}`,{headers:{Accept:`application/json`},cache:`no-store`});if(!t.ok)throw Error(`Viewer count request failed`);let i=await t.json();!e&&typeof i.count==`number`&&o(Math.max(0,Math.round(i.count)))}catch{}};a();let s=window.setInterval(a,Ft);return()=>{e=!0,window.clearInterval(s)}},[r?.id,i,t]),(0,J.jsxs)(`div`,{className:`inline-flex items-center gap-1.5 text-sm leading-5`,style:{color:e.config.color||n?.bgConfig?.color||`currentColor`,fontFamily:e.config.fontConfig?.family||n?.fontConfig?.family},"aria-live":`polite`,children:[(0,J.jsx)(S,{className:`size-4`,"aria-hidden":!0}),(0,J.jsx)(`span`,{children:a??`...`})]})}function Lt(){let e=`meulinkbio-viewer-token`;try{let t=window.sessionStorage.getItem(e);if(t)return t;let n=typeof crypto.randomUUID==`function`?crypto.randomUUID():`${Date.now()}-${Math.random().toString(36).slice(2)}`;return window.sessionStorage.setItem(e,n),n}catch{return`${Date.now()}-${Math.random().toString(36).slice(2)}`}}var Rt=(e,t,r)=>n({url:`/public/biolink/${e}/widget/${t}/feed`,method:`GET`},r);function zt({widget:e,variant:t,appearance:n}){let r=e,{trans:i}=k(),a=le({queryKey:[`public-biolink-feed`,r.biolink_id,r.id],queryFn:()=>Rt(Number(r.biolink_id),Number(r.id)).then(e=>e.data),enabled:t!==`editor`&&!!r.config.url,staleTime:300*1e3,retry:1});return t===`editor`?(0,J.jsxs)(`div`,{className:`min-w-0 text-sm text-muted-foreground`,children:[(0,J.jsx)(`div`,{className:`truncate`,children:r.config.title||(0,J.jsx)(O,{message:`Latest posts`})}),(0,J.jsx)(`div`,{className:`truncate`,children:r.config.url||`-`})]}):r.config.url?(0,J.jsxs)(H,{appearance:n,config:r.config,className:`p-4 @2xl:p-5`,children:[(0,J.jsxs)(`div`,{className:`mb-4 flex items-start gap-3`,children:[(0,J.jsx)(`span`,{className:`grid size-10 shrink-0 place-items-center rounded-lg bg-current/10`,children:(0,J.jsx)(f,{className:`size-5`})}),(0,J.jsxs)(`div`,{className:`min-w-0`,children:[(0,J.jsx)(`h3`,{className:`font-semibold`,children:r.config.title||a.data?.title||(0,J.jsx)(O,{message:`Latest posts`})}),r.config.description?(0,J.jsx)(`p`,{className:`mt-1 text-sm opacity-75`,children:r.config.description}):null]})]}),a.isPending?(0,J.jsxs)(`div`,{className:`space-y-2`,"aria-label":i(N(`Loading feed`)),children:[(0,J.jsx)(fe,{className:`h-16 w-full`}),(0,J.jsx)(fe,{className:`h-16 w-full`}),(0,J.jsx)(fe,{className:`h-16 w-full`})]}):a.data?.items.length?(0,J.jsx)(`div`,{className:`divide-y divide-current/10`,children:a.data.items.map(e=>(0,J.jsxs)(`a`,{href:e.url,target:`_blank`,rel:`noreferrer`,className:`group flex min-h-16 items-center gap-3 py-3 text-inherit no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current`,children:[(0,J.jsxs)(`span`,{className:`min-w-0 flex-1`,children:[(0,J.jsx)(`span`,{className:`line-clamp-2 text-sm font-semibold`,children:e.title}),e.summary?(0,J.jsx)(`span`,{className:`mt-1 line-clamp-1 block text-xs opacity-70`,children:e.summary}):null,e.published_at?(0,J.jsx)(`time`,{dateTime:e.published_at,className:`mt-1 block text-xs opacity-60`,children:new Intl.DateTimeFormat(void 0,{dateStyle:`medium`}).format(new Date(e.published_at))}):null]}),(0,J.jsx)(p,{className:`size-4 shrink-0 opacity-60 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5`})]},e.url))}):(0,J.jsxs)(`a`,{href:r.config.url,target:`_blank`,rel:`noreferrer`,className:`inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-button border border-current/20 px-4 font-semibold text-inherit no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current`,children:[r.config.buttonLabel||(0,J.jsx)(O,{message:`Open feed`}),(0,J.jsx)(p,{className:`size-4`})]})]}):null}var Bt={image:ot,text:St,socials:vt,youtube:Pt,soundcloud:xt,vimeo:At,spotify:Ke,twitch:Dt,tiktok:Et,contactForm:G,emailSignup:G,eventRsvp:G,linkedProduct:V,linkedCourse:V,service:V,booking:ft,faq:Me,linkCollection:De,embedCollection:ke,imageGallery:Fe,qrCode:ze,location:Re,contactCard:Be,smsSignup:G,poll:je,reviews:Pe,stats:Je,discountCode:Ie,document:et,genericVideo:et,podcastMusic:Ke,mobileApp:Ae,eventList:Ae,externalForm:et,rssFeed:zt,donation:V,viewerCount:It,discordPresence:He,gamingProfile:Ne,spotlight:Xe,ctaBanner:Ue,logoCloud:tt,socialFeed:Ge,countdown:qe,audio:Ze,imageComparison:Qe};function Vt({biolinkId:e,widgetId:t,isPreview:n,children:r}){let i=(0,q.useRef)(null),a=(0,q.useCallback)(()=>{!e||n||fetch(`/api/v1/public/biolink/${e}/widget/${t}/engagement`,{method:`POST`,headers:{"Content-Type":`application/json`,"X-CSRF-TOKEN":E().csrf_token},body:`{}`,credentials:`same-origin`,keepalive:!0}).catch(()=>{})},[e,n,t]);return(0,q.useEffect)(()=>{let e=()=>{window.setTimeout(()=>{let e=document.activeElement;e instanceof HTMLIFrameElement&&i.current?.contains(e)&&a()})};return window.addEventListener(`blur`,e),()=>window.removeEventListener(`blur`,e)},[a]),(0,J.jsx)(`div`,{ref:i,onClickCapture:a,children:r})}var Ht=[{id:`x`,label:`X`,color:`#050505`,icon:(0,J.jsx)(ie,{className:`size-5`})},{id:`facebook`,label:`Facebook`,color:`#1877F2`,icon:(0,J.jsx)(te,{className:`size-5`})},{id:`whatsapp`,label:`WhatsApp`,color:`#16A85B`,icon:(0,J.jsx)(ne,{className:`size-5`})},{id:`linkedin`,label:`LinkedIn`,color:`#0A66C2`,icon:(0,J.jsx)(at,{className:`size-5`})},{id:`telegram`,label:`Telegram`,color:`#229ED9`,icon:(0,J.jsx)(re,{className:`size-5`})}];function Ut({boundaryRef:e,pageTitle:t,pageDescription:n,pageUrl:r,pageHandle:i,avatarUrl:a,profileColor:o,profileTextColor:s,showCreateAccount:c,showShare:l,isPreview:u}){let{branding:d}=D(),[f,p]=(0,q.useState)(!1),[m,h]=(0,q.useState)(!1),[g,_]=(0,q.useState)(!1),v=d.logo_light_mobile||d.logo_dark_mobile||d.favicon;return(0,q.useEffect)(()=>{let t=0,n=()=>{cancelAnimationFrame(t),t=requestAnimationFrame(()=>{let t=e.current;if(!t)return;let n=Math.max(72,Math.round(window.innerHeight*.18));_(t.getBoundingClientRect().top<=n)})};return n(),window.addEventListener(`scroll`,n,{passive:!0}),window.addEventListener(`resize`,n,{passive:!0}),document.addEventListener(`scroll`,n,{capture:!0,passive:!0}),()=>{cancelAnimationFrame(t),window.removeEventListener(`scroll`,n),window.removeEventListener(`resize`,n),document.removeEventListener(`scroll`,n,!0)}},[e]),(0,J.jsxs)(J.Fragment,{children:[(0,J.jsxs)(`div`,{className:A(`biolink-public-header-actions pointer-events-none sticky z-30 -mb-11 flex h-11 w-full items-center justify-between px-3 transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.25,1,0.5,1)] motion-reduce:transform-none motion-reduce:transition-none`,g?`-translate-y-1 opacity-0 [&>button]:pointer-events-none`:`translate-y-0 opacity-100`),style:{top:`max(12px, env(safe-area-inset-top, 0px))`},"aria-hidden":g,children:[c?(0,J.jsxs)(`button`,{type:`button`,onClick:()=>h(!0),tabIndex:g?-1:void 0,className:A(Wt,`size-11 min-w-11 border-0 bg-transparent p-0 text-primary shadow-none backdrop-blur-none hover:bg-transparent`),children:[v?(0,J.jsx)(`img`,{src:v,alt:``,className:`size-11 object-contain`}):(0,J.jsx)(ee,{className:`size-5`}),(0,J.jsx)(`span`,{className:`sr-only`,children:(0,J.jsx)(O,{message:`Create your account on :site`,values:{site:d.site_name}})})]}):(0,J.jsx)(`span`,{}),l?(0,J.jsxs)(`button`,{type:`button`,onClick:()=>p(!0),tabIndex:g?-1:void 0,className:A(Wt,`w-11 border-white/20 bg-slate-950/75 text-white hover:bg-slate-950/90`),children:[(0,J.jsx)(C,{className:`size-5`}),(0,J.jsx)(`span`,{className:`sr-only`,children:(0,J.jsx)(O,{message:`Share this page`})})]}):null]}),(0,J.jsx)(Kt,{open:f,onOpenChange:p,pageTitle:t,pageDescription:n,pageUrl:r,pageHandle:i,avatarUrl:a,profileColor:o,profileTextColor:s,siteName:d.site_name,isPreview:u}),(0,J.jsx)(Yt,{open:m,onOpenChange:h,logo:d.logo_dark||d.logo_dark_mobile||d.favicon,siteName:d.site_name,isPreview:u})]})}var Wt=`pointer-events-auto inline-flex h-11 min-w-11 items-center justify-center rounded-xl border shadow-[0_3px_8px_rgb(0_0_0_/_0.28)] backdrop-blur-md transition-[background-color,transform] duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:translate-y-px motion-reduce:transition-none`,Gt=`inline-flex min-h-12 max-w-full items-center rounded-xl bg-white px-4 py-2 shadow-[0_4px_12px_rgb(15_23_42_/_0.14)]`;function Kt({open:e,onOpenChange:t,pageTitle:n,pageDescription:r,pageUrl:i,pageHandle:a,avatarUrl:o,profileColor:s=`#111827`,profileTextColor:c=`#FFFFFF`,siteName:l,isPreview:u}){let{trans:d}=k(),[f,p]=_e(i,{successDuration:1800});return(0,J.jsx)(P.Root,{position:`bottom`,open:e,onOpenChange:t,children:(0,J.jsxs)(P.Portal,{children:[(0,J.jsx)(P.Backdrop,{className:`bg-black/60 motion-reduce:transition-none`}),(0,J.jsxs)(P.Content,{popupClassName:`mx-auto w-full max-w-lg rounded-t-2xl bg-white text-slate-950 motion-reduce:transition-none`,className:`gap-5`,children:[(0,J.jsxs)(P.Header,{className:`relative pe-12 text-left`,children:[(0,J.jsx)(P.Title,{className:`text-base font-semibold text-slate-950`,children:(0,J.jsx)(O,{message:`Share :title`,values:{title:n}})}),(0,J.jsx)(P.Description,{className:`sr-only`,children:(0,J.jsx)(O,{message:`Choose where you want to share this page.`})}),(0,J.jsxs)(P.Close,{className:`absolute end-0 -top-2 inline-flex size-10 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950`,children:[(0,J.jsx)(h,{className:`size-5`}),(0,J.jsx)(`span`,{className:`sr-only`,children:(0,J.jsx)(O,{message:`Close`})})]})]}),(0,J.jsxs)(P.Body,{className:`flex flex-col gap-5`,children:[(0,J.jsxs)(`div`,{className:`flex min-h-48 flex-col items-center justify-center rounded-xl px-5 py-6 text-center`,style:{backgroundColor:s,color:c},children:[(0,J.jsx)(Jt,{image:o,title:n}),(0,J.jsx)(`div`,{className:`mt-3 text-xl font-bold text-balance`,children:n}),(0,J.jsxs)(`div`,{className:`mt-1 text-sm opacity-80`,children:[`@`,a]}),r?(0,J.jsx)(`div`,{className:`mt-2 line-clamp-2 max-w-sm text-xs opacity-75`,children:r}):null]}),(0,J.jsxs)(`div`,{className:`-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-2`,"aria-label":d({message:`Share options`}),children:[(0,J.jsxs)(`button`,{type:`button`,onClick:p,className:`group flex min-w-16 snap-start flex-col items-center gap-2 text-center text-xs text-slate-700`,children:[(0,J.jsx)(`span`,{className:`flex size-12 items-center justify-center rounded-full bg-slate-100 transition-transform duration-150 group-hover:scale-[1.03] group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-slate-950 motion-reduce:transition-none`,children:f?(0,J.jsx)(_,{className:`size-5`}):(0,J.jsx)(T,{className:`size-5`})}),(0,J.jsx)(`span`,{children:f?(0,J.jsx)(O,{message:`Copied`}):(0,J.jsx)(O,{message:`Copy link`})})]}),Ht.map(e=>(0,J.jsx)(qt,{option:e,pageTitle:n,pageUrl:i},e.id))]}),(0,J.jsxs)(`div`,{className:`border-t border-slate-200 pt-5`,children:[(0,J.jsx)(`div`,{className:`text-base font-semibold text-slate-950`,children:(0,J.jsx)(O,{message:`Create your own page on :site`,values:{site:l}})}),(0,J.jsx)(`p`,{className:`mt-1 max-w-md text-sm leading-6 text-slate-600`,children:(0,J.jsx)(O,{message:`Bring your links, content and contacts together in one professional page.`})}),(0,J.jsxs)(`div`,{className:`mt-4 flex flex-col gap-2`,children:[(0,J.jsx)(M,{to:`/register`,target:u?`_blank`:void 0,className:`inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition-colors hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950`,children:(0,J.jsx)(O,{message:`Sign up for free`})}),(0,J.jsx)(M,{to:`/`,target:u?`_blank`:void 0,className:`inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-950 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950`,children:(0,J.jsx)(O,{message:`Learn more`})})]})]})]})]})]})})}function qt({option:e,pageTitle:t,pageUrl:n}){return(0,J.jsxs)(`a`,{href:Xt(e.id,t,n),target:`_blank`,rel:`noreferrer`,className:`group flex min-w-16 snap-start flex-col items-center gap-2 text-center text-xs text-slate-700`,children:[(0,J.jsx)(`span`,{className:`flex size-12 items-center justify-center rounded-full text-white transition-transform duration-150 group-hover:scale-[1.03] group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-slate-950 motion-reduce:transition-none`,style:{backgroundColor:e.color},children:e.icon}),(0,J.jsx)(O,{message:e.label})]})}function Jt({image:e,title:t}){return e?(0,J.jsx)(`img`,{src:e,alt:``,className:`size-20 rounded-full border-2 border-white/70 object-cover`}):(0,J.jsx)(`span`,{className:`flex size-20 items-center justify-center rounded-full border-2 border-white/70 bg-white/15 text-2xl font-bold`,children:t.trim().slice(0,1).toUpperCase()})}function Yt({open:e,onOpenChange:t,logo:n,siteName:r,isPreview:i}){return(0,J.jsx)(P.Root,{position:`bottom`,open:e,onOpenChange:t,children:(0,J.jsxs)(P.Portal,{children:[(0,J.jsx)(P.Backdrop,{className:`bg-black/60 motion-reduce:transition-none`}),(0,J.jsxs)(P.Content,{popupClassName:`mx-auto w-full max-w-lg rounded-t-2xl bg-white text-slate-950 motion-reduce:transition-none`,className:`gap-0`,children:[(0,J.jsxs)(P.Header,{className:`sr-only`,children:[(0,J.jsx)(P.Title,{children:(0,J.jsx)(O,{message:`Create your account`})}),(0,J.jsx)(P.Description,{children:(0,J.jsx)(O,{message:`Create your professional link in bio on :site.`,values:{site:r}})})]}),(0,J.jsx)(P.Body,{children:(0,J.jsxs)(`div`,{className:`relative overflow-hidden rounded-2xl bg-primary px-6 py-7 text-primary-foreground shadow-[0_16px_36px_rgb(15_23_42_/_0.16)]`,children:[(0,J.jsxs)(P.Close,{className:`absolute end-3 top-3 inline-flex size-10 items-center justify-center rounded-lg bg-black/10 text-current/80 transition-colors hover:bg-black/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current`,children:[(0,J.jsx)(h,{className:`size-5`}),(0,J.jsx)(`span`,{className:`sr-only`,children:(0,J.jsx)(O,{message:`Close`})})]}),n?(0,J.jsx)(`span`,{className:Gt,children:(0,J.jsx)(`img`,{src:n,alt:r,className:`h-7 w-auto max-w-40 object-contain`})}):(0,J.jsx)(`div`,{className:A(Gt,`size-12 justify-center px-0 text-slate-950`),children:(0,J.jsx)(ee,{className:`size-5`})}),(0,J.jsx)(`h2`,{className:`mt-7 max-w-sm text-2xl leading-[1.08] font-bold tracking-[-0.03em] text-balance sm:text-3xl`,children:(0,J.jsx)(O,{message:`Your professional page, ready without code.`})}),(0,J.jsx)(`p`,{className:`mt-4 max-w-md text-sm leading-6 text-current/80`,children:(0,J.jsx)(O,{message:`Create your account, choose a template and publish all your links, products and contacts in one place.`})}),(0,J.jsxs)(`div`,{className:`mt-7 flex flex-col gap-3`,children:[(0,J.jsx)(M,{to:`/register`,target:i?`_blank`:void 0,className:`inline-flex min-h-12 items-center justify-center rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950`,children:(0,J.jsx)(O,{message:`Create my free account`})}),(0,J.jsx)(M,{to:`/`,target:i?`_blank`:void 0,className:`inline-flex min-h-11 items-center justify-center rounded-xl border border-current/35 bg-white/10 px-5 text-sm font-semibold text-current transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current`,children:(0,J.jsx)(O,{message:`Explore :site`,values:{site:r}})})]})]})})]})]})})}function Xt(e,t,n){let r=encodeURIComponent(n),i=encodeURIComponent(t),a=encodeURIComponent(`${t} — ${n}`);switch(e){case`facebook`:return`https://www.facebook.com/sharer/sharer.php?u=${r}`;case`linkedin`:return`https://www.linkedin.com/sharing/share-offsite/?url=${r}`;case`telegram`:return`https://t.me/share/url?url=${r}&text=${i}`;case`whatsapp`:return`https://wa.me/?text=${a}`;case`x`:return`https://x.com/intent/post?text=${i}&url=${r}`}}function Zt(e,t){let n=[];if(e===`mono`?n.push(`grayscale(1)`):e===`blur`&&n.push(`blur(12px)`),t&&n.push(`url(#noiseFilter)`),!(!n.length&&e!==`blur`))return{filter:n.join(` `),transform:e===`blur`?`scale(1.04)`:void 0}}function Qt({effect:e,className:t}){return e===`halftone`?(0,J.jsx)(`div`,{"aria-hidden":`true`,className:A(`pointer-events-none absolute inset-0`,t),style:{backgroundImage:`radial-gradient(2.25px, rgb(0, 0, 0), rgba(0, 0, 0, 0)), radial-gradient(2.25px at 1.125px 1.125px, rgb(0, 255, 255), rgba(0, 0, 0, 0)), radial-gradient(2.25px at 3.375px 1.125px, rgb(255, 0, 255), rgba(0, 0, 0, 0)), radial-gradient(2.25px at 2.25px 3.375px, rgb(255, 255, 0), rgba(0, 0, 0, 0))`,filter:`contrast(400%)`,backgroundSize:`4px 4px`,opacity:.75,mixBlendMode:`overlay`}}):null}function $t(){return(0,J.jsx)(`svg`,{"aria-hidden":`true`,className:`hidden`,children:(0,J.jsx)(`defs`,{children:(0,J.jsxs)(`filter`,{id:`noiseFilter`,filterUnits:`objectBoundingBox`,x:`0%`,y:`0%`,width:`100%`,height:`100%`,children:[(0,J.jsx)(`feTurbulence`,{type:`fractalNoise`,baseFrequency:`0.75`,result:`noise`}),(0,J.jsx)(`feColorMatrix`,{type:`saturate`,values:`0`,in:`noise`,result:`desaturatedNoise`}),(0,J.jsx)(`feComponentTransfer`,{in:`desaturatedNoise`,result:`subtleNoise`,children:(0,J.jsx)(`feFuncA`,{type:`linear`,slope:`0.5`})}),(0,J.jsx)(`feBlend`,{mode:`overlay`,in:`subtleNoise`,in2:`SourceGraphic`})]})})})}function en({biolink:e,className:t,appearance:n,content:r,enableLinkAnimations:i,showAds:a,isPreview:o=!1,renderMode:s}){n||=e.appearance?.config??null,r||=e.content||[],(0,q.useEffect)(()=>{let e=o?`biolink-preview-fonts`:`biolink-fonts`,t=n?.mediaConfig?.audioPrompt?.fontConfig,r=[n?.fontConfig,n?.headerConfig?.alternativeFont?n?.headerConfig?.titleFontConfig:null,t].filter(e=>!!e);r.length&&de(r,{id:e,forceAssetLoad:o,weights:[400,500,600,700]}).catch(()=>{})},[n?.fontConfig,n?.headerConfig?.alternativeFont,n?.headerConfig?.titleFontConfig,n?.mediaConfig?.audioPrompt?.fontConfig,o]),(0,q.useEffect)(()=>{let e=r.some(e=>e.model_type===`link`&&e.animation);i&&e&&j(()=>Promise.resolve({}),__vite__mapDeps([0]),import.meta.url)},[i,r]);let c=n,l=s===`desktop`,u=s===`mobile`,d=l||!u&&!!c?.desktopConfig?.enabled,f=an(c),p=U({btnConfig:n?.btnConfig});return(0,J.jsx)(`div`,{className:`@container`,children:(0,J.jsxs)(`div`,{className:A(`biolink-layout-container isolate`,n?.theme?.slug&&`linkbio-theme-${n.theme.slug}`,Un(c),t),id:`biolink-page-top`,style:{fontFamily:n?.fontConfig?.family,...Wn(c),...Gn(c),"--biolink-theme-button-background":p.background,"--biolink-theme-button-color":p.color,"--biolink-theme-button-border":p.borderColor},children:[n?.customCss&&(0,J.jsx)(`style`,{dangerouslySetInnerHTML:{__html:n.customCss}}),(0,J.jsx)(Vn,{appearance:c}),d?(0,J.jsx)(on,{appearance:c,biolink:e,content:r,showAds:a,isPreview:o,forceDesktop:l}):null,l?null:(0,J.jsx)(`div`,{className:A(`fixed inset-0 z-1 hidden after:absolute after:inset-0 after:bg-black/20 after:backdrop-blur-sm @2xl:block`,u&&`@2xl:hidden`,!u&&d&&`@2xl:hidden`),children:(0,J.jsx)(zn,{appearance:n})}),(0,J.jsxs)(`div`,{className:A(`relative z-2 mx-auto min-h-screen max-w-2xl overflow-hidden @2xl:min-h-[calc(100vh-2.5rem)] @2xl:rounded-t-card @2xl:shadow-2xl`,l&&`hidden`,d&&`@2xl:hidden`),style:{color:n?.bgConfig?.color},children:[(0,J.jsx)(zn,{className:`z-3`,appearance:n}),(0,J.jsx)(Nn,{appearance:c}),(0,J.jsx)(Ln,{appearance:c}),(0,J.jsx)(Rn,{appearance:c,isPreview:o}),(0,J.jsxs)(`div`,{className:`relative z-4 flex flex-col p-6`,children:[(0,J.jsxs)(`div`,{className:`flex-auto`,children:[a&&(0,J.jsx)(L,{slot:`biolink_top`,className:`mb-15`}),(0,J.jsx)(cn,{biolink:e,appearance:n,isPreview:o}),(0,J.jsx)(Tn,{appearance:c,biolink:e,isPreview:o}),Z(n)?null:(0,J.jsx)(X,{appearance:c,config:f,device:`mobile`,placement:`header`}),(0,J.jsx)(bn,{appearance:c}),(0,J.jsx)(rn,{appearance:n,content:r,biolink:e,isPreview:o}),Z(n)?null:(0,J.jsx)(X,{appearance:c,config:f,device:`mobile`,placement:`footer`})]}),(0,J.jsx)(Dn,{appearance:n,biolink:e,content:r,socialConfig:f})]})]})]})})}function tn(e){if(!e.active)return!1;if(e.model_type!==`biolinkWidget`)return!0;let t=e,n=Date.now();return!(t.activates_at&&new Date(t.activates_at).getTime()>n||t.expires_at&&new Date(t.expires_at).getTime()<=n)}function nn({widget:e,children:t}){let[n,a]=(0,q.useState)(!e.password),o=se(),c=r(ce());return n?t:(0,J.jsxs)(pe.Root,{form:o,onSubmit:t=>{c.mutate({...t,linkeableType:`biolinkWidget`,linkeableId:e.id},{onSuccess:()=>a(!0),onError:e=>he(e,o)})},className:`biolink-password-widget rounded-2xl border border-current/15 bg-current/5 p-5 text-left shadow-sm backdrop-blur-sm`,children:[(0,J.jsxs)(`div`,{className:`mb-4 flex items-center gap-3 text-base font-semibold`,children:[(0,J.jsx)(`span`,{className:`flex size-10 shrink-0 items-center justify-center rounded-full border border-current/15 bg-current/10`,children:(0,J.jsx)(s,{className:`size-5`})}),(0,J.jsx)(O,{message:`This widget is password protected.`})]}),(0,J.jsxs)(pe.Field,{name:`password`,children:[(0,J.jsx)(I,{type:`password`,required:!0,className:`rounded-xl border-current/20 bg-transparent`,placeholder:`Password`}),(0,J.jsx)(me.Error,{})]}),(0,J.jsxs)(oe,{type:`submit`,className:`biolink-btn-custom mt-4 flex w-full items-center justify-center gap-2`,disabled:c.isPending,children:[(0,J.jsx)(O,{message:`Unlock`}),(0,J.jsx)(i,{className:`size-4`})]})]})}function rn({appearance:e,content:t,biolink:n,isPreview:r,excludeWidgetTypes:i=[],anchorSuffix:a=``,desktopLayout:o=!1}){let s=[],c=null;return t.forEach(t=>{if(!tn(t))return;let n=`type`in t?t.type:null,r=e?.headerConfig?.viewerCount?.enabled===!0;if(t.model_type===`biolinkWidget`&&i.includes(n??``)||n===`viewerCount`&&r)return;let a=t.model_type===`link`||![`socials`,`imageGallery`,`linkCollection`,`embedCollection`].includes(n??``);(!c||c.isPanel!==a)&&(c={isPanel:a,items:[]},s.push(c)),c.items.push(t)}),(0,J.jsx)(`div`,{className:`biolink-content-list flex w-full flex-col gap-6`,children:s.map((t,i)=>(0,J.jsx)(`div`,{className:A(`biolink-content-group flex w-full flex-col gap-4`,t.isPanel?`biolink-panel-group`:`biolink-top-group`),children:t.items.map(t=>{let i=`${t.model_type}-${t.id}`,s;if(t.model_type===`link`)s=(0,J.jsx)(_n,{appearance:e,item:t,isLink:!0});else{let i=Bt[t.type],a=!!t.config?.title,o=new Set(`linkedProduct.linkedCourse.service.booking.faq.linkCollection.embedCollection.imageGallery.qrCode.location.contactCard.discountCode.document.genericVideo.podcastMusic.mobileApp.eventList.externalForm.rssFeed.discordPresence.gamingProfile.reviews.stats.donation.spotlight.ctaBanner.logoCloud.socialFeed`.split(`.`)).has(t.type??``),c=new Set([`contactForm`,`emailSignup`,`eventRsvp`,`smsSignup`,`poll`,`viewerCount`]).has(t.type??``),l=a&&!o&&!c,u=(0,J.jsx)(Vt,{biolinkId:n?.id,widgetId:t.id,isPreview:r,children:(0,J.jsx)(nn,{widget:t,children:(0,J.jsx)(i,{widget:t,variant:`biolinkPage`,appearance:e,biolink:n,isPreview:r})})});s=l?(0,J.jsx)(_n,{appearance:e,item:t,isLink:!1,children:u}):u}return(0,J.jsx)(`div`,{id:t.model_type===`biolinkWidget`?`biolink-widget-${t.id}${a}`:void 0,className:A(`w-full min-w-0 scroll-mt-6`,o&&`@container/biolink-widget`),children:s},i)})},i))})}function an(e){let t=e?.socialConfig;return t?.enabled&&Object.values(t.links??{}).some(e=>typeof e==`string`&&e.trim()!==``)?t:null}function X({appearance:e,config:t,device:n,placement:r}){return!t||(n===`mobile`?t.mobilePlacement??`header`:t.desktopPlacement??`badge`)!==r||!Object.keys(t.links??{}).length?null:(0,J.jsx)(yt,{config:{...t.links??{},style:t.style,colorMode:t.colorMode},appearance:e,variant:`desktopHeader`,className:A(`w-full`,r===`footer`&&`mt-5`,r===`badge`&&`mt-4`)})}function on({appearance:e,biolink:t,content:n,showAds:r,isPreview:i,forceDesktop:a=!1}){let o={...we,...e?.desktopConfig},s=(e?.desktopConfig??{}).surfaceMode??`open`,c=s===`tinted`?o.panelTextColor??e?.bgConfig?.color??`currentColor`:e?.bgConfig?.color??`currentColor`,l=o.profilePlacement??`center`,u=o.layoutMode??`full`,d=o.contentMode??`spotlight`,f=o.gridMode??`auto`,p=an(e),m=d===`columns`?A(`[&_.biolink-panel-group]:grid [&_.biolink-panel-group]:gap-4 [&_.biolink-panel-group>div]:mb-0 [&_.biolink-panel-group>div]:min-w-0`,f===`1`?`[&_.biolink-panel-group]:grid-cols-1`:f===`2`?`[&_.biolink-panel-group]:grid-cols-[repeat(auto-fit,minmax(min(100%,24rem),1fr))]`:f===`3`?`[&_.biolink-panel-group]:grid-cols-[repeat(auto-fit,minmax(min(100%,20rem),1fr))]`:`[&_.biolink-panel-group]:grid-cols-[repeat(auto-fit,minmax(min(100%,22rem),1fr))]`):``,h=s===`tinted`?{backgroundColor:$(o.panelBackgroundColor??`#111111`,o.profileOpacity??.9),backdropFilter:`blur(${o.profileBlur??12}px)`}:void 0;return(0,J.jsxs)(`div`,{className:A(`biolink-desktop-layout overflow-x-clip`,a?`relative z-2 block min-h-[100dvh]`:`relative z-2 hidden min-h-[100dvh] @2xl:block`,m,`[&_.biolink-collection-grid]:grid-cols-[repeat(auto-fit,minmax(min(100%,14rem),1fr))]`),style:{color:c},children:[(0,J.jsx)(zn,{appearance:e}),(0,J.jsx)(Nn,{appearance:e}),(0,J.jsx)(Ln,{appearance:e}),(0,J.jsx)(Mn,{appearance:e}),(0,J.jsx)(Rn,{appearance:e,isPreview:i}),u===`split`?(0,J.jsxs)(`div`,{className:`relative z-5 mx-auto grid min-h-[100dvh] w-full max-w-6xl min-w-0 grid-cols-[minmax(18rem,0.8fr)_minmax(0,1.2fr)] gap-8 px-6 py-6 lg:px-8 xl:gap-12`,children:[(0,J.jsx)(`aside`,{className:`sticky top-6 flex min-h-[calc(100dvh-3rem)] items-center justify-center self-start`,children:(0,J.jsxs)(`div`,{className:`w-full max-w-sm`,children:[(0,J.jsx)(cn,{biolink:t,appearance:e,isPreview:i}),(0,J.jsx)(Tn,{appearance:e,biolink:t,isPreview:i}),(0,J.jsx)(bn,{appearance:e}),Z(e)?null:(0,J.jsx)(X,{appearance:e,config:p,device:`desktop`,placement:`badge`})]})}),(0,J.jsxs)(`div`,{className:`min-w-0`,children:[(0,J.jsx)(`main`,{className:`min-w-0`,style:h,children:(0,J.jsxs)(`div`,{className:A(`mx-auto w-full px-2 pt-3 pb-6 sm:px-6 sm:pt-4`,d===`columns`&&`max-w-full`,d===`stack`&&`max-w-3xl`,d===`spotlight`&&`max-w-4xl`),children:[r&&(0,J.jsx)(L,{slot:`biolink_top`,className:`mb-10`}),(0,J.jsx)(rn,{appearance:e,content:n,biolink:t,isPreview:i,anchorSuffix:`-desktop`,desktopLayout:!0}),Z(e)?null:(0,J.jsx)(X,{appearance:e,config:p,device:`desktop`,placement:`footer`})]})}),(0,J.jsx)(`div`,{className:A(`mx-auto w-full px-2 pt-3 pb-0 sm:px-6`,d===`columns`&&`max-w-full`,d===`stack`&&`max-w-3xl`,d===`spotlight`&&`max-w-4xl`),children:(0,J.jsx)(Dn,{appearance:e,biolink:t,content:n,socialConfig:p,className:`mt-0 px-0 pb-0`,anchorSuffix:`-desktop`})})]})]}):(0,J.jsx)(`div`,{className:A(`relative z-5 mx-auto flex min-h-[100dvh] w-full max-w-6xl px-6 py-12 lg:px-10 lg:pt-10 lg:pb-16`,l===`left`&&`items-start justify-start`,l===`right`&&`items-start justify-end`,l===`center`&&`items-start justify-center`),children:(0,J.jsxs)(`div`,{className:A(`mx-auto w-full p-2 sm:p-6`,d===`columns`&&`max-w-6xl`,d===`stack`&&`max-w-3xl`,d===`spotlight`&&`max-w-2xl`),style:h,children:[r&&(0,J.jsx)(L,{slot:`biolink_top`,className:`mb-10`}),(0,J.jsx)(cn,{biolink:t,appearance:e,isPreview:i}),(0,J.jsx)(Tn,{appearance:e,biolink:t,isPreview:i}),(0,J.jsx)(bn,{appearance:e}),p?Z(e)?null:(0,J.jsx)(X,{appearance:e,config:p,device:`desktop`,placement:`badge`}):(0,J.jsx)(sn,{appearance:e,biolink:t,content:n,isPreview:i}),(0,J.jsx)(rn,{appearance:e,content:n,biolink:t,isPreview:i,excludeWidgetTypes:p?[]:[`socials`],anchorSuffix:`-desktop`,desktopLayout:!0}),Z(e)?null:(0,J.jsx)(X,{appearance:e,config:p,device:`desktop`,placement:`footer`}),(0,J.jsx)(Dn,{appearance:e,biolink:t,content:n,socialConfig:p,anchorSuffix:`-desktop`})]})})]})}function sn({appearance:e,biolink:t,content:n,isPreview:r}){let i=n.filter(e=>tn(e)&&e.model_type===`biolinkWidget`&&e.type===`socials`);return i.length?(0,J.jsx)(`div`,{className:`flex w-full flex-col items-center`,children:i.map(n=>{let i=Bt[n.type];return(0,J.jsx)(nn,{widget:n,children:(0,J.jsx)(i,{widget:n,variant:`desktopHeader`,appearance:e,biolink:t,isPreview:r})},`${n.model_type}-${n.id}`)})}):null}function cn({appearance:e,biolink:t,isPreview:n}){let r=(0,q.useRef)(null),i=e?.headerConfig;if(!i)return null;let a=i.layout??`classic`,s=i.alignment??`center`,c=i.title||t.name,l=i.titleColor||e?.bgConfig?.color,u=i.alternativeFont?i.titleFontConfig?.family:void 0,d=B(i.logo),f=e,p=B(f?.mediaConfig?.avatarOverride),m=a===`hero`||a===`cutout`?B(i.image):void 0,h=a===`hero`&&!!m,g=a===`cutout`&&!!m,_=!!m,v=i.titleStyle===`logo`&&d,y=i.showShareButton===!0||i.showNavigation===!0,b=W(`avatar`,[t.id,t.back_half,t.name]);return(0,J.jsxs)(`header`,{className:A(`relative mb-8 flex flex-col`,s===`center`?`items-center text-center`:s===`left`||s===`left-inline`?`items-start text-left`:`items-end text-right`,a===`hero`&&!m&&`pt-4`,h&&`relative -mx-6 -mt-6 h-[420px] max-h-[58vh] min-h-80 rounded-t-card px-6 pt-4 pb-8`,g&&`relative -mx-6 -mt-6 h-[360px] max-h-[52vh] min-h-72 justify-start rounded-t-card px-6 pt-4 pb-10`,a===`banner`&&`-mx-2`),children:[y?(0,J.jsx)(Ut,{boundaryRef:r,pageTitle:c,pageDescription:i.bio,pageUrl:t.short_url,pageHandle:t.back_half,avatarUrl:B(i.image)||d||b,profileColor:e?.bgConfig?.backgroundColor,profileTextColor:l,showCreateAccount:i.showNavigation===!0,showShare:i.showShareButton===!0,isPreview:n}):null,m&&(0,J.jsx)(ln,{image:m,variant:a===`cutout`?`cutout`:`hero`}),a===`banner`&&(0,J.jsx)(`div`,{className:`mb-[-38px] h-60 w-full shrink-0 rounded-card-sm`,style:Ce(i,e?.bgConfig)}),(0,J.jsxs)(`div`,{className:A(`relative z-2 flex w-full`,s===`center`?`flex-col items-center`:s===`left`?`flex-col items-start`:s===`left-inline`?`flex-row items-center gap-4`:s===`right-inline`?`flex-row-reverse items-center justify-end gap-4`:`flex-col items-center`,h&&`mt-auto`),children:[!_&&(0,J.jsx)(mn,{accentImage:p,header:i,appearance:e,title:c,placeholder:b}),(0,J.jsxs)(`div`,{className:A(`flex flex-col`,s===`left-inline`||s===`right-inline`?`flex-1`:`w-full`,s===`center`?`items-center`:s===`left`||s===`left-inline`?`items-start`:`items-end`,_&&`drop-shadow-lg`,g&&`pt-1`),children:[v?(0,J.jsx)(`div`,{className:A(`flex min-h-18 w-full items-center`,s===`center`?`justify-center`:s===`left`||s===`left-inline`?`justify-start`:`justify-end`,_||s===`left-inline`||s===`right-inline`?`mt-0`:`mt-4 px-4`),children:(0,J.jsxs)(`span`,{className:`biolink-profile-title biolink-profile-title-logo relative inline-flex items-center justify-center`,children:[(0,J.jsx)(`img`,{src:d,alt:``,className:A(`block max-h-full max-w-full object-contain`,_?`max-h-20 max-w-[min(18rem,100%)]`:`max-h-18 max-w-[min(17rem,100%)]`)}),(0,J.jsx)(`span`,{className:`sr-only`,children:c})]})}):(0,J.jsxs)(`div`,{className:A(`flex max-w-full flex-wrap items-center gap-2`,s===`center`?`justify-center`:s===`left`||s===`left-inline`?`justify-start`:`justify-end`),children:[(0,J.jsx)(`h1`,{className:A(`biolink-profile-title biolink-profile-title-text max-w-full font-bold wrap-break-word`,_?`mt-0 text-3xl`:s===`left-inline`||s===`right-inline`?`mt-0 text-2xl`:`mt-4 text-2xl`),style:{color:l,fontFamily:u},children:c}),(0,J.jsx)(xn,{appearance:f})]}),i.bio?(0,J.jsx)(`p`,{className:A(`mt-2 max-w-md text-sm leading-6 wrap-break-word`,_?`opacity-90`:`opacity-85`),children:i.bio}):null,i.locationText||i.statusText?(0,J.jsxs)(`div`,{className:`mt-2 flex max-w-md flex-wrap items-center gap-x-3 gap-y-1 text-xs text-current/75`,children:[i.locationText?(0,J.jsxs)(`span`,{className:`inline-flex items-center gap-1.5`,children:[(0,J.jsx)(o,{className:`size-3.5`}),i.locationText]}):null,i.statusText?(0,J.jsxs)(`span`,{className:`inline-flex items-center gap-1.5`,children:[(0,J.jsx)(`span`,{className:`size-1.5 rounded-full bg-positive`,"aria-hidden":!0}),i.statusText]}):null]}):null]})]}),y?(0,J.jsx)(`span`,{ref:r,"aria-hidden":!0,className:`pointer-events-none absolute bottom-0 left-0 size-px`}):null]})}function ln({image:e,variant:t}){let n=t===`cutout`;return(0,J.jsx)(`div`,{"aria-hidden":!0,className:`absolute inset-0 z-0 overflow-hidden rounded-t-card`,children:(0,J.jsxs)(`div`,{className:`absolute inset-0`,style:n?pn:fn,children:[(0,J.jsx)(`img`,{src:e,alt:``,className:A(`size-full object-cover saturate-110`,n?`opacity-90`:`opacity-[0.82]`)}),(0,J.jsx)(`div`,{className:A(`absolute inset-0`,n?`bg-black/10`:`bg-black/15`)})]})})}var un=`radial-gradient(125% 105% at 50% 0%, rgb(0 0 0) 0%, rgb(0 0 0) 42%, rgb(0 0 0 / 0.98) 50%, rgb(0 0 0 / 0.9) 58%, rgb(0 0 0 / 0.76) 66%, rgb(0 0 0 / 0.55) 74%, rgb(0 0 0 / 0.3) 82%, rgb(0 0 0 / 0.1) 90%, rgb(0 0 0 / 0) 96%, rgb(0 0 0 / 0) 100%)`,dn=`radial-gradient(115% 100% at 50% 0%, rgb(0 0 0) 0%, rgb(0 0 0) 52%, rgb(0 0 0 / 0.98) 59%, rgb(0 0 0 / 0.9) 65%, rgb(0 0 0 / 0.75) 71%, rgb(0 0 0 / 0.55) 77%, rgb(0 0 0 / 0.32) 83%, rgb(0 0 0 / 0.12) 89%, rgb(0 0 0 / 0) 94%, rgb(0 0 0 / 0) 100%)`,fn={WebkitMaskImage:un,maskImage:un,WebkitMaskRepeat:`no-repeat`,maskRepeat:`no-repeat`,WebkitMaskSize:`100% 100%`,maskSize:`100% 100%`},pn={WebkitMaskImage:dn,maskImage:dn,WebkitMaskRepeat:`no-repeat`,maskRepeat:`no-repeat`,WebkitMaskSize:`100% 100%`,maskSize:`100% 100%`};function mn({accentImage:e,header:t,appearance:n,title:r,placeholder:i}){let a=t.layout??`classic`,o=t.image,s=t.shapeColor??t.titleColor??n?.bgConfig?.color??`#111111`,c=t.shapeVariant,l=Ye([B(o),i]);if(a===`shape`)return(0,J.jsx)(hn,{accentImage:e,image:l.failed?void 0:l.src,onImageError:l.onError,shapeColor:s,shapeVariant:c,title:r,avatarSize:t.avatarSize});let u=t.avatarSize,d=t.avatarRadius,f=t.avatarBorderWidth,p=t.avatarBorderColor,m={};u!==void 0&&(m.width=`${u}px`,m.height=`${u}px`),d!==void 0&&(m.borderRadius=`${d}px`),f!==void 0&&(m.borderWidth=`${f}px`,m.borderStyle=`solid`,m.borderColor=p??`transparent`);let h=A(`flex items-center justify-center overflow-hidden bg-white/20 text-xl font-semibold`,!f&&`shadow-lg ring-1 ring-white/25`,!d&&a===`hero`&&`rounded-t-card rounded-b-full`,!d&&a===`banner`&&`rounded-full`,!d&&a===`cutout`&&`rounded-t-card rounded-b-[40%]`,!d&&a===`classic`&&`rounded-full`,!u&&a===`hero`&&`size-30`,!u&&a===`banner`&&`size-22`,!u&&a===`cutout`&&`size-24`,!u&&a===`classic`&&`size-24`,!f&&a===`banner`&&`border-4 border-white/40`);return(0,J.jsxs)(`div`,{className:`biolink-profile-avatar relative z-2 inline-flex`,children:[!l.failed&&l.src?(0,J.jsx)(`img`,{src:l.src,alt:``,style:m,className:A(h,`object-cover`),onError:l.onError}):(0,J.jsx)(`div`,{style:m,className:h,children:r.slice(0,1).toUpperCase()}),(0,J.jsx)(gn,{image:e})]})}function hn({accentImage:e,image:t,onImageError:n,shapeColor:r=`#111111`,shapeVariant:i,title:a,avatarSize:o=96}){let s=ye(i),c=`biolink-header-shape-${s}-${(0,q.useId)().replace(/:/g,``)}`,l=Se(s);return(0,J.jsxs)(`div`,{className:`biolink-profile-avatar relative z-2 flex items-center justify-center`,style:{width:`${Math.round(o*1.5)}px`,height:`${Math.round(o*1.0625)}px`},children:[(0,J.jsxs)(`svg`,{"aria-hidden":!0,className:`size-full overflow-visible drop-shadow-lg`,viewBox:`0 0 100 100`,children:[(0,J.jsx)(`defs`,{children:(0,J.jsx)(`clipPath`,{id:c,clipPathUnits:`userSpaceOnUse`,children:(0,J.jsx)(`path`,{d:l})})}),t?(0,J.jsx)(`image`,{clipPath:`url(#${c})`,height:`100`,href:t,preserveAspectRatio:`xMidYMid slice`,width:`100`,onError:n}):(0,J.jsx)(`path`,{d:l,fill:r})]}),t?null:(0,J.jsx)(`span`,{className:`absolute flex size-16 items-center justify-center rounded-full bg-white/15 text-xl font-semibold text-white`,children:a.slice(0,1).toUpperCase()}),(0,J.jsx)(gn,{image:e,className:`right-7 bottom-5`})]})}function gn({className:e,image:t}){let n=B(t);return n?(0,J.jsx)(`img`,{"aria-hidden":!0,src:n,alt:``,className:A(`pointer-events-none absolute z-10 size-8 shrink-0 rounded-full bg-white/95 object-contain p-1 shadow-md ring-2 ring-white/85`,e??`-right-1 -bottom-1`),loading:`lazy`,draggable:!1}):null}function _n({item:e,appearance:t,isLink:n,children:r}){let i=t?.boxConfig;if(!n&&!i&&t?.btnConfig&&(i={...t.btnConfig,radius:t.btnConfig.radius===`rounded-full`?`rounded-lg`:t.btnConfig.radius}),!n&&`config`in e){let n=e.config;(n.boxBackgroundColor||n.boxTextColor)&&(i={...i??t?.btnConfig??{},...n.boxBackgroundColor?{color:n.boxBackgroundColor}:{},...n.boxTextColor?{textColor:n.boxTextColor}:{}})}let a=n?t?.btnConfig:i??t?.btnConfig,o=a?.radius??`rounded-sm`,s=a?.variant??`solid`,c=e.style,l=c?.backgroundColor??a?.color??void 0,u=c?.textColor??a?.textColor??void 0,d=n?vn(e):null,f=it({btnConfig:a,override:c}),p=!!a?.blockStyle,m=n?`a`:`div`,h=n?e.short_url:void 0,g=n?`_blank`:void 0;return(0,J.jsx)(m,{className:A(`biolink-btn-custom relative flex w-full min-w-0 appearance-none items-center justify-center overflow-hidden py-4 align-middle text-sm font-semibold wrap-break-word hyphens-auto whitespace-normal no-underline transition-button duration-200 outline-none select-none focus-visible:ring`,e.animation&&`animate__animated animate__repeat-3 animate__${e.animation}`,!p&&o,p&&`rounded-none`,n?d?`h-14 px-16.5`:`h-14 px-4.5`:`flex-col px-4`,!n&&`biolink-widget-surface`,!l&&(s===`outline`||s===`outline-shadow`||s===`dashed`||s===`underline`||s===`top-bottom-line`?`border-primary`:`border-primary bg-primary`),!u&&(s===`outline`||s===`outline-shadow`||s===`dashed`||s===`underline`||s===`top-bottom-line`?`text-primary`:`text-primary-foreground`)),style:U({btnConfig:a,override:c}),target:g,href:h,children:n?(0,J.jsxs)(J.Fragment,{children:[d?(0,J.jsx)(yn,{media:d,radius:o,iconColor:f}):null,(0,J.jsx)(`span`,{className:`relative z-10`,children:e.name})]}):r})}function vn(e){let t=e;return t.thumbnail_type===`none`?null:t.thumbnail_type!==`image`&&t.thumbnail_asset?{src:t.thumbnail_asset,type:`asset`}:e.image?{src:e.image,type:`image`}:null}function yn({media:e,radius:t,iconColor:n}){let r=A(`absolute top-1/2 left-2.5 z-10 aspect-square h-[calc(100%-18px)] -translate-y-1/2`,e.type===`asset`?`object-contain p-1.5`:`object-cover`,e.type===`image`&&t);return e.type===`asset`&&rt(e.src)?(0,J.jsx)(`span`,{"aria-hidden":!0,className:`absolute top-1/2 left-4 size-6 -translate-y-1/2`,style:{backgroundColor:n??`currentColor`,WebkitMaskImage:`url("${e.src}")`,maskImage:`url("${e.src}")`,WebkitMaskRepeat:`no-repeat`,maskRepeat:`no-repeat`,WebkitMaskPosition:`center`,maskPosition:`center`,WebkitMaskSize:`contain`,maskSize:`contain`}}):(0,J.jsx)(`img`,{className:r,src:e.src,alt:``,loading:`lazy`,draggable:!1})}function bn({appearance:e}){let{trans:t}=k(),n=e?.badgeConfig,r=n?.style??`chips`,i=r!==`cards`&&r!==`icon`,a=(n?.items??[]).filter(e=>e.active!==!1&&!(i&&e.id===`verified`)).sort((e,t)=>(e.sort_order??0)-(t.sort_order??0));return a.length?(0,J.jsx)(`div`,{className:A(`mb-6 flex justify-center gap-2`,r===`cards`?`flex-col`:`flex-wrap`),children:a.map(e=>{let n=t({message:e.label?.startsWith(`biolink.badges.`)?Sn(e.id):e.label??``}),i=e.description?t({message:e.description}):n,a=i&&i!==n?`${n}: ${i}`:n,o=e.editionYear?t({message:`Edition :year`,values:{year:e.editionYear}}):null,s=o?`${a} · ${o}`:a,c=r===`icon`,l=e.iconSize===`large`?`size-7`:e.iconSize===`small`?c?`size-5`:`size-4`:c?`size-6`:`size-5`;return(0,J.jsxs)(`span`,{role:c?`img`:void 0,tabIndex:c?0:void 0,title:c?s:void 0,"aria-label":c?s:void 0,"data-tooltip":c?s:void 0,className:A(`biolink-badge inline-flex items-center justify-center gap-1.5 text-xs font-semibold`,c&&`biolink-badge-icon-only relative size-11 rounded-full`,r===`inline`&&`px-1 py-1`,r===`chips`&&`min-h-9 rounded-full border px-3 py-1.5`,r===`cards`&&`w-full justify-start rounded-card-sm border px-3 py-2.5 text-start`),style:{color:e.color??`currentColor`,borderColor:e.color?$(e.color,.4):`currentColor`,backgroundColor:r===`inline`?`transparent`:e.color?$(e.color,.12):`rgb(255 255 255 / 0.08)`},children:[(0,J.jsxs)(`span`,{className:A(`relative shrink-0`,r===`cards`&&`flex size-9 items-center justify-center rounded-full bg-background/20`),children:[(0,J.jsx)(wn,{item:e,className:l}),c?(0,J.jsx)(Cn,{year:e.editionYear,label:o,variant:`overlay`}):null]}),c?null:r===`cards`?(0,J.jsxs)(`span`,{className:`flex min-w-0 flex-1 flex-col`,children:[(0,J.jsx)(`span`,{className:`truncate`,children:n}),r===`cards`&&i!==n?(0,J.jsx)(`span`,{className:`line-clamp-2 text-[11px] leading-snug font-normal opacity-75`,children:i}):null]}):(0,J.jsx)(`span`,{children:n}),c?null:(0,J.jsx)(Cn,{year:e.editionYear,label:o,variant:r===`cards`?`card`:`inline`})]},e.id)})}):null}function xn({appearance:e}){let{trans:t}=k(),n=e?.badgeConfig,r=n?.style??`chips`,i=(n?.items??[]).find(e=>e.id===`verified`&&e.active!==!1);if(!i||r!==`inline`&&r!==`chips`)return null;let a=i.color??`currentColor`;return(0,J.jsxs)(`span`,{className:A(`biolink-inline-profile-badge inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold`,r===`inline`&&`px-1`,r===`chips`&&`rounded-full border px-2.5 py-1`),style:{color:a,borderColor:i.color?$(i.color,.5):`currentColor`,backgroundColor:r===`inline`?`transparent`:i.color?$(i.color,.12):`rgb(255 255 255 / 0.08)`},children:[(0,J.jsx)(wn,{item:i}),(0,J.jsx)(`span`,{children:t({message:i.label?.startsWith(`biolink.badges.`)?Sn(i.id):i.label??``})})]})}function Sn(e){return`biolink.badges.${e}.label`}function Cn({year:e,label:t,variant:n=`overlay`}){if(!e)return null;let r=String(e).slice(-2).padStart(2,`0`);return(0,J.jsx)(`span`,{"aria-label":t??void 0,title:t??void 0,className:A(`shrink-0 leading-none font-bold tabular-nums`,n===`overlay`&&`absolute -end-1 -bottom-1 flex size-5 items-center justify-center rounded-full border border-current bg-background text-[9px] text-foreground shadow-xs`,n===`inline`&&`text-[10px] opacity-75`,n===`card`&&`ms-auto rounded-full border border-current px-2 py-1 text-[10px]`),children:r})}function wn({item:e,className:t=`size-4 shrink-0`}){if(e.iconRef?.library===`lucide`){let n=m[e.iconRef.name];if(typeof n==`function`)return(0,q.createElement)(n,{className:t})}if(e.iconRef?.library===`simple-icons`){let n=ae[`Si${e.iconRef.name.charAt(0).toUpperCase()}${e.iconRef.name.slice(1)}`];if(typeof n==`function`)return(0,q.createElement)(n,{className:t})}let n=B(e.icon);return n?rt(n)?(0,J.jsx)(`span`,{"aria-hidden":!0,className:A(t,`block bg-current`),style:{WebkitMaskImage:`url("${n}")`,maskImage:`url("${n}")`,WebkitMaskRepeat:`no-repeat`,maskRepeat:`no-repeat`,WebkitMaskPosition:`center`,maskPosition:`center`,WebkitMaskSize:`contain`,maskSize:`contain`}}):(0,J.jsx)(`img`,{src:n,alt:``,className:A(t,`object-contain`),loading:`lazy`,draggable:!1}):(0,J.jsx)(d,{"aria-hidden":!0,className:t})}function Tn({appearance:e,biolink:t,isPreview:n=!1}){let r=e?.headerConfig?.viewerCount,i=r?.enabled===!0,[a,o]=(0,q.useState)(n?1:null);return(0,q.useEffect)(()=>{if(!i||n||!t.id)return;let e=!1,r=En(),a=async()=>{try{let n=await fetch(`/api/v1/public/biolink/${t.id}/viewer-count?visitor_token=${encodeURIComponent(r)}`,{headers:{Accept:`application/json`},cache:`no-store`});if(!n.ok)return;let i=await n.json();!e&&typeof i.count==`number`&&o(Math.max(0,Math.round(i.count)))}catch{}};a();let s=window.setInterval(a,2e4);return()=>{e=!0,window.clearInterval(s)}},[t.id,i,n]),i?(0,J.jsx)(`div`,{className:`mb-4 flex justify-center`,style:{color:r.color||`currentColor`,fontFamily:r.fontConfig?.family},"aria-live":`polite`,"aria-label":N(`Current page viewers`).message,children:(0,J.jsxs)(`span`,{className:`inline-flex min-h-7 items-center gap-1.5 rounded-full border border-current/15 bg-current/[0.075] px-2.5 py-1 text-xs font-medium shadow-[0_1px_2px_rgb(0_0_0_/_0.12)]`,children:[(0,J.jsx)(`span`,{className:`size-1.5 rounded-full bg-emerald-400`,"aria-hidden":!0}),(0,J.jsx)(S,{className:`size-3.5`,"aria-hidden":!0}),(0,J.jsx)(`span`,{children:a??`...`}),(0,J.jsx)(`span`,{className:`opacity-80`,children:(0,J.jsx)(O,{message:`viewing now`})})]})}):null}function En(){let e=`meulinkbio-viewer-token`;try{let t=window.sessionStorage.getItem(e);if(t)return t;let n=typeof crypto.randomUUID==`function`?crypto.randomUUID():`${Date.now()}-${Math.random().toString(36).slice(2)}`;return window.sessionStorage.setItem(e,n),n}catch{return`${Date.now()}-${Math.random().toString(36).slice(2)}`}}function Z(e){let t=e?.footerConfig;return t?.version===1&&t.enabled!==!1&&t.blocks?.socials!==!1}function Dn({appearance:e,biolink:t,content:n,socialConfig:r,className:i,anchorSuffix:a=``}){let{trans:o}=k(),s=e?.footerConfig,c=s?.version!==1,u=!c&&s?.enabled!==!1&&s?.blocks?.backToTop!==!1,d=(0,q.useRef)(null),[f,p]=(0,q.useState)(!1),m=jn(s?.links??[],n,a);return(0,q.useEffect)(()=>{let e=d.current;if(!u||!e||typeof IntersectionObserver>`u`){p(!1);return}let t=new IntersectionObserver(e=>p(e[0]?.isIntersecting??!1),{threshold:.08});return t.observe(e),()=>t.disconnect()},[u]),(0,J.jsxs)(`footer`,{ref:d,className:A(`biolink-public-footer mt-8 px-2 pb-2 text-current/85`,i),children:[c?(0,J.jsx)(kn,{links:m}):s?.enabled===!1?null:(0,J.jsx)(On,{appearance:e,biolink:t,config:s,links:m,socialConfig:r}),(0,J.jsx)(An,{appearance:e,showPlatformLinks:s?.showPlatformLinks!==!1,compact:!c}),u?(0,J.jsxs)(`button`,{type:`button`,"aria-label":o({message:`Back to top`}),title:o({message:`Back to top`}),onClick:e=>Q(e,`#biolink-page-top`),className:A(`biolink-btn-custom fixed end-4 bottom-4 z-40 grid size-12 place-items-center rounded-full border shadow-lg transition-[opacity,transform,box-shadow] duration-200 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-current motion-reduce:transition-none`,f?`pointer-events-auto translate-y-0 opacity-100`:`pointer-events-none translate-y-3 opacity-0`),style:U({btnConfig:e?.btnConfig}),children:[(0,J.jsx)(l,{className:`size-5`}),(0,J.jsx)(`span`,{className:`sr-only`,children:(0,J.jsx)(O,{message:`Back to top`})})]}):null]})}function On({appearance:e,biolink:t,config:n,links:r,socialConfig:a}){let o=n.preset??`compact`,s={brand:!0,navigation:!0,socials:!0,cta:!0,backToTop:!0,...n.blocks},c=r.filter(e=>e.variant!==`cta`),l=r.find(e=>e.variant===`cta`),u=e?.headerConfig,d=u?.title||t.name,f=n.brandSource??`auto`,p=B(u?.logo),m=B(u?.image),h=W(`avatar`,[t.id,t.back_half,t.name]),g=f===`logo`?p:f===`avatar`?m||h:p||m||h,_=g===p&&!!p;return(0,J.jsxs)(`div`,{className:A(`biolink-owner-footer border-t border-current/15 py-7 text-sm`,o===`compact`&&`grid gap-7 text-center @2xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] @2xl:text-left`,o===`community`&&`grid gap-8 text-left @2xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]`,o===`commercial`&&`grid gap-8 text-left @2xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)_minmax(0,0.9fr)]`),children:[s.brand?(0,J.jsxs)(`div`,{className:A(`flex min-w-0 flex-col gap-3`,o===`compact`&&`items-center @2xl:items-start`),children:[g?(0,J.jsx)(`img`,{src:g,alt:``,className:A(`object-contain`,_?`max-h-12 max-w-44`:`size-16 rounded-full object-cover`)}):(0,J.jsx)(`span`,{className:`flex size-14 items-center justify-center rounded-full border border-current/20 bg-current/5 text-lg font-semibold`,children:d.slice(0,1).toUpperCase()}),(0,J.jsxs)(`div`,{className:`min-w-0`,children:[(0,J.jsx)(`p`,{className:`font-semibold wrap-break-word text-current`,children:d}),u?.bio?(0,J.jsx)(`p`,{className:`mt-1 max-w-64 text-sm leading-5 text-current/70`,children:u.bio}):null]})]}):null,s.navigation&&c.length?(0,J.jsxs)(`nav`,{"aria-label":N(`Page sections`).message,children:[(0,J.jsx)(`p`,{className:`mb-3 font-semibold text-current`,children:(0,J.jsx)(O,{message:`Explore`})}),(0,J.jsx)(`ul`,{className:A(`grid gap-x-5 gap-y-1`,o===`commercial`&&`@2xl:grid-cols-1`,o!==`commercial`&&`@2xl:grid-cols-2`),children:c.map(e=>(0,J.jsx)(`li`,{children:(0,J.jsxs)(`a`,{href:e.url,onClick:t=>Q(t,e.url),className:`flex min-h-11 items-center justify-between gap-3 rounded-lg px-2 transition-colors duration-200 hover:bg-current/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current`,children:[(0,J.jsx)(`span`,{children:e.label}),(0,J.jsx)(i,{className:`size-4 shrink-0 opacity-60`})]})},e.id))})]}):null,s.socials||s.cta&&l?(0,J.jsxs)(`div`,{className:A(`flex min-w-0 flex-col gap-4`,o===`compact`&&`@2xl:col-start-1 @2xl:row-start-2 @2xl:items-start`),children:[s.socials&&a?(0,J.jsxs)(`div`,{children:[(0,J.jsx)(`p`,{className:`mb-3 font-semibold text-current`,children:(0,J.jsx)(O,{message:`Social networks`})}),(0,J.jsx)(yt,{config:{...a.links??{},style:a.style,colorMode:a.colorMode},appearance:e,variant:`desktopHeader`,className:`w-full`})]}):null,s.cta&&l?(0,J.jsxs)(`a`,{href:l.url,onClick:e=>Q(e,l.url),className:`biolink-btn-custom inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2 font-semibold focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-current`,target:l.url.startsWith(`http`)?`_blank`:void 0,rel:l.url.startsWith(`http`)?`noreferrer`:void 0,children:[l.label,(0,J.jsx)(i,{className:`size-4`})]}):null]}):null]})}function kn({links:e}){return e.length?(0,J.jsx)(`nav`,{className:`mb-3 flex max-w-lg flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-center text-xs leading-5`,"aria-label":N(`Footer links`).message,children:e.map(e=>(0,J.jsx)(`a`,{href:e.url,onClick:t=>Q(t,e.url),className:`rounded-sm transition-colors hover:text-current focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-current`,target:e.url.startsWith(`http`)?`_blank`:void 0,rel:e.url.startsWith(`http`)?`noreferrer`:void 0,children:e.label},e.id))}):null}function An({appearance:e,showPlatformLinks:t,compact:n}){let{branding:r}=D(),{trans:i}=k(),[a,o]=(0,q.useState)(!1),s=t?[{label:`FAQ`,url:`/pages/faq`},{label:`Cookies`,url:`/pages/cookies`},{label:`Privacy`,url:`/pages/privacy-policy`},{label:`Terms`,url:`/pages/terms-of-service`},{label:`Contact`,url:`/contact`}]:[];return(0,J.jsxs)(`div`,{className:A(`biolink-platform-footer flex flex-col items-center gap-3 text-center text-xs text-current/70`,n&&`border-t border-current/15 pt-5`),children:[e?.hideBranding?null:(0,J.jsx)(M,{to:`/`,className:`biolink-public-footer-brand inline-flex min-h-11 items-center justify-center rounded-full bg-white px-5 py-2 text-black shadow-[0_3px_6px_rgb(0_0_0_/_0.18)] transition-transform duration-200 ease-out hover:-translate-y-px focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-current`,children:r.logo_dark&&!a?(0,J.jsx)(`img`,{className:`h-5 w-auto max-w-40 object-contain`,src:r.logo_dark,alt:i(N(`:site logo`,{values:{site:r.site_name}})),onError:()=>o(!0)}):(0,J.jsx)(`span`,{className:`font-semibold`,children:r.site_name})}),s.length?(0,J.jsx)(`nav`,{className:`flex max-w-lg flex-wrap items-center justify-center gap-x-3 gap-y-1.5 leading-5`,"aria-label":N(`Platform links`).message,children:s.map(e=>(0,J.jsx)(`a`,{href:e.url,className:`rounded-sm transition-colors hover:text-current focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-current`,children:(0,J.jsx)(O,{message:e.label})},e.url))}):null]})}function jn(e,t,n=``){return e.filter(e=>e.active!==!1).sort((e,t)=>(e.position??0)-(t.position??0)).flatMap((e,r)=>{if((e.source??`url`)===`widget`){let r=t.find(t=>t.model_type===`biolinkWidget`&&t.id===e.widgetId&&tn(t)),i=r?.model_type===`biolinkWidget`?r.config:null,a=i?.section,o=e.label?.trim()||(typeof a?.anchorLabel==`string`?a.anchorLabel.trim():``)||(typeof i?.title==`string`?i.title.trim():``);return!r||!o?[]:[{id:e.id??`widget-${r.id}`,label:o,url:`#biolink-widget-${r.id}${n}`,variant:e.variant??`link`}]}let i=e.label?.trim(),a=e.url?.trim();return!i||!a?[]:[{id:e.id??`url-${r}`,label:i,url:a,variant:e.variant??`link`}]})}function Q(e,t){if(!t.startsWith(`#`))return;let n=decodeURIComponent(t.slice(1)),r=document.getElementById(n);r&&(e.preventDefault(),window.history.pushState(null,``,t),r.scrollIntoView({behavior:window.matchMedia(`(prefers-reduced-motion: reduce)`).matches?`auto`:`smooth`,block:`start`}))}function Mn({appearance:e}){let t=e?.desktopConfig,n=B(t?.decorativeAsset);if(!n)return null;let r=t?.decorativePlacement??`right`;return(0,J.jsx)(`img`,{"aria-hidden":!0,src:n,className:A(`pointer-events-none absolute z-4 hidden max-h-[74vh] max-w-[38vw] object-contain opacity-80 @2xl:block`,r===`left`&&`top-1/2 left-10 -translate-y-1/2`,r===`right`&&`top-1/2 right-10 -translate-y-1/2`,r===`background`&&`right-1/2 bottom-6 translate-x-1/2 opacity-20`),draggable:!1})}function Nn({appearance:e}){let t=e?.effectsConfig,n={...z,...t},r=n.effectColor??`#ffffff`,i=n.effectSecondaryColor??`#6ee7b7`,a=n.effectTertiaryColor??`#3b82f6`,o=xe(t),s=o?`biolink-${o}-effect`:void 0;return!o||o===`none`?null:(0,J.jsx)(`div`,{"aria-hidden":!0,className:A(`biolink-effects-layer pointer-events-none absolute inset-0 z-4 overflow-hidden`,s),style:{"--biolink-effect-color":r,"--biolink-effect-secondary":i,"--biolink-effect-tertiary":a}})}var Pn=[`stars`,`particles`,`snow`,`rain`,`ambient`,`big-circles`,`bubbles`,`confetti`,`confetti-cannon`,`confetti-explosions`,`confetti-falling`,`confetti-parade`,`party`,`fire`,`firefly`,`fireworks`,`fountain`,`hyperspace`,`links`,`matrix`,`meteors`,`ribbons`,`sea-anemone`,`squares`,`triangles`];function Fn(e){return!!e&&Pn.includes(e)}function In(e,t){let n={...z,...t.effectsConfig},r=[n.effectColor??`#ffffff`,n.effectSecondaryColor??`#6ee7b7`,n.effectTertiaryColor??`#3b82f6`],i=e===`snow`,a=e===`rain`,o=e===`fire`,s=e===`links`,c=Math.max(10,Math.min(220,n.particleDensity??70)),l=Math.max(0,Math.min(10,n.particleSpeed??1));return{fullScreen:{enable:!1},detectRetina:!0,fpsLimit:60,particles:{number:{value:c,density:{enable:!0,width:1600,height:900}},color:{value:r},opacity:{value:a?.5:.7,random:{enable:!0,minimumValue:.25}},size:{value:a?{min:1,max:2}:{min:1,max:i?5:4},random:!0},shape:{type:a?`line`:e===`triangles`?`triangle`:e===`squares`?`square`:`circle`},links:{enable:s,distance:150,opacity:.35,width:1,color:r[0]},move:{enable:!0,direction:i||a?`bottom`:o?`top`:`none`,speed:(a?12:i?1.5:o?2.5:1.2)*l,straight:a,outModes:{default:`out`}}},interactivity:{detectsOn:`window`,events:{resize:!0}}}}function Ln({appearance:e}){let t=be(e?.effectsConfig),n=`biolink-particles-${(0,q.useId)().replace(/:/g,``)}`,r=e?.effectsConfig?.respectReducedMotion!==!1&&typeof window<`u`&&window.matchMedia(`(prefers-reduced-motion: reduce)`).matches;return(0,q.useEffect)(()=>{if(!t||t===`none`||!Fn(t)||r)return;let i=!1,a;return(async()=>{try{let r=await j(()=>import(`./browser-B0-gCI_h.js`).then(e=>e.t),__vite__mapDeps([1,2,3]),import.meta.url),o=r.tsParticles||r.engine?.tsParticles;if(!o)return;let s=!1;try{switch(t){case`ambient`:s=await(await j(async()=>{let{loadAmbientPreset:e}=await import(`./browser-Bpi9SKu6.js`);return{loadAmbientPreset:e}},__vite__mapDeps([4,5,3,6,1,2]),import.meta.url)).loadAmbientPreset(o).then(()=>!0);break;case`big-circles`:s=await(await j(async()=>{let{loadBigCirclesPreset:e}=await import(`./browser-DziJFQdt.js`);return{loadBigCirclesPreset:e}},__vite__mapDeps([7,5,3,6,1,2]),import.meta.url)).loadBigCirclesPreset(o).then(()=>!0);break;case`bubbles`:s=await(await j(async()=>{let{loadBubblesPreset:e}=await import(`./browser-CilFyJRx.js`);return{loadBubblesPreset:e}},__vite__mapDeps([8,5,3,6,1,2,9]),import.meta.url)).loadBubblesPreset(o).then(()=>!0);break;case`confetti`:s=await(await j(async()=>{let{loadConfettiPreset:e}=await import(`./browser-JpStxgo-.js`);return{loadConfettiPreset:e}},__vite__mapDeps([10,5,3,6,1,2,11,9,12,13,14,15,16]),import.meta.url)).loadConfettiPreset(o).then(()=>!0);break;case`confetti-cannon`:s=await(await j(async()=>{let{loadConfettiCannonPreset:e}=await import(`./browser-5ZGVZuI0.js`);return{loadConfettiCannonPreset:e}},__vite__mapDeps([17,5,3,6,1,2,11,18,12,13,14,15,16]),import.meta.url)).loadConfettiCannonPreset(o).then(()=>!0);break;case`confetti-explosions`:s=await(await j(async()=>{let{loadConfettiExplosionsPreset:e}=await import(`./browser-v0mmw2og.js`);return{loadConfettiExplosionsPreset:e}},__vite__mapDeps([19,5,3,6,1,2,11,9,12,13,15,16]),import.meta.url)).loadConfettiExplosionsPreset(o).then(()=>!0);break;case`confetti-falling`:s=await(await j(async()=>{let{loadConfettiFallingPreset:e}=await import(`./browser-h6qnmf--.js`);return{loadConfettiFallingPreset:e}},__vite__mapDeps([20,5,3,6,1,2,11,12,13,15,16]),import.meta.url)).loadConfettiFallingPreset(o).then(()=>!0);break;case`confetti-parade`:s=await(await j(async()=>{let{loadConfettiParadePreset:e}=await import(`./browser-BVMa1l4J.js`);return{loadConfettiParadePreset:e}},__vite__mapDeps([21,5,3,6,1,2,11,9,12,13,14,15,16]),import.meta.url)).loadConfettiParadePreset(o).then(()=>!0);break;case`fire`:s=await(await j(async()=>{let{loadFirePreset:e}=await import(`./browser-BW8mClpT2.js`);return{loadFirePreset:e}},__vite__mapDeps([22,5,3,6,1,2,23,18]),import.meta.url)).loadFirePreset(o).then(()=>!0);break;case`firefly`:s=await(await j(async()=>{let{loadFireflyPreset:e}=await import(`./browser-DljgwFoQ.js`);return{loadFireflyPreset:e}},__vite__mapDeps([24,5,3,6,1,2,18,14]),import.meta.url)).loadFireflyPreset(o).then(()=>!0);break;case`fireworks`:s=await(await j(async()=>{let{loadFireworksPreset:e}=await import(`./browser-CP_DXT6h.js`);return{loadFireworksPreset:e}},__vite__mapDeps([25,3,5,6,1,2,26,27,9,28,29,30,14,15]),import.meta.url)).loadFireworksPreset(o).then(()=>!0);break;case`fountain`:s=await(await j(async()=>{let{loadFountainPreset:e}=await import(`./browser-CInEuLO4.js`);return{loadFountainPreset:e}},__vite__mapDeps([31,5,3,6,1,2,9,32,30]),import.meta.url)).loadFountainPreset(o).then(()=>!0);break;case`hyperspace`:s=await(await j(async()=>{let{loadHyperspacePreset:e}=await import(`./browser-DsRF789p2.js`);return{loadHyperspacePreset:e}},__vite__mapDeps([33,5,3,6,1,2,27,9,32,14]),import.meta.url)).loadHyperspacePreset(o).then(()=>!0);break;case`links`:s=await(await j(async()=>{let{loadLinksPreset:e}=await import(`./browser-CCGoRhI52.js`);return{loadLinksPreset:e}},__vite__mapDeps([34,5,3,6,1,2,35,18]),import.meta.url)).loadLinksPreset(o).then(()=>!0);break;case`matrix`:s=await(await j(async()=>{let{loadMatrixPreset:e}=await import(`./browser-B8hTdOPS2.js`);return{loadMatrixPreset:e}},__vite__mapDeps([36,3,5,6,1,2,32]),import.meta.url)).loadMatrixPreset(o).then(()=>!0);break;case`meteors`:s=await(await j(async()=>{let{loadMeteorsPreset:e}=await import(`./browser-BlthMkts2.js`);return{loadMeteorsPreset:e}},__vite__mapDeps([37,5,3,6,1,2,26,27,9]),import.meta.url)).loadMeteorsPreset(o).then(()=>!0);break;case`party`:s=await(await j(async()=>{let{loadPartyPreset:e}=await import(`./browser-CobSOMPS2.js`);return{loadPartyPreset:e}},__vite__mapDeps([38,5,3,6,1,2,11,27,9,39,13,15,16]),import.meta.url)).loadPartyPreset(o).then(()=>!0);break;case`sea-anemone`:s=await(await j(async()=>{let{loadSeaAnemonePreset:e}=await import(`./browser-BCiOnI5I2.js`);return{loadSeaAnemonePreset:e}},__vite__mapDeps([40,5,3,6,1,2,9,32]),import.meta.url)).loadSeaAnemonePreset(o).then(()=>!0);break;case`snow`:s=await(await j(async()=>{let{loadSnowPreset:e}=await import(`./browser-BK3m4XW62.js`);return{loadSnowPreset:e}},__vite__mapDeps([41,5,3,6,1,2,16]),import.meta.url)).loadSnowPreset(o).then(()=>!0);break;case`squares`:s=await(await j(async()=>{let{loadSquaresPreset:e}=await import(`./browser-bKJfy2Nh2.js`);return{loadSquaresPreset:e}},__vite__mapDeps([42,6,1,2,3,9,13,15]),import.meta.url)).loadSquaresPreset(o).then(()=>!0);break;case`stars`:s=await(await j(async()=>{let{loadStarsPreset:e}=await import(`./browser-Dx68QgRa2.js`);return{loadStarsPreset:e}},__vite__mapDeps([43,5,3,6,1,2]),import.meta.url)).loadStarsPreset(o).then(()=>!0);break;case`triangles`:s=await(await j(async()=>{let{loadTrianglesPreset:e}=await import(`./browser-DgRe2nlr2.js`);return{loadTrianglesPreset:e}},__vite__mapDeps([44,5,3,6,1,2,35,18]),import.meta.url)).loadTrianglesPreset(o).then(()=>!0);break}}catch{s=!1}if(i)return;let c;if(s?c={preset:t,fullScreen:{enable:!1},background:{color:`transparent`}}:(await(await j(()=>import(`./browser-r2I4mYNh2.js`),__vite__mapDeps([45,3,6,1,2,5,23,18,35,29,39,13,14,15]),import.meta.url)).loadSlim(o),c=In(t,e)),i)return;let l=await o.load({id:n,options:c});if(i){l?.destroy();return}a=l}catch{}})(),()=>{i=!0,a?.destroy()}},[n,t,e,r]),!Fn(t)||r?null:(0,J.jsx)(`div`,{id:n,"aria-hidden":!0,className:`pointer-events-none absolute inset-0 z-4`})}function Rn({appearance:e,isPreview:t=!1}){let n={...R,...e?.mediaConfig},r=B(n.audio),i={...R.audioPrompt,...n.audioPrompt};typeof i.text==`string`&&i.text.split(``).some(e=>e.charCodeAt(0)===195)&&(i.text=void 0);let a=i.enabled!==!1,o=e?.effectsConfig?.showVolumeControl!==!1,s=i.text?.trim()&&!i.text.includes(`mÃ`)?i.text:N(`Click to activate music`).message,l=i.textColor??e?.bgConfig?.color??`currentColor`,u=i.fontConfig?.family??e?.fontConfig?.family,d=(0,q.useRef)(null),[f,p]=(0,q.useState)(!1),[m,h]=(0,q.useState)(!1),[_,v]=(0,q.useState)(t);if(!r||!a&&!o)return null;let b=async()=>{let e=d.current;if(e){if(f){e.pause(),p(!1);return}h(!1);try{await e.play(),p(!0),v(!0)}catch{p(!1),h(!0)}}},x=a&&!t&&!_&&!f,S=!f&&(a||m);return(0,J.jsxs)(J.Fragment,{children:[(0,J.jsx)(`audio`,{ref:d,src:r,loop:!0,preload:`metadata`,onError:()=>{p(!1),h(!0)}}),x?(0,J.jsx)(`div`,{className:`fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm`,role:`dialog`,"aria-modal":`true`,children:(0,J.jsxs)(`button`,{type:`button`,className:`group flex min-h-full w-full cursor-pointer items-center justify-center gap-3 px-6 text-center text-base font-medium transition-opacity outline-none hover:opacity-80 focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-inset`,style:{color:l,fontFamily:u},"aria-label":m?N(`Audio could not be played`).message:s,onClick:()=>{b()},children:[m?(0,J.jsx)(y,{className:`size-5`}):(0,J.jsx)(c,{className:`size-5`}),(0,J.jsx)(`span`,{children:m?(0,J.jsx)(O,{message:`Audio could not be played`}):s})]})}):null,o&&!x?(0,J.jsx)(`div`,{className:`fixed top-4 left-1/2 z-40 -translate-x-1/2 @2xl:absolute @2xl:top-6`,children:(0,J.jsxs)(`button`,{type:`button`,className:A(`inline-flex max-w-[min(22rem,calc(100vw-2rem))] items-center justify-center gap-2 rounded-full border px-4 py-2 text-sm font-medium shadow-sm backdrop-blur transition-colors`,S?`min-h-9`:`size-9 px-0`),style:{color:l,borderColor:$(l,.35),backgroundColor:$(l,.12),fontFamily:u},"aria-label":f?N(`Pause audio`).message:s,onClick:()=>{b()},children:[(0,J.jsx)(`span`,{className:`sr-only`,children:f?(0,J.jsx)(O,{message:`Pause audio`}):(0,J.jsx)(O,{message:`Play audio`})}),f?(0,J.jsx)(g,{className:`size-4`}):(0,J.jsx)(y,{className:`size-4`}),S?(0,J.jsx)(`span`,{className:`truncate`,children:m?(0,J.jsx)(O,{message:`Audio could not be played`}):s}):null]})}):null]})}function zn({appearance:e,className:t}){let n=Te(e?.bgConfig?.tint),r=Zt(e?.bgConfig?.imageEffect,e?.bgConfig?.noise);return(0,J.jsxs)(`div`,{className:A(`biolink-background-layer pointer-events-none absolute inset-0 overflow-hidden`,t),children:[(0,J.jsx)(`div`,{className:`absolute inset-0 mx-auto`,style:{...Ee(e?.bgConfig),...r}}),(0,J.jsx)(Bn,{appearance:e}),(0,J.jsx)(Qt,{effect:e?.bgConfig?.imageEffect}),n&&(0,J.jsx)(`div`,{className:`absolute inset-0 mx-auto`,style:n}),e?.bgConfig?.noise&&(0,J.jsx)($t,{})]})}function Bn({appearance:e}){let t={...R,...e?.mediaConfig},n=B(t.backgroundMedia);return n?t.backgroundMediaType===`image`?(0,J.jsx)(`div`,{"aria-hidden":!0,className:`absolute inset-0 bg-cover bg-center bg-no-repeat`,style:{backgroundImage:`url("${Kn(n)}")`}}):(0,J.jsx)(`video`,{className:`absolute inset-0 size-full object-cover`,src:n,muted:!0,loop:!0,playsInline:!0,autoPlay:!0}):null}function Vn({appearance:e}){let t=B(e?.mediaConfig?.cursor);return(0,J.jsx)(`style`,{children:`
        .biolink-widget-surface > .biolink-widget-box,
        .biolink-widget-surface .biolink-widget-box,
        .biolink-widget-surface > .biolink-password-widget,
        .biolink-widget-surface .biolink-password-widget {
          margin-bottom: 0 !important;
          padding: 0 !important;
          border: 0 !important;
          border-radius: 0 !important;
          background: transparent !important;
          box-shadow: none !important;
          backdrop-filter: none !important;
        }
        .biolink-layout-container .biolink-content-group > div > .biolink-widget-box,
        .biolink-layout-container .biolink-content-group > div > .biolink-password-widget,
        .biolink-layout-container .biolink-content-group > div > .biolink-btn-custom {
          margin-bottom: 0 !important;
        }
        .biolink-layout-container .biolink-btn-custom,
        .biolink-layout-container .biolink-public-action,
        .biolink-layout-container .biolink-product-card,
        .biolink-layout-container .biolink-gallery-item,
        .biolink-layout-container .biolink-widget-box {
          transform-origin: center;
          transition-property: background-color, border-color, box-shadow, color, opacity, transform;
          transition-duration: 180ms;
          transition-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
          will-change: transform;
        }
        .biolink-layout-container .biolink-btn-custom {
          background: var(--biolink-theme-button-background);
          border-color: var(--biolink-theme-button-border);
          color: var(--biolink-theme-button-color);
        }
        .biolink-layout-container .biolink-surface-item:not(.biolink-btn-custom):not(.biolink-public-action) {
          border-color: var(--biolink-surface-item-border) !important;
          background: var(--biolink-surface-item-background) !important;
          box-shadow: 0 2px 4px rgb(0 0 0 / 0.14);
          transition-property: background-color, border-color, box-shadow, color, opacity, transform;
          transition-duration: 180ms;
          transition-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
        }
        @media (hover: hover) and (pointer: fine) {
          .biolink-layout-container .biolink-btn-custom:hover,
          .biolink-layout-container .biolink-public-action:hover,
          .biolink-layout-container .biolink-product-card:hover,
          .biolink-layout-container .biolink-gallery-item:hover {
            transform: scale(1.015);
          }
          .biolink-layout-container .biolink-surface-item:not(.biolink-btn-custom):not(.biolink-public-action):hover {
            background: var(--biolink-surface-item-hover-background) !important;
          }
        }
        .biolink-layout-container .biolink-btn-custom:active,
        .biolink-layout-container .biolink-public-action:active,
        .biolink-layout-container .biolink-product-card:active,
        .biolink-layout-container .biolink-gallery-item:active {
          transform: scale(0.995);
        }
        .biolink-interaction-quiet .biolink-btn-custom:hover,
        .biolink-interaction-quiet .biolink-public-action:hover,
        .biolink-interaction-quiet .biolink-product-card:hover,
        .biolink-interaction-quiet .biolink-gallery-item:hover,
        .biolink-interaction-quiet .biolink-surface-item:hover {
          box-shadow: none !important;
          transform: none !important;
        }
        .biolink-interaction-press .biolink-btn-custom:hover,
        .biolink-interaction-press .biolink-public-action:hover,
        .biolink-interaction-press .biolink-product-card:hover,
        .biolink-interaction-press .biolink-gallery-item:hover,
        .biolink-interaction-press .biolink-surface-item:hover {
          transform: none !important;
        }
        .biolink-interaction-press .biolink-btn-custom:active,
        .biolink-interaction-press .biolink-public-action:active,
        .biolink-interaction-press .biolink-product-card:active,
        .biolink-interaction-press .biolink-gallery-item:active,
        .biolink-interaction-press .biolink-surface-item:active {
          transform: translateY(2px) scale(0.995) !important;
        }
        .biolink-profile-title {
          will-change: transform, filter;
        }
        .biolink-badge-icon-only::after {
          position: absolute;
          z-index: 20;
          top: calc(100% + 0.45rem);
          left: 50%;
          max-width: 16rem;
          padding: 0.35rem 0.55rem;
          border-radius: 0.4rem;
          background: rgb(0 0 0 / 0.88);
          color: #fff;
          content: attr(data-tooltip);
          font-size: 0.7rem;
          font-weight: 500;
          line-height: 1.3;
          opacity: 0;
          pointer-events: none;
          transform: translate(-50%, -0.25rem);
          transition: opacity 120ms ease, transform 120ms ease;
          white-space: normal;
          width: max-content;
        }
        .biolink-badge-icon-only:hover::after,
        .biolink-badge-icon-only:focus-visible::after {
          opacity: 1;
          transform: translate(-50%, 0);
        }
        .biolink-username-effect-glow .biolink-profile-title-text,
        .biolink-glow-username .biolink-profile-title-text {
          text-shadow: 0 0 12px var(--biolink-effect-color, currentColor), 0 0 28px var(--biolink-effect-color, currentColor);
          filter: drop-shadow(0 0 10px var(--biolink-effect-color, currentColor));
        }
        .biolink-username-effect-pulse .biolink-profile-title-text {
          animation: biolink-title-pulse 2.4s ease-in-out infinite;
        }
        .biolink-username-effect-scanline .biolink-profile-title-text {
          position: relative;
        }
        .biolink-username-effect-scanline .biolink-profile-title-text::after {
          content: '';
          position: absolute;
          right: 4%;
          bottom: -0.24rem;
          left: 4%;
          height: 2px;
          border-radius: 999px;
          background: linear-gradient(90deg, transparent, var(--biolink-effect-color, currentColor), transparent);
          box-shadow: 0 0 12px var(--biolink-effect-color, currentColor);
          opacity: 0.9;
        }
        .biolink-username-effect-rainbow .biolink-profile-title-text {
          color: transparent !important;
          background-image: linear-gradient(100deg, var(--biolink-effect-color), var(--biolink-effect-secondary), var(--biolink-effect-tertiary), var(--biolink-effect-color));
          background-size: 300% 100%;
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: biolink-title-rainbow 5s linear infinite;
        }
        .biolink-username-effect-sparkle .biolink-profile-title-text {
          position: relative;
          isolation: isolate;
          text-shadow: 0 0 8px var(--biolink-effect-color), 0 0 18px var(--biolink-effect-secondary);
        }
        .biolink-username-effect-sparkle .biolink-profile-title-text::before,
        .biolink-username-effect-sparkle .biolink-profile-title-text::after {
          content: '';
          position: absolute;
          inset: -0.7rem -0.9rem;
          pointer-events: none;
          background-repeat: no-repeat;
          mix-blend-mode: screen;
          opacity: 0.2;
          animation: biolink-title-sparkle 2.8s ease-in-out infinite alternate;
        }
        .biolink-username-effect-sparkle .biolink-profile-title-text::before {
          background-image:
            radial-gradient(circle at 8% 35%, var(--biolink-effect-color) 0 1.5px, transparent 2.5px),
            radial-gradient(circle at 24% 82%, var(--biolink-effect-secondary) 0 1px, transparent 2px),
            radial-gradient(circle at 52% 12%, var(--biolink-effect-tertiary) 0 1.5px, transparent 2.5px),
            radial-gradient(circle at 76% 68%, var(--biolink-effect-color) 0 1px, transparent 2px),
            radial-gradient(circle at 94% 30%, var(--biolink-effect-secondary) 0 1.5px, transparent 2.5px);
        }
        .biolink-username-effect-sparkle .biolink-profile-title-text::after {
          background-image:
            radial-gradient(circle at 16% 70%, var(--biolink-effect-tertiary) 0 1px, transparent 2px),
            radial-gradient(circle at 38% 28%, var(--biolink-effect-color) 0 1.5px, transparent 2.5px),
            radial-gradient(circle at 68% 88%, var(--biolink-effect-secondary) 0 1px, transparent 2px),
            radial-gradient(circle at 86% 16%, var(--biolink-effect-tertiary) 0 1.5px, transparent 2.5px);
          animation-delay: -1.3s;
        }
        .biolink-username-effect-glitch .biolink-profile-title-text {
          text-shadow: 1px 0 var(--biolink-effect-secondary), -1px 0 var(--biolink-effect-tertiary);
          animation: biolink-title-glitch 3.8s steps(1, end) infinite;
        }
        .biolink-username-effect-shimmer .biolink-profile-title-text {
          color: transparent !important;
          background-image: linear-gradient(105deg, var(--biolink-effect-color) 0%, var(--biolink-effect-color) 38%, #ffffff 50%, var(--biolink-effect-color) 62%, var(--biolink-effect-color) 100%);
          background-size: 240% 100%;
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: biolink-title-shimmer 3.2s ease-in-out infinite;
        }
        .biolink-animated-title .biolink-profile-title-text {
          animation: biolink-title-float 3.2s ease-in-out infinite;
        }
        .biolink-glow-socials .biolink-top-group a,
        .biolink-glow-socials .biolink-top-group button {
          filter: drop-shadow(0 0 var(--biolink-glow-blur, 10px) color-mix(in srgb, var(--biolink-glow-color, currentColor) calc(var(--biolink-glow-opacity, 0.24) * 100%), transparent));
        }
        .biolink-glow-badges .biolink-badge {
          filter: drop-shadow(0 0 var(--biolink-glow-blur, 10px) color-mix(in srgb, var(--biolink-glow-color, currentColor) calc(var(--biolink-glow-opacity, 0.24) * 100%), transparent));
        }
        .biolink-glow-avatar .biolink-profile-avatar {
          filter: drop-shadow(0 0 var(--biolink-glow-blur, 18px) color-mix(in srgb, var(--biolink-glow-color, currentColor) calc(var(--biolink-glow-opacity, 0.24) * 100%), transparent));
        }
        .biolink-glow-widgets .biolink-widget-surface,
        .biolink-glow-products .biolink-product-card,
        .biolink-product-card-glow {
          box-shadow:
            0 0 0 var(--biolink-glow-spread, 0px) color-mix(in srgb, var(--biolink-glow-color, currentColor) calc(var(--biolink-glow-opacity, 0.24) * 100%), transparent),
            0 0 var(--biolink-glow-blur, 18px) color-mix(in srgb, var(--biolink-glow-color, currentColor) calc(var(--biolink-glow-opacity, 0.24) * 100%), transparent);
        }
        .biolink-glow-buttons .biolink-btn-custom {
          box-shadow:
            0 0 0 var(--biolink-glow-spread, 0px) color-mix(in srgb, var(--biolink-glow-color, currentColor) calc(var(--biolink-glow-opacity, 0.24) * 100%), transparent),
            0 0 var(--biolink-glow-blur, 18px) color-mix(in srgb, var(--biolink-glow-color, currentColor) calc(var(--biolink-glow-opacity, 0.24) * 100%), transparent);
        }
        .biolink-glow-inputs input,
        .biolink-glow-inputs textarea,
        .biolink-glow-inputs select {
          box-shadow: 0 0 var(--biolink-glow-blur, 18px) color-mix(in srgb, var(--biolink-glow-color, currentColor) calc(var(--biolink-glow-opacity, 0.24) * 100%), transparent);
        }
        .biolink-glow-hover-only .biolink-profile-avatar,
        .biolink-glow-hover-only .biolink-widget-surface,
        .biolink-glow-hover-only .biolink-product-card,
        .biolink-glow-hover-only .biolink-btn-custom,
        .biolink-glow-hover-only .biolink-badge {
          filter: none;
          box-shadow: none;
        }
        .biolink-glow-hover-only .biolink-profile-avatar:hover,
        .biolink-glow-hover-only .biolink-widget-surface:hover,
        .biolink-glow-hover-only .biolink-product-card:hover,
        .biolink-glow-hover-only .biolink-btn-custom:hover,
        .biolink-glow-hover-only .biolink-badge:hover {
          filter: drop-shadow(0 0 var(--biolink-glow-blur, 18px) color-mix(in srgb, var(--biolink-glow-color, currentColor) calc(var(--biolink-glow-opacity, 0.24) * 100%), transparent));
          box-shadow: 0 0 0 var(--biolink-glow-spread, 0px) color-mix(in srgb, var(--biolink-glow-color, currentColor) calc(var(--biolink-glow-opacity, 0.24) * 100%), transparent), 0 0 var(--biolink-glow-blur, 18px) color-mix(in srgb, var(--biolink-glow-color, currentColor) calc(var(--biolink-glow-opacity, 0.24) * 100%), transparent);
        }
        .biolink-monochrome-social-icons .biolink-top-group a svg,
        .biolink-monochrome-social-icons .biolink-top-group button svg {
          color: currentColor !important;
          fill: currentColor !important;
          stroke: currentColor !important;
        }
        .biolink-invert-boxes .biolink-btn-custom {
          filter: invert(1);
        }
        .biolink-background-blur .biolink-background-layer > * {
          filter: blur(11px) saturate(112%);
          transform: scale(1.045);
        }
        .biolink-background-night .biolink-background-layer::after {
          content: '';
          position: absolute;
          inset: 0;
          z-index: 2;
          background: rgb(0 0 0 / 0.58);
        }
        .biolink-effects-layer::before,
        .biolink-effects-layer::after {
          content: '';
          position: absolute;
          inset: -18%;
          pointer-events: none;
          will-change: transform, opacity, background-position;
        }
        .biolink-stars-effect::before {
          background-image:
            radial-gradient(circle, var(--biolink-effect-color, #fff) 0 1px, transparent 1.2px),
            radial-gradient(circle, rgb(255 255 255 / 0.58) 0 1.4px, transparent 1.6px);
          background-position: 0 0, 38px 64px;
          background-size: 92px 92px, 180px 180px;
          opacity: 0.6;
          animation: biolink-stars-drift 28s linear infinite;
        }
        .biolink-stars-effect::after {
          background-image:
            radial-gradient(circle, var(--biolink-effect-color, #fff) 0 1px, transparent 1.2px),
            radial-gradient(circle, rgb(255 255 255 / 0.42) 0 1px, transparent 1.2px);
          background-position: 16px 28px, 72px 4px;
          background-size: 140px 140px, 220px 220px;
          opacity: 0.36;
          animation: biolink-stars-twinkle 3.8s ease-in-out infinite alternate;
        }
        .biolink-particles-effect::before {
          background-image:
            radial-gradient(circle at 12% 24%, var(--biolink-effect-color, #fff) 0 3px, transparent 4px),
            radial-gradient(circle at 42% 72%, var(--biolink-effect-color, #fff) 0 2px, transparent 3px),
            radial-gradient(circle at 78% 38%, rgb(255 255 255 / 0.8) 0 3px, transparent 4px),
            radial-gradient(circle at 88% 82%, var(--biolink-effect-color, #fff) 0 2px, transparent 3px);
          background-size: 100% 100%;
          filter: drop-shadow(0 0 8px var(--biolink-effect-color, #fff));
          opacity: 0.58;
          animation: biolink-particles-float 18s ease-in-out infinite alternate;
        }
        .biolink-particles-effect::after {
          background-image:
            radial-gradient(circle at 24% 44%, var(--biolink-effect-color, #fff), transparent 16%),
            radial-gradient(circle at 76% 68%, rgb(255 255 255 / 0.56), transparent 14%);
          filter: blur(22px) saturate(120%);
          opacity: 0.3;
          animation: biolink-particles-glow 11s ease-in-out infinite alternate;
        }
        .biolink-aurora-effect::before {
          background:
            conic-gradient(
              from 150deg at 50% 50%,
              transparent 0deg,
              var(--biolink-effect-color, #fff) 70deg,
              var(--biolink-effect-secondary, #6ee7b7) 155deg,
              var(--biolink-effect-tertiary, #3b82f6) 240deg,
              transparent 320deg
            );
          filter: blur(42px) saturate(135%);
          opacity: 0.42;
          transform: scale(1.12) rotate(-8deg);
          animation: biolink-aurora-flow 15s ease-in-out infinite alternate;
        }
        .biolink-aurora-effect::after {
          background-image:
            radial-gradient(ellipse at 18% 20%, var(--biolink-effect-color, #fff), transparent 34%),
            radial-gradient(ellipse at 82% 28%, var(--biolink-effect-secondary, #6ee7b7), transparent 34%),
            radial-gradient(ellipse at 50% 92%, var(--biolink-effect-tertiary, #3b82f6), transparent 34%);
          filter: blur(30px);
          opacity: 0.4;
          animation: biolink-aurora-drift 18s ease-in-out infinite alternate;
        }
        .biolink-spotlight-effect::before {
          inset: 0;
          background:
            radial-gradient(circle at 50% 28%, var(--biolink-effect-color, #fff), transparent 28%),
            radial-gradient(circle at 50% 115%, rgb(0 0 0 / 0.22), transparent 48%);
          opacity: 0.48;
          animation: biolink-spotlight-sweep 10s ease-in-out infinite alternate;
        }
        .biolink-spotlight-effect::after {
          inset: 0;
          background: radial-gradient(circle at 50% 28%, rgb(255 255 255 / 0.5), transparent 24%);
          opacity: 0.42;
          animation: biolink-spotlight-pulse 5.6s ease-in-out infinite;
        }
        .biolink-snow-effect::before {
          background-image:
            radial-gradient(circle, var(--biolink-effect-color, #fff) 0 2px, transparent 2.8px),
            radial-gradient(circle, rgb(255 255 255 / 0.88) 0 1.4px, transparent 2px),
            radial-gradient(circle, rgb(255 255 255 / 0.7) 0 3px, transparent 4px);
          background-position: 0 -12px, 28px -36px, 70px -22px;
          background-size: 82px 92px, 124px 132px, 178px 190px;
          opacity: 0.82;
          animation: biolink-snow-fall 13s linear infinite;
        }
        .biolink-snow-effect::after {
          background-image:
            radial-gradient(circle, rgb(255 255 255 / 0.9) 0 4px, transparent 5px),
            radial-gradient(circle, var(--biolink-effect-color, #fff) 0 2px, transparent 3px);
          background-position: 18px -80px, 90px -40px;
          background-size: 240px 250px, 164px 180px;
          opacity: 0.5;
          animation: biolink-snow-fall 20s linear infinite reverse;
        }
        .biolink-rain-effect::before {
          background-image: linear-gradient(108deg, transparent 0 45%, var(--biolink-effect-color, #fff) 46% 48%, transparent 49%);
          background-size: 34px 74px;
          opacity: 0.44;
          transform: rotate(4deg) scale(1.2);
          animation: biolink-rain-fall 0.9s linear infinite;
        }
        .biolink-rain-effect::after {
          background-image: linear-gradient(108deg, transparent 0 47%, rgb(255 255 255 / 0.7) 48% 49%, transparent 50%);
          background-size: 68px 112px;
          opacity: 0.3;
          transform: rotate(4deg) scale(1.2);
          animation: biolink-rain-fall 1.4s linear infinite reverse;
        }
        .biolink-tv-effect::before {
          background-image:
            radial-gradient(circle at 20% 30%, var(--biolink-effect-color, #fff) 0 1px, transparent 1.5px),
            radial-gradient(circle at 74% 64%, rgb(255 255 255 / 0.7) 0 1px, transparent 1.5px),
            linear-gradient(90deg, transparent 0 48%, rgb(255 255 255 / 0.22) 50%, transparent 52%);
          background-size: 8px 8px, 11px 11px, 17px 100%;
          mix-blend-mode: screen;
          filter: contrast(180%);
          opacity: 0.22;
          animation: biolink-tv-noise 0.22s steps(5) infinite;
        }
        .biolink-tv-effect::after {
          background-image: linear-gradient(to bottom, transparent 0 3px, rgb(255 255 255 / 0.15) 4px, transparent 5px 7px);
          background-size: 100% 8px;
          mix-blend-mode: screen;
          opacity: 0.34;
          animation: biolink-tv-scan 4.5s linear infinite;
        }
        .biolink-blur-effect::before {
          inset: 0;
          background: rgb(255 255 255 / 0.04);
          backdrop-filter: blur(10px) saturate(115%);
          opacity: 0.72;
          animation: biolink-blur-breathe 8s ease-in-out infinite alternate;
        }
        .biolink-night-effect::before {
          inset: 0;
          background: radial-gradient(circle at 50% 30%, transparent 0 22%, rgb(0 0 0 / 0.18) 72%, rgb(0 0 0 / 0.58) 100%);
          opacity: 0.92;
          animation: biolink-night-breathe 7s ease-in-out infinite alternate;
        }
        .biolink-ambient-effect::before {
          background:
            radial-gradient(circle at 20% 20%, var(--biolink-effect-color, #fff), transparent 24%),
            radial-gradient(circle at 80% 75%, var(--biolink-effect-secondary, #6ee7b7), transparent 28%);
          filter: blur(26px);
          opacity: 0.28;
          animation: biolink-ambient-drift 16s ease-in-out infinite alternate;
        }
        .biolink-ambient-effect::after {
          background: radial-gradient(circle at 50% 50%, var(--biolink-effect-tertiary, #3b82f6), transparent 40%);
          filter: blur(34px);
          opacity: 0.2;
          animation: biolink-ambient-drift 22s ease-in-out infinite alternate-reverse;
        }
        .biolink-big-circles-effect::before,
        .biolink-bubbles-effect::before {
          background-image:
            radial-gradient(circle at 18% 22%, var(--biolink-effect-color, #fff) 0 34px, transparent 36px),
            radial-gradient(circle at 78% 72%, var(--biolink-effect-secondary, #6ee7b7) 0 58px, transparent 60px),
            radial-gradient(circle at 58% 12%, var(--biolink-effect-tertiary, #3b82f6) 0 24px, transparent 26px);
          filter: blur(2px);
          opacity: 0.28;
          animation: biolink-circles-drift 18s ease-in-out infinite alternate;
        }
        .biolink-bubbles-effect::after {
          background-image:
            radial-gradient(circle at 32% 80%, transparent 0 9px, var(--biolink-effect-color, #fff) 10px 11px, transparent 12px),
            radial-gradient(circle at 66% 92%, transparent 0 16px, var(--biolink-effect-secondary, #6ee7b7) 17px 18px, transparent 19px),
            radial-gradient(circle at 84% 66%, transparent 0 6px, var(--biolink-effect-tertiary, #3b82f6) 7px 8px, transparent 9px);
          opacity: 0.56;
          animation: biolink-bubbles-rise 12s ease-in-out infinite;
        }
        .biolink-confetti-effect::before,
        .biolink-confetti-falling-effect::before,
        .biolink-confetti-parade-effect::before {
          background-image:
            linear-gradient(35deg, var(--biolink-effect-color, #fff) 0 7px, transparent 7px 16px),
            linear-gradient(115deg, var(--biolink-effect-secondary, #6ee7b7) 0 6px, transparent 6px 15px),
            linear-gradient(175deg, var(--biolink-effect-tertiary, #3b82f6) 0 8px, transparent 8px 20px),
            linear-gradient(75deg, #fbbf24 0 7px, transparent 7px 18px);
          background-size: 78px 110px, 120px 160px, 95px 140px, 150px 180px;
          opacity: 0.7;
          animation: biolink-confetti-fall 8s linear infinite;
        }
        .biolink-confetti-cannon-effect::before,
        .biolink-confetti-explosions-effect::before,
        .biolink-party-effect::before {
          background-image:
            radial-gradient(circle at 20% 80%, var(--biolink-effect-color, #fff) 0 5px, transparent 6px),
            radial-gradient(circle at 50% 45%, var(--biolink-effect-secondary, #6ee7b7) 0 4px, transparent 5px),
            radial-gradient(circle at 82% 78%, var(--biolink-effect-tertiary, #3b82f6) 0 6px, transparent 7px),
            radial-gradient(circle at 56% 86%, #fbbf24 0 4px, transparent 5px);
          opacity: 0.72;
          animation: biolink-confetti-burst 3.6s ease-in-out infinite;
        }
        .biolink-fire-effect::before {
          background:
            radial-gradient(ellipse at 30% 92%, #ef4444, transparent 26%),
            radial-gradient(ellipse at 65% 90%, #f97316, transparent 28%),
            radial-gradient(ellipse at 52% 74%, #facc15, transparent 22%);
          filter: blur(18px) saturate(140%);
          opacity: 0.48;
          animation: biolink-fire-flicker 1.6s ease-in-out infinite alternate;
        }
        .biolink-firefly-effect::before {
          background-image:
            radial-gradient(circle at 18% 24%, #fef08a 0 3px, transparent 5px),
            radial-gradient(circle at 42% 68%, var(--biolink-effect-color, #fff) 0 2px, transparent 4px),
            radial-gradient(circle at 76% 32%, #fef08a 0 3px, transparent 5px),
            radial-gradient(circle at 84% 80%, var(--biolink-effect-secondary, #6ee7b7) 0 2px, transparent 4px);
          filter: drop-shadow(0 0 8px #fef08a);
          opacity: 0.76;
          animation: biolink-firefly-drift 9s ease-in-out infinite alternate;
        }
        .biolink-fireworks-effect::before,
        .biolink-fountain-effect::before {
          background-image:
            radial-gradient(circle at 24% 34%, var(--biolink-effect-color, #fff) 0 3px, transparent 5px),
            radial-gradient(circle at 72% 28%, var(--biolink-effect-secondary, #6ee7b7) 0 3px, transparent 5px),
            radial-gradient(circle at 48% 58%, var(--biolink-effect-tertiary, #3b82f6) 0 3px, transparent 5px);
          filter: drop-shadow(0 0 8px var(--biolink-effect-color, #fff));
          opacity: 0.72;
          animation: biolink-fireworks-bloom 4s ease-in-out infinite;
        }
        .biolink-hyperspace-effect::before,
        .biolink-meteors-effect::before {
          background-image: linear-gradient(115deg, transparent 0 46%, var(--biolink-effect-color, #fff) 48%, transparent 51%);
          background-size: 72px 72px;
          filter: blur(1px);
          opacity: 0.48;
          transform: scale(1.4) rotate(-7deg);
          animation: biolink-meteors-fly 2.5s linear infinite;
        }
        .biolink-links-effect::before {
          background-image:
            linear-gradient(28deg, transparent 0 48%, var(--biolink-effect-color, #fff) 49% 50%, transparent 51%),
            linear-gradient(142deg, transparent 0 48%, var(--biolink-effect-secondary, #6ee7b7) 49% 50%, transparent 51%);
          background-size: 140px 110px, 180px 150px;
          opacity: 0.34;
          animation: biolink-links-shift 10s linear infinite;
        }
        .biolink-matrix-effect::before {
          background-image: linear-gradient(to bottom, transparent 0 48%, var(--biolink-effect-color, #fff) 49% 50%, transparent 51%);
          background-size: 24px 42px;
          opacity: 0.44;
          mix-blend-mode: screen;
          animation: biolink-matrix-fall 2.4s linear infinite;
        }
        .biolink-ribbons-effect::before {
          background: conic-gradient(from 10deg at 40% 50%, transparent, var(--biolink-effect-color, #fff), transparent 28%, var(--biolink-effect-secondary, #6ee7b7), transparent 56%, var(--biolink-effect-tertiary, #3b82f6), transparent);
          filter: blur(12px);
          opacity: 0.4;
          animation: biolink-ribbons-flow 12s ease-in-out infinite alternate;
        }
        .biolink-sea-anemone-effect::before {
          background: radial-gradient(ellipse at 50% 100%, var(--biolink-effect-color, #fff), transparent 42%);
          filter: blur(14px);
          opacity: 0.36;
          animation: biolink-anemone-sway 5s ease-in-out infinite alternate;
        }
        .biolink-squares-effect::before {
          background-image: linear-gradient(45deg, var(--biolink-effect-color, #fff) 0 10px, transparent 10px 34px);
          background-size: 76px 76px;
          opacity: 0.34;
          animation: biolink-squares-drift 12s linear infinite;
        }
        .biolink-triangles-effect::before {
          background-image: linear-gradient(135deg, var(--biolink-effect-color, #fff) 0 12px, transparent 12px 32px);
          background-size: 80px 80px;
          opacity: 0.32;
          animation: biolink-triangles-drift 10s linear infinite reverse;
        }
        @keyframes biolink-title-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.68; }
        }
        @keyframes biolink-title-rainbow {
          from { background-position: 0% 50%; }
          to { background-position: 300% 50%; }
        }
        @keyframes biolink-title-sparkle {
          from { transform: scale(0.94) rotate(-2deg); opacity: 0.2; }
          to { transform: scale(1.06) rotate(2deg); opacity: 0.9; }
        }
        @keyframes biolink-title-glitch {
          0%, 88%, 100% { transform: translateX(0); }
          89% { transform: translateX(-1px); }
          90% { transform: translateX(1px); }
          91% { transform: translateX(0); }
          94% { transform: translateX(1px); }
          95% { transform: translateX(-1px); }
        }
        @keyframes biolink-title-shimmer {
          from { background-position: 140% 50%; }
          to { background-position: -80% 50%; }
        }
        @keyframes biolink-title-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        @keyframes biolink-stars-drift {
          from { transform: translate3d(0, 0, 0); }
          to { transform: translate3d(-7%, 8%, 0); }
        }
        @keyframes biolink-stars-twinkle {
          from { transform: scale(0.98); opacity: 0.24; }
          to { transform: scale(1.04); opacity: 0.6; }
        }
        @keyframes biolink-particles-float {
          from { transform: translate3d(-3%, 2%, 0) scale(0.98); }
          to { transform: translate3d(4%, -5%, 0) scale(1.04); }
        }
        @keyframes biolink-particles-glow {
          from { transform: translate3d(-4%, 4%, 0) scale(0.92); opacity: 0.18; }
          to { transform: translate3d(5%, -5%, 0) scale(1.12); opacity: 0.42; }
        }
        @keyframes biolink-aurora-flow {
          from { transform: scale(1.12) rotate(-8deg) translate3d(-3%, 2%, 0); }
          to { transform: scale(1.24) rotate(9deg) translate3d(4%, -4%, 0); }
        }
        @keyframes biolink-aurora-drift {
          from { transform: translate3d(-4%, 3%, 0) scale(0.96); }
          to { transform: translate3d(5%, -3%, 0) scale(1.08); }
        }
        @keyframes biolink-spotlight-sweep {
          from { transform: translate3d(-4%, 0, 0) scale(0.98); }
          to { transform: translate3d(4%, 2%, 0) scale(1.04); }
        }
        @keyframes biolink-spotlight-pulse {
          0%, 100% { transform: scale(0.94); opacity: 0.24; }
          50% { transform: scale(1.08); opacity: 0.56; }
        }
        @keyframes biolink-snow-fall {
          from { background-position: 0 -18px, 28px -36px, 70px -22px; transform: translate3d(0, -2%, 0); }
          to { background-position: 54px 112px, -22px 156px, 92px 218px; transform: translate3d(3%, 8%, 0); }
        }
        @keyframes biolink-rain-fall {
          from { background-position: 0 -80px; }
          to { background-position: -20px 80px; }
        }
        @keyframes biolink-tv-noise {
          0% { background-position: 0 0, 0 0, 0 0; transform: translateX(0); }
          25% { background-position: 7px -4px, -4px 6px, 9px 0; transform: translateX(1%); }
          50% { background-position: -5px 8px, 6px -5px, -12px 0; transform: translateX(-1%); }
          75% { background-position: 4px 3px, -8px -7px, 5px 0; transform: translateX(0.5%); }
          100% { background-position: -8px -5px, 5px 8px, -8px 0; transform: translateX(0); }
        }
        @keyframes biolink-tv-scan {
          from { background-position: 0 -100%; }
          to { background-position: 0 100%; }
        }
        @keyframes biolink-blur-breathe {
          from { opacity: 0.52; }
          to { opacity: 0.82; }
        }
        @keyframes biolink-night-breathe {
          from { opacity: 0.78; }
          to { opacity: 1; }
        }
        @keyframes biolink-ambient-drift {
          from { transform: translate3d(-5%, 3%, 0) scale(0.96); }
          to { transform: translate3d(5%, -4%, 0) scale(1.08); }
        }
        @keyframes biolink-circles-drift {
          from { transform: translate3d(-4%, 3%, 0) scale(0.92); }
          to { transform: translate3d(4%, -5%, 0) scale(1.08); }
        }
        @keyframes biolink-bubbles-rise {
          from { transform: translate3d(-2%, 12%, 0) scale(0.94); }
          to { transform: translate3d(4%, -18%, 0) scale(1.06); }
        }
        @keyframes biolink-confetti-fall {
          from { background-position: 0 -120px, 40px -140px, -20px -180px, 60px -160px; transform: rotate(-2deg); }
          to { background-position: 60px 120px, -30px 160px, 40px 190px, -70px 180px; transform: rotate(3deg); }
        }
        @keyframes biolink-confetti-burst {
          0%, 100% { transform: scale(0.86) translate3d(-2%, 3%, 0); opacity: 0.28; }
          50% { transform: scale(1.18) translate3d(3%, -5%, 0); opacity: 0.76; }
        }
        @keyframes biolink-fire-flicker {
          from { transform: translate3d(-3%, 2%, 0) scale(0.92); opacity: 0.3; }
          to { transform: translate3d(4%, -5%, 0) scale(1.1); opacity: 0.62; }
        }
        @keyframes biolink-firefly-drift {
          from { transform: translate3d(-5%, 4%, 0); opacity: 0.3; }
          to { transform: translate3d(5%, -5%, 0); opacity: 0.82; }
        }
        @keyframes biolink-fireworks-bloom {
          0%, 100% { transform: scale(0.72); opacity: 0.2; }
          50% { transform: scale(1.2); opacity: 0.78; }
        }
        @keyframes biolink-meteors-fly {
          from { background-position: 40px -90px; transform: scale(1.4) rotate(-7deg); }
          to { background-position: -60px 160px; transform: scale(1.65) rotate(-7deg); }
        }
        @keyframes biolink-links-shift {
          from { background-position: 0 0, 40px 22px; }
          to { background-position: 140px 110px, -140px -110px; }
        }
        @keyframes biolink-matrix-fall {
          from { background-position: 0 -40px; }
          to { background-position: 0 80px; }
        }
        @keyframes biolink-ribbons-flow {
          from { transform: translate3d(-5%, 2%, 0) rotate(-8deg) scale(1); }
          to { transform: translate3d(6%, -4%, 0) rotate(10deg) scale(1.16); }
        }
        @keyframes biolink-anemone-sway {
          from { transform: skewX(-5deg) scaleY(0.94); }
          to { transform: skewX(6deg) scaleY(1.08); }
        }
        @keyframes biolink-squares-drift {
          from { background-position: 0 0; transform: rotate(-2deg); }
          to { background-position: 76px 76px; transform: rotate(4deg); }
        }
        @keyframes biolink-triangles-drift {
          from { background-position: 0 0; transform: translate3d(-3%, 2%, 0); }
          to { background-position: 80px -80px; transform: translate3d(4%, -3%, 0); }
        }
        @media (pointer: fine) {
          ${t?`.biolink-layout-container { cursor: url("${Kn(t)}"), auto; }`:``}
          .biolink-layout-container a,
          .biolink-layout-container button {
            cursor: pointer;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .biolink-effects-layer::before,
          .biolink-effects-layer::after,
          .biolink-username-effect-pulse .biolink-profile-title-text,
          .biolink-animated-title .biolink-profile-title-text,
          .biolink-username-effect-rainbow .biolink-profile-title-text,
          .biolink-username-effect-sparkle .biolink-profile-title-text::before,
          .biolink-username-effect-sparkle .biolink-profile-title-text::after,
          .biolink-username-effect-glitch .biolink-profile-title-text,
          .biolink-username-effect-shimmer .biolink-profile-title-text {
            animation: none !important;
          }
          .biolink-layout-container .biolink-btn-custom,
          .biolink-layout-container .biolink-public-action,
          .biolink-layout-container .biolink-product-card,
          .biolink-layout-container .biolink-gallery-item,
          .biolink-layout-container .biolink-widget-box,
          .biolink-layout-container .biolink-public-footer-brand {
            transition-duration: 1ms !important;
            transform: none !important;
          }
          .biolink-username-effect-sparkle .biolink-profile-title-text::before,
          .biolink-username-effect-sparkle .biolink-profile-title-text::after {
            opacity: 0.65;
          }
        }
        @media (max-width: 767px) {
          .biolink-glow-reduce-mobile {
            --biolink-glow-opacity: min(var(--biolink-glow-opacity, 0.24), 0.18);
            --biolink-glow-blur: min(var(--biolink-glow-blur, 18px), 14px);
          }
        }
      `})}function Hn(e){let t=e?.glow,n=!!(e?.glowUsername||e?.glowSocials||e?.glowBadges),r=t?.preset??`soft`,i={none:{opacity:0,blur:0,spread:0},soft:{opacity:.18,blur:14,spread:0},medium:{opacity:.32,blur:24,spread:1},strong:{opacity:.48,blur:34,spread:2},custom:{opacity:.24,blur:18,spread:1}},a=i[r]??i.soft,o=t?.source??`primary`,s={primary:e?.effectColor??`#ffffff`,secondary:e?.effectSecondaryColor??`#6ee7b7`,tertiary:e?.effectTertiaryColor??`#3b82f6`,block:e?.effectColor??`#ffffff`,custom:t?.customColor??e?.effectColor??`#ffffff`};return{enabled:t?.enabled??n,color:s[o],opacity:t?.opacity??a.opacity,blur:t?.blur??a.blur,spread:t?.spread??a.spread,username:t?.username??e?.glowUsername??!0,avatar:t?.avatar??!0,widgets:t?.widgets??!1,products:t?.products??!1,buttons:t?.buttons??!1,badges:t?.badges??e?.glowBadges??!0,socialIcons:t?.socialIcons??e?.glowSocials??!0,inputs:t?.inputs??!1,hoverOnly:t?.hoverOnly??!1,reduceOnMobile:t?.reduceOnMobile??!0}}function Un(e){let t=e?.effectsConfig,n=[],r=xe(t),i=Hn(t);return r===`blur`&&n.push(`biolink-background-blur`),r===`night`&&n.push(`biolink-background-night`),t?.usernameEffect&&t.usernameEffect!==`none`&&n.push(`biolink-username-effect-${t.usernameEffect}`),t?.glowUsername&&n.push(`biolink-glow-username`),t?.glowSocials&&n.push(`biolink-glow-socials`),t?.glowBadges&&n.push(`biolink-glow-badges`),i.enabled&&(i.username&&n.push(`biolink-glow-username`),i.avatar&&n.push(`biolink-glow-avatar`),i.widgets&&n.push(`biolink-glow-widgets`),i.products&&n.push(`biolink-glow-products`),i.buttons&&n.push(`biolink-glow-buttons`),i.badges&&n.push(`biolink-glow-badges`),i.socialIcons&&n.push(`biolink-glow-socials`),i.inputs&&n.push(`biolink-glow-inputs`),i.hoverOnly&&n.push(`biolink-glow-hover-only`),i.reduceOnMobile&&n.push(`biolink-glow-reduce-mobile`)),t?.monochromeSocialIcons&&n.push(`biolink-monochrome-social-icons`),t?.invertBoxes&&n.push(`biolink-invert-boxes`),t?.animatedTitle&&n.push(`biolink-animated-title`),t?.interactionStyle&&n.push(`biolink-interaction-${t.interactionStyle}`),n.join(` `)}function Wn(e){let t={...z,...e?.effectsConfig},n=Hn(e?.effectsConfig);return{"--biolink-effect-color":t.effectColor??`#ffffff`,"--biolink-effect-secondary":t.effectSecondaryColor??`#6ee7b7`,"--biolink-effect-tertiary":t.effectTertiaryColor??`#3b82f6`,"--biolink-glow-color":n.color,"--biolink-glow-opacity":n.opacity,"--biolink-glow-blur":`${n.blur}px`,"--biolink-glow-spread":`${n.spread}px`}}function Gn(e){let t=e?.effectsConfig?.effectColor;return t?{"--biolink-effect-color":t}:void 0}function $(e,t){if(!e.startsWith(`#`))return e;let n=e.slice(1),r=n.length===3?n.split(``).map(e=>`${e}${e}`).join(``):n.slice(0,6);return r.length===6?`rgb(${parseInt(r.slice(0,2),16)} ${parseInt(r.slice(2,4),16)} ${parseInt(r.slice(4,6),16)} / ${t})`:e}function Kn(e){return e.replace(/\\/g,`\\\\`).replace(/"/g,`\\"`)}export{Bt as n,en as t};
//# sourceMappingURL=biolink-layout-BXsxbfUR.js.map