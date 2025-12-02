// --- простая модель хранения в localStorage ---
const DB = {
    getItems(){return JSON.parse(localStorage.getItem('mc_items')||'[]')},
    setItems(v){localStorage.setItem('mc_items', JSON.stringify(v))},
    getFluids(){return JSON.parse(localStorage.getItem('mc_fluids')||'[]')},
    setFluids(v){localStorage.setItem('mc_fluids', JSON.stringify(v))},
    getCrafts(){return JSON.parse(localStorage.getItem('mc_crafts')||'[]')},
    setCrafts(v){localStorage.setItem('mc_crafts', JSON.stringify(v))},
    clear(){localStorage.removeItem('mc_items');localStorage.removeItem('mc_fluids');localStorage.removeItem('mc_crafts')}
}

// --- initial machines list from your specification ---
const MACHINES = [
    'Верстак','Піч','Екстрактор','Компресор','Ріжучий механізм','Подрібнювач',
    'Металоформувальний: Видавлювання','Металоформувальний: Прокатка','Капілярний наповнювач',
    'Молекулярний перетворювач','Подвійний молекулярний перетворювач','Збірний стіл',
    'Індукційна плавильня','Розподільник рідини','Плавильня','Змішувач','Змінливий агрегат',
    'Осмієвий компресор','Металургічний наповнювач','Столяр','Рунний вівтар','Рунний вівтар X1',
    'Рунний вівтар X2','Рунний вівтар X3','Магічний синтезатор','Обмінник Альфхейма','Стол наповнення',
    'Чиста маргаритка','Басейн мани','Магічний верстак','Рунна матриця','Рідинний компресор'
];

// --- UI refs ---
const tabs = document.querySelectorAll('.tab');
const panes = document.querySelectorAll('.pane');
const itemsList = document.getElementById('itemsList');
const fluidsList = document.getElementById('fluidsList');
const jsonPreview = document.getElementById('jsonPreview');
const itemsDatalist = document.getElementById('itemsDatalist');

// init
function init(){
    // fill machines
    const machineSelect = document.getElementById('machineSelect');
    MACHINES.forEach(m=>{const o=document.createElement('option');o.value=m; o.textContent=m; machineSelect.appendChild(o)});
    refreshAll();
}

// tabs
tabs.forEach(t=>t.addEventListener('click',()=>{
    tabs.forEach(x=>x.classList.remove('active'));
    t.classList.add('active');
    panes.forEach(p=>p.style.display='none');
    document.getElementById(t.dataset.tab).style.display='block';
}));

// --- Library functions ---
function renderItems(){
    const items = DB.getItems();
    itemsList.innerHTML=''; itemsDatalist.innerHTML='';
    items.forEach((it,idx)=>{
    const r=document.createElement('div'); r.className='row';
    r.innerHTML=`<div style="flex:1"><strong>${escape(it.name)}</strong></div>`;
    const del=document.createElement('button'); del.textContent='Видалити'; del.className='danger'; del.addEventListener('click', ()=>{ if(confirm('Видалити предмет?')){ items.splice(idx,1); DB.setItems(items); refreshAll(); }});
    r.appendChild(del);
    itemsList.appendChild(r);
    const option=document.createElement('option'); option.value=it.name; itemsDatalist.appendChild(option);
    });
}

function renderFluids(){
    const fluids = DB.getFluids(); fluidsList.innerHTML='';
    fluids.forEach((f,idx)=>{
    const r=document.createElement('div'); r.className='row';
    r.innerHTML=`<div style="flex:1"><strong>${escape(f.name)}</strong> ${f.amount?(' — '+f.amount):''}</div>`;
    const del=document.createElement('button'); del.textContent='Видалити'; del.className='danger'; del.addEventListener('click', ()=>{ if(confirm('Видалити рідину?')){ fluids.splice(idx,1); DB.setFluids(fluids); refreshAll(); }});
    r.appendChild(del);
    fluidsList.appendChild(r);
    });
}

// --- Add new item/fluid ---
document.getElementById('addItemBtn').addEventListener('click',()=>{
    const name = document.getElementById('newItemName').value.trim(); if(!name) return alert('Введіть назву');
    const items = DB.getItems(); if(items.find(i=>i.name===name)) return alert('Такий предмет вже є');
    items.push({name}); DB.setItems(items); document.getElementById('newItemName').value=''; refreshAll();
});

