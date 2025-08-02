// --- ONBOARDING and State Setup ---
const userKey = 'rq_user';
let user = null;
function $(sel) { return document.querySelector(sel); }

window.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem(userKey)) {
    user = JSON.parse(localStorage.getItem(userKey));
    showMain();
  } else {
    $('#onboarding').style.display = 'flex';
    $('#rq-app').style.display = 'none';
  }

  // Onboarding handlers:
  $('#rq-age').oninput = e => { $('#rq-age-value').innerText = e.target.value; }
  $('#onboarding-form').onsubmit = e => {
    e.preventDefault();
    user = {
      name: $('#rq-name').value,
      age: Number($('#rq-age').value),
      mode: document.querySelector('input[name="mode"]:checked').value
    };
    localStorage.setItem(userKey, JSON.stringify(user));
    showMain();
  }
});

function showMain() {
  $('#onboarding').style.display = 'none';
  $('#rq-app').style.display = 'block';
  $('#rq-welcome').innerText = `👋 Welcome ${user.name} (${user.mode} mode)`;
  loadTheme();
  renderMusic();
  renderPomodoro();
  renderStreak();
  renderTasks();
  renderCalc();
  renderArchive();
  renderFounder();
  $('#ach-btn').onclick = showAchievements;
}

// --- THEME TOGGLE ---
let theme = localStorage.getItem('rq_theme') || 'bright';
function loadTheme() {
  setThemeBtn();
  $('body').className =
    theme === 'dark' ? 'dark' :
    theme === 'glasspunk' ? 'glasspunk' :
    '';
  $('#rq-theme-toggle').onclick = () => {
    theme = theme === 'bright' ? 'dark' : theme === 'dark' ? 'glasspunk' : 'bright';
    localStorage.setItem('rq_theme', theme);
    setThemeBtn();
    loadTheme();
  }
}
function setThemeBtn(){
  $('#rq-theme-toggle').innerText =
    theme === 'glasspunk' ? '🕹️' : theme === 'dark' ? '🌙' : '☀️';
}

// --- MUSIC PLAYER ---
function renderMusic() {
  const el = $('#music-player');
  let on = localStorage.getItem('rq_music_on') === '1';
  let track = Number(localStorage.getItem('rq_music_track')) || 0;
  const playlists = [
    {name:"Focus Playlist",url:"https://open.spotify.com/embed/playlist/5iMPQNcuMfYlWNRNUllc2o"},
    {name:"Lofi Artist",url:"https://open.spotify.com/embed/artist/3pZWCUXB3D30ZyI6ubhDgC"}
  ];
  el.innerHTML = `
  <div class="rq-box" style="display: flex;align-items: center;gap: 14px;">
    <button id="music-toggle" class="rq-btn" style="font-size:1.4em;">${on ? "🎵" : "🚫"}</button>
    <div id="music-embed" style="${on ? "" : "display:none;"}">
      <iframe src="${playlists[track].url}" width="215" height="73" style="border-radius:10px;"allow="encrypted-media" title="Focus Music"></iframe>
      <div>
        <button id="music-switch" class="rq-btn" style="font-size:.98em;">Change Playlist</button>
      </div>
    </div>
  </div>
  `;
  $('#music-toggle').onclick = ()=>{
    on = !on; localStorage.setItem('rq_music_on',on?'1':'0'); renderMusic();
  };
  if (on) {
    $('#music-switch').onclick = ()=>{
      track=(track+1)%2; localStorage.setItem('rq_music_track',track); renderMusic();
    }
  }
}

