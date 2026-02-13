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
        year: 'on'         // 'on' или 'off'
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
     * Добавление CSS стилей
     */
    function addStyles() {
        var styleId = CONFIG.PLUGIN_NAME + '_styles';
        
        if (document.getElementById(styleId)) {
            return;
        }

        var css = `
            .rating-year-container {
                text-align: center;
                margin: 4px 0;
                font-size: 0.85em;
                font-weight: 500;
                opacity: 0.9;
                transition: opacity 0.2s ease;
            }

            .rating-year-container:hover {
                opacity: 1;
            }

            .rating-star {
                color: #2196F3;
                margin-right: 2px;
            }

            .rating-value {
                color: #2196F3;
                font-weight: 600;
            }

            .year-separator {
                color: #666;
                margin: 0 4px;
            }

            .year-value {
                color: #999;
                font-weight: 400;
            }

            /* Перемещаем заголовок под рейтинг и год */
            .card__title {
                order: 3;
                margin-top: 2px;
            }

            /* Контейнер для рейтинга и года */
            .card__rating-year {
                order: 2;
                margin: 2px 0;
            }

            /* Постер должен быть первым */
            .card__view {
                display: flex;
                flex-direction: column;
            }

            .card__poster {
                order: 1;
            }

            /* Адаптивность */
            @media (max-width: 768px) {
                .rating-year-container {
                    font-size: 0.75em;
                    margin: 2px 0;
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

        // Создаем контейнер для рейтинга и года
        var infoContainer = document.createElement('div');
        infoContainer.className = 'rating-year-container card__rating-year';
        
        var hasContent = false;

        // Добавляем рейтинг
        if (settings.rating === 'on' && cardData.rating) {
            var ratingSpan = createRatingInline(cardData.rating);
            if (ratingSpan) {
                infoContainer.appendChild(ratingSpan);
                hasContent = true;
            }
        }

        // Добавляем год
        if (settings.year === 'on' && cardData.year) {
            if (hasContent) {
                var separator = document.createElement('span');
                separator.className = 'year-separator';
                separator.textContent = '•';
                infoContainer.appendChild(separator);
            }
            
            var yearSpan = createYearInline(cardData.year);
            if (yearSpan) {
                infoContainer.appendChild(yearSpan);
                hasContent = true;
            }
        }

        // Добавляем контейнер после постера, перед заголовком
        if (hasContent) {
            var cardView = cardElement.querySelector('.card__view');
            var titleElement = cardElement.querySelector('.card__title, .card__name, .title');
            
            if (cardView) {
                // Вставляем контейнер перед заголовком
                if (titleElement) {
                    cardView.insertBefore(infoContainer, titleElement);
                } else {
                    // Если заголовка нет, добавляем в конец
                    cardView.appendChild(infoContainer);
                }
            }
        }

        // Если нет данных, пытаемся получить из TMDB
        if ((!cardData.rating || !cardData.year) && cardData.title) {
            fetchFromTMDB(cardData.title, cardData, function(data) {
                var cardView = cardElement.querySelector('.card__view');
                var titleElement = cardElement.querySelector('.card__title, .card__name, .title');
                var existingInfo = cardView.querySelector('.card__rating-year');
                
                if (existingInfo) {
                    existingInfo.remove();
                }
                
                var infoContainer = document.createElement('div');
                infoContainer.className = 'rating-year-container card__rating-year';
                
                var hasContent = false;
                
                if (data.rating && settings.rating === 'on') {
                    var ratingSpan = createRatingInline(data.rating);
                    if (ratingSpan) {
                        infoContainer.appendChild(ratingSpan);
                        hasContent = true;
                    }
                }
                
                if (data.year && settings.year === 'on') {
                    if (hasContent) {
                        var separator = document.createElement('span');
                        separator.className = 'year-separator';
                        separator.textContent = '•';
                        infoContainer.appendChild(separator);
                    }
                    
                    var yearSpan = createYearInline(data.year);
                    if (yearSpan) {
                        infoContainer.appendChild(yearSpan);
                        hasContent = true;
                    }
                }
                
                if (hasContent && cardView) {
                    if (titleElement) {
                        cardView.insertBefore(infoContainer, titleElement);
                    } else {
                        cardView.appendChild(infoContainer);
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
     * Создание инлайн-элемента рейтинга
     */
    function createRatingInline(rating) {
        if (!rating || isNaN(rating)) return null;

        var container = document.createElement('span');
        
        var star = document.createElement('span');
        star.className = 'rating-star';
        star.textContent = '★';
        
        var value = document.createElement('span');
        value.className = 'rating-value';
        value.textContent = rating.toFixed(1);
        
        container.appendChild(star);
        container.appendChild(value);
        
        return container;
    }

    /**
     * Создание инлайн-элемента года
     */
    function createYearInline(year) {
        if (!year) return null;

        var span = document.createElement('span');
        span.className = 'year-value';
        span.textContent = year;
        
        return span;
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
                default: 'inline',
                values: {
                    'inline': 'Рядом с названием'
                }
            },
            onChange: function(value) {
                // Позиция всегда inline для этого формата
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