document.getElementById('addFluidBtn').addEventListener('click',()=>{
    const name=document.getElementById('newFluidName').value.trim(); const amount=document.getElementById('newFluidAmount').value.trim(); if(!name) return alert('Введіть назву рідини');
    const fluids=DB.getFluids(); if(fluids.find(f=>f.name===name)) return alert('Така рідина вже є'); fluids.push({name,amount: amount?Number(amount):null}); DB.setFluids(fluids); document.getElementById('newFluidName').value=''; document.getElementById('newFluidAmount').value=''; refreshAll();
});

// --- Crafts UI ---
function refreshCraftsList(){
    const crafts = DB.getCrafts(); const div=document.getElementById('craftsList'); div.innerHTML='';
    crafts.forEach((c,idx)=>{
    const row=document.createElement('div'); row.className='row';
    row.dataset.index = idx;
    const left=document.createElement('div'); left.style.flex='1';
    left.innerHTML=`<strong>${escape(c.result.name)}</strong> <span class="muted">(${escape(c.machine)})</span><br><span class="small">Кількість: ${c.result.count}</span>`;
    row.appendChild(left);

    // view button toggles a detail panel under the row
    const view=document.createElement('button'); view.textContent='Перегляд';
    view.addEventListener('click',()=>{
        // toggle next element if it's detail
        const next = row.nextElementSibling;
        if(next && next.classList && next.classList.contains('craftDetail')){
        next.remove(); // collapse
        return;
        }
        // remove any other open detail panels to keep UI tidy (optional)
        Array.from(div.querySelectorAll('.craftDetail')).forEach(d=>d.remove());

        const detail=document.createElement('div'); detail.className='craftDetail';
        // build tree for this craft
        const craftsMap={}; DB.getCrafts().forEach(cf=>{craftsMap[cf.result.name]=cf});
        const lines = [];
        function dfs(n,c,depth){
        const cft = craftsMap[n];
        const indent = ' '.repeat(depth*2);
        if(!cft){
            lines.push(`${indent}${n} x${c}`);
            return;
        }
        lines.push(`${indent}${n} x${c} (${cft.machine})`);
        for(const ing of cft.ingredients){
            // compute scaled count (round up)
            const need = Math.ceil(ing.count * (c / cft.result.count));
            dfs(ing.name, need, depth+1);
        }
        }
        dfs(c.result.name, c.result.count, 0);
        const pre = document.createElement('pre');
        pre.className = 'code';
        pre.textContent = lines.join('\n');
        detail.appendChild(pre);

        // insert after current row
        row.parentNode.insertBefore(detail, row.nextSibling);
    });

    const del=document.createElement('button'); del.textContent='Видалити'; del.className='danger'; del.addEventListener('click',()=>{ if(confirm('Видалити крафт?')){ crafts.splice(idx,1); DB.setCrafts(crafts); refreshAll(); }});
    row.appendChild(view); row.appendChild(del);
    div.appendChild(row);
    });
    updateJsonPreview();
}

function prettyCraft(c){
    let s=`${c.result.name} x${c.result.count} (Механізм: ${c.machine})\nІнгредієнти:\n`;
    c.ingredients.forEach((ing,i)=>s+=` - ${ing.name} x${ing.count}\n`);
    return s;
}

// --- Add craft form ---
const ingredientsContainer = document.getElementById('ingredientsContainer');

function createIngredientRow(data){
    const wrapper=document.createElement('div'); wrapper.className='row';
    const nameInput=document.createElement('input'); nameInput.type='text'; nameInput.placeholder='Назва предмета або рідини'; nameInput.value=data?.name||''; nameInput.setAttribute('list','itemsDatalist'); nameInput.style.flex='1';
    const countInput=document.createElement('input'); countInput.type='number'; countInput.min='1'; countInput.value=(data && data.count)?data.count:1; countInput.style.width='90px';
    const delBtn=document.createElement('button'); delBtn.textContent='Видалити'; delBtn.className='danger';
    delBtn.addEventListener('click',()=>{ wrapper.remove(); updatePreview(); });

    // update preview as user types or changes count
    nameInput.addEventListener('input', updatePreview);
    countInput.addEventListener('input', updatePreview);

    wrapper.appendChild(nameInput); wrapper.appendChild(countInput); wrapper.appendChild(delBtn);
    return wrapper;
}

