const KEY="costa_v1";
const seed={
 business:{name:"Tu Negocio",type:"Negocio en casa",currency:"MXN"},
 ingredients:[
  {id:"i1",name:"Harina de trigo",unit:"kg",packQty:10,packPrice:300},
  {id:"i2",name:"Queso mozzarella",unit:"kg",packQty:2,packPrice:180},
  {id:"i3",name:"Jamón",unit:"kg",packQty:1,packPrice:250},
  {id:"i4",name:"Piña",unit:"kg",packQty:2,packPrice:80},
  {id:"i5",name:"Salsa de tomate",unit:"kg",packQty:2,packPrice:80},
  {id:"i6",name:"Aceite",unit:"L",packQty:1,packPrice:50},
  {id:"i7",name:"Sal, azúcar y levadura",unit:"kg",packQty:1,packPrice:20}
 ],
 equipment:[{id:"e1",name:"Horno",purchase:8000,lifeMonths:60,residual:0},{id:"e2",name:"Refrigerador",purchase:9000,lifeMonths:84,residual:0}],
 services:[{id:"s1",name:"Electricidad",monthly:900,businessPct:30},{id:"s2",name:"Gas",monthly:600,businessPct:100},{id:"s3",name:"Agua",monthly:300,businessPct:20},{id:"s4",name:"Internet / Teléfono",monthly:500,businessPct:20}],
 transport:[{id:"t1",name:"Reparto local",costPerKm:3.2}],
 labor:[{id:"l1",name:"Producción",hourRate:60}],
 packaging:[{id:"p1",name:"Caja para pizza",unitPrice:8},{id:"p2",name:"Servilletas",unitPrice:.6}],
 fixed:[{id:"f1",name:"Espacio / lugar",monthly:4000,businessPct:20}],
 marketing:[{id:"m1",name:"Publicidad",monthly:500}],
 products:[
  {id:"p1",name:"Pizza Hawaiana",description:"Pizza artesanal con jamón, piña y queso mozzarella.",category:"Comida",unit:"pizza",yield:1,timeMin:20,price:135,targetMargin:37.6,
   recipe:[{ref:"i1",qty:.3},{ref:"i2",qty:.25},{ref:"i3",qty:.1},{ref:"i4",qty:.1},{ref:"i5",qty:.1},{ref:"i6",qty:.01},{ref:"i7",qty:.015}],
   packaging:[{ref:"p1",qty:1}],laborRef:"l1",laborMin:20,transportKm:1.25,mermaPct:5},
  {id:"p2",name:"Pizza Pepperoni",description:"Pizza con mozzarella y pepperoni.",category:"Comida",unit:"pizza",yield:1,timeMin:20,price:145,targetMargin:40,
   recipe:[{ref:"i1",qty:.3},{ref:"i2",qty:.25},{ref:"i5",qty:.1}],packaging:[{ref:"p1",qty:1}],laborRef:"l1",laborMin:20,transportKm:1.25,mermaPct:5}
 ],
 sales:[]
};
let db=load();
let currentView="dashboard", currentProductId="p1";

