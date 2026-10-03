const KEY="shopmaster_pos_v1";
const defaultDB={setup:false,shop:{name:"My Shop",owner:"Owner",currency:"Rs.",phone:"",address:""},user:{username:"admin",password:"admin",role:"OWNER"},products:[
{id:1,name:"Sample Product",sku:"SP-001",category:"General",buy:100,sell:150,stock:25,min:5}
],customers:[],sales:[],expenses:[],categories:["General"]};

let db=JSON.parse(localStorage.getItem(KEY)||"null")||structuredClone(defaultDB);
let page="Dashboard", cart=[];

function save(){localStorage.setItem(KEY,JSON.stringify(db))}
function money(v){return `${db.shop.currency||"Rs."} ${Number(v||0).toFixed(2)}`}
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function toast(s){const x=document.createElement("div");x.className="toast";x.textContent=s;document.body.appendChild(x);setTimeout(()=>x.remove(),2200)}
function today(){return new Date().toISOString().slice(0,10)}
function uid(){return Date.now()+Math.floor(Math.random()*1000)}

function render(){
 if(!db.setup){renderSetup();return}
 renderShell();
}
function renderSetup(){
 document.querySelector("#app").innerHTML=`<div class="center"><form class="glass login" id="setup">
 <div class="logo">S</div><h1>Set up ShopMaster POS</h1><p class="muted">100% local browser version. Data is stored in this computer's localStorage.</p>
 <div class="field"><span>Shop name</span><input name="shop" required value="${esc(db.shop.name)}"></div>
 <div class="field"><span>Owner name</span><input name="owner" value="${esc(db.shop.owner)}"></div>
 <div class="field"><span>Currency</span><input name="currency" value="${esc(db.shop.currency)}"></div>
 <div class="field"><span>Username</span><input name="username" required value="admin"></div>
 <div class="field"><span>Password</span><input name="password" type="password" required value="admin"></div>
 <button class="btn primary" type="submit">Create local shop</button>
 </form></div>`;
 document.querySelector("#setup").onsubmit=e=>{e.preventDefault();const f=new FormData(e.currentTarget);db.shop.name=f.get("shop");db.shop.owner=f.get("owner");db.shop.currency=f.get("currency");db.user.username=f.get("username");db.user.password=f.get("password");db.setup=true;save();toast("Shop created");render()}
}

function renderShell(){
 document.querySelector("#app").innerHTML=`<div class="shell">
 <aside class="glass sidebar"><div class="brand"><div class="logo">${esc((db.shop.name||"S")[0])}</div>${esc(db.shop.name)}</div>
 <button class="nav ${page==="Dashboard"?"active":""}" onclick="go('Dashboard')">Dashboard</button>
 <button class="nav ${page==="POS"?"active":""}" onclick="go('POS')">POS / New Sale</button>
 <button class="nav ${page==="Products"?"active":""}" onclick="go('Products')">Products</button>
 <button class="nav ${page==="Inventory"?"active":""}" onclick="go('Inventory')">Inventory</button>
 <button class="nav ${page==="Customers"?"active":""}" onclick="go('Customers')">Customers</button>
 <button class="nav ${page==="Sales"?"active":""}" onclick="go('Sales')">Sales History</button>
 <button class="nav ${page==="Expenses"?"active":""}" onclick="go('Expenses')">Expenses</button>
 <button class="nav ${page==="Reports"?"active":""}" onclick="go('Reports')">Reports</button>
 <button class="nav ${page==="Settings"?"active":""}" onclick="go('Settings')">Settings</button>
 <div class="grow"></div><button class="nav" onclick="resetDemo()">Reset demo data</button></aside>
 <main class="main"><header class="glass topbar"><span>${new Date().toLocaleDateString()}</span><span class="grow"></span><span class="muted">${esc(db.shop.owner)}</span></header>
 <section class="glass content" id="content"></section></main></div>`;
 renderPage();
}
function go(p){page=p;renderShell()}
function renderPage(){const c=document.querySelector("#content");if(page==="Dashboard")dashboard(c);if(page==="POS")pos(c);if(page==="Products")products(c);if(page==="Inventory")inventory(c);if(page==="Customers")customers(c);if(page==="Sales")sales(c);if(page==="Expenses")expenses(c);if(page==="Reports")reports(c);if(page==="Settings")settings(c)}

