(function () {
    'use strict';

    /**
     * Плагин для Lampa: Меню LampaClick
     * 
     * Особенности:
     * - Заменяет стандартное боковое меню на стильное меню LampaClick
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
                left: 0;
                top: 0;
                bottom: 0;
                width: 320px;
                background: #121212;
                display: flex;
                flex-direction: column;
                z-index: 1000;
                box-shadow: 20px 0 40px rgba(0,0,0,0.5);
                transition: transform 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
                overflow: hidden;
                padding: 20px;
                box-sizing: border-box;
            }

            .prisma-menu--hidden {
                transform: translateX(-100%);
            }

            /* Шапка меню: Лого и Часы */
            .prisma-menu__header {
                padding: 10px 10px 30px;
                display: flex;
                flex-direction: column;
                gap: 20px;
                border-bottom: 1px solid rgba(255,255,255,0.05);
            }

            .prisma-menu__header-top {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .prisma-menu__logo {
                display: flex;
                align-items: center;
                gap: 12px;
            }

            .prisma-menu__logo-icon {
                width: 36px;
                height: 36px;
                background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 0 15px rgba(79, 172, 254, 0.4);
            }

            .prisma-menu__logo-text {
                font-size: 1.5em;
                font-weight: 700;
                letter-spacing: 1.5px;
                color: #fff;
            }

            .prisma-menu__time {
                font-size: 2.2em;
                font-weight: 900;
                color: #fff;
                letter-spacing: -1px;
            }

            .prisma-menu__date-block {
                text-align: right;
                line-height: 1.2;
            }

            .prisma-menu__date {
                font-size: 0.9em;
                color: #888;
            }

            .prisma-menu__day {
                font-size: 1.1em;
                font-weight: 600;
                color: #fff;
            }

            /* Список элементов меню */
            .prisma-menu__list {
                flex: 1;
                overflow-y: auto;
                padding: 20px 15px;
                margin: 0;
                list-style: none;
            }

            .prisma-menu__item {
                display: flex;
                align-items: center;
                gap: 15px;
                padding: 12px 15px;
                margin-bottom: 5px;
                border-radius: 12px;
                color: #ccc;
                font-size: 1.1em;
                font-weight: 500;
                transition: all 0.2s ease;
                cursor: pointer;
            }

            .prisma-menu__item-icon {
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0.8;
            }

            .prisma-menu__item-icon svg {
                width: 20px;
                height: 20px;
                fill: currentColor;
            }

            /* Состояние фокуса (для пульта и мыши) */
            .prisma-menu__item.focus,
            .prisma-menu__item:hover {
                background: rgba(255, 255, 255, 0.1);
                color: #fff;
                transform: translateX(5px);
            }

            .prisma-menu__item.focus .prisma-menu__item-icon,
            .prisma-menu__item:hover .prisma-menu__item-icon {
                opacity: 1;
                color: #2e9fff;
            }

            .prisma-menu__item.active {
                background: rgba(46, 159, 255, 0.15);
                color: #2e9fff;
            }

            /* Футер меню */
            .prisma-menu__footer {
                padding: 15px;
                border-top: 1px solid rgba(255,255,255,0.05);
                margin-top: auto;
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
        `;

        if (!document.getElementById('prisma-menu-styles')) {
            var styleEl = document.createElement('style');
            styleEl.id = 'prisma-menu-styles';
            styleEl.innerHTML = style;
            document.head.appendChild(styleEl);
        }

        var menuData = [
            { title: 'Главная', action: 'main', icon: '<svg viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>' },
            { title: 'Фильмы', action: 'movie', icon: '<svg viewBox="0 0 24 24"><path d="M18 3v2h-2V3H8v2H6V3H4v18h2v-2h2v2h8v-2h2v2h2V3h-2zM8 17H6v-2h2v2zm0-4H6v-2h2v2zm0-4H6V7h2v2zm10 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2z"/></svg>' },
            { title: 'Сериалы', action: 'tv', icon: '<svg viewBox="0 0 24 24"><path d="M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h5v2h8v-2h5c1.1 0 1.99-.9 1.99-2L23 5c0-1.1-.9-2-2-2zm0 14H3V5h18v12z"/></svg>' },
            { title: 'Детям', action: 'child', icon: '<svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>' },
            { title: 'Аниме', action: 'anime', icon: '<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5-9h10v2H7z"/></svg>' },
            { title: 'Подборки', action: 'collections', icon: '<svg viewBox="0 0 24 24"><path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9H9V9h10v2zm-4 4H9v-2h6v2zm4-8H9V5h10v2z"/></svg>' },
            { title: 'Фильтр', action: 'filter', icon: '<svg viewBox="0 0 24 24"><path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"/></svg>' },
            { title: 'Избранное', action: 'favorite', icon: '<svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>' },
            { title: 'История', action: 'history', icon: '<svg viewBox="0 0 24 24"><path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/></svg>' },
            { title: 'Спорт', action: 'sport', icon: '<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>' }
        ];

        var menuEl = document.createElement('div');
        menuEl.className = 'prisma-menu prisma-menu--hidden';
        
        var headerHTML = `
            <div class="prisma-menu__header">
                <div class="prisma-menu__header-top">
                    <div class="prisma-menu__logo">
                        <div class="prisma-menu__logo-icon">
                            <svg viewBox="0 0 24 24" width="22" height="22" fill="#fff"><path d="M7 2l12 11.2l-5.8 1.4l3.8 6.6l-2.6 1.5l-3.8-6.6l-3.6 3.1z"/></svg>
                        </div>
                        <div class="prisma-menu__logo-text">LampaClick</div>
                    </div>
                    <div class="prisma-menu__time" id="prisma-clock">00:00</div>
                </div>
                <div class="prisma-menu__date-block">
                    <div class="prisma-menu__date" id="prisma-date">01 Января 2024</div>
                    <div class="prisma-menu__day" id="prisma-day">Понедельник</div>
                </div>
            </div>
        `;

        var listEl = document.createElement('ul');
        listEl.className = 'prisma-menu__list';

        menuData.forEach(function(item) {
            var li = document.createElement('li');
            li.className = 'prisma-menu__item selector';
            li.dataset.action = item.action;
            li.innerHTML = `
                <div class="prisma-menu__item-icon">${item.icon}</div>
                <div class="prisma-menu__item-text">${item.title}</div>
            `;
            
            li.addEventListener('click', function() {
                executeAction(item.action);
            });

            // Для поддержки пульта Lampa
            li.addEventListener('hover:enter', function() {
                executeAction(item.action);
            });

            listEl.appendChild(li);
        });

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
            
            var activity_data = {
                url: '',
                title: '',
                component: action,
                page: 1
            };

            if (action === 'settings') {
                Lampa.Component.add('settings', {});
                Lampa.Activity.push({ component: 'settings', title: 'Настройки' });
            } else if (action === 'main') {
                Lampa.Activity.push({ url: '', title: 'Главная', component: 'main' });
            } else if (action === 'movie') {
                Lampa.Activity.push({ url: 'movie', title: 'Фильмы', component: 'category', page: 1 });
            } else if (action === 'tv') {
                Lampa.Activity.push({ url: 'tv', title: 'Сериалы', component: 'category', page: 1 });
            } else if (action === 'favorite') {
                Lampa.Activity.push({ url: '', title: 'Избранное', component: 'favorite' });
            } else if (action === 'history') {
                Lampa.Activity.push({ url: '', title: 'История', component: 'history' });
            } else if (action === 'about') {
                Lampa.Component.add('about', {});
                Lampa.Activity.push({ component: 'about', title: 'О приложении' });
            } else if (action === 'filter') {
                Lampa.Activity.push({ component: 'filter', title: 'Фильтр' });
            } else if (action === 'collections') {
                Lampa.Activity.push({ component: 'collections', title: 'Подборки' });
            } else if (action === 'child') {
                Lampa.Activity.push({ component: 'category', url: 'movie', title: 'Детям', genres: '16,35,10751' }); // Пример для TMDB
            } else if (action === 'anime') {
                Lampa.Activity.push({ component: 'category', url: 'movie', title: 'Аниме', genres: '16' }); // Пример для TMDB
            } else if (action === 'sport') {
                Lampa.Activity.push({ component: 'category', url: 'movie', title: 'Спорт', genres: '99' }); // Пример
            }
        }

        function toggleMenu(show) {
            if (show) {
                menuEl.classList.remove('prisma-menu--hidden');
                Lampa.Controller.enable('prisma_menu');
            } else {
                menuEl.classList.add('prisma-menu--hidden');
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
