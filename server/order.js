import catalog from '../catalog.json' with {type:'json'};
export function priceOrder(body){
 if(!body || !Array.isArray(body.items)||!body.items.length||body.items.length>30) throw new Error('Add between 1 and 30 items.');
 const name=typeof body.name==='string'?body.name.trim():'';
 if(name.length<2||name.length>80)throw new Error('Enter a name between 2 and 80 characters.');
 if(typeof body.email!=='string'||body.email.length>120||!/^\S+@\S+\.\S+$/.test(body.email))throw new Error('Enter a valid email.');
 const ids=new Set();
 const items=body.items.map(item=>{const p=catalog.products.find(p=>p.id===item.id);if(!p||!Number.isInteger(item.quantity)||item.quantity<1||item.quantity>p.stock||ids.has(item.id))throw new Error('Invalid product or quantity.');ids.add(item.id);return {id:p.id,name:p.name,quantity:item.quantity,price:p.price};});
 const subtotal=items.reduce((s,p)=>s+p.price*p.quantity,0);const extra=body.extra===true?catalog.extra:0;
 return {name,email:body.email,items,subtotal,extra,total:subtotal+extra,status:'demo-confirmed'};
}