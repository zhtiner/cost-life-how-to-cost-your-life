// app.js
// 数据结构与常量
const CATEGORIES = [
  { key: '餐饮', color: '#67c5b5' },
  { key: '购物', color: '#f59e0b' },
  { key: '娱乐', color: '#8b5cf6' },
  { key: '美妆', color: '#ef476f' },
  { key: '交通', color: '#06b6d4' },
  { key: '其他', color: '#94a3b8' },
];

const MOODS = [
  { key: '开心', icon: 'ri-emotion-laugh-line' },
  { key: '治愈', icon: 'ri-hearts-line' },
  { key: '解压', icon: 'ri-slideshow-3-line' },
  { key: '审慎', icon: 'ri-emotion-normal-line' },
];

const STORAGE_KEYS = {
  RECORDS: 'gh-ledger-records',
  BUDGETS: 'gh-ledger-budgets',
  FIRST_BOOT: 'gh-ledger-first-boot'
};

// 初始示例数据（3条以上，含图片URL）
const SAMPLE_RECORDS = [
  {
    id: cryptoRandomId(),
    amount: 128.8,
    category: '餐饮',
    mood: '开心',
    note: '周末和好友聚餐，烤肉超治愈！',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=640&auto=format&fit=crop',
    ts: daysAgoTs(1, 19, 35)
  },
  {
    id: cryptoRandomId(),
    amount: 299.0,
    category: '购物',
    mood: '审慎',
    note: '补充生活用品，控制预算。',
    image: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?q=80&w=640&auto=format&fit=crop',
    ts: daysAgoTs(5, 14, 5)
  },
  {
    id: cryptoRandomId(),
    amount: 52.6,
    category: '交通',
    mood: '解压',
    note: '打车回家，省时更舒适。',
    image: 'https://images.unsplash.com/photo-1532978379173-523e16f37149?q=80&w=640&auto=format&fit=crop',
    ts: daysAgoTs(0, 8, 20)
  },
  {
    id: cryptoRandomId(),
    amount: 86.2,
    category: '娱乐',
    mood: '开心',
    note: '电影之夜，剧情很棒！',
    image: 'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?q=80&w=640&auto=format&fit=crop',
    ts: daysAgoTs(2, 21, 10)
  }
];

const SAMPLE_BUDGETS = {
  餐饮: 1200,
  购物: 1500,
  娱乐: 600,
  美妆: 800,
  交通: 500,
  其他: 400
};

// 状态
let state = {
  records: [],
  budgets: {},
  activeView: 'home',
  filterCategory: 'all',
  feedMode: 'feed', // feed or album
  trendRange: 7,
  pieRange: 30,
  charts: {
    mini: null,
    pie: null,
    line: null
  }
};

// 工具函数
function cryptoRandomId() {
  if (window.crypto?.randomUUID) return crypto.randomUUID();
  return 'id-' + Math.random().toString(36).slice(2) + Date.now();
}
function daysAgoTs(d=0, h=12, m=0){
  const dt = new Date();
  dt.setDate(dt.getDate()-d);
  dt.setHours(h, m, 0, 0);
  return dt.getTime();
}
function fmtCurrency(n){
  return '¥' + (Number(n)||0).toFixed(2);
}
function fmtDate(ts){
  const d = new Date(ts);
  const m = d.getMonth()+1;
  const day = d.getDate();
  const hh = String(d.getHours()).padStart(2,'0');
  const mm = String(d.getMinutes()).padStart(2,'0');
  return `${m}/${day} ${hh}:${mm}`;
}
function groupBy(arr, keyFn){
  return arr.reduce((acc, item)=>{
    const k = keyFn(item);
    acc[k] = acc[k] || [];
    acc[k].push(item);
    return acc;
  }, {});
}
function getMonthKey(ts){
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
}

// 本地存储
function loadData(){
  const firstBoot = localStorage.getItem(STORAGE_KEYS.FIRST_BOOT);
  if(!firstBoot){
    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(SAMPLE_RECORDS));
    localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(SAMPLE_BUDGETS));
    localStorage.setItem(STORAGE_KEYS.FIRST_BOOT, '1');
  }
  try{
    state.records = JSON.parse(localStorage.getItem(STORAGE_KEYS.RECORDS)) || [];
  }catch{ state.records = []; }
  try{
    state.budgets = JSON.parse(localStorage.getItem(STORAGE_KEYS.BUDGETS)) || {};
  }catch{ state.budgets = {}; }
}
function saveRecords(){
  localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(state.records));
}
function saveBudgets(){
  localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(state.budgets));
}

