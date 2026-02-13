(function () {
    'use strict';

    /**
     * Плагин для Lampa: Рейтинг и Год под постером
     * 
     * Особенности:
     * - Добавляет рейтинг и год отдельной строкой под постером
     * - Скрывает стандартное отображение года и рейтинга
     * - Сохраняет структуру: Постер -> Рейтинг/Год -> Название
     */

    function init() {
        // Добавляем стили для скрытия стандартных элементов и оформления новых
        var style = `
            /* Скрываем стандартные элементы года и рейтинга на карточках */
            .card__year, 
            .card__vote, 
            .card__rating,
            .card__view .card__vote,
            .card__view .card__rating {
                display: none !important;
            }

            /* Контейнер для нашего рейтинга и года */
            .card__rating-year-info {
                display: flex;
                align-items: center;
                gap: 10px;
                margin: 5px 0 2px 0;
                font-size: 1.1em;
                font-weight: 500;
                line-height: 1;
            }

            /* Оформление значения рейтинга */
            .card__rating-year-info .rating-val {
                color: #ffc107; /* Золотистый цвет */
                font-weight: bold;
            }

            /* Оформление значения года */
            .card__rating-year-info .year-val {
                color: #fff;
                opacity: 0.7;
            }

            /* Корректировка отступа названия */
            .card__title {
                margin-top: 0 !important;
                padding-top: 0 !important;
                line-height: 1.2;
            }
        `;

        if (!document.getElementById('rating-year-styles')) {
            var styleEl = document.createElement('style');
            styleEl.id = 'rating-year-styles';
            styleEl.innerHTML = style;
            document.head.appendChild(styleEl);
        }

        /**
         * Функция обработки карточки
         * @param {HTMLElement} cardEl 
         */
        function processCard(cardEl) {
            if (!cardEl || cardEl.getAttribute('data-rating-year-processed')) return;

            // Получаем данные карточки
            var data = cardEl.card_data || {};
            
            // Если данных еще нет, пробуем подождать (как в click_theme)
            if (!cardEl.card_data && !cardEl.getAttribute('data-wait-data')) {
                cardEl.setAttribute('data-wait-data', 'true');
                setTimeout(function() { processCard(cardEl); }, 200);
                return;
            }

            var rating = data.vote_average || data.rating || data.rate || 0;
            var year = '';

            // Извлекаем год из различных полей данных
            if (data.release_date) year = data.release_date.split('-')[0];
            else if (data.first_air_date) year = data.first_air_date.split('-')[0];
            else if (data.year) year = data.year;
            else if (data.date) {
                var match = String(data.date).match(/\d{4}/);
                if (match) year = match[0];
            }

            // Фоллбэк: если в данных пусто, пробуем вытащить из DOM (пока не скрыли стилями)
            if (!rating) {
                var voteEl = cardEl.querySelector('.card__vote, .card__rating');
                if (voteEl) {
                    var voteText = voteEl.textContent.replace(',', '.');
                    rating = parseFloat(voteText) || 0;
                }
            }
            if (!year) {
                var yearEl = cardEl.querySelector('.card__year');
                if (yearEl) {
                    var yearMatch = yearEl.textContent.match(/\d{4}/);
                    if (yearMatch) year = yearMatch[0];
                }
            }

            // Если есть хотя бы что-то, добавляем наш блок
            if (rating || year) {
                var infoBlock = document.createElement('div');
                infoBlock.className = 'card__rating-year-info';
                
                var html = '';
                if (rating > 0) {
                    html += '<span class="rating-val">' + parseFloat(rating).toFixed(1) + '</span>';
                }
                if (year) {
                    html += '<span class="year-val">' + year + '</span>';
                }
                
                infoBlock.innerHTML = html;

                // Находим .card__view (постер) и .card__title
                var viewEl = cardEl.querySelector('.card__view');
                var titleEl = cardEl.querySelector('.card__title');

                if (viewEl && titleEl) {
                    // Вставляем между постером и названием
                    cardEl.insertBefore(infoBlock, titleEl);
                } else if (viewEl) {
                    // Если названия нет, просто после постера
                    viewEl.after(infoBlock);
                }

                cardEl.setAttribute('data-rating-year-processed', 'true');
            }
        }

        // MutationObserver для отслеживания появления новых карточек
        var observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.addedNodes.length) {
                    for (var i = 0; i < mutation.addedNodes.length; i++) {
                        var node = mutation.addedNodes[i];
                        if (node.nodeType === 1) { // Element
                            if (node.classList.contains('card')) {
                                processCard(node);
                            } else {
                                var cards = node.querySelectorAll('.card');
                                for (var j = 0; j < cards.length; j++) {
                                    processCard(cards[j]);
                                }
                            }
                        }
                    }
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Обрабатываем уже существующие карточки
        var existingCards = document.querySelectorAll('.card');
        for (var k = 0; k < existingCards.length; k++) {
            processCard(existingCards[k]);
        }
    }

    // Запуск при готовности Lampa
    function startPlugin() {
        if (window.Lampa && window.Lampa.Listener) {
            Lampa.Listener.follow('app', function (e) {
                if (e.type === 'ready') {
                    init();
                }
            });
        } else {
            // Фолбэк если Listener не доступен
            init();
        }
    }

    if (window.Lampa) {
        startPlugin();
    } else {
        document.addEventListener('lampa_ready', startPlugin);
    }
})();
