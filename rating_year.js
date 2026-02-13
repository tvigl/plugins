(function() {
    'use strict';
    
    console.log('Начинаем загрузку плагина рейтинга и года...');
    
    // Защита от повторного запуска
    if (window.RatingYearPlugin && window.RatingYearPlugin.__initialized) {
        console.log('Плагин уже загружен');
        return;
    }
    
    window.RatingYearPlugin = window.RatingYearPlugin || {};
    window.RatingYearPlugin.__initialized = true;

    // === КОНФИГУРАЦИЯ ===
    var CONFIG = {
        PLUGIN_NAME: 'rating_year_plugin',
        VERSION: '1.0.0',
        TMDB_API_KEY: '9d8a720823d2b3a8390f597478a2e8ec',
        CACHE_TIME: 12 * 60 * 60 * 1000
    };

    // === НАСТРОЙКИ ПО УМОЛЧАНИЮ ===
    var settings = {
        rating: 'on',
        year: 'on'
    };

    // === КЭШ ДЛЯ ДАННЫХ TMDB ===
    var cache = {
        data: {},
        get: function(key) {
            try {
                var item = this.data[key];
                if (item && Date.now() - item.timestamp < CONFIG.CACHE_TIME) {
                    return item.data;
                }
            } catch (e) {
                console.error('Ошибка кэша:', e);
            }
            return null;
        },
        set: function(key, data) {
            try {
                this.data[key] = {
                    data: data,
                    timestamp: Date.now()
                };
            } catch (e) {
                console.error('Ошибка сохранения кэша:', e);
            }
        }
    };

    /**
     * Добавление CSS стилей
     */
    function addStyles() {
        try {
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

                .card__title {
                    order: 3;
                    margin-top: 2px;
                }

                .card__rating-year {
                    order: 2;
                    margin: 2px 0;
                }

                .card__view {
                    display: flex;
                    flex-direction: column;
                }

                .card__poster {
                    order: 1;
                }

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
            
            console.log('Стили добавлены');
        } catch (e) {
            console.error('Ошибка добавления стилей:', e);
        }
    }

    /**
     * Обработка существующих карточек
     */
    function processExistingCards() {
        try {
            // Ищем карточки по разным селекторам
            var selectors = [
                '.card',
                '.card--view', 
                '.card--category',
                '.card-item',
                '[class*="card"]',
                '.movie-card',
                '.poster-item'
            ];
            
            var allCards = [];
            for (var s = 0; s < selectors.length; s++) {
                var cards = document.querySelectorAll(selectors[s]);
                for (var c = 0; c < cards.length; c++) {
                    if (allCards.indexOf(cards[c]) === -1) {
                        allCards.push(cards[c]);
                    }
                }
            }
            
            console.log('Найдено карточек:', allCards.length);
            
            for (var i = 0; i < allCards.length; i++) {
                processCard(allCards[i]);
            }
        } catch (e) {
            console.error('Ошибка обработки карточек:', e);
        }
    }

    /**
     * Обработка одной карточки
     */
    function processCard(cardElement) {
        try {
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
                    if (titleElement) {
                        cardView.insertBefore(infoContainer, titleElement);
                    } else {
                        cardView.appendChild(infoContainer);
                    }
                    console.log('Добавлен рейтинг/год для:', cardData.title);
                }
            }
        } catch (e) {
            console.error('Ошибка обработки карточки:', e);
        }
    }

    /**
     * Извлечение данных из карточки
     */
    function extractCardData(cardElement) {
        try {
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
            } else {
                // Ищем любой текстовый элемент
                var textElements = cardElement.querySelectorAll('*');
                for (var k = 0; k < textElements.length; k++) {
                    if (textElements[k].textContent && textElements[k].textContent.trim().length > 0) {
                        data.title = textElements[k].textContent.trim();
                        break;
                    }
                }
            }

            console.log('Карточка:', data.title, 'Элементы:', cardElement.className);

            // Получаем рейтинг из разных источников
            var ratingSources = [
                '.card__vote',
                '.card__rating', 
                '.rating',
                '[data-rating]',
                '[data-vote]',
                '[data-vote_average]'
            ];

            for (var i = 0; i < ratingSources.length; i++) {
                var ratingElement = cardElement.querySelector(ratingSources[i]);
                if (ratingElement) {
                    var ratingText = ratingElement.textContent || ratingElement.getAttribute('data-rating') || ratingElement.getAttribute('data-vote') || ratingElement.getAttribute('data-vote_average');
                    if (ratingText) {
                        var rating = parseFloat(ratingText.replace(',', '.').replace(/[^0-9.]/g, ''));
                        if (!isNaN(rating) && rating > 0 && rating <= 10) {
                            data.rating = rating;
                            console.log('Найден рейтинг:', rating, 'из источника:', ratingSources[i]);
                            break;
                        }
                    }
                }
            }

            // Получаем год из разных источников
            var yearSources = [
                '.card__year',
                '.card__age', 
                '.card__date',
                '[data-year]',
                '[data-release]',
                '[data-release_date]',
                '[data-first_air_date]'
            ];

            for (var j = 0; j < yearSources.length; j++) {
                var yearElement = cardElement.querySelector(yearSources[j]);
                if (yearElement) {
                    var yearText = yearElement.textContent || yearElement.getAttribute('data-year') || yearElement.getAttribute('data-release') || yearElement.getAttribute('data-release_date') || yearElement.getAttribute('data-first_air_date');
                    if (yearText) {
                        var yearMatch = yearText.match(/(19|20)\d{2}/);
                        if (yearMatch) {
                            data.year = parseInt(yearMatch[0], 10);
                            console.log('Найден год:', data.year, 'из источника:', yearSources[j]);
                            break;
                        }
                    }
                }
            }

            // Если данных нет, ищем в атрибутах самой карточки
            if (!data.rating && !data.year) {
                var allAttrs = cardElement.attributes;
                for (var l = 0; l < allAttrs.length; l++) {
                    var attrName = allAttrs[l].name;
                    var attrValue = allAttrs[l].value;
                    
                    if (attrName.includes('rating') || attrName.includes('vote')) {
                        var rating = parseFloat(attrValue.replace(',', '.'));
                        if (!isNaN(rating) && rating > 0 && rating <= 10) {
                            data.rating = rating;
                            console.log('Найден рейтинг в атрибуте:', rating, attrName);
                        }
                    }
                    
                    if (attrName.includes('year') || attrName.includes('release')) {
                        var yearMatch = attrValue.match(/(19|20)\d{2}/);
                        if (yearMatch) {
                            data.year = parseInt(yearMatch[0], 10);
                            console.log('Найден год в атрибуте:', data.year, attrName);
                        }
                    }
                }
            }

            console.log('Итоговые данные:', data);
            return data.title ? data : null;
        } catch (e) {
            console.error('Ошибка извлечения данных:', e);
            return null;
        }
    }

    /**
     * Создание инлайн-элемента рейтинга
     */
    function createRatingInline(rating) {
        try {
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
        } catch (e) {
            console.error('Ошибка создания рейтинга:', e);
            return null;
        }
    }

    /**
     * Создание инлайн-элемента года
     */
    function createYearInline(year) {
        try {
            if (!year) return null;

            var span = document.createElement('span');
            span.className = 'year-value';
            span.textContent = year;
            
            return span;
        } catch (e) {
            console.error('Ошибка создания года:', e);
            return null;
        }
    }

    /**
     * Инициализация плагина
     */
    function init() {
        try {
            console.log('Инициализация плагина...');
            
            // Добавляем CSS стили
            addStyles();
            
            // Обрабатываем уже существующие карточки
            processExistingCards();
            
            // Наблюдаем за изменениями в DOM
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
            
            console.log('Плагин успешно инициализирован');
        } catch (e) {
            console.error('Ошибка инициализации:', e);
        }
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

    // Экспортируем функции для внешнего доступа
    window.RatingYearPlugin = {
        updateSettings: function(newSettings) {
            for (var key in newSettings) {
                if (settings.hasOwnProperty(key)) {
                    settings[key] = newSettings[key];
                }
            }
            processExistingCards();
        },
        getSettings: function() {
            return Object.assign({}, settings);
        },
        reprocess: function() {
            processExistingCards();
        }
    };

    console.log('Плагин рейтинга и года загружен');

})();
