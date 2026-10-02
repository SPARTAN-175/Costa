const KEY="costa_v2";
const seed={
 business:{name:"Mi Negocio",type:"Emprendimiento",currency:"MXN",phone:"",whatsapp:"",address:"",city:"",email:"",logo:"",tagline:"Calidad en cada detalle",ticketMessage:"Gracias por considerar nuestro producto."},
 ingredients:[
  {id:"i1",name:"Cera de soya",unit:"kg",packQty:1,packPrice:180,productType:"Artesanías"},
  {id:"i2",name:"Esencia aromática",unit:"ml",packQty:250,packPrice:95,productType:"Artesanías"},
  {id:"i3",name:"Mecha de algodón",unit:"pieza",packQty:25,packPrice:60,productType:"Artesanías"}
 ],
 equipment:[{id:"e1",name:"Herramientas generales",purchase:1200,lifeMonths:48,residual:0}],
 services:[{id:"s1",name:"Electricidad",monthly:500,businessPct:20}],
 transport:[{id:"t1",name:"Reparto local",costPerKm:3}],
 labor:[{id:"l1",name:"Producción",hourRate:60}],
 packaging:[{id:"p1",name:"Caja",unitPrice:4}],
 fixed:[{id:"f1",name:"Espacio de trabajo",monthly:800,businessPct:20}],
 marketing:[{id:"m1",name:"Publicidad",monthly:200}],
 products:[
  {id:"p1",name:"Vela aromática",description:"Vela artesanal de cera de soya con aroma suave y presentación cuidada.",category:"Artesanías",unit:"pieza",batchQty:1,yield:1,timeValue:30,timeMin:30,timeUnit:"min",price:95,targetMargin:40,
   recipe:[{ref:"i1",qty:.18,unit:"kg"},{ref:"i2",qty:12,unit:"mL"},{ref:"i3",qty:1,unit:"pieza"}],
   packaging:[{ref:"p1",qty:1,unit:"pieza"}],laborRef:"l1",laborValue:30,laborMin:30,laborUnit:"min",transportKm:0,mermaPct:3,monthlyUnits:100,overheadMode:"direct",tools:[],services:[],fixed:[],marketing:[]}
 ],
 sales:[]
};
let db=load();
let currentView="dashboard", currentProductId="p1";

function load(){try{const x=JSON.parse(localStorage.getItem(KEY));return x||structuredClone(seed)}catch(e){return structuredClone(seed)}}
function save(){localStorage.setItem(KEY,JSON.stringify(db))}
function uid(p="x"){return p+Math.random().toString(36).slice(2,9)}
const UNIT_GROUPS={
 mass:{base:"g",options:[["mg","mg"],["g","g"],["kg","kg"]],factor:{mg:.001,g:1,kg:1000}},
 volume:{base:"ml",options:[["ml","mL"],["L","L"]],factor:{ml:1,L:1000}},
 length:{base:"cm",options:[["mm","mm"],["cm","cm"],["m","m"]],factor:{mm:.1,cm:1,m:100}},
 area:{base:"m2",options:[["cm2","cm²"],["m2","m²"]],factor:{cm2:.0001,m2:1}},
 count:{base:"pieza",options:[["pieza","pieza"],["unidad","unidad"],["par","par"],["docena","docena"],["paquete","paquete"],["caja","caja"]],factor:{pieza:1,unidad:1,par:2,docena:12,paquete:1,caja:1}},
 time:{base:"min",options:[["min","minutos"],["h","horas"],["dia","días"],["semana","semanas"],["mes","meses"]],factor:{min:1,h:60,dia:1440,semana:10080,mes:43200}}
};
const UNIT_LIST=Object.entries(UNIT_GROUPS).flatMap(([group,g])=>g.options.map(([value,label])=>({value,label,group})));
function unitOptions(selected="",group=""){return UNIT_LIST.filter(x=>!group||x.group===group).map(x=>`<option value="${x.value}" ${x.value===selected?"selected":""}>${x.label}</option>`).join("")}
function unitGroup(unit){return UNIT_LIST.find(x=>x.value===unit)?.group||null}
const PRODUCT_CATEGORIES=["Alimentos","Bebidas","Panadería y repostería","Artesanías","Textiles y ropa","Muebles","Tecnología","Servicios","Reparaciones","Construcción","Agricultura","Productos personalizados","Otro"];
const SALE_UNITS=["pieza","unidad","kg","g","L","mL","metro","m²","par","docena","paquete","caja","lote","servicio","Otro"];
function selectOptions(list,selected){
 return list.map(x=>`<option value="${esc(x)}" ${x===selected?"selected":""}>${esc(x)}</option>`).join("");
}
function productCategoryUI(category){
 const known=PRODUCT_CATEGORIES.includes(category);
 return `<select id="pCategory">${selectOptions(PRODUCT_CATEGORIES,known?category:"Otro")}</select><input id="pCategoryCustom" class="custom-field" value="${esc(known?"":category)}" placeholder="Escribe la categoría" style="${known?"display:none":""}">`;
}
function saleUnitUI(unit){
 const known=SALE_UNITS.includes(unit);
 return `<select id="pUnit">${selectOptions(SALE_UNITS,known?unit:"Otro")}</select><input id="pUnitCustom" class="custom-field" value="${esc(known?"":unit)}" placeholder="Ej. molde, rollo, paquete de 50..." style="${known?"display:none":""}">`;
}
function toggleCustomProductFields(){
 const c=document.getElementById("pCategory"),cc=document.getElementById("pCategoryCustom"),u=document.getElementById("pUnit"),uc=document.getElementById("pUnitCustom");
 if(c&&cc)cc.style.display=c.value==="Otro"?"":"none";
 if(u&&uc)uc.style.display=u.value==="Otro"?"":"none";
}

function convertQty(q,from,to){
 if(from===to)return num(q);
 const a=UNIT_LIST.find(x=>x.value===from),b=UNIT_LIST.find(x=>x.value===to);
 if(!a||!b||a.group!==b.group)return null;
 return num(q)*(UNIT_GROUPS[a.group].factor[from]/UNIT_GROUPS[b.group].factor[to]);
}
function normalizeBusiness(){
 db.business={...seed.business,...(db.business||{})};
 db.business.currency=db.business.currency||"MXN";
 db.ingredients=(db.ingredients||[]).map(i=>({...i,productType:i.productType||"Todos",unit:i.unit||"unidad"}));
}
function normalizeProduct(p){
 p.batchQty=num(p.batchQty??p.yield)||1;
 p.unit=p.unit||"unidad";
 p.timeValue=num(p.timeValue??p.timeMin);
 p.timeUnit=p.timeUnit||"min";
 p.monthlyUnits=num(p.monthlyUnits)||1;
 p.overheadMode=p.overheadMode||"direct";
 p.mermaPct=num(p.mermaPct);
 p.recipe=p.recipe||[];
 p.recipe=p.recipe.map(r=>({...r,unit:r.unit||db.ingredients.find(i=>i.id===r.ref)?.unit||"unidad"}));
 p.packaging=p.packaging||[];
 p.tools=p.tools||[];
 p.services=p.services||[];
 p.fixed=p.fixed||[];
 p.marketing=p.marketing||[];
 p.image=p.image||"";
 p.laborValue=num(p.laborValue??p.laborMin);
 p.laborUnit=p.laborUnit||"min";
 return p;
}
normalizeBusiness();
db.products.forEach(normalizeProduct);
save();

function money(n){return new Intl.NumberFormat("es-MX",{style:"currency",currency:db.business.currency||"MXN"}).format(Number(n)||0)}
function num(v){return Number(v)||0}
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function ingCost(i){return i.packQty?i.packPrice/i.packQty:0}
function equipmentMonthly(){return db.equipment.reduce((s,x)=>s+Math.max(0,(num(x.purchase)-num(x.residual))/Math.max(1,num(x.lifeMonths))),0)}
function serviceMonthly(){return db.services.reduce((s,x)=>s+num(x.monthly)*num(x.businessPct)/100,0)}
function marketingMonthly(){return db.marketing.reduce((s,x)=>s+num(x.monthly),0)}
function resourceMonthlyCost(type,x){
 if(type==="equipment")return Math.max(0,(num(x.purchase)-num(x.residual))/Math.max(1,num(x.lifeMonths)));
 if(type==="services"||type==="fixed")return num(x.monthly)*num(x.businessPct||100)/100;
 if(type==="marketing")return num(x.monthly);
 return 0;
}
function allocationCost(type,row,p,batch){
 const units=Math.max(1,num(p.monthlyUnits)||1);
 const value=num(row.value);
 if(row.method==="perUnit") return value*batch;
 if(row.method==="percent"){
   const base=resourceMonthlyCost(type, type==="equipment"?db.equipment.find(x=>x.id===row.ref):type==="services"?db.services.find(x=>x.id===row.ref):type==="fixed"?db.fixed.find(x=>x.id===row.ref):db.marketing.find(x=>x.id===row.ref));
   return base*value/100/units*batch;
 }
 if(row.method==="time"){
   const base=resourceMonthlyCost(type, type==="equipment"?db.equipment.find(x=>x.id===row.ref):type==="services"?db.services.find(x=>x.id===row.ref):type==="fixed"?db.fixed.find(x=>x.id===row.ref):db.marketing.find(x=>x.id===row.ref));
   const mins=convertQty(value,row.unit||"min","min")??value;
   const availableHours=Math.max(1,num(db.business?.availableHoursMonth)||160);
   return base*(mins/60)/availableHours;
 }
 if(row.method==="monthlyUnits"){
   const base=resourceMonthlyCost(type, type==="equipment"?db.equipment.find(x=>x.id===row.ref):type==="services"?db.services.find(x=>x.id===row.ref):type==="fixed"?db.fixed.find(x=>x.id===row.ref):db.marketing.find(x=>x.id===row.ref));
   return base/units*batch;
 }
 if(row.method==="fixed") return value*batch;
 return 0;
}
function toolUnitCost(t,p){return allocationCost("equipment",t,p,1)}
function productCosts(p){
 p=normalizeProduct(p);
 const batch=Math.max(1,num(p.batchQty));
 let materials=0;
 (p.recipe||[]).forEach(r=>{
   const i=db.ingredients.find(x=>x.id===r.ref); if(!i)return;
   const q=convertQty(r.qty,r.unit||i.unit,i.unit);
   if(q!=null)materials+=num(ingCost(i))*q;
 });
 let packaging=0;
 (p.packaging||[]).forEach(r=>{
   const x=db.packaging.find(y=>y.id===r.ref);if(!x)return;
   const q=convertQty(r.qty,r.unit||"pieza","pieza");
   packaging+=num(x.unitPrice)*(q??num(r.qty));
 });
 const labor=db.labor.find(x=>x.id===p.laborRef);
 const laborMinutes=convertQty(p.laborValue||0,p.laborUnit||"min","min")??num(p.laborValue);
 const laborBatch=labor?num(labor.hourRate)/60*laborMinutes:0;
 const transportBatch=num(p.transportKm)*num(db.transport?.[0]?.costPerKm||0)*batch;
 const toolBatch=(p.tools||[]).reduce((s,r)=>s+allocationCost("equipment",r,p,batch),0);
 const serviceBatch=(p.services||[]).reduce((s,r)=>s+allocationCost("services",r,p,batch),0);
 const fixedBatch=p.overheadMode==="full"?(p.fixed||[]).reduce((s,r)=>s+allocationCost("fixed",r,p,batch),0):0;
 const marketingBatch=p.overheadMode==="full"?(p.marketing||[]).reduce((s,r)=>s+allocationCost("marketing",r,p,batch),0):0;
 const directBatch=materials+packaging+laborBatch+transportBatch+toolBatch+serviceBatch;
 const waste=directBatch*num(p.mermaPct)/100;
 const variableBatch=directBatch+waste;
 const fullBatch=variableBatch+fixedBatch+marketingBatch;
 const businessFixed=equipmentMonthly()+serviceMonthly()+fixedMonthly()+marketingMonthly();
 return {
   materials,packaging,labor:laborBatch,transport:transportBatch,
   tools:toolBatch,services:serviceBatch,waste,
   fixedAllocated:fixedBatch,marketingAllocated:marketingBatch,
   variableBatch,variable:variableBatch/batch,total:fullBatch,batchTotal:fullBatch,
   perUnit:fullBatch/batch,yieldQty:batch,fixedMonthly:businessFixed,
   variablePerUnit:variableBatch/batch,
   overhead:(toolBatch+serviceBatch+fixedBatch+marketingBatch)/batch,
   direct:materials+packaging+transportBatch
 };
}
function fixedMonthlyCost(){return db.fixed.reduce((s,x)=>s+num(x.monthly)*num(x.businessPct)/100,0)}
function fixedMonthly(){return fixedMonthlyCost()}
function monthlyEquipment(){return equipmentMonthly()}
function monthlyServices(){return serviceMonthly()}
function monthlyMarketing(){return marketingMonthly()}