function dashboard(c){
 const sales=db.sales.filter(x=>x.date===today()), total=sales.reduce((a,x)=>a+x.total,0), cost=sales.reduce((a,x)=>a+x.cost,0), ex=db.expenses.filter(x=>x.date===today()).reduce((a,x)=>a+x.amount,0);
 c.innerHTML=`<h1>Dashboard</h1><p class="muted">Offline shop overview</p>
 <div class="cards"><div class="glass card"><small>Today's sales</small><strong>${money(total)}</strong></div><div class="glass card"><small>Bills today</small><strong>${sales.length}</strong></div><div class="glass card"><small>Gross profit</small><strong>${money(total-cost)}</strong></div><div class="glass card"><small>Net after expenses</small><strong>${money(total-cost-ex)}</strong></div></div>
 <div class="grid2"><div class="glass inner"><h3>Recent sales</h3>${saleTable(sales.slice(-8).reverse())}</div><div class="glass inner"><h3>Low stock</h3>${table(["Product","Stock","Minimum"],db.products.filter(p=>p.stock<=p.min).map(p=>[esc(p.name),p.stock,p.min]))}</div></div>`;
}
function table(headers,rows,actions=""){return `<div class="table-wrap"><table><thead><tr>${headers.map(x=>`<th>${x}</th>`).join("")}</tr></thead><tbody>${rows.length?rows.map(r=>`<tr>${r.map(x=>`<td>${x}</td>`).join("")}</tr>`).join(""):`<tr><td class="empty" colspan="${headers.length}">No records</td></tr>`}</tbody></table></div>`}
function saleTable(items){return table(["Invoice","Total","Payment","Date"],items.map(x=>[x.invoice,money(x.total),x.payment,x.date+" "+x.time]))}