// 初始化 UI
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  mountNav();
  mountSelectors();
  mountForm();
  mountSettings();
  renderAll();

  // 入场动画延迟显示预警（若有）
  setTimeout(updateTrendAlert, 400);
});

// 导航
function mountNav(){
  const buttons = document.querySelectorAll('.tab-btn');
  buttons.forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const target = btn.getAttribute('data-nav');
      switchView(target);
      buttons.forEach(b=>b.classList.toggle('active', b===btn));
    });
  });
  document.querySelectorAll('[data-nav="settings"]').forEach(el=>{
    el.addEventListener('click', ()=> {
      document.querySelector('.tab-btn[data-nav="settings"]').click();
    });
  });
}
function switchView(view){
  state.activeView = view;
  document.querySelectorAll('.view').forEach(v=>{
    v.classList.toggle('active', v.id === `view-${view}`);
  });
  if(view==='stats'){
    renderStats();
  }else if(view==='home'){
    renderHome();
  }
}

// 选择器与工具条
function mountSelectors(){
  const filterSel = document.getElementById('filterCategory');
  CATEGORIES.forEach(c=>{
    const opt = document.createElement('option');
    opt.value = c.key; opt.textContent = c.key;
    filterSel.appendChild(opt);
  });
  filterSel.addEventListener('change', ()=>{
    state.filterCategory = filterSel.value;
    renderHomeFeed();
  });

  const feedMode = document.getElementById('feedMode');
  feedMode.addEventListener('change', ()=>{
    state.feedMode = feedMode.value;
    renderHomeFeed();
  });

  // 统计
  document.getElementById('rangeSelect').addEventListener('change', (e)=>{
    state.pieRange = Number(e.target.value);
    renderPie();
  });
  document.querySelectorAll('#trendTabs button').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      document.querySelectorAll('#trendTabs button').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      state.trendRange = Number(btn.dataset.range);
      renderTrend();
    });
  });
}