function priceFromMargin(cost,margin){return margin>=100?0:cost/(1-margin/100)}
function suggestedPrice(p){const c=productCosts(p);return priceFromMargin(c.perUnit,num(p.targetMargin))}
function breakEven(p,price){const c=productCosts(p);const productAllocated=c.variable+(c.tools+c.services)/c.yieldQty;const contribution=num(price)-productAllocated;return contribution>0?Math.ceil(c.fixedMonthly/contribution):Infinity}

function render(){
 document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.view===currentView));
 document.getElementById("businessNameTop").textContent=db.business.name;
 document.getElementById("businessTypeTop").textContent=db.business.type;
 const root=document.getElementById("content");
 const views={dashboard:dashboard,products:products,ingredients:resources.bind(null,"ingredients","Ingredientes / Insumos"),equipment:resources.bind(null,"equipment","Equipos y herramientas"),services:resources.bind(null,"services","Servicios (luz, gas, etc.)"),transport:resources.bind(null,"transport","Transporte"),labor:resources.bind(null,"labor","Mano de obra"),packaging:resources.bind(null,"packaging","Empaques"),fixed:resources.bind(null,"fixed","Gastos fijos"),marketing:resources.bind(null,"marketing","Marketing y ventas"),simulator:simulator,reports:reports,settings:settings};
 root.innerHTML=(views[currentView]||dashboard)();
 bind();
}
function head(title,sub="",button=""){return `<div class="page-head"><div><div class="crumb">COSTA / ${esc(title)}</div><h1>${esc(title)}</h1>${sub?`<div class="sub">${esc(sub)}</div>`:""}</div>${button}</div>`}
function costStructure(p,c){
 const rows=[
  {name:"Materiales / insumos",amount:c.materials,cls:"mat"},
  {name:"Mano de obra",amount:c.labor,cls:"labor"},
  {name:"Indirectos",amount:c.tools+c.services+c.transport+c.packaging+c.fixedAllocated+c.marketingAllocated,cls:"indirect"},
  {name:"Merma",amount:c.waste,cls:"waste"}
 ].filter(x=>x.amount>0);
 const total=rows.reduce((s,x)=>s+x.amount,0)||1;
 return rows.map(x=>({...x,pct:x.amount/total*100}));
}
function costStructureUI(p,c){
 const rows=costStructure(p,c), stops=[];let acc=0;
 rows.forEach(x=>{stops.push(`${x.cls==='mat'?'#0b9b73':x.cls==='labor'?'#2686e6':x.cls==='indirect'?'#e2a51b':'#ef6d3a'} ${acc.toFixed(2)}% ${(acc+=x.pct).toFixed(2)}%`)});
 const gradient=stops.length?stops.join(", "):"#dfe6ea 0 100%";
 return `<div class="cost-structure"><div class="donut real" style="--donut:${gradient}"><div><b>${money(c.total)}</b><span>Costo total</span></div></div><div class="cost-legend">${rows.map(x=>`<div class="cost-legend-row"><span class="legend-dot ${x.cls}"></span><div><b>${esc(x.name)}</b><small>${money(x.amount)} · ${x.pct.toFixed(1)}%</small></div></div>`).join("")||`<div class="empty">Sin costos registrados.</div>`}</div></div>`;
}
function dashboard(){
 const p=db.products.find(x=>x.id===currentProductId)||db.products[0]; if(!p)return head("Inicio")+`<div class="card empty">Agrega tu primer producto.</div>`;
 const c=productCosts(p), sp=suggestedPrice(p), be=breakEven(p,sp);
 return head("Inicio","Vista general de tus costos, precios y rentabilidad.",`<button class="btn primary" data-action="new-product">＋ Nuevo producto</button>`)+
 `<div class="card section-card hero-product"><div class="product-art ${p.image?"has-image":""}">${p.image?`<img src="${p.image}" alt="${esc(p.name)}">`:`<div class="product-art-placeholder">COSTA</div>`}</div><div style="flex:1"><h2>${esc(p.name)} <button class="btn small" data-action="edit-product" data-id="${p.id}">✎</button></h2><p>${esc(p.description||"")}</p><span class="tag">${esc(p.category||"Producto")}</span> <span class="tag gray">${esc(p.unit||"unidad")}</span><span class="tag gray">${num(p.timeValue??p.timeMin)} ${esc(p.timeUnit||"min")}</span></div></div>
 <div class="tabs"><button class="tab active">▣ Resumen</button><button class="tab" data-action="product-tab" data-id="${p.id}" data-tab="ingredients">◇ Ingredientes</button><button class="tab" data-action="product-tab" data-id="${p.id}" data-tab="indirect">⚙ Costos indirectos</button><button class="tab" data-action="product-tab" data-id="${p.id}" data-tab="price">▥ Precio y ganancia</button><button class="tab" data-action="go-sim" data-id="${p.id}">▦ Simulador</button></div>
 <div class="cards"><div class="card metric"><div class="label">Costo total por unidad</div><div class="value">${money(c.total)}</div><div class="progress"><i style="width:${Math.min(100,c.direct/c.total*100)}%"></i></div><div class="hint">Variables ${money(c.variable)} · ${p.overheadMode==="full"?"Fijos asignados "+money(c.fixedAllocated/c.yieldQty):"Fijos no asignados"}</div></div>
 <div class="card metric good"><div class="label">Precio sugerido</div><div class="value">${money(sp)}</div><div class="hint">Ganancia estimada <b>${money(sp-c.total)}</b> por unidad · margen ${num(p.targetMargin).toFixed(1)}%</div><button class="btn primary" style="margin-top:10px" data-action="client-ticket" data-id="${p.id}">🎫 Generar ticket para cliente</button></div>
 <div class="card metric"><div class="label">Punto de equilibrio</div><div class="value">${Number.isFinite(be)?be+" u/mes":"—"}</div><div class="hint">Con tus costos actuales y precio sugerido.</div></div></div>
 <div class="grid2"><div class="card section-card"><div class="section-title"><h3>Ingredientes / Insumos</h3><button class="btn small" data-action="product-tab" data-id="${p.id}" data-tab="ingredients">Ver todo</button></div>${recipeTable(p,c)}</div>
 <div class="card section-card"><div class="section-title"><h3>Otros costos por unidad</h3><button class="btn small" data-action="product-tab" data-id="${p.id}" data-tab="indirect">Configurar</button></div>${indirectTable(c)}</div></div>
 <div class="grid3" style="margin-top:12px"><div class="card section-card"><div class="section-title"><h3>Estructura de costos</h3><small>Distribución real</small></div>${costStructureUI(p,c)}</div>
 <div class="card section-card"><div class="section-title"><h3>Simulador de precio</h3></div><div class="field"><label>Ganancia deseada</label><div class="range-row"><input id="dashMargin" type="range" min="0" max="80" value="${num(p.targetMargin)}"><span class="range-val" id="dashMarginVal">${num(p.targetMargin).toFixed(0)}%</span></div></div><div class="alert success" id="dashPrice">Precio sugerido <b>${money(sp)}</b></div><button class="btn primary" data-action="go-sim">Calcular completo</button></div>
 <div class="card section-card"><div class="section-title"><h3>Proyección mensual</h3></div><div class="form-grid"><label class="field">Precio de venta<input id="dashSale" type="number" value="${Math.round(sp)}"></label><label class="field">Ventas diarias<input id="dashUnits" type="number" value="10"></label><label class="field">Días al mes<input id="dashDays" type="number" value="26"></label></div><div class="kpi-row" style="margin-top:10px"><div class="mini-kpi"><b id="dashRevenue">${money(sp*260)}</b><span>Ventas</span></div><div class="mini-kpi"><b id="dashProfit">${money((sp-c.total)*260)}</b><span>Utilidad estimada</span></div></div></div></div>`;
}
function recipeTable(p,c){
 let rows=(p.recipe||[]).map(r=>{
   const i=db.ingredients.find(x=>x.id===r.ref); if(!i)return `<tr><td>Insumo eliminado</td><td>${r.qty}</td><td>—</td><td class="money">—</td></tr>`;
   const usedUnit=r.unit||i.unit, converted=convertQty(r.qty,usedUnit,i.unit);
   const costPerUsedUnit=converted==null?0:ingCost(i)*(convertQty(1,usedUnit,i.unit)??1);
   const line=converted==null?0:ingCost(i)*converted;
   return `<tr><td>${esc(i.name)}</td><td>${r.qty}</td><td>${esc(usedUnit)} · ${money(costPerUsedUnit)}/${esc(usedUnit)}</td><td class="money">${money(line)}</td></tr>`;
 }).join("");
 rows+=(p.packaging||[]).map(r=>{
   const x=db.packaging.find(y=>y.id===r.ref); if(!x)return "";
   return `<tr><td>${esc(x.name)}</td><td>${r.qty}</td><td>${money(x.unitPrice)}/pieza</td><td class="money">${money((x.unitPrice||0)*r.qty)}</td></tr>`;
 }).join("");
 return `<div class="table-wrap"><table class="table"><thead><tr><th>Insumo</th><th>Cantidad</th><th>Costo unitario</th><th>Costo</th></tr></thead><tbody>${rows||`<tr><td colspan="4"><div class="empty">Sin materiales asociados.</div></td></tr>`}</tbody><tfoot><tr><td colspan="3"><b>Total directos</b></td><td class="money"><b>${money(c.materials+c.packaging)}</b></td></tr></tfoot></table></div>`;
}
function indirectTable(c){
 const rows=[
 ["📦 Materiales / insumos",c.materials/c.yieldQty],
 ["🔧 Equipos y herramientas",c.tools/c.yieldQty],
 ["⚡ Servicios",c.services/c.yieldQty],
 ["🚚 Transporte",c.transport/c.yieldQty],
 ["👷 Mano de obra",c.labor/c.yieldQty],
 ["📦 Empaques",c.packaging/c.yieldQty],
 ["🏠 Gastos fijos",c.fixedAllocated/c.yieldQty],
 ["📣 Marketing y ventas",c.marketingAllocated/c.yieldQty],
 ["♻️ Merma / desperdicio",c.waste/c.yieldQty]
 ];
 const total=rows.reduce((s,x)=>s+x[1],0);
 return `<div class="table-wrap"><table class="table"><thead><tr><th>Factor</th><th>Costo por unidad</th></tr></thead><tbody>${rows.map(x=>`<tr><td>${x[0]}</td><td class="money">${money(x[1])}</td></tr>`).join("")}</tbody><tfoot><tr><td><b>Total de factores</b></td><td class="money"><b>${money(total)}</b></td></tr></tfoot></table></div><div class="note" style="margin-top:8px"><b>Importante:</b> los 8 factores existen en COSTA, pero cada producto decide cuáles utiliza. Los gastos fijos y marketing solo se cargan cuando el producto está en modo <b>Costo completo</b>. Para un producto ocasional puedes dejarlos en $0 sin inflar artificialmente el precio.</div>`;
}