function products(c){
 c.innerHTML=`<div class="toolbar"><div><h1>Products</h1><p class="muted">Manage prices and stock.</p></div><div class="toolbar-right"><input class="search" id="pq" placeholder="Search products"><button class="btn primary" onclick="productModal()">+ Add Product</button></div></div><div id="ptable"></div>`;
 const draw=()=>{const q=document.querySelector("#pq").value.toLowerCase();const arr=db.products.filter(p=>(p.name+" "+p.sku+" "+p.category).toLowerCase().includes(q));document.querySelector("#ptable").innerHTML=table(["Name","SKU","Category","Buy","Sell","Stock","Actions"],arr.map(p=>[`<b>${esc(p.name)}</b>`,esc(p.sku),esc(p.category),money(p.buy),money(p.sell),p.stock,`<button class="btn" onclick="productModal(${p.id})">Edit</button> <button class="btn danger" onclick="delProduct(${p.id})">Delete</button>`]))};document.querySelector("#pq").oninput=draw;draw()
}
function productModal(id){
 const p=db.products.find(x=>x.id===id)||{name:"",sku:"",category:"General",buy:0,sell:0,stock:0,min:0};
 document.body.insertAdjacentHTML("beforeend",`<div class="modal-bg" id="modal"><form class="glass modal" id="pf"><h2>${id?"Edit":"Add"} product</h2><div class="form-grid">
 <label class="field"><span>Name</span><input name="name" required value="${esc(p.name)}"></label><label class="field"><span>SKU</span><input name="sku" value="${esc(p.sku)}"></label>
 <label class="field"><span>Category</span><input name="category" value="${esc(p.category)}"></label><label class="field"><span>Buy price</span><input name="buy" type="number" step=".01" value="${p.buy}"></label>
 <label class="field"><span>Sale price</span><input name="sell" type="number" step=".01" value="${p.sell}"></label><label class="field"><span>Stock</span><input name="stock" type="number" step=".01" value="${p.stock}"></label>
 <label class="field"><span>Minimum stock</span><input name="min" type="number" step=".01" value="${p.min}"></label></div>
 <div class="modal-actions"><button type="button" class="btn" onclick="document.querySelector('#modal').remove()">Cancel</button><button class="btn primary">Save</button></div></form></div>`);
 document.querySelector("#pf").onsubmit=e=>{e.preventDefault();const f=new FormData(e.currentTarget),v=Object.fromEntries(f);v.buy=+v.buy;v.sell=+v.sell;v.stock=+v.stock;v.min=+v.min;if(id)Object.assign(p,v);else db.products.push({id:uid(),...v});save();document.querySelector("#modal").remove();products(document.querySelector("#content"));toast("Product saved")}
}
function delProduct(id){if(confirm("Delete this product?")){db.products=db.products.filter(p=>p.id!==id);save();products(document.querySelector("#content"))}}
function inventory(c){c.innerHTML=`<h1>Inventory</h1><p class="muted">Current stock levels.</p>${table(["Product","SKU","Stock","Minimum","Status","Action"],db.products.map(p=>[esc(p.name),esc(p.sku),p.stock,p.min,p.stock<=p.min?'<span class="badge">LOW STOCK</span>':'<span class="badge">OK</span>',`<button class="btn" onclick="adjustStock(${p.id})">Adjust</button>`]))}`}
function adjustStock(id){const p=db.products.find(x=>x.id===id);const n=prompt(`New stock for ${p.name}:`,p.stock);if(n!==null&&!isNaN(n)){p.stock=+n;save();inventory(document.querySelector("#content"));toast("Stock updated")}}