function load(){try{const x=JSON.parse(localStorage.getItem(KEY));return x||structuredClone(seed)}catch(e){return structuredClone(seed)}}
function save(){localStorage.setItem(KEY,JSON.stringify(db))}
function uid(p="x"){return p+Math.random().toString(36).slice(2,9)}
function money(n){return new Intl.NumberFormat("es-MX",{style:"currency",currency:db.business.currency||"MXN"}).format(Number(n)||0)}
function num(v){return Number(v)||0}
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function ingCost(i){return i.packQty?i.packPrice/i.packQty:0}
function equipmentMonthly(){return db.equipment.reduce((s,x)=>s+Math.max(0,(num(x.purchase)-num(x.residual))/Math.max(1,num(x.lifeMonths))),0)}
function serviceMonthly(){return db.services.reduce((s,x)=>s+num(x.monthly)*num(x.businessPct)/100,0)}
function fixedMonthly(){return db.fixed.reduce((s,x)=>s+num(x.monthly)*num(x.businessPct)/100,0)}
function marketingMonthly(){return db.marketing.reduce((s,x)=>s+num(x.monthly),0)}
function productCosts(p){
 let direct=0;
 (p.recipe||[]).forEach(r=>{const i=db.ingredients.find(x=>x.id===r.ref);if(i)direct+=ingCost(i)*num(r.qty)});
 (p.packaging||[]).forEach(r=>{const x=db.packaging.find(y=>y.id===r.ref);if(x)direct+=num(x.unitPrice)*num(r.qty)});
 const labor=db.labor.find(x=>x.id===p.laborRef); const laborCost=labor?(num(labor.hourRate)/60*num(p.laborMin)):0;
 const monthlyUnits=Math.max(1,Number(p.monthlyUnits)||300);
 const indirect=(equipmentMonthly()+serviceMonthly()+fixedMonthly()+marketingMonthly())/monthlyUnits;
 const transport=num(p.transportKm)*num((db.transport[0]||{}).costPerKm);
 const subtotal=direct+laborCost+indirect+transport;
 const waste=subtotal*num(p.mermaPct)/100;
 const total=subtotal+waste;
 return {direct,labor:laborCost,indirect,transport,waste,total,monthlyUnits};
}
function priceFromMargin(cost,margin){return margin>=100?0:cost/(1-margin/100)}
function suggestedPrice(p){return priceFromMargin(productCosts(p).total,num(p.targetMargin))}
function breakEven(p,price){const fixed=equipmentMonthly()+serviceMonthly()+fixedMonthly()+marketingMonthly(); const c=productCosts(p); const contribution=num(price)-c.direct-c.labor-c.transport-c.waste; return contribution>0?Math.ceil(fixed/contribution):Infinity}

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
function dashboard(){
 const p=db.products.find(x=>x.id===currentProductId)||db.products[0]; if(!p)return head("Inicio")+`<div class="card empty">Agrega tu primer producto.</div>`;
 const c=productCosts(p), sp=suggestedPrice(p), be=breakEven(p,sp);
 return head("Inicio","Vista general de tus costos, precios y rentabilidad.",`<button class="btn primary" data-action="new-product">＋ Nuevo producto</button>`)+
 `<div class="card section-card hero-product"><div class="pizza-art"></div><div style="flex:1"><h2>${esc(p.name)} <button class="btn small" data-action="edit-product" data-id="${p.id}">✎</button></h2><p>${esc(p.description||"")}</p><span class="tag">${esc(p.category||"Producto")}</span> <span class="tag gray">${esc(p.unit||"unidad")}</span><span class="tag gray">${p.timeMin||0} min</span></div></div>
 <div class="tabs"><button class="tab active">▣ Resumen</button><button class="tab" data-action="product-tab" data-id="${p.id}" data-tab="ingredients">◇ Ingredientes</button><button class="tab" data-action="product-tab" data-id="${p.id}" data-tab="indirect">⚙ Costos indirectos</button><button class="tab" data-action="product-tab" data-id="${p.id}" data-tab="price">▥ Precio y ganancia</button><button class="tab" data-action="go-sim" data-id="${p.id}">▦ Simulador</button></div>
 <div class="cards"><div class="card metric"><div class="label">Costo total por unidad</div><div class="value">${money(c.total)}</div><div class="progress"><i style="width:${Math.min(100,c.direct/c.total*100)}%"></i></div><div class="hint">Directos ${money(c.direct)} · Indirectos ${money(c.total-c.direct)}</div></div>
 <div class="card metric good"><div class="label">Precio sugerido</div><div class="value">${money(sp)}</div><div class="hint">Ganancia estimada <b>${money(sp-c.total)}</b> por unidad · margen ${num(p.targetMargin).toFixed(1)}%</div></div>
 <div class="card metric"><div class="label">Punto de equilibrio</div><div class="value">${Number.isFinite(be)?be+" u/mes":"—"}</div><div class="hint">Con tus costos actuales y precio sugerido.</div></div></div>
 <div class="grid2"><div class="card section-card"><div class="section-title"><h3>Ingredientes / Insumos</h3><button class="btn small" data-action="product-tab" data-id="${p.id}" data-tab="ingredients">Ver todo</button></div>${recipeTable(p,c)}</div>
 <div class="card section-card"><div class="section-title"><h3>Costos indirectos por unidad</h3><button class="btn small" data-action="product-tab" data-id="${p.id}" data-tab="indirect">Configurar</button></div>${indirectTable(c)}</div></div>
 <div class="grid3" style="margin-top:12px"><div class="card section-card"><div class="section-title"><h3>Estructura de costos</h3></div><div class="donut"></div><div class="axis"><span>Directos</span><span>Mano de obra</span><span>Indirectos</span></div></div>
 <div class="card section-card"><div class="section-title"><h3>Simulador de precio</h3></div><div class="field"><label>Ganancia deseada</label><div class="range-row"><input id="dashMargin" type="range" min="0" max="80" value="${num(p.targetMargin)}"><span class="range-val" id="dashMarginVal">${num(p.targetMargin).toFixed(0)}%</span></div></div><div class="alert success" id="dashPrice">Precio sugerido <b>${money(sp)}</b></div><button class="btn primary" data-action="go-sim">Calcular completo</button></div>
 <div class="card section-card"><div class="section-title"><h3>Proyección mensual</h3></div><div class="form-grid"><label class="field">Precio de venta<input id="dashSale" type="number" value="${Math.round(sp)}"></label><label class="field">Ventas diarias<input id="dashUnits" type="number" value="10"></label><label class="field">Días al mes<input id="dashDays" type="number" value="26"></label></div><div class="kpi-row" style="margin-top:10px"><div class="mini-kpi"><b id="dashRevenue">${money(sp*260)}</b><span>Ventas</span></div><div class="mini-kpi"><b id="dashProfit">${money((sp-c.total)*260)}</b><span>Utilidad estimada</span></div></div></div></div>`;
}
function recipeTable(p,c){
 let rows=(p.recipe||[]).map(r=>{const i=db.ingredients.find(x=>x.id===r.ref);const unit=ingCost(i||{});return `<tr><td>${esc(i?.name||"Insumo eliminado")}</td><td>${r.qty}</td><td>${money(unit)}/${i?.unit||"u"}</td><td class="money">${money(unit*r.qty)}</td></tr>`}).join("");
 rows+=(p.packaging||[]).map(r=>{const x=db.packaging.find(y=>y.id===r.ref);return `<tr><td>${esc(x?.name||"Empaque")}</td><td>${r.qty}</td><td>${money(x?.unitPrice||0)}/u</td><td class="money">${money((x?.unitPrice||0)*r.qty)}</td></tr>`}).join("");
 return `<div class="table-wrap"><table class="table"><thead><tr><th>Insumo</th><th>Cantidad</th><th>Costo unitario</th><th>Costo</th></tr></thead><tbody>${rows}</tbody><tfoot><tr><td colspan="3"><b>Total directos</b></td><td class="money"><b>${money(c.direct)}</b></td></tr></tfoot></table></div>`;
}
function indirectTable(c){
 const monthlyUnits=c.monthlyUnits;
 const arr=[
 ["Equipo y herramientas",equipmentMonthly()/monthlyUnits],
 ["Servicios",serviceMonthly()/monthlyUnits],
 ["Espacio / gastos fijos",fixedMonthly()/monthlyUnits],
 ["Marketing y ventas",marketingMonthly()/monthlyUnits],
 ["Transporte (promedio)",c.transport],
 ["Mano de obra",c.labor],
 ["Merma / desperdicio",c.waste]
 ];
 return `<div class="table-wrap"><table class="table"><thead><tr><th>Concepto</th><th>Costo por unidad</th></tr></thead><tbody>${arr.map(x=>`<tr><td>${x[0]}</td><td class="money">${money(x[1])}</td></tr>`).join("")}</tbody><tfoot><tr><td><b>Total indirectos</b></td><td class="money"><b>${money(c.total-c.direct)}</b></td></tr></tfoot></table></div>`;
}