function products(){
 return head("Productos","Crea cualquier producto: comida, artesanía, servicio, reparación, etc.",`<button class="btn primary" data-action="new-product">＋ Nuevo producto</button>`) +
 `<div class="list-cards">${db.products.map(p=>{const c=productCosts(p),sp=suggestedPrice(p);return `<div class="card product-card" data-action="view-product" data-id="${p.id}" tabindex="0" role="button" title="Tocar para ver el producto"><div class="product-card-image">${p.image?`<img src="${p.image}" alt="${esc(p.name)}" loading="lazy">`:`<div class="product-card-placeholder">COSTA</div>`}</div><div class="pc-top"><div><h3>${esc(p.name)}</h3><p>${esc(p.description||"")}</p></div><span class="tag">${esc(p.category||"General")}</span></div><div class="kpi-row"><div class="mini-kpi"><b>${money(c.total)}</b><span>Costo real</span></div><div class="mini-kpi"><b>${money(sp)}</b><span>Sugerido</span></div></div><div class="price-row" style="margin-top:12px"><div><span class="muted" style="font-size:9px">Margen objetivo</span><div class="big">${num(p.targetMargin).toFixed(1)}%</div></div><div class="actions"><button class="btn small" data-action="client-ticket" data-id="${p.id}">🎫 Ticket</button><button class="btn small" data-action="edit-product" data-id="${p.id}">Editar</button><button class="btn small danger" data-action="delete-product" data-id="${p.id}">Eliminar</button></div></div></div>`}).join("")}</div>`;
}

const resourceMeta={
ingredients:{title:"Ingredientes / Insumos",fields:[["name","Nombre","text"],["unit","Unidad","select"],["packQty","Cantidad del paquete","number"],["packPrice","Precio del paquete","number"],["productType","Tipo de producto","select"]],desc:"Registra materiales o insumos y asígnalos al tipo de producto donde se utilizan."},
equipment:{title:"Equipos y herramientas",fields:[["name","Nombre","text"],["purchase","Precio de compra","number"],["lifeMonths","Vida útil (meses)","number"],["residual","Valor residual","number"]],desc:"El costo de tus equipos se distribuye según su vida útil."},
services:{title:"Servicios",fields:[["name","Servicio","text"],["monthly","Costo mensual","number"],["businessPct","% usado por el negocio","number"]],desc:"Luz, gas, agua, internet y otros servicios."},
transport:{title:"Transporte",fields:[["name","Concepto","text"],["costPerKm","Costo por km","number"]],desc:"Calcula entregas y traslados con un costo por kilómetro."},
labor:{title:"Mano de obra",fields:[["name","Actividad","text"],["hourRate","Valor por hora","number"]],desc:"Aunque seas tú quien trabaja, registra el valor de tu tiempo."},
packaging:{title:"Empaques",fields:[["name","Empaque","text"],["unitPrice","Costo por unidad","number"]],desc:"Cajas, bolsas, etiquetas, vasos, servilletas, etc."},
fixed:{title:"Gastos fijos",fields:[["name","Concepto","text"],["monthly","Costo mensual","number"],["businessPct","% asignado al negocio","number"]],desc:"Renta, espacio, licencias y otros gastos recurrentes."},
marketing:{title:"Marketing y ventas",fields:[["name","Concepto","text"],["monthly","Costo mensual","number"]],desc:"Publicidad, impresos, plataformas y otros costos comerciales."}
};
function resources(type,title){
 const meta=resourceMeta[type], arr=db[type]||[];
 const rows=arr.map(x=>{let unit="";if(type==="ingredients")unit=`${money(ingCost(x))}/${x.unit}`;if(type==="equipment")unit=money((num(x.purchase)-num(x.residual))/Math.max(1,num(x.lifeMonths)))+"/mes";if(type==="services"||type==="fixed")unit=money(num(x.monthly)*num(x.businessPct)/100)+"/mes";if(type==="transport")unit=money(x.costPerKm)+"/km";if(type==="labor")unit=money(x.hourRate)+"/h";if(type==="packaging")unit=money(x.unitPrice)+"/u";if(type==="marketing")unit=money(x.monthly)+"/mes";return `<tr><td><b>${esc(x.name)}</b></td><td>${unit}</td><td>${type==="ingredients"?`${esc(x.productType||"Todos")}`:type==="equipment"?`Vida: ${x.lifeMonths} meses`:type==="services"||type==="fixed"?`${x.businessPct}% asignado`:""}</td><td class="money"><button class="btn small" data-action="edit-resource" data-type="${type}" data-id="${x.id}">Editar</button> <button class="btn small danger" data-action="delete-resource" data-type="${type}" data-id="${x.id}">Eliminar</button></td></tr>`}).join("");
 return head(title,meta.desc,`<button class="btn primary" data-action="new-resource" data-type="${type}">＋ Agregar</button>`)+
 `<div class="card section-card"><div class="table-wrap"><table class="table"><thead><tr><th>Nombre</th><th>Costo calculado</th><th>Referencia</th><th></th></tr></thead><tbody>${rows||`<tr><td colspan="4"><div class="empty">Aún no hay registros.</div></td></tr>`}</tbody></table></div></div>`;
}


function liveProductCalc(){
 const modalEl=document.querySelector("#modalRoot .modal");if(!modalEl)return;
 const p={batchQty:num(document.getElementById("pYield")?.value)||1,monthlyUnits:num(document.getElementById("pMonthlyUnits")?.value)||1,overheadMode:document.getElementById("pOverheadMode")?.value||"direct",mermaPct:num(document.getElementById("pWaste")?.value),transportKm:num(document.getElementById("pKm")?.value),laborRef:document.getElementById("pLabor")?.value,laborValue:num(document.getElementById("pLaborMin")?.value),laborUnit:document.getElementById("pLaborUnit")?.value,recipe:[],tools:[],services:[],packaging:[],fixed:[],marketing:[]};
 document.querySelectorAll(".recipe-row").forEach(r=>p.recipe.push({ref:r.querySelector(".r-ref").value,qty:num(r.querySelector(".r-qty").value),unit:r.querySelector(".r-unit").value}));
 document.querySelectorAll(".tool-row").forEach(r=>p.tools.push({ref:r.querySelector(".t-ref").value,method:r.querySelector(".t-method").value,value:num(r.querySelector(".t-value").value),unit:r.querySelector(".t-unit").value}));
 document.querySelectorAll(".service-row").forEach(r=>p.services.push({ref:r.querySelector(".s-ref").value,method:r.querySelector(".s-method").value,value:num(r.querySelector(".s-value").value)}));
 document.querySelectorAll(".pack-row").forEach(r=>p.packaging.push({ref:r.querySelector(".pk-ref").value,qty:num(r.querySelector(".pk-qty").value),unit:r.querySelector(".pk-unit").value}));
 document.querySelectorAll(".fixed-row").forEach(r=>p.fixed.push({ref:r.querySelector(".f-ref").value,method:r.querySelector(".f-method").value,value:num(r.querySelector(".f-value").value),unit:r.querySelector(".f-unit").value}));
 document.querySelectorAll(".marketing-row").forEach(r=>p.marketing.push({ref:r.querySelector(".m-ref").value,method:r.querySelector(".m-method").value,value:num(r.querySelector(".m-value").value),unit:r.querySelector(".m-unit").value}));
 const c=productCosts(p),margin=num(document.getElementById("pMargin")?.value),sp=priceFromMargin(c.perUnit,margin),box=document.getElementById("liveProductCalc");
 if(box)box.innerHTML=`<small>Costo completo estimado por ${esc(document.getElementById("pUnit")?.value||"unidad")}</small><div class="big">${money(c.perUnit)}</div><small>Materiales ${money(c.materials/c.yieldQty)} · Mano de obra ${money(c.labor/c.yieldQty)} · Herramientas ${money(c.tools/c.yieldQty)} · Servicios ${money(c.services/c.yieldQty)} · Transporte ${money(c.transport/c.yieldQty)} · Empaque ${money(c.packaging/c.yieldQty)} · Merma ${money(c.waste/c.yieldQty)} · Fijos ${money(c.fixedAllocated/c.yieldQty)} · Marketing ${money(c.marketingAllocated/c.yieldQty)}</small><div style="margin-top:8px"><b>Precio sugerido con ${margin.toFixed(1)}% de margen: ${money(sp)}</b></div>`;
}