document.getElementById('addIngredientBtn').addEventListener('click',()=>{
    ingredientsContainer.appendChild(createIngredientRow()); updatePreview();
});

function updatePreview(){
    const machine=document.getElementById('machineSelect').value;
    const resultName=document.getElementById('resultName').value||'<не вказано>';
    const resultCount=Number(document.getElementById('resultCount').value)||1;
    const ingEls = Array.from(ingredientsContainer.querySelectorAll('.row'));
    const ingredients = ingEls.map(r=>{
    const nameEl = r.querySelector('input[type=text]');
    const numEl = r.querySelector('input[type=number]');
    return {name: nameEl ? nameEl.value.trim() : '', count: numEl ? Number(numEl.value)||1 : 1};
    }).filter(i=>i.name);

    // Format: each block on its own line; ingredients line is comma-separated
    const ingLine = ingredients.length ? ingredients.map(i=>`${i.name} x${i.count}`).join(', ') : '<пусто>';
    const text = `Механізм: ${machine}\nРезультат: ${resultName} x${resultCount}\nІнгредієнти: ${ingLine}`;
    document.getElementById('previewCraft').textContent = text || 'Поки немає крафту для перегляду';
}

document.getElementById('machineSelect').addEventListener('change', updatePreview);
document.getElementById('resultName').addEventListener('input', updatePreview);
document.getElementById('resultCount').addEventListener('input', updatePreview);

// toast
function showToast(msg, duration=2000){
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.style.display = 'block';
    clearTimeout(t._hideTO);
    t._hideTO = setTimeout(()=>{ t.style.display = 'none'; }, duration);
}

// save craft
document.getElementById('saveCraftBtn').addEventListener('click',()=>{
    const machine=document.getElementById('machineSelect').value;
    const resultName=document.getElementById('resultName').value.trim(); if(!resultName) return alert('Введіть назву підсумкового предмета');
    const resultCount=Number(document.getElementById('resultCount').value)||1;
    const ingEls = Array.from(ingredientsContainer.querySelectorAll('.row'));
    const ingredients = ingEls.map(r=>{
    const nameEl = r.querySelector('input[type=text]');
    const numEl = r.querySelector('input[type=number]');
    return {name: nameEl ? nameEl.value.trim() : '', count: numEl ? Number(numEl.value)||1 : 1};
    }).filter(i=>i.name);
    if(ingredients.length===0) return alert('Додайте хоча б один інгредієнт');

    // confirmation preview — same format as visible preview
    const ingLine = ingredients.map(i=>`${i.name} x${i.count}`).join(', ');
    const confirmText = `Механізм: ${machine}\nРезультат: ${resultName} x${resultCount}\nІнгредієнти: ${ingLine}\n\nЗберегти крафт?`;
    if(!confirm(confirmText)) return;

    // store
    const crafts = DB.getCrafts(); crafts.push({machine, result:{name:resultName, count:resultCount}, ingredients}); DB.setCrafts(crafts);

    // add result and ingredients to library if missing
    const items = DB.getItems();
    if(!items.find(it=>it.name===resultName)) { items.push({name:resultName}); DB.setItems(items); }
    ingredients.forEach(i=>{
    const isItem = DB.getItems().find(it=>it.name===i.name);
    const isFluid = DB.getFluids().find(f=>f.name===i.name);
    if(!isItem && !isFluid){
        // default: add as item
        const arr = DB.getItems(); arr.push({name:i.name}); DB.setItems(arr);
    }
    });

    // clear form
    document.getElementById('resultName').value=''; document.getElementById('resultCount').value=1; ingredientsContainer.innerHTML='';
    updatePreview(); refreshAll();

    // show toast
    showToast('Крафт збережено', 2200);
});

// --- Calculation ---
function resolveIngredients(name, count, craftsMap, depth=0){
    // returns map name->count of base resources (that have no craft definition)
    const result = {};
    const craft = craftsMap[name];
    if(!craft){ result[name] = (result[name]||0) + count; return result; }
    // craft exists: scale ingredients
    for(const ing of craft.ingredients){
    const need = ing.count * (count / craft.result.count);
    const sub = resolveIngredients(ing.name, need, craftsMap, depth+1);
    for(const k in sub) result[k] = (result[k]||0) + sub[k];
    }
    return result;
}