function pos(c){
 c.innerHTML=`<h1>POS / New Sale</h1><div class="pos"><div class="glass pos-panel"><input class="search" id="ps" placeholder="Search product"><div class="product-grid" id="pg"></div></div><div class="glass pos-panel cart"><h2>Cart</h2><div class="cart-items" id="ci"></div><div class="totals"><div><span>Subtotal</span><b id="sub">0</b></div><div><span>Discount</span><input class="qty" id="disc" type="number" value="0" min="0"></div><div class="grand"><span>Total</span><b id="grand">0</b></div></div><select id="pay"><option>Cash</option><option>Card</option><option>Bank Transfer</option></select><button class="btn primary" style="margin-top:10px" onclick="checkout()">Complete Sale</button></div></div>`;
 const draw=()=>{const q=document.querySelector("#ps").value.toLowerCase();document.querySelector("#pg").innerHTML=db.products.filter(p=>(p.name+" "+p.sku).toLowerCase().includes(q)).map(p=>`<button class="product-tile" onclick="addCart(${p.id})"><b>${esc(p.name)}</b><small>${esc(p.sku)}</small><span>${money(p.sell)}</span><small>Stock: ${p.stock}</small></button>`).join("")||"<p class='muted'>No products.</p>"};document.querySelector("#ps").oninput=draw;document.querySelector("#disc").oninput=drawCart;draw();drawCart()
}
function addCart(id){const p=db.products.find(x=>x.id===id),x=cart.find(x=>x.id===id);if(!p||p.stock<=0)return toast("Out of stock");if(x){if(x.qty<p.stock)x.qty++;else toast("Not enough stock")}else cart.push({id,qty:1});drawCart()}
function drawCart(){const el=document.querySelector("#ci");if(!el)return;el.innerHTML=cart.length?cart.map(x=>{const p=db.products.find(p=>p.id===x.id);return `<div class="cart-row"><div class="grow"><b>${esc(p.name)}</b><small>${money(p.sell)} each</small></div><input class="qty" type="number" min="1" max="${p.stock}" value="${x.qty}" onchange="setQty(${x.id},this.value)"><b>${money(p.sell*x.qty)}</b><button class="btn danger" onclick="removeCart(${x.id})">×</button></div>`}).join(""):"<p class='muted'>Cart is empty.</p>";const sub=cart.reduce((a,x)=>a+db.products.find(p=>p.id===x.id).sell*x.qty,0),disc=+(document.querySelector("#disc")?.value||0),total=Math.max(0,sub-disc);document.querySelector("#sub").textContent=money(sub);document.querySelector("#grand").textContent=money(total)}
function setQty(id,q){const x=cart.find(x=>x.id===id);x.qty=Math.max(1,Math.min(+q,db.products.find(p=>p.id===id).stock));drawCart()}function removeCart(id){cart=cart.filter(x=>x.id!==id);drawCart()}
function checkout(){if(!cart.length)return toast("Cart is empty");const disc=+(document.querySelector("#disc").value||0),items=cart.map(x=>{const p=db.products.find(p=>p.id===x.id);return {id:p.id,name:p.name,qty:x.qty,sell:p.sell,buy:p.buy}});const subtotal=items.reduce((a,x)=>a+x.sell*x.qty,0),total=Math.max(0,subtotal-disc),cost=items.reduce((a,x)=>a+x.buy*x.qty,0);items.forEach(x=>db.products.find(p=>p.id===x.id).stock-=x.qty);const s={invoice:"INV-"+Date.now().toString().slice(-8),date:today(),time:new Date().toLocaleTimeString(),items,subtotal,discount:disc,total,cost,payment:document.querySelector("#pay").value};db.sales.push(s);save();cart=[];printReceipt(s);pos(document.querySelector("#content"));toast("Sale completed")}
function printReceipt(s){const w=window.open("","_blank","width=360,height=600");w.document.write(`<html><body class="receipt"><h3>${esc(db.shop.name)}</h3><p>${esc(db.shop.address||"")}<br>${esc(db.shop.phone||"")}</p><hr>${s.items.map(x=>`<div>${esc(x.name)} × ${x.qty}<span style="float:right">${money(x.sell*x.qty)}</span></div>`).join("")}<hr><div>Subtotal: ${money(s.subtotal)}</div><div>Discount: ${money(s.discount)}</div><h3>Total: ${money(s.total)}</h3><p>Invoice: ${s.invoice}<br>Payment: ${esc(s.payment)}<br>${s.date} ${s.time}</p><p style="text-align:center">Thank you!</p><script>window.print()<\/script></body></html>`);w.document.close()}

function customers(c){c.innerHTML=`<div class="toolbar"><h1>Customers</h1><button class="btn primary" onclick="customerModal()">+ Add Customer</button></div><div id="ct">${table(["Name","Phone","Address","Actions"],db.customers.map(x=>[esc(x.name),esc(x.phone),esc(x.address),`<button class="btn danger" onclick="delCustomer(${x.id})">Delete</button>`]))}</div>`}
function customerModal(){document.body.insertAdjacentHTML("beforeend",`<div class="modal-bg" id="modal"><form class="glass modal" id="cf"><h2>Add customer</h2><div class="form-grid"><label class="field"><span>Name</span><input name="name" required></label><label class="field"><span>Phone</span><input name="phone"></label><label class="field full"><span>Address</span><input name="address"></label></div><div class="modal-actions"><button type="button" class="btn" onclick="modal.remove()">Cancel</button><button class="btn primary">Save</button></div></form></div>`);const modal=document.querySelector("#modal");document.querySelector("#cf").onsubmit=e=>{e.preventDefault();const v=Object.fromEntries(new FormData(e.currentTarget));db.customers.push({id:uid(),...v});save();modal.remove();customers(document.querySelector("#content"))}}
function delCustomer(id){db.customers=db.customers.filter(x=>x.id!==id);save();customers(document.querySelector("#content"))}

