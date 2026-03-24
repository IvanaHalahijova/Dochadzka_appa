const SK_MONTHS = ['Január','Február','Marec','Apríl','Máj','Jún','Júl','August','September','Október','November','December'];
const SK_DAYS   = ['Ne','Po','Ut','St','Št','Pi','So'];
const TYPE_LABELS = {
  kancelaria:'Kancelária', home:'Home office', teren:'Terén',
  mentoring:'Mentoring', dovolenka:'Dovolenka', pn:'PN', sickday:'SickDay', ocr:'OČR'
};

let records   = JSON.parse(localStorage.getItem('appa_records'))   || [];
let employees = JSON.parse(localStorage.getItem('appa_employees')) || ['Ivana Halahijová'];
let currentEmployee = localStorage.getItem('appa_current_emp') || employees[0];
let viewYear, viewMonth;
let editingId = null;

(function init() {
  const today = new Date();
  viewYear  = today.getFullYear();
  viewMonth = today.getMonth();
  setDefaultDate();
  buildEmpSelect();
  render();
})();

function setDefaultDate() {
  const today = new Date();
  document.getElementById('fDate').value = toDateStr(today);
}
function toDateStr(d) {
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}

function buildEmpSelect() {
  const sel = document.getElementById('empSelect');
  sel.innerHTML = '';
  employees.forEach(e => {
    const o = document.createElement('option');
    o.value = e; o.textContent = e;
    if (e === currentEmployee) o.selected = true;
    sel.appendChild(o);
  });
}
function onEmployeeChange() {
  currentEmployee = document.getElementById('empSelect').value;
  localStorage.setItem('appa_current_emp', currentEmployee);
  render();
}
function openEmpModal() { renderEmpList(); document.getElementById('empModal').classList.remove('hidden'); }
function closeEmpModal() { document.getElementById('empModal').classList.add('hidden'); }
function renderEmpList() {
  const list = document.getElementById('empList');
  list.innerHTML = '';
  employees.forEach((e, i) => {
    const div = document.createElement('div');
    div.className = 'emp-item';
    div.innerHTML = '<span>' + e + '</span>';
    if (employees.length > 1) {
      const btn = document.createElement('button');
      btn.textContent = 'Odstrániť';
      btn.className = 'btn btn-danger btn-sm';
      btn.onclick = () => removeEmployee(i);
      div.appendChild(btn);
    }
    list.appendChild(div);
  });
}
function addEmployee() {
  const val = document.getElementById('empInput').value.trim();
  if (!val) return;
  if (employees.includes(val)) { alert('Tento zamestnanec už existuje.'); return; }
  employees.push(val);
  saveEmployees(); buildEmpSelect(); renderEmpList();
  document.getElementById('empInput').value = '';
}
function removeEmployee(i) {
  const removed = employees[i];
  if (!confirm('Odstrániť "' + removed + '"? Záznamy zostanú.')) return;
  employees.splice(i, 1);
  saveEmployees();
  if (currentEmployee === removed) { currentEmployee = employees[0]; localStorage.setItem('appa_current_emp', currentEmployee); }
  buildEmpSelect(); renderEmpList(); render();
}
function saveEmployees() { localStorage.setItem('appa_employees', JSON.stringify(employees)); }

function changeMonth(delta) {
  viewMonth += delta;
  if (viewMonth < 0)  { viewMonth = 11; viewYear--; }
  if (viewMonth > 11) { viewMonth = 0;  viewYear++; }
  render();
}
function goToday() { const t = new Date(); viewYear = t.getFullYear(); viewMonth = t.getMonth(); render(); }

function calcHours() {
  const f = document.getElementById('fFrom').value;
  const t = document.getElementById('fTo').value;
  const el = document.getElementById('hoursPreview');
  if (f && t && t > f) {
    const [fh,fm] = f.split(':').map(Number);
    const [th,tm] = t.split(':').map(Number);
    el.textContent = (((th*60+tm)-(fh*60+fm))/60).toFixed(2) + ' h';
  } else { el.textContent = '0.00 h'; }
}
function getHours(from, to) {
  if (!from||!to||to<=from) return 0;
  const [fh,fm]=from.split(':').map(Number), [th,tm]=to.split(':').map(Number);
  return ((th*60+tm)-(fh*60+fm))/60;
}
function togglePlaceField() {
  const abs = ['dovolenka','pn','sickday','ocr'].includes(document.getElementById('fType').value);
  document.getElementById('placeGroup').style.visibility = abs ? 'hidden' : 'visible';
}

