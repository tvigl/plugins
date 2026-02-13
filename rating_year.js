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

            /* Контейнер нового меню Click */
            .click-menu {
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

            .click-menu--hidden {
                transform: translateX(-120%);
            }

            /* Подложка для закрытия */
            .click-menu-overlay {
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

            .click-menu-overlay--show {
                opacity: 1;
                visibility: visible;
            }

            /* Шапка меню: Лого и Часы */
            .click-menu__header {
                padding: 5px 10px 10px;
                display: flex;
                flex-direction: row;
                justify-content: space-between;
                align-items: center;
                border-bottom: 1px solid rgba(255,255,255,0.05);
            }

            .click-menu__logo {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 5px 0;
            }

            .click-menu__logo-icon {
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

            .click-menu__logo-text {
                font-size: 1.3em;
                font-weight: 800;
                letter-spacing: -0.5px;
                color: #fff;
                text-transform: none;
                text-shadow: 0 0 10px rgba(255,255,255,0.2);
            }

            .click-menu__header-right {
                text-align: right;
            }

            .click-menu__time {
                font-size: 1.5em;
                font-weight: 700;
                color: #fff;
                line-height: 1;
            }

            .click-menu__date-block {
                line-height: 1.1;
                margin-top: 2px;
            }

            .click-menu__date {
                font-size: 0.7em;
                color: rgba(255,255,255,0.5);
                font-weight: 400;
            }

            .click-menu__day {
                font-size: 0.8em;
                font-weight: 500;
                color: rgba(255,255,255,0.7);
            }

            /* Список элементов меню */
            .click-menu__list {
                padding: 10px 0;
                margin: 0;
                list-style: none;
                overflow-y: auto;
            }

            .click-menu__item {
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

            .click-menu__item-icon {
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0.7;
            }

            .click-menu__item-icon svg {
                width: 18px;
                height: 18px;
                fill: currentColor;
            }

            /* Состояние фокуса и активного элемента */
            .click-menu__item.focus,
            .click-menu__item:hover {
                background: rgba(255, 255, 255, 0.08);
                color: #fff;
                box-shadow: inset 0 0 15px rgba(255, 255, 255, 0.03), 0 5px 15px rgba(0, 0, 0, 0.3);
            }

            .click-menu__item.focus .click-menu__item-icon,
            .click-menu__item:hover .click-menu__item-icon {
                opacity: 1;
                color: #2e9fff;
                filter: drop-shadow(0 0 8px rgba(46, 159, 255, 0.6));
            }

            .click-menu__item.active,
            .click-menu__item.focus-active {
                background: linear-gradient(90deg, #2e9fff 0%, #0072ff 100%);
                color: #fff;
                font-weight: 700;
                box-shadow: 0 4px 20px rgba(46, 159, 255, 0.4);
            }

            .click-menu__item.active .click-menu__item-icon,
            .click-menu__item.focus-active .click-menu__item-icon {
                opacity: 1;
                color: #fff;
                filter: drop-shadow(0 0 5px rgba(255, 255, 255, 0.5));
            }

            /* Футер меню */
            .click-menu__footer {
                padding: 5px 0 0;
                border-top: 1px solid rgba(255,255,255,0.05);
            }

            /* Стили для скроллбара */
            .click-menu__list::-webkit-scrollbar {
                width: 4px;
            }
            .click-menu__list::-webkit-scrollbar-track {
                background: transparent;
            }
            .click-menu__list::-webkit-scrollbar-thumb {
                background: rgba(255,255,255,0.1);
                border-radius: 10px;
            }

            /* Адаптивность для разных экранов */
            @media screen and (max-width: 768px) {
                .click-menu {
                    width: 260px;
                    left: 10px;
                    top: 10px;
                    padding: 8px;
                    border-radius: 18px;
                }
                .click-menu__logo-text {
                    font-size: 1em;
                }
                .click-menu__time {
                    font-size: 1.3em;
                }
                .click-menu__item {
                    padding: 6px 10px;
                    font-size: 0.9em;
                    gap: 10px;
                }
            }

            @media screen and (max-width: 480px) {
                .click-menu {
                    width: 240px;
                    left: 5px;
                    top: 5px;
                    padding: 6px;
                    border-radius: 15px;
                }
                .click-menu__time {
                    font-size: 1.2em;
                }
                .click-menu__item {
                    padding: 5px 8px;
                    gap: 8px;
                }
            }
        `;

        if (!document.getElementById('click-menu-styles')) {
            var styleEl = document.createElement('style');
            styleEl.id = 'click-menu-styles';
            styleEl.innerHTML = style;
            document.head.appendChild(styleEl);
        }

        var menuEl = document.createElement('div');
        menuEl.className = 'click-menu click-menu--hidden';

        var overlayEl = document.createElement('div');
        overlayEl.className = 'click-menu-overlay';
        overlayEl.addEventListener('click', function() {
            toggleMenu(false);
        });
        document.body.appendChild(overlayEl);
        
        var headerHTML = `
            <div class="click-menu__header">
                <div class="click-menu__logo">
                    <div class="click-menu__logo-icon">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="#fff">
                            <path d="M10.07 2.42L3.5 19.07l6.07-2.57 3.43 7.08 3.5-1.7-3.43-7.08 7.43-1.42L10.07 2.42z"/>
                        </svg>
                    </div>
                    <div class="click-menu__logo-text">Click</div>
                </div>
                <div class="click-menu__header-right">
                    <div class="click-menu__time" id="click-clock">00:00</div>
                    <div class="click-menu__date-block">
                        <div class="click-menu__date" id="click-date">01 Января 2024</div>
                        <div class="click-menu__day" id="click-day">Понедельник</div>
                    </div>
                </div>
            </div>
        `;

        var listEl = document.createElement('ul');
        listEl.className = 'click-menu__list';

        // Собираем меню сразу
        menuEl.innerHTML = headerHTML;
        menuEl.appendChild(listEl);
        
        // Футер (Инфо)
        var footerEl = document.createElement('div');
        footerEl.className = 'click-menu__footer';
        var infoItem = document.createElement('div');
        infoItem.className = 'click-menu__item selector';
        infoItem.dataset.action = 'about';
        infoItem.innerHTML = `
            <div class="click-menu__item-icon"><svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg></div>
            <div class="click-menu__item-text">Инфо</div>
        `;
        infoItem.addEventListener('click', function() { executeAction('about'); });
        infoItem.addEventListener('hover:enter', function() { executeAction('about'); });
        footerEl.appendChild(infoItem);
        menuEl.appendChild(footerEl);

        // Добавляем в DOM
        document.body.appendChild(menuEl);

        // Иконки для стандартных пунктов Lampa
        var iconMap = {
            'main': '<svg viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>',
            'full': '<svg viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>',
            'movie': '<svg viewBox="0 0 24 24"><path d="M18 3v2h-2V3H8v2H6V3H4v18h2v-2h2v2h8v-2h2v2h2V3h-2zM8 17H6v-2h2v2zm0-4H6v-2h2v2zm0-4H6V7h2v2zm10 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2z"/></svg>',
            'movies': '<svg viewBox="0 0 24 24"><path d="M18 3v2h-2V3H8v2H6V3H4v18h2v-2h2v2h8v-2h2v2h2V3h-2zM8 17H6v-2h2v2zm0-4H6v-2h2v2zm0-4H6V7h2v2zm10 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2z"/></svg>',
            'tv': '<svg viewBox="0 0 24 24"><path d="M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h5v2h8v-2h5c1.1 0 1.99-.9 1.99-2L23 5c0-1.1-.9-2-2-2zm0 14H3V5h18v12z"/></svg>',
            'anime': '<svg viewBox="0 0 24 24"><path d="M12 2c-4.97 0-9 4.03-9 9 0 4.17 2.84 7.67 6.69 8.69L12 22l2.31-2.31C18.16 18.67 21 15.17 21 11c0-4.97-4.03-9-9-9zm0 2c3.87 0 7 3.13 7 7 0 3.17-2.11 5.85-5.02 6.74L12 19.71l-1.98-1.97C7.11 16.85 5 14.17 5 11c0-3.87 3.13-7 7-7zm-3.5 6c-.83 0-1.5.67-1.5 1.5S7.67 13 8.5 13s1.5-.67 1.5-1.5S9.33 10 8.5 10zm7 0c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5z"/></svg>',
            'channels': '<svg viewBox="0 0 24 24"><path d="M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h5v2h8v-2h5c1.1 0 1.99-.9 1.99-2L23 5c0-1.1-.9-2-2-2zm0 14H3V5h18v12zM5 7v2h2V7H5zm0 4v2h2v-2H5zm0 4v2h2v-2H5z"/></svg>',
            'collections': '<svg viewBox="0 0 24 24"><path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9H9V9h10v2zm-4 4H9v-2h6v2zm4-8H9V5h10v2z"/></svg>',
            'vitaliy': '<svg viewBox="0 0 24 24"><path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9H9V9h10v2zm-4 4H9v-2h6v2zm4-8H9V5h10v2z"/></svg>',
            'favorite': '<svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>',
            'history': '<svg viewBox="0 0 24 24"><path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/></svg>',
            'settings': '<svg viewBox="0 0 24 24"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32a.49.49 0 0 0-.12-.61l-2.03-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>',
            'about': '<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>'
        };

        function toggleMenu(show) {
            if (show) {
                menuEl.classList.remove('click-menu--hidden');
                overlayEl.classList.add('click-menu-overlay--show');
                Lampa.Controller.add('click_menu', {
                    toggle: function() {},
                    update: function() {},
                    render: function() { return menuEl; },
                    collection: function() { return menuEl; },
                    active: function() { return menuEl; },
                    exit: function() { toggleMenu(false); },
                    pause: function() {},
                    stop: function() {},
                    renderMenuItems: renderMenuItems
                });
                Lampa.Controller.toggle('click_menu');
            } else {
                menuEl.classList.add('click-menu--hidden');
                overlayEl.classList.remove('click-menu-overlay--show');
                Lampa.Controller.toggle('content');
            }
        }

        function updateTime() {
            var now = new Date();
            var h = now.getHours();
            var m = now.getMinutes();
            var clockEl = document.getElementById('click-clock');
            if (clockEl) clockEl.innerText = (h < 10 ? '0' + h : h) + ':' + (m < 10 ? '0' + m : m);

            var days = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
            var months = ['Января', 'Февраля', 'Марта', 'Апреля', 'Мая', 'Июня', 'Июля', 'Августа', 'Сентября', 'Октября', 'Ноября', 'Декабря'];
            
            var dayEl = document.getElementById('click-day');
            if (dayEl) dayEl.innerText = days[now.getDay()];

            var dateEl = document.getElementById('click-date');
            if (dateEl) dateEl.innerText = now.getDate() + ' ' + months[now.getMonth()] + ' ' + now.getFullYear();
        }

        setInterval(updateTime, 10000);
        updateTime();

        function executeAction(action) {
            console.log('Click Menu: Executing action', action);
            
            // Если это наше "Инфо"
            if (action === 'about') {
                toggleMenu(false);
                Lampa.Activity.push({
                    url: '',
                    title: 'О плагине',
                    component: 'info',
                    page: 1
                });
                return;
            }

            // Ищем оригинальный пункт в Lampa.Menu
            var originalItem = null;
            try {
                var items = [];
                if (typeof Lampa.Menu.get === 'function') items = Lampa.Menu.get();
                else if (Lampa.Menu.items) items = Lampa.Menu.items;

                if (items && typeof items === 'object') {
                    for (var key in items) {
                        var itm = items[key];
                        var itmId = itm.id || itm.action || itm.component;
                        if (itmId === action) {
                            originalItem = itm;
                            break;
                        }
                    }
                }
            } catch (e) {
                console.error('Click Menu: Error finding original item', e);
            }

            toggleMenu(false);

            // Если у пункта есть свой обработчик onSelect (как у большинства плагинов)
            if (originalItem && typeof originalItem.onSelect === 'function') {
                console.log('Click Menu: Calling original onSelect for', action);
                originalItem.onSelect();
            } else {
                // Иначе используем стандартный переход Lampa
                console.log('Click Menu: Navigating to component', action);
                Lampa.Activity.push({
                    url: '',
                    title: action,
                    component: action,
                    page: 1
                });
            }
        }

        function renderMenuItems() {
            if (!listEl) return;
            console.log('Click Menu: Starting renderMenuItems');
            
            var oldHtml = listEl.innerHTML;
            listEl.innerHTML = '';
            
            // Получаем все пункты меню от Lampa
            var allLampaItems = [];
            try {
                if (window.Lampa && Lampa.Menu) {
                    var m = Lampa.Menu;
                    var items = [];
                    
                    console.log('Click Menu: Lampa.Menu found', m);

                    if (typeof m.get === 'function') items = m.get();
                    else if (typeof m.items === 'function') items = m.items();
                    else if (m.items) items = m.items;
                    
                    console.log('Click Menu: Items from Lampa.Menu', items);

                    if (!items || (Array.isArray(items) && items.length === 0)) {
                        if (typeof m.list === 'function') items = m.list();
                        else if (m.list) items = m.list;
                        console.log('Click Menu: Items from Lampa.Menu (fallback list)', items);
                    }

                    if (items && (typeof items === 'object')) {
                        if (items.constructor === Array) {
                            allLampaItems = items;
                        } else {
                            for (var key in items) {
                                if (Object.prototype.hasOwnProperty.call(items, key)) {
                                    allLampaItems.push(items[key]);
                                }
                            }
                        }
                    }
                } else {
                    console.log('Click Menu: Lampa.Menu NOT found');
                }
            } catch (e) {
                console.error('Click Menu: Error getting items from Lampa', e);
            }

            console.log('Click Menu: Final allLampaItems to render', allLampaItems);

            allLampaItems.forEach(function(item) {
                try {
                    // Извлекаем заголовок
                    var title = item.title || '';
                    if (typeof title === 'object' && title !== null) {
                        if (title.ru) title = title.ru;
                        else if (title.en) title = title.en;
                        else {
                            for (var k in title) { title = title[k]; break; }
                        }
                    }

                    // Извлекаем ID
                    var id = item.id || item.action || item.component || (typeof title === 'string' ? title : '');
                    
                    // Пропускаем поиск по просьбе пользователя
                    if (id === 'search' || (!id && !title)) {
                        console.log('Click Menu: Skipping item', item);
                        return;
                    }

                    // Переводим заголовок, если это ключ локализации
                    if (window.Lampa.Lang && Lampa.Lang.translate && typeof title === 'string') {
                        // Очищаем от фигурных скобок, если они есть
                        var cleanKey = title.replace(/\{|\}/g, '');
                        
                        // Если это известный ключ или начинается с menu_
                        if (title.indexOf('{') === 0 || title.indexOf('menu_') === 0 || cleanKey.indexOf('menu_') === 0) {
                            var translated = Lampa.Lang.translate(cleanKey);
                            // Если перевод удался (не вернул тот же ключ), используем его
                            if (translated && translated !== cleanKey) {
                                title = translated;
                            }
                        }
                    }

                    // Обработка иконок: используем нашу карту или иконку от Lampa
                    var icon = item.icon || iconMap[id] || '<svg viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>';
                    if (iconMap[id]) icon = iconMap[id]; // Приоритет нашим иконкам для стандартных пунктов

                    // Если иконка - это имя класса или FontAwesome, оборачиваем в i
                    if (typeof icon === 'string' && icon.indexOf('<svg') === -1 && icon.indexOf('fa-') !== -1) {
                        icon = `<i class="${icon}"></i>`;
                    }

                    var li = document.createElement('li');
                    li.className = 'click-menu__item selector';
                    li.dataset.action = id;
                    li.innerHTML = `
                        <div class="click-menu__item-icon">${icon}</div>
                        <div class="click-menu__item-text">${title || id || 'Пункт'}</div>
                    `;
                    
                    li.addEventListener('click', function() {
                        $('.click-menu__item').removeClass('active');
                        li.classList.add('active');
                        executeAction(id);
                    });

                    li.addEventListener('hover:enter', function() {
                        $('.click-menu__item').removeClass('active');
                        li.classList.add('active');
                        executeAction(id);
                    });

                    li.addEventListener('hover:focus', function() {
                        Lampa.Controller.collectionSet(menuEl);
                    });

                    listEl.appendChild(li);
                    console.log('Click Menu: Appended item', id);
                } catch (e) {
                    console.error('Click Menu: Error rendering item', item, e);
                }
            });

            // Если контент изменился, уведомляем контроллер
            if (listEl.innerHTML !== oldHtml && !menuEl.classList.contains('click-menu--hidden')) {
                Lampa.Controller.collectionSet(menuEl);
            }
            console.log('Click Menu: Render finished');
        }

        // Запускаем периодическую проверку в течение первых 15 секунд
        var refreshInterval = setInterval(renderMenuItems, 2000);
        setTimeout(function() { clearInterval(refreshInterval); }, 15000);

        // Перехватываем добавление новых пунктов меню
        if (window.Lampa && Lampa.Menu) {
            var originalMenuAdd = Lampa.Menu.add;
            Lampa.Menu.add = function(item) {
                if (originalMenuAdd) originalMenuAdd.apply(Lampa.Menu, arguments);
                console.log('Click Menu: New item added via Lampa.Menu.add:', item);
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

        // Заменяем стандартный контроллер меню
        function replaceMenuController() {
            var originalOpen = Lampa.Menu.open;
            Lampa.Menu.open = function() {
                toggleMenu(true);
            };
        }

        replaceMenuController();

        // Глобальный слушатель кнопок для закрытия меню (Back/Esc)
        window.addEventListener('keydown', function(e) {
            if (!menuEl.classList.contains('click-menu--hidden')) {
                // Коды кнопок: Esc (27), Back (8), Back на TV (461, 10009)
                if (e.keyCode === 27 || e.keyCode === 8 || e.keyCode === 461 || e.keyCode === 10009) {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleMenu(false);
                }
            }
        }, true);
    }

    // Ожидаем готовности Lampa
    if (window.Lampa) {
        init();
    } else {
        var interval = setInterval(function() {
            if (window.Lampa) {
                clearInterval(interval);
                init();
            }
        }, 100);
    }

})();