function sales(c){c.innerHTML=`<div class="toolbar"><div><h1>Sales History</h1><p class="muted">All completed local sales.</p></div></div>${saleTable(db.sales.slice().reverse())}`}
function expenses(c){c.innerHTML=`<div class="toolbar"><h1>Expenses</h1><button class="btn primary" onclick="expenseModal()">+ Add Expense</button></div>${table(["Date","Title","Amount"],db.expenses.slice().reverse().map(x=>[x.date,esc(x.title),money(x.amount)]))}`}
function expenseModal(){document.body.insertAdjacentHTML("beforeend",`<div class="modal-bg" id="modal"><form class="glass modal" id="ef"><h2>Add expense</h2><div class="form-grid"><label class="field"><span>Title</span><input name="title" required></label><label class="field"><span>Amount</span><input name="amount" type="number" step=".01" required></label></div><div class="modal-actions"><button type="button" class="btn" onclick="modal.remove()">Cancel</button><button class="btn primary">Save</button></div></form></div>`);const modal=document.querySelector("#modal");document.querySelector("#ef").onsubmit=e=>{e.preventDefault();const v=Object.fromEntries(new FormData(e.currentTarget));db.expenses.push({id:uid(),date:today(),title:v.title,amount:+v.amount});save();modal.remove();expenses(document.querySelector("#content"))}}

function reports(c){const revenue=db.sales.reduce((a,x)=>a+x.total,0),cost=db.sales.reduce((a,x)=>a+x.cost,0),exp=db.expenses.reduce((a,x)=>a+x.amount,0);c.innerHTML=`<h1>Reports</h1><div class="cards"><div class="glass card"><small>Total sales</small><strong>${money(revenue)}</strong></div><div class="glass card"><small>Cost of goods</small><strong>${money(cost)}</strong></div><div class="glass card"><small>Gross profit</small><strong>${money(revenue-cost)}</strong></div><div class="glass card"><small>Expenses</small><strong>${money(exp)}</strong></div></div><div class="glass inner"><h3>Net profit</h3><strong style="font-size:30px">${money(revenue-cost-exp)}</strong></div>`}
function settings(c){c.innerHTML=`<h1>Settings</h1><div class="glass inner"><form id="sf"><div class="form-grid"><label class="field"><span>Shop name</span><input name="name" value="${esc(db.shop.name)}"></label><label class="field"><span>Owner</span><input name="owner" value="${esc(db.shop.owner)}"></label><label class="field"><span>Phone</span><input name="phone" value="${esc(db.shop.phone)}"></label><label class="field"><span>Currency</span><input name="currency" value="${esc(db.shop.currency)}"></label><label class="field full"><span>Address</span><input name="address" value="${esc(db.shop.address)}"></label></div><div class="modal-actions"><button class="btn primary">Save settings</button></div></form><hr><button class="btn" onclick="exportData()">Export backup</button> <button class="btn" onclick="importData()">Import backup</button></div>`;document.querySelector("#sf").onsubmit=e=>{e.preventDefault();const f=new FormData(e.currentTarget);db.shop.name=f.get("name");db.shop.owner=f.get("owner");db.shop.phone=f.get("phone");db.shop.currency=f.get("currency");db.shop.address=f.get("address");save();renderShell();toast("Settings saved")}}
function exportData(){const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(db,null,2)],{type:"application/json"}));a.download="shopmaster-backup.json";a.click();URL.revokeObjectURL(a.href)}
function importData(){const i=document.createElement("input");i.type="file";i.accept=".json";i.onchange=()=>{const r=new FileReader();r.onload=()=>{try{db=JSON.parse(r.result);save();render()}catch{toast("Invalid backup")}};r.readAsText(i.files[0])};i.click()}
function resetDemo(){if(confirm("Reset all local data?")){localStorage.removeItem(KEY);location.reload()}}
render();