document.getElementById('calcBtn').addEventListener('click', ()=>{
    const name=document.getElementById('calcItem').value.trim(); if(!name) return alert('Введіть предмет');
    const count=Number(document.getElementById('calcCount').value)||1;
    const crafts = DB.getCrafts(); const craftsMap={}; crafts.forEach(c=>{craftsMap[c.result.name]=c});
    const flat = resolveIngredients(name, count, craftsMap);
    const area=document.getElementById('calcResult'); area.innerHTML='';
    if(Object.keys(flat).length===0) { area.textContent='Рецепт не знайдено'; return; }
    const table=document.createElement('table');
    const tbody=document.createElement('tbody');
    for(const k of Object.keys(flat).sort()){ const tr=document.createElement('tr'); tr.innerHTML=`<td>${escape(k)}</td><td>${Math.ceil(flat[k]*1000)/1000}</td>`; tbody.appendChild(tr) }
    table.appendChild(tbody); area.appendChild(table);
});

// flatten with tree view
document.getElementById('flattenBtn').addEventListener('click', ()=>{
    const name=document.getElementById('calcItem').value.trim(); if(!name) return alert('Введіть предмет');
    const count=Number(document.getElementById('calcCount').value)||1;
    const crafts = DB.getCrafts(); const craftsMap={}; crafts.forEach(c=>{craftsMap[c.result.name]=c});
    const area=document.getElementById('calcResult'); area.innerHTML='';
    const lines = [];
    function dfs(n,c,depth){ const cft = craftsMap[n]; const indent='\u00A0'.repeat(depth*4); if(!cft){ lines.push(`${indent}${n} x${c}`); return; } lines.push(`${indent}${n} x${c} (${cft.machine})`); for(const ing of cft.ingredients){ dfs(ing.name, Math.ceil(ing.count * (c / cft.result.count)), depth+1); } }
    dfs(name,count,0);
    area.innerHTML = '<pre class="code">' + lines.map(escape).join('\n') + '</pre>';
});

// --- import/export ---
function updateJsonPreview(){ const obj={items:DB.getItems(), fluids:DB.getFluids(), crafts:DB.getCrafts()}; jsonPreview.textContent = JSON.stringify(obj, null, 2); }

document.getElementById('exportBtn').addEventListener('click', ()=>{
    const obj={items:DB.getItems(), fluids:DB.getFluids(), crafts:DB.getCrafts()}; const blob=new Blob([JSON.stringify(obj, null, 2)],{type:'text/plain;charset=utf-8'});
    const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='mc_data.txt'; a.click(); URL.revokeObjectURL(url);
});

document.getElementById('importBtn').addEventListener('click', ()=>{ document.getElementById('fileInput').click(); });
document.getElementById('fileInput').addEventListener('change', (e)=>{
    const f = e.target.files[0]; if(!f) return; const reader=new FileReader(); reader.onload = ev => {
    try{
        const parsed = JSON.parse(ev.target.result);
        if(parsed.items) DB.setItems(parsed.items);
        if(parsed.fluids) DB.setFluids(parsed.fluids);
        if(parsed.crafts) DB.setCrafts(parsed.crafts);
        alert('Дані завантажено'); refreshAll();
    }catch(err){ alert('Помилка при розборі файлу: ' + err.message) }
    }; reader.readAsText(f);
});

document.getElementById('clearBtn').addEventListener('click', ()=>{ if(confirm('Очистити всі дані?')){ DB.clear(); refreshAll(); }});

// --- utilities ---
function escape(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function refreshAll(){ renderItems(); renderFluids(); refreshCraftsList(); updateJsonPreview(); }

// load initial demo if empty
if(DB.getItems().length===0 && DB.getCrafts().length===0 && DB.getFluids().length===0){
    DB.setItems([{name:'Палка'},{name:'Діамант'},{name:'Залізний злиток'}]);
    DB.setCrafts([{machine:'Верстак', result:{name:'Діамантовий меч',count:1}, ingredients:[{name:'Палка',count:1},{name:'Діамант',count:2}]}]);
    DB.setFluids([{name:'Кров', amount:null}]);
}

init();