function saveRecord() {
  const date=document.getElementById('fDate').value, from=document.getElementById('fFrom').value,
        to=document.getElementById('fTo').value, type=document.getElementById('fType').value,
        place=document.getElementById('fPlace').value.trim(), note=document.getElementById('fNote').value.trim();
  if (!date) { alert('Zadaj dátum.'); return; }
  const absType = ['dovolenka','pn','sickday','ocr'].includes(type);
  if (!absType && (!from||!to)) { alert('Zadaj čas Od a Do.'); return; }
  if (!absType && to<=from) { alert('"Do" musí byť po "Od".'); return; }
  const hours = absType ? 8 : parseFloat(getHours(from,to).toFixed(2));
  if (editingId !== null) {
    const idx = records.findIndex(r=>r.id===editingId);
    if (idx>-1) records[idx]={id:editingId,employee:currentEmployee,date,from,to,hours,type,place,note};
    editingId=null;
    document.getElementById('formTitle').textContent='Nový záznam';
    document.getElementById('btnSave').textContent='Pridať záznam';
    document.getElementById('btnCancel').classList.add('hidden');
  } else {
    records.push({id:Date.now(),employee:currentEmployee,date,from,to,hours,type,place,note});
  }
  localStorage.setItem('appa_records',JSON.stringify(records));
  clearForm(); render();
}
function editRecord(id) {
  const r=records.find(r=>r.id===id); if(!r) return;
  editingId=id;
  document.getElementById('fDate').value=r.date; document.getElementById('fFrom').value=r.from;
  document.getElementById('fTo').value=r.to; document.getElementById('fType').value=r.type;
  document.getElementById('fPlace').value=r.place; document.getElementById('fNote').value=r.note;
  calcHours(); togglePlaceField();
  document.getElementById('formTitle').textContent='Úprava záznamu';
  document.getElementById('btnSave').textContent='Uložiť zmeny';
  document.getElementById('btnCancel').classList.remove('hidden');
  document.getElementById('formCard').scrollIntoView({behavior:'smooth'});
}
function cancelEdit() {
  editingId=null; clearForm();
  document.getElementById('formTitle').textContent='Nový záznam';
  document.getElementById('btnSave').textContent='Pridať záznam';
  document.getElementById('btnCancel').classList.add('hidden');
}
function removeRecord(id) {
  if(!confirm('Vymazať záznam?')) return;
  records=records.filter(r=>r.id!==id);
  localStorage.setItem('appa_records',JSON.stringify(records)); render();
}
function clearForm() {
  setDefaultDate();
  ['fFrom','fTo','fPlace','fNote'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('fType').value='kancelaria';
  togglePlaceField(); calcHours();
}

function render() {
  const label = SK_MONTHS[viewMonth] + ' ' + viewYear;
  document.getElementById('monthLabel').textContent = label;
  document.getElementById('tableMonthLabel').textContent = label;
  const month = getMonthRecords();
  renderStats(month); renderTable(month);
}
function getMonthRecords() {
  return records
    .filter(r=>r.employee===currentEmployee && r.date.startsWith(viewYear+'-'+String(viewMonth+1).padStart(2,'0')))
    .sort((a,b)=>a.date.localeCompare(b.date));
}

function renderStats(month) {
  const types=['kancelaria','home','teren','mentoring','dovolenka','pn','sickday','ocr'];
  const tots={}; let total=0;
  types.forEach(t=>tots[t]=0);
  month.forEach(r=>{tots[r.type]=(tots[r.type]||0)+r.hours; total+=r.hours;});
  const colors={kancelaria:'#111',home:'#3a6baa',teren:'#c07020',mentoring:'#208090',dovolenka:'#8040a0',pn:'#c0392b',sickday:'#e55533',ocr:'#7b5ea7'};
  let html='<div class="stat-card"><div class="stat-title">Spolu hodín</div><div class="stat-value">'+total.toFixed(1)+'</div><div class="stat-sub">'+month.length+' záznamov</div></div>';
  types.forEach(t=>{
    if(tots[t]>0) html+='<div class="stat-card colored" style="--c:'+colors[t]+';border-top-color:'+colors[t]+'"><div class="stat-title">'+TYPE_LABELS[t]+'</div><div class="stat-value">'+tots[t].toFixed(1)+'</div><div class="stat-sub">hodín</div></div>';
  });
  document.getElementById('statsGrid').innerHTML=html;
}

function renderTable(month) {
  const body=document.getElementById('recordsBody'), empty=document.getElementById('emptyMsg');
  body.innerHTML='';
  if(!month.length){empty.classList.remove('hidden');return;}
  empty.classList.add('hidden');
  month.forEach(r=>{
    const d=new Date(r.date+'T00:00:00'), dn=SK_DAYS[d.getDay()], iw=d.getDay()===0||d.getDay()===6;
    const ws=iw?'color:#c0392b;font-weight:600;':'';
    const ts=(r.from&&r.to)?r.from+' – '+r.to:'–';
    const row=document.createElement('tr');
    if(editingId===r.id) row.classList.add('editing');
    row.innerHTML=
      '<td style="white-space:nowrap;'+ws+'">'+r.date+'</td>'+
      '<td style="'+ws+'">'+dn+'</td>'+
      '<td style="white-space:nowrap;font-variant-numeric:tabular-nums;">'+ts+'</td>'+
      '<td style="font-weight:700;">'+r.hours.toFixed(2)+'</td>'+
      '<td><span class="badge b-'+r.type+'">'+(TYPE_LABELS[r.type]||r.type)+'</span></td>'+
      '<td style="color:var(--muted);">'+(r.place||'–')+'</td>'+
      '<td style="max-width:200px;font-size:0.83rem;color:var(--muted);">'+(r.note||'')+'</td>'+
      '<td style="white-space:nowrap;">'+
        '<button class="btn btn-warning btn-sm" onclick="editRecord('+r.id+')">Upraviť</button> '+
        '<button class="btn btn-danger btn-sm" onclick="removeRecord('+r.id+')">✕</button>'+
      '</td>';
    body.appendChild(row);
  });
}

function exportCSV() {
  const month=getMonthRecords();
  if(!month.length){alert('Žiadne záznamy.');return;}
  const hdr=['Zamestnanec','Dátum','Deň','Od','Do','Hodiny','Typ','Miesto','Popis'];
  const rows=month.map(r=>{
    const d=new Date(r.date+'T00:00:00');
    return [r.employee,r.date,SK_DAYS[d.getDay()],r.from||'',r.to||'',r.hours.toFixed(2),TYPE_LABELS[r.type]||r.type,r.place||'',r.note||'']
      .map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(';');
  });
  const csv='\uFEFF'+hdr.join(';')+'\n'+rows.join('\n');
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'}));
  a.download='dochadzka_'+currentEmployee.replace(/ /g,'_')+'_'+viewYear+'-'+String(viewMonth+1).padStart(2,'0')+'.csv';
  a.click();
}

function printReport() {
  const month=getMonthRecords();
  if(!month.length){alert('Žiadne záznamy pre tlač.');return;}
  document.getElementById('pPeriod').textContent='Obdobie: '+SK_MONTHS[viewMonth]+' '+viewYear;
  document.getElementById('pEmployee').textContent='Zamestnanec: '+currentEmployee;
  document.getElementById('pPrintDate').textContent=new Date().toLocaleDateString('sk-SK');
  const types=['kancelaria','home','teren','mentoring','dovolenka','pn','sickday','ocr'];
  const tots={}; let total=0;
  types.forEach(t=>tots[t]=0);
  month.forEach(r=>{tots[r.type]=(tots[r.type]||0)+r.hours;total+=r.hours;});
  let sh='<thead><tr><th>Typ</th><th>Hodiny</th><th>Dni (approx.)</th></tr></thead><tbody>';
  types.forEach(t=>{if(tots[t]>0) sh+='<tr><td>'+TYPE_LABELS[t]+'</td><td>'+tots[t].toFixed(2)+'</td><td>'+(tots[t]/8).toFixed(1)+'</td></tr>';});
  sh+='<tr style="font-weight:700;"><td>SPOLU</td><td>'+total.toFixed(2)+'</td><td>'+(total/8).toFixed(1)+'</td></tr></tbody>';
  document.getElementById('pSummaryTable').innerHTML=sh;
  let dh='';
  month.forEach(r=>{
    const d=new Date(r.date+'T00:00:00');
    dh+='<tr><td>'+r.date+'</td><td>'+SK_DAYS[d.getDay()]+'</td><td>'+(r.from||'–')+'</td><td>'+(r.to||'–')+'</td><td>'+r.hours.toFixed(2)+'</td><td>'+(TYPE_LABELS[r.type]||r.type)+'</td><td>'+(r.place||'–')+'</td><td>'+(r.note||'')+'</td></tr>';
  });
  document.getElementById('pDetailBody').innerHTML=dh;
  window.print();
}
