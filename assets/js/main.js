
let __scrollY = 0;
function lockBodyScroll(){
  __scrollY = window.scrollY || window.pageYOffset || 0;
  document.body.style.position = 'fixed';
  document.body.style.top = `-${__scrollY}px`;
  document.body.style.width = '100%';
}
function unlockBodyScroll(){
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.width = '';
  window.scrollTo({top: __scrollY, left:0, behavior:'instant'});
}

// Smooth fade-in
const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) e.target.classList.add('in');
  });
},{ threshold:.2 });
document.querySelectorAll('.fade').forEach(el => io.observe(el));

// Mobile nav toggle + aria
const toggle = document.getElementById('mnavToggle');
const panel = document.getElementById('mnavPanel');
if (toggle && panel){
  toggle.addEventListener('click', ()=>{
    const open = panel.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open ? 'true':'false');

  // lock body scroll when menu is open
  document.body.classList.toggle('menu-open', open);

  });
}

// Glass effect on scroll
const nav = document.querySelector('.nav');
window.addEventListener('scroll', ()=>{
  if (window.scrollY > 10) nav.classList.add('scrolled');
  else nav.classList.remove('scrolled');
});

// WhatsApp helpers
function buildWaLink(text){
  const num = (window.WHATSAPP_NUMBER || '').replace(/\D/g,'');
  if (!num){ return null; }
  return `https://wa.me/${num}?text=${encodeURIComponent(text)}`;
}

function applyWa(selector, message){
  document.querySelectorAll(selector).forEach(a=>{
    const link = buildWaLink(message);
    if (link){ a.href = link; } else { a.removeAttribute('target'); a.href = '#contact'; }
  });
}

// Apply to CTAs
applyWa('#cta-reservar', 'Hola! Quisiera reservar en Hotel Madrid.');
applyWa('.wa', 'Hola! Me interesa esta habitación.');
applyWa('#wa-contact, #footer-wa', 'Hola! Quisiera hacer una consulta.');


// ===== Parallax on scroll (like Webflow interactions) =====
const prefersNoMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function parallaxTick(){
  if (prefersNoMotion) return;
  document.querySelectorAll('[data-parallax] .showcase-image img').forEach(img=>{
    const r = img.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const progress = Math.min(1, Math.max(0, 1 - (r.top + r.height*0.5)/vh)); // 0..1
    const y = (progress*14 - 7).toFixed(2); // -7% .. +7%
    img.style.setProperty('--y', y+'%');
  });
  requestAnimationFrame(parallaxTick);
}
requestAnimationFrame(parallaxTick);

// Staggered fade-in
document.querySelectorAll('.showcase-item').forEach((item,i)=>{
  item.style.transitionDelay = `${i*90}ms`;
});


// ===== Showcase preview switch
const previewImg = document.getElementById('preview-img');
function setPreview(src){
  if (!previewImg || !src) return;
  previewImg.style.opacity = 0.6;
  previewImg.addEventListener('transitionend', ()=>previewImg.style.opacity=1, {once:true});
  previewImg.src = src;
}
document.querySelectorAll('.showcase-item').forEach(item=>{
  const src = item.getAttribute('data-preview');
  item.addEventListener('mouseenter', ()=> setPreview(src));
  // also on focus for accessibility
  item.addEventListener('focusin', ()=> setPreview(src));
  // if item enters viewport, update preview (mimics Webflow interactions)
  const obs = new IntersectionObserver(es=> es.forEach(e=>{ if(e.isIntersecting) setPreview(src)}), {threshold:.6});
  obs.observe(item);
});

// Parallax also applies to preview image
function parallaxTick2(){
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.querySelectorAll('[data-parallax] img').forEach(img=>{
    const r = img.getBoundingClientRect();
    const vh = window.innerHeight;
    const progress = Math.min(1, Math.max(0, 1 - (r.top + r.height*0.5)/vh));
    const y = (progress*14 - 7).toFixed(2);
    img.style.setProperty('--y', y+'%');
  });
  requestAnimationFrame(parallaxTick2);
}
requestAnimationFrame(parallaxTick2);


