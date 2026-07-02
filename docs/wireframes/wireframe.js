// 純原生 JS — 共用主選單 header、視窗寬度切換、區塊標註開關、狀態切換。
(function () {
  function $(s, r) { return (r || document).querySelector(s); }

  // ── 共用主選單 header（依 src/components/portal/protailHeader.vue 的選單）──
  var NAV = [
    { key: 'home',   label: '首頁',     href: 'home.html' },
    { key: 'venues', label: '場館資訊', href: 'venue-list.html' },
    { key: 'news',   label: '最新消息', href: 'news-list.html' },
    { key: 'faq',    label: '常見問題', href: 'faq.html' }
  ];
  var MEMBER = [
    { key: 'member-profile',  label: '我的帳戶', href: 'my-profile.html' },
    { key: 'member-bookings', label: '我的預訂', href: 'my-bookings.html' },
    { key: 'member-refunds',  label: '我的退款', href: 'my-refunds.html' }
  ];

  function li(item, active) {
    var on = item.key === active;
    var cls = on ? 'class="menu-active font-bold bg-primary text-primary-content"' : '';
    return '<li><a href="' + item.href + '" ' + cls + '>' + item.label + '</a></li>';
  }

  function buildHeader(el) {
    var active = el.getAttribute('data-active') || '';
    var sub = el.getAttribute('data-sub') || '';
    var navList = NAV.map(function (i) { return li(i, active); }).join('');
    var memberList = MEMBER.map(function (i) { return li(i, active); }).join('');

    el.innerHTML =
      '<div class="navbar bg-base-100 border-b px-2 sm:px-4 min-h-0 py-1 shadow-sm">' +
        '<div class="navbar-start">' +
          '<div class="dropdown lg:hidden">' +
            '<div tabindex="0" role="button" class="btn btn-ghost btn-sm px-2">☰</div>' +
            '<ul tabindex="0" class="menu dropdown-content mt-2 z-50 p-2 shadow bg-base-100 rounded-box w-52">' +
              navList +
              '<li class="menu-title">會員中心</li>' + memberList +
              '<li><a href="login.html">登入</a></li>' +
            '</ul>' +
          '</div>' +
          '<a class="btn btn-ghost gap-2 text-base font-bold" href="index.html">🏛️ 苗栗縣場地租借</a>' +
        '</div>' +
        '<div class="navbar-center hidden lg:flex"><ul class="menu menu-horizontal gap-1 px-1">' + navList + '</ul></div>' +
        '<div class="navbar-end gap-1">' +
          '<div class="dropdown dropdown-end hidden lg:block">' +
            '<div tabindex="0" role="button" class="btn btn-ghost btn-sm gap-1">會員中心 ▾</div>' +
            '<ul tabindex="0" class="menu dropdown-content mt-2 z-50 p-2 shadow bg-base-100 rounded-box w-44">' + memberList + '</ul>' +
          '</div>' +
          '<a class="btn btn-primary btn-sm" href="login.html">登入</a>' +
        '</div>' +
      '</div>' +
      (sub ? '<div class="text-xs px-4 py-1 border-b bg-base-200 text-base-content/60 breadcrumbs"><ul>' +
              sub.split('/').map(function (s) { return '<li>' + s.trim() + '</li>'; }).join('') + '</ul></div>' : '');
  }

  document.querySelectorAll('#wf-header, [data-wf-header]').forEach(buildHeader);

  // 視窗寬度（測 RWD）
  var vw = $('[data-wf-viewport]');
  if (vw) vw.addEventListener('change', function () {
    document.querySelectorAll('.wf-canvas').forEach(function (c) { c.style.maxWidth = vw.value; });
  });

  // 區塊標註開關
  var an = $('[data-wf-annotate]');
  if (an) an.addEventListener('change', function () {
    document.body.classList.toggle('wf-annotate', an.checked);
  });

  // 狀態切換（頁面有 #wf-states 設定才啟用）
  var cfgEl = $('#wf-states'), sel = $('#wf-state');
  if (!cfgEl || !sel) return;

  var cfg = JSON.parse(cfgEl.textContent);
  Object.keys(cfg.states).forEach(function (k) {
    var o = document.createElement('option');
    o.value = k; o.textContent = cfg.states[k].label; sel.appendChild(o);
  });

  function apply(k) {
    var s = cfg.states[k];
    document.body.setAttribute('data-state', k);

    var box = $('[data-bind="bannerbox"]');
    if (box && s.cls) box.className = 'alert ' + s.cls;

    var b = $('[data-bind="banner"]'); if (b) b.textContent = s.banner || '';
    var m = $('[data-bind="meta"]'); if (m) m.textContent = s.meta || '';

    var c = $('[data-bind="cta"]');
    if (c) { if (s.cta) { c.textContent = s.cta; c.style.display = ''; } else { c.style.display = 'none'; } }

    document.querySelectorAll('[data-states]').forEach(function (el) {
      var list = el.getAttribute('data-states').split(',').map(function (x) { return x.trim(); });
      el.style.display = list.indexOf(k) >= 0 ? '' : 'none';
    });
  }

  sel.addEventListener('change', function () { apply(sel.value); });
  apply(cfg.default);
})();
