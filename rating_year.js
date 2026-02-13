(function() {
    'use strict';
    
    /*
    ╔══════════════════════════════════════════════════════════════════════════════╗
    ║                📊 РЕЙТИНГ И ГОД ПОД ПОСТЕРАМИ ПЛАГИН 📊                       ║
    ║              Добавляет рейтинг и год под постерами в Lampa                    ║
    ║                           Версия: 1.0.0                                        ║
    ╚══════════════════════════════════════════════════════════════════════════════╝
    */

    // Защита от повторного запуска
    if (window.RatingYearPlugin && window.RatingYearPlugin.__initialized) return;
    
    window.RatingYearPlugin = window.RatingYearPlugin || {};
    window.RatingYearPlugin.__initialized = true;

    // === КОНФИГУРАЦИЯ ===
    var CONFIG = {
        PLUGIN_NAME: 'rating_year_plugin',
        VERSION: '1.0.0',
        TMDB_API_KEY: '9d8a720823d2b3a8390f597478a2e8ec',
        CACHE_TIME: 12 * 60 * 60 * 1000 // 12 часов
    };

    // === НАСТРОЙКИ ПО УМОЛЧАНИЮ ===
    var settings = {
        rating: 'on',      // 'on' или 'off'
        year: 'on',        // 'on' или 'off'
        position: 'bottom' // 'bottom' или 'top'
    };

    // === КЭШ ДЛЯ ДАННЫХ TMDB ===
    var cache = {
        data: {},
        get: function(key) {
            var item = this.data[key];
            if (item && Date.now() - item.timestamp < CONFIG.CACHE_TIME) {
                return item.data;
            }
            return null;
        },
        set: function(key, data) {
            this.data[key] = {
                data: data,
                timestamp: Date.now()
            };
        }
    };

    // === ОСНОВНЫЕ ФУНКЦИИ ===

    /**
     * Инициализация плагина
     */
    function init() {
        console.log('[' + CONFIG.PLUGIN_NAME + '] Инициализация плагина...');
        
        // Загружаем настройки
        loadSettings();
        
        // Добавляем CSS стили
        addStyles();
        
        // Наблюдаем за изменениями в DOM
        observeChanges();
        
        // Обрабатываем уже существующие карточки
        processExistingCards();
        
        console.log('[' + CONFIG.PLUGIN_NAME + '] Плагин успешно инициализирован');
    }

    /**
     * Загрузка настроек из localStorage
     */
    function loadSettings() {
        try {
            var saved = localStorage.getItem(CONFIG.PLUGIN_NAME + '_settings');
            if (saved) {
                var parsed = JSON.parse(saved);
                for (var key in parsed) {
                    if (settings.hasOwnProperty(key)) {
                        settings[key] = parsed[key];
                    }
                }
            }
        } catch (e) {
            console.error('[' + CONFIG.PLUGIN_NAME + '] Ошибка загрузки настроек:', e);
        }
    }

    /**
     * Сохранение настроек в localStorage
     */
    function saveSettings() {
        try {
            localStorage.setItem(CONFIG.PLUGIN_NAME + '_settings', JSON.stringify(settings));
        } catch (e) {
            console.error('[' + CONFIG.PLUGIN_NAME + '] Ошибка сохранения настроек:', e);
        }
    }

    /**
     * Добавление CSS стилей
     */
    function addStyles() {
        var styleId = CONFIG.PLUGIN_NAME + '_styles';
        
        if (document.getElementById(styleId)) {
            return;
        }

        var css = `
            .rating-year-badge {
                position: absolute;
                z-index: 12;
                font-size: 0.7em;
                font-weight: 600;
                padding: 2px 6px;
                border-radius: 3px;
                opacity: 0;
                transform: translateY(10px);
                transition: all 0.3s ease;
                pointer-events: none;
                text-shadow: 0 1px 2px rgba(0,0,0,0.8);
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            }

            .rating-year-badge.show {
                opacity: 1;
                transform: translateY(0);
            }

            /* Рейтинг */
            .rating-badge {
                background: rgba(0, 0, 0, 0.8);
                color: #fff;
            }

            .rating-badge.excellent {
                background: rgba(0, 170, 0, 0.9);
                color: #fff;
            }

            .rating-badge.good {
                background: rgba(255, 170, 0, 0.9);
                color: #fff;
            }

            .rating-badge.average {
                background: rgba(255, 140, 0, 0.9);
                color: #fff;
            }

            .rating-badge.poor {
                background: rgba(220, 53, 69, 0.9);
                color: #fff;
            }

            /* Год */
            .year-badge {
                background: rgba(0, 0, 0, 0.8);
                color: #fff;
            }

            /* Позиционирование */
            .rating-year-position-bottom .rating-badge {
                bottom: 2px;
                left: 2px;
            }

            .rating-year-position-bottom .year-badge {
                bottom: 2px;
                right: 2px;
            }

            .rating-year-position-top .rating-badge {
                top: 2px;
                left: 2px;
            }

            .rating-year-position-top .year-badge {
                top: 2px;
                right: 2px;
            }

            /* Адаптивность для карточек */
            @media (max-width: 768px) {
                .rating-year-badge {
                    font-size: 0.6em;
                    padding: 1px 4px;
                }
            }
        `;

        var style = document.createElement('style');
        style.id = styleId;
        style.textContent = css;
        document.head.appendChild(style);
    }

    /**
     * Обработка существующих карточек
     */
    function processExistingCards() {
        var cards = document.querySelectorAll('.card, .card--view, .card--category');
        for (var i = 0; i < cards.length; i++) {
            processCard(cards[i]);
        }
    }

    /**
     * Наблюдение за изменениями в DOM
     */
    function observeChanges() {
        var observer = new MutationObserver(function(mutations) {
            var shouldProcess = false;
            
            for (var i = 0; i < mutations.length; i++) {
                var mutation = mutations[i];
                
                if (mutation.type === 'childList') {
                    for (var j = 0; j < mutation.addedNodes.length; j++) {
                        var node = mutation.addedNodes[j];
                        
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            if (node.classList && (
                                node.classList.contains('card') ||
                                node.classList.contains('card--view') ||
                                node.classList.contains('card--category')
                            )) {
                                shouldProcess = true;
                                break;
                            }
                            
                            if (node.querySelector && node.querySelector('.card, .card--view, .card--category')) {
                                shouldProcess = true;
                                break;
                            }
                        }
                    }
                }
                
                if (shouldProcess) break;
            }
            
            if (shouldProcess) {
                setTimeout(function() {
                    processExistingCards();
                }, 100);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    /**
     * Обработка одной карточки
     */
    function processCard(cardElement) {
        // Пропускаем уже обработанные карточки
        if (cardElement.hasAttribute('data-rating-year-processed')) {
            return;
        }

        cardElement.setAttribute('data-rating-year-processed', 'true');

        // Получаем данные карточки
        var cardData = extractCardData(cardElement);
        
        if (!cardData) {
            return;
        }

        // Создаем контейнер для бейджей
        var badgeContainer = document.createElement('div');
        badgeContainer.className = 'rating-year-container rating-year-position-' + settings.position;
        
        // Добавляем класс позиционирования к родительской карточке
        var cardView = cardElement.querySelector('.card__view') || cardElement;
        cardView.classList.add('rating-year-position-' + settings.position);

        // Добавляем рейтинг
        if (settings.rating === 'on' && cardData.rating) {
            var ratingBadge = createRatingBadge(cardData.rating);
            if (ratingBadge) {
                cardView.appendChild(ratingBadge);
            }
        }

        // Добавляем год
        if (settings.year === 'on' && cardData.year) {
            var yearBadge = createYearBadge(cardData.year);
            if (yearBadge) {
                cardView.appendChild(yearBadge);
            }
        }

        // Если нет данных, пытаемся получить из TMDB
        if ((!cardData.rating || !cardData.year) && cardData.title) {
            fetchFromTMDB(cardData.title, cardData, function(data) {
                if (data.rating && settings.rating === 'on') {
                    var ratingBadge = createRatingBadge(data.rating);
                    if (ratingBadge) {
                        cardView.appendChild(ratingBadge);
                    }
                }
                
                if (data.year && settings.year === 'on') {
                    var yearBadge = createYearBadge(data.year);
                    if (yearBadge) {
                        cardView.appendChild(yearBadge);
                    }
                }
            });
        }
    }

    /**
     * Извлечение данных из карточки
     */
    function extractCardData(cardElement) {
        var data = {
            title: '',
            rating: null,
            year: null,
            type: 'movie'
        };

        // Получаем заголовок
        var titleElement = cardElement.querySelector('.card__title, .card__name, .title');
        if (titleElement) {
            data.title = titleElement.textContent.trim();
        }

        // Получаем рейтинг из различных источников
        var ratingSources = [
            '.card__vote',
            '.card__rating',
            '.rating',
            '[data-rating]',
            '[data-vote]'
        ];

        for (var i = 0; i < ratingSources.length; i++) {
            var ratingElement = cardElement.querySelector(ratingSources[i]);
            if (ratingElement) {
                var ratingText = ratingElement.textContent || ratingElement.getAttribute('data-rating') || ratingElement.getAttribute('data-vote');
                if (ratingText) {
                    var rating = parseFloat(ratingText.replace(',', '.'));
                    if (!isNaN(rating) && rating > 0 && rating <= 10) {
                        data.rating = rating;
                        break;
                    }
                }
            }
        }

        // Получаем год из различных источников
        var yearSources = [
            '.card__year',
            '.card__age',
            '.card__date',
            '[data-year]',
            '[data-release]'
        ];

        for (var j = 0; j < yearSources.length; j++) {
            var yearElement = cardElement.querySelector(yearSources[j]);
            if (yearElement) {
                var yearText = yearElement.textContent || yearElement.getAttribute('data-year') || yearElement.getAttribute('data-release');
                if (yearText) {
                    var yearMatch = yearText.match(/(19|20)\d{2}/);
                    if (yearMatch) {
                        data.year = parseInt(yearMatch[0], 10);
                        break;
                    }
                }
            }
        }

        // Определяем тип (фильм или сериал)
        if (cardElement.classList.contains('card--tv') || 
            cardElement.classList.contains('card--serial') ||
            cardElement.querySelector('.card__seasons')) {
            data.type = 'tv';
        }

        return data.title ? data : null;
    }

    /**
     * Создание бейджа рейтинга
     */
    function createRatingBadge(rating) {
        if (!rating || isNaN(rating)) return null;

        var badge = document.createElement('div');
        badge.className = 'rating-year-badge rating-badge';
        
        // Определяем цвет по оценке
        if (rating >= 8.0) {
            badge.classList.add('excellent');
        } else if (rating >= 6.0) {
            badge.classList.add('good');
        } else if (rating >= 4.0) {
            badge.classList.add('average');
        } else {
            badge.classList.add('poor');
        }
        
        badge.textContent = rating.toFixed(1);
        
        // Анимация появления
        setTimeout(function() {
            badge.classList.add('show');
        }, 50);
        
        return badge;
    }

    /**
     * Создание бейджа года
     */
    function createYearBadge(year) {
        if (!year) return null;

        var badge = document.createElement('div');
        badge.className = 'rating-year-badge year-badge';
        badge.textContent = year;
        
        // Анимация появления
        setTimeout(function() {
            badge.classList.add('show');
        }, 50);
        
        return badge;
    }

    /**
     * Получение данных из TMDB API
     */
    function fetchFromTMDB(title, cardData, callback) {
        var cacheKey = title.toLowerCase();
        var cached = cache.get(cacheKey);
        
        if (cached) {
            callback(cached);
            return;
        }

        var searchUrl = 'https://api.themoviedb.org/3/search/' + 
            (cardData.type === 'tv' ? 'tv' : 'movie') + 
            '?api_key=' + CONFIG.TMDB_API_KEY + 
            '&query=' + encodeURIComponent(title) + 
            '&language=ru';

        var xhr = new XMLHttpRequest();
        xhr.open('GET', searchUrl, true);
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    try {
                        var response = JSON.parse(xhr.responseText);
                        if (response.results && response.results.length > 0) {
                            var result = response.results[0];
                            var data = {
                                rating: result.vote_average,
                                year: result.release_date ? 
                                    parseInt(result.release_date.substring(0, 4), 10) :
                                    result.first_air_date ? 
                                        parseInt(result.first_air_date.substring(0, 4), 10) : null
                            };
                            
                            cache.set(cacheKey, data);
                            callback(data);
                        }
                    } catch (e) {
                        console.error('[' + CONFIG.PLUGIN_NAME + '] Ошибка парсинга TMDB ответа:', e);
                    }
                } else {
                    console.error('[' + CONFIG.PLUGIN_NAME + '] TMDB API ошибка:', xhr.status);
                }
            }
        };
        
        xhr.send();
    }

    /**
     * Добавление настроек в интерфейс Lampa
     */
    function addSettings() {
        // Проверяем, доступен ли интерфейс настроек Lampa
        if (typeof Lampa === 'undefined' || !Lampa.Settings) {
            return;
        }

        Lampa.Settings.add({
            component: 'rating_year_plugin',
            name: 'Рейтинг и год под постерами',
            description: 'Настройки отображения рейтинга и года'
        });

        Lampa.Settings.addParam({
            component: 'rating_year_plugin',
            param: {
                name: 'show_rating',
                type: 'trigger',
                default: true,
                values: ['Включить рейтинг', 'Выключить рейтинг']
            },
            onChange: function(value) {
                settings.rating = value ? 'on' : 'off';
                saveSettings();
                processExistingCards();
            }
        });

        Lampa.Settings.addParam({
            component: 'rating_year_plugin',
            param: {
                name: 'show_year',
                type: 'trigger',
                default: true,
                values: ['Включить год', 'Выключить год']
            },
            onChange: function(value) {
                settings.year = value ? 'on' : 'off';
                saveSettings();
                processExistingCards();
            }
        });

        Lampa.Settings.addParam({
            component: 'rating_year_plugin',
            param: {
                name: 'position',
                type: 'select',
                default: 'bottom',
                values: {
                    'bottom': 'Внизу карточки',
                    'top': 'Вверху карточки'
                }
            },
            onChange: function(value) {
                settings.position = value;
                saveSettings();
                processExistingCards();
            }
        });
    }

    // === ЗАПУСК ПЛАГИНА ===
    
    // Ждем загрузки DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(init, 1000);
        });
    } else {
        setTimeout(init, 1000);
    }

    // Пытаемся добавить настройки, если Lampa загружена
    setTimeout(function() {
        addSettings();
    }, 2000);

    // Экспортируем функции для внешнего доступа
    window.RatingYearPlugin = {
        updateSettings: function(newSettings) {
            for (var key in newSettings) {
                if (settings.hasOwnProperty(key)) {
                    settings[key] = newSettings[key];
                }
            }
            saveSettings();
            processExistingCards();
        },
        getSettings: function() {
            return Object.assign({}, settings);
        },
        reprocess: function() {
            processExistingCards();
        }
    };

})();
