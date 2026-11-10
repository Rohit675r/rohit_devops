import mongoose from 'mongoose';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createApp} from './app.js';
const localFile=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../data/orders.json');
let store;
if(process.env.MONGODB_URI){
 await mongoose.connect(process.env.MONGODB_URI,{serverSelectionTimeoutMS:10000});
 const Order=mongoose.model('Order',new mongoose.Schema({id:{type:String,unique:true},name:String,email:String,items:[mongoose.Schema.Types.Mixed],subtotal:Number,extra:Number,total:Number,status:String,createdAt:String}));
 store={mode:'mongodb',ping:()=>mongoose.connection.db.admin().ping(),save:order=>Order.create(order)};
}else{
 let queue=Promise.resolve();
 store={mode:'local-demo',ping:async()=>{},save:order=>{const result=queue.then(async()=>{await fs.mkdir(path.dirname(localFile),{recursive:true});let orders=[];try{orders=JSON.parse(await fs.readFile(localFile,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}orders.push(order);const tmp=localFile+'.tmp';await fs.writeFile(tmp,JSON.stringify(orders,null,2));await fs.rename(tmp,localFile);return order;});queue=result.catch(()=>{});return result;}};
 console.log('Local demo storage active. Set MONGODB_URI to use MongoDB. Do not enter real personal information.');
}
const port=Number(process.env.PORT)||4202;const server=createApp(store).listen(port,'0.0.0.0',()=>console.log('VoltCart API listening on '+port));
for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>{const timeout=setTimeout(()=>process.exit(1),10000);timeout.unref();server.close(async()=>{await mongoose.disconnect();process.exit(0);});});