// 表单
function mountForm(){
  // 分类 chips
  const catChips = document.getElementById('categoryChips');
  CATEGORIES.forEach(c=>{
    const b = document.createElement('button');
    b.type='button';
    b.className='chip-btn';
    b.textContent=c.key;
    b.addEventListener('click', ()=>{
      document.querySelectorAll('#categoryChips .chip-btn').forEach(x=>x.classList.remove('active'));
      b.classList.add('active');
      document.getElementById('categorySelect').value = c.key;
    });
    catChips.appendChild(b);
  });
  // 心情 chips
  const moodChips = document.getElementById('moodChips');
  MOODS.forEach(m=>{
    const b = document.createElement('button');
    b.type='button'; b.className='chip-btn';
    b.innerHTML = `<i class="${m.icon}"></i> ${m.key}`;
    b.addEventListener('click', ()=>{
      document.querySelectorAll('#moodChips .chip-btn').forEach(x=>x.classList.remove('active'));
      b.classList.add('active');
      document.getElementById('moodSelect').value = m.key;
    });
    moodChips.appendChild(b);
  });
  // 备用 select 值
  const catSel = document.getElementById('categorySelect');
  CATEGORIES.forEach(c=>{
    const opt=document.createElement('option');opt.value=c.key;opt.textContent=c.key;catSel.appendChild(opt);
  });
  catSel.value=CATEGORIES[0].key;
  document.querySelector('#categoryChips .chip-btn')?.classList.add('active');

  const moodSel = document.getElementById('moodSelect');
  MOODS.forEach(m=>{
    const opt=document.createElement('option');opt.value=m.key;opt.textContent=m.key;moodSel.appendChild(opt);
  });
  moodSel.value=MOODS[0].key;
  document.querySelector('#moodChips .chip-btn')?.classList.add('active');

  // 图片预览
  const imgInput = document.getElementById('imageInput');
  const previewWrap = document.getElementById('imagePreview');
  const previewImg = document.getElementById('previewImg');
  const removeBtn = document.getElementById('removePreview');
  imgInput.addEventListener('change', ()=>{
    const file = imgInput.files?.[0];
    if(!file){ previewWrap.classList.add('hidden'); return; }
    const reader = new FileReader();
    reader.onload = e=>{
      previewImg.src = e.target?.result;
      previewWrap.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
  });
  removeBtn.addEventListener('click', ()=>{
    imgInput.value = '';
    previewWrap.classList.add('hidden');
    previewImg.src='';
  });

  // 提交
  document.getElementById('recordForm').addEventListener('submit', (e)=>{
    e.preventDefault();
    const amount = Number(document.getElementById('amountInput').value);
    const category = document.getElementById('categorySelect').value;
    const mood = document.getElementById('moodSelect').value;
    const note = document.getElementById('noteInput').value.trim();
    if(!amount || amount<=0){ alert('请输入有效金额'); return; }

    const imgFile = imgInput.files?.[0];
    if(imgFile){
      const reader = new FileReader();
      reader.onload = () => {
        addRecord(amount, category, mood, note, reader.result);
      };
      reader.readAsDataURL(imgFile);
    }else{
      addRecord(amount, category, mood, note, '');
    }
  });
}
function addRecord(amount, category, mood, note, image){
  const rec = {
    id: cryptoRandomId(),
    amount,
    category,
    mood,
    note,
    image,
    ts: Date.now()
  };
  state.records.push(rec);
  saveRecords();
  // 重置表单
  document.getElementById('recordForm').reset();
  document.getElementById('imagePreview').classList.add('hidden');
  document.getElementById('previewImg').src='';
  // 回到首页刷新
  switchView('home');
  document.querySelector('.tab-btn[data-nav="home"]').classList.add('active');
  document.querySelectorAll('.tab-btn').forEach(b=>{
    if(b.dataset.nav!=='home') b.classList.remove('active');
  });
  renderAll();
  // 轻提示
  toast('已保存一条记录');
}

// 设置
function mountSettings(){
  const form = document.getElementById('budgetForm');
  form.innerHTML = '';
  CATEGORIES.forEach(c=>{
    const row = document.createElement('div');
    row.className='budget-row';
    row.innerHTML = `
      <div class="label">${c.key}</div>
      <input type="number" min="0" step="0.01" inputmode="decimal" name="${c.key}" placeholder="¥0.00" value="${state.budgets[c.key]??''}">
    `;
    form.appendChild(row);
  });
  document.getElementById('saveBudget').addEventListener('click', ()=>{
    const inputs = form.querySelectorAll('input');
    inputs.forEach(inp=>{
      const k = inp.name;
      const v = Number(inp.value||0);
      state.budgets[k] = v;
    });
    saveBudgets();
    renderHomeBudgets();
    toast('预算已保存');
  });

  // 恢复示例数据
  document.getElementById('resetData').addEventListener('click', ()=>{
    if(confirm('将清空并恢复为示例数据，是否继续？')){
      localStorage.removeItem(STORAGE_KEYS.RECORDS);
      localStorage.removeItem(STORAGE_KEYS.BUDGETS);
      localStorage.removeItem(STORAGE_KEYS.FIRST_BOOT);
      loadData();
      mountSettings();
      renderAll();
      toast('已恢复示例数据');
    }
  });
}

// 渲染
function renderAll(){
  renderHome();
  if(state.activeView==='stats') renderStats();
}

function renderHome(){
  renderSummary();
  renderHomeBudgets();
  renderHomeFeed();
}

function renderSummary(){
  const month = getMonthKey(Date.now());
  const monthRecords = state.records.filter(r=>getMonthKey(r.ts)===month);
  const total = monthRecords.reduce((s,r)=>s+r.amount,0);
  document.getElementById('summaryTotal').textContent = fmtCurrency(total);

  const byCat = groupBy(monthRecords, r=>r.category);
  let maxCat='-'; let maxVal=0;
  Object.entries(byCat).forEach(([cat, list])=>{
    const sum = list.reduce((s,r)=>s+r.amount,0);
    if(sum>maxVal){ maxVal=sum; maxCat=cat; }
  });
  document.getElementById('summaryMax').textContent = maxCat==='-'?'-':`${maxCat} ${fmtCurrency(maxVal)}`;

  const moodSummary = buildMoodSummary(monthRecords);
  document.getElementById('summaryMood').textContent = moodSummary || '-';

  // 迷你趋势图（近7天）
  const daily = summarizeDaily(7);
  const labels = daily.map(x=>x.label);
  const data = daily.map(x=>x.value);
  if(state.charts.mini){ state.charts.mini.destroy(); }
  const ctx = document.getElementById('summaryMiniChart');
  state.charts.mini = new Chart(ctx, {
    type:'bar',
    data:{ labels, datasets:[{ data, borderRadius:8, backgroundColor:'#cfe7ff' }]},
    options:{
      plugins:{ legend:{display:false}, tooltip:{enabled:false}},
      responsive:true,
      scales: { x:{display:false}, y:{display:false} }
    }
  });
}

function renderHomeBudgets(){
  const month = getMonthKey(Date.now());
  const monthRecords = state.records.filter(r=>getMonthKey(r.ts)===month);
  const byCat = groupBy(monthRecords, r=>r.category);
  const container = document.getElementById('budgetProgressList');
  container.innerHTML='';
  CATEGORIES.forEach(c=>{
    const budget = Number(state.budgets[c.key]||0);
    const spent = (byCat[c.key]||[]).reduce((s,r)=>s+r.amount,0);
    const pct = budget>0 ? Math.min(100, Math.round(spent*100/budget)) : 0;
    const over = budget>0 && spent>budget;
    const row = document.createElement('div');
    row.className='progress-row';
    row.innerHTML = `
      <div class="label">${c.key}</div>
      <div class="progress ${over?'over':''}">
        <span style="width:${budget>0?Math.min(100, spent*100/budget):0}%"></span>
      </div>
      <div class="progress-legend">${fmtCurrency(spent)} / ${budget>0?fmtCurrency(budget):'未设'}</div>
    `;
    container.appendChild(row);
  });
}

function renderHomeFeed(){
  const listWrap = document.getElementById('feedContainer');
  const albumWrap = document.getElementById('albumContainer');
  const mode = state.feedMode;
  listWrap.classList.toggle('hidden', mode!=='feed');
  albumWrap.classList.toggle('hidden', mode!=='album');

  let list = [...state.records];
  // 筛选
  if(state.filterCategory!=='all'){
    list = list.filter(r=>r.category===state.filterCategory);
  }
  // 时间倒序
  list.sort((a,b)=>b.ts - a.ts);

  if(mode==='feed'){
    albumWrap.innerHTML='';
    listWrap.innerHTML='';
    list.forEach(r=>{
      const card = document.createElement('div');
      card.className='feed-card';
      card.style.animationDelay = (Math.random()*0.12)+'s';
      card.innerHTML = `
        <img class="feed-thumb" src="${r.image || 'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?q=80&w=400&auto=format&fit=crop'}" alt="">
        <div class="feed-main">
          <div class="feed-title">
            <div>${r.category}</div>
            <div class="amount negative">${fmtCurrency(r.amount)}</div>
          </div>
          <div class="feed-sub">
            <span class="chip blue">${fmtDate(r.ts)}</span>
            <span class="chip mint"><i class="${(MOODS.find(m=>m.key===r.mood)||MOODS[0]).icon}"></i> ${r.mood||'-'}</span>
            ${r.note?`<span class="chip pink">${escapeHtml(r.note).slice(0,18)}${r.note.length>18?'…':''}</span>`:''}
          </div>
        </div>
      `;
      listWrap.appendChild(card);
    });
  }else{
    listWrap.innerHTML='';
    albumWrap.innerHTML='';
    list.filter(r=>r.image).forEach(r=>{
      const item = document.createElement('div');
      item.className='album-item';
      item.innerHTML = `
        <img src="${r.image}" alt="">
        <div class="badge">${r.category}</div>
      `;
      item.addEventListener('click', ()=> showRecordDetail(r));
      albumWrap.appendChild(item);
    });
  }
}

function showRecordDetail(r){
  const detail = `
    分类：${r.category}
    金额：${fmtCurrency(r.amount)}
    时间：${fmtDate(r.ts)}
    心情：${r.mood||'-'}
    备注：${r.note||'-'}
  `;
  alert(detail);
}

// 统计
function renderStats(){
  renderPie();
  renderTrend();
  renderMoodStats();
}

function renderPie(){
  const range = state.pieRange;
  const since = Date.now() - range*24*3600*1000;
  const list = state.records.filter(r=>r.ts>=since).sort((a,b)=>a.ts-b.ts);
  const sums = CATEGORIES.map(c=>({
    key:c.key,
    sum: list.filter(r=>r.category===c.key).reduce((s,x)=>s+x.amount,0)
  }));
  const labels = sums.map(x=>x.key);
  const data = sums.map(x=>Number(x.sum.toFixed(2)));
  const colors = CATEGORIES.map(c=>c.color+'cc');

  if(state.charts.pie) state.charts.pie.destroy();
  const ctx = document.getElementById('pieChart');
  state.charts.pie = new Chart(ctx, {
    type:'pie',
    data:{ labels, datasets:[{ data, backgroundColor:colors, borderWidth:0 }]},
    options:{
      plugins:{
        legend:{position:'bottom', labels:{usePointStyle:true, pointStyle:'rounded'}},
        tooltip:{callbacks:{ label: (ctx)=>{
          const total = data.reduce((s,n)=>s+n,0) || 1;
          const val = ctx.raw||0;
          const pct = Math.round(val*100/total);
          return `${ctx.label}: ${fmtCurrency(val)} (${pct}%)`;
        }}}
      }
    }
  });
}

function renderTrend(){
  const range = state.trendRange;
  const daily = summarizeDaily(range);
  const labels = daily.map(x=>x.label);
  const data = daily.map(x=>x.value);

  if(state.charts.line) state.charts.line.destroy();
  const ctx = document.getElementById('lineChart');
  state.charts.line = new Chart(ctx, {
    type:'line',
    data:{
      labels,
      datasets:[{
        label:'每日支出',
        data,
        fill:true,
        borderColor:'#67c5b5',
        backgroundColor:'rgba(103,197,181,0.18)',
        pointRadius:3,
        tension:0.35
      }]
    },
    options:{
      plugins:{
        legend:{display:false},
        annotation: buildTrendAnnotations(range)
      },
      scales:{
        y:{ticks:{callback:(v)=>'¥'+v}}
      }
    },
    plugins:[chartAnnotationPlugin()]
  });

  // 趋势提示
  const {warn, avgDaily, recent3} = computeTrendWarning();
  const hint = document.getElementById('trendHint');
  if(warn){
    hint.innerHTML = `最近3天共 ${fmtCurrency(recent3)}，已高于近30天日均 ${fmtCurrency(avgDaily)} 的 30%。建议减少非刚需开销，关注餐饮/购物等高频支出。`;
  }else{
    hint.textContent = '趋势平稳，继续保持良好消费习惯。';
  }
}

function renderMoodStats(){
  const range = 30;
  const since = Date.now() - range*24*3600*1000;
  const list = state.records.filter(r=>r.ts>=since);
  const total = list.length || 1;
  const happy = list.filter(r=> (r.mood||'')==='开心').length;
  const happyPct = Math.round(happy*100/total);
  document.getElementById('moodHappyPct').textContent = happyPct+'%';

  const words = extractEmotionKeywords(list.map(r=>r.note||'').join(' ')).slice(0,5);
  document.getElementById('moodKeywords').textContent = words.length? words.join('、') : '-';
}

// 趋势与预警
function summarizeDaily(days){
  const out = [];
  for(let i=days-1;i>=0;i--){
    const dayStart = new Date();
    dayStart.setHours(0,0,0,0);
    const start = dayStart.getTime() - i*24*3600*1000;
    const end = start + 24*3600*1000;
    const sum = state.records
      .filter(r=>r.ts>=start && r.ts<end)
      .reduce((s,r)=>s+r.amount,0);
    const d = new Date(start);
    out.push({
      label: `${d.getMonth()+1}/${d.getDate()}`,
      value: Number(sum.toFixed(2)),
      start, end
    });
  }
  return out;
}
function computeTrendWarning(){
  const last30 = summarizeDaily(30);
  const avgDaily = (last30.reduce((s,x)=>s+x.value,0) / 30) || 0;
  const recent3 = last30.slice(-3).reduce((s,x)=>s+x.value,0);
  const warn = recent3 > avgDaily*3*1.3 && recent3 > 0; // 高于30%
  return { warn, avgDaily, recent3 };
}
function updateTrendAlert(){
  const {warn} = computeTrendWarning();
  const banner = document.getElementById('alertBanner');
  const close = document.getElementById('closeAlert');
  if(warn){
    banner.classList.remove('hidden');
  }else{
    banner.classList.add('hidden');
  }
  close.onclick = ()=> banner.classList.add('hidden');
}
function buildTrendAnnotations(range){
  const ann = {};
  const {warn} = computeTrendWarning();
  if(!warn) return ann;
  // 高亮最后3天区域
  return {
    annotations: {
      recentBox: {
        type: 'box',
        xMin: range-3-0.5,
        xMax: range-1+0.5,
        yMin: 0,
        yMax: 999999,
        backgroundColor: 'rgba(255,107,107,0.08)',
        borderWidth: 0
      }
    }
  };
}

// Chart.js annotation 轻量插件（仅支持box）
function chartAnnotationPlugin(){
  return {
    id:'simple-annotation',
    afterDatasetsDraw(chart, args, pluginOptions){
      const ann = chart?.options?.plugins?.annotation?.annotations;
      if(!ann) return;
      const box = ann.recentBox;
      if(!box) return;
      const {ctx, chartArea, scales} = chart;
      const xScale = scales.x;
      const yScale = scales.y;
      const xMin = xScale.getPixelForValue(box.xMin);
      const xMax = xScale.getPixelForValue(box.xMax);
      const yMin = chartArea.top;
      const yMax = chartArea.bottom;
      ctx.save();
      ctx.fillStyle = box.backgroundColor || 'rgba(255,0,0,0.08)';
      ctx.fillRect(xMin, yMin, xMax-xMin, yMax-yMin);
      ctx.restore();
    }
  };
}

// 心情与关键词规则
function buildMoodSummary(records){
  if(!records.length) return '';
  const text = records.map(r=>r.note||'').join(' ');
  const words = extractEmotionKeywords(text);
  const counts = {};
  words.forEach(w=>counts[w]=(counts[w]||0)+1);
  const common = Object.entries(counts).sort((a,b)=>b[1]-a[1]).map(x=>x[0]).slice(0,2);
  const happyPct = Math.round(records.filter(r=>r.mood==='开心').length*100/records.length);
  if(common.length){
    return `本月${happyPct}%消费偏开心，常见情绪：${common.join('、')}`;
  }
  return `本月${happyPct}%消费偏开心`;
}
function extractEmotionKeywords(text){
  const dict = [
    '开心','快乐','治愈','放松','解压','满足','幸福','期待','惊喜',
    '节省','理性','审慎','克制','控制','冲动','后悔','划算','超值',
    '累','安慰','犒劳','奖励','压力','社交','聚餐','电影','甜品','咖啡','逛街'
  ];
  const res = [];
  dict.forEach(w=>{
    if(text.includes(w)) res.push(w);
  });
  return res;
}

// 安全文本
function escapeHtml(str){
  return str.replace(/[&<>"']/g, s=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[s]));
}

// 首页预警横幅细节
(function mountAlertDetail(){
  const detail = document.getElementById('alertDetail');
  const {avgDaily, recent3} = computeTrendWarning();
  detail.textContent = `最近3天共 ${fmtCurrency(recent3)}，已高于近30天日均 ${fmtCurrency(avgDaily)} 的30%。`;
})();

// Toast 简易提示
let toastTimer = null;
function toast(msg){
  let el = document.getElementById('__toast');
  if(!el){
    el = document.createElement('div');
    el.id='__toast';
    el.style.position='fixed';
    el.style.left='50%';
    el.style.bottom='90px';
    el.style.transform='translateX(-50%)';
    el.style.background='rgba(0,0,0,0.75)';
    el.style.color='#fff';
    el.style.padding='10px 14px';
    el.style.borderRadius='999px';
    el.style.fontSize='13px';
    el.style.zIndex='999';
    el.style.opacity='0';
    el.style.transition='opacity .2s ease, transform .2s ease';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.style.opacity='1';
  el.style.transform='translateX(-50%) translateY(-4px)';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>{
    el.style.opacity='0';
    el.style.transform='translateX(-50%) translateY(0)';
  }, 1600);
}

// 汇总完成后，更新预警横幅
document.addEventListener('DOMContentLoaded', ()=>{
  renderAll();
  updateTrendAlert();
});