// ===== Refined parallax: apply only to preview image
(function(){
  const frame = document.querySelector('.preview-frame img');
  if(!frame) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function tick(){
    if(reduce) return;
    const r = frame.getBoundingClientRect();
    const vh = window.innerHeight;
    const progress = Math.min(1, Math.max(0, 1 - (r.top + r.height*0.5)/vh));
    const y = (progress*14 - 7).toFixed(2);
    frame.style.setProperty('--y', y+'%');
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();


// ===== Active item sync (single text overlay like original) =====
(function(){
  const items = Array.from(document.querySelectorAll('.showcase-item'));
  const previewImg = document.getElementById('preview-img');
  const l1 = document.getElementById('preview-line-1');
  const l2 = document.getElementById('preview-line-2');
  if(!items.length || !previewImg || !l1 || !l2) return;

  function titleFromItem(item){
    const t1 = item.querySelector('.showcase-content .heading.italic')?.textContent?.trim() || '';
    const t2 = item.querySelector('.showcase-content .heading:not(.italic)')?.textContent?.trim() || '';
    return [t1, t2];
  }

  function setActive(idx){
    items.forEach((el,i)=> el.classList.toggle('active', i===idx));
    const it = items[idx];
    const src = it.getAttribute('data-preview');
    const [t1, t2] = titleFromItem(it);
    if (src){
      previewImg.style.transition = 'opacity .28s ease';
      previewImg.style.opacity = .85;
      previewImg.addEventListener('transitionend', ()=>{ previewImg.style.opacity = 1; }, {once:true});
      previewImg.src = src;
    }
    if (t1 || t2){
      l1.textContent = t1;
      l2.textContent = t2;
    }
  }

  function computeActive(){
    // choose item whose middle is closest to viewport center
    const center = window.innerHeight * 0.5;
    let best = 0, bestDist = Infinity;
    items.forEach((el,i)=>{
      const r = el.getBoundingClientRect();
      const mid = r.top + r.height/2;
      const d = Math.abs(mid - center);
      if (d < bestDist){ bestDist = d; best = i; }
    });
    setActive(best);
  }

  ['scroll','resize'].forEach(ev=> window.addEventListener(ev, computeActive, {passive:true}));
  // also on initial load and after images
  window.addEventListener('load', computeActive);
  computeActive();
})();


// ===== Rooms: scroll-synced image + text (desktop)
(function(){
  const photo = document.getElementById('rooms-photo');
  const blocks = Array.from(document.querySelectorAll('.room-block'));
  if(!photo || !blocks.length) return;

  function setActiveBlock(idx){
    blocks.forEach((b,i)=> b.classList.toggle('active', i===idx));
    const b = blocks[idx];
    const src = b.getAttribute('data-photo');
    if (src && !photo.src.includes(src)){
      photo.style.opacity = .85;
      photo.addEventListener('transitionend', ()=>{ photo.style.opacity = 1; }, {once:true});
      photo.src = src;
    }
  }

  const obs = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if(!e.isIntersecting) return;
      const idx = blocks.indexOf(e.target);
      setActiveBlock(idx);
    });
  }, {threshold:0.55});
  blocks.forEach(b=> obs.observe(b));

  setActiveBlock(0);

  // Parallax on the photo (desktop)
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function tick(){
    if (reduce) return;
    const r = photo.getBoundingClientRect();
    const vh = window.innerHeight;
    const progress = Math.min(1, Math.max(0, 1 - (r.top + r.height*0.5)/vh));
    const y = (progress*12 - 6).toFixed(2);
    photo.style.setProperty('--y', y+'%');
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();


// ===== Availability form -> WhatsApp message (fallback to contact)
(function(){
  const form = document.getElementById('availability-form');
  if(!form) return;
  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    const ci = (document.getElementById('checkin')||{}).value;
    const co = (document.getElementById('checkout')||{}).value;
    const g  = (document.getElementById('guests')||{}).value;
    const msg = `Hola! Quisiera consultar disponibilidad.\nCheck-in: ${ci}\nCheck-out: ${co}\nHuéspedes: ${g}`;
    const link = (typeof buildWaLink === 'function') ? buildWaLink(msg) : null;
    if (link){ window.open(link, '_blank'); }
    else { window.location.hash = '#contact'; }
  });
})();


// Disable rooms scroll-sync on small screens
(function(){
  const mq = window.matchMedia('(min-width: 901px)');
  if(!mq.matches){
    // remove active classes and stop observing if any (defensive)
    document.querySelectorAll('.room-block').forEach(b=> b.classList.add('active'));
    return;
  }
  // nothing else; the main scroll-sync block above already runs
})();


// Close mobile menu when a nav link is clicked
document.querySelectorAll('#mnavPanel a').forEach(a=>{
  a.addEventListener('click', ()=>{
    const panel = document.getElementById('mnavPanel');
    const toggle = document.getElementById('mnavToggle');
    if(panel && panel.classList.contains('open')){
      panel.classList.remove('open');
      toggle && toggle.setAttribute('aria-expanded','false');
      unlockBodyScroll();
    }
  });
});


