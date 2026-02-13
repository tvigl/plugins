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

        // Иконки для стандартных пунктов Lampa
        var iconMap = {
            'main': '<svg viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>',
            'full': '<svg viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>',
            'movie': '<svg viewBox="0 0 24 24"><path d="M18 3v2h-2V3H8v2H6V3H4v18h2v-2h2v2h8v-2h2v2h2V3h-2zM8 17H6v-2h2v2zm0-4H6v-2h2v2zm0-4H6V7h2v2zm10 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2z"/></svg>',
            'movies': '<svg viewBox="0 0 24 24"><path d="M18 3v2h-2V3H8v2H6V3H4v18h2v-2h2v2h8v-2h2v2h2V3h-2zM8 17H6v-2h2v2zm0-4H6v-2h2v2zm0-4H6V7h2v2zm10 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2z"/></svg>',
            'tv': '<svg viewBox="0 0 24 24"><path d="M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h5v2h8v-2h5c1.1 0 1.99-.9 1.99-2L23 5c0-1.1-.9-2-2-2zm0 14H3V5h18v12z"/></svg>',
            'anime': '<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5-9h10v2H7z"/></svg>',
            'channels': '<svg viewBox="0 0 24 24"><path d="M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h5v2h8v-2h5c1.1 0 1.99-.9 1.99-2L23 5c0-1.1-.9-2-2-2zm0 14H3V5h18v12zM5 7v2h2V7H5zm0 4v2h2v-2H5zm0 4v2h2v-2H5z"/></svg>',
            'collections': '<svg viewBox="0 0 24 24"><path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9H9V9h10v2zm-4 4H9v-2h6v2zm4-8H9V5h10v2z"/></svg>',
            'vitaliy': '<svg viewBox="0 0 24 24"><path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9H9V9h10v2zm-4 4H9v-2h6v2zm4-8H9V5h10v2z"/></svg>',
            'favorite': '<svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>',
            'history': '<svg viewBox="0 0 24 24"><path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/></svg>',
            'settings': '<svg viewBox="0 0 24 24"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32a.49.49 0 0 0-.12-.61l-2.03-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>',
            'about': '<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>'
        };

        function renderMenuItems() {
            if (!listEl) return;
            
            var oldHtml = listEl.innerHTML;
            listEl.innerHTML = '';
            
            // Получаем все пункты меню от Lampa
            var allLampaItems = [];
            if (window.Lampa && Lampa.Menu) {
                if (typeof Lampa.Menu.get === 'function') {
                    allLampaItems = Lampa.Menu.get();
                } else if (Lampa.Menu.items) {
                    allLampaItems = Array.isArray(Lampa.Menu.items) ? Lampa.Menu.items : Object.values(Lampa.Menu.items);
                }
            }

            if (!Array.isArray(allLampaItems)) allLampaItems = [];

            allLampaItems.forEach(function(item) {
                var id = item.id || item.action || item.component;
                
                // Пропускаем поиск по просьбе пользователя
                if (id === 'search') return;
                if (!id) return;

                // Переводим заголовок, если это ключ локализации
                var title = item.title;
                if (window.Lampa.Lang && Lampa.Lang.translate && typeof title === 'string') {
                    if (title.indexOf('{') === 0 || title.indexOf('menu_') === 0) {
                        title = Lampa.Lang.translate(title);
                    }
                }

                // Обработка иконок: используем нашу карту или иконку от Lampa
                var icon = item.icon || iconMap[id] || '<svg viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>';
                if (iconMap[id]) icon = iconMap[id]; // Приоритет нашим иконкам для стандартных пунктов

                // Если иконка - это имя класса или FontAwesome, оборачиваем в div
                if (typeof icon === 'string' && icon.indexOf('<svg') === -1) {
                    icon = `<i class="${icon}"></i>`;
                }

                var li = document.createElement('li');
                li.className = 'prisma-menu__item selector';
                li.dataset.action = id;
                li.innerHTML = `
                    <div class="prisma-menu__item-icon">${icon}</div>
                    <div class="prisma-menu__item-text">${title || id}</div>
                `;
                
                li.addEventListener('click', function() {
                    $('.prisma-menu__item').removeClass('active');
                    li.classList.add('active');
                    executeAction(id);
                });

                li.addEventListener('hover:enter', function() {
                    $('.prisma-menu__item').removeClass('active');
                    li.classList.add('active');
                    executeAction(id);
                });

                li.addEventListener('hover:focus', function() {
                    Lampa.Controller.collectionSet(menuEl);
                });

                listEl.appendChild(li);
            });

            // Если контент изменился, уведомляем контроллер
            if (listEl.innerHTML !== oldHtml && !menuEl.classList.contains('prisma-menu--hidden')) {
                Lampa.Controller.collectionSet(menuEl);
            }
        }

        // Запускаем периодическую проверку в течение первых 15 секунд
        var refreshInterval = setInterval(renderMenuItems, 2000);
        setTimeout(function() { clearInterval(refreshInterval); }, 15000);

        // Перехватываем добавление новых пунктов меню
        if (window.Lampa && Lampa.Menu) {
            var originalMenuAdd = Lampa.Menu.add;
            Lampa.Menu.add = function(item) {
                if (originalMenuAdd) originalMenuAdd.apply(Lampa.Menu, arguments);
                console.log('Prisma Menu: New item added via Lampa.Menu.add:', item);
                renderMenuItems();
            };
        }

        renderMenuItems();

        // Подписываемся на события Lampa для обновления меню
        if (window.Lampa && Lampa.Listener) {
            Lampa.Listener.follow('app', function (e) {
                if (e.type === 'ready') {
                    renderMenuItems();
                }
            });
            
            // Также перерисовываем при каждом открытии меню, чтобы подхватить опоздавшие плагины
            Lampa.Listener.follow('menu', function (e) {
                if (e.type === 'open') {
                    renderMenuItems();
                }
            });
        }

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

        function executeAction(action) {
            console.log('Prisma Menu Action:', action);
            toggleMenu(false);
            
            // Получаем актуальный список пунктов от Lampa
            var allLampaItems = [];
            if (window.Lampa && Lampa.Menu) {
                if (typeof Lampa.Menu.get === 'function') {
                    allLampaItems = Lampa.Menu.get();
                } else if (Lampa.Menu.items) {
                    allLampaItems = Array.isArray(Lampa.Menu.items) ? Lampa.Menu.items : Object.values(Lampa.Menu.items);
                }
            }

            // Ищем оригинальный пункт
            var originalItem = allLampaItems.find(function(item) {
                return (item.id || item.action || item.component) === action;
            });

            // Если у пункта есть свой обработчик onSelect, вызываем его
            if (originalItem && typeof originalItem.onSelect === 'function') {
                originalItem.onSelect();
                return;
            }

            // Если это стандартный пункт или у него нет onSelect, используем логику Lampa
            if (action === 'settings') {
                Lampa.Controller.enable('settings');
            } else if (action === 'about') {
                Lampa.Component.add('about', {});
                Lampa.Activity.push({ component: 'about', title: 'О приложении' });
            } else if (originalItem && originalItem.component) {
                // Если у пункта указан компонент, запускаем его
                Lampa.Activity.push({
                    url: originalItem.url || '',
                    title: originalItem.title,
                    component: originalItem.component,
                    page: 1
                });
            } else {
                // В крайнем случае отправляем событие клика в систему
                Lampa.Listener.send('menu', { type: 'click', action: action });
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
