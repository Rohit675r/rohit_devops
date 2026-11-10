import express from 'express';
import client from 'prom-client';
import crypto from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import catalog from '../catalog.json' with {type:'json'};
import {priceOrder} from './order.js';
export function createApp(store){
 const app=express();app.disable('x-powered-by');app.use(express.json({limit:'16kb'}));
 const registry=new client.Registry();client.collectDefaultMetrics({register:registry});
 const requests=new client.Counter({name:'shop_http_requests_total',help:'HTTP requests',labelNames:['method','route','status'],registers:[registry]});
 app.use((req,res,next)=>{const start=Date.now();res.on('finish',()=>{requests.inc({method:req.method,route:req.route?.path||'unmatched',status:String(res.statusCode)});if(process.env.NODE_ENV!=='test')console.log(JSON.stringify({time:new Date().toISOString(),method:req.method,route:req.route?.path||'unmatched',status:res.statusCode,durationMs:Date.now()-start}));});next();});
 app.get('/health',async(req,res)=>{try{await store.ping();res.json({status:'ok',app:catalog.slug,storage:store.mode,release:process.env.RELEASE_COLOR||'local'});}catch{res.status(503).json({status:'unavailable'});}});
 app.get('/metrics',async(req,res)=>{res.type(registry.contentType).send(await registry.metrics());});
 app.get('/api/products',(req,res)=>res.json(catalog.products));
 app.post('/api/orders',async(req,res,next)=>{let order;try{order=priceOrder(req.body);}catch(e){return res.status(400).json({error:e.message});}try{const saved=await store.save({...order,id:crypto.randomUUID(),createdAt:new Date().toISOString()});res.status(201).json({id:saved.id,total:saved.total,status:saved.status});}catch(e){next(e);}});
 app.use('/api',(req,res)=>res.status(404).json({error:'API route not found'}));
 app.use(express.static(path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../dist')));
 app.use((err,req,res,next)=>{if(err instanceof SyntaxError && err.status===400)return res.status(400).json({error:'Invalid JSON.'});console.error(JSON.stringify({event:'request_error',type:err.name}));res.status(500).json({error:'Unable to process request. Please try again.'});});
 return app;
}