function products(){
 return head("Productos","Crea cualquier producto: comida, artesanía, servicio, reparación, etc.",`<button class="btn primary" data-action="new-product">＋ Nuevo producto</button>`) +
 `<div class="list-cards">${db.products.map(p=>{const c=productCosts(p),sp=suggestedPrice(p);return `<div class="card product-card"><div class="pc-top"><div><h3>${esc(p.name)}</h3><p>${esc(p.description||"")}</p></div><span class="tag">${esc(p.category||"General")}</span></div><div class="kpi-row"><div class="mini-kpi"><b>${money(c.total)}</b><span>Costo real</span></div><div class="mini-kpi"><b>${money(sp)}</b><span>Sugerido</span></div></div><div class="price-row" style="margin-top:12px"><div><span class="muted" style="font-size:9px">Margen objetivo</span><div class="big">${num(p.targetMargin).toFixed(1)}%</div></div><div class="actions"><button class="btn small" data-action="edit-product" data-id="${p.id}">Editar</button><button class="btn small danger" data-action="delete-product" data-id="${p.id}">Eliminar</button></div></div></div>`}).join("")}</div>`;
}

const resourceMeta={
ingredients:{title:"Ingredientes / Insumos",fields:[["name","Nombre","text"],["unit","Unidad","text"],["packQty","Cantidad del paquete","number"],["packPrice","Precio del paquete","number"]],desc:"Registra materiales o insumos y COSTA calculará su costo por unidad."},
equipment:{title:"Equipos y herramientas",fields:[["name","Nombre","text"],["purchase","Precio de compra","number"],["lifeMonths","Vida útil (meses)","number"],["residual","Valor residual","number"]],desc:"El costo de tus equipos se distribuye según su vida útil."},
services:{title:"Servicios",fields:[["name","Servicio","text"],["monthly","Costo mensual","number"],["businessPct","% usado por el negocio","number"]],desc:"Luz, gas, agua, internet y otros servicios."},
transport:{title:"Transporte",fields:[["name","Concepto","text"],["costPerKm","Costo por km","number"]],desc:"Calcula entregas y traslados con un costo por kilómetro."},
labor:{title:"Mano de obra",fields:[["name","Actividad","text"],["hourRate","Valor por hora","number"]],desc:"Aunque seas tú quien trabaja, registra el valor de tu tiempo."},
packaging:{title:"Empaques",fields:[["name","Empaque","text"],["unitPrice","Costo por unidad","number"]],desc:"Cajas, bolsas, etiquetas, vasos, servilletas, etc."},
fixed:{title:"Gastos fijos",fields:[["name","Concepto","text"],["monthly","Costo mensual","number"],["businessPct","% asignado al negocio","number"]],desc:"Renta, espacio, licencias y otros gastos recurrentes."},
marketing:{title:"Marketing y ventas",fields:[["name","Concepto","text"],["monthly","Costo mensual","number"]],desc:"Publicidad, impresos, plataformas y otros costos comerciales."}
};
function resources(type,title){
 const meta=resourceMeta[type], arr=db[type];
 const rows=arr.map(x=>{let unit="";if(type==="ingredients")unit=`${money(ingCost(x))}/${x.unit}`;if(type==="equipment")unit=money((num(x.purchase)-num(x.residual))/Math.max(1,num(x.lifeMonths)))+"/mes";if(type==="services"||type==="fixed")unit=money(num(x.monthly)*num(x.businessPct)/100)+"/mes";if(type==="transport")unit=money(x.costPerKm)+"/km";if(type==="labor")unit=money(x.hourRate)+"/h";if(type==="packaging")unit=money(x.unitPrice)+"/u";if(type==="marketing")unit=money(x.monthly)+"/mes";return `<tr><td><b>${esc(x.name)}</b></td><td>${unit}</td><td>${type==="ingredients"?`Compra: ${money(x.packPrice)} / ${x.packQty} ${x.unit}`:type==="equipment"?`Vida: ${x.lifeMonths} meses`:type==="services"||type==="fixed"?`${x.businessPct}% asignado`:type==="transport"?"":type==="labor"?"":""}</td><td class="money"><button class="btn small" data-action="edit-resource" data-type="${type}" data-id="${x.id}">Editar</button> <button class="btn small danger" data-action="delete-resource" data-type="${type}" data-id="${x.id}">Eliminar</button></td></tr>`}).join("");
 return head(title,meta.desc,`<button class="btn primary" data-action="new-resource" data-type="${type}">＋ Agregar</button>`)+
 `<div class="card section-card"><div class="table-wrap"><table class="table"><thead><tr><th>Nombre</th><th>Costo calculado</th><th>Referencia</th><th></th></tr></thead><tbody>${rows||`<tr><td colspan="4"><div class="empty">Aún no hay registros.</div></td></tr>`}</tbody></table></div></div>`;
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
 return head("Configuración","Todo se guarda en este dispositivo. No usamos Firebase ni servidor.",`<button class="btn primary" data-action="save-settings">Guardar cambios</button>`)+
 `<div class="grid2"><div class="card section-card"><div class="section-title"><h3>Negocio</h3></div><div class="form-grid"><label class="field">Nombre<input id="setName" value="${esc(db.business.name)}"></label><label class="field">Tipo de negocio<input id="setType" value="${esc(db.business.type)}"></label><label class="field">Moneda<select id="setCurrency"><option value="MXN" ${db.business.currency==="MXN"?"selected":""}>MXN — Peso mexicano</option><option value="USD" ${db.business.currency==="USD"?"selected":""}>USD — Dólar</option></select></label></div></div>
 <div class="card section-card"><div class="section-title"><h3>Datos</h3></div><p class="sub">Tus datos permanecen en el navegador mediante LocalStorage.</p><div class="actions" style="margin-top:12px"><button class="btn" data-action="export-json">⇩ Exportar respaldo</button><button class="btn" data-action="import-json">⇧ Importar respaldo</button><button class="btn danger" data-action="clear-data">Restablecer todo</button></div><div class="alert">Consejo: exporta un respaldo antes de cambiar de teléfono o borrar los datos del navegador.</div></div></div>`;
}