// --- XP, Streak, and Archive Storage ---
function getXP() { return Number(localStorage.getItem('rq_xp')||'0'); }
function setXP(xp) { localStorage.setItem('rq_xp',xp); }
function addXP(v){ setXP(getXP()+v);}
function getTasks(){ return JSON.parse(localStorage.getItem('rq_tasks')||'[]'); }
function setTasks(t){ localStorage.setItem('rq_tasks',JSON.stringify(t)); }
function getStreak(){return Number(localStorage.getItem('rq_streak')||'0');}
function setStreak(s){localStorage.setItem('rq_streak',s);}
function getAchievements(){return JSON.parse(localStorage.getItem('rq_ach')||'{}');}
function setAchievements(obj){localStorage.setItem('rq_ach',JSON.stringify(obj));}
function getArchive(){ return JSON.parse(localStorage.getItem('rq_archives')||'{}'); }
function setArchive(a){ localStorage.setItem('rq_archives',JSON.stringify(a));}
// --- Pomodoro Timer ---
let pomoTimer = null, pomoActive = false;
function renderPomodoro() {
  const sec = Number(localStorage.getItem('rq_pomo_sec'))||25*60;
  $('#pomodoro-sec').innerHTML = `<div class="rq-box" style="text-align:center;">
    <div class="font-bold mb-2">Pomodoro Timer 🕒</div>
    <div class="rq-pomo-main"><span id="rq-pomo-min">${String(Math.floor(sec/60)).padStart(2,"0")}</span>:<span id="rq-pomo-sec">${String(sec%60).padStart(2,"0")}</span></div>
    <button id="pomo-start" class="rq-btn">${pomoActive?"Pause":"Start"}</button><br>
    <div class="rq-xpbar">XP: <b>${getXP()}</b></div>
    <div class="rq-minitext">Complete to get 10 XP!</div>
  </div>`;
  $('#pomo-start').onclick = ()=>{
    pomoActive = !pomoActive;
    if(pomoActive){startPomo();}
    else {clearTimeout(pomoTimer);}
    renderPomodoro();
  }
}
function startPomo(){
  let sec = Number(localStorage.getItem('rq_pomo_sec'))||25*60;
  pomoActive=true;
  pomoTimer = setInterval(()=>{
    sec--;
    localStorage.setItem('rq_pomo_sec',sec);
    if(sec<=0){
      localStorage.setItem('rq_pomo_sec',25*60);
      addXP(10);
      clearInterval(pomoTimer); pomoActive=false;
      alertPopup("Pomodoro Complete! +10 XP");
      // Achievements trigger in JS implementation
    }
    renderPomodoro();
  },1000);
}
// --- Streak tracker (simple, daily XP streaks) ---
function renderStreak() {
  const streak = getStreak();
  $('#streak-sec').innerHTML = `<div class="rq-box" style="text-align:center;"><span style="font-size:1.4em;">🔥</span> Streak: <b>${streak}</b> days</div>`;
}

// --- TASKS ("Quests") ---
function renderTasks() {
  const tasks = getTasks();
  $('#tasks-sec').innerHTML = `
    <div class="rq-box">
      <div class="font-bold mb-2">Quest List</div>
      <form id="rq-taskform" class="rq-taskbar">
        <input id="task-input" maxlength="50" placeholder="Add quest or task"/>
        <button class="rq-btn">Add</button>
      </form>
      <ul id="rq-task-list"></ul>
    </div>`;
  $('#rq-taskform').onsubmit = e=>{
    e.preventDefault();
    const input = $('#task-input').value.trim();
    if(!input) return;
    tasks.push({text:input, boss:false, completed:false});
    setTasks(tasks);
    renderTasks();
  }
  let lstHTML = '';
  tasks.forEach((t,i)=>{
    lstHTML+=`
      <li class="rq-task ${t.completed?"completed":t.boss?"boss":""}">
        ${t.boss?"🐲":""}${t.text}
        <span class="rq-task-btns">
          ${!t.completed?`
            <button onclick="markBoss(${i})" title="Mark as Boss">${t.boss?"🐲":"👹"}</button>
            <button onclick="completeQuest(${i})" title="Complete">✅</button>
          `:""}
        </span>
      </li>
    `
  });
  $('#rq-task-list').innerHTML = lstHTML;
}
window.completeQuest = function(idx){
  const tasks = getTasks(); tasks[idx].completed=true; setTasks(tasks);
  addXP(5); renderTasks();
  let arch=getArchive(); arch[new Date().toLocaleDateString()]=true; setArchive(arch); renderArchive();
}
window.markBoss = function(idx){
  const tasks=getTasks(); tasks[idx].boss=true; setTasks(tasks); renderTasks(); showBossFight(tasks[idx].text);
}

// --- BOSS FIGHT Modal ---
function showBossFight(txt){
  $('#boss-modal').innerHTML = `<div class="boss-overlay">
    <div class="boss-modal">
      <h2>BOSS FIGHT!</h2>
      <div class="boss-task">${txt||''}</div>
      <div id="boss-countdown" style="font-size:2.1em;color:#c11;">30</div>
      <button class="rq-btn" id="boss-defeat">Defeat Boss</button>
    </div>
  </div>`;
  let count=30;
  let timer=setInterval(()=>{
    count--;$('#boss-countdown').innerText = count;
    if(count<=0){clearInterval(timer);closeBoss();}
  },1000);
  $('#boss-defeat').onclick = ()=>{addXP(30);closeBoss();alertPopup("Boss defeated! +30 XP");};
  function closeBoss(){ $('#boss-modal').innerHTML=""; }
}
// --- Simple Calculator ---
function renderCalc(){
  $('#calc-sec').innerHTML = `<div class="rq-box" style="max-width:220px;text-align:center;">
  <b>Calc</b><br>
  <input id="calc-inp" placeholder="8+2*5" style="width:100px;"/><button class="rq-btn" id="calc-eq">=</button>
  <div id="calc-res"></div>
  </div>`;
  $('#calc-eq').onclick = ()=>{
    let res;
    try {res=eval($('#calc-inp').value);}catch{res="Err";}
    $('#calc-res').innerText=res;
  }
}

