
(function(){
  'use strict';
  var $=function(id){return document.getElementById(id)};

  /* меню */
  var drawer=$('drawer'), burger=$('burger'), closeBtn=$('drawerClose'), lastFocus=null;
  function openD(){ if(!drawer||!burger) return; lastFocus=document.activeElement;
    drawer.classList.add('is-open'); drawer.setAttribute('aria-hidden','false');
    burger.setAttribute('aria-expanded','true'); document.body.style.overflow='hidden';
    var f=drawer.querySelector('a,button'); if(f) f.focus(); }
  function closeD(){ if(!drawer||!burger) return; drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden','true'); burger.setAttribute('aria-expanded','false');
    document.body.style.overflow=''; if(lastFocus&&lastFocus.focus) lastFocus.focus(); }
  if(burger) burger.addEventListener('click',function(){ drawer.classList.contains('is-open')?closeD():openD(); });
  if(closeBtn) closeBtn.addEventListener('click',closeD);
  if(drawer) drawer.addEventListener('click',function(e){ if(e.target.tagName==='A') closeD(); });
  document.addEventListener('keydown',function(e){
    if(e.key==='Escape'&&drawer&&drawer.classList.contains('is-open')) closeD();
    if(e.key==='Tab'&&drawer&&drawer.classList.contains('is-open')){
      var f=drawer.querySelectorAll('a,button'), first=f[0], last=f[f.length-1];
      if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
      else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
    }
  });
  window.addEventListener('resize',function(){ if(window.innerWidth>1049&&drawer&&drawer.classList.contains('is-open')) closeD(); });

  /* ---------- конструктор детали ---------- */
  var DEN=7.85;
  var NAMES={pryam:'Пластина (прямоугольник)',krug:'Диск (круг)',flanec:'Фланец с отверстиями',kosynka:'Косынка (треугольник)'};
  function fmt(n,d){ var s=n.toFixed(d===undefined?2:d); return s.replace('.',','); }
  function num(id,def){ var e=$(id); var v=e?parseFloat(String(e.value).replace(',','.')):NaN;
    return isFinite(v)&&v>0?v:def; }
  function shapeShow(){
    var sh=$('kShape')?$('kShape').value:'pryam';
    document.querySelectorAll('[data-for]').forEach(function(el){
      var ok=el.getAttribute('data-for').split(' ').indexOf(sh)>=0;
      el.style.display=ok?'':'none';
    });
  }
  function geom(){
    var sh=$('kShape').value, s=num('fS',3), qty=Math.max(1,Math.round(num('fQty',1)));
    var sheet=$('fSheet').value.split('x').map(function(x){return parseFloat(x)});
    var W=sheet[0], H=sheet[1];
    var area=0, per=0, bw=0, bh=0, holes=[], a=0, b=0, D=0, d=0, dh=0, nh=0;
    if(sh==='pryam'){ a=num('fA',400); b=num('fB',300);
      area=a*b; per=2*(a+b); bw=a; bh=b; }
    else if(sh==='krug'){ D=num('fD',300);
      area=Math.PI*D*D/4; per=Math.PI*D; bw=D; bh=D; }
    else if(sh==='flanec'){ D=num('fD',300); d=num('fDin',140); dh=num('fDH',18); nh=Math.max(1,Math.round(num('fNH',6)));
      if(d>=D) d=D*0.4;
      area=Math.PI*(D*D-d*d)/4 - nh*Math.PI*dh*dh/4;
      per=Math.PI*D + Math.PI*d + nh*Math.PI*dh; bw=D; bh=D;
      var rb=(D+d)/4;
      for(var i=0;i<nh;i++){ var t=-Math.PI/2 + i*2*Math.PI/nh;
        holes.push([Math.cos(t)*rb/2, Math.sin(t)*rb/2, dh/2]); }
    } else { a=num('fA',400); b=num('fB',400);
      area=a*b/2; per=a+b+Math.sqrt(a*a+b*b); bw=a; bh=b; }
    if(area<=0) area=1;
    var areaM2=area/1e6, weight=areaM2*s*DEN;
    var m=15, gap=10;
    var cols=Math.max(1,Math.floor((W-2*m+gap)/(bw+gap)));
    var rows=Math.max(1,Math.floor((H-2*m+gap)/(bh+gap)));
    var perSheet=cols*rows;
    var sheets=Math.ceil(qty/perSheet);
    var use=Math.min(100, perSheet*areaM2/(W*H/1e6)*100);
    return {sh:sh,a:a,b:b,D:D,d:d,dh:dh,nh:nh,s:s,qty:qty,W:W,H:H,areaM2:areaM2,per:per,weight:weight,
      cols:cols,rows:rows,perSheet:perSheet,sheets:sheets,use:use,holes:holes,
      perTotal:per/1000*qty, weightTotal:weight*qty};
  }
  function drawPart(g){
    var box=$('partSvg'); if(!box) return;
    var pad=46, W=340, H=250;
    var bw=g.sh==='krug'||g.sh==='flanec'?g.D:g.a;
    var bh=g.sh==='krug'||g.sh==='flanec'?g.D:g.b;
    var k=Math.min((W-2*pad)/bw,(H-2*pad)/bh);
    var cx=W/2, cy=H/2;
    var svg=['<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Контур детали с размерами">',
      '<defs><pattern id="grd" width="20" height="20" patternUnits="userSpaceOnUse">',
      '<path d="M20 0H0V20" fill="none" stroke="rgba(18,23,26,.09)" stroke-width="1"/></pattern></defs>',
      '<rect width="'+W+'" height="'+H+'" fill="url(#grd)"/>'];
    svg.push('<g stroke="rgba(18,23,26,.3)" stroke-width="1" stroke-dasharray="6 4">'
      +'<path d="M'+cx+' 8V'+(H-8)+'"/><path d="M8 '+cy+'H'+(W-8)+'"/></g>');
    var ex='fill="rgba(193,68,12,.10)" stroke="#C1440C" stroke-width="2"';
    if(g.sh==='pryam'){
      var w=g.a*k, h=g.b*k;
      svg.push('<rect x="'+(cx-w/2)+'" y="'+(cy-h/2)+'" width="'+w+'" height="'+h+'" '+ex+'/>');
    } else if(g.sh==='krug'){
      svg.push('<circle cx="'+cx+'" cy="'+cy+'" r="'+(g.D*k/2)+'" '+ex+'/>');
    } else if(g.sh==='flanec'){
      svg.push('<circle cx="'+cx+'" cy="'+cy+'" r="'+(g.D*k/2)+'" '+ex+'/>');
      svg.push('<circle cx="'+cx+'" cy="'+cy+'" r="'+Math.max(2,g.d*k/2)+'" fill="#fff" stroke="#C1440C" stroke-width="1.6"/>');
      g.holes.forEach(function(h){
        svg.push('<circle cx="'+(cx+h[0]*k)+'" cy="'+(cy+h[1]*k)+'" r="'+Math.max(1.6,h[2]*k)+'" fill="#fff" stroke="#C1440C" stroke-width="1.2"/>');
      });
    } else {
      var wa=g.a*k, ha=g.b*k;
      svg.push('<path d="M'+(cx-wa/2)+' '+(cy+ha/2)+' H'+(cx+wa/2)+' V'+(cy-ha/2)+' Z" '+ex+'/>');
    }
    /* подвод плазмы */
    svg.push('<g stroke="#12171A" stroke-width="1.4" stroke-dasharray="3 3"><path d="M12 '+(cy-bh*k/2-14)
      +' H'+(cx-bw*k/2)+'"/></g>');
    svg.push('<circle cx="12" cy="'+(cy-bh*k/2-14)+'" r="3" fill="#12171A"/>');
    /* размеры */
    svg.push('<g stroke="#414C52" stroke-width="1" font-family="IBM Plex Mono, monospace" fill="#414C52" font-size="9">');
    var yb=cy+bh*k/2+22;
    svg.push('<path d="M'+(cx-bw*k/2)+' '+(yb-4)+'V'+(yb+4)+'M'+(cx+bw*k/2)+' '+(yb-4)+'V'+(yb+4)
      +'M'+(cx-bw*k/2)+' '+yb+'H'+(cx+bw*k/2)+'"/>');
    svg.push('<text x="'+cx+'" y="'+(yb+14)+'" text-anchor="middle">'+(g.sh==='krug'||g.sh==='flanec'?'Ø'+g.D:g.a)+' мм</text>');
    if(g.sh==='pryam'||g.sh==='kosynka'){
      var xl=cx-bw*k/2-14;
      svg.push('<path d="M'+(xl-4)+' '+(cy-bh*k/2)+'H'+(xl+4)+'M'+(xl-4)+' '+(cy+bh*k/2)+'H'+(xl+4)
        +'M'+xl+' '+(cy-bh*k/2)+'V'+(cy+bh*k/2)+'"/>');
      svg.push('<text x="'+(xl-8)+'" y="'+cy+'" text-anchor="middle" transform="rotate(-90 '+(xl-8)+' '+cy+')">'+g.b+' мм</text>');
    }
    svg.push('</g></svg>');
    box.innerHTML=svg.join('');
  }
  function drawNest(g){
    var box=$('nestSvg'); if(!box) return;
    var W=300, H=300, pad=8;
    var k=Math.min((W-2*pad)/g.W,(H-2*pad)/g.H);
    var sw=g.W*k, sh=g.H*k, ox=(W-sw)/2, oy=(H-sh)/2;
    var svg=['<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Раскладка деталей на листе">',
      '<defs><pattern id="grd2" width="15" height="15" patternUnits="userSpaceOnUse">',
      '<path d="M15 0H0V15" fill="none" stroke="rgba(18,23,26,.08)" stroke-width="1"/></pattern></defs>',
      '<rect x="'+ox+'" y="'+oy+'" width="'+sw+'" height="'+sh+'" fill="url(#grd2)" stroke="#12171A" stroke-width="1.4"/>'];
    var bw=(g.sh==='krug'||g.sh==='flanec'?g.D:g.a)*k, bh=(g.sh==='krug'||g.sh==='flanec'?g.D:g.b)*k;
    var gap=10*k, m=15*k;
    var cols=g.cols, rows=g.rows;
    for(var r=0;r<rows;r++){
      for(var c=0;c<cols;c++){
        var x=ox+m+c*(bw+gap), y=oy+m+r*(bh+gap);
        if(g.sh==='krug'||g.sh==='flanec'){
          svg.push('<circle cx="'+(x+bw/2)+'" cy="'+(y+bh/2)+'" r="'+bw/2+'" fill="rgba(193,68,12,.14)" stroke="#C1440C" stroke-width="1"/>');
        } else if(g.sh==='kosynka'){
          svg.push('<path d="M'+x+' '+(y+bh)+' H'+(x+bw)+' V'+y+' Z" fill="rgba(193,68,12,.14)" stroke="#C1440C" stroke-width="1"/>');
        } else {
          svg.push('<rect x="'+x+'" y="'+y+'" width="'+bw+'" height="'+bh+'" fill="rgba(193,68,12,.14)" stroke="#C1440C" stroke-width="1"/>');
        }
      }
    }
    svg.push('<text x="'+(W/2)+'" y="'+(H-2)+'" text-anchor="middle" font-family="IBM Plex Mono, monospace" '
      +'font-size="8" letter-spacing="1" fill="#6E7A80">ЛИСТ '+g.W+'×'+g.H+' · '+cols+'×'+rows+'</text>');
    svg.push('</svg>');
    box.innerHTML=svg.join('');
  }
  function calc(){
    if(!$('kShape')) return;
    shapeShow();
    var g=geom();
    document.querySelectorAll('[data-out]').forEach(function(el){
      var k=el.getAttribute('data-out'), v='';
      if(k==='area') v=fmt(g.areaM2,3)+' м²';
      else if(k==='per') v=fmt(g.per/1000,2)+' м';
      else if(k==='weight') v=fmt(g.weight,2)+' кг';
      else if(k==='perSheet') v=g.perSheet+' шт';
      else if(k==='sheets') v=g.sheets+(g.sheets===1?' лист':(g.sheets<5?' листа':' листов'));
      else if(k==='perTotal') v=fmt(g.perTotal,1)+' м';
      else if(k==='weightTotal') v=fmt(g.weightTotal,1)+' кг';
      else if(k==='use') v=fmt(g.use,1)+' %';
      el.textContent=v;
    });
    drawPart(g); drawNest(g);
    var wa=$('calcwa');
    if(wa){
      var dims = g.sh==='pryam'||g.sh==='kosynka' ? (g.a+'×'+g.b+' мм') : ('Ø'+g.D+' мм'+(g.sh==='flanec'?(' / Ø'+g.d+' мм, '+g.nh+' отв. Ø'+g.dh):''));
      wa.href='https://wa.me/375336865609?text='+encodeURIComponent(
        'Заявка с сайта: расчёт резки\nДеталь: '+NAMES[g.sh]+'\nРазмеры: '+dims+'\nТолщина: '+g.s+' мм\n'
        +'Количество: '+g.qty+' шт\nДлина реза: '+fmt(g.perTotal,1)+' м\nВес: '+fmt(g.weightTotal,1)+' кг');
    }
  }
  if($('kShape')){
    ['kShape','fA','fB','fD','fDin','fDH','fNH','fS','fQty','fSheet'].forEach(function(id){
      var e=$(id); if(!e) return;
      e.addEventListener('input',calc); e.addEventListener('change',calc);
    });
    calc();
  }

  /* ---------- форма ---------- */
  var form=$('lead-form');
  if(form){
    form.addEventListener('submit',function(e){
      e.preventDefault();
      var g=function(id){var el=$(id);return el?el.value.trim():''};
      var name=g('lname'), phone=g('lphone'), what=g('lwhat'), msg=g('lmsg'), ok=$('lead-ok');
      if(!name||!phone){ if(ok){ok.textContent='Укажите имя и телефон'; ok.classList.add('on');} return; }
      var text='Заявка с сайта\nИмя: '+name+'\nТелефон: '+phone+'\nЗадача: '+what+(msg?'\nДетали: '+msg:'');
      if(ok){ ok.textContent='Открываем WhatsApp с готовым сообщением…'; ok.classList.add('on'); }
      window.open('https://wa.me/375336865609?text='+encodeURIComponent(text),'_blank');
    });
  }
})();