function productModal(id){
 const p=id?db.products.find(x=>x.id===id):{id:"",name:"",description:"",category:"Producto",unit:"unidad",yield:1,timeMin:20,price:0,targetMargin:40,recipe:[],packaging:[],laborRef:db.labor[0]?.id||"",laborMin:20,transportKm:1.25,mermaPct:5};
 return `<div class="modal-backdrop"><div class="modal"><div class="modal-head"><h2>${id?"Editar producto":"Nuevo producto"}</h2><button class="close" data-action="close-modal">×</button></div><div class="modal-body"><div class="form-grid"><label class="field">Nombre<input id="pName" value="${esc(p.name)}"></label><label class="field">Categoría<input id="pCategory" value="${esc(p.category)}"></label><label class="field">Unidad de venta<input id="pUnit" value="${esc(p.unit)}"></label><label class="field">Rendimiento<input id="pYield" type="number" value="${p.yield}"></label><label class="field">Tiempo de elaboración (min)<input id="pTime" type="number" value="${p.timeMin}"></label><label class="field">Margen objetivo (%)<input id="pMargin" type="number" value="${p.targetMargin}"></label><label class="field">Kilómetros promedio<input id="pKm" type="number" step=".01" value="${p.transportKm}"></label><label class="field">Merma (%)<input id="pWaste" type="number" step=".1" value="${p.mermaPct}"></label><label class="field full">Descripción<textarea id="pDesc">${esc(p.description)}</textarea></label></div><hr><div class="section-title"><h3>Ingredientes / insumos</h3><button class="btn small" data-action="add-recipe-row">＋ Agregar</button></div><div id="recipeEditor">${recipeEditor(p)}</div><div class="section-title" style="margin-top:14px"><h3>Empaques</h3><button class="btn small" data-action="add-pack-row">＋ Agregar</button></div><div id="packEditor">${packEditor(p)}</div><div class="form-grid" style="margin-top:14px"><label class="field">Mano de obra<select id="pLabor">${db.labor.map(x=>`<option value="${x.id}" ${x.id===p.laborRef?"selected":""}>${esc(x.name)} — ${money(x.hourRate)}/h</option>`).join("")}</select></label><label class="field">Minutos de mano de obra<input id="pLaborMin" type="number" value="${p.laborMin}"></label></div></div><div class="modal-foot"><button class="btn" data-action="close-modal">Cancelar</button><button class="btn primary" data-action="save-product" data-id="${id||""}">Guardar producto</button></div></div></div>`;
}
function recipeEditor(p){return (p.recipe||[]).map((r,i)=>`<div class="form-grid recipe-row" data-index="${i}" style="margin-bottom:7px"><label class="field">Insumo<select class="r-ref">${db.ingredients.map(x=>`<option value="${x.id}" ${x.id===r.ref?"selected":""}>${esc(x.name)}</option>`).join("")}</select></label><label class="field">Cantidad usada<input class="r-qty" type="number" step=".001" value="${r.qty}"></label></div>`).join("")||`<div class="empty">Agrega los insumos que utiliza el producto.</div>`}
function packEditor(p){return (p.packaging||[]).map(r=>`<div class="form-grid pack-row" style="margin-bottom:7px"><label class="field">Empaque<select class="pk-ref">${db.packaging.map(x=>`<option value="${x.id}" ${x.id===r.ref?"selected":""}>${esc(x.name)}</option>`).join("")}</select></label><label class="field">Cantidad<input class="pk-qty" type="number" step=".01" value="${r.qty}"></label></div>`).join("")||`<div class="empty">Agrega empaques si aplica.</div>`}

