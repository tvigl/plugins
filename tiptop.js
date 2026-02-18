;(function () {
    'use strict';
    function run() {
        var css = "\n            .menu{display:none!important}\n            .side-menu{position:fixed;left:20px;top:20px;width:300px;background:rgba(18,18,18,.85);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);display:flex;flex-direction:column;z-index:1000;box-shadow:0 10px 50px rgba(0,0,0,.8);transition:transform .4s cubic-bezier(.165,.84,.44,1);overflow:hidden;padding:10px;box-sizing:border-box;border-radius:24px;border:1px solid rgba(255,255,255,.08);max-height:calc(100vh - 40px)}\n            .side-menu--hidden{transform:translateX(-120%)}\n            .side-menu__overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:999;opacity:0;visibility:hidden;transition:all .4s ease}\n            .side-menu__overlay--show{opacity:1;visibility:visible}\n            .side-menu__header{padding:5px 10px 10px;display:flex;flex-direction:row;justify-content:space-between;align-items:center;border-bottom:1px solid rgba(255,255,255,.05)}\n            .side-menu__logo{display:flex;align-items:center;gap:12px;padding:5px 0}\n            .side-menu__logo-ico{width:28px;height:28px;background:linear-gradient(135deg,#ff00cc 0%,#3333ff 100%);border-radius:8px;display:flex;align-items:center;justify-content:center;box-shadow:0 0 15px rgba(255,0,204,.4);transform:rotate(-10deg)}\n            .side-menu__logo-text{font-size:1.3em;font-weight:800;letter-spacing:-.5px;color:#fff;text-shadow:0 0 10px rgba(255,255,255,.2)}\n            .side-menu__header-right{text-align:right}\n            .side-menu__time{font-size:1.5em;font-weight:700;color:#fff;line-height:1}\n            .side-menu__date-block{line-height:1.1;margin-top:2px}\n            .side-menu__date{font-size:.7em;color:rgba(255,255,255,.5);font-weight:400}\n            .side-menu__day{font-size:.8em;font-weight:500;color:rgba(255,255,255,.7)}\n            .side-menu__list{padding:10px 0;margin:0;list-style:none;overflow-y:auto}\n            .side-menu__item{display:flex;align-items:center;gap:12px;padding:8px 12px;margin-bottom:2px;border-radius:12px;color:rgba(255,255,255,.7);font-size:1em;font-weight:500;transition:all .2s ease;cursor:pointer}\n            .side-menu__item-icon{width:20px;height:20px;display:flex;align-items:center;justify-content:center;opacity:.7}\n            .side-menu__item-icon svg{width:18px;height:18px;fill:currentColor}\n            .side-menu__item:hover,.side-menu__item.focus{background:rgba(255,255,255,.08);color:#fff;box-shadow:inset 0 0 15px rgba(255,255,255,.03),0 5px 15px rgba(0,0,0,.3)}\n            .side-menu__item:hover .side-menu__item-icon,.side-menu__item.focus .side-menu__item-icon{opacity:1;color:#2e9fff;filter:drop-shadow(0 0 8px rgba(46,159,255,.6))}\n            .side-menu__item.active,.side-menu__item.focus-active{background:linear-gradient(90deg,#2e9fff 0%,#0072ff 100%);color:#fff;font-weight:700;box-shadow:0 4px 20px rgba(46,159,255,.4)}\n            .side-menu__item.active .side-menu__item-icon,.side-menu__item.focus-active .side-menu__item-icon{opacity:1;color:#fff;filter:drop-shadow(0 0 5px rgba(255,255,255,.5))}\n            .side-menu__list::-webkit-scrollbar{width:4px}\n            .side-menu__list::-webkit-scrollbar-track{background:transparent}\n            .side-menu__list::-webkit-scrollbar-thumb{background:rgba(255,255,255,.1);border-radius:10px}\n            @media screen and (max-width:768px){.side-menu{width:260px;left:10px;top:10px;padding:8px;border-radius:18px}.side-menu__logo-text{font-size:1em}.side-menu__time{font-size:1.3em}.side-menu__item{padding:6px 10px;font-size:.9em;gap:10px}}\n            @media screen and (max-width:480px){.side-menu{width:240px;left:5px;top:5px;padding:6px;border-radius:15px}.side-menu__time{font-size:1.2em}.side-menu__item{padding:5px 8px;gap:8px}}\n        ";
        var css2 = `
            .menu {
                display: none !important;
            }

            .side-menu {
                position: fixed;
                left: 20px;
                top: 20px;
                width: 300px;
                background: rgba(18, 18, 18, 0.85);
                backdrop-filter: blur(20px);
                -webkit-backdrop-filter: blur(20px);
                display: flex;
                flex-direction: column;
                z-index: 1000;
                box-shadow: 0 10px 50px rgba(0,0,0,0.8);
                transition: transform 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
                overflow: hidden;
                padding: 10px;
                box-sizing: border-box;
                border-radius: 24px;
                border: 1px solid rgba(255,255,255,0.08);
                height: auto;
                max-height: calc(100vh - 40px);
            }

            .side-menu--hidden {
                transform: translateX(-120%);
            }

            .side-menu__overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.5);
                z-index: 999;
                opacity: 0;
                visibility: hidden;
                transition: all 0.4s ease;
            }

            .side-menu__overlay--show {
                opacity: 1;
                visibility: visible;
            }

            .side-menu__header {
                padding: 5px 10px 10px;
                display: flex;
                flex-direction: row;
                justify-content: space-between;
                align-items: center;
                border-bottom: 1px solid rgba(255,255,255,0.05);
            }

            .side-menu__logo {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 5px 0;
            }

            .side-menu__logo-ico {
                width: 28px;
                height: 28px;
                background: linear-gradient(135deg, #ff00cc 0%, #3333ff 100%);
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 0 15px rgba(255, 0, 204, 0.4);
                transform: rotate(-10deg);
            }

            .side-menu__logo-text {
                font-size: 1.3em;
                font-weight: 800;
                letter-spacing: -0.5px;
                color: #fff;
                text-shadow: 0 0 10px rgba(255,255,255,0.2);
            }

            .side-menu__header-right {
                text-align: right;
            }

            .side-menu__time {
                font-size: 1.5em;
                font-weight: 700;
                color: #fff;
                line-height: 1;
            }

            .side-menu__date-block {
                line-height: 1.1;
                margin-top: 2px;
            }

            .side-menu__date {
                font-size: 0.7em;
                color: rgba(255,255,255,0.5);
                font-weight: 400;
            }

            .side-menu__day {
                font-size: 0.8em;
                font-weight: 500;
                color: rgba(255,255,255,0.7);
            }

            .side-menu__list {
                padding: 10px 0;
                margin: 0;
                list-style: none;
                overflow-y: auto;
                flex: 1;
                min-height: 0;
            }

            .side-menu__item {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 9px 13px;
                margin-bottom: 2px;
                border-radius: 12px;
                color: rgba(255,255,255,0.7);
                font-size: 1.1em;
                font-weight: 500;
                transition: all 0.2s ease;
                cursor: pointer;
            }

            .side-menu__item-icon {
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0.7;
            }

            .side-menu__item-icon svg {
                width: 18px;
                height: 18px;
                fill: currentColor;
            }

            .side-menu__item.focus,
            .side-menu__item:hover {
                background: rgba(255, 255, 255, 0.08);
                color: #fff;
                box-shadow: inset 0 0 15px rgba(255, 255, 255, 0.03), 0 5px 15px rgba(0, 0, 0, 0.3);
            }

            .side-menu__item.focus .side-menu__item-icon,
            .side-menu__item:hover .side-menu__item-icon {
                opacity: 1;
                color: #2e9fff;
                filter: drop-shadow(0 0 8px rgba(46, 159, 255, 0.6));
            }

            .side-menu__item.active,
            .side-menu__item.focus-active {
                background: linear-gradient(90deg, #2e9fff 0%, #0072ff 100%);
                color: #fff;
                font-weight: 700;
                box-shadow: 0 4px 20px rgba(46, 159, 255, 0.4);
            }

            .side-menu__item.active .side-menu__item-icon,
            .side-menu__item.focus-active .side-menu__item-icon {
                opacity: 1;
                color: #fff;
                filter: drop-shadow(0 0 5px rgba(255, 255, 255, 0.5));
            }

            .side-menu__footer {
                padding: 5px 0 0;
                border-top: 1px solid rgba(255,255,255,0.05);
            }

            .side-menu__list::-webkit-scrollbar {
                width: 4px;
            }

            .side-menu__list::-webkit-scrollbar-track {
                background: transparent;
            }

            .side-menu__list::-webkit-scrollbar-thumb {
                background: rgba(255,255,255,0.1);
                border-radius: 10px;
            }

            @media screen and (max-width: 768px) {
                .side-menu {
                    width: 260px;
                    left: 10px;
                    top: 10px;
                    padding: 8px;
                    border-radius: 18px;
                    max-height: 70vh;
                }
                .side-menu__logo-text {
                    font-size: 1.05em;
                }
                .side-menu__time {
                    font-size: 1.4em;
                }
                .side-menu__item {
                    padding: 9px 13px;
                    font-size: 1.15em;
                    gap: 11px;
                }
            }

            @media screen and (max-width: 480px) {
                .side-menu {
                    width: 240px;
                    left: 5px;
                    top: 5px;
                    padding: 6px;
                    border-radius: 15px;
                    max-height: 60vh;
                }
                .side-menu__time {
                    font-size: 1.4em;
                }
                .side-menu__item {
                    padding: 9px 13px;
                    font-size: 1.2em;
                    gap: 11px;
                }
            }
        `;
        if (!document.getElementById('side-menu-styles')) {
            var s = document.createElement('style');
            s.id = 'side-menu-styles';
            s.innerHTML = css2;
            document.head.appendChild(s);
        }
        var overlay = document.createElement('div');
        overlay.className = 'side-menu__overlay';
        overlay.addEventListener('click', function () {
            toggle(false);
        });
        document.body.appendChild(overlay);
        var root = document.createElement('div');
        root.className = 'side-menu side-menu--hidden';
        var header = document.createElement('div');
        header.className = 'side-menu__header';
        header.innerHTML = '' +
            '<div class="side-menu__logo">' +
            '<div class="side-menu__logo-ico"><svg viewBox="0 0 24 24" width="16" height="16" fill="#fff"><path d="M10.07 2.42L3.5 19.07l6.07-2.57 3.43 7.08 3.5-1.7-3.43-7.08 7.43-1.42L10.07 2.42z"/></svg></div>' +
            '<div class="side-menu__logo-text">Click</div>' +
            '</div>' +
            '<div class="side-menu__header-right">' +
            '<div class="side-menu__time" id="overlay-clock">00:00</div>' +
            '<div class="side-menu__date-block">' +
            '<div class="side-menu__date" id="overlay-date">01 Января 2024</div>' +
            '<div class="side-menu__day" id="overlay-day">Понедельник</div>' +
            '</div>' +
            '</div>';
        var list = document.createElement('ul');
        list.className = 'side-menu__list';
        root.appendChild(header);
        root.appendChild(list);
        document.body.appendChild(root);
        var observer = null;
        var mirror = new Map();
        var poll = null;
        function build() {
            var lists = Array.from(document.querySelectorAll('.menu .menu__list'));
            if (!lists.length) return;
            while (list.firstChild) list.removeChild(list.firstChild);
            mirror.clear();
            var items = [];
            lists.forEach(function (l) { items = items.concat(Array.from(l.querySelectorAll('.menu__item'))); });
            items.forEach(function (orig) {
                var t = orig.querySelector('.menu__text');
                var i = orig.querySelector('.menu__ico');
                var title = t ? (t.textContent || '').trim() : '';
                var li = document.createElement('li');
                li.className = 'side-menu__item selector';
                if (orig.classList.contains('active')) li.classList.add('active');
                if (orig.classList.contains('hide') || orig.classList.contains('disabled')) li.classList.add('disabled');
                li.innerHTML = '<div class="side-menu__item-icon">' + (i ? i.innerHTML : '') + '</div><div class="side-menu__item-text">' + title + '</div>';
                li.addEventListener('click', function () {
                    if (li.classList.contains('disabled')) return;
                    $('.side-menu__item').removeClass('active');
                    li.classList.add('active');
                    toggle(false);
                    $(orig).trigger('hover:enter');
                });
                li.addEventListener('hover:enter', function () {
                    if (li.classList.contains('disabled')) return;
                    $('.side-menu__item').removeClass('active');
                    li.classList.add('active');
                    toggle(false);
                    $(orig).trigger('hover:enter');
                });
                li.addEventListener('hover:focus', function () {
                    Lampa.Controller.collectionSet(root);
                });
                list.appendChild(li);
                mirror.set(orig, li);
            });
        }
        function syncActive() {
            mirror.forEach(function (li, orig) {
                li.classList.toggle('active', orig.classList.contains('active'));
            });
        }
        function observe() {
            var left = document.querySelector('.menu .menu__list');
            if (!left) return;
            if (observer) observer.disconnect();
            observer = new MutationObserver(function (m) {
                var rb = false, sa = false;
                m.forEach(function (x) {
                    if (x.type === 'childList') rb = true;
                    if (x.type === 'attributes') sa = true;
                });
                if (rb) build();
                else if (sa) syncActive();
            });
            observer.observe(left, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
            build();
            if (poll) clearInterval(poll);
            poll = setInterval(build, 1000);
        }
        function toggle(show) {
            if (show) {
                root.classList.remove('side-menu--hidden');
                overlay.classList.add('side-menu__overlay--show');
                Lampa.Controller.enable('custom_menu_overlay');
            } else {
                root.classList.add('side-menu--hidden');
                overlay.classList.remove('side-menu__overlay--show');
                Lampa.Controller.enable('content');
            }
        }
        function clock() {
            var now = new Date();
            var h = String(now.getHours()).padStart(2, '0');
            var m = String(now.getMinutes()).padStart(2, '0');
            var d = ['Воскресенье','Понедельник','Вторник','Среда','Четверг','Пятница','Суббота'];
            var mo = ['Января','Февраля','Марта','Апреля','Мая','Июня','Июля','Августа','Сентября','Октября','Ноября','Декабря'];
            var ce = document.getElementById('overlay-clock');
            var de = document.getElementById('overlay-date');
            var dy = document.getElementById('overlay-day');
            if (ce) ce.textContent = h + ':' + m;
            if (de) de.textContent = now.getDate() + ' ' + mo[now.getMonth()] + ' ' + now.getFullYear();
            if (dy) dy.textContent = d[now.getDay()];
        }
        setInterval(clock, 1000);
        clock();
        Lampa.Controller.add('custom_menu_overlay', {
            toggle: function () {
                Lampa.Controller.collectionSet(root);
                Lampa.Controller.enable('custom_menu_overlay');
            },
            up: function () { Lampa.Select.prev(); },
            down: function () { Lampa.Select.next(); },
            right: function () { toggle(false); },
            back: function () { toggle(false); }
        });
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') {
                var baseToggle = Lampa.Controller.toggle;
                Lampa.Controller.toggle = function (name) {
                    if (name === 'menu') toggle(true);
                    else baseToggle.apply(Lampa.Controller, arguments);
                };
                observe();
            }
        });
        if (window.appready) observe();
    }
    (function init() {
        if (window.Lampa && Lampa.Listener) run();
        else {
            var t = setInterval(function () {
                if (window.Lampa && Lampa.Listener) {
                    clearInterval(t);
                    run();
                }
            }, 200);
        }
    })();
})(); 