function syncRecipeUnit(changed){
 if(changed?.id==="pCategory"){
   const category=changed.value==="Otro"?document.getElementById("pCategoryCustom")?.value:changed.value;
   document.querySelectorAll(".recipe-row .r-ref").forEach(sel=>{const current=sel.value;sel.innerHTML=ingredientOptionsForProduct(category,current);if([...sel.options].some(o=>o.value===current))sel.value=current;});
   return;
 }
 if(changed?.id==="pUnit")return;
 if(changed?.classList?.contains("r-ref")){
   const row=changed.closest(".recipe-row"), ing=db.ingredients.find(x=>x.id===changed.value);
   const unit=row?.querySelector(".r-unit");
   if(unit&&ing){unit.innerHTML=unitOptions(ing.unit);unit.value=ing.unit;}
 }
}
async function optimizeProductImage(file,maxSize=1200){
 return new Promise((resolve,reject)=>{
  if(!file||!file.type.startsWith("image/"))return reject(new Error("Selecciona una imagen válida."));
  const reader=new FileReader();
  reader.onerror=()=>reject(new Error("No se pudo leer la imagen."));
  reader.onload=()=>{
   const img=new Image();
   img.onerror=()=>reject(new Error("No se pudo procesar la imagen."));
   img.onload=()=>{
    const scale=Math.min(1,maxSize/Math.max(img.naturalWidth||img.width,img.naturalHeight||img.height));
    const w=Math.max(1,Math.round((img.naturalWidth||img.width)*scale));
    const h=Math.max(1,Math.round((img.naturalHeight||img.height)*scale));
    const canvas=document.createElement("canvas");canvas.width=w;canvas.height=h;
    const ctx=canvas.getContext("2d");ctx.drawImage(img,0,0,w,h);
    resolve(canvas.toDataURL("image/jpeg",.84));
   };
   img.src=reader.result;
  };
  reader.readAsDataURL(file);
 });
}
function renderProductImagePreview(data){
 const box=document.getElementById("productImagePreview"); if(!box)return;
 box.innerHTML=data?`<img src="${data}" alt="Imagen del producto"><button type="button" class="btn small danger" data-action="remove-product-image">Eliminar imagen</button>`:`<div class="image-placeholder">Agrega una foto para que también pueda aparecer en la presentación para tu cliente.</div>`;
 bindModal();
}
function bindModal(){
 document.querySelectorAll("#modalRoot [data-action]").forEach(x=>{if(!x._costaBound){x.onclick=()=>action(x.dataset.action,x);x._costaBound=true}});
 document.querySelectorAll("#modalRoot input,#modalRoot select,#modalRoot textarea").forEach(x=>{if(!x._costaInputBound){x.addEventListener("input",()=>{toggleCustomProductFields();liveProductCalc()});x.addEventListener("change",()=>{toggleCustomProductFields();syncRecipeUnit(x);liveProductCalc()});x._costaInputBound=true}});
 const businessLogo=document.getElementById("businessLogo");
 if(businessLogo&&!businessLogo._costaImageBound){businessLogo.addEventListener("change",async()=>{const file=businessLogo.files?.[0];if(!file)return;try{const data=await optimizeProductImage(file,700);businessLogo.dataset.imageData=data;const box=document.getElementById("businessLogoPreview");if(box)box.innerHTML=`<img src="${data}" alt="Logo"><button class="btn small danger" data-action="remove-business-logo">Eliminar</button>`;bindModal();toast("Logo preparado")}catch(e){alert("No se pudo cargar el logo.")}});businessLogo._costaImageBound=true;}
 document.querySelectorAll("#modalRoot #ticketPrice,#modalRoot #ticketQty,#modalRoot #ticketQPresentation,#modalRoot #ticketQOccasion,#modalRoot #ticketQFeatures,#modalRoot #ticketQIncluded,#modalRoot #ticketQAdditional").forEach(x=>{if(!x._ticketBound){x.addEventListener("input",()=>{const id=document.querySelector('#modalRoot [data-action="ticket-refresh"]')?.dataset.id;if(id)updateTicketPreview(id)});x._ticketBound=true}});
 const imageInput=document.getElementById("pImage");
 if(imageInput&&!imageInput._costaImageBound){
  imageInput.addEventListener("change",async()=>{
   const file=imageInput.files?.[0];if(!file)return;
   try{const data=await optimizeProductImage(file);imageInput.dataset.imageData=data;renderProductImagePreview(data);toast("Imagen preparada");}
   catch(e){alert("No se pudo cargar esa imagen. Prueba con JPG, PNG o WebP.")}
  });
  imageInput._costaImageBound=true;
 }
 toggleCustomProductFields();
}
function productDetailModal(id){
 const p=db.products.find(x=>x.id===id);if(!p)return;const c=productCosts(p),sp=suggestedPrice(p),s=costStructure(p,c);
 modal(`<div class="modal-backdrop"><div class="modal product-detail-modal"><div class="modal-head"><div><h2>${esc(p.name)}</h2><small>${esc(p.category||"Producto")} · ${esc(p.unit||"unidad")}</small></div><button class="close" data-action="close-modal">×</button></div><div class="modal-body"><div class="product-detail-hero">${p.image?`<img src="${p.image}" alt="${esc(p.name)}">`:`<div class="detail-placeholder">COSTA</div>`}<div><span class="tag">${esc(p.category||"Producto")}</span><p>${esc(p.description||"Sin descripción.")}</p><div class="kpi-row"><div class="mini-kpi"><b>${money(c.total)}</b><span>Costo real</span></div><div class="mini-kpi"><b>${money(sp)}</b><span>Precio sugerido</span></div></div></div></div><div class="cost-legend detail-legend">${s.map(x=>`<div class="cost-legend-row"><span class="legend-dot ${x.cls}"></span><div><b>${esc(x.name)}</b><small>${money(x.amount)} · ${x.pct.toFixed(1)}%</small></div></div>`).join("")}</div></div><div class="modal-foot"><button class="btn" data-action="close-modal">Cerrar</button><button class="btn primary" data-action="edit-product" data-id="${id}">Editar</button></div></div></div>`);
}
function productSectionModal(id,tab){
 const p=db.products.find(x=>x.id===id);if(!p)return;const c=productCosts(p),sp=suggestedPrice(p);
 let title="",body="";
 if(tab==="ingredients"){title="Ingredientes / materiales";body=recipeTable(p,c)}
 else if(tab==="indirect"){title="Costos indirectos";body=indirectTable(c)}
 else if(tab==="price"){title="Precio y ganancia";body=`<div class="cards"><div class="card metric"><div class="label">Costo por unidad</div><div class="value">${money(c.total)}</div></div><div class="card metric good"><div class="label">Precio sugerido</div><div class="value">${money(sp)}</div></div><div class="card metric"><div class="label">Ganancia estimada</div><div class="value">${money(sp-c.total)}</div><div class="hint">Margen objetivo ${num(p.targetMargin).toFixed(1)}%</div></div></div><div class="alert success">El precio sugerido se calcula con el costo real y el margen objetivo configurado para este producto.</div>`}
 else return;
 modal(`<div class="modal-backdrop"><div class="modal"><div class="modal-head"><h2>${title}</h2><button class="close" data-action="close-modal">×</button></div><div class="modal-body">${body}</div><div class="modal-foot"><button class="btn" data-action="close-modal">Cerrar</button><button class="btn primary" data-action="edit-product" data-id="${id}">Editar producto</button></div></div></div>`);
}
function simulator(){
 const p=db.products.find(x=>x.id===currentProductId)||db.products[0]; if(!p)return head("Simulador")+"<div class='card empty'>Primero crea un producto.</div>";
 const c=productCosts(p);
 return head("Simulador","Prueba precios, volumen de ventas y escenarios sin modificar tu producto.",`<button class="btn" data-action="reset-sim">↺ Restablecer</button>`)+
 `<div class="grid2"><div class="card section-card"><div class="section-title"><h3>Producto</h3></div><label class="field">Producto<select id="simProduct">${db.products.map(x=>`<option value="${x.id}" ${x.id===p.id?"selected":""}>${esc(x.name)}</option>`).join("")}</select></label><div class="form-grid" style="margin-top:11px"><label class="field">Costo real<input id="simCost" type="number" value="${c.total.toFixed(2)}" readonly></label><label class="field">Precio de venta<input id="simPrice" type="number" value="${suggestedPrice(p).toFixed(2)}"></label><label class="field">Unidades por día<input id="simDaily" type="number" value="10"></label><label class="field">Días por mes<input id="simDays" type="number" value="26"></label></div><div style="margin-top:12px"><label class="field">Margen objetivo<div class="range-row"><input id="simMargin" type="range" min="0" max="90" value="${p.targetMargin}"><span class="range-val" id="simMarginVal">${num(p.targetMargin).toFixed(0)}%</span></div></label></div><div class="alert success" id="simSuggested"></div></div>
 <div class="card section-card"><div class="section-title"><h3>Resultado</h3></div><div class="kpi-row"><div class="mini-kpi"><b id="simRevenue"></b><span>Ventas mensuales</span></div><div class="mini-kpi"><b id="simCosts"></b><span>Costos variables</span></div><div class="mini-kpi"><b id="simProfit"></b><span>Utilidad</span></div><div class="mini-kpi"><b id="simMarginOut"></b><span>Margen</span></div></div><div class="alert" id="simBreak"></div><div class="section-title"><h3>Comparación de escenarios</h3></div><div id="scenarioTable"></div></div></div>`;
}
function reports(){
 const rows=db.products.map(p=>{const c=productCosts(p),sp=suggestedPrice(p),be=breakEven(p,sp);return `<tr><td><b>${esc(p.name)}</b></td><td>${money(c.total)}</td><td>${money(sp)}</td><td>${money(sp-c.total)}</td><td>${num(p.targetMargin).toFixed(1)}%</td><td>${Number.isFinite(be)?be:"—"}</td></tr>`}).join("");
 return head("Reportes","Resumen de costos y precios de todos tus productos.",`<button class="btn" data-action="export-json">⇩ Exportar datos</button>`)+
 `<div class="cards"><div class="card metric"><div class="label">Productos</div><div class="value">${db.products.length}</div><div class="hint">registrados</div></div><div class="card metric"><div class="label">Costo mensual fijo</div><div class="value">${money(equipmentMonthly()+serviceMonthly()+fixedMonthly()+marketingMonthly())}</div><div class="hint">equipo + servicios + fijos + marketing</div></div><div class="card metric good"><div class="label">Mejor margen objetivo</div><div class="value">${Math.max(...db.products.map(x=>num(x.targetMargin)),0).toFixed(1)}%</div><div class="hint">entre tus productos</div></div></div>
 <div class="card section-card"><div class="section-title"><h3>Tabla de precios</h3><button class="btn small" data-action="print-report">Imprimir</button></div><div class="table-wrap"><table class="table"><thead><tr><th>Producto</th><th>Costo real</th><th>Precio sugerido</th><th>Ganancia</th><th>Margen</th><th>Punto equilibrio</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
}
function settings(){
 const b=db.business||seed.business;
 return head("Configuración","Tu perfil y todos tus datos se guardan localmente en este dispositivo.",`<button class="btn primary" data-action="save-settings">Guardar cambios</button>`)+
 `<div class="grid2"><div class="card section-card"><div class="section-title"><h3>👤 Perfil del negocio</h3><small>Aparece en tus tickets</small></div><div class="form-grid">
 <label class="field">Nombre del negocio<input id="setName" value="${esc(b.name)}"></label><label class="field">Tipo de negocio<input id="setType" value="${esc(b.type)}"></label>
 <label class="field">Teléfono<input id="setPhone" value="${esc(b.phone)}" placeholder="Ej. 937 000 0000"></label><label class="field">WhatsApp<input id="setWhatsapp" value="${esc(b.whatsapp)}" placeholder="Ej. 937 000 0000"></label>
 <label class="field full">Dirección<input id="setAddress" value="${esc(b.address)}" placeholder="Calle, número, colonia..."></label><label class="field">Localidad / ciudad<input id="setCity" value="${esc(b.city)}"></label><label class="field">Correo electrónico<input id="setEmail" type="email" value="${esc(b.email)}"></label>
 <label class="field full">Frase del negocio<input id="setTagline" value="${esc(b.tagline)}" placeholder="Calidad en cada detalle"></label><label class="field full">Mensaje de despedida<input id="setTicketMessage" value="${esc(b.ticketMessage)}" placeholder="Gracias por tu preferencia."></label>
 </div><div class="business-logo-box"><div><b>Logo</b><small>Se guarda dentro de COSTA y funciona sin internet.</small></div><input id="businessLogo" type="file" accept="image/*" style="display:none"><div id="businessLogoPreview">${b.logo?`<img src="${b.logo}" alt="Logo"><button class="btn small danger" data-action="remove-business-logo">Eliminar</button>`:`<div class="image-placeholder">Aún no has agregado un logo.</div>`}</div><button class="btn" data-action="choose-business-logo">📷 Cargar logo</button></div></div>
 <div class="card section-card"><div class="section-title"><h3>💾 Datos</h3></div><p class="sub">COSTA es 100% offline. No usamos Firebase ni servidor para guardar estos datos.</p><label class="field" style="margin-top:12px">Moneda<select id="setCurrency"><option value="MXN" ${b.currency==="MXN"?"selected":""}>MXN — Peso mexicano</option><option value="USD" ${b.currency==="USD"?"selected":""}>USD — Dólar</option></select></label><div class="actions" style="margin-top:14px"><button class="btn" data-action="export-json">⇩ Exportar respaldo</button><button class="btn" data-action="import-json">⇧ Importar respaldo</button><button class="btn danger" data-action="clear-data">Restablecer todo</button></div><div class="alert success">El perfil, productos, ingredientes y configuraciones se conservan en este dispositivo.</div></div></div>`;
}


function productModal(id){
 const p=id?normalizeProduct(db.products.find(x=>x.id===id)):normalizeProduct({id:"",name:"",description:"",category:"Otro",unit:"unidad",batchQty:1,timeValue:20,timeUnit:"min",targetMargin:40,monthlyUnits:1,overheadMode:"direct",mermaPct:5,transportKm:0,recipe:[],tools:[],services:[],packaging:[],image:"",laborRef:db.labor[0]?.id||"",laborValue:20,laborUnit:"min"});
 return `<div class="modal-backdrop" data-modal-bg><div class="modal"><div class="modal-head"><h2>${id?"Editar producto":"Nuevo producto"}</h2><button class="close" data-action="close-modal">×</button></div><div class="modal-body">
 <div class="alert success">COSTA acepta piezas, kg, litros, metros, lotes, servicios y más. El tiempo puede expresarse en minutos, horas, días, semanas o meses.</div>
 <div class="form-grid">
 <label class="field">Nombre<input id="pName" value="${esc(p.name)}"></label>
 <label class="field">Categoría${productCategoryUI(p.category)}</label>
 <label class="field">Unidad de venta${saleUnitUI(p.unit)}</label>
 <label class="field">Unidades obtenidas por lote<input id="pYield" type="number" step=".001" value="${p.batchQty}"></label>
 <label class="field">Tiempo de elaboración<input id="pTimeValue" type="number" step=".01" value="${p.timeValue}"></label>
 <label class="field">Unidad de tiempo<select id="pTimeUnit">${unitOptions(p.timeUnit,"time")}</select></label>
 <label class="field">Margen objetivo (%)<input id="pMargin" type="number" step=".1" value="${p.targetMargin}"></label>
 <label class="field">Producción estimada al mes<input id="pMonthlyUnits" type="number" value="${p.monthlyUnits}"></label>
 <label class="field">Tratamiento de gastos fijos<select id="pOverheadMode"><option value="direct" ${p.overheadMode==="direct"?"selected":""}>Solo costos del producto (recomendado)</option><option value="full" ${p.overheadMode==="full"?"selected":""}>Costo completo: repartir gastos fijos</option></select></label>
 <label class="field">Km de transporte por unidad<input id="pKm" type="number" step=".01" value="${p.transportKm}"></label>
 <label class="field">Merma (%)<input id="pWaste" type="number" step=".1" value="${p.mermaPct}"></label>
 <label class="field full">Descripción<textarea id="pDesc">${esc(p.description)}</textarea></label>
 <div class="field full product-image-field">
  <div class="image-upload-head"><span>🖼️ Imagen del producto <small>(opcional)</small></span><button type="button" class="btn small" data-action="choose-product-image">📷 Cargar imagen</button></div>
  <input id="pImage" type="file" accept="image/*" style="display:none">
  <div class="product-image-preview" id="productImagePreview">${p.image?`<img src="${p.image}" alt="Imagen del producto"><button type="button" class="btn small danger" data-action="remove-product-image">Eliminar imagen</button>`:`<div class="image-placeholder">Agrega una foto para que también pueda aparecer en la presentación para tu cliente.</div>`}</div>
 </div></div>
 <hr class="hr">
 <div class="section-title"><h3>📦 Ingredientes / materiales</h3><button class="btn small" data-action="add-recipe-row">＋ Agregar</button></div>
 <div class="note">Puedes comprar en kg y usar gramos, comprar litros y usar mL, etc. COSTA convierte automáticamente unidades compatibles.</div>
 <div id="recipeEditor">${recipeEditor(p)}</div>
 <hr class="hr">
 <div class="section-title"><h3>🔧 Equipos y herramientas utilizados</h3><button class="btn small" data-action="add-tool-row">＋ Agregar</button></div>
 <div class="note">Selecciona las herramientas que realmente intervienen en este producto y decide cómo se asigna su costo.</div>
 <div id="toolEditor">${toolEditor(p)}</div>
 <hr class="hr">
 <div class="section-title"><h3>⚡ Servicios utilizados</h3><button class="btn small" data-action="add-service-row">＋ Agregar</button></div>
 <div id="serviceEditor">${serviceEditor(p)}</div>
 <hr class="hr">
 <div class="section-title"><h3>📦 Empaques</h3><button class="btn small" data-action="add-pack-row">＋ Agregar</button></div>
 <div id="packEditor">${packEditor(p)}</div>
 <hr class="hr">
 <div class="section-title"><h3>🏠 Gastos fijos utilizados</h3><button class="btn small" data-action="add-fixed-row">＋ Agregar</button></div>
 <div class="note">Solo se consideran si eliges “Costo completo”. Puedes repartir renta, espacio u otros gastos según producción, porcentaje, tiempo o monto fijo.</div>
 <div id="fixedEditor">${fixedEditor(p)}</div>
 <hr class="hr">
 <div class="section-title"><h3>📣 Marketing y ventas utilizados</h3><button class="btn small" data-action="add-marketing-row">＋ Agregar</button></div>
 <div class="note">Selecciona campañas, publicidad, comisiones u otros costos de venta que quieras cargar a este producto.</div>
 <div id="marketingEditor">${marketingEditor(p)}</div>
 <hr class="hr">
 <div class="form-grid">
 <label class="field">Mano de obra<select id="pLabor">${db.labor.map(x=>`<option value="${x.id}" ${x.id===p.laborRef?"selected":""}>${esc(x.name)} — ${money(x.hourRate)}/h</option>`).join("")}</select></label>
 <label class="field">Duración del trabajo<input id="pLaborMin" type="number" step=".01" value="${p.laborValue}"></label>
 <label class="field">Unidad de tiempo<select id="pLaborUnit">${unitOptions(p.laborUnit,"time")}</select></label>
 </div>
 <hr class="hr"><div class="calc-box" id="liveProductCalc">Calculando...</div>
 </div><div class="modal-foot"><button class="btn" data-action="close-modal">Cancelar</button><button class="btn primary" data-action="save-product" data-id="${id||""}">Guardar producto</button></div></div></div>`;
}
function ingredientOptionsForProduct(category,selected=""){
 const list=db.ingredients.filter(x=>(x.productType||"Todos")==="Todos" || !category || (x.productType||"")===category || x.id===selected);
 return list.map(x=>`<option value="${x.id}" ${x.id===selected?"selected":""}>${esc(x.name)}${x.productType&&x.productType!=="Todos"?` · ${esc(x.productType)}`:""}</option>`).join("");
}
function recipeEditor(p){
 return (p.recipe||[]).map(r=>`<div class="resource-row recipe-row">
 <label class="field">Insumo<select class="r-ref">${ingredientOptionsForProduct(p.category,r.ref)}</select></label>
 <label class="field">Cantidad<input class="r-qty" type="number" step=".0001" value="${r.qty}"></label>
 <label class="field">Unidad<select class="r-unit">${unitOptions(r.unit||db.ingredients.find(x=>x.id===r.ref)?.unit||"unidad")}</select></label>
 <button class="remove-row" data-action="remove-row">×</button></div>`).join("")||`<div class="empty">Agrega los materiales que utiliza el producto.</div>`;
}
function toolEditor(p){
 return (p.tools||[]).map(t=>`<div class="resource-row tool-row">
 <label class="field">Equipo / herramienta<select class="t-ref">${db.equipment.map(x=>`<option value="${x.id}" ${x.id===t.ref?"selected":""}>${esc(x.name)}</option>`).join("")}</select></label>
 <label class="field">Forma de cálculo<select class="t-method"><option value="perUnit" ${t.method==="perUnit"?"selected":""}>Por unidad</option><option value="percent" ${t.method==="percent"?"selected":""}>Por porcentaje</option><option value="time" ${t.method==="time"?"selected":""}>Por tiempo de uso</option><option value="fixed" ${t.method==="fixed"?"selected":""}>Costo fijo por producto</option></select></label>
 <label class="field">Valor<input class="t-value" type="number" step=".01" value="${t.value??1}"></label>
 <label class="field">Unidad<select class="t-unit">${unitOptions(t.unit||"pieza")}</select></label>
 <button class="remove-row" data-action="remove-row">×</button></div>`).join("")||`<div class="empty">Agrega las herramientas que utiliza el producto.</div>`;
}
function serviceEditor(p){
 return (p.services||[]).map(s=>`<div class="resource-row service-row">
 <label class="field">Servicio<select class="s-ref">${db.services.map(x=>`<option value="${x.id}" ${x.id===s.ref?"selected":""}>${esc(x.name)}</option>`).join("")}</select></label>
 <label class="field">Forma de cálculo<select class="s-method"><option value="percent" ${s.method==="percent"?"selected":""}>Por porcentaje</option><option value="perUnit" ${s.method==="perUnit"?"selected":""}>Costo por unidad</option></select></label>
 <label class="field">Valor<input class="s-value" type="number" step=".01" value="${s.value??100}"></label>
 <button class="remove-row" data-action="remove-row">×</button></div>`).join("")||`<div class="empty">Agrega servicios si aplica.</div>`;
}
function packEditor(p){
 return (p.packaging||[]).map(r=>`<div class="resource-row pack-row">
 <label class="field">Empaque<select class="pk-ref">${db.packaging.map(x=>`<option value="${x.id}" ${x.id===r.ref?"selected":""}>${esc(x.name)}</option>`).join("")}</select></label>
 <label class="field">Cantidad<input class="pk-qty" type="number" step=".01" value="${r.qty}"></label>
 <label class="field">Unidad<select class="pk-unit">${unitOptions(r.unit||"pieza","count")}</select></label>
 <button class="remove-row" data-action="remove-row">×</button></div>`).join("")||`<div class="empty">Agrega empaques si aplica.</div>`;
}

function fixedEditor(p){
 return (p.fixed||[]).map(r=>`<div class="resource-row fixed-row">
 <label class="field">Gasto fijo<select class="f-ref">${db.fixed.map(x=>`<option value="${x.id}" ${x.id===r.ref?"selected":""}>${esc(x.name)}</option>`).join("")}</select></label>
 <label class="field">Forma de cálculo<select class="f-method">${allocationOptions(r.method||"monthlyUnits")}</select></label>
 <label class="field">Valor<input class="f-value" type="number" step=".01" value="${r.value??100}"></label>
 <label class="field">Unidad<select class="f-unit">${unitOptions(r.unit||"min","time")}</select></label>
 <button class="remove-row" data-action="remove-row">×</button></div>`).join("")||`<div class="empty">Agrega gastos generales si quieres incluirlos en el costo completo.</div>`;
}
function marketingEditor(p){
 return (p.marketing||[]).map(r=>`<div class="resource-row marketing-row">
 <label class="field">Marketing / venta<select class="m-ref">${db.marketing.map(x=>`<option value="${x.id}" ${x.id===r.ref?"selected":""}>${esc(x.name)}</option>`).join("")}</select></label>
 <label class="field">Forma de cálculo<select class="m-method">${allocationOptions(r.method||"monthlyUnits")}</select></label>
 <label class="field">Valor<input class="m-value" type="number" step=".01" value="${r.value??100}"></label>
 <label class="field">Unidad<select class="m-unit">${unitOptions(r.unit||"min","time")}</select></label>
 <button class="remove-row" data-action="remove-row">×</button></div>`).join("")||`<div class="empty">Agrega marketing si quieres incluirlo en el costo completo.</div>`;
}
function allocationOptions(selected="monthlyUnits"){
 return `<option value="monthlyUnits" ${selected==="monthlyUnits"?"selected":""}>Repartir por producción mensual</option><option value="perUnit" ${selected==="perUnit"?"selected":""}>Costo directo por unidad</option><option value="percent" ${selected==="percent"?"selected":""}>Por porcentaje del recurso</option><option value="time" ${selected==="time"?"selected":""}>Por tiempo de uso</option><option value="fixed" ${selected==="fixed"?"selected":""}>Monto fijo por producto</option>`;
}

function resourceModal(type,id){
 const meta=resourceMeta[type], x=id?db[type].find(y=>y.id===id):{};
 const fields=meta.fields.map(([key,label,t])=>{
   if(type==="ingredients"&&key==="unit")return `<label class="field">${label}<select id="r_${key}">${unitOptions(x[key]||"kg")}</select></label>`;
   if(type==="ingredients"&&key==="productType")return `<label class="field">${label}<select id="r_${key}">${selectOptions(["Todos",...PRODUCT_CATEGORIES],x[key]||"Todos")}</select></label>`;
   return `<label class="field">${label}<input id="r_${key}" type="${t}" value="${esc(x[key]??"")}"></label>`;
 }).join("");
 return `<div class="modal-backdrop"><div class="modal"><div class="modal-head"><h2>${id?"Editar":"Agregar"} ${meta.title}</h2><button class="close" data-action="close-modal">×</button></div><div class="modal-body"><div class="form-grid">${fields}</div>${type==="ingredients"?`<div class="note" style="margin-top:10px">Los ingredientes quedan asociados a un tipo de producto. Los productos de ese tipo los mostrarán automáticamente al armar su receta.</div>`:""}</div><div class="modal-foot"><button class="btn" data-action="close-modal">Cancelar</button><button class="btn primary" data-action="save-resource" data-type="${type}" data-id="${id||""}">Guardar</button></div></div></div>`;
}

function ticketText(v){return String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}
function wrapSvgText(text,maxChars=52,maxLines=5){
 const words=String(text||"").trim().split(/\s+/).filter(Boolean),lines=[];let line="";
 words.forEach(w=>{const next=(line+" "+w).trim();if(next.length>maxChars){if(line)lines.push(line);line=w}else line=next});if(line)lines.push(line);return lines.slice(0,maxLines);
}
function buildClientDescription(p,data={}){
 const product=(p.name||"Producto").trim();
 const presentation=(data.presentation||p.unit||"unidad").trim();
 const features=(data.features||"").split(/[,;\n]+/).map(x=>x.trim()).filter(Boolean);
 const occasion=(data.occasion||"").trim();
 const included=(data.included||"").trim();
 const extra=(data.additional||"").trim();
 const paragraphs=[];
 let intro=`${product}`;
 if(p.category) intro+=` de ${p.category.toLowerCase()}`;
 if(presentation) intro+=`, presentado en ${presentation}`;
 intro+=`.`;
 paragraphs.push(intro);
 if(features.length) paragraphs.push(`Se distingue por ${features.join(", ")}.`);
 if(included) paragraphs.push(`Incluye ${included}.`);
 if(occasion) paragraphs.push(`Ideal para ${occasion}.`);
 if(extra) paragraphs.push(extra.endsWith(".")?extra:extra+".");
 return paragraphs.join(" ");
}
function ticketQuestionnaire(p){
 const category=(p.category||"General").toLowerCase();
 const defaults={
  presentation:p.unit||"pieza",
  occasion:"",
  features:"",
  included:"",
  additional:""
 };
 const hints=category.includes("comida")||category.includes("reposter")||category.includes("alimento")
  ? {presentation:"Ej. 1 pieza, 500 g, porción individual",occasion:"Ej. cumpleaños, reunión, regalo",features:"Ej. artesanal, fresco, personalizado",included:"Ej. decoración, empaque, accesorios",additional:"Ej. se prepara sobre pedido"}
  : {presentation:"Ej. 1 pieza, tamaño mediano, paquete de 6",occasion:"Ej. regalo, uso personal, evento",features:"Ej. artesanal, personalizado, acabado especial",included:"Ej. accesorios, empaque, complementos",additional:"Ej. hecho sobre pedido, entrega disponible"};
 return {defaults,hints};
}
function ticketGeneratedData(p){
 const q=id=>document.getElementById(id)?.value?.trim()||"";
 const qty=Math.max(1,num(q("ticketQty"))||1);
 const presentation=q("ticketQPresentation")||p.unit||"pieza";
 const occasion=q("ticketQOccasion");
 const features=q("ticketQFeatures");
 const included=q("ticketQIncluded");
 const additional=q("ticketQAdditional");
 const description=buildClientDescription(p,{presentation,occasion,features,included,additional});
 return {quantity:qty,presentation,occasion,features,included,additional,description,message:db.business?.ticketMessage||""};
}
function renderTicketGeneratedSummary(p,data){
 return `<div class="ticket-generated-card"><div class="ticket-generated-head"><b>Vista de la información que COSTA generará</b><span>Se crea automáticamente con tus respuestas</span></div><div class="ticket-generated-grid"><div><small>Presentación</small><b>${esc(data.presentation||"—")}</b></div><div><small>Uso / ocasión</small><b>${esc(data.occasion||"—")}</b></div><div><small>Características</small><b>${esc(data.features||"—")}</b></div><div><small>Incluye</small><b>${esc(data.included||"—")}</b></div></div><div class="ticket-generated-description"><small>Descripción para el cliente</small><p>${esc(data.description)}</p></div></div>`;
}
function ticketSvg(p,price,data={}){
 const b=db.business||{};
 const biz=b.name?.trim()||"Mi Negocio";
 const desc=data.description||buildClientDescription(p,data);
 const message=data.message?.trim()||b.ticketMessage?.trim()||"Gracias por considerar nuestro producto.";
 const qty=Math.max(1,num(data.quantity)||1), total=price*qty;
 const contact=[b.phone&&`Tel. ${b.phone}`,b.whatsapp&&`WhatsApp ${b.whatsapp}`,b.email&&b.email,b.address&&b.address,b.city&&b.city].filter(Boolean);
 const contactLines=wrapSvgText(contact.join(" · "),68,2);
 const safeBiz=ticketText(wrapSvgText(biz,24,1)[0]||"Mi Negocio");
 const safeName=wrapSvgText(p.name||"Producto",28,2).map(ticketText);
 const safeDesc=wrapSvgText(desc,57,6);
 const safeMsg=wrapSvgText(message,60,3);
 const detail=[
  ["Presentación",data.presentation?.trim()||p.unit||"unidad"],
  ["Categoría",p.category||"Producto"],
  ["Uso / ocasión",data.occasion?.trim()||"General"]
 ];
 const logo=b.logo?`<image href="${ticketText(b.logo)}" x="82" y="62" width="108" height="108" preserveAspectRatio="xMidYMid meet"/>`:`<circle cx="136" cy="116" r="48" fill="#0f5d4d"/><text x="136" y="130" text-anchor="middle" class="logoMark">C</text>`;
 const productImage=p.image?`<image href="${ticketText(p.image)}" x="82" y="330" width="300" height="250" preserveAspectRatio="xMidYMid slice"/>`:`<rect x="82" y="330" width="300" height="250" rx="28" fill="#edf2ee"/><text x="232" y="465" text-anchor="middle" class="placeholder">Tu producto</text>`;
 const descSvg=safeDesc.map((x,i)=>`<text x="116" y="${805+i*27}" class="bodyText">${ticketText(x)}</text>`).join("");
 const msgSvg=safeMsg.map((x,i)=>`<text x="116" y="${1215+i*28}" class="bodyText">${ticketText(x)}</text>`).join("");
 const detailsSvg=detail.map((d,i)=>{const x=112+i*292;return `<g transform="translate(${x} 620)"><circle cx="12" cy="0" r="12" fill="#dceee6"/><text x="35" y="-5" class="detailLabel">${ticketText(d[0])}</text><text x="35" y="22" class="detailValue">${ticketText(d[1])}</text></g>`}).join("");
 const nameSvg=safeName.map((x,i)=>`<text x="420" y="${380+i*50}" class="productName">${x}</text>`).join("");
 const contactSvg=contactLines.map((x,i)=>`<text x="540" y="${1390+i*22}" text-anchor="middle" class="contact">${ticketText(x)}</text>`).join("");
 return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1500" viewBox="0 0 1080 1500"><defs><linearGradient id="paper" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fffdf8"/><stop offset="1" stop-color="#f4f8f4"/></linearGradient><filter id="shadow"><feDropShadow dx="0" dy="12" stdDeviation="18" flood-color="#183c34" flood-opacity=".18"/></filter><clipPath id="productClip"><rect x="82" y="330" width="300" height="250" rx="28"/></clipPath></defs>
 <rect width="1080" height="1500" fill="#eaf0ee"/><rect x="44" y="38" width="992" height="1420" rx="42" fill="url(#paper)" filter="url(#shadow)"/>
 ${logo}<text x="220" y="100" class="brandName">${safeBiz}</text><text x="220" y="137" class="tagline">${ticketText(b.tagline||"Tus ideas, bien calculadas")}</text><text x="998" y="92" text-anchor="end" class="smallCap">COTIZACIÓN</text><text x="998" y="124" text-anchor="end" class="smallText">Información para tu cliente</text><line x1="82" y1="180" x2="998" y2="180" stroke="#d6e2dd" stroke-width="2"/>
 <rect x="82" y="210" width="916" height="70" rx="20" fill="#e4f5ee"/><text x="116" y="254" class="banner">Gracias por confiar en nuestro trabajo</text>
 <g clip-path="url(#productClip)">${productImage}</g>
 ${nameSvg}<text x="420" y="480" class="category">${ticketText(p.category||"Producto")}</text>
 <rect x="82" y="600" width="916" height="90" rx="24" fill="#f1f5ef"/>${detailsSvg}
 <rect x="82" y="716" width="916" height="240" rx="28" fill="#fff" stroke="#dce7e1"/><text x="116" y="760" class="sectionTitle">Descripción</text>${descSvg}
 <rect x="82" y="980" width="916" height="138" rx="28" fill="#dff3ea"/><text x="116" y="1022" class="sectionTitle">Cotización</text><text x="116" y="1072" class="bodyText">Cantidad: ${qty}</text><text x="420" y="1072" class="bodyText">Precio unitario: ${ticketText(money(price))}</text><rect x="690" y="1000" width="280" height="96" rx="22" fill="#0f5d4d"/><text x="830" y="1036" text-anchor="middle" class="totalLabel">TOTAL</text><text x="830" y="1076" text-anchor="middle" class="total">${ticketText(money(total))}</text>
 <rect x="82" y="1142" width="916" height="132" rx="28" fill="#f7f1e7"/><text x="116" y="1180" class="sectionTitle">Mensaje para el cliente</text>${msgSvg}
 <line x1="82" y1="1308" x2="998" y2="1308" stroke="#d6e2dd" stroke-width="2"/><text x="540" y="1350" text-anchor="middle" class="thanks">¡Gracias por tu preferencia!</text>${contactSvg}<text x="540" y="1436" text-anchor="middle" class="footer">COSTA · Tus ideas, bien calculadas</text>
 <style>.brandName{font:800 42px Arial,sans-serif;fill:#123d34}.tagline{font:400 20px Arial,sans-serif;fill:#61756f}.logoMark{font:800 50px Arial,sans-serif;fill:#fff}.smallCap{font:800 18px Arial,sans-serif;letter-spacing:3px;fill:#0f5d4d}.smallText{font:400 17px Arial,sans-serif;fill:#70817c}.banner{font:700 21px Arial,sans-serif;fill:#08795e}.productName{font:800 45px Arial,sans-serif;fill:#143b33}.category{font:700 20px Arial,sans-serif;fill:#0f8a6c}.sectionTitle{font:800 25px Arial,sans-serif;fill:#173e35}.bodyText{font:400 20px Arial,sans-serif;fill:#465c55}.totalLabel{font:800 15px Arial,sans-serif;fill:#bde7d8;letter-spacing:2px}.total{font:800 34px Arial,sans-serif;fill:#fff}.thanks{font:700 27px Arial,sans-serif;fill:#173e35}.contact{font:400 17px Arial,sans-serif;fill:#667872}.footer{font:800 14px Arial,sans-serif;fill:#0f5d4d;letter-spacing:4px}.detailLabel{font:400 15px Arial,sans-serif;fill:#7a8a85}.detailValue{font:700 20px Arial,sans-serif;fill:#173e35}.placeholder{font:400 22px Arial,sans-serif;fill:#8b9a95}</style></svg>`;
}
async function clientTicketModal(id){
 const p=db.products.find(x=>x.id===id); if(!p)return;const price=suggestedPrice(p), q=ticketQuestionnaire(p);
 modal(`<div class="modal-backdrop"><div class="modal ticket-modal"><div class="modal-head"><h2>🎫 Crear ticket para cliente</h2><button class="close" data-action="close-modal">×</button></div><div class="modal-body"><div class="alert success"><b>COSTA lo redacta por ti.</b> Responde preguntas sencillas y la app construirá automáticamente la presentación, características y descripción del producto. Los costos internos nunca se muestran.</div><div class="form-grid"><label class="field">Precio unitario<input id="ticketPrice" type="number" step=".01" min="0" value="${price.toFixed(2)}"></label><label class="field">Cantidad<input id="ticketQty" type="number" step="1" min="1" value="1"></label><label class="field full">¿Cómo se presenta o entrega este producto?<input id="ticketQPresentation" value="${esc(q.defaults.presentation)}" placeholder="${esc(q.hints.presentation)}"></label><label class="field full">¿Para qué ocasión o uso lo está comprando el cliente?<input id="ticketQOccasion" placeholder="${esc(q.hints.occasion)}"></label><label class="field full">¿Qué lo hace especial o qué características quieres destacar?<input id="ticketQFeatures" placeholder="${esc(q.hints.features)}"></label><label class="field full">¿Qué incluye el producto?<input id="ticketQIncluded" placeholder="${esc(q.hints.included)}"></label><label class="field full">¿Hay algo adicional que el cliente deba saber?<textarea id="ticketQAdditional" rows="2" placeholder="${esc(q.hints.additional)}"></textarea></label></div><div class="ticket-generated-note" id="ticketGeneratedNote"></div><div class="ticket-preview"><img id="ticketPreview" alt="Vista previa del ticket"></div><div class="actions ticket-actions"><button class="btn" data-action="ticket-refresh" data-id="${id}">↻ Actualizar</button><button class="btn" data-action="ticket-save" data-id="${id}">⬇ Guardar imagen</button><button class="btn primary" data-action="ticket-share" data-id="${id}">📤 Compartir imagen</button></div></div></div></div>`);updateTicketPreview(id);
}
function ticketDataFromForm(p){return ticketGeneratedData(p);}
function updateTicketPreview(id){const p=db.products.find(x=>x.id===id);if(!p)return;const data=ticketDataFromForm(p),price=Math.max(0,num(document.getElementById("ticketPrice")?.value??suggestedPrice(p)));const img=document.getElementById("ticketPreview");if(img)img.src="data:image/svg+xml;charset=utf-8,"+encodeURIComponent(ticketSvg(p,price,data));const note=document.getElementById("ticketGeneratedNote");if(note)note.innerHTML=renderTicketGeneratedSummary(p,data);}
async function svgToPngBlob(svg,width=900,height=1100){
 const blob=new Blob([svg],{type:"image/svg+xml;charset=utf-8"});
 const url=URL.createObjectURL(blob);
 try{
   const img=new Image();
   await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject;img.src=url});
   const canvas=document.createElement("canvas");canvas.width=width;canvas.height=height;
   const ctx=canvas.getContext("2d");ctx.drawImage(img,0,0,width,height);
   return await new Promise(resolve=>canvas.toBlob(resolve,"image/png",1));
 }finally{URL.revokeObjectURL(url)}
}
async function buildTicketFile(id){
 const p=db.products.find(x=>x.id===id); if(!p)throw Error("Producto no encontrado");
 const data=ticketDataFromForm(p);
 const shownPrice=Math.max(0,num(document.getElementById("ticketPrice")?.value??suggestedPrice(p)));
 const svg=ticketSvg(p,shownPrice,data);
 const blob=await svgToPngBlob(svg,1080,1500);
 return {blob,name:`COSTA-${(p.name||"producto").replace(/[^\wáéíóúüñ -]/gi,"").trim().replace(/\s+/g,"-")||"producto"}.png`};
}
function modal(html){document.getElementById("modalRoot").innerHTML=html;bindModal?.();liveProductCalc?.()}
function closeModal(){document.getElementById("modalRoot").innerHTML=""}
function toast(msg){const x=document.getElementById("toast");x.textContent=msg;x.classList.add("show");setTimeout(()=>x.classList.remove("show"),2200)}
function bind(){
 document.querySelectorAll(".nav-item").forEach(b=>b.onclick=()=>{currentView=b.dataset.view;document.getElementById("sidebar").classList.remove("open");render()});
 const hamburger=document.getElementById("hamburger"); if(hamburger) hamburger.onclick=()=>document.getElementById("sidebar").classList.toggle("open");
 const gs=document.getElementById("globalSearch");if(gs)gs.oninput=()=>{if(!gs.value.trim())return;const q=gs.value.toLowerCase();const found=db.products.find(p=>p.name.toLowerCase().includes(q));if(found){currentProductId=found.id;currentView="dashboard";render()}};
}
function action(a,b){
 const id=b.dataset.id,type=b.dataset.type;
 if(a==="new-product")modal(productModal());
 if(a==="choose-product-image"){document.getElementById("pImage")?.click()}
 if(a==="remove-product-image"){const input=document.getElementById("pImage");if(input){input.value="";input.dataset.imageData="";renderProductImagePreview("")}}
 if(a==="choose-business-logo"){document.getElementById("businessLogo")?.click()}
 if(a==="remove-business-logo"){db.business.logo="";save();render();toast("Logo eliminado")}
 if(a==="edit-product"){currentProductId=id;modal(productModal(id));bindModal();liveProductCalc()}
 if(a==="client-ticket"){clientTicketModal(id)}
 if(a==="ticket-refresh"){updateTicketPreview(id)}
 if(a==="ticket-save"){(async()=>{try{const f=await buildTicketFile(id);const u=URL.createObjectURL(f.blob);const a=document.createElement("a");a.href=u;a.download=f.name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1500);toast("Imagen guardada")}catch(e){alert("No se pudo generar la imagen.")}})()}
 if(a==="ticket-share"){(async()=>{try{const f=await buildTicketFile(id);const file=new File([f.blob],f.name,{type:"image/png"});if(navigator.share && (!navigator.canShare || navigator.canShare({files:[file]}))){await navigator.share({title:db.business?.name||"COSTA",text:`${db.products.find(x=>x.id===id)?.name||"Producto"} — ${money(num(document.getElementById("ticketPrice")?.value??suggestedPrice(db.products.find(x=>x.id===id))))}`,files:[file]})}else{const u=URL.createObjectURL(f.blob);const a=document.createElement("a");a.href=u;a.download=f.name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1500);toast("Tu navegador no permite compartir archivos; se guardó la imagen.")}}catch(e){if(e?.name!=="AbortError")alert("No se pudo compartir la imagen.")}})()}
 if(a==="delete-product"){if(confirm("¿Eliminar este producto?")){db.products=db.products.filter(x=>x.id!==id);if(currentProductId===id)currentProductId=db.products[0]?.id;save();render();toast("Producto eliminado")}}
 if(a==="new-resource")modal(resourceModal(type));
 if(a==="edit-resource")modal(resourceModal(type,id));
 if(a==="delete-resource"){if(confirm("¿Eliminar este registro?")){db[type]=db[type].filter(x=>x.id!==id);save();render();toast("Registro eliminado")}}
 if(a==="close-modal")closeModal();
 if(a==="save-product")saveProduct(id);
 if(a==="save-resource")saveResource(type,id);
 if(a==="add-recipe-row"){const modalP={category:document.getElementById("pCategory")?.value==="Otro"?document.getElementById("pCategoryCustom")?.value:document.getElementById("pCategory")?.value};const list=db.ingredients.filter(x=>(x.productType||"Todos")==="Todos"||!modalP.category||x.productType===modalP.category);const first=list[0];document.getElementById("recipeEditor").insertAdjacentHTML("beforeend",`<div class="resource-row recipe-row"><label class="field">Insumo<select class="r-ref">${list.map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join("")}</select></label><label class="field">Cantidad<input class="r-qty" type="number" step=".0001" value="1"></label><label class="field">Unidad<select class="r-unit">${unitOptions(first?.unit||"unidad")}</select></label><button class="remove-row" data-action="remove-row">×</button></div>`);bindModal();liveProductCalc()}
 if(a==="add-tool-row"){document.getElementById("toolEditor").insertAdjacentHTML("beforeend",`<div class="resource-row tool-row"><label class="field">Equipo / herramienta<select class="t-ref">${db.equipment.map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join("")}</select></label><label class="field">Forma de cálculo<select class="t-method"><option value="perUnit">Por unidad</option><option value="percent">Por porcentaje</option><option value="time">Por tiempo de uso</option><option value="fixed">Costo fijo por producto</option></select></label><label class="field">Valor<input class="t-value" type="number" step=".01" value="1"></label><label class="field">Unidad<select class="t-unit">${unitOptions("pieza")}</select></label><button class="remove-row" data-action="remove-row">×</button></div>`);bindModal();liveProductCalc()}
 if(a==="add-service-row"){document.getElementById("serviceEditor").insertAdjacentHTML("beforeend",`<div class="resource-row service-row"><label class="field">Servicio<select class="s-ref">${db.services.map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join("")}</select></label><label class="field">Forma de cálculo<select class="s-method"><option value="percent">Por porcentaje</option><option value="perUnit">Costo por unidad</option></select></label><label class="field">Valor<input class="s-value" type="number" step=".01" value="100"></label><button class="remove-row" data-action="remove-row">×</button></div>`);bindModal();liveProductCalc()}
 if(a==="add-pack-row"){document.getElementById("packEditor").insertAdjacentHTML("beforeend",`<div class="resource-row pack-row"><label class="field">Empaque<select class="pk-ref">${db.packaging.map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join("")}</select></label><label class="field">Cantidad<input class="pk-qty" type="number" step=".01" value="1"></label><label class="field">Unidad<select class="pk-unit">${unitOptions("pieza","count")}</select></label><button class="remove-row" data-action="remove-row">×</button></div>`);bindModal();liveProductCalc()}
 if(a==="add-fixed-row"){document.getElementById("fixedEditor").insertAdjacentHTML("beforeend",`<div class="resource-row fixed-row"><label class="field">Gasto fijo<select class="f-ref">${db.fixed.map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join("")}</select></label><label class="field">Forma de cálculo<select class="f-method">${allocationOptions("monthlyUnits")}</select></label><label class="field">Valor<input class="f-value" type="number" step=".01" value="100"></label><label class="field">Unidad<select class="f-unit">${unitOptions("min","time")}</select></label><button class="remove-row" data-action="remove-row">×</button></div>`);bindModal();liveProductCalc()}
 if(a==="add-marketing-row"){document.getElementById("marketingEditor").insertAdjacentHTML("beforeend",`<div class="resource-row marketing-row"><label class="field">Marketing / venta<select class="m-ref">${db.marketing.map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join("")}</select></label><label class="field">Forma de cálculo<select class="m-method">${allocationOptions("monthlyUnits")}</select></label><label class="field">Valor<input class="m-value" type="number" step=".01" value="100"></label><label class="field">Unidad<select class="m-unit">${unitOptions("min","time")}</select></label><button class="remove-row" data-action="remove-row">×</button></div>`);bindModal();liveProductCalc()}
 if(a==="remove-row"){b.closest(".resource-row")?.remove();liveProductCalc()}
 if(a==="go-sim"){currentProductId=id||currentProductId;currentView="simulator";render()}
 if(a==="product-tab"){currentProductId=id||currentProductId;productSectionModal(id,b.dataset.tab)}
 if(a==="view-product"){currentProductId=id;productDetailModal(id)}
 if(a==="reset-sim")render();
 if(a==="save-settings"){db.business.name=document.getElementById("setName").value.trim()||"Mi Negocio";db.business.type=document.getElementById("setType").value.trim()||"Emprendimiento";db.business.currency=document.getElementById("setCurrency").value;db.business.phone=document.getElementById("setPhone").value.trim();db.business.whatsapp=document.getElementById("setWhatsapp").value.trim();db.business.address=document.getElementById("setAddress").value.trim();db.business.city=document.getElementById("setCity").value.trim();db.business.email=document.getElementById("setEmail").value.trim();db.business.tagline=document.getElementById("setTagline").value.trim()||"Calidad en cada detalle";db.business.ticketMessage=document.getElementById("setTicketMessage").value.trim()||"Gracias por tu preferencia.";const logo=document.getElementById("businessLogo");if(logo?.dataset?.imageData!==undefined)db.business.logo=logo.dataset.imageData||"";save();render();toast("Perfil guardado")}
 if(a==="export-json")exportData();
 if(a==="import-json")importData();
 if(a==="clear-data"){if(confirm("Esto borrará los datos locales y volverá al ejemplo inicial. ¿Continuar?")){db=structuredClone(seed);save();render();toast("Datos restablecidos")}}
 if(a==="print-report")window.print();
 if(a==="help")helpModal();
 if(a==="notifications")toast("No tienes notificaciones nuevas.");
}

