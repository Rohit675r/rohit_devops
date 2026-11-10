import {jest} from '@jest/globals';
import request from 'supertest';
import {createApp} from '../server/app.js';
import {priceOrder} from '../server/order.js';
import catalog from '../catalog.json' with {type:'json'};
const valid=()=>({name:'Demo User',email:'demo@example.com',items:[{id:catalog.products[0].id,quantity:2}]});
describe('Checkout trust boundary',()=>{
 test('server computes amount and ignores client price',()=>{const b=valid();b.items[0].price=1;expect(priceOrder(b).total).toBe(catalog.products[0].price*2);});
 test('optional service uses server fee',()=>expect(priceOrder({...valid(),extra:true}).total).toBe(catalog.products[0].price*2+catalog.extra));
 test.each([null,{}, {...valid(),items:[]},{...valid(),name:'x'},{...valid(),email:'invalid'},{...valid(),items:[{id:'missing',quantity:1}]},{...valid(),items:[{id:catalog.products[0].id,quantity:-1}]},{...valid(),items:[{id:catalog.products[0].id,quantity:1.5}]},{...valid(),items:[{id:catalog.products[0].id,quantity:999}]}])('rejects malformed checkout %j',body=>expect(()=>priceOrder(body)).toThrow());
 test('rejects duplicate product lines',()=>{const b=valid();b.items.push(b.items[0]);expect(()=>priceOrder(b)).toThrow();});
});
describe('Application API',()=>{
 const store={mode:'test',ping:async()=>{},save:async o=>o};const app=createApp(store);
 test('serves the correct catalog',async()=>{const r=await request(app).get('/api/products');expect(r.status).toBe(200);expect(r.body).toHaveLength(6);expect(r.body[0].id).toContain(catalog.slug);});
 test('health reflects database availability',async()=>{expect((await request(app).get('/health')).status).toBe(200);const down=createApp({...store,ping:async()=>{throw Error('offline');}});expect((await request(down).get('/health')).status).toBe(503);});
 test('records valid order',async()=>{const r=await request(app).post('/api/orders').send(valid());expect(r.status).toBe(201);expect(r.body.id).toMatch(/^[a-f0-9-]{36}$/);expect(r.body.total).toBe(catalog.products[0].price*2);});
 test('invalid order never reaches storage',async()=>{const save=jest.fn();const r=await request(createApp({...store,save})).post('/api/orders').send({});expect(r.status).toBe(400);expect(save).not.toHaveBeenCalled();});
 test('storage failure returns safe error',async()=>{const broken=createApp({...store,save:async()=>{throw Error('database-secret');}});const r=await request(broken).post('/api/orders').send(valid());expect(r.status).toBe(500);expect(r.text).not.toContain('database-secret');});
 test('unknown API endpoint stays JSON',async()=>expect((await request(app).get('/api/missing')).status).toBe(404));
 test('malformed JSON returns 400',async()=>expect((await request(app).post('/api/orders').set('Content-Type','application/json').send('{')).status).toBe(400));
 test('exports Prometheus metrics',async()=>{const r=await request(app).get('/metrics');expect(r.status).toBe(200);expect(r.text).toContain('shop_http_requests_total');});
});