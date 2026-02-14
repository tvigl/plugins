(function () {
    'use strict';

    /**
     * Плагин для Lampa: Меню Click
     * 
     * Особенности:
     * - Заменяет стандартное боковое меню на стильное меню Click
     * - Отображает часы, дату и день недели
     * - Адаптировано под управление пультом
     */

    function init() {
        var style = `
            /* Скрываем стандартное меню Lampa */
            .menu {
                display: none !important;
            }

            /* Контейнер нового меню Prisma */
            .prisma-menu {
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

            .prisma-menu--hidden {
                transform: translateX(-120%);
            }

            /* Подложка для закрытия */
            .prisma-menu-overlay {
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

            .prisma-menu-overlay--show {
                opacity: 1;
                visibility: visible;
            }

            /* Шапка меню: Лого и Часы */
            .prisma-menu__header {
                padding: 5px 10px 10px;
                display: flex;
                flex-direction: row;
                justify-content: space-between;
                align-items: center;
                border-bottom: 1px solid rgba(255,255,255,0.05);
            }

            .prisma-menu__logo {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 5px 0;
            }

            .prisma-menu__logo-icon {
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

            .prisma-menu__logo-text {
                font-size: 1.3em;
                font-weight: 800;
                letter-spacing: -0.5px;
                color: #fff;
                text-transform: none;
                text-shadow: 0 0 10px rgba(255,255,255,0.2);
            }

            .prisma-menu__header-right {
                text-align: right;
            }

            .prisma-menu__time {
                font-size: 1.5em;
                font-weight: 700;
                color: #fff;
                line-height: 1;
            }

            .prisma-menu__date-block {
                line-height: 1.1;
                margin-top: 2px;
            }

            .prisma-menu__date {
                font-size: 0.7em;
                color: rgba(255,255,255,0.5);
                font-weight: 400;
            }

            .prisma-menu__day {
                font-size: 0.8em;
                font-weight: 500;
                color: rgba(255,255,255,0.7);
            }

            /* Список элементов меню */
            .prisma-menu__list {
                padding: 10px 0;
                margin: 0;
                list-style: none;
                overflow-y: auto;
            }

            .prisma-menu__item {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 8px 12px;
                margin-bottom: 2px;
                border-radius: 12px;
                color: rgba(255,255,255,0.7);
                font-size: 1em;
                font-weight: 500;
                transition: all 0.2s ease;
                cursor: pointer;
            }

            .prisma-menu__item-icon {
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0.7;
            }

            .prisma-menu__item-icon svg {
                width: 18px;
                height: 18px;
                fill: currentColor;
            }

            /* Состояние фокуса и активного элемента */
            .prisma-menu__item.focus,
            .prisma-menu__item:hover {
                background: rgba(255, 255, 255, 0.08);
                color: #fff;
                box-shadow: inset 0 0 15px rgba(255, 255, 255, 0.03), 0 5px 15px rgba(0, 0, 0, 0.3);
            }

            .prisma-menu__item.focus .prisma-menu__item-icon,
            .prisma-menu__item:hover .prisma-menu__item-icon {
                opacity: 1;
                color: #2e9fff;
                filter: drop-shadow(0 0 8px rgba(46, 159, 255, 0.6));
            }

            .prisma-menu__item.active,
            .prisma-menu__item.focus-active {
                background: linear-gradient(90deg, #2e9fff 0%, #0072ff 100%);
                color: #fff;
                font-weight: 700;
                box-shadow: 0 4px 20px rgba(46, 159, 255, 0.4);
            }

            .prisma-menu__item.active .prisma-menu__item-icon,
            .prisma-menu__item.focus-active .prisma-menu__item-icon {
                opacity: 1;
                color: #fff;
                filter: drop-shadow(0 0 5px rgba(255, 255, 255, 0.5));
            }

            /* Футер меню */
            .prisma-menu__footer {
                padding: 5px 0 0;
                border-top: 1px solid rgba(255,255,255,0.05);
            }

            /* Стили для скроллбара */
            .prisma-menu__list::-webkit-scrollbar {
                width: 4px;
            }
            .prisma-menu__list::-webkit-scrollbar-track {
                background: transparent;
            }
            .prisma-menu__list::-webkit-scrollbar-thumb {
                background: rgba(255,255,255,0.1);
                border-radius: 10px;
            }

            /* Адаптивность для разных экранов */
            @media screen and (max-width: 768px) {
                .prisma-menu {
                    width: 260px;
                    left: 10px;
                    top: 10px;
                    padding: 8px;
                    border-radius: 18px;
                }
                .prisma-menu__logo-text {
                    font-size: 1em;
                }
                .prisma-menu__time {
                    font-size: 1.3em;
                }
                .prisma-menu__item {
                    padding: 6px 10px;
                    font-size: 0.9em;
                    gap: 10px;
                }
            }

            @media screen and (max-width: 480px) {
                .prisma-menu {
                    width: 240px;
                    left: 5px;
                    top: 5px;
                    padding: 6px;
                    border-radius: 15px;
                }
                .prisma-menu__time {
                    font-size: 1.2em;
                }
                .prisma-menu__item {
                    padding: 5px 8px;
                    gap: 8px;
                }
            }
        `;

        if (!document.getElementById('prisma-menu-styles')) {
            var styleEl = document.createElement('style');
            styleEl.id = 'prisma-menu-styles';
            styleEl.innerHTML = style;
            document.head.appendChild(styleEl);
        }

        // Построение пунктов меню динамически из штатного левого меню Lampa
        var observer = null;
        function buildMenuFromDOM() {
            var left = document.querySelector('.menu .menu__list');
            if (!left) return;
            while (listEl.firstChild) listEl.removeChild(listEl.firstChild);
            var items = left.querySelectorAll('.menu__item');
            items.forEach(function (orig) {
                var textEl = orig.querySelector('.menu__text');
                var icoEl = orig.querySelector('.menu__ico');
                var title = textEl ? (textEl.textContent || '').trim() : '';
                var li = document.createElement('li');
                li.className = 'prisma-menu__item selector';
                if (orig.classList.contains('active')) li.classList.add('active');
                li.innerHTML = '<div class="prisma-menu__item-icon">' + (icoEl ? icoEl.innerHTML : '') + '</div>' +
                               '<div class="prisma-menu__item-text">' + title + '</div>';
                li.addEventListener('click', function () {
                    $('.prisma-menu__item').removeClass('active');
                    li.classList.add('active');
                    toggleMenu(false);
                    $(orig).trigger('hover:enter');
                });
                li.addEventListener('hover:enter', function () {
                    $('.prisma-menu__item').removeClass('active');
                    li.classList.add('active');
                    toggleMenu(false);
                    $(orig).trigger('hover:enter');
                });
                li.addEventListener('hover:focus', function () {
                    Lampa.Controller.collectionSet(menuEl);
                });
                listEl.appendChild(li);
            });
        }
        function observeLeftMenu() {
            var left = document.querySelector('.menu .menu__list');
            if (!left) return;
            if (observer) observer.disconnect();
            observer = new MutationObserver(function () {
                buildMenuFromDOM();
            });
            observer.observe(left, { childList: true });
            buildMenuFromDOM();
        }

        var menuEl = document.createElement('div');
        menuEl.className = 'prisma-menu prisma-menu--hidden';

        var overlayEl = document.createElement('div');
        overlayEl.className = 'prisma-menu-overlay';
        overlayEl.addEventListener('click', function() {
            toggleMenu(false);
        });
        document.body.appendChild(overlayEl);
        
        var headerHTML = `
            <div class="prisma-menu__header">
                <div class="prisma-menu__logo">
                    <div class="prisma-menu__logo-icon">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="#fff">
                            <path d="M10.07 2.42L3.5 19.07l6.07-2.57 3.43 7.08 3.5-1.7-3.43-7.08 7.43-1.42L10.07 2.42z"/>
                        </svg>
                    </div>
                    <div class="prisma-menu__logo-text">Click</div>
                </div>
                <div class="prisma-menu__header-right">
                    <div class="prisma-menu__time" id="prisma-clock">00:00</div>
                    <div class="prisma-menu__date-block">
                        <div class="prisma-menu__date" id="prisma-date">01 Января 2024</div>
                        <div class="prisma-menu__day" id="prisma-day">Понедельник</div>
                    </div>
                </div>
            </div>
        `;

        var listEl = document.createElement('ul');
        listEl.className = 'prisma-menu__list';

        // Инициализируем пункты на основе штатного меню
        buildMenuFromDOM();

        menuEl.innerHTML = headerHTML;
        menuEl.appendChild(listEl);
        
        // Футер (Инфо)
        var footerEl = document.createElement('div');
        footerEl.className = 'prisma-menu__footer';
        var infoItem = document.createElement('div');
        infoItem.className = 'prisma-menu__item selector';
        infoItem.dataset.action = 'about';
        infoItem.innerHTML = `
            <div class="prisma-menu__item-icon"><svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg></div>
            <div class="prisma-menu__item-text">Инфо</div>
        `;
        infoItem.addEventListener('click', function() { executeAction('about'); });
        infoItem.addEventListener('hover:enter', function() { executeAction('about'); });
        footerEl.appendChild(infoItem);
        menuEl.appendChild(footerEl);

        document.body.appendChild(menuEl);
        // Наблюдаем за добавлением сторонних пунктов в левое меню и синхронизируемся
        if (window.appready) observeLeftMenu();
        else {
            Lampa.Listener.follow('app', function (e) {
                if (e.type === 'ready') observeLeftMenu();
            });
        }

        function executeAction(action) {
            console.log('Prisma Menu Action:', action);
            toggleMenu(false);
            if (action === 'about') {
                Lampa.Component.add('about', {});
                Lampa.Activity.push({ component: 'about', title: 'О приложении' });
            } else if (action === 'settings') {
                Lampa.Controller.enable('settings');
            }
        }

        function toggleMenu(show) {
            if (show) {
                menuEl.classList.remove('prisma-menu--hidden');
                overlayEl.classList.add('prisma-menu-overlay--show');
                Lampa.Controller.enable('prisma_menu');
            } else {
                menuEl.classList.add('prisma-menu--hidden');
                overlayEl.classList.remove('prisma-menu-overlay--show');
                // Возвращаем фокус на контент, если меню закрыто
                Lampa.Controller.enable('content');
            }
        }

        // Обновление времени и даты
        function updateClock() {
            var now = new Date();
            var hours = String(now.getHours()).padStart(2, '0');
            var minutes = String(now.getMinutes()).padStart(2, '0');
            
            var clockEl = document.getElementById('prisma-clock');
            if (clockEl) clockEl.textContent = hours + ':' + minutes;

            var days = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
            var months = ['Января', 'Февраля', 'Марта', 'Апреля', 'Мая', 'Июня', 'Июля', 'Августа', 'Сентября', 'Октября', 'Ноября', 'Декабря'];
            
            var dayEl = document.getElementById('prisma-day');
            if (dayEl) dayEl.textContent = days[now.getDay()];

            var dateEl = document.getElementById('prisma-date');
            if (dateEl) dateEl.textContent = now.getDate() + ' ' + months[now.getMonth()] + ' ' + now.getFullYear();
        }

        setInterval(updateClock, 1000);
        updateClock();

        // Перехват открытия стандартного меню
        function replaceMenuController() {
            Lampa.Controller.add('prisma_menu', {
                toggle: function () {
                    Lampa.Controller.collectionSet(menuEl);
                    Lampa.Controller.enable('prisma_menu');
                },
                up: function () {
                    Lampa.Select.prev();
                },
                down: function () {
                    Lampa.Select.next();
                },
                right: function () {
                    toggleMenu(false);
                },
                back: function () {
                    toggleMenu(false);
                }
            });

            // Слушаем события Lampa для открытия меню
            Lampa.Listener.follow('app', function (e) {
                if (e.type === 'ready') {
                    // Переопределяем метод показа меню в стандартном контроллере
                    var old_menu_toggle = Lampa.Controller.toggle;
                    Lampa.Controller.toggle = function(name) {
                        if (name === 'menu') {
                            toggleMenu(true);
                        } else {
                            old_menu_toggle.apply(Lampa.Controller, arguments);
                        }
                    };
                }
            });

            // Глобальный перехват кнопки BACK
            Lampa.Listener.follow('key', function (e) {
                if (e.code === 8 || e.code === 27 || e.code === 461 || e.code === 10009) { // Backspace, Escape, WebOS Back, Tizen Back
                    if (!menuEl.classList.contains('prisma-menu--hidden')) {
                        toggleMenu(false);
                        e.event.preventDefault();
                        e.event.stopPropagation();
                    }
                }
            });

            // Также ловим нажатие "Влево" на главной, если фокус на первом элементе
            $(document).on('keydown', function(e) {
                if (e.keyCode === 37 && !menuEl.classList.contains('prisma-menu--hidden')) {
                    // Меню уже открыто, ничего не делаем
                } else if (e.keyCode === 37 && Lampa.Controller.enabled().name === 'content') {
                    // Если мы на самом левом краю контента и жмем влево
                    // (это поведение обычно зашито в Lampa, но мы подстрахуемся)
                }
            });
        }

        replaceMenuController();
    }

    if (window.Lampa) {
        init();
    } else {
        document.addEventListener('lampa_ready', init);
    }

})();
