/* 🥜花 生-how to cost your life H5
   - 数据：localStorage
   - 图表：Chart.js via CDN
   - 创意模块：
     A) 消费心情分析：规则关键词 + 心情标签
     B) 消费趋势预警：近30天平均 vs 最近3天总额
   - 替换为 AI：将 analyzeMoodFromText / getMoodSummary 替换为服务端/SDK 调用，返回情绪标签或情绪分布即可
*/

(function(){
  // ====== 常量与工具 ======
  const LS_RECORDS = 'ledger_records_v1';
  const LS_BUDGETS = 'ledger_budgets_v1';
  const CATEGORIES = ['餐饮','购物','娱乐','美妆','交通','其他'];

  const $ = (sel)=>document.querySelector(sel);
  const $$ = (sel)=>document.querySelectorAll(sel);

  const dayStart = (ts)=> new Date(new Date(ts).toDateString()).getTime();
  const fmtDateTime = (ts)=>{
    const d = new Date(ts);
    const mm = String(d.getMonth()+1).padStart(2,'0');
    const dd = String(d.getDate()).padStart(2,'0');
    const hh = String(d.getHours()).padStart(2,'0');
    const mi = String(d.getMinutes()).padStart(2,'0');
    return `${mm}-${dd} ${hh}:${mi}`;
  };
  const thisMonthKey = ()=>{
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
  };

  // 简单图片压缩为缩略图 dataURL，限制宽度 ~ 480
  function compressImage(file, maxW=480){
    return new Promise((resolve)=>{
      const reader = new FileReader();
      reader.onload = e=>{
        const img = new Image();
        img.onload = ()=>{
          const scale = Math.min(1, maxW / img.width);
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img,0,0,canvas.width,canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  // ====== 心情分析（规则词库，可替换为 AI） ======
  // 规则：包含下列关键词触发对应情绪
  const MOOD_RULES = {
    开心: ['开心','愉快','快乐','喜悦','美好','庆祝','奖励','犒劳'],
    治愈: ['治愈','温暖','放松','疗愈','安慰','咖啡','甜点'],
    解压: ['解压','压力','加班','疲惫','熬夜','崩溃','焦虑','外卖'],
    审慎: ['审慎','节制','省钱','预算','还款','理性','克制']
  };
  function analyzeMoodFromText(text=''){
    text = String(text);
    const scores = { 开心:0,治愈:0,解压:0,审慎:0 };
    for(const mood in MOOD_RULES){
      MOOD_RULES[mood].forEach(k=>{
        if(text.includes(k)) scores[mood]+=1;
      });
    }
    // 返回得分最高的情绪；若全为0，则返回空
    const sorted = Object.entries(scores).sort((a,b)=>b[1]-a[1]);
    return sorted[0][1] > 0 ? sorted[0][0] : '';
  }
  function getMoodSummary(moodDist){
    // moodDist: { 开心:x, 治愈:y, 解压:z, 审慎:w }
    const entries = Object.entries(moodDist).sort((a,b)=>b[1]-a[1]);
    if(!entries.length || (entries[0][1]===0)) return '这个月你的消费较为理性且平稳';
    const top = entries[0][0];
    if(top==='开心') return '这个月你多数是为了快乐与奖励而消费';
    if(top==='治愈') return '这个月你偏向治愈与放松，照顾自己的情绪很重要';
    if(top==='解压') return '这个月你多为缓解压力而消费，试试更健康的放松方式';
    if(top==='审慎') return '这个月你更审慎节制，保持理性很棒';
    return '这个月你的消费较为均衡';
  }

  // ====== 数据存取 ======
  function loadRecords(){
    try{
      const raw = localStorage.getItem(LS_RECORDS);
      if(raw) return JSON.parse(raw);
    }catch(e){}
    return [];
  }
  function saveRecords(list){
    localStorage.setItem(LS_RECORDS, JSON.stringify(list));
  }
  function loadBudgets(){
    try{
      const raw = localStorage.getItem(LS_BUDGETS);
      if(raw) return JSON.parse(raw);
    }catch(e){}
    // 默认每类 500
    const defaults = {};
    CATEGORIES.forEach(c=>defaults[c]=500);
    return { month: thisMonthKey(), values: defaults };
  }
  function saveBudgets(bud){
    localStorage.setItem(LS_BUDGETS, JSON.stringify(bud));
  }

  // ====== 示例数据（含图片 dataURL） ======
  // 小体积 dataURL（占位插画），避免需要 /images 目录
  const SAMPLE_IMG_COFFEE = 'data:image/svg+xml;base64,'+btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480"><rect width="100%" height="100%" fill="#f6f7fb"/><circle cx="320" cy="200" r="120" fill="#ffc6d0"/><text x="50%" y="65%" text-anchor="middle" font-size="40" fill="#23314a">Coffee</text></svg>`);
  const SAMPLE_IMG_BOX = 'data:image/svg+xml;base64,'+btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480"><rect width="100%" height="100%" fill="#f6f7fb"/><rect x="180" y="120" width="280" height="180" rx="16" fill="#a2b7ff"/><text x="50%" y="70%" text-anchor="middle" font-size="40" fill="#23314a">Shopping</text></svg>`);
  const SAMPLE_IMG_MOVIE = 'data:image/svg+xml;base64,'+btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480"><rect width="100%" height="100%" fill="#f6f7fb"/><polygon points="240,140 440,240 240,340" fill="#7bc5c1"/><text x="50%" y="75%" text-anchor="middle" font-size="40" fill="#23314a">Movie</text></svg>`);

  function ensureSamples(){
    const exist = loadRecords();
    if(exist && exist.length>0) return;
    const now = Date.now();
    const samples = [
      { id: crypto.randomUUID(), amount: 28.5, category:'餐饮', ts: now-1000*60*60*12, note:'下午咖啡和甜点，心情被治愈', mood:'治愈', img:SAMPLE_IMG_COFFEE },
      { id: crypto.randomUUID(), amount: 199, category:'购物', ts: now-1000*60*60*24*2, note:'买了收纳盒，生活更有秩序，开心', mood:'开心', img:SAMPLE_IMG_BOX },
      { id: crypto.randomUUID(), amount: 45, category:'娱乐', ts: now-1000*60*60*36, note:'加班后看了一场电影，放松解压', mood:'解压', img:SAMPLE_IMG_MOVIE },
    ];
    saveRecords(samples);
  }

  // ====== 视图与导航 ======
  function bindTabbar(){
    $$('.tabbar .tab-item').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        $$('.tabbar .tab-item').forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        const target = btn.getAttribute('data-target');
        $$('.view').forEach(v=>v.classList.remove('active'));
        $('#'+target).classList.add('active');
        if(target==='statsView') { renderStats(); }
        if(target==='homeView') { renderHome(); }
        if(target==='recordView') { renderLifeSpace(); }
        if(target==='settingsView') { renderSettings(); }
      });
    });
  }

  // ====== 首页：预算进度、记录流 ======
  function calcMonthlySpendByCategory(records, monthKey){
    const ret = {};
    CATEGORIES.forEach(c=>ret[c]=0);
    records.forEach(r=>{
      const d = new Date(r.ts);
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      if(key===monthKey) ret[r.category] += Number(r.amount)||0;
    });
    return ret;
  }
  function renderBudgetBars(){
    const records = loadRecords();
    const month = thisMonthKey();
    const budgets = loadBudgets();
    const spent = calcMonthlySpendByCategory(records, month);
    const wrap = $('#budgetBars');
    wrap.innerHTML = '';
    CATEGORIES.forEach(cat=>{
      const total = budgets.values[cat] || 0;
      const used = (spent[cat]||0);
      const pct = total>0 ? Math.min(100, Math.round(used/total*100)) : 0;
      const over = used>total;
      const div = document.createElement('div');
      div.className='budget-item';
      div.innerHTML = `
        <div class="label">${cat}</div>
        <div class="progress ${over?'over':''}">
          <div class="bar" style="width:${Math.min(pct,100)}%"></div>
          <div class="text">${used.toFixed(0)} / ${total.toFixed(0)}</div>
        </div>
      `;
      wrap.appendChild(div);
    });
  }
  function renderMonthSummary(){
    const records = loadRecords();
    const month = thisMonthKey();
    let total = 0;
    const byCat = {};
    const moodDist = { 开心:0,治愈:0,解压:0,审慎:0 };
    records.forEach(r=>{
      const d = new Date(r.ts);
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      if(key===month){
        total += Number(r.amount)||0;
        byCat[r.category]=(byCat[r.category]||0)+(Number(r.amount)||0);
        if(r.mood && moodDist[r.mood]!=null) moodDist[r.mood]+=1;
        // 备注情绪识别
        const m2 = analyzeMoodFromText(r.note||'');
        if(m2 && moodDist[m2]!=null) moodDist[m2]+=0.5; // 文本识别权重较低
      }
    });
    const maxCat = Object.entries(byCat).sort((a,b)=>b[1]-a[1])[0]?.[0] || '—';
    const moodSummary = getMoodSummary(moodDist);
    $('#monthSummary').innerHTML = `
      <div><b>本月总支出：</b>¥ ${total.toFixed(2)}</div>
      <div><b>最大分类：</b>${maxCat}</div>
      <div><b>心情摘要：</b>${moodSummary}</div>
    `;
  }
  function renderRecordList(){
    const records = loadRecords().slice().sort((a,b)=>b.ts-a.ts);
    const cat = $('#categoryFilter').value;
    const list = $('#recordList');
    list.innerHTML='';
    records.filter(r=>cat==='all'||r.category===cat).forEach((r, idx)=>{
      const card = document.createElement('div');
      card.className='record-card';
      // 轻微浮动与渐入动画（使用 CSS keyframes）
      card.style.animationDelay = (idx*0.05)+'s';
      card.innerHTML = `
        <img class="record-thumb" src="${r.img||SAMPLE_IMG_COFFEE}" alt="${r.category}" />
        <div class="record-info">
          <div class="record-top">
            <div class="amount">¥ ${Number(r.amount).toFixed(2)}</div>
            <div class="category">${r.category}</div>
          </div>
          <div class="note">${r.note ? escapeHtml(r.note) : '—'}</div>
          <div class="meta">
            <span><i class="ri-time-line"></i> ${fmtDateTime(r.ts)}</span>
            ${r.mood?`<span class="mood-chip"><i class="ri-emotion-line"></i> ${r.mood}</span>`:''}
          </div>
        </div>
      `;
      list.appendChild(card);
    });
  }
  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  }
  function renderHome(){
    renderBudgetBars();
    renderMonthSummary();
    renderRecordList();
    computeAndShowTrendWarning(); // 预警横幅
  }

  // ====== 快速记账 ======
  function bindAddForm(){
    let lastImgDataUrl = '';
    $('#imageInput').addEventListener('change', async (e)=>{
      const file = e.target.files?.[0];
      if(!file) return;
      const url = await compressImage(file, 600);
      lastImgDataUrl = url;
      const prev = $('#imagePreview');
      prev.innerHTML = `<img src="${url}" alt="预览" />`;
    });
    $('#addForm').addEventListener('submit', (e)=>{
      e.preventDefault();
      const amount = parseFloat($('#amountInput').value);
      const category = $('#categoryInput').value;
      const note = $('#noteInput').value.trim();
      let mood = $('#moodInput').value;
      if(!mood){ // 若未显式选择，则通过文本规则推断
        const infer = analyzeMoodFromText(note);
        if(infer) mood = infer;
      }
      if(isNaN(amount) || amount<=0) { alert('请输入有效金额'); return; }

      const rec = {
        id: crypto.randomUUID(),
        amount, category,
        ts: Date.now(),
        note,
        mood,
        img: lastImgDataUrl || '' // 可为空
      };
      const list = loadRecords();
      list.push(rec);
      saveRecords(list);

      // 重置表单
      $('#addForm').reset();
      $('#imagePreview').innerHTML='';
      lastImgDataUrl = '';

      // 刷新视图
      renderHome();
      renderLifeSpace();
      renderStats();

      // 轻提示
      toast('已保存');
    });
  }

  // ====== 生活记录空间（动态流 / 相册） ======
  function bindLifeTabs(){
    $('#tabFeed').addEventListener('click', ()=>{
      $('#tabFeed').classList.add('active');
      $('#tabGallery').classList.remove('active');
      $('#lifeFeed').classList.remove('hidden');
      $('#lifeGallery').classList.add('hidden');
    });
    $('#tabGallery').addEventListener('click', ()=>{
      $('#tabGallery').classList.add('active');
      $('#tabFeed').classList.remove('active');
      $('#lifeGallery').classList.remove('hidden');
      $('#lifeFeed').classList.add('hidden');
    });
  }
  function renderLifeSpace(){
    const records = loadRecords().slice().sort((a,b)=>a.ts-b.ts);
    // 动态流
    const feed = $('#lifeFeed');
    feed.innerHTML='';
    records.forEach(r=>{
      const card = document.createElement('div');
      card.className='record-card';
      card.innerHTML = `
        <img class="record-thumb" src="${r.img||SAMPLE_IMG_COFFEE}" alt="${r.category}" />
        <div class="record-info">
          <div class="record-top">
            <div class="amount">¥ ${Number(r.amount).toFixed(2)}</div>
            <div class="category">${r.category}</div>
          </div>
          <div class="note">${r.note?escapeHtml(r.note):'—'}</div>
          <div class="meta">
            <span><i class="ri-time-line"></i> ${fmtDateTime(r.ts)}</span>
            ${r.mood?`<span class="mood-chip"><i class="ri-emotion-line"></i> ${r.mood}</span>`:''}
          </div>
        </div>
      `;
      feed.appendChild(card);
    });
    // 相册（瀑布拼贴）
    const gal = $('#lifeGallery');
    gal.innerHTML='';
    records.filter(r=>r.img).forEach(r=>{
      const img = document.createElement('img');
      img.className='gimg';
      img.src = r.img;
      img.alt = r.category;
      img.addEventListener('click', ()=>{
        $('#modalImg').src = r.img;
        $('#modalInfo').innerHTML = `
          <div><b>¥ ${Number(r.amount).toFixed(2)}</b> · ${r.category}</div>
          <div>${fmtDateTime(r.ts)} ${r.mood?`· ${r.mood}`:''}</div>
          <div style="margin-top:4px;color:#456">${r.note?escapeHtml(r.note):''}</div>
        `;
        $('#imageModal').classList.remove('hidden');
      });
      gal.appendChild(img);
    });
  }
  function bindModal(){
    $('#closeModal').addEventListener('click', ()=>$('#imageModal').classList.add('hidden'));
    $('#imageModal .modal-mask').addEventListener('click', ()=>$('#imageModal').classList.add('hidden'));
  }

  // ====== 统计（饼图 / 趋势图 / 心情） ======
  let pieChart, lineChart;
  function getRangeFilter(){
    const v = $('#timeRange').value;
    const now = Date.now();
    if(v==='month'){
      const d = new Date();
      const start = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
      return (ts)=> ts>=start;
    }
    if(v==='week'){
      const start = now - 6*86400000;
      return (ts)=> ts>=start;
    }
    if(v==='30d'){
      const start = now - 29*86400000;
      return (ts)=> ts>=start;
    }
    return ()=>true; // 全部
  }
  function renderPie(){
    const records = loadRecords();
    const filter = getRangeFilter();
    const sums = {};
    CATEGORIES.forEach(c=>sums[c]=0);
    let total=0;
    records.forEach(r=>{
      if(filter(r.ts)) {
        const a = Number(r.amount)||0;
        sums[r.category]+=a; total+=a;
      }
    });
    const data = CATEGORIES.map(c=>sums[c]);
    const colors = ['#7bc5c1','#a2b7ff','#ffc6d0','#c9f2e7','#ffd6a5','#d7e3fc'];
    const ctx = $('#pieChart');
    if(pieChart) pieChart.destroy();
    pieChart = new Chart(ctx, {
      type:'pie',
      data:{ labels:CATEGORIES, datasets:[{ data, backgroundColor:colors, borderWidth:0 }] },
      options:{
        plugins:{ legend:{ position:'bottom' } }
      }
    });
  }
  function renderLine(span=7){
    const records = loadRecords();
    const now = dayStart(Date.now());
    const days = [];
    for(let i=span-1;i>=0;i--) days.push(now - i*86400000);
    const sums = days.map(d=>{
      const end = d + 86400000;
      const total = records.filter(r=>r.ts>=d && r.ts<end).reduce((s,r)=>s+(Number(r.amount)||0),0);
      return total;
    });
    const ctx = $('#lineChart');
    if(lineChart) lineChart.destroy();
    lineChart = new Chart(ctx, {
      type:'bar',
      data:{
        labels: days.map(d=>{
          const dd = new Date(d);
          return `${dd.getMonth()+1}/${dd.getDate()}`;
        }),
        datasets:[{
          label:'日支出',
          data: sums,
          backgroundColor: sums.map(()=> 'rgba(123,197,193,0.6)'),
          borderRadius: 8
        }]
      },
      options:{
        scales:{ y:{ beginAtZero:true } },
        plugins:{
          legend:{ display:false },
          tooltip:{ callbacks:{ label:(ctx)=>`¥ ${ctx.raw.toFixed(2)}` } }
        }
      }
    });

    // 高亮预警区间（最近3天且触发预警时）
    const warn = computeTrendWarning();
    if(warn?.triggered){
      const lastIdx = sums.length-1;
      for(let k=0;k<3;k++){
        if(lastIdx-k>=0){
          lineChart.setDatasetStyle(0, {
            backgroundColor: (ctx)=>{
              const idx = ctx.dataIndex;
              if(idx>=sums.length-3) return 'rgba(255,138,138,0.7)';
              return 'rgba(123,197,193,0.6)';
            }
          });
        }
      }
      lineChart.update();
    }
  }
  function renderMoodStats(){
    const month = thisMonthKey();
    const records = loadRecords().filter(r=>{
      const d = new Date(r.ts);
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      return key===month;
    });
    const totalCount = records.length || 1;
    const moodCount = { 开心:0,治愈:0,解压:0,审慎:0 };
    const kwCount = {};
    records.forEach(r=>{
      if(r.mood && moodCount[r.mood]!=null) moodCount[r.mood]+=1;
      // 文本关键词统计（所有规则词）
      Object.values(MOOD_RULES).flat().forEach(k=>{
        if((r.note||'').includes(k)){
          kwCount[k]=(kwCount[k]||0)+1;
        }
      });
    });
    const happyPct = Math.round((moodCount['开心']/totalCount)*100);
    // 常见关键词 Top 6
    const topKws = Object.entries(kwCount).sort((a,b)=>b[1]-a[1]).slice(0,6);

    $('#moodStats').innerHTML = `
      <div class="stat-box">
        <div><b>开心消费占比</b></div>
        <div style="font-size:22px;margin-top:6px"> ${isNaN(happyPct)?0:happyPct}% </div>
      </div>
      <div class="stat-box">
        <div><b>常见情绪关键词</b></div>
        <div class="kws">${topKws.map(([k,v])=>`<span class="kw">${k} · ${v}</span>`).join('') || '<span class="kw">—</span>'}</div>
      </div>
    `;
  }
  function renderStats(){
    renderPie();
    // 默认 7 天
    renderLine(7);
    renderMoodStats();
  }
  function bindStatsControls(){
    $('#timeRange').addEventListener('change', renderPie);
    $$('.segmented .seg').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        $$('.segmented .seg').forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        const span = parseInt(btn.dataset.span,10);
        renderLine(span);
      });
    });
  }

  // ====== 趋势预警 ======
  function computeTrendWarning(){
    const records = loadRecords();
    const now = dayStart(Date.now());
    const last30Start = now - 29*86400000;
    const last3Start = now - 2*86400000;

    const sumInRange = (start, end)=> records
      .filter(r=>r.ts>=start && r.ts<end)
      .reduce((s,r)=>s+(Number(r.amount)||0),0);

    const sum30 = sumInRange(last30Start, now + 86400000);
    const avgDaily30 = sum30 / 30;
    const sumLast3 = sumInRange(last3Start, now + 86400000); // 最近3天（含今天）
    const threshold = avgDaily30 * 3 * 1.3; // >30% 判定
    const triggered = sumLast3 > threshold && sumLast3>0;

    return {
      triggered,
      sumLast3: Number(sumLast3.toFixed(2)),
      avgDaily30: Number(avgDaily30.toFixed(2)),
      threshold: Number(threshold.toFixed(2))
    };
  }
  function computeAndShowTrendWarning(){
    const res = computeTrendWarning();
    const banner = $('#warningBanner');
    if(res.triggered){
      $('#warningText').textContent = `最近3天合计 ¥${res.sumLast3}，高于近30天日均（¥${res.avgDaily30}）的30%阈值（¥${res.threshold}）。建议减少外卖与冲动购物。`;
      banner.classList.remove('hidden');
    }else{
      banner.classList.add('hidden');
    }
  }
  function bindWarningBanner(){
    $('#closeWarning').addEventListener('click', ()=>$('#warningBanner').classList.add('hidden'));
  }

  // ====== 设置（预算）与数据管理 ======
  function renderSettings(){
    // 预算表单
    const bud = loadBudgets();
    const form = $('#budgetForm');
    form.innerHTML = '';
    CATEGORIES.forEach(cat=>{
      const row = document.createElement('div');
      row.className='budget-row';
      row.innerHTML = `
        <label>${cat}</label>
        <input type="number" min="0" step="10" value="${bud.values[cat]||0}" data-cat="${cat}" />
      `;
      form.appendChild(row);
    });
  }
  function bindSettingsActions(){
    $('#editBudgetBtn').addEventListener('click', ()=>{
      // 切到设置页
      document.querySelector('.tabbar .tab-item[data-target="settingsView"]').click();
    });
    $('#saveBudgetBtn').addEventListener('click', ()=>{
      const bud = loadBudgets();
      const values = {...bud.values};
      $$('#budgetForm input[type="number"]').forEach(inp=>{
        const cat = inp.dataset.cat;
        values[cat] = Math.max(0, parseFloat(inp.value)||0);
      });
      const currMonth = thisMonthKey();
      saveBudgets({ month: currMonth, values });
      toast('预算已保存');
      renderHome();
    });
    $('#resetDataBtn').addEventListener('click', ()=>{
      if(confirm('确认清空所有数据？该操作不可恢复。')){
        localStorage.removeItem(LS_RECORDS);
        localStorage.removeItem(LS_BUDGETS);
        ensureSamples();
        toast('已恢复示例数据');
        renderHome(); renderLifeSpace(); renderStats(); renderSettings();
      }
    });
  }

  // ====== 小提示组件 ======
  let toastTimer = null;
  function toast(msg){
    let el = $('#__toast');
    if(!el){
      el = document.createElement('div');
      el.id='__toast';
      el.style.cssText = 'position:fixed;left:50%;bottom:96px;transform:translateX(-50%);background:#223b;backdrop-filter:blur(2px);color:#fff;padding:10px 14px;border-radius:999px;z-index:50;box-shadow:0 6px 16px rgba(0,0,0,.2);font-size:13px';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.opacity = '1';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(()=>{ el.style.opacity='0'; }, 1200);
  }

  // ====== 事件绑定 ======
  function bindEvents(){
    bindTabbar();
    bindAddForm();
    bindLifeTabs();
    bindModal();
    bindStatsControls();
    bindSettingsActions();

    $('#categoryFilter').addEventListener('change', renderRecordList);
  }

  // ====== 初始化 ======
  function init(){
    ensureSamples();
    // 月份变化时（跨月）保持预算表记当前月（不自动清零历史记录）
    const bud = loadBudgets();
    const currMonth = thisMonthKey();
    if(bud.month!==currMonth){
      saveBudgets({ month: currMonth, values: bud.values });
    }

    bindEvents();
    bindWarningBanner();

    // 初始渲染
    renderHome();
    renderLifeSpace();
    renderStats();
    renderSettings();

    // 入场动画微延迟
    setTimeout(()=>document.body.classList.add('ready'), 100);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
