import {API_BASE_URL} from './config.js?v=2a-comfort';
export function qualificationRank(score,rows){const rank=rows.filter(r=>r.score>=score).length+1;return rank<=10?rank:null;}
export const safeStorage={getItem(key){try{return globalThis.localStorage?.getItem(key)??null;}catch{return null;}},setItem(key,value){try{globalThis.localStorage?.setItem(key,value);return true;}catch{return false;}}};
export class ArcadeAPI{
 constructor({base=API_BASE_URL,storage=safeStorage,fetcher=globalThis.fetch?.bind(globalThis)}={}){this.base=base.replace(/\/$/,'');this.storage=storage;this.fetcher=fetcher;this.retrying=false;}
 async request(path,body){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),4500);try{const r=await this.fetcher(this.base+path,{method:body?'POST':'GET',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined,signal:controller.signal,credentials:'omit',cache:'no-store'});if(!r.ok){const e=new Error('排行榜暫時無法使用。');e.status=r.status;throw e;}return await r.json();}finally{clearTimeout(timer);}}
 async leaderboard(){const data=await this.request('/api/leaderboard/breakout');if(!Array.isArray(data.scores))throw Error('排行榜回應格式無效');return data.scores.slice(0,10).filter(r=>/^[A-Z0-9]{3}$/.test(r.initials)&&Number.isSafeInteger(r.score)&&Number.isInteger(r.level));}
 pending(){try{const a=JSON.parse(this.storage.getItem('pendingScores')||'[]');return Array.isArray(a)?a.slice(-20):[];}catch{return [];}}
 savePending(rows){return this.storage.setItem('pendingScores',JSON.stringify(rows));}
 async submit(run){try{return await this.request('/api/scores',run);}catch(e){if(e.status>=400&&e.status<500&&e.status!==429)return {rejected:true,message:'分數未通過伺服器驗證。'};const rows=this.pending();if(!rows.some(r=>r.run?.run_id===run.run_id))rows.push({run,attempts:0,createdAt:Date.now()});const saved=this.savePending(rows.slice(-20));return {pending:true,saved:saved!==false};}}
 async retryPending(){if(this.retrying)return;this.retrying=true;try{const rows=this.pending(),keep=[];let budget=3;for(const item of rows){if(item.attempts>=3||budget<=0){keep.push(item);continue;}budget--;try{await this.request('/api/scores',item.run);}catch(e){if(!(e.status>=400&&e.status<500&&e.status!==429))keep.push({...item,attempts:item.attempts+1});}}this.savePending(keep);}finally{this.retrying=false;}}
}
