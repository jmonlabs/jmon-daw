(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))o(r);new MutationObserver(r=>{for(const s of r)if(s.type==="childList")for(const a of s.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&o(a)}).observe(document,{childList:!0,subtree:!0});function n(r){const s={};return r.integrity&&(s.integrity=r.integrity),r.referrerPolicy&&(s.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?s.credentials="include":r.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function o(r){if(r.ep)return;r.ep=!0;const s=n(r);fetch(r.href,s)}})();const so=!1,ao=(t,e)=>t===e,he=Symbol("solid-proxy"),At=Symbol("solid-track"),nt={equals:ao};let wn=kn;const pe=1,ot=2,xn={owned:null,cleanups:null,context:null,owner:null};var R=null;let $t=null,lo=null,B=null,V=null,ce=null,ht=0;function Ze(t,e){const n=B,o=R,r=t.length===0,s=e===void 0?o:e,a=r?xn:{owned:null,cleanups:null,context:s?s.context:null,owner:s},i=r?t:()=>t(()=>se(()=>je(a)));R=a,B=null;try{return Pe(i,!0)}finally{B=n,R=o}}function D(t,e){e=e?Object.assign({},nt,e):nt;const n={value:t,observers:null,observerSlots:null,comparator:e.equals||void 0},o=r=>(typeof r=="function"&&(r=r(n.value)),Sn(n,r));return[$n.bind(n),o]}function F(t,e,n){const o=Ut(t,e,!1,pe);qe(o)}function co(t,e,n){wn=yo;const o=Ut(t,e,!1,pe);o.user=!0,ce?ce.push(o):qe(o)}function fe(t,e,n){n=n?Object.assign({},nt,n):nt;const o=Ut(t,e,!0,0);return o.observers=null,o.observerSlots=null,o.comparator=n.equals||void 0,qe(o),$n.bind(o)}function uo(t){return Pe(t,!1)}function se(t){if(B===null)return t();const e=B;B=null;try{return t()}finally{B=e}}function Ee(t){co(()=>se(t))}function Rt(t){return R===null||(R.cleanups===null?R.cleanups=[t]:R.cleanups.push(t)),t}function Et(){return B}function fo(){return R}function po(t,e){const n=Symbol("context");return{id:n,Provider:wo(n),defaultValue:t}}function mo(t){let e;return R&&R.context&&(e=R.context[t.id])!==void 0?e:t.defaultValue}function ho(t){const e=fe(t),n=fe(()=>Pt(e()));return n.toArray=()=>{const o=n();return Array.isArray(o)?o:o!=null?[o]:[]},n}function $n(){if(this.sources&&this.state)if(this.state===pe)qe(this);else{const t=V;V=null,Pe(()=>it(this),!1),V=t}if(B){const t=this.observers?this.observers.length:0;B.sources?(B.sources.push(this),B.sourceSlots.push(t)):(B.sources=[this],B.sourceSlots=[t]),this.observers?(this.observers.push(B),this.observerSlots.push(B.sources.length-1)):(this.observers=[B],this.observerSlots=[B.sources.length-1])}return this.value}function Sn(t,e,n){let o=t.value;return(!t.comparator||!t.comparator(o,e))&&(t.value=e,t.observers&&t.observers.length&&Pe(()=>{for(let r=0;r<t.observers.length;r+=1){const s=t.observers[r],a=$t&&$t.running;a&&$t.disposed.has(s),(a?!s.tState:!s.state)&&(s.pure?V.push(s):ce.push(s),s.observers&&Tn(s)),a||(s.state=pe)}if(V.length>1e6)throw V=[],new Error},!1)),e}function qe(t){if(!t.fn)return;je(t);const e=ht;go(t,t.value,e)}function go(t,e,n){let o;const r=R,s=B;B=R=t;try{o=t.fn(e)}catch(a){return t.pure&&(t.state=pe,t.owned&&t.owned.forEach(je),t.owned=null),t.updatedAt=n+1,Cn(a)}finally{B=s,R=r}(!t.updatedAt||t.updatedAt<=n)&&(t.updatedAt!=null&&"observers"in t?Sn(t,o):t.value=o,t.updatedAt=n)}function Ut(t,e,n,o=pe,r){const s={fn:t,state:o,updatedAt:null,owned:null,sources:null,sourceSlots:null,cleanups:null,value:e,owner:R,context:R?R.context:null,pure:n};return R===null||R!==xn&&(R.owned?R.owned.push(s):R.owned=[s]),s}function rt(t){if(t.state===0)return;if(t.state===ot)return it(t);if(t.suspense&&se(t.suspense.inFallback))return t.suspense.effects.push(t);const e=[t];for(;(t=t.owner)&&(!t.updatedAt||t.updatedAt<ht);)t.state&&e.push(t);for(let n=e.length-1;n>=0;n--)if(t=e[n],t.state===pe)qe(t);else if(t.state===ot){const o=V;V=null,Pe(()=>it(t,e[0]),!1),V=o}}function Pe(t,e){if(V)return t();let n=!1;e||(V=[]),ce?n=!0:ce=[],ht++;try{const o=t();return bo(n),o}catch(o){n||(ce=null),V=null,Cn(o)}}function bo(t){if(V&&(kn(V),V=null),t)return;const e=ce;ce=null,e.length&&Pe(()=>wn(e),!1)}function kn(t){for(let e=0;e<t.length;e++)rt(t[e])}function yo(t){let e,n=0;for(e=0;e<t.length;e++){const o=t[e];o.user?t[n++]=o:rt(o)}for(e=0;e<n;e++)rt(t[e])}function it(t,e){t.state=0;for(let n=0;n<t.sources.length;n+=1){const o=t.sources[n];if(o.sources){const r=o.state;r===pe?o!==e&&(!o.updatedAt||o.updatedAt<ht)&&rt(o):r===ot&&it(o,e)}}}function Tn(t){for(let e=0;e<t.observers.length;e+=1){const n=t.observers[e];n.state||(n.state=ot,n.pure?V.push(n):ce.push(n),n.observers&&Tn(n))}}function je(t){let e;if(t.sources)for(;t.sources.length;){const n=t.sources.pop(),o=t.sourceSlots.pop(),r=n.observers;if(r&&r.length){const s=r.pop(),a=n.observerSlots.pop();o<r.length&&(s.sourceSlots[a]=o,r[o]=s,n.observerSlots[o]=a)}}if(t.tOwned){for(e=t.tOwned.length-1;e>=0;e--)je(t.tOwned[e]);delete t.tOwned}if(t.owned){for(e=t.owned.length-1;e>=0;e--)je(t.owned[e]);t.owned=null}if(t.cleanups){for(e=t.cleanups.length-1;e>=0;e--)t.cleanups[e]();t.cleanups=null}t.state=0}function vo(t){return t instanceof Error?t:new Error(typeof t=="string"?t:"Unknown error",{cause:t})}function Cn(t,e=R){throw vo(t)}function Pt(t){if(typeof t=="function"&&!t.length)return Pt(t());if(Array.isArray(t)){const e=[];for(let n=0;n<t.length;n++){const o=Pt(t[n]);Array.isArray(o)?e.push.apply(e,o):e.push(o)}return e}return t}function wo(t,e){return function(o){let r;return F(()=>r=se(()=>(R.context={...R.context,[t]:o.value},ho(()=>o.children))),void 0),r}}const xo=Symbol("fallback");function Wt(t){for(let e=0;e<t.length;e++)t[e]()}function $o(t,e,n={}){let o=[],r=[],s=[],a=0,i=e.length>1?[]:null;return Rt(()=>Wt(s)),()=>{let l=t()||[],d=l.length,u,c;return l[At],se(()=>{let p,m,x,$,U,v,S,T,L;if(d===0)a!==0&&(Wt(s),s=[],o=[],r=[],a=0,i&&(i=[])),n.fallback&&(o=[xo],r[0]=Ze(k=>(s[0]=k,n.fallback())),a=1);else if(a===0){for(r=new Array(d),c=0;c<d;c++)o[c]=l[c],r[c]=Ze(f);a=d}else{for(x=new Array(d),$=new Array(d),i&&(U=new Array(d)),v=0,S=Math.min(a,d);v<S&&o[v]===l[v];v++);for(S=a-1,T=d-1;S>=v&&T>=v&&o[S]===l[T];S--,T--)x[T]=r[S],$[T]=s[S],i&&(U[T]=i[S]);for(p=new Map,m=new Array(T+1),c=T;c>=v;c--)L=l[c],u=p.get(L),m[c]=u===void 0?-1:u,p.set(L,c);for(u=v;u<=S;u++)L=o[u],c=p.get(L),c!==void 0&&c!==-1?(x[c]=r[u],$[c]=s[u],i&&(U[c]=i[u]),c=m[c],p.set(L,c)):s[u]();for(c=v;c<d;c++)c in x?(r[c]=x[c],s[c]=$[c],i&&(i[c]=U[c],i[c](c))):r[c]=Ze(f);r=r.slice(0,a=d),o=l.slice(0)}return r});function f(p){if(s[c]=p,i){const[m,x]=D(c);return i[c]=x,e(l[c],m)}return e(l[c])}}}function y(t,e){return se(()=>t(e||{}))}const So=t=>`Stale read from <${t}>.`;function ze(t){const e="fallback"in t&&{fallback:()=>t.fallback};return fe($o(()=>t.each,t.children,e||void 0))}function re(t){const e=t.keyed,n=fe(()=>t.when,void 0,void 0),o=e?n:fe(n,void 0,{equals:(r,s)=>!r==!s});return fe(()=>{const r=o();if(r){const s=t.children;return typeof s=="function"&&s.length>0?se(()=>s(e?r:()=>{if(!se(o))throw So("Show");return n()})):s}return t.fallback},void 0,void 0)}const st=t=>fe(()=>t());function ko(t,e,n){let o=n.length,r=e.length,s=o,a=0,i=0,l=e[r-1].nextSibling,d=null;for(;a<r||i<s;){if(e[a]===n[i]){a++,i++;continue}for(;e[r-1]===n[s-1];)r--,s--;if(r===a){const u=s<o?i?n[i-1].nextSibling:n[s-i]:l;for(;i<s;)t.insertBefore(n[i++],u)}else if(s===i)for(;a<r;)(!d||!d.has(e[a]))&&e[a].remove(),a++;else if(e[a]===n[s-1]&&n[i]===e[r-1]){const u=e[--r].nextSibling;t.insertBefore(n[i++],e[a++].nextSibling),t.insertBefore(n[--s],u),e[r]=n[s]}else{if(!d){d=new Map;let c=i;for(;c<s;)d.set(n[c],c++)}const u=d.get(e[a]);if(u!=null)if(i<u&&u<s){let c=a,f=1,p;for(;++c<r&&c<s&&!((p=d.get(e[c]))==null||p!==u+f);)f++;if(f>u-i){const m=e[a];for(;i<u;)t.insertBefore(n[i++],m)}else t.replaceChild(n[i++],e[a++])}else a++;else e[a++].remove()}}}const Qt="_$DX_DELEGATE";function To(t,e,n,o={}){let r;return Ze(s=>{r=s,e===document?t():h(e,t(),e.firstChild?null:void 0,n)},o.owner),()=>{r(),e.textContent=""}}function _(t,e,n,o){let r;const s=()=>{const i=o?document.createElementNS("http://www.w3.org/1998/Math/MathML","template"):document.createElement("template");return i.innerHTML=t,n?i.content.firstChild.firstChild:o?i.firstChild:i.content.firstChild},a=e?()=>se(()=>document.importNode(r||(r=s()),!0)):()=>(r||(r=s())).cloneNode(!0);return a.cloneNode=a,a}function Ie(t,e=window.document){const n=e[Qt]||(e[Qt]=new Set);for(let o=0,r=t.length;o<r;o++){const s=t[o];n.has(s)||(n.add(s),e.addEventListener(s,Co))}}function ge(t,e,n){n==null?t.removeAttribute(e):t.setAttribute(e,n)}function te(t,e){e==null?t.removeAttribute("class"):t.className=e}function _e(t,e,n,o){Array.isArray(n)?(t[`$$${e}`]=n[0],t[`$$${e}Data`]=n[1]):t[`$$${e}`]=n}function G(t,e,n){if(!e)return n?ge(t,"style"):e;const o=t.style;if(typeof e=="string")return o.cssText=e;typeof n=="string"&&(o.cssText=n=void 0),n||(n={}),e||(e={});let r,s;for(s in n)e[s]==null&&o.removeProperty(s),delete n[s];for(s in e)r=e[s],r!==n[s]&&(o.setProperty(s,r),n[s]=r);return n}function Ge(t,e,n){return se(()=>t(e,n))}function h(t,e,n,o){if(n!==void 0&&!o&&(o=[]),typeof e!="function")return at(t,e,o,n);F(r=>at(t,e(),r,n),o)}function Co(t){let e=t.target;const n=`$$${t.type}`,o=t.target,r=t.currentTarget,s=l=>Object.defineProperty(t,"target",{configurable:!0,value:l}),a=()=>{const l=e[n];if(l&&!e.disabled){const d=e[`${n}Data`];if(d!==void 0?l.call(e,d,t):l.call(e,t),t.cancelBubble)return}return e.host&&typeof e.host!="string"&&!e.host._$host&&e.contains(t.target)&&s(e.host),!0},i=()=>{for(;a()&&(e=e._$host||e.parentNode||e.host););};if(Object.defineProperty(t,"currentTarget",{configurable:!0,get(){return e||document}}),t.composedPath){const l=t.composedPath();s(l[0]);for(let d=0;d<l.length-2&&(e=l[d],!!a());d++){if(e._$host){e=e._$host,i();break}if(e.parentNode===r)break}}else i();s(o)}function at(t,e,n,o,r){for(;typeof n=="function";)n=n();if(e===n)return n;const s=typeof e,a=o!==void 0;if(t=a&&n[0]&&n[0].parentNode||t,s==="string"||s==="number"){if(s==="number"&&(e=e.toString(),e===n))return n;if(a){let i=n[0];i&&i.nodeType===3?i.data!==e&&(i.data=e):i=document.createTextNode(e),n=Te(t,n,o,i)}else n!==""&&typeof n=="string"?n=t.firstChild.data=e:n=t.textContent=e}else if(e==null||s==="boolean")n=Te(t,n,o);else{if(s==="function")return F(()=>{let i=e();for(;typeof i=="function";)i=i();n=at(t,i,n,o)}),()=>n;if(Array.isArray(e)){const i=[],l=n&&Array.isArray(n);if(It(i,e,n,r))return F(()=>n=at(t,i,n,o,!0)),()=>n;if(i.length===0){if(n=Te(t,n,o),a)return n}else l?n.length===0?Kt(t,i,o):ko(t,n,i):(n&&Te(t),Kt(t,i));n=i}else if(e.nodeType){if(Array.isArray(n)){if(a)return n=Te(t,n,o,e);Te(t,n,null,e)}else n==null||n===""||!t.firstChild?t.appendChild(e):t.replaceChild(e,t.firstChild);n=e}}return n}function It(t,e,n,o){let r=!1;for(let s=0,a=e.length;s<a;s++){let i=e[s],l=n&&n[t.length],d;if(!(i==null||i===!0||i===!1))if((d=typeof i)=="object"&&i.nodeType)t.push(i);else if(Array.isArray(i))r=It(t,i,l)||r;else if(d==="function")if(o){for(;typeof i=="function";)i=i();r=It(t,Array.isArray(i)?i:[i],Array.isArray(l)?l:[l])||r}else t.push(i),r=!0;else{const u=String(i);l&&l.nodeType===3&&l.data===u?t.push(l):t.push(document.createTextNode(u))}}return r}function Kt(t,e,n=null){for(let o=0,r=e.length;o<r;o++)t.insertBefore(e[o],n)}function Te(t,e,n,o){if(n===void 0)return t.textContent="";const r=o||document.createTextNode("");if(e.length){let s=!1;for(let a=e.length-1;a>=0;a--){const i=e[a];if(r!==i){const l=i.parentNode===t;!s&&!a?l?t.replaceChild(r,i):t.insertBefore(r,n):l&&i.remove()}else s=!0}}else t.insertBefore(r,n);return[r]}const Lt=Symbol("store-raw"),Ae=Symbol("store-node"),le=Symbol("store-has"),_n=Symbol("store-self");function An(t){let e=t[he];if(!e&&(Object.defineProperty(t,he,{value:e=new Proxy(t,Eo)}),!Array.isArray(t))){const n=Object.keys(t),o=Object.getOwnPropertyDescriptors(t);for(let r=0,s=n.length;r<s;r++){const a=n[r];o[a].get&&Object.defineProperty(t,a,{enumerable:o[a].enumerable,get:o[a].get.bind(e)})}}return e}function lt(t){let e;return t!=null&&typeof t=="object"&&(t[he]||!(e=Object.getPrototypeOf(t))||e===Object.prototype||Array.isArray(t))}function Re(t,e=new Set){let n,o,r,s;if(n=t!=null&&t[Lt])return n;if(!lt(t)||e.has(t))return t;if(Array.isArray(t)){Object.isFrozen(t)?t=t.slice(0):e.add(t);for(let a=0,i=t.length;a<i;a++)r=t[a],(o=Re(r,e))!==r&&(t[a]=o)}else{Object.isFrozen(t)?t=Object.assign({},t):e.add(t);const a=Object.keys(t),i=Object.getOwnPropertyDescriptors(t);for(let l=0,d=a.length;l<d;l++)s=a[l],!i[s].get&&(r=t[s],(o=Re(r,e))!==r&&(t[s]=o))}return t}function ct(t,e){let n=t[e];return n||Object.defineProperty(t,e,{value:n=Object.create(null)}),n}function Ue(t,e,n){if(t[e])return t[e];const[o,r]=D(n,{equals:!1,internal:!0});return o.$=r,t[e]=o}function _o(t,e){const n=Reflect.getOwnPropertyDescriptor(t,e);return!n||n.get||!n.configurable||e===he||e===Ae||(delete n.value,delete n.writable,n.get=()=>t[he][e]),n}function En(t){Et()&&Ue(ct(t,Ae),_n)()}function Ao(t){return En(t),Reflect.ownKeys(t)}const Eo={get(t,e,n){if(e===Lt)return t;if(e===he)return n;if(e===At)return En(t),n;const o=ct(t,Ae),r=o[e];let s=r?r():t[e];if(e===Ae||e===le||e==="__proto__")return s;if(!r){const a=Object.getOwnPropertyDescriptor(t,e);Et()&&(typeof s!="function"||t.hasOwnProperty(e))&&!(a&&a.get)&&(s=Ue(o,e,s)())}return lt(s)?An(s):s},has(t,e){return e===Lt||e===he||e===At||e===Ae||e===le||e==="__proto__"?!0:(Et()&&Ue(ct(t,le),e)(),e in t)},set(){return!0},deleteProperty(){return!0},ownKeys:Ao,getOwnPropertyDescriptor:_o};function dt(t,e,n,o=!1){if(!o&&t[e]===n)return;const r=t[e],s=t.length;n===void 0?(delete t[e],t[le]&&t[le][e]&&r!==void 0&&t[le][e].$()):(t[e]=n,t[le]&&t[le][e]&&r===void 0&&t[le][e].$());let a=ct(t,Ae),i;if((i=Ue(a,e,r))&&i.$(()=>n),Array.isArray(t)&&t.length!==s){for(let l=t.length;l<s;l++)(i=a[l])&&i.$();(i=Ue(a,"length",s))&&i.$(t.length)}(i=a[_n])&&i.$()}function Pn(t,e){const n=Object.keys(e);for(let o=0;o<n.length;o+=1){const r=n[o];dt(t,r,e[r])}}function Po(t,e){if(typeof e=="function"&&(e=e(t)),e=Re(e),Array.isArray(e)){if(t===e)return;let n=0,o=e.length;for(;n<o;n++){const r=e[n];t[n]!==r&&dt(t,n,r)}dt(t,"length",o)}else Pn(t,e)}function Ne(t,e,n=[]){let o,r=t;if(e.length>1){o=e.shift();const a=typeof o,i=Array.isArray(t);if(Array.isArray(o)){for(let l=0;l<o.length;l++)Ne(t,[o[l]].concat(e),n);return}else if(i&&a==="function"){for(let l=0;l<t.length;l++)o(t[l],l)&&Ne(t,[l].concat(e),n);return}else if(i&&a==="object"){const{from:l=0,to:d=t.length-1,by:u=1}=o;for(let c=l;c<=d;c+=u)Ne(t,[c].concat(e),n);return}else if(e.length>1){Ne(t[o],e,[o].concat(n));return}r=t[o],n=[o].concat(n)}let s=e[0];typeof s=="function"&&(s=s(r,n),s===r)||o===void 0&&s==null||(s=Re(s),o===void 0||lt(r)&&lt(s)&&!Array.isArray(s)?Pn(r,s):dt(t,o,s))}function Jt(...[t,e]){const n=Re(t||{}),o=Array.isArray(n),r=An(n);function s(...a){uo(()=>{o&&a.length===1?Po(n,a[0]):Ne(n,a)})}return[r,s]}const Io=()=>{const[t,e]=Jt({id:"default-project",name:"New Project",tempo:120,timeSignature:[4,4],tracks:[],masterVolume:.8,masterPan:0,masterEffects:[]}),[n,o]=D(!1);return{project:t,isDirty:n,addTrack:f=>{const p={...f,id:crypto.randomUUID(),clips:[],effects:[]};e("tracks",m=>[...m,p]),o(!0)},removeTrack:f=>{e("tracks",p=>p.filter(m=>m.id!==f)),o(!0)},updateTrack:(f,p)=>{e("tracks",m=>m.id===f,p),o(!0)},addClip:(f,p)=>{const m={...p,id:crypto.randomUUID(),trackId:f};e("tracks",x=>x.id===f,"clips",x=>[...x,m]),o(!0)},removeClip:f=>{e("tracks",p=>p.map(m=>({...m,clips:m.clips.filter(x=>x.id!==f)}))),o(!0)},updateClip:(f,p)=>{e("tracks",m=>m.map(x=>({...x,clips:x.clips.map($=>$.id===f?{...$,...p}:$)}))),o(!0)},setTempo:f=>{e("tempo",f),o(!0)},setTimeSignature:f=>{e("timeSignature",f),o(!0)},setProject:e,setIsDirty:o}};class Ce{static instance;toneContext;masterGain;instruments=new Map;effects=new Map;sequences=new Map;isInitialized=!1;constructor(){this.initializeAudio()}static getInstance(){return Ce.instance||(Ce.instance=new Ce),Ce.instance}async initializeAudio(){try{typeof window<"u"&&window.Tone?(await window.Tone.start(),this.toneContext=window.Tone.getContext(),this.masterGain=new window.Tone.Gain(.8).toDestination(),window.Tone.Transport.stop(),window.Tone.Transport.cancel(),window.Tone.Transport.seconds=0,this.isInitialized=!0,console.log("Audio engine initialized successfully, transport reset to 0")):console.warn("Tone.js not found. Audio features will be limited.")}catch(e){console.error("Failed to initialize audio engine:",e)}}async ensureInitialized(){this.isInitialized||await this.initializeAudio()}createInstrument(e){if(!this.isInitialized)return console.warn("Audio engine not initialized"),null;try{let n;switch(e.type){case"synth":n=new window.Tone.Synth(e.parameters).connect(this.masterGain);break;case"sampler":n=new window.Tone.Sampler(e.parameters).connect(this.masterGain);break;case"drum":n=new window.Tone.MembraneSynth(e.parameters).connect(this.masterGain);break;default:n=new window.Tone.Synth().connect(this.masterGain)}return this.instruments.set(e.id,n),n}catch(n){return console.error("Failed to create instrument:",n),null}}createEffect(e){if(!this.isInitialized)return console.warn("Audio engine not initialized"),null;try{let n;switch(e.type){case"reverb":n=new window.Tone.Reverb(e.parameters);break;case"delay":n=new window.Tone.Delay(e.parameters);break;case"filter":n=new window.Tone.Filter(e.parameters);break;case"distortion":n=new window.Tone.Distortion(e.parameters);break;default:n=new window.Tone.Gain}return this.effects.set(e.id,n),n}catch(n){return console.error("Failed to create effect:",n),null}}playNote(e,n,o=.5){const r=this.instruments.get(e);r&&r.triggerAttackRelease(n,o)}scheduleClip(e,n){if(this.isInitialized)try{if(console.log("Scheduling clip:",e.name,"start:",e.start,"with",e.content.notes?.length,"notes"),console.log("Current transport time when scheduling:",window.Tone?.Transport?.seconds,"Transport state:",window.Tone?.Transport?.state),e.content.type==="midi"){const o=n.instrument?.id||`${n.id}-synth`;let r=this.instruments.get(o);if(!r){const s=n.instrument?.type||"synth",a=(n.volume||.8)*.7;switch(s){case"membraneSynth":r=new window.Tone.MembraneSynth({volume:a}).connect(this.masterGain);break;case"pluckSynth":const i={volume:a,attackNoise:n.instrument?.parameters?.attackNoise||1,dampening:n.instrument?.parameters?.dampening||4e3,resonance:n.instrument?.parameters?.resonance||.9,...n.instrument?.parameters};r=new window.Tone.PluckSynth(i).connect(this.masterGain);break;case"fmSynth":r=new window.Tone.FMSynth({volume:a}).connect(this.masterGain);break;case"amSynth":r=new window.Tone.AMSynth({volume:a}).connect(this.masterGain);break;default:r=new window.Tone.Synth({volume:a}).connect(this.masterGain)}this.instruments.set(o,r),console.log("Created",s,"for track:",n.name,"volume:",n.volume)}r&&e.content.notes&&e.content.notes.forEach((s,a)=>{const i=e.start+s.time;console.log("Clip:",e.name,"starts at beat:",e.start,"Note:",s.note,"offset:",s.time,"absolute time:",i),console.log("Scheduling note:",s.note,"at absolute beat:",i,"transport position:",window.Tone.Transport.seconds);const l=Math.floor(i/4),d=Math.floor(i%4),u=Math.round(i%1*4),c=`${l}:${d}:${u}`;console.log("Converted beat",i,"to Tone notation:",c),window.Tone.Transport.schedule(f=>{console.log("Playing note:",s.note,"at transport time:",f,"seconds (scheduled at:",c,")");try{const p=window.Tone.Transport.bpm.value,m=s.duration*(60/p);r.triggerAttackRelease(s.note,m,f,s.velocity||.8)}catch(p){console.warn("Failed to trigger note:",s.note,p)}},c)})}else if(e.content.type==="audio"&&e.content.audioBuffer){const o=new window.Tone.Player(e.content.audioBuffer).connect(this.masterGain),r=window.Tone.Time(e.start,"n").toSeconds();window.Tone.Transport.schedule(s=>{o.start(s)},r),this.sequences.set(e.id,o)}}catch(o){console.error("Failed to schedule clip:",o)}}startTransport(){this.isInitialized&&window.Tone&&window.Tone.Transport.start()}stopTransport(){this.isInitialized&&window.Tone&&(window.Tone.Transport.stop(),window.Tone.Transport.cancel(),window.Tone.Transport.position=0,window.Tone.Transport.seconds=0,window.Tone.Transport.loop=!1,window.Tone.Transport.loopStart=0,window.Tone.Transport.loopEnd=1,console.log("Transport stopped and reset to 0"))}pauseTransport(){this.isInitialized&&window.Tone&&(console.log("Pausing transport at:",window.Tone.Transport.seconds),window.Tone.Transport.pause())}setTempo(e){this.isInitialized&&window.Tone&&(window.Tone.Transport.bpm.value=e)}setPosition(e){this.isInitialized&&window.Tone&&(window.Tone.Transport.seconds=e)}getCurrentTime(){return this.isInitialized&&window.Tone?window.Tone.Transport.seconds:0}processJmonFile(e){if(typeof window<"u"&&window.jmonTone)try{return window.jmonTone.processJmonData(e)}catch(n){return console.error("Failed to process JMON file:",n),null}return null}dispose(){this.instruments.forEach(e=>{e.dispose&&e.dispose()}),this.effects.forEach(e=>{e.dispose&&e.dispose()}),this.sequences.forEach(e=>{e.dispose&&e.dispose()}),this.instruments.clear(),this.effects.clear(),this.sequences.clear()}}const ee=Ce.getInstance(),Lo=t=>{const[e,n]=Jt({isPlaying:!1,isRecording:!1,isLooping:!1,currentTime:0,loopStart:0,loopEnd:16,tempo:120,timeSignature:[4,4]}),[o,r]=D(0);let s=null;const a=async()=>{if(await ee.ensureInitialized(),ee.stopTransport(),t){const v=t();console.log("Scheduling clips for project with",v.tracks.length,"tracks"),v.tracks.forEach(S=>{if(S.instrument)ee.createInstrument(S.instrument);else{const T={id:`${S.id}-synth`,name:"Default Synth",type:"synth",parameters:{}};ee.createInstrument(T),S.instrument=T}S.clips.forEach(T=>{ee.scheduleClip(T,S)})})}e.isLooping&&window.Tone&&(window.Tone.Transport.loop=!0,window.Tone.Transport.loopStart=e.loopStart,window.Tone.Transport.loopEnd=e.loopEnd,console.log("Restored loop settings: start=",e.loopStart,"end=",e.loopEnd)),n("isPlaying",!0),ee.startTransport(),$()},i=()=>{n("isPlaying",!1),n("isRecording",!1),ee.stopTransport(),ee.setPosition(0),c(0),U(),console.log("Transport stopped, clips scheduling reset")},l=()=>{e.isPlaying&&(n("isPlaying",!1),ee.pauseTransport(),U())},d=()=>{n("isRecording",!e.isRecording),e.isRecording&&!e.isPlaying&&a()},u=()=>{const v=e.isLooping;if(n("isLooping",!e.isLooping),!v&&t){const S=t();let T=0;if(S.tracks.forEach(L=>{L.clips.forEach(k=>{const E=k.start+k.duration;E>T&&(T=E)})}),T>0){const L=Math.ceil(T/4)*4;n("loopEnd",Math.max(L,4)),console.log("Set intelligent loop end to",L,"beats based on clips ending at",T)}}window.Tone&&ee&&(window.Tone.Transport.loop=!v,v||(window.Tone.Transport.loopStart=e.loopStart,window.Tone.Transport.loopEnd=e.loopEnd))},c=v=>{n("currentTime",v),r(v),ee.setPosition(v)},f=v=>{n("loopStart",v)},p=v=>{n("loopEnd",v)},m=v=>{n("tempo",v),ee.setTempo(v)},x=v=>{n("timeSignature",v)},$=()=>{const v=()=>{if(e.isPlaying){const S=ee.getCurrentTime();e.isLooping&&S>=e.loopEnd?c(e.loopStart):c(S),s=requestAnimationFrame(v)}};s=requestAnimationFrame(v)},U=()=>{s&&(cancelAnimationFrame(s),s=null)};return{transport:e,positionSignal:o,play:a,stop:i,pause:l,record:d,toggleLoop:u,setCurrentTime:c,setLoopStart:f,setLoopEnd:p,setTempo:m,setTimeSignature:x}},zo=()=>{const[t,e]=Jt({zoom:1,scrollX:0,scrollY:0,selectedTrackIds:[],selectedClipIds:[],viewMode:"arrange",snapToGrid:!0,gridSize:.25}),n=f=>{e("zoom",Math.max(.1,Math.min(10,f)))};return{view:t,setZoom:n,zoomIn:()=>{n(t.zoom*1.2)},zoomOut:()=>{n(t.zoom/1.2)},setScroll:(f,p)=>{e("scrollX",Math.max(0,f)),e("scrollY",Math.max(0,p))},selectTrack:(f,p=!1)=>{p?t.selectedTrackIds.includes(f)?e("selectedTrackIds",m=>m.filter(x=>x!==f)):e("selectedTrackIds",m=>[...m,f]):e("selectedTrackIds",[f])},selectClip:(f,p=!1)=>{p?t.selectedClipIds.includes(f)?e("selectedClipIds",m=>m.filter(x=>x!==f)):e("selectedClipIds",m=>[...m,f]):e("selectedClipIds",[f])},clearSelection:()=>{e("selectedTrackIds",[]),e("selectedClipIds",[])},setViewMode:f=>{e("viewMode",f)},toggleSnapToGrid:()=>{e("snapToGrid",!t.snapToGrid)},setGridSize:f=>{e("gridSize",f)}}},In=po(),Mo=t=>{const e=Io(),n=Lo(()=>e.project),o=zo(),r={project:e,transport:n,view:o};return y(In.Provider,{value:r,get children(){return t.children}})},Bt=()=>{const t=mo(In);if(!t)throw new Error("useDAW must be used within a DAWProvider");return t},gt=()=>Bt().project,De=()=>Bt().transport,bt=()=>Bt().view;/**
* (c) Iconify
*
* For the full copyright and license information, please view the license.txt
* files at https://github.com/iconify/iconify
*
* Licensed under MIT.
*
* @license MIT
* @version 3.0.0
*/const Ln=Object.freeze({left:0,top:0,width:16,height:16}),ut=Object.freeze({rotate:0,vFlip:!1,hFlip:!1}),Ve=Object.freeze({...Ln,...ut}),zt=Object.freeze({...Ve,body:"",hidden:!1}),Oo=Object.freeze({width:null,height:null}),zn=Object.freeze({...Oo,...ut});function No(t,e=0){const n=t.replace(/^-?[0-9.]*/,"");function o(r){for(;r<0;)r+=4;return r%4}if(n===""){const r=parseInt(t);return isNaN(r)?0:o(r)}else if(n!==t){let r=0;switch(n){case"%":r=25;break;case"deg":r=90}if(r){let s=parseFloat(t.slice(0,t.length-n.length));return isNaN(s)?0:(s=s/r,s%1===0?o(s):0)}}return e}const Fo=/[\s,]+/;function jo(t,e){e.split(Fo).forEach(n=>{switch(n.trim()){case"horizontal":t.hFlip=!0;break;case"vertical":t.vFlip=!0;break}})}const Mn={...zn,preserveAspectRatio:""};function Yt(t){const e={...Mn},n=(o,r)=>t.getAttribute(o)||r;return e.width=n("width",null),e.height=n("height",null),e.rotate=No(n("rotate","")),jo(e,n("flip","")),e.preserveAspectRatio=n("preserveAspectRatio",n("preserveaspectratio","")),e}function Ro(t,e){for(const n in Mn)if(t[n]!==e[n])return!0;return!1}const On=/^[a-z0-9]+(-[a-z0-9]+)*$/,He=(t,e,n,o="")=>{const r=t.split(":");if(t.slice(0,1)==="@"){if(r.length<2||r.length>3)return null;o=r.shift().slice(1)}if(r.length>3||!r.length)return null;if(r.length>1){const i=r.pop(),l=r.pop(),d={provider:r.length>0?r[0]:o,prefix:l,name:i};return e&&!et(d)?null:d}const s=r[0],a=s.split("-");if(a.length>1){const i={provider:o,prefix:a.shift(),name:a.join("-")};return e&&!et(i)?null:i}if(n&&o===""){const i={provider:o,prefix:"",name:s};return e&&!et(i,n)?null:i}return null},et=(t,e)=>t?!!((e&&t.prefix===""||t.prefix)&&t.name):!1;function Uo(t,e){const n={};!t.hFlip!=!e.hFlip&&(n.hFlip=!0),!t.vFlip!=!e.vFlip&&(n.vFlip=!0);const o=((t.rotate||0)+(e.rotate||0))%4;return o&&(n.rotate=o),n}function Zt(t,e){const n=Uo(t,e);for(const o in zt)o in ut?o in t&&!(o in n)&&(n[o]=ut[o]):o in e?n[o]=e[o]:o in t&&(n[o]=t[o]);return n}function Jo(t,e){const n=t.icons,o=t.aliases||Object.create(null),r=Object.create(null);function s(a){if(n[a])return r[a]=[];if(!(a in r)){r[a]=null;const i=o[a]&&o[a].parent,l=i&&s(i);l&&(r[a]=[i].concat(l))}return r[a]}return Object.keys(n).concat(Object.keys(o)).forEach(s),r}function Bo(t,e,n){const o=t.icons,r=t.aliases||Object.create(null);let s={};function a(i){s=Zt(o[i]||r[i],s)}return a(e),n.forEach(a),Zt(t,s)}function Nn(t,e){const n=[];if(typeof t!="object"||typeof t.icons!="object")return n;t.not_found instanceof Array&&t.not_found.forEach(r=>{e(r,null),n.push(r)});const o=Jo(t);for(const r in o){const s=o[r];s&&(e(r,Bo(t,r,s)),n.push(r))}return n}const qo={provider:"",aliases:{},not_found:{},...Ln};function St(t,e){for(const n in e)if(n in t&&typeof t[n]!=typeof e[n])return!1;return!0}function Fn(t){if(typeof t!="object"||t===null)return null;const e=t;if(typeof e.prefix!="string"||!t.icons||typeof t.icons!="object"||!St(t,qo))return null;const n=e.icons;for(const r in n){const s=n[r];if(!r||typeof s.body!="string"||!St(s,zt))return null}const o=e.aliases||Object.create(null);for(const r in o){const s=o[r],a=s.parent;if(!r||typeof a!="string"||!n[a]&&!o[a]||!St(s,zt))return null}return e}const ft=Object.create(null);function Go(t,e){return{provider:t,prefix:e,icons:Object.create(null),missing:new Set}}function de(t,e){const n=ft[t]||(ft[t]=Object.create(null));return n[e]||(n[e]=Go(t,e))}function jn(t,e){return Fn(e)?Nn(e,(n,o)=>{o?t.icons[n]=o:t.missing.add(n)}):[]}function Do(t,e,n){try{if(typeof n.body=="string")return t.icons[e]={...n},!0}catch{}return!1}function Vo(t,e){let n=[];return(typeof t=="string"?[t]:Object.keys(ft)).forEach(r=>{(typeof r=="string"&&typeof e=="string"?[e]:Object.keys(ft[r]||{})).forEach(a=>{const i=de(r,a);n=n.concat(Object.keys(i.icons).map(l=>(r!==""?"@"+r+":":"")+a+":"+l))})}),n}let Je=!1;function Rn(t){return typeof t=="boolean"&&(Je=t),Je}function Be(t){const e=typeof t=="string"?He(t,!0,Je):t;if(e){const n=de(e.provider,e.prefix),o=e.name;return n.icons[o]||(n.missing.has(o)?null:void 0)}}function Un(t,e){const n=He(t,!0,Je);if(!n)return!1;const o=de(n.provider,n.prefix);return e?Do(o,n.name,e):(o.missing.add(n.name),!0)}function en(t,e){if(typeof t!="object")return!1;if(typeof e!="string"&&(e=t.provider||""),Je&&!e&&!t.prefix){let r=!1;return Fn(t)&&(t.prefix="",Nn(t,(s,a)=>{Un(s,a)&&(r=!0)})),r}const n=t.prefix;if(!et({prefix:n,name:"a"}))return!1;const o=de(e,n);return!!jn(o,t)}function Ho(t){return!!Be(t)}function Xo(t){const e=Be(t);return e&&{...Ve,...e}}function Wo(t){const e={loaded:[],missing:[],pending:[]},n=Object.create(null);t.sort((r,s)=>r.provider!==s.provider?r.provider.localeCompare(s.provider):r.prefix!==s.prefix?r.prefix.localeCompare(s.prefix):r.name.localeCompare(s.name));let o={provider:"",prefix:"",name:""};return t.forEach(r=>{if(o.name===r.name&&o.prefix===r.prefix&&o.provider===r.provider)return;o=r;const s=r.provider,a=r.prefix,i=r.name,l=n[s]||(n[s]=Object.create(null)),d=l[a]||(l[a]=de(s,a));let u;i in d.icons?u=e.loaded:a===""||d.missing.has(i)?u=e.missing:u=e.pending;const c={provider:s,prefix:a,name:i};u.push(c)}),e}function Jn(t,e){t.forEach(n=>{const o=n.loaderCallbacks;o&&(n.loaderCallbacks=o.filter(r=>r.id!==e))})}function Qo(t){t.pendingCallbacksFlag||(t.pendingCallbacksFlag=!0,setTimeout(()=>{t.pendingCallbacksFlag=!1;const e=t.loaderCallbacks?t.loaderCallbacks.slice(0):[];if(!e.length)return;let n=!1;const o=t.provider,r=t.prefix;e.forEach(s=>{const a=s.icons,i=a.pending.length;a.pending=a.pending.filter(l=>{if(l.prefix!==r)return!0;const d=l.name;if(t.icons[d])a.loaded.push({provider:o,prefix:r,name:d});else if(t.missing.has(d))a.missing.push({provider:o,prefix:r,name:d});else return n=!0,!0;return!1}),a.pending.length!==i&&(n||Jn([t],s.id),s.callback(a.loaded.slice(0),a.missing.slice(0),a.pending.slice(0),s.abort))})}))}let Ko=0;function Yo(t,e,n){const o=Ko++,r=Jn.bind(null,n,o);if(!e.pending.length)return r;const s={id:o,icons:e,callback:t,abort:r};return n.forEach(a=>{(a.loaderCallbacks||(a.loaderCallbacks=[])).push(s)}),r}const Mt=Object.create(null);function tn(t,e){Mt[t]=e}function Ot(t){return Mt[t]||Mt[""]}function Zo(t,e=!0,n=!1){const o=[];return t.forEach(r=>{const s=typeof r=="string"?He(r,e,n):r;s&&o.push(s)}),o}var er={resources:[],index:0,timeout:2e3,rotate:750,random:!1,dataAfterTimeout:!1};function tr(t,e,n,o){const r=t.resources.length,s=t.random?Math.floor(Math.random()*r):t.index;let a;if(t.random){let k=t.resources.slice(0);for(a=[];k.length>1;){const E=Math.floor(Math.random()*k.length);a.push(k[E]),k=k.slice(0,E).concat(k.slice(E+1))}a=a.concat(k)}else a=t.resources.slice(s).concat(t.resources.slice(0,s));const i=Date.now();let l="pending",d=0,u,c=null,f=[],p=[];typeof o=="function"&&p.push(o);function m(){c&&(clearTimeout(c),c=null)}function x(){l==="pending"&&(l="aborted"),m(),f.forEach(k=>{k.status==="pending"&&(k.status="aborted")}),f=[]}function $(k,E){E&&(p=[]),typeof k=="function"&&p.push(k)}function U(){return{startTime:i,payload:e,status:l,queriesSent:d,queriesPending:f.length,subscribe:$,abort:x}}function v(){l="failed",p.forEach(k=>{k(void 0,u)})}function S(){f.forEach(k=>{k.status==="pending"&&(k.status="aborted")}),f=[]}function T(k,E,I){const M=E!=="success";switch(f=f.filter(O=>O!==k),l){case"pending":break;case"failed":if(M||!t.dataAfterTimeout)return;break;default:return}if(E==="abort"){u=I,v();return}if(M){u=I,f.length||(a.length?L():v());return}if(m(),S(),!t.random){const O=t.resources.indexOf(k.resource);O!==-1&&O!==t.index&&(t.index=O)}l="completed",p.forEach(O=>{O(I)})}function L(){if(l!=="pending")return;m();const k=a.shift();if(k===void 0){if(f.length){c=setTimeout(()=>{m(),l==="pending"&&(S(),v())},t.timeout);return}v();return}const E={status:"pending",resource:k,callback:(I,M)=>{T(E,I,M)}};f.push(E),d++,c=setTimeout(L,t.rotate),n(k,e,E.callback)}return setTimeout(L),U}function Bn(t){const e={...er,...t};let n=[];function o(){n=n.filter(i=>i().status==="pending")}function r(i,l,d){const u=tr(e,i,l,(c,f)=>{o(),d&&d(c,f)});return n.push(u),u}function s(i){return n.find(l=>i(l))||null}return{query:r,find:s,setIndex:i=>{e.index=i},getIndex:()=>e.index,cleanup:o}}function qt(t){let e;if(typeof t.resources=="string")e=[t.resources];else if(e=t.resources,!(e instanceof Array)||!e.length)return null;return{resources:e,path:t.path||"/",maxURL:t.maxURL||500,rotate:t.rotate||750,timeout:t.timeout||5e3,random:t.random===!0,index:t.index||0,dataAfterTimeout:t.dataAfterTimeout!==!1}}const yt=Object.create(null),Me=["https://api.simplesvg.com","https://api.unisvg.com"],tt=[];for(;Me.length>0;)Me.length===1||Math.random()>.5?tt.push(Me.shift()):tt.push(Me.pop());yt[""]=qt({resources:["https://api.iconify.design"].concat(tt)});function nn(t,e){const n=qt(e);return n===null?!1:(yt[t]=n,!0)}function vt(t){return yt[t]}function nr(){return Object.keys(yt)}function on(){}const kt=Object.create(null);function or(t){if(!kt[t]){const e=vt(t);if(!e)return;const n=Bn(e),o={config:e,redundancy:n};kt[t]=o}return kt[t]}function qn(t,e,n){let o,r;if(typeof t=="string"){const s=Ot(t);if(!s)return n(void 0,424),on;r=s.send;const a=or(t);a&&(o=a.redundancy)}else{const s=qt(t);if(s){o=Bn(s);const a=t.resources?t.resources[0]:"",i=Ot(a);i&&(r=i.send)}}return!o||!r?(n(void 0,424),on):o.query(e,r,n)().abort}function rn(){}function rr(t){t.iconsLoaderFlag||(t.iconsLoaderFlag=!0,setTimeout(()=>{t.iconsLoaderFlag=!1,Qo(t)}))}function ir(t){const e=[],n=[];return t.forEach(o=>{(o.match(On)?e:n).push(o)}),{valid:e,invalid:n}}function Oe(t,e,n){function o(){const r=t.pendingIcons;e.forEach(s=>{r&&r.delete(s),t.icons[s]||t.missing.add(s)})}if(n&&typeof n=="object")try{if(!jn(t,n).length){o();return}}catch(r){console.error(r)}o(),rr(t)}function sn(t,e){t instanceof Promise?t.then(n=>{e(n)}).catch(()=>{e(null)}):e(t)}function sr(t,e){t.iconsToLoad?t.iconsToLoad=t.iconsToLoad.concat(e).sort():t.iconsToLoad=e,t.iconsQueueFlag||(t.iconsQueueFlag=!0,setTimeout(()=>{t.iconsQueueFlag=!1;const{provider:n,prefix:o}=t,r=t.iconsToLoad;if(delete t.iconsToLoad,!r||!r.length)return;const s=t.loadIcon;if(t.loadIcons&&(r.length>1||!s)){sn(t.loadIcons(r,o,n),u=>{Oe(t,r,u)});return}if(s){r.forEach(u=>{const c=s(u,o,n);sn(c,f=>{const p=f?{prefix:o,icons:{[u]:f}}:null;Oe(t,[u],p)})});return}const{valid:a,invalid:i}=ir(r);if(i.length&&Oe(t,i,null),!a.length)return;const l=o.match(On)?Ot(n):null;if(!l){Oe(t,a,null);return}l.prepare(n,o,a).forEach(u=>{qn(n,u,c=>{Oe(t,u.icons,c)})})}))}const Gt=(t,e)=>{const n=Zo(t,!0,Rn()),o=Wo(n);if(!o.pending.length){let l=!0;return e&&setTimeout(()=>{l&&e(o.loaded,o.missing,o.pending,rn)}),()=>{l=!1}}const r=Object.create(null),s=[];let a,i;return o.pending.forEach(l=>{const{provider:d,prefix:u}=l;if(u===i&&d===a)return;a=d,i=u,s.push(de(d,u));const c=r[d]||(r[d]=Object.create(null));c[u]||(c[u]=[])}),o.pending.forEach(l=>{const{provider:d,prefix:u,name:c}=l,f=de(d,u),p=f.pendingIcons||(f.pendingIcons=new Set);p.has(c)||(p.add(c),r[d][u].push(c))}),s.forEach(l=>{const d=r[l.provider][l.prefix];d.length&&sr(l,d)}),e?Yo(e,o,s):rn},ar=t=>new Promise((e,n)=>{const o=typeof t=="string"?He(t,!0):t;if(!o){n(t);return}Gt([o||t],r=>{if(r.length&&o){const s=Be(o);if(s){e({...Ve,...s});return}}n(t)})});function an(t){try{const e=typeof t=="string"?JSON.parse(t):t;if(typeof e.body=="string")return{...e}}catch{}}function lr(t,e){if(typeof t=="object")return{data:an(t),value:t};if(typeof t!="string")return{value:t};if(t.includes("{")){const s=an(t);if(s)return{data:s,value:t}}const n=He(t,!0,!0);if(!n)return{value:t};const o=Be(n);if(o!==void 0||!n.prefix)return{value:t,name:n,data:o};const r=Gt([n],()=>e(t,n,Be(n)));return{value:t,name:n,loading:r}}let Gn=!1;try{Gn=navigator.vendor.indexOf("Apple")===0}catch{}function cr(t,e){switch(e){case"svg":case"bg":case"mask":return e}return e!=="style"&&(Gn||t.indexOf("<a")===-1)?"svg":t.indexOf("currentColor")===-1?"bg":"mask"}const dr=/(-?[0-9.]*[0-9]+[0-9.]*)/g,ur=/^-?[0-9.]*[0-9]+[0-9.]*$/g;function Nt(t,e,n){if(e===1)return t;if(n=n||100,typeof t=="number")return Math.ceil(t*e*n)/n;if(typeof t!="string")return t;const o=t.split(dr);if(o===null||!o.length)return t;const r=[];let s=o.shift(),a=ur.test(s);for(;;){if(a){const i=parseFloat(s);isNaN(i)?r.push(s):r.push(Math.ceil(i*e*n)/n)}else r.push(s);if(s=o.shift(),s===void 0)return r.join("");a=!a}}function fr(t,e="defs"){let n="";const o=t.indexOf("<"+e);for(;o>=0;){const r=t.indexOf(">",o),s=t.indexOf("</"+e);if(r===-1||s===-1)break;const a=t.indexOf(">",s);if(a===-1)break;n+=t.slice(r+1,s).trim(),t=t.slice(0,o).trim()+t.slice(a+1)}return{defs:n,content:t}}function pr(t,e){return t?"<defs>"+t+"</defs>"+e:e}function mr(t,e,n){const o=fr(t);return pr(o.defs,e+o.content+n)}const hr=t=>t==="unset"||t==="undefined"||t==="none";function Dn(t,e){const n={...Ve,...t},o={...zn,...e},r={left:n.left,top:n.top,width:n.width,height:n.height};let s=n.body;[n,o].forEach(x=>{const $=[],U=x.hFlip,v=x.vFlip;let S=x.rotate;U?v?S+=2:($.push("translate("+(r.width+r.left).toString()+" "+(0-r.top).toString()+")"),$.push("scale(-1 1)"),r.top=r.left=0):v&&($.push("translate("+(0-r.left).toString()+" "+(r.height+r.top).toString()+")"),$.push("scale(1 -1)"),r.top=r.left=0);let T;switch(S<0&&(S-=Math.floor(S/4)*4),S=S%4,S){case 1:T=r.height/2+r.top,$.unshift("rotate(90 "+T.toString()+" "+T.toString()+")");break;case 2:$.unshift("rotate(180 "+(r.width/2+r.left).toString()+" "+(r.height/2+r.top).toString()+")");break;case 3:T=r.width/2+r.left,$.unshift("rotate(-90 "+T.toString()+" "+T.toString()+")");break}S%2===1&&(r.left!==r.top&&(T=r.left,r.left=r.top,r.top=T),r.width!==r.height&&(T=r.width,r.width=r.height,r.height=T)),$.length&&(s=mr(s,'<g transform="'+$.join(" ")+'">',"</g>"))});const a=o.width,i=o.height,l=r.width,d=r.height;let u,c;a===null?(c=i===null?"1em":i==="auto"?d:i,u=Nt(c,l/d)):(u=a==="auto"?l:a,c=i===null?Nt(u,d/l):i==="auto"?d:i);const f={},p=(x,$)=>{hr($)||(f[x]=$.toString())};p("width",u),p("height",c);const m=[r.left,r.top,l,d];return f.viewBox=m.join(" "),{attributes:f,viewBox:m,body:s}}function Dt(t,e){let n=t.indexOf("xlink:")===-1?"":' xmlns:xlink="http://www.w3.org/1999/xlink"';for(const o in e)n+=" "+o+'="'+e[o]+'"';return'<svg xmlns="http://www.w3.org/2000/svg"'+n+">"+t+"</svg>"}function gr(t){return t.replace(/"/g,"'").replace(/%/g,"%25").replace(/#/g,"%23").replace(/</g,"%3C").replace(/>/g,"%3E").replace(/\s+/g," ")}function br(t){return"data:image/svg+xml,"+gr(t)}function Vn(t){return'url("'+br(t)+'")'}const yr=()=>{let t;try{if(t=fetch,typeof t=="function")return t}catch{}};let pt=yr();function vr(t){pt=t}function wr(){return pt}function xr(t,e){const n=vt(t);if(!n)return 0;let o;if(!n.maxURL)o=0;else{let r=0;n.resources.forEach(a=>{r=Math.max(r,a.length)});const s=e+".json?icons=";o=n.maxURL-r-n.path.length-s.length}return o}function $r(t){return t===404}const Sr=(t,e,n)=>{const o=[],r=xr(t,e),s="icons";let a={type:s,provider:t,prefix:e,icons:[]},i=0;return n.forEach((l,d)=>{i+=l.length+1,i>=r&&d>0&&(o.push(a),a={type:s,provider:t,prefix:e,icons:[]},i=l.length),a.icons.push(l)}),o.push(a),o};function kr(t){if(typeof t=="string"){const e=vt(t);if(e)return e.path}return"/"}const Tr=(t,e,n)=>{if(!pt){n("abort",424);return}let o=kr(e.provider);switch(e.type){case"icons":{const s=e.prefix,i=e.icons.join(","),l=new URLSearchParams({icons:i});o+=s+".json?"+l.toString();break}case"custom":{const s=e.uri;o+=s.slice(0,1)==="/"?s.slice(1):s;break}default:n("abort",400);return}let r=503;pt(t+o).then(s=>{const a=s.status;if(a!==200){setTimeout(()=>{n($r(a)?"abort":"next",a)});return}return r=501,s.json()}).then(s=>{if(typeof s!="object"||s===null){setTimeout(()=>{s===404?n("abort",s):n("next",r)});return}setTimeout(()=>{n("success",s)})}).catch(()=>{n("next",r)})},Cr={prepare:Sr,send:Tr};function _r(t,e,n){de(n||"",e).loadIcons=t}function Ar(t,e,n){de(n||"",e).loadIcon=t}const Tt="data-style";let Hn="";function Er(t){Hn=t}function ln(t,e){let n=Array.from(t.childNodes).find(o=>o.hasAttribute&&o.hasAttribute(Tt));n||(n=document.createElement("style"),n.setAttribute(Tt,Tt),t.appendChild(n)),n.textContent=":host{display:inline-block;vertical-align:"+(e?"-0.125em":"0")+"}span,svg{display:block;margin:auto}"+Hn}function Xn(){tn("",Cr),Rn(!0);let t;try{t=window}catch{}if(t){if(t.IconifyPreload!==void 0){const n=t.IconifyPreload,o="Invalid IconifyPreload syntax.";typeof n=="object"&&n!==null&&(n instanceof Array?n:[n]).forEach(r=>{try{(typeof r!="object"||r===null||r instanceof Array||typeof r.icons!="object"||typeof r.prefix!="string"||!en(r))&&console.error(o)}catch{console.error(o)}})}if(t.IconifyProviders!==void 0){const n=t.IconifyProviders;if(typeof n=="object"&&n!==null)for(const o in n){const r="IconifyProviders["+o+"] is invalid.";try{const s=n[o];if(typeof s!="object"||!s||s.resources===void 0)continue;nn(o,s)||console.error(r)}catch{console.error(r)}}}}return{iconLoaded:Ho,getIcon:Xo,listIcons:Vo,addIcon:Un,addCollection:en,calculateSize:Nt,buildIcon:Dn,iconToHTML:Dt,svgToURL:Vn,loadIcons:Gt,loadIcon:ar,addAPIProvider:nn,setCustomIconLoader:Ar,setCustomIconsLoader:_r,appendCustomStyle:Er,_api:{getAPIConfig:vt,setAPIModule:tn,sendAPIQuery:qn,setFetch:vr,getFetch:wr,listAPIProviders:nr}}}const Ft={"background-color":"currentColor"},Wn={"background-color":"transparent"},cn={image:"var(--svg)",repeat:"no-repeat",size:"100% 100%"},dn={"-webkit-mask":Ft,mask:Ft,background:Wn};for(const t in dn){const e=dn[t];for(const n in cn)e[t+"-"+n]=cn[n]}function un(t){return t?t+(t.match(/^[-0-9.]+$/)?"px":""):"inherit"}function Pr(t,e,n){const o=document.createElement("span");let r=t.body;r.indexOf("<a")!==-1&&(r+="<!-- "+Date.now()+" -->");const s=t.attributes,a=Dt(r,{...s,width:e.width+"",height:e.height+""}),i=Vn(a),l=o.style,d={"--svg":i,width:un(s.width),height:un(s.height),...n?Ft:Wn};for(const u in d)l.setProperty(u,d[u]);return o}let Fe;function Ir(){try{Fe=window.trustedTypes.createPolicy("iconify",{createHTML:t=>t})}catch{Fe=null}}function Lr(t){return Fe===void 0&&Ir(),Fe?Fe.createHTML(t):t}function zr(t){const e=document.createElement("span"),n=t.attributes;let o="";n.width||(o="width: inherit;"),n.height||(o+="height: inherit;"),o&&(n.style=o);const r=Dt(t.body,n);return e.innerHTML=Lr(r),e.firstChild}function jt(t){return Array.from(t.childNodes).find(e=>{const n=e.tagName&&e.tagName.toUpperCase();return n==="SPAN"||n==="SVG"})}function fn(t,e){const n=e.icon.data,o=e.customisations,r=Dn(n,o);o.preserveAspectRatio&&(r.attributes.preserveAspectRatio=o.preserveAspectRatio);const s=e.renderedMode;let a;switch(s){case"svg":a=zr(r);break;default:a=Pr(r,{...Ve,...n},s==="mask")}const i=jt(t);i?a.tagName==="SPAN"&&i.tagName===a.tagName?i.setAttribute("style",a.getAttribute("style")):t.replaceChild(a,i):t.appendChild(a)}function pn(t,e,n){const o=n&&(n.rendered?n:n.lastRender);return{rendered:!1,inline:e,icon:t,lastRender:o}}function Mr(t="iconify-icon"){let e,n;try{e=window.customElements,n=window.HTMLElement}catch{return}if(!e||!n)return;const o=e.get(t);if(o)return o;const r=["icon","mode","inline","noobserver","width","height","rotate","flip"],s=class extends n{_shadowRoot;_initialised=!1;_state;_checkQueued=!1;_connected=!1;_observer=null;_visible=!0;constructor(){super();const i=this._shadowRoot=this.attachShadow({mode:"open"}),l=this.hasAttribute("inline");ln(i,l),this._state=pn({value:""},l),this._queueCheck()}connectedCallback(){this._connected=!0,this.startObserver()}disconnectedCallback(){this._connected=!1,this.stopObserver()}static get observedAttributes(){return r.slice(0)}attributeChangedCallback(i){switch(i){case"inline":{const l=this.hasAttribute("inline"),d=this._state;l!==d.inline&&(d.inline=l,ln(this._shadowRoot,l));break}case"noobserver":{this.hasAttribute("noobserver")?this.startObserver():this.stopObserver();break}default:this._queueCheck()}}get icon(){const i=this.getAttribute("icon");if(i&&i.slice(0,1)==="{")try{return JSON.parse(i)}catch{}return i}set icon(i){typeof i=="object"&&(i=JSON.stringify(i)),this.setAttribute("icon",i)}get inline(){return this.hasAttribute("inline")}set inline(i){i?this.setAttribute("inline","true"):this.removeAttribute("inline")}get observer(){return this.hasAttribute("observer")}set observer(i){i?this.setAttribute("observer","true"):this.removeAttribute("observer")}restartAnimation(){const i=this._state;if(i.rendered){const l=this._shadowRoot;if(i.renderedMode==="svg")try{l.lastChild.setCurrentTime(0);return}catch{}fn(l,i)}}get status(){const i=this._state;return i.rendered?"rendered":i.icon.data===null?"failed":"loading"}_queueCheck(){this._checkQueued||(this._checkQueued=!0,setTimeout(()=>{this._check()}))}_check(){if(!this._checkQueued)return;this._checkQueued=!1;const i=this._state,l=this.getAttribute("icon");if(l!==i.icon.value){this._iconChanged(l);return}if(!i.rendered||!this._visible)return;const d=this.getAttribute("mode"),u=Yt(this);(i.attrMode!==d||Ro(i.customisations,u)||!jt(this._shadowRoot))&&this._renderIcon(i.icon,u,d)}_iconChanged(i){const l=lr(i,(d,u,c)=>{const f=this._state;if(f.rendered||this.getAttribute("icon")!==d)return;const p={value:d,name:u,data:c};p.data?this._gotIconData(p):f.icon=p});l.data?this._gotIconData(l):this._state=pn(l,this._state.inline,this._state)}_forceRender(){if(!this._visible){const i=jt(this._shadowRoot);i&&this._shadowRoot.removeChild(i);return}this._queueCheck()}_gotIconData(i){this._checkQueued=!1,this._renderIcon(i,Yt(this),this.getAttribute("mode"))}_renderIcon(i,l,d){const u=cr(i.data.body,d),c=this._state.inline;fn(this._shadowRoot,this._state={rendered:!0,icon:i,inline:c,customisations:l,attrMode:d,renderedMode:u})}startObserver(){if(!this._observer&&!this.hasAttribute("noobserver"))try{this._observer=new IntersectionObserver(i=>{const l=i.some(d=>d.isIntersecting);l!==this._visible&&(this._visible=l,this._forceRender())}),this._observer.observe(this)}catch{if(this._observer){try{this._observer.disconnect()}catch{}this._observer=null}}}stopObserver(){this._observer&&(this._observer.disconnect(),this._observer=null,this._visible=!0,this._connected&&this._forceRender())}};r.forEach(i=>{i in s.prototype||Object.defineProperty(s.prototype,i,{get:function(){return this.getAttribute(i)},set:function(l){l!==null?this.setAttribute(i,l):this.removeAttribute(i)}})});const a=Xn();for(const i in a)s[i]=s.prototype[i]=a[i];return e.define(t,s),s}const Or=Mr()||Xn(),{iconLoaded:Ri,getIcon:Ui,listIcons:Ji,addIcon:Bi,addCollection:qi,calculateSize:Gi,buildIcon:Di,iconToHTML:Vi,svgToURL:Hi,loadIcons:Xi,loadIcon:Wi,setCustomIconLoader:Qi,setCustomIconsLoader:Ki,addAPIProvider:Yi,_api:Zi}=Or;var Nr=_("<iconify-icon>",!0,!1,!1);const P=t=>{let e;return Ee(()=>{}),(()=>{var n=Nr(),o=e;return typeof o=="function"?Ge(o,n):e=n,n._$owner=fo(),F(r=>{var s=`lucide:${t.name}`,a=t.size||16,i=t.size||16,l=t.color?`color: ${t.color}`:void 0,d=t.class;return s!==r.e&&(n.icon=r.e=s),a!==r.t&&(n.width=r.t=a),i!==r.a&&(n.height=r.a=i),r.o=G(n,l,r.o),d!==r.i&&te(n,r.i=d),r},{e:void 0,t:void 0,a:void 0,o:void 0,i:void 0}),n})()},Qn=document.createElement("style");Qn.textContent=`
iconify-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  vertical-align: middle;
}
`;document.head.appendChild(Qn);var Fr=_("<div><input type=file style=display:none><button>"),jr=_("<span>");const mn=t=>{let e;const[n,o]=D(!1),r=async a=>{const i=a.target,l=Array.from(i.files||[]);if(l.length!==0){o(!0);try{t.onFileSelected&&t.onFileSelected(l)}finally{o(!1),e&&(e.value="")}}},s=()=>{e&&e.click()};return(()=>{var a=Fr(),i=a.firstChild,l=i.nextSibling;i.addEventListener("change",r);var d=e;return typeof d=="function"?Ge(d,i):e=i,l.$$click=s,h(l,(()=>{var u=st(()=>!!n());return()=>u()?y(P,{name:"loader-2",class:"animate-spin",color:"var(--text-primary)"}):y(P,{get name(){return t.icon||"folder-open"},get size(){return t.variant==="menu"?14:16},color:"var(--text-primary)"})})(),null),h(l,(()=>{var u=st(()=>!!t.label);return()=>u()&&(()=>{var c=jr();return h(c,()=>t.label),c})()})(),null),F(u=>{var c=`file-browser ${t.class||""}`,f=t.multiple!==!1,p=t.accept||".wav,.mp3,.ogg,.flac,.mid,.midi,.jmon,.json",m=`file-browser-btn ${t.variant||"primary"}`,x=n(),$=t.label||"Browse Files";return c!==u.e&&te(a,u.e=c),f!==u.t&&(i.multiple=u.t=f),p!==u.a&&ge(i,"accept",u.a=p),m!==u.o&&te(l,u.o=m),x!==u.i&&(l.disabled=u.i=x),$!==u.n&&ge(l,"title",u.n=$),u},{e:void 0,t:void 0,a:void 0,o:void 0,i:void 0,n:void 0}),a})()},Kn=document.createElement("style");Kn.textContent=`
.file-browser-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.15s ease;
  background: var(--bg-secondary);
  color: var(--text-primary);
  min-height: 32px;
}

.file-browser-btn.primary {
  background: var(--accent-primary);
  border-color: var(--accent-primary-hover);
  color: white;
}

.file-browser-btn.primary:hover:not(:disabled) {
  background: var(--accent-primary-hover);
  border-color: var(--accent-primary);
}

.file-browser-btn.secondary {
  background: var(--bg-tertiary);
  border-color: var(--border-color-light);
}

.file-browser-btn.secondary:hover:not(:disabled) {
  background: var(--bg-quaternary);
  border-color: var(--border-color-light);
}

.file-browser-btn.ghost {
  background: transparent;
  border-color: transparent;
  padding: 6px 8px;
}

.file-browser-btn.ghost:hover:not(:disabled) {
  background: var(--bg-tertiary);
  border-color: var(--border-color);
}

.file-browser-btn.menu {
  width: 100%;
  padding: 8px 12px;
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-size: 12px;
  text-align: left;
  justify-content: flex-start;
  transition: background 0.1s ease;
}

.file-browser-btn.menu:hover:not(:disabled) {
  background: var(--bg-tertiary);
}

.file-browser-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
`;document.head.appendChild(Kn);Ie(["click"]);class Rr{static samples=new Map;static baseUrls=["./samples/","./audio/","/samples/","/audio/","../samples/","../audio/"];static registerSample(e){this.samples.set(e.id,e)}static async resolveSamplePath(e){const n=this.samples.get(e);if(!n)return console.warn(`Sample not found: ${e}`),null;if(n.blob)return URL.createObjectURL(n.blob);if(n.url&&await this.checkUrlExists(n.url))return n.url;if(n.relativePath)for(const o of this.baseUrls){const r=o+n.relativePath;if(await this.checkUrlExists(r))return r}if(n.originalPath&&this.isUrl(n.originalPath)&&await this.checkUrlExists(n.originalPath))return n.originalPath;if(n.fallbacks){for(const o of n.fallbacks)if(await this.checkUrlExists(o))return o}return console.warn(`Could not resolve sample path for: ${e}`),null}static async importSampleFile(e){const n=crypto.randomUUID(),o=await this.fileToAudioBuffer(e),r={id:n,name:e.name,originalPath:e.name,blob:e,audioBuffer:o,metadata:{duration:o?.duration,sampleRate:o?.sampleRate,channels:o?.numberOfChannels,size:e.size,format:e.type}};return this.registerSample(r),r}static async importSampleUrl(e,n){const o=crypto.randomUUID();try{const s=await(await fetch(e)).blob(),a=await this.blobToAudioBuffer(s),i={id:o,name:n||this.extractFilenameFromUrl(e),originalPath:e,url:e,blob:s,audioBuffer:a,metadata:{duration:a?.duration,sampleRate:a?.sampleRate,channels:a?.numberOfChannels,size:s.size,format:s.type}};return this.registerSample(i),i}catch{throw new Error(`Failed to import sample from URL: ${e}`)}}static exportSampleForJmon(e){const n=this.samples.get(e);return n?{id:n.id,name:n.name,url:n.relativePath||n.originalPath||n.url,baseUrl:n.baseUrl,fallbacks:n.fallbacks,metadata:n.metadata}:null}static async importSampleFromJmon(e){try{const n={id:e.id||crypto.randomUUID(),name:e.name,originalPath:e.url,relativePath:e.url,baseUrl:e.baseUrl,fallbacks:e.fallbacks,metadata:e.metadata},o=await this.resolveSamplePath(n.id);if(o){n.url=o;try{const s=await(await fetch(o)).blob();n.blob=s,n.audioBuffer=await this.blobToAudioBuffer(s)}catch{console.warn(`Could not load audio buffer for sample: ${n.name}`)}}return this.registerSample(n),n}catch(n){return console.error("Failed to import sample from JMON:",n),null}}static getAllSamples(){return Array.from(this.samples.values())}static clearSamples(){this.samples.forEach(e=>{e.url&&e.url.startsWith("blob:")&&URL.revokeObjectURL(e.url)}),this.samples.clear()}static addBaseUrl(e){this.baseUrls.includes(e)||this.baseUrls.unshift(e)}static setSampleFallbacks(e,n){const o=this.samples.get(e);o&&(o.fallbacks=n)}static async checkUrlExists(e){try{return(await fetch(e,{method:"HEAD"})).ok}catch{return!1}}static isUrl(e){try{return new URL(e),!0}catch{return!1}}static extractFilenameFromUrl(e){try{return new URL(e).pathname.split("/").pop()||"sample"}catch{return"sample"}}static async fileToAudioBuffer(e){try{const n=await e.arrayBuffer();return await new(window.AudioContext||window.webkitAudioContext)().decodeAudioData(n)}catch(n){console.warn("Could not decode audio file:",n);return}}static async blobToAudioBuffer(e){try{const n=await e.arrayBuffer();return await new(window.AudioContext||window.webkitAudioContext)().decodeAudioData(n)}catch(n){console.warn("Could not decode audio blob:",n);return}}static createSamplePack(e,n,o){o.forEach(r=>{const s=crypto.randomUUID(),a=r.split("/").pop()||r,i={id:s,name:a,relativePath:r,baseUrl:n,url:n+r};this.registerSample(i)})}static async handleDroppedFiles(e){const n=[];for(const o of Array.from(e))if(o.type.startsWith("audio/"))try{const r=await this.importSampleFile(o);n.push(r)}catch(r){console.error(`Failed to import ${o.name}:`,r)}return n}}class mt{static async handleFile(e){const n=e.name.split(".").pop()?.toLowerCase();switch(n){case"wav":case"mp3":case"ogg":case"flac":return await this.handleAudioFile(e);case"mid":case"midi":return await this.handleMidiFile(e);case"jmon":case"json":return await this.handleJmonFile(e);default:return console.warn(`Unsupported file type: ${n}`),null}}static async handleAudioFile(e){try{const n=await Rr.importSampleFile(e),o={type:"audio",audioBuffer:n.audioBuffer,url:n.url||URL.createObjectURL(e),waveform:n.audioBuffer?this.generateWaveform(n.audioBuffer):void 0};return{type:"audio",name:e.name,content:o,duration:n.metadata?.duration||0}}catch(n){throw new Error(`Failed to process audio file: ${n instanceof Error?n.message:"Unknown error"}`)}}static async handleMidiFile(e){return new Promise((n,o)=>{const r=new FileReader;r.onload=s=>{try{const a=s.target?.result,i=this.parseMidiFile(a),l={type:"midi",notes:i.notes,tempo:i.tempo};n({type:"midi",name:e.name,content:l,duration:i.duration})}catch(a){o(a)}},r.onerror=()=>o(new Error("Failed to read MIDI file")),r.readAsArrayBuffer(e)})}static async handleJmonFile(e){return new Promise((n,o)=>{const r=new FileReader;r.onload=s=>{try{const a=s.target?.result,i=JSON.parse(a);n({type:"jmon",name:e.name,content:i})}catch(a){o(a)}},r.onerror=()=>o(new Error("Failed to read JMON file")),r.readAsText(e)})}static generateWaveform(e){const o=e.getChannelData(0),r=Math.floor(o.length/200),s=[];for(let a=0;a<200;a++){let i=0;for(let l=0;l<r;l++)i+=Math.abs(o[a*r+l]);s.push(i/r)}return s}static parseMidiFile(e){return{notes:[{note:"C4",time:0,duration:.5,velocity:1},{note:"E4",time:.5,duration:.5,velocity:1},{note:"G4",time:1,duration:.5,velocity:1}],tempo:120,duration:2}}static validateFileType(e){const n=["audio/","application/octet-stream"],o=["wav","mp3","ogg","flac","mid","midi","jmon","json"],r=e.name.split(".").pop()?.toLowerCase();return n.some(s=>e.type.startsWith(s))||r!==void 0&&o.includes(r)}static formatFileSize(e){if(e===0)return"0 Bytes";const n=1024,o=["Bytes","KB","MB","GB"],r=Math.floor(Math.log(e)/Math.log(n));return parseFloat((e/Math.pow(n,r)).toFixed(2))+" "+o[r]}}class Ur{static toJmon(e){const n={format:"jmonTone",version:"1.0",id:e.id,name:e.name,tempo:e.tempo,timeSignature:e.timeSignature,masterVolume:e.masterVolume,masterPan:e.masterPan,created:new Date().toISOString(),tracks:e.tracks.map(o=>this.trackToJmon(o))};return e.masterEffects&&e.masterEffects.length>0&&(n.masterEffects=e.masterEffects.map(o=>this.effectToJmon(o))),n}static trackToJmon(e){const n={id:e.id,name:e.name,type:e.type,volume:e.volume,pan:e.pan,muted:e.muted,solo:e.solo,color:e.color};if(e.instrument&&(n.synth=this.instrumentToJmon(e.instrument)),e.effects&&e.effects.length>0&&(n.effects=e.effects.map(o=>this.effectToJmon(o))),e.clips&&e.clips.length>0)if(e.clips.length===1){const o=e.clips[0];o.content.type==="midi"&&(n.notes=this.midiClipToJmonNotes(o.content),n.start=o.start,n.duration=o.duration)}else n.sequences=e.clips.map(o=>this.clipToJmon(o));return n}static clipToJmon(e){const n={id:e.id,name:e.name,start:e.start,duration:e.duration,type:e.type};return e.content.type==="midi"?(n.notes=this.midiClipToJmonNotes(e.content),e.content.tempo&&(n.tempo=e.content.tempo)):e.content.type==="audio"&&(n.audio={url:e.content.url,buffer:e.content.audioBuffer?"AudioBuffer":void 0}),n}static midiClipToJmonNotes(e){return e.notes.map(n=>({note:n.note,time:n.time,duration:n.duration,velocity:n.velocity}))}static instrumentToJmon(e){const n={id:e.id,name:e.name,type:e.engine,parameters:{...e.parameters}};return e.type==="sampler"&&(n.samples=e.parameters.samples||{},n.baseUrl=e.parameters.baseUrl||""),n}static effectToJmon(e){return{id:e.id,name:e.name,type:e.type,enabled:e.enabled,parameters:{...e.parameters}}}static downloadAsJmon(e,n){const o=this.toJmon(e),r=JSON.stringify(o,null,2),s=new Blob([r],{type:"application/json"}),a=URL.createObjectURL(s),i=document.createElement("a");i.href=a,i.download=n||`${e.name.replace(/[^a-z0-9]/gi,"_").toLowerCase()}.jmon`,document.body.appendChild(i),i.click(),document.body.removeChild(i),URL.revokeObjectURL(a)}static toJsonString(e,n=!0){const o=this.toJmon(e);return JSON.stringify(o,null,n?2:0)}static getProjectMetadata(e){return{id:e.id,name:e.name,tempo:e.tempo,timeSignature:e.timeSignature,trackCount:e.tracks.length,totalClips:e.tracks.reduce((n,o)=>n+o.clips.length,0),created:new Date().toISOString(),format:"jmonTone",version:"1.0"}}static toOriginalJmonFormat(e){const n={};return e.tracks.forEach((o,r)=>{if(o.clips.length>0){const s=o.clips[0];s.content.type==="midi"&&(n[o.name||`track${r}`]={notes:this.midiClipToJmonNotes(s.content),synth:o.instrument?this.instrumentToJmon(o.instrument):void 0,volume:o.volume,pan:o.pan})}}),{tempo:e.tempo,timeSignature:e.timeSignature,sequences:n,title:e.name}}static validateExport(e){const n=[];return!e||typeof e!="object"?(n.push("Export data must be an object"),{valid:!1,errors:n}):(!e.name&&!e.title&&n.push("Export must have a name or title"),(!e.tempo||typeof e.tempo!="number")&&n.push("Export must have a valid tempo"),!e.tracks&&!e.sequences&&n.push("Export must have tracks or sequences"),{valid:n.length===0,errors:n})}static createMinimalJmon(e="Test Project"){return{format:"jmonTone",version:"1.0",name:e,tempo:120,timeSignature:[4,4],tracks:[{name:"Piano",synth:{type:"Synth"},notes:[{note:"C4",time:0,duration:.5,velocity:1},{note:"E4",time:.5,duration:.5,velocity:1},{note:"G4",time:1,duration:.5,velocity:1}]}]}}}class Jr{static async importJmonObject(e){try{if(!e||typeof e!="object")throw new Error("Invalid JMON data: must be an object");console.log("Raw JMON data keys:",Object.keys(e)),console.log("Full JMON object:",JSON.stringify(e,null,2)),console.log("JMON data.bpm:",e.bpm,"type:",typeof e.bpm),console.log("JMON data.tempo:",e.tempo,"type:",typeof e.tempo);const n=e.tempo||e.bpm||120;console.log("JMON import - detected tempo:",n,"from jmonData.tempo:",e.tempo,"jmonData.bpm:",e.bpm);const o={id:e.id||crypto.randomUUID(),name:e.metadata?.name||e.name||e.title||"JMON Project",tempo:n,timeSignature:e.timeSignature||e.time_signature||[4,4],tracks:[],masterVolume:e.masterVolume||.8,masterPan:e.masterPan||0,masterEffects:[]};if(e.tracks&&Array.isArray(e.tracks))o.tracks=await Promise.all(e.tracks.map((r,s)=>this.convertJmonTrack(r,s,n)));else if(e.sequences||e.patterns)o.tracks=await this.convertJmonSequences(e,n);else if(e.notes||e.events){const r=await this.convertJmonTrack({name:o.name,notes:e.notes||e.events,synth:e.synth||e.instrument},0,n);o.tracks=[r]}return o}catch(n){throw console.error("JMON import error:",n),new Error(`Failed to import JMON: ${n instanceof Error?n.message:"Unknown error"}`)}}static async convertJmonTrack(e,n,o=120){const r=crypto.randomUUID(),s={id:r,name:e.name||e.label||`Track ${n+1}`,type:this.inferTrackType(e),volume:e.volume||e.gain||.8,pan:e.pan||0,muted:e.muted||e.mute||!1,solo:e.solo||!1,armed:!1,color:e.color||this.getTrackColor(n),clips:[],effects:[],instrument:e.synth||e.instrument?this.convertJmonInstrument(e.synth||e.instrument):{id:`${r}-synth`,name:"Synth",type:"synth",engine:"synth",parameters:{}}};if(e.notes||e.events||e.sequence){const a=e.notes||e.events||e.sequence;s.clips=await this.convertNotesToClips(a,r,s.color,o)}return s}static async convertJmonSequences(e,n=120){const o=[],r=e.sequences||e.patterns||[];if(Array.isArray(r))for(let s=0;s<r.length;s++){const a=r[s];if(a&&typeof a=="object"){const i=await this.convertJmonTrack({name:a.label||a.name||`Sequence ${s+1}`,notes:a.notes||a.events,synthRef:a.synthRef,synth:a.synth,...a},s,n);o.push(i)}}else for(const[s,a]of Object.entries(r))if(typeof a=="object"&&a!==null){const i=await this.convertJmonTrack({name:s,...a},o.length,n);o.push(i)}return o}static async convertNotesToClips(e,n,o,r=120){const s=[];if(console.log("Converting notes to clips:",e),Array.isArray(e))for(let a=0;a<e.length;a++){console.log("Processing note",a,":",e[a]);const i=this.convertJmonNote(e[a],void 0,r),d=Math.max(i.duration,.125),u={...i,time:0},c={id:crypto.randomUUID(),name:`${i.note}`,start:i.time,end:i.time+d,duration:d,trackId:n,type:"midi",content:{type:"midi",notes:[u],tempo:r},color:this.getNoteColor(i.note,a)};s.push(c)}return s}static getNoteColor(e,n){const o=["#ce9187","#7db881","#8db4d6","#d6c176","#d67676","#b19cd9","#87ceaa","#d9a599"];return o[n%o.length]}static async convertJmonNotes(e,n,o){const r=[];let s=0;if(Array.isArray(e))for(const a of e){const i=this.convertJmonNote(a);r.push(i),s=Math.max(s,i.time+i.duration)}else if(typeof e=="object")for(const[a,i]of Object.entries(e)){const l=parseFloat(a),d=this.convertJmonNote(i,l);r.push(d),s=Math.max(s,d.time+d.duration)}return{type:"midi",notes:r,tempo:n.tempo||o,duration:s}}static convertJmonNote(e,n,o=120){if(console.log("convertJmonNote called with:",e,"timeOverride:",n),typeof e=="string"||typeof e=="number")return{note:e,time:n||0,duration:.5,velocity:1};let r=0;if(console.log("Processing note time:",e.time,"type:",typeof e.time),e.time&&typeof e.time=="string"){const i=e.time.split(":");if(i.length>=2){const l=parseInt(i[0])||0,d=parseInt(i[1])||0,u=parseInt(i[2])||0;r=l*4+d+u/4,console.log("JMON time conversion:",e.time,"-> bars:",l,"beats:",d,"sixteenths:",u,"= total beats:",r)}}else typeof e.time=="number"&&(r=e.time,console.log("Note has numeric time in BEATS:",r));let s=.5;if(e.duration&&typeof e.duration=="string"){const i=e.duration;i.includes("n")&&(s=4/parseInt(i.replace("n","")))}else typeof e.duration=="number"&&(s=e.duration,console.log("Note has numeric duration in BEATS:",s));const a={note:Array.isArray(e.note)?e.note[0]:e.note||e.pitch||e.frequency||"C4",time:n!==void 0?n:r,duration:s,velocity:e.velocity||e.volume||e.amp||1};return console.log("convertJmonNote result:",a),a}static convertJmonInstrument(e){if(typeof e=="string"){const o=this.mapJmonSynthType(e);return{id:crypto.randomUUID(),name:e,type:o,engine:o,parameters:{}}}const n=this.mapJmonSynthType(e.type||e.name||"synth");return console.log("Converting JMON instrument:",e.type||e.name,"-> internal type:",n),{id:crypto.randomUUID(),name:e.name||e.type||"Synth",type:n,engine:n,parameters:{...e.options,...e.params,...e.parameters}}}static mapJmonSynthType(e){const n=e.toLowerCase();return n.includes("drum")||n.includes("membrane")||n.includes("kick")||n.includes("percussion")?"membraneSynth":n.includes("pluck")||n.includes("string")||n.includes("guitar")?"pluckSynth":n.includes("fm")||n.includes("frequency modulation")?"fmSynth":n.includes("am")||n.includes("amplitude modulation")?"amSynth":"synth"}static inferTrackType(e){return e.audio||e.sample||e.buffer?"audio":e.notes||e.events||e.sequence?e.synth||e.instrument?"instrument":"midi":"instrument"}static inferInstrumentType(e){const n=(e.type||"").toLowerCase();return n.includes("sampler")||e.samples?"sampler":n.includes("drum")||n.includes("percussion")?"drum":n.includes("custom")?"custom":"synth"}static getTrackColor(e){const n=["#3b82f6","#10b981","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#84cc16","#f97316"];return n[e%n.length]}static async importFromUrl(e){try{const n=await fetch(e);if(!n.ok)throw new Error(`HTTP ${n.status}: ${n.statusText}`);const o=await n.json();return await this.importJmonObject(o)}catch(n){throw new Error(`Failed to fetch JMON from ${e}: ${n instanceof Error?n.message:"Unknown error"}`)}}static validateJmon(e){const n=[];return!e||typeof e!="object"?(n.push("JMON must be an object"),{valid:!1,errors:n}):(e.tracks||e.sequences||e.patterns||e.notes||e.events||n.push("JMON must contain tracks, sequences, patterns, notes, or events"),e.tempo&&(typeof e.tempo!="number"||e.tempo<=0)&&n.push("Tempo must be a positive number"),{valid:n.length===0,errors:n})}}const Br="modulepreload",qr=function(t){return"/"+t},hn={},Ct=function(e,n,o){let r=Promise.resolve();if(n&&n.length>0){let a=function(d){return Promise.all(d.map(u=>Promise.resolve(u).then(c=>({status:"fulfilled",value:c}),c=>({status:"rejected",reason:c}))))};document.getElementsByTagName("link");const i=document.querySelector("meta[property=csp-nonce]"),l=i?.nonce||i?.getAttribute("nonce");r=a(n.map(d=>{if(d=qr(d),d in hn)return;hn[d]=!0;const u=d.endsWith(".css"),c=u?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${d}"]${c}`))return;const f=document.createElement("link");if(f.rel=u?"stylesheet":Br,u||(f.as="script"),f.crossOrigin="",f.href=d,l&&f.setAttribute("nonce",l),document.head.appendChild(f),u)return new Promise((p,m)=>{f.addEventListener("load",p),f.addEventListener("error",()=>m(new Error(`Unable to preload CSS for ${d}`)))})}))}function s(a){const i=new Event("vite:preloadError",{cancelable:!0});if(i.payload=a,window.dispatchEvent(i),!i.defaultPrevented)throw a}return r.then(a=>{for(const i of a||[])i.status==="rejected"&&s(i.reason);return e().catch(s)})},Gr=(t,e,n)=>{const o=t[e];return o?typeof o=="function"?o():Promise.resolve(o):new Promise((r,s)=>{(typeof queueMicrotask=="function"?queueMicrotask:setTimeout)(s.bind(null,new Error("Unknown variable dynamic import: "+e+(e.split("/").length!==n?". Note that variables only represent file names one level deep.":""))))})},gn={en:"English",fr:"Français",es:"Español"},[Dr,Vr]=D("en"),[Hr,Xr]=D({}),_t=new Map;async function Yn(t){if(_t.has(t))return _t.get(t);try{const e=await Gr(Object.assign({"../translations/en.json":()=>Ct(()=>import("./en-CiUK-ONS.js"),[]),"../translations/es.json":()=>Ct(()=>import("./es-OgfuS5ni.js"),[]),"../translations/fr.json":()=>Ct(()=>import("./fr-C7WvSr97.js"),[])}),`../translations/${t}.json`,3),n=e.default||e;return _t.set(t,n),n}catch(e){return console.warn(`Failed to load translations for ${t}:`,e),t!=="en"?Yn("en"):{}}}async function Wr(t){try{const e=await Yn(t);Xr(e),Vr(t),typeof localStorage<"u"&&localStorage.setItem("daw-language",t)}catch(e){console.error("Failed to set language:",e)}}function Qr(t){const e=t.split(".");let n=Hr();for(const o of e)if(n&&typeof n=="object"&&o in n)n=n[o];else return t;return typeof n=="string"?n:t}function Kr(t,e){let n=Qr(t);if(e)for(const[o,r]of Object.entries(e))n=n.replace(new RegExp(`{${o}}`,"g"),String(r));return n}function Yr(){return fe(()=>({t:(t,e)=>Kr(t,e),language:Dr()}))}async function Zr(t="en"){let e=t;if(typeof localStorage<"u"){const n=localStorage.getItem("daw-language");n&&n in gn&&(e=n)}if(typeof navigator<"u"){const n=navigator.language.split("-")[0];n in gn&&(e=n)}await Wr(e)}var ei=_('<header class=header><div class=header-left><h1 class=logo>jmonDAW</h1><span class=project-name></span></div><div class=header-center><div class=tempo-display><span class=label>BPM</span><span class=value></span></div><div class=time-signature><span class=label>Time</span><span class=value>/</span></div></div><div class=header-right><div class=zoom-controls><button class=zoom-btn title="Zoom Out"></button><span class=zoom-level>%</span><button class=zoom-btn title="Zoom In"></button></div><div class=menu-container><button class=menu-btn>'),ti=_("<div class=dropdown-menu><div class=menu-section><div class=menu-title>Project</div><button class=menu-item>New Project</button><button class=menu-item>Save Project</button><button class=menu-item>Export Audio</button></div><div class=menu-section><div class=menu-title>Settings</div><button class=menu-item>Audio Settings</button><button class=menu-item>Shortcuts</button></div><div class=menu-section><div class=menu-title>Help</div><button class=menu-item>Help & Docs</button><button class=menu-item>About jmonDAW");const ni=()=>{const{project:t,addTrack:e,addClip:n,setProject:o}=gt(),{transport:r,setTempo:s}=De(),{view:a,setZoom:i,zoomIn:l,zoomOut:d}=bt(),{t:u}=Yr()(),[c,f]=D(!1),p=async k=>{for(const E of k)if(mt.validateFileType(E))try{const I=await mt.handleFile(E);if(I){const M=`${I.name} Track`;e({name:M,type:I.type==="audio"?"audio":"instrument",volume:.8,pan:0,muted:!1,solo:!1,armed:!1,color:I.type==="audio"?"#10b981":"#3b82f6",clips:[],effects:[]});const O=t.tracks[t.tracks.length-1];if(O){const W={name:I.name,start:0,end:I.duration||2,duration:I.duration||2,type:I.type==="jmon"?"midi":I.type,content:I.content,color:I.type==="audio"?"#10b981":"#3b82f6"};n(O.id,W)}}}catch(I){console.error(`Failed to import ${E.name}:`,I)}},m=()=>{Ur.downloadAsJmon(t)},x=async k=>{for(const E of k)if(E.name.endsWith(".jmon")||E.name.endsWith(".json"))try{const I=await E.text(),M=JSON.parse(I),O=await Jr.importJmonObject(M);o(O),s(O.tempo),console.log("Loaded JMON project with tempo:",O.tempo),f(!1);break}catch(I){console.error("Failed to load project:",I)}},$=()=>{if(confirm("Create new project? Unsaved changes will be lost.")){const E={id:crypto.randomUUID(),name:"New Project",tempo:120,timeSignature:[4,4],tracks:[],masterVolume:.8,masterPan:0,masterEffects:[]};o(E),s(E.tempo)}f(!1)},U=()=>{alert("Audio export feature coming soon!"),f(!1)},v=()=>{alert("Audio settings panel coming soon!"),f(!1)},S=()=>{alert(`Keyboard Shortcuts:

SPACE - Play/Pause
R - Record
L - Toggle Loop
Ctrl+S - Save Project
Ctrl+O - Open Project
Ctrl+N - New Project`),f(!1)},T=()=>{window.open("https://github.com/jmon-project/jmon","_blank"),f(!1)},L=()=>{alert(`jmonDAW v1.0

A modern Digital Audio Workstation built with SolidJS and Tone.js.
Supports JMON (JSON Music Object Notation) format.

Built with ❤️ for the jmon project.`),f(!1)};return(()=>{var k=ei(),E=k.firstChild,I=E.firstChild,M=I.nextSibling,O=E.nextSibling,W=O.firstChild,be=W.firstChild,ye=be.nextSibling,wt=W.nextSibling,Le=wt.firstChild,b=Le.nextSibling,N=b.firstChild,Q=O.nextSibling,H=Q.firstChild,X=H.firstChild,j=X.nextSibling,oe=j.firstChild,ne=j.nextSibling,z=H.nextSibling,J=z.firstChild;return h(M,()=>t.name),h(ye,()=>t.tempo),h(b,()=>t.timeSignature[0],N),h(b,()=>t.timeSignature[1],null),_e(X,"click",d),h(X,y(P,{name:"zoom-out",size:14,color:"var(--text-primary)"})),h(j,()=>Math.round(a.zoom*100),oe),_e(ne,"click",l),h(ne,y(P,{name:"zoom-in",size:14,color:"var(--text-primary)"})),J.$$click=()=>f(!c()),h(J,y(P,{name:"menu",color:"var(--text-primary)"})),h(z,(()=>{var Z=st(()=>!!c());return()=>Z()&&(()=>{var ve=ti(),we=ve.firstChild,g=we.firstChild,w=g.nextSibling,C=w.firstChild,A=w.nextSibling,K=A.firstChild,ae=A.nextSibling,Y=ae.firstChild,xe=we.nextSibling,ue=xe.firstChild,ie=ue.nextSibling,$e=ie.firstChild,Se=ie.nextSibling,Xe=Se.firstChild,We=xe.nextSibling,xt=We.firstChild,ke=xt.nextSibling,Qe=ke.firstChild,q=ke.nextSibling,me=q.firstChild;return w.$$click=$,h(w,y(P,{name:"file",size:14,color:"var(--text-primary)"}),C),h(we,y(mn,{onFileSelected:p,icon:"file-plus",variant:"menu",label:"Import Media",class:"menu-item-browser"}),A),h(we,y(mn,{onFileSelected:x,accept:".jmon,.json",multiple:!1,icon:"folder-open",variant:"menu",label:"Open Project",class:"menu-item-browser"}),A),A.$$click=m,h(A,y(P,{name:"save",size:14,color:"var(--text-primary)"}),K),ae.$$click=()=>U(),h(ae,y(P,{name:"download",size:14,color:"var(--text-primary)"}),Y),ie.$$click=()=>v(),h(ie,y(P,{name:"settings",size:14,color:"var(--text-primary)"}),$e),Se.$$click=()=>S(),h(Se,y(P,{name:"keyboard",size:14,color:"var(--text-primary)"}),Xe),ke.$$click=()=>T(),h(ke,y(P,{name:"help-circle",size:14,color:"var(--text-primary)"}),Qe),q.$$click=()=>L(),h(q,y(P,{name:"info",size:14,color:"var(--text-primary)"}),me),ve})()})(),null),k})()},Zn=document.createElement("style");Zn.textContent=`
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  padding: 0 16px;
  font-size: 12px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.logo {
  font-size: 14px;
  font-weight: 700;
  color: var(--accent-primary);
  margin: 0;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.project-name {
  color: var(--text-primary);
  font-size: 12px;
  font-weight: 500;
}

.header-center {
  display: flex;
  gap: 24px;
}

.tempo-display, .time-signature {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  min-width: 40px;
}

.label {
  font-size: 9px;
  color: var(--text-muted);
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.value {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
}

.header-right {
  display: flex;
  gap: 8px;
  align-items: center;
}

.zoom-controls {
  display: flex;
  align-items: center;
  gap: 4px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 2px;
  padding: 2px;
}

.zoom-btn {
  width: 24px;
  height: 24px;
  background: transparent;
  border: none;
  border-radius: 2px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.1s ease;
}

.zoom-btn:hover {
  background: var(--bg-quaternary);
}

.zoom-level {
  font-size: 10px;
  color: var(--text-secondary);
  font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
  min-width: 35px;
  text-align: center;
}

.menu-container {
  position: relative;
}

.menu-btn {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  padding: 6px 8px;
  border-radius: 2px;
  cursor: pointer;
  transition: all 0.1s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 500;
  min-height: 28px;
  min-width: 28px;
}

.menu-btn:hover {
  background: var(--bg-quaternary);
  border-color: var(--border-color-light);
}


.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  box-shadow: var(--shadow);
  min-width: 200px;
  z-index: 1000;
  margin-top: 4px;
}

.menu-section {
  border-bottom: 1px solid var(--border-color);
}

.menu-section:last-child {
  border-bottom: none;
}

.menu-title {
  padding: 8px 12px;
  font-size: 10px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: var(--bg-tertiary);
}

.menu-item {
  width: 100%;
  padding: 8px 12px;
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-size: 12px;
  text-align: left;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background 0.1s ease;
}

.menu-item:hover {
  background: var(--bg-tertiary);
}

.menu-item-browser {
  width: 100%;
  padding: 0;
  background: transparent;
  border: none;
}

.menu-item-browser button {
  width: 100%;
  padding: 8px 12px;
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-size: 12px;
  text-align: left;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background 0.1s ease;
}

.menu-item-browser button:hover {
  background: var(--bg-tertiary);
}
`;document.head.appendChild(Zn);Ie(["click"]);var oi=_('<div class=transport-bar><div class=transport-controls><button class=transport-btn title="Go to Beginning"></button><button title=Record></button><button class=transport-btn title=Stop></button><button></button><button title=Loop></button></div><div class=position-display><span class=time-display>:<!>:</span><span class=bar-display>.<!>.</span></div><div class=transport-info><div class=tempo-control><input type=number min=60 max=200 class=tempo-input><span class=bpm-label>BPM');const ri=()=>{const{transport:t,play:e,stop:n,pause:o,record:r,toggleLoop:s,setTempo:a,setCurrentTime:i}=De();return(()=>{var l=oi(),d=l.firstChild,u=d.firstChild,c=u.nextSibling,f=c.nextSibling,p=f.nextSibling,m=p.nextSibling,x=d.nextSibling,$=x.firstChild,U=$.firstChild,v=U.nextSibling;v.nextSibling;var S=$.nextSibling,T=S.firstChild,L=T.nextSibling;L.nextSibling;var k=x.nextSibling,E=k.firstChild,I=E.firstChild;return u.$$click=()=>{console.log("Home button clicked, resetting to 0"),window.Tone&&(window.Tone.Transport.stop(),window.Tone.Transport.cancel(),window.Tone.Transport.seconds=0,console.log("Transport forced to 0, state:",window.Tone.Transport.state,"time:",window.Tone.Transport.seconds)),i(0)},h(u,y(P,{name:"home",size:16,color:"var(--text-primary)"})),_e(c,"click",r),h(c,y(P,{name:"circle",size:16,get color(){return t.isRecording?"white":"var(--text-primary)"}})),_e(f,"click",n),h(f,y(P,{name:"square",size:16,color:"var(--text-primary)"})),p.$$click=()=>{console.log("Play/Pause button clicked, isPlaying:",t.isPlaying),t.isPlaying?(console.log("Calling pause function"),o()):(console.log("Calling play function"),e())},h(p,y(P,{get name(){return t.isPlaying?"pause":"play"},size:16,get color(){return t.isPlaying?"white":"var(--text-primary)"}})),_e(m,"click",s),h(m,y(P,{name:"repeat",size:16,get color(){return t.isLooping?"white":"var(--text-primary)"}})),h($,()=>Math.floor(t.currentTime/60),U),h($,()=>Math.floor(t.currentTime%60).toString().padStart(2,"0"),v),h($,()=>Math.floor(t.currentTime%1*100).toString().padStart(2,"0"),null),h(S,()=>Math.floor(t.currentTime/4)+1,T),h(S,()=>Math.floor(t.currentTime%4)+1,L),h(S,()=>Math.floor(t.currentTime%1*4)+1,null),I.$$input=M=>a(parseInt(M.currentTarget.value)),F(M=>{var O=`transport-btn ${t.isRecording?"recording":""}`,W=`transport-btn ${t.isPlaying?"playing":""}`,be=t.isPlaying?"Pause":"Play",ye=`transport-btn ${t.isLooping?"active":""}`;return O!==M.e&&te(c,M.e=O),W!==M.t&&te(p,M.t=W),be!==M.a&&ge(p,"title",M.a=be),ye!==M.o&&te(m,M.o=ye),M},{e:void 0,t:void 0,a:void 0,o:void 0}),F(()=>I.value=t.tempo),l})()},eo=document.createElement("style");eo.textContent=`
.transport-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 44px;
  background: var(--bg-tertiary);
  border-bottom: 1px solid var(--border-color);
  padding: 0 16px;
}

.transport-controls {
  display: flex;
  gap: 4px;
  align-items: center;
}

.transport-btn {
  width: 32px;
  height: 32px;
  border-radius: 2px;
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.1s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.transport-btn:hover {
  background: var(--bg-quaternary);
  border-color: var(--border-color-light);
}

.transport-btn.playing {
  background: var(--accent-green);
  border-color: var(--accent-green);
  color: white;
}

.transport-btn.recording {
  background: var(--accent-red);
  border-color: var(--accent-red);
  color: white;
  animation: pulse 1.5s ease-in-out infinite;
}

.transport-btn.active {
  background: var(--accent-primary);
  border-color: var(--accent-primary);
  color: white;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.position-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
  font-weight: 600;
}

.time-display {
  font-size: 14px;
  color: var(--text-primary);
  letter-spacing: 0.5px;
}

.bar-display {
  font-size: 10px;
  color: var(--text-muted);
  letter-spacing: 0.3px;
}

.transport-info {
  display: flex;
  gap: 16px;
  align-items: center;
}

.tempo-control {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--bg-quaternary);
  border: 1px solid var(--border-color);
  border-radius: 2px;
  padding: 4px 6px;
}

.tempo-input {
  width: 50px;
  text-align: center;
  background: transparent;
  border: none;
  color: var(--text-primary);
  padding: 2px 4px;
  font-size: 11px;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
  outline: none;
}

.tempo-input:focus {
  background: var(--bg-tertiary);
  border-radius: 1px;
}

.tempo-input:focus {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 1px var(--accent-primary);
}

.bpm-label {
  color: var(--text-muted);
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
`;document.head.appendChild(eo);Ie(["click","input"]);var ii=_("<div>"),si=_("<div class=drop-zone-content><div class=drop-zone-icon>📁</div><div class=drop-zone-text></div><div class=drop-zone-subtext>Supports: WAV, MP3, OGG, FLAC, MIDI, JMON");const bn=t=>{const[e,n]=D(!1),[o,r]=D(0),{addClip:s}=gt();let a;const i=c=>{c.preventDefault(),c.stopPropagation(),r(f=>f+1),n(!0)},l=c=>{c.preventDefault(),c.stopPropagation(),r(f=>f-1),o()===0&&n(!1)},d=c=>{c.preventDefault(),c.stopPropagation()},u=async c=>{c.preventDefault(),c.stopPropagation(),n(!1),r(0);const f=Array.from(c.dataTransfer?.files||[]);if(f.length!==0){if(t.onFileDrop){t.onFileDrop(f);return}for(const p of f)if(mt.validateFileType(p))try{const m=await mt.handleFile(p);if(m&&t.trackId){const x={name:m.name,start:t.dropPosition||0,end:(t.dropPosition||0)+(m.duration||2),duration:m.duration||2,type:m.type==="jmon"?"midi":m.type,content:m.content,color:m.type==="audio"?"#10b981":"#3b82f6"};s(t.trackId,x)}}catch(m){console.error(`Failed to process file ${p.name}:`,m)}else console.warn(`Unsupported file type: ${p.name}`)}};return Ee(()=>{a&&(a.addEventListener("dragenter",i),a.addEventListener("dragleave",l),a.addEventListener("dragover",d),a.addEventListener("drop",u))}),Rt(()=>{a&&(a.removeEventListener("dragenter",i),a.removeEventListener("dragleave",l),a.removeEventListener("dragover",d),a.removeEventListener("drop",u))}),(()=>{var c=ii(),f=a;return typeof f=="function"?Ge(f,c):a=c,h(c,(()=>{var p=st(()=>!!t.children);return()=>p()?t.children:(()=>{var m=si(),x=m.firstChild,$=x.nextSibling;return h($,()=>e()?"Drop files here":"Drag audio/MIDI/JMON files here"),m})()})()),F(p=>{var m=`drop-zone ${e()?"drag-over":""}`,x=e();return m!==p.e&&te(c,p.e=m),x!==p.t&&ge(c,"data-drag-over",p.t=x),p},{e:void 0,t:void 0}),c})()},to=document.createElement("style");to.textContent=`
.drop-zone {
  position: relative;
  border: 2px dashed #555;
  border-radius: 8px;
  background: rgba(45, 45, 45, 0.5);
  transition: all 0.3s ease;
  min-height: 60px;
}

/* When drop zone has children (track lanes), remove centering layout */
.drop-zone:has(.track-lane) {
  display: block;
  border: none;
  background: transparent;
  margin: 0;
  border-radius: 0;
  min-height: auto;
}

/* Empty drop zone uses flex centering */
.drop-zone:not(:has(.track-lane)) {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 10px;
  min-height: 120px;
}

.drop-zone.drag-over {
  border-color: #3b82f6;
  background: rgba(59, 130, 246, 0.1);
  transform: scale(1.02);
}

.drop-zone-content {
  text-align: center;
  color: #888;
  pointer-events: none;
}

.drop-zone-icon {
  font-size: 2rem;
  margin-bottom: 10px;
}

.drop-zone-text {
  font-size: 1rem;
  font-weight: 500;
  margin-bottom: 5px;
}

.drop-zone.drag-over .drop-zone-text {
  color: #3b82f6;
}

.drop-zone-subtext {
  font-size: 0.8rem;
  color: #666;
}

/* Track-specific drop zones */
.track-lane {
  position: relative;
}

.track-lane::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  border: 2px dashed transparent;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.track-lane[data-drag-over="true"]::after {
  border-color: #3b82f6;
  background: rgba(59, 130, 246, 0.05);
}
`;document.head.appendChild(to);var ai=_("<div class=context-menu-item><span>Duplicate"),li=_("<div class=context-menu-item><span>Copy"),ci=_("<div class=context-menu-item><span>Cut"),di=_('<div class="context-menu-item disabled"><span>Duplicate'),ui=_('<div class="context-menu-item disabled"><span>Copy'),fi=_('<div class="context-menu-item disabled"><span>Cut'),yn=_("<div class=context-menu-separator>"),pi=_("<div class=context-menu-item><span>Set Loop Start Here"),mi=_("<div class=context-menu-item><span>Set Loop End Here"),hi=_('<div class="context-menu-item danger"><span>Delete'),gi=_("<div class=context-menu><div><span>Paste");const bi=t=>{let e;console.log("ContextMenu render:",t.show,t.x,t.y);const n=o=>{e&&!e.contains(o.target)&&t.onClose()};return Ee(()=>{setTimeout(()=>{document.addEventListener("click",n),document.addEventListener("contextmenu",n)},0)}),Rt(()=>{document.removeEventListener("click",n),document.removeEventListener("contextmenu",n)}),y(re,{get when(){return t.show},get children(){var o=gi(),r=o.firstChild,s=r.firstChild,a=e;return typeof a=="function"?Ge(a,o):e=o,h(o,y(re,{get when(){return!t.isTrackContext},get children(){return[(()=>{var i=ai(),l=i.firstChild;return i.$$click=()=>{t.onDuplicate?.(),t.onClose()},h(i,y(P,{name:"copy",size:14,color:"var(--text-primary)"}),l),i})(),(()=>{var i=li(),l=i.firstChild;return i.$$click=()=>{t.onCopy?.(),t.onClose()},h(i,y(P,{name:"copy",size:14,color:"var(--text-primary)"}),l),i})(),(()=>{var i=ci(),l=i.firstChild;return i.$$click=()=>{t.onCut?.(),t.onClose()},h(i,y(P,{name:"scissors",size:14,color:"var(--text-primary)"}),l),i})()]}}),r),h(o,y(re,{get when(){return t.isTrackContext},get children(){return[(()=>{var i=di(),l=i.firstChild;return h(i,y(P,{name:"copy",size:14,color:"var(--text-muted)"}),l),i})(),(()=>{var i=ui(),l=i.firstChild;return h(i,y(P,{name:"copy",size:14,color:"var(--text-muted)"}),l),i})(),(()=>{var i=fi(),l=i.firstChild;return h(i,y(P,{name:"scissors",size:14,color:"var(--text-muted)"}),l),i})()]}}),r),r.$$click=()=>{t.hasClipboard&&(t.onPaste?.(),t.onClose())},h(r,y(P,{name:"clipboard",size:14,get color(){return t.hasClipboard?"var(--text-primary)":"var(--text-muted)"}}),s),h(o,y(re,{get when(){return t.timePosition!==void 0},get children(){return[yn(),(()=>{var i=pi(),l=i.firstChild;return i.$$click=()=>{t.onSetLoopStart?.(t.timePosition),t.onClose()},h(i,y(P,{name:"skip-back",size:14,color:"var(--text-primary)"}),l),i})(),(()=>{var i=mi(),l=i.firstChild;return i.$$click=()=>{t.onSetLoopEnd?.(t.timePosition),t.onClose()},h(i,y(P,{name:"skip-forward",size:14,color:"var(--text-primary)"}),l),i})()]}}),null),h(o,y(re,{get when(){return!t.isTrackContext},get children(){return[yn(),(()=>{var i=hi(),l=i.firstChild;return i.$$click=()=>{t.onDelete?.(),t.onClose()},h(i,y(P,{name:"trash-2",size:14,color:"var(--accent-red)"}),l),i})()]}}),null),F(i=>{var l=`left: ${t.x}px; top: ${t.y}px;`,d=`context-menu-item ${t.hasClipboard?"":"disabled"}`;return i.e=G(o,l,i.e),d!==i.t&&te(r,i.t=d),i},{e:void 0,t:void 0}),o}})},no=document.createElement("style");no.textContent=`
.context-menu {
  position: fixed;
  background: var(--bg-quaternary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  box-shadow: var(--shadow);
  z-index: 2000;
  min-width: 150px;
  padding: 4px 0;
}

.context-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 12px;
  color: var(--text-primary);
  transition: background 0.1s ease;
}

.context-menu-item:hover {
  background: var(--bg-tertiary);
}

.context-menu-item.danger {
  color: var(--accent-red);
}

.context-menu-item.danger:hover {
  background: rgba(214, 118, 118, 0.1);
}

.context-menu-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.context-menu-item.disabled:hover {
  background: transparent;
}

.context-menu-separator {
  height: 1px;
  background: var(--border-color);
  margin: 4px 0;
}
`;document.head.appendChild(no);Ie(["click"]);var yi=_("<div class=loop-region><div class=loop-start-handle></div><div class=loop-end-handle>"),vi=_("<div class=empty-state><p>No tracks yet</p><button>Add First Track"),wi=_("<div class=empty-sequencer>"),xi=_("<div class=track-area><div class=timeline-header><div class=track-header-spacer><h3>Tracks</h3><button class=add-track-btn></button></div><div class=timeline><div class=timeline-ruler><div class=playhead></div></div></div></div><div class=main-content><div class=track-sidebar><div class=track-list></div></div><div class=tracks-container><div class=tracks-playhead>"),$i=_("<div class=bar-marker>"),Si=_('<div class="subdivision-marker half">'),vn=_('<div class="subdivision-marker quarter">'),Ye=_('<div class="subdivision-marker eighth">'),ki=_('<div class=track-item><div class=track-name></div><div class=track-controls><button title=Mute></button><button title=Solo></button><button title="Arm for Recording"></button><div class=synth-selector-container><button class="synth-btn track-btn"></button><div class=synth-dropdown><div class=synth-dropdown-item>Synth</div><div class=synth-dropdown-item>Drum</div><div class=synth-dropdown-item>Pluck</div><div class=synth-dropdown-item>FM Synth</div><div class=synth-dropdown-item>AM Synth</div></div></div></div><div class=track-volume><input type=range min=0 max=1 step=0.01 class=volume-slider>'),Ti=_("<div class=track-lane><div class=track-clips>"),Ci=_("<div class=clip-waveform>"),_i=_("<div class=clip><div class=clip-name>"),Ai=_("<div class=waveform-bar>");const Ei=()=>{const{project:t,addTrack:e,removeClip:n,updateClip:o,addClip:r,updateTrack:s}=gt(),{view:a}=bt(),i=()=>a.zoom*200,l=b=>{const N=c.tempo;return b*(N/60)},d=()=>{let b=c.loopStart;if(a.snapToGrid){const N=a.gridSize;b=Math.round(b/N)*N}return b},u=()=>{let b=c.loopEnd;if(a.snapToGrid){const N=a.gridSize;b=Math.round(b/N)*N}return b},{transport:c,setLoopStart:f,setLoopEnd:p}=De();D(!1);const[m,x]=D({show:!1,x:0,y:0,clip:null,trackId:null}),[$,U]=D(null),[v,S]=D({clip:null,startX:0,startTime:0}),[T,L]=D({active:!1,type:null,startX:0,startLoopStart:0,startLoopEnd:0}),k=()=>{e({name:`Track ${t.tracks.length+1}`,type:"instrument",volume:.8,pan:0,muted:!1,solo:!1,armed:!1,color:"#3b82f6",clips:[],effects:[]})},E=(b,N)=>{console.log("handleClipRightClick called",N.name,b.clientX,b.clientY),b.preventDefault(),b.stopPropagation(),x({show:!0,x:b.clientX,y:b.clientY,clip:N,trackId:null,timePosition:void 0})},I=(b,N)=>{console.log("handleTrackRightClick called",N,b.clientX,b.clientY),b.preventDefault(),b.stopPropagation();const H=b.currentTarget.getBoundingClientRect(),j=(b.clientX-H.left)/i();x({show:!0,x:b.clientX,y:b.clientY,clip:null,trackId:N,timePosition:j})},M=()=>{const b=m().clip;if(b){const N={name:`${b.name} (Copy)`,start:b.start+b.duration,end:b.start+b.duration*2,duration:b.duration,type:b.type,content:b.content,color:b.color};r(b.trackId,N)}},O=()=>{U(m().clip)},W=()=>{const b=m().clip;b&&(U(b),n(b.id))},be=()=>{const b=m().clip;b&&n(b.id)},ye=()=>{const b=$(),N=m(),Q=N.trackId;if(b&&Q){const H=N.timePosition||0;let X=H;if(a.snapToGrid){const oe=a.gridSize;X=Math.round(H/oe)*oe}const j={name:`${b.name} (Pasted)`,start:Math.max(0,X),end:Math.max(0,X)+b.duration,duration:b.duration,type:b.type,content:b.content,color:b.color};r(Q,j)}},wt=(b,N)=>{if(b.button===0){b.preventDefault(),S({clip:N,startX:b.clientX,startTime:N.start});const Q=X=>{const j=v();if(j.clip){let ne=(X.clientX-j.startX)/i(),z=Math.max(0,j.startTime+ne);if(a.snapToGrid){const J=a.gridSize;z=Math.round(z/J)*J}o(j.clip.id,{start:z,end:z+j.clip.duration})}},H=()=>{S({clip:null,startX:0,startTime:0}),document.removeEventListener("mousemove",Q),document.removeEventListener("mouseup",H)};document.addEventListener("mousemove",Q),document.addEventListener("mouseup",H)}},Le=(b,N)=>{b.preventDefault(),b.stopPropagation(),L({active:!0,type:N,startX:b.clientX,startLoopStart:c.loopStart,startLoopEnd:c.loopEnd});const Q=X=>{const j=T();if(!j.active)return;const ne=(X.clientX-j.startX)/i();if(j.type==="start"){let z=j.startLoopStart+ne;if(a.snapToGrid){const J=a.gridSize;z=Math.round(z/J)*J,z=Math.max(0,z);const Z=c.loopEnd-J;z>Z&&(z=Z)}else z=Math.max(0,Math.min(z,c.loopEnd-.25));f(z)}else if(j.type==="end"){let z=j.startLoopEnd+ne;if(a.snapToGrid){const J=a.gridSize;z=Math.round(z/J)*J;const Z=c.loopStart+J;z<Z&&(z=Z)}else z=Math.max(c.loopStart+.25,z);p(z)}else if(j.type==="region"){const z=j.startLoopEnd-j.startLoopStart;let J=Math.max(0,j.startLoopStart+ne);if(a.snapToGrid){const Z=a.gridSize;J=Math.round(J/Z)*Z}f(J),p(J+z)}},H=()=>{L({active:!1,type:null,startX:0,startLoopStart:0,startLoopEnd:0}),document.removeEventListener("mousemove",Q),document.removeEventListener("mouseup",H)};document.addEventListener("mousemove",Q),document.addEventListener("mouseup",H)};return(()=>{var b=xi(),N=b.firstChild,Q=N.firstChild,H=Q.firstChild,X=H.nextSibling,j=Q.nextSibling,oe=j.firstChild,ne=oe.firstChild,z=N.nextSibling,J=z.firstChild,Z=J.firstChild,ve=J.nextSibling,we=ve.firstChild;return X.$$click=k,h(X,y(P,{name:"plus",size:14,color:"white"})),oe.$$contextmenu=g=>{g.preventDefault();const w=g.currentTarget.getBoundingClientRect(),A=g.clientX-w.left;x({show:!0,x:g.clientX,y:g.clientY,clip:null,trackId:null,timePosition:A})},h(oe,y(ze,{get each(){return Array.from({length:32},(g,w)=>w+1)},children:g=>[(()=>{var w=$i();return h(w,g),F(C=>G(w,`left: ${g*i()}px`,C)),w})(),(()=>{var w=Si();return F(C=>G(w,`left: ${g*i()+i()/2}px`,C)),w})(),(()=>{var w=vn();return F(C=>G(w,`left: ${g*i()+i()/4}px`,C)),w})(),(()=>{var w=vn();return F(C=>G(w,`left: ${g*i()+i()*3/4}px`,C)),w})(),(()=>{var w=Ye();return F(C=>G(w,`left: ${g*i()+i()/8}px`,C)),w})(),(()=>{var w=Ye();return F(C=>G(w,`left: ${g*i()+i()*3/8}px`,C)),w})(),(()=>{var w=Ye();return F(C=>G(w,`left: ${g*i()+i()*5/8}px`,C)),w})(),(()=>{var w=Ye();return F(C=>G(w,`left: ${g*i()+i()*7/8}px`,C)),w})()]}),ne),h(oe,y(re,{get when(){return c.isLooping},get children(){var g=yi(),w=g.firstChild,C=w.nextSibling;return g.$$mousedown=A=>Le(A,"region"),w.$$mousedown=A=>Le(A,"start"),C.$$mousedown=A=>Le(A,"end"),F(A=>G(g,`
                  left: ${d()*i()}px; 
                  width: ${(u()-d())*i()}px;
                `,A)),g}}),ne),h(Z,y(re,{get when(){return t.tracks.length===0},get children(){var g=vi(),w=g.firstChild,C=w.nextSibling;return C.$$click=k,g}}),null),h(Z,y(ze,{get each(){return t.tracks},children:g=>(()=>{var w=ki(),C=w.firstChild,A=C.nextSibling,K=A.firstChild,ae=K.nextSibling,Y=ae.nextSibling,xe=Y.nextSibling,ue=xe.firstChild,ie=ue.nextSibling,$e=ie.firstChild,Se=$e.nextSibling,Xe=Se.nextSibling,We=Xe.nextSibling,xt=We.nextSibling,ke=A.nextSibling,Qe=ke.firstChild;return h(C,()=>g.name),h(K,y(P,{name:"volume-x",size:12,get color(){return g.muted?"white":"var(--text-secondary)"}})),h(ae,y(P,{name:"headphones",size:12,get color(){return g.solo?"white":"var(--text-secondary)"}})),h(Y,y(P,{name:"circle",size:12,get color(){return g.armed?"white":"var(--text-secondary)"}})),ue.$$click=()=>{const q=document.querySelector(`#synth-dropdown-${g.id}`);document.querySelectorAll(".synth-dropdown").forEach(Ke=>Ke.classList.remove("show")),q&&q.classList.toggle("show")},h(ue,y(P,{name:"plug",size:12,color:"var(--text-secondary)"})),$e.$$click=()=>{s(g.id,{instrument:{id:`${g.id}-synth`,name:"Synth",type:"synth",parameters:{}}}),document.querySelector(`#synth-dropdown-${g.id}`)?.classList.remove("show")},Se.$$click=()=>{s(g.id,{instrument:{id:`${g.id}-membraneSynth`,name:"Drum",type:"membraneSynth",parameters:{}}}),document.querySelector(`#synth-dropdown-${g.id}`)?.classList.remove("show")},Xe.$$click=()=>{s(g.id,{instrument:{id:`${g.id}-pluckSynth`,name:"Pluck",type:"pluckSynth",parameters:{}}}),document.querySelector(`#synth-dropdown-${g.id}`)?.classList.remove("show")},We.$$click=()=>{s(g.id,{instrument:{id:`${g.id}-fmSynth`,name:"FM Synth",type:"fmSynth",parameters:{}}}),document.querySelector(`#synth-dropdown-${g.id}`)?.classList.remove("show")},xt.$$click=()=>{s(g.id,{instrument:{id:`${g.id}-amSynth`,name:"AM Synth",type:"amSynth",parameters:{}}}),document.querySelector(`#synth-dropdown-${g.id}`)?.classList.remove("show")},Qe.$$input=q=>{const me=parseFloat(q.currentTarget.value);s(g.id,{volume:me})},F(q=>{var me=`track-btn mute ${g.muted?"active":""}`,Ke=`track-btn solo ${g.solo?"active":""}`,Vt=`track-btn arm ${g.armed?"active":""}`,Ht=`Synth: ${g.instrument?.name||"Synth"}`,Xt=`synth-dropdown-${g.id}`;return me!==q.e&&te(K,q.e=me),Ke!==q.t&&te(ae,q.t=Ke),Vt!==q.a&&te(Y,q.a=Vt),Ht!==q.o&&ge(ue,"title",q.o=Ht),Xt!==q.i&&ge(ie,"id",q.i=Xt),q},{e:void 0,t:void 0,a:void 0,o:void 0,i:void 0}),F(()=>Qe.value=g.volume),w})()}),null),h(ve,y(re,{get when(){return t.tracks.length===0},get children(){var g=wi();return h(g,y(bn,{onFileDrop:w=>{w.forEach((C,A)=>{const K=`Track ${t.tracks.length+A+1}`;e({name:K,type:C.type.startsWith("audio/")?"audio":"instrument",volume:.8,pan:0,muted:!1,solo:!1,armed:!1,color:"#3b82f6",clips:[],effects:[]})})}})),g}}),null),h(ve,y(ze,{get each(){return t.tracks},children:g=>y(bn,{get trackId(){return g.id},get children(){var w=Ti(),C=w.firstChild;return w.$$contextmenu=A=>I(A,g.id),h(C,y(ze,{get each(){return g.clips},children:A=>(()=>{var K=_i(),ae=K.firstChild;return K.$$mousedown=Y=>wt(Y,A),K.$$contextmenu=Y=>E(Y,A),h(ae,()=>A.name),h(K,y(re,{get when(){return A.content.type==="audio"&&A.content.waveform},get children(){var Y=Ci();return h(Y,y(ze,{get each(){return A.content.waveform},children:(xe,ue)=>(()=>{var ie=Ai();return F($e=>G(ie,`height: ${xe*100}%; left: ${ue()*2}px`,$e)),ie})()})),Y}}),null),F(Y=>G(K,`left: ${A.start*i()}px; width: ${Math.max(A.duration*i(),30)}px; background-color: ${A.color}; top: 2px; height: 56px; z-index: 10; border: 1px solid white; cursor: ${v().clip?.id===A.id?"grabbing":"grab"};`,Y)),K})()})),w}})}),null),h(b,y(re,{get when(){return m().show},get children(){return y(bi,{show:!0,get x(){return m().x},get y(){return m().y},onClose:()=>x({show:!1,x:0,y:0,clip:null,trackId:null,timePosition:void 0}),onDuplicate:M,onCopy:O,onCut:W,onPaste:ye,onDelete:be,get isTrackContext(){return m().trackId!==null},get hasClipboard(){return $()!==null},get timePosition(){return m().timePosition},onSetLoopStart:g=>{let w=g/i();if(a.snapToGrid){const C=a.gridSize;w=Math.round(w/C)*C}f(w)},onSetLoopEnd:g=>{let w=g/i();if(a.snapToGrid){const C=a.gridSize;w=Math.round(w/C)*C}p(w)}})}}),null),F(g=>{var w=`--timeline-scale: ${i()}px`,C=`left: ${l(c.currentTime)*i()}px`,A=`left: ${l(c.currentTime)*i()}px`;return g.e=G(b,w,g.e),g.t=G(ne,C,g.t),g.a=G(we,A,g.a),g},{e:void 0,t:void 0,a:void 0}),b})()},oo=document.createElement("style");oo.textContent=`
.track-area {
  display: flex;
  flex-direction: column;
  flex: 1;
  height: 100%;
}

.timeline-header {
  display: flex;
  height: 40px;
  border-bottom: 1px solid var(--border-color);
}

.track-header-spacer {
  width: 250px;
  background: var(--bg-quaternary);
  border-right: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  box-sizing: border-box;
}

.track-header-spacer h3 {
  margin: 0;
  color: var(--text-primary);
}

.main-content {
  display: flex;
  flex: 1;
}

.track-sidebar {
  width: 250px;
  background: var(--bg-quaternary);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.tracks-container {
  flex: 1;
  overflow: auto;
  background: var(--bg-primary);
  position: relative;
}

.track-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  border-bottom: 1px solid var(--border-color);
  height: 40px;
  box-sizing: border-box;
}

.track-header h3 {
  margin: 0;
  color: var(--text-primary);
}

.add-track-btn {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: var(--accent-primary);
  border: none;
  color: white;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.1s ease;
}

.add-track-btn:hover {
  background: var(--accent-primary-hover);
}

.track-list {
  flex: 1;
  overflow-y: auto;
}

.empty-state {
  padding: 20px;
  text-align: center;
  color: var(--text-muted);
}

.track-item {
  padding: 15px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.track-name {
  font-weight: bold;
  color: var(--text-primary);
  font-size: 0.9rem;
}

.synth-selector-container {
  position: relative;
}

.synth-btn {
  width: 25px;
  height: 25px;
  border-radius: 3px;
  border: 1px solid var(--border-color-light);
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.synth-btn:hover {
  background: var(--bg-quaternary);
}

.synth-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  background: var(--bg-quaternary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  box-shadow: var(--shadow);
  min-width: 80px;
  z-index: 1000;
  margin-top: 2px;
  display: none;
}

.synth-dropdown.show {
  display: block;
}

.synth-dropdown-item {
  padding: 6px 10px;
  font-size: 11px;
  cursor: pointer;
  transition: background 0.1s ease;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-color);
}

.synth-dropdown-item:last-child {
  border-bottom: none;
}

.synth-dropdown-item:hover {
  background: var(--bg-tertiary);
}

.track-controls {
  display: flex;
  gap: 5px;
}

.track-btn {
  width: 25px;
  height: 25px;
  border-radius: 3px;
  border: 1px solid var(--border-color-light);
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.track-btn:hover {
  background: var(--bg-quaternary);
}

.track-btn.active {
  background: var(--accent-red);
  border-color: var(--accent-red);
  color: #fff;
}

.volume-slider {
  width: 100%;
  height: 4px;
  background: #444;
  border-radius: 0;
  outline: none;
  -webkit-appearance: none;
  box-shadow: none;
}

.volume-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 0;
  background: var(--accent-primary);
  cursor: pointer;
  box-shadow: none;
}

.sequencer-area {
  display: flex;
  flex: 1;
  background: var(--bg-primary);
  overflow: hidden;
}

.timeline {
  height: 40px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  position: relative;
  overflow-x: auto;
}

.timeline-ruler {
  height: 100%;
  position: relative;
  min-width: 6400px;
}

.bar-marker {
  position: absolute;
  top: 0;
  height: 100%;
  border-left: 2px solid var(--border-color-light);
  padding-left: 5px;
  padding-top: 5px;
  font-size: 0.8rem;
  color: var(--text-muted);
  font-weight: 600;
}

.subdivision-marker {
  position: absolute;
  top: 0;
  height: 100%;
  border-left: 1px solid var(--border-color);
}

.subdivision-marker.half {
  border-left-color: var(--border-color-light);
  opacity: 0.7;
}

.subdivision-marker.quarter {
  opacity: 0.5;
}

.subdivision-marker.eighth {
  opacity: 0.3;
  top: 50%;
  height: 50%;
}

.tracks-container {
  flex: 1;
  overflow: auto;
}

.empty-sequencer {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-muted);
}

.timeline {
  flex: 1;
  background: var(--bg-secondary);
  position: relative;
  overflow-x: auto;
}

.track-lane {
  height: 60px;
  border-bottom: 1px solid var(--border-color);
  position: relative;
  background: linear-gradient(90deg, transparent 0%, transparent calc(var(--timeline-scale, 200px) - 1px), var(--bg-secondary) calc(var(--timeline-scale, 200px) - 1px), var(--bg-secondary) var(--timeline-scale, 200px));
  background-size: var(--timeline-scale, 200px) 100%;
}

.track-clips {
  height: 100%;
  position: relative;
}

.clip {
  position: absolute;
  top: 2px;
  height: 56px;
  background: #3b82f6;
  border-radius: 2px;
  padding: 8px;
  font-size: 0.8rem;
  color: white;
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.2);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  box-shadow: none;
}

.playhead {
  position: absolute;
  top: 0;
  width: 2px;
  height: 100%;
  background: var(--accent-primary);
  z-index: 1000;
  pointer-events: none;
}

.tracks-playhead {
  position: absolute;
  top: 0;
  width: 2px;
  height: 100%;
  background: var(--accent-primary);
  z-index: 1000;
  pointer-events: none;
}

.loop-region {
  position: absolute;
  top: 0;
  height: 100%;
  background: rgba(206, 145, 135, 0.2);
  border: 2px solid var(--accent-primary);
  border-radius: 4px;
  z-index: 800;
  cursor: grab;
}

.loop-region:active {
  cursor: grabbing;
}

.loop-start-handle, .loop-end-handle {
  position: absolute;
  top: 0;
  width: 8px;
  height: 100%;
  background: var(--accent-primary);
  cursor: ew-resize;
  z-index: 850;
}

.loop-start-handle {
  left: -4px;
  border-radius: 4px 0 0 4px;
}

.loop-end-handle {
  right: -4px;
  border-radius: 0 4px 4px 0;
}

.loop-start-handle:hover, .loop-end-handle:hover {
  background: var(--accent-primary-hover);
}

.clip:hover {
  filter: brightness(1.1);
}

.clip-name {
  position: absolute;
  top: 2px;
  left: 8px;
  font-size: 0.75rem;
  font-weight: bold;
  z-index: 2;
  pointer-events: none;
}

.clip-waveform {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 20px;
  display: flex;
  align-items: end;
  opacity: 0.6;
}

.waveform-bar {
  position: absolute;
  bottom: 0;
  width: 1px;
  background: rgba(255, 255, 255, 0.8);
  min-height: 1px;
}
`;document.head.appendChild(oo);Ie(["click","contextmenu","mousedown","input"]);var Pi=_("<div class=snap-menu>"),Ii=_('<div class=status-bar><div class=status-left><span class=status-item>Tracks: </span><span class=status-item></span><div class=snap-control><button title="Toggle Snap"><span>Snap</span></button><div style=position:relative;display:inline-block;><button class=snap-resolution title="Snap Resolution"></button></div></div></div><div class=status-center><span class=status-item></span></div><div class=status-right><span class=status-item>CPU: 12%</span><span class=status-item>RAM: 2.1GB'),Li=_("<div>");const zi=()=>{const{project:t}=gt(),{transport:e}=De(),{view:n,toggleSnapToGrid:o,setGridSize:r}=bt(),[s,a]=D(!1),[i,l]=D({top:"100%",left:"0",transform:""});let d;const u=()=>{if(!d)return;const p=d.getBoundingClientRect(),m=200,x=window.innerHeight;let $="100%",U="0",v="";p.bottom+m>x?($="auto",v="translateY(-100%)",l({top:"auto",left:U,transform:"translateY(-100%)"})):l({top:$,left:U,transform:v})},c=[{label:"1/1",value:1},{label:"1/2",value:.5},{label:"1/4",value:.25},{label:"1/8",value:.125},{label:"1/16",value:.0625},{label:"1/32",value:.03125}],f=()=>{const p=c.find(m=>m.value===n.gridSize);return p?p.label:"1/4"};return(()=>{var p=Ii(),m=p.firstChild,x=m.firstChild;x.firstChild;var $=x.nextSibling,U=$.nextSibling,v=U.firstChild,S=v.firstChild,T=v.nextSibling,L=T.firstChild,k=m.nextSibling,E=k.firstChild;h(x,()=>t.tracks.length,null),h($,()=>e.isPlaying?"Playing":e.isRecording?"Recording":"Stopped"),_e(v,"click",o),h(v,y(P,{name:"magnet",size:12,get color(){return n.snapToGrid?"white":"var(--text-secondary)"}}),S),L.$$click=()=>{s()||u(),a(!s())};var I=d;return typeof I=="function"?Ge(I,L):d=L,h(L,f,null),h(L,y(P,{name:"chevron-down",size:10,color:"var(--text-secondary)"}),null),h(T,y(re,{get when(){return s()},get children(){var M=Pi();return h(M,()=>c.map(O=>(()=>{var W=Li();return W.$$click=()=>{r(O.value),a(!1)},h(W,()=>O.label),F(()=>te(W,`snap-menu-item ${n.gridSize===O.value?"active":""}`)),W})())),F(O=>G(M,`top: ${i().top}; left: ${i().left}; transform: ${i().transform};`,O)),M}}),null),h(E,()=>t.name),F(()=>te(v,`snap-toggle ${n.snapToGrid?"active":""}`)),p})()},ro=document.createElement("style");ro.textContent=`
.status-bar {
  height: 30px;
  background: #2d2d2d;
  border-top: 1px solid #444;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  font-size: 0.8rem;
  color: #ccc;
}

.status-left, .status-center, .status-right {
  display: flex;
  gap: 20px;
}

.status-item {
  white-space: nowrap;
}

.status-center {
  flex: 1;
  justify-content: center;
}

.snap-control {
  display: flex;
  gap: 2px;
  position: relative;
}

.snap-toggle, .snap-resolution {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  background: var(--bg-quaternary);
  border: 1px solid var(--border-color);
  border-radius: 2px;
  color: var(--text-secondary);
  font-size: 10px;
  cursor: pointer;
  transition: all 0.1s ease;
}

.snap-toggle:hover, .snap-resolution:hover {
  background: var(--bg-tertiary);
}

.snap-toggle.active {
  background: var(--accent-primary);
  color: white;
}

.snap-menu {
  position: absolute;
  top: 100%;
  left: 0;
  background: var(--bg-quaternary);
  border: 1px solid var(--border-color);
  border-radius: 2px;
  z-index: 1000;
  min-width: 60px;
}

.snap-menu-item {
  padding: 4px 8px;
  font-size: 10px;
  cursor: pointer;
  transition: background 0.1s ease;
}

.snap-menu-item:hover {
  background: var(--bg-tertiary);
}

.snap-menu-item.active {
  background: var(--accent-primary);
  color: white;
}
`;document.head.appendChild(ro);Ie(["click"]);const Mi=()=>{const{transport:t,play:e,pause:n,setCurrentTime:o,toggleLoop:r,setLoopStart:s,setLoopEnd:a}=De(),{view:i}=bt();return Ee(()=>{const l=d=>{if(!(d.target instanceof HTMLInputElement||d.target instanceof HTMLTextAreaElement))switch(d.code){case"Space":d.preventDefault(),t.isPlaying?n():e();break;case"Home":d.preventDefault(),o(0),console.log("Home key pressed: reset to time 0, play state:",t.isPlaying?"playing":"stopped/paused");break;case"KeyL":d.preventDefault(),r(),console.log("L key pressed: toggle loop mode, now:",t.isLooping?"off":"on");break;case"BracketLeft":d.preventDefault();let u=t.currentTime;if(i.snapToGrid){const f=i.gridSize;u=Math.round(u/f)*f}s(u),console.log("[ key pressed: set loop start at",u,"(snap:",i.snapToGrid?"on":"off",")");break;case"BracketRight":d.preventDefault();let c=t.currentTime;if(i.snapToGrid){const f=i.gridSize;c=Math.round(c/f)*f}a(c),console.log("] key pressed: set loop end at",c,"(snap:",i.snapToGrid?"on":"off",")");break}};return document.addEventListener("keydown",l),()=>{document.removeEventListener("keydown",l)}}),null};var Oi=_("<div class=main-layout><div class=content-area>");const Ni=t=>(Ee(async()=>{await Zr()}),(()=>{var e=Oi(),n=e.firstChild;return h(e,y(Mi,{}),n),h(e,y(ni,{}),n),h(e,y(ri,{}),n),h(n,y(Ei,{})),h(e,y(zi,{}),null),e})()),io=document.createElement("style");io.textContent=`
.main-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
}

.content-area {
  flex: 1;
  display: flex;
  overflow: hidden;
  background: #1e1e1e;
}
`;document.head.appendChild(io);var Fi=_("<div class=app>");const ji=()=>(Ee(()=>{const t=n=>(n.preventDefault(),n.returnValue="Are you sure you want to leave? Your work may be lost.",n.returnValue),e=n=>confirm("Are you sure you want to leave? Your work may be lost.")?!0:(window.history.pushState(null,"",window.location.href),n.preventDefault(),!1);return window.addEventListener("beforeunload",t),window.addEventListener("popstate",e),window.history.pushState(null,"",window.location.href),()=>{window.removeEventListener("beforeunload",t),window.removeEventListener("popstate",e)}}),y(Mo,{get children(){var t=Fi();return h(t,y(Ni,{})),t}}));To(()=>y(ji,{}),document.getElementById("root"));