function validateProductBeforeSave(){
 const errors=[];
 const margin=num(document.getElementById("pMargin")?.value);
 if(margin<0||margin>=100)errors.push("El margen debe estar entre 0% y menos de 100%.");
 if(num(document.getElementById("pYield")?.value)<=0)errors.push("El rendimiento del lote debe ser mayor que 0.");
 if(num(document.getElementById("pMonthlyUnits")?.value)<=0)errors.push("La producción mensual debe ser mayor que 0.");
 document.querySelectorAll(".recipe-row").forEach((r,i)=>{
   const ref=r.querySelector(".r-ref")?.value, unit=r.querySelector(".r-unit")?.value, ing=db.ingredients.find(x=>x.id===ref);
   if(ing && convertQty(1,unit,ing.unit)==null)errors.push(`Material ${i+1}: la unidad ${unit} no es compatible con ${ing.unit}.`);
 });
 return errors;
}

function saveProduct(id){
 const errors=validateProductBeforeSave();if(errors.length){alert(errors.join("\n"));return;}
 const p=id?db.products.find(x=>x.id===id):{id:uid("p")};
 p.name=document.getElementById("pName").value.trim()||"Producto sin nombre";
 p.category=(document.getElementById("pCategory").value==="Otro"?document.getElementById("pCategoryCustom").value.trim():"")||document.getElementById("pCategory").value||"General";
 p.unit=(document.getElementById("pUnit").value==="Otro"?document.getElementById("pUnitCustom").value.trim():"")||document.getElementById("pUnit").value||"unidad";
 p.batchQty=num(document.getElementById("pYield").value)||1;
 p.yield=p.batchQty;
 p.timeValue=num(document.getElementById("pTimeValue").value);
 p.timeMin=p.timeValue;
 p.timeUnit=document.getElementById("pTimeUnit").value;
 p.targetMargin=num(document.getElementById("pMargin").value);
 p.monthlyUnits=Math.max(1,num(document.getElementById("pMonthlyUnits").value)||1);
 p.overheadMode=document.getElementById("pOverheadMode").value;
 p.transportKm=num(document.getElementById("pKm").value);
 p.mermaPct=num(document.getElementById("pWaste").value);
 p.description=document.getElementById("pDesc").value.trim();
 const imageInput=document.getElementById("pImage");
 if(imageInput?.dataset?.imageData!==undefined) p.image=imageInput.dataset.imageData||"";
 p.laborRef=document.getElementById("pLabor").value;
 p.laborValue=num(document.getElementById("pLaborMin").value);
 p.laborMin=p.laborValue;
 p.laborUnit=document.getElementById("pLaborUnit").value;
 p.recipe=[...document.querySelectorAll(".recipe-row")].map(r=>({ref:r.querySelector(".r-ref").value,qty:num(r.querySelector(".r-qty").value),unit:r.querySelector(".r-unit").value}));
 p.tools=[...document.querySelectorAll(".tool-row")].map(r=>({ref:r.querySelector(".t-ref").value,method:r.querySelector(".t-method").value,value:num(r.querySelector(".t-value").value),unit:r.querySelector(".t-unit").value}));
 p.services=[...document.querySelectorAll(".service-row")].map(r=>({ref:r.querySelector(".s-ref").value,method:r.querySelector(".s-method").value,value:num(r.querySelector(".s-value").value)}));
 p.packaging=[...document.querySelectorAll(".pack-row")].map(r=>({ref:r.querySelector(".pk-ref").value,qty:num(r.querySelector(".pk-qty").value),unit:r.querySelector(".pk-unit").value}));
 p.fixed=[...document.querySelectorAll(".fixed-row")].map(r=>({ref:r.querySelector(".f-ref").value,method:r.querySelector(".f-method").value,value:num(r.querySelector(".f-value").value),unit:r.querySelector(".f-unit").value}));
 p.marketing=[...document.querySelectorAll(".marketing-row")].map(r=>({ref:r.querySelector(".m-ref").value,method:r.querySelector(".m-method").value,value:num(r.querySelector(".m-value").value),unit:r.querySelector(".m-unit").value}));
 if(!id)db.products.push(p);
 normalizeProduct(p);currentProductId=p.id;save();closeModal();currentView="dashboard";render();toast("Producto guardado correctamente");
}
function saveResource(type,id){
 const meta=resourceMeta[type];let x=id?db[type].find(y=>y.id===id):{id:uid(type[0])};
 meta.fields.forEach(([key,,t])=>{const el=document.getElementById("r_"+key);x[key]=t==="number"?num(el.value):el.value.trim()});
 if(!id)db[type].push(x);save();closeModal();render();toast("Registro guardado");
}
function setupSimulator(){
 const pSel=document.getElementById("simProduct");if(!pSel)return;
 const update=()=>{
  currentProductId=pSel.value;const p=db.products.find(x=>x.id===currentProductId),c=productCosts(p);
  const margin=num(document.getElementById("simMargin").value),suggest=priceFromMargin(c.perUnit,margin),price=num(document.getElementById("simPrice").value),daily=num(document.getElementById("simDaily").value),days=num(document.getElementById("simDays").value),units=daily*days;
  document.getElementById("simCost").value=c.total.toFixed(2);document.getElementById("simMarginVal").textContent=margin.toFixed(0)+"%";document.getElementById("simSuggested").innerHTML=`Precio sugerido con ${margin.toFixed(0)}% de margen: <b>${money(suggest)}</b>`;
  const revenue=price*units, variable=(c.variable+(c.tools+c.services)/c.yieldQty)*units, fixed=c.fixedMonthly, totalCosts=variable+fixed, profit=revenue-totalCosts, m= revenue?profit/revenue*100:0;
  document.getElementById("simRevenue").textContent=money(revenue);document.getElementById("simCosts").textContent=money(totalCosts);document.getElementById("simProfit").textContent=money(profit);document.getElementById("simMarginOut").textContent=m.toFixed(1)+"%";
  const be=breakEven(p,price);document.getElementById("simBreak").innerHTML=Number.isFinite(be)?`Punto de equilibrio: <b>${be} unidades/mes</b> a ${money(price)}.`:"Con este precio no se cubren los costos fijos.";
  document.getElementById("scenarioTable").innerHTML=`<table class="table"><thead><tr><th>Escenario</th><th>Precio</th><th>Unidades</th><th>Utilidad</th></tr></thead><tbody>${[.9,1,1.1,1.2].map((mult,i)=>{const pr=suggest*mult,u=units,po=(pr-(c.variable+(c.tools+c.services)/c.yieldQty))*u-c.fixedMonthly;return `<tr><td>${["-10%","Sugerido","+10%","+20%"][i]}</td><td>${money(pr)}</td><td>${u}</td><td class="money">${money(po)}</td></tr>`}).join("")}</tbody></table>`;
 };
 ["simProduct","simPrice","simDaily","simDays","simMargin"].forEach(x=>document.getElementById(x)?.addEventListener("input",update));update();
}
function setupDashboard(){
 const m=document.getElementById("dashMargin");if(!m)return;
 const p=db.products.find(x=>x.id===currentProductId),c=productCosts(p);
 const update=()=>{const margin=num(m.value),sp=priceFromMargin(c.perUnit,margin);document.getElementById("dashMarginVal").textContent=margin.toFixed(0)+"%";document.getElementById("dashPrice").innerHTML=`Precio sugerido <b>${money(sp)}</b>`;const units=num(document.getElementById("dashUnits").value)*num(document.getElementById("dashDays").value),price=num(document.getElementById("dashSale").value);document.getElementById("dashRevenue").textContent=money(price*units);document.getElementById("dashProfit").textContent=money((price-(c.variable+(c.tools+c.services)/c.yieldQty))*units-c.fixedMonthly)};
["dashMargin","dashSale","dashUnits","dashDays"].forEach(x=>document.getElementById(x)?.addEventListener("input",update));update();
}
function helpModal(){modal(`<div class="modal-backdrop"><div class="modal"><div class="modal-head"><h2>Cómo usar COSTA</h2><button class="close" data-action="close-modal">×</button></div><div class="modal-body"><div class="alert success"><b>1.</b> Registra tus insumos con precio y presentación.</div><div class="alert success"><b>2.</b> Registra equipos, servicios, espacio, transporte y mano de obra.</div><div class="alert success"><b>3.</b> Crea un producto y arma su receta.</div><div class="alert success"><b>4.</b> COSTA calcula el costo real, precio sugerido, margen y punto de equilibrio.</div><div class="alert"><b>Todo queda en este dispositivo.</b> Usa Exportar respaldo para guardar una copia.</div></div><div class="modal-foot"><button class="btn primary" data-action="close-modal">Entendido</button></div></div></div>`)}
function exportData(){const blob=new Blob([JSON.stringify(db,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="costa-respaldo.json";a.click();URL.revokeObjectURL(a.href);toast("Respaldo exportado")}
function importData(){const input=document.createElement("input");input.type="file";input.accept=".json,application/json";input.onchange=()=>{const f=input.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{db=JSON.parse(r.result);if(!db.products||!db.ingredients)throw Error();db.products.forEach(normalizeProduct);save();render();toast("Respaldo importado")}catch(e){alert("El archivo no es válido.")}};r.readAsText(f)};input.click()}
document.addEventListener("click",e=>{
 const btn=e.target.closest("[data-action]");
 if(btn){e.preventDefault();action(btn.dataset.action,btn);return;}
 if(e.target.classList.contains("modal-backdrop")) closeModal();
});

const oldRender=render;
render=function(){oldRender();setupSimulator();setupDashboard()};
render();