window.addEventListener('resize', ()=>{
  const panel = document.getElementById('mnavPanel');
  const toggle = document.getElementById('mnavToggle');
  if(panel && panel.classList.contains('open') && window.matchMedia('(min-width:901px)').matches){
    panel.classList.remove('open');
    toggle && toggle.setAttribute('aria-expanded','false');
    unlockBodyScroll();
  }
});


// ===== Fixed nav helpers
(function(){
  const nav = document.querySelector('.nav');
  function setNavHeightVar(){
    if (!nav) return;
    const h = nav.getBoundingClientRect().height;
    document.documentElement.style.setProperty('--nav-h', h + 'px');
  }
  setNavHeightVar();
  window.addEventListener('resize', setNavHeightVar);
})();


// ===== Close hamburger on link click + smooth anchor scroll with offset (robust mobile)
(function(){
  const panel = document.getElementById('mnavPanel');
  const toggle = document.getElementById('mnavToggle');

  function isOpen(){ return panel && panel.classList.contains('open'); }

  function closeMenu(){
    if (panel && panel.classList.contains('open')){
      panel.classList.remove('open');
      toggle && toggle.setAttribute('aria-expanded','false');
      try{ unlockBodyScroll(); }catch(e){
        document.body.style.position=''; document.body.style.top=''; document.body.style.width='';
      }
    }
  }

  function scrollToAnchor(hash){
    const target = document.querySelector(hash);
    const navH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 72;
    if(!target){ location.hash = hash; return; }
    // Wait for reflow after closing menu to get correct positions
    requestAnimationFrame(()=>{
      requestAnimationFrame(()=>{
        const y = target.getBoundingClientRect().top + window.scrollY - navH - 8;
        window.scrollTo({ top: y, behavior: 'smooth' });
      });
    });
  }

  function onNavClick(ev){
    const a = ev.currentTarget;
    const href = a.getAttribute('href') || '';
    if(!href) return;
    if(href.startsWith('#')){
      ev.preventDefault();
      const wasOpen = isOpen();
      closeMenu();
      if (wasOpen){
        // Delay to ensure unlockBodyScroll applied
        setTimeout(()=> scrollToAnchor(href), 10);
      } else {
        scrollToAnchor(href);
      }
    } else {
      // External – just ensure menu is closed
      closeMenu();
    }
  }

  document.querySelectorAll('.nav a, #mnavPanel a').forEach(a=>{
    a.removeEventListener('click', onNavClick);
    a.addEventListener('click', onNavClick);
  });
})();


// ===== Nav scroll detector: add .scrolled after hero
(function(){
  const nav = document.querySelector('.nav');
  if(!nav) return;
  const hero = document.getElementById('hero') || document.querySelector('.hero');
  function onScroll(){
    const threshold = hero ? (hero.getBoundingClientRect().bottom) : (window.innerHeight * 0.12);
    if (threshold <= (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 72)) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  }
  window.addEventListener('scroll', onScroll, {passive:true});
  window.addEventListener('resize', onScroll);
  window.addEventListener('load', onScroll);
  onScroll();
})();


// ===== Stable hamburger toggle (dedupe listeners by cloning the node)
(function(){
  const oldToggle = document.getElementById('mnavToggle');
  const panel = document.getElementById('mnavPanel');
  if(!oldToggle || !panel) return;

  // Replace toggle with a fresh clone to remove any prior listeners
  const toggle = oldToggle.cloneNode(true);
  oldToggle.parentNode.replaceChild(toggle, oldToggle);

  function openMenu(){
    panel.classList.add('open');
    toggle.setAttribute('aria-expanded','true');
    try{ lockBodyScroll(); }catch(e){ document.body.style.position='fixed'; }
  }
  function closeMenu(){
    panel.classList.remove('open');
    toggle.setAttribute('aria-expanded','false');
    try{ unlockBodyScroll(); }catch(e){
      document.body.style.position=''; document.body.style.top=''; document.body.style.width='';
    }
  }

  toggle.addEventListener('click', (e)=>{
    e.preventDefault();
    if(panel.classList.contains('open')) closeMenu();
    else openMenu();
  });

  // Close on ESC key
  document.addEventListener('keydown', (ev)=>{
    if(ev.key === 'Escape' && panel.classList.contains('open')) closeMenu();
  });

  // Close when clicking any nav link
  document.querySelectorAll('#mnavPanel a').forEach(a=>{
    a.addEventListener('click', ()=> closeMenu());
  });

  // Auto-close when switching to desktop
  const mq = window.matchMedia('(min-width:901px)');
  mq.addEventListener('change', e=>{ if(e.matches) closeMenu(); });
})();