function resourceModal(type,id){
 const meta=resourceMeta[type], x=id?db[type].find(y=>y.id===id):{};
 const fields=meta.fields.map(([key,label,t])=>`<label class="field">${label}<input id="r_${key}" type="${t}" value="${esc(x[key]??"")}"></label>`).join("");
 return `<div class="modal-backdrop"><div class="modal"><div class="modal-head"><h2>${id?"Editar":"Agregar"} ${meta.title}</h2><button class="close" data-action="close-modal">×</button></div><div class="modal-body"><div class="form-grid">${fields}</div></div><div class="modal-foot"><button class="btn" data-action="close-modal">Cancelar</button><button class="btn primary" data-action="save-resource" data-type="${type}" data-id="${id||""}">Guardar</button></div></div></div>`;
}
function modal(html){document.getElementById("modalRoot").innerHTML=html}
function closeModal(){document.getElementById("modalRoot").innerHTML=""}
function toast(msg){const x=document.getElementById("toast");x.textContent=msg;x.classList.add("show");setTimeout(()=>x.classList.remove("show"),2200)}
function bind(){
 document.querySelectorAll(".nav-item").forEach(b=>b.onclick=()=>{currentView=b.dataset.view;document.getElementById("sidebar").classList.remove("open");render()});
 document.getElementById("hamburger").onclick=()=>document.getElementById("sidebar").classList.toggle("open");
 document.querySelectorAll("[data-action]").forEach(b=>b.onclick=()=>action(b.dataset.action,b));
 const gs=document.getElementById("globalSearch");if(gs)gs.oninput=()=>{if(!gs.value.trim())return;const q=gs.value.toLowerCase();const found=db.products.find(p=>p.name.toLowerCase().includes(q));if(found){currentProductId=found.id;currentView="dashboard";render()}};
}
function action(a,b){
 const id=b.dataset.id,type=b.dataset.type;
 if(a==="new-product")modal(productModal());
 if(a==="edit-product"){currentProductId=id;modal(productModal(id))}
 if(a==="delete-product"){if(confirm("¿Eliminar este producto?")){db.products=db.products.filter(x=>x.id!==id);if(currentProductId===id)currentProductId=db.products[0]?.id;save();render();toast("Producto eliminado")}}
 if(a==="new-resource")modal(resourceModal(type));
 if(a==="edit-resource")modal(resourceModal(type,id));
 if(a==="delete-resource"){if(confirm("¿Eliminar este registro?")){db[type]=db[type].filter(x=>x.id!==id);save();render();toast("Registro eliminado")}}
 if(a==="close-modal")closeModal();
 if(a==="save-product")saveProduct(id);
 if(a==="save-resource")saveResource(type,id);
 if(a==="add-recipe-row"){const p=JSON.parse(JSON.stringify(db.products.find(x=>x.id===currentProductId)||{recipe:[]}));p.recipe=p.recipe||[];p.recipe.push({ref:db.ingredients[0]?.id||"",qty:1});document.getElementById("recipeEditor").innerHTML=recipeEditor(p)}
 if(a==="add-pack-row"){const p=JSON.parse(JSON.stringify(db.products.find(x=>x.id===currentProductId)||{packaging:[]}));p.packaging=p.packaging||[];p.packaging.push({ref:db.packaging[0]?.id||"",qty:1});document.getElementById("packEditor").innerHTML=packEditor(p)}
 if(a==="go-sim"){currentView="simulator";render()}
 if(a==="product-tab"){currentProductId=id;currentView="simulator";render();toast(b.dataset.tab==="ingredients"?"Los ingredientes se editan desde el producto.":"Abriendo simulador para revisar el cálculo.")}
 if(a==="reset-sim")render();
 if(a==="save-settings"){db.business.name=document.getElementById("setName").value.trim()||"Tu Negocio";db.business.type=document.getElementById("setType").value.trim()||"Negocio";db.business.currency=document.getElementById("setCurrency").value;save();render();toast("Configuración guardada")}
 if(a==="export-json")exportData();
 if(a==="import-json")importData();
 if(a==="clear-data"){if(confirm("Esto borrará los datos locales y volverá al ejemplo inicial. ¿Continuar?")){db=structuredClone(seed);save();render();toast("Datos restablecidos")}}
 if(a==="print-report")window.print();
 if(a==="helpBtn")helpModal();
}
function saveProduct(id){
 const p=id?db.products.find(x=>x.id===id):{id:uid("p"),recipe:[],packaging:[]};
 p.name=document.getElementById("pName").value.trim()||"Producto sin nombre";p.category=document.getElementById("pCategory").value.trim()||"General";p.unit=document.getElementById("pUnit").value.trim()||"unidad";p.yield=num(document.getElementById("pYield").value)||1;p.timeMin=num(document.getElementById("pTime").value);p.targetMargin=num(document.getElementById("pMargin").value);p.transportKm=num(document.getElementById("pKm").value);p.mermaPct=num(document.getElementById("pWaste").value);p.description=document.getElementById("pDesc").value.trim();p.laborRef=document.getElementById("pLabor").value;p.laborMin=num(document.getElementById("pLaborMin").value);
 p.recipe=[...document.querySelectorAll(".recipe-row")].map(r=>({ref:r.querySelector(".r-ref").value,qty:num(r.querySelector(".r-qty").value)}));
 p.packaging=[...document.querySelectorAll(".pack-row")].map(r=>({ref:r.querySelector(".pk-ref").value,qty:num(r.querySelector(".pk-qty").value)}));
 if(!id)db.products.push(p);currentProductId=p.id;save();closeModal();currentView="dashboard";render();toast("Producto guardado correctamente");
}
function saveResource(type,id){
 const meta=resourceMeta[type];let x=id?db[type].find(y=>y.id===id):{id:uid(type[0])};
 meta.fields.forEach(([key,,t])=>x[key]=t==="number"?num(document.getElementById("r_"+key).value):document.getElementById("r_"+key).value.trim());
 if(!id)db[type].push(x);save();closeModal();render();toast("Registro guardado");
}
function setupSimulator(){
 const pSel=document.getElementById("simProduct");if(!pSel)return;
 const update=()=>{
  currentProductId=pSel.value;const p=db.products.find(x=>x.id===currentProductId),c=productCosts(p);
  const margin=num(document.getElementById("simMargin").value),suggest=priceFromMargin(c.total,margin),price=num(document.getElementById("simPrice").value),daily=num(document.getElementById("simDaily").value),days=num(document.getElementById("simDays").value),units=daily*days;
  document.getElementById("simCost").value=c.total.toFixed(2);document.getElementById("simMarginVal").textContent=margin.toFixed(0)+"%";document.getElementById("simSuggested").innerHTML=`Precio sugerido con ${margin.toFixed(0)}% de margen: <b>${money(suggest)}</b>`;
  const revenue=price*units, variable=c.total*units, profit=revenue-variable, m= revenue?profit/revenue*100:0;
  document.getElementById("simRevenue").textContent=money(revenue);document.getElementById("simCosts").textContent=money(variable);document.getElementById("simProfit").textContent=money(profit);document.getElementById("simMarginOut").textContent=m.toFixed(1)+"%";
  const be=breakEven(p,price);document.getElementById("simBreak").innerHTML=Number.isFinite(be)?`Punto de equilibrio: <b>${be} unidades/mes</b> a ${money(price)}.`:"Con este precio no se cubren los costos fijos.";
  document.getElementById("scenarioTable").innerHTML=`<table class="table"><thead><tr><th>Escenario</th><th>Precio</th><th>Unidades</th><th>Utilidad</th></tr></thead><tbody>${[.9,1,1.1,1.2].map((mult,i)=>{const pr=suggest*mult,u=units,po=(pr-c.total)*u;return `<tr><td>${["-10%","Sugerido","+10%","+20%"][i]}</td><td>${money(pr)}</td><td>${u}</td><td class="money">${money(po)}</td></tr>`}).join("")}</tbody></table>`;
 };
 ["simProduct","simPrice","simDaily","simDays","simMargin"].forEach(x=>document.getElementById(x)?.addEventListener("input",update));update();
}
function setupDashboard(){
 const m=document.getElementById("dashMargin");if(!m)return;
 const p=db.products.find(x=>x.id===currentProductId),c=productCosts(p);
 const update=()=>{const margin=num(m.value),sp=priceFromMargin(c.total,margin);document.getElementById("dashMarginVal").textContent=margin.toFixed(0)+"%";document.getElementById("dashPrice").innerHTML=`Precio sugerido <b>${money(sp)}</b>`;const units=num(document.getElementById("dashUnits").value)*num(document.getElementById("dashDays").value),price=num(document.getElementById("dashSale").value);document.getElementById("dashRevenue").textContent=money(price*units);document.getElementById("dashProfit").textContent=money((price-c.total)*units)};
["dashMargin","dashSale","dashUnits","dashDays"].forEach(x=>document.getElementById(x)?.addEventListener("input",update));update();
}
function helpModal(){modal(`<div class="modal-backdrop"><div class="modal"><div class="modal-head"><h2>Cómo usar COSTA</h2><button class="close" data-action="close-modal">×</button></div><div class="modal-body"><div class="alert success"><b>1.</b> Registra tus insumos con precio y presentación.</div><div class="alert success"><b>2.</b> Registra equipos, servicios, espacio, transporte y mano de obra.</div><div class="alert success"><b>3.</b> Crea un producto y arma su receta.</div><div class="alert success"><b>4.</b> COSTA calcula el costo real, precio sugerido, margen y punto de equilibrio.</div><div class="alert"><b>Todo queda en este dispositivo.</b> Usa Exportar respaldo para guardar una copia.</div></div><div class="modal-foot"><button class="btn primary" data-action="close-modal">Entendido</button></div></div></div>`)}
function exportData(){const blob=new Blob([JSON.stringify(db,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="costa-respaldo.json";a.click();URL.revokeObjectURL(a.href);toast("Respaldo exportado")}
function importData(){const input=document.createElement("input");input.type="file";input.accept=".json,application/json";input.onchange=()=>{const f=input.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{db=JSON.parse(r.result);save();render();toast("Respaldo importado")}catch(e){alert("El archivo no es válido.")}};r.readAsText(f)};input.click()}
document.addEventListener("input",e=>{});
document.addEventListener("click",e=>{if(e.target.id==="helpBtn")helpModal()});
const oldRender=render;
render=function(){oldRender();setupSimulator();setupDashboard()};
render();