// -- Archive Calendar (last 30 days green if productive) ---
function renderArchive(){
  const a=getArchive();let html="<b>Monthly Archive</b><div style='display:grid;grid-template-columns:repeat(6,1fr);gap:2px;'>";
  for(let i=0;i<30;i++){
    let d = new Date(); d.setDate(d.getDate()-i);
    let s = d.toLocaleDateString();
    html+=`<div style="padding:2px 3px;border-radius:4px;background:${a[s]?"#adfba6":"#f6f6f6"};font-size:.9em;" title="${s}">
      ${s.slice(0,5)}
    </div>`;
  }
  html+="</div>";
  $('#archive-sec').innerHTML=`<div class="rq-box" style="max-width:210px;">${html}</div>`;
}
// --- Achievements Modal ---
function showAchievements(){
  const ach=getAchievements();
  const badgeList=[
    {key:'pom3',label:'3 Pomodoros','icon':'🥉'},
    {key:'pom7',label:'7 Pomodoros','icon':'🥈'},
    {key:'streak7',label:'7-day Streak','icon':'🔥'},
    {key:'boss1',label:'First Boss','icon':'🐲'},
    {key:'xp100',label:'100 XP','icon':'💎'}
  ];
  let html=`<div class="boss-overlay" id="achiev-layer">
    <div class="boss-modal" style="border-color:#24c;">
      <h3 class="neon-glass">Achievements</h3>
      <ul style="display:flex;flex-wrap:wrap;gap:12px;justify-content:center;">`;
  badgeList.forEach(b=>{
    html+=`<li style="background:${ach[b.key]?"#adefad":"#eee"};padding:8px 17px;border-radius:11px;">
    <span style="font-size:2em">${b.icon}</span><br>${b.label}<br>
    ${ach[b.key]?'<b style="color:#3b5;">Unlocked</b>':''}
    </li>`;
  });
  html+=`</ul><button class="rq-btn" onclick="document.getElementById('achiev-layer').remove()">Close</button></div></div>`;
  $('#ach-modal').innerHTML=html;
}
// --- Founders Section ---
function renderFounder(){
  $('#founder-sec').innerHTML = `
    <div class="rq-box" style="display:flex;gap:17px;align-items:center;max-width:415px;">
      <img src="assets/suraj-avatar.png" alt="Suraj" style="width:62px;height:62px;border-radius:9px;"/>
      <div>
        <div style="font-weight:bold;">Suraj Kumar Gupta</div>
        <div style="font-size:.88em;">Founder</div>
        <div style="font-size:.81em;color:#444a;">
         中国上海市浦东新区张江高科技园区张东路1387号 邮政编码：201203<br>
         Zhōngguó Shànghǎi Shì Pǔdōng Xīn Qū 张江高科技园区 Zhangdong Lu 1387 Hao Yóuzhèng Biānmǎ: 201203<br>
         No. 1387, Zhangdong Rd, Zhangjiang Hi-Tech Park, Pudong New District, Shanghai, China<br>Postal Code: 201203
        </div>
      </div>
    </div>
    <form id="founder-form" style="margin-top:8px;max-width:340px;display:flex;">
      <input placeholder="Your message…" style="flex:1;padding:5px;border-radius:5px;margin-right:4px;"/>
      <button class="rq-btn">Send</button>
      <span id="fSent" style="margin-left:10px;display:none;">Sent! 🎉</span>
    </form>`;
  $('#founder-form').onsubmit = e=>{
    e.preventDefault();
    $('#fSent').style.display="inline";
    setTimeout(()=>{$('#fSent').style.display="none";},1800);
    e.target.reset();
  }
}

// --- Simple notification pop ---
function alertPopup(txt){
   let el=document.createElement('div');el.innerText=txt;
   el.style="position:fixed;top:14px;left:50vw;transform:translateX(-50%);background:#fff2;border-radius:11px;padding:10px 23px;font-weight:700;font-size:1.2em;color:#333;z-index:111;box-shadow:0 2px 13px #eaabf6d3;transition:.23s;";
   document.body.appendChild(el);
   setTimeout(()=>{el.style.opacity="0";setTimeout(()=>el.remove(),550);},1200);
}
