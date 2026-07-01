// @name AI Search Legacy User API
// @version 2.0.0
// @author tvigl.info
// @description AI assistant for Lampa/Lampac with user provider profiles
// @lampa-check Lampa.
(function () {
    'use strict';

    if (window.ai_search_legacy_user_api_ready) return;
    window.ai_search_legacy_user_api_ready = true;

    var VERSION = '2.0.0-user-api';
    var WATCH_ORDER_CACHE_VERSION = 'v2';
    var AI_SETTINGS_COMPONENT = 'ai_search_legacy_user_api';
    var AI_ACTIVE_PROFILE = 'ai_search_legacy_active_profile';
    var AI_TMDB_KEY = 'ai_search_legacy_tmdb_key';
    var AI_PROFILE_COUNT = 3;
    var AI_PROVIDER_PRESETS = {
        deepseek: { title: 'DeepSeek', base: 'https://api.deepseek.com/v1', model: 'deepseek-chat', mode: 'openai' },
        openai: { title: 'OpenAI', base: 'https://api.openai.com/v1', model: 'gpt-4o-mini', mode: 'openai' },
        openrouter: { title: 'OpenRouter', base: 'https://openrouter.ai/api/v1', model: 'openai/gpt-4o-mini', mode: 'openai' },
        together: { title: 'Together', base: 'https://api.together.xyz/v1', model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo-Free', mode: 'openai' },
        groq: { title: 'Groq', base: 'https://api.groq.com/openai/v1', model: 'llama-3.1-8b-instant', mode: 'openai' },
        gemini: { title: 'Gemini', base: 'https://generativelanguage.googleapis.com/v1beta', model: 'gemini-1.5-flash', mode: 'gemini' },
        custom: { title: 'Custom', base: '', model: '', mode: 'openai' }
    };
    var TMDB_IMAGE = 'https://image.tmdb.org/t/p/w300';
    var TMDB_BACKDROP = 'https://image.tmdb.org/t/p/w780';
    var SCAN_TIMER = null;

    function storeGet(name, fallback) {
        try {
            if (window.Lampa && Lampa.Storage) {
                var value = Lampa.Storage.get(name, fallback);
                return value === undefined || value === null ? fallback : value;
            }
        } catch (e) {}
        try {
            var raw = window.localStorage ? localStorage.getItem(name) : null;
            return raw === undefined || raw === null ? fallback : raw;
        } catch (e) {}
        return fallback;
    }

    function storeSet(name, value) {
        try {
            if (window.Lampa && Lampa.Storage) {
                Lampa.Storage.set(name, value);
                return;
            }
        } catch (e) {}
        try { if (window.localStorage) localStorage.setItem(name, value); } catch (e) {}
    }

    function cleanValue(value) {
        return String(value === undefined || value === null ? '' : value).replace(/^\s+|\s+$/g, '');
    }

    function activeProfileNumber() {
        var num = parseInt(storeGet(AI_ACTIVE_PROFILE, '1'), 10);
        return num >= 1 && num <= AI_PROFILE_COUNT ? num : 1;
    }

    function activeProfile() {
        var num = activeProfileNumber();
        var prefix = 'ai_search_legacy_profile_' + num + '_';
        var provider = cleanValue(storeGet(prefix + 'provider', num === 1 ? 'deepseek' : 'custom')) || 'custom';
        var preset = AI_PROVIDER_PRESETS[provider] || AI_PROVIDER_PRESETS.custom;
        return {
            number: num,
            provider: provider,
            mode: preset.mode || 'openai',
            title: cleanValue(storeGet(prefix + 'title', preset.title || ('Profile ' + num))) || (preset.title || ('Profile ' + num)),
            base: cleanValue(storeGet(prefix + 'base', preset.base || '')),
            model: cleanValue(storeGet(prefix + 'model', preset.model || '')),
            key: cleanValue(storeGet(prefix + 'key', ''))
        };
    }

    function isKnownAiPresetValue(value, field) {
        value = cleanValue(value);
        if (!value) return true;

        for (var key in AI_PROVIDER_PRESETS) {
            if (!AI_PROVIDER_PRESETS.hasOwnProperty(key)) continue;
            if (key === 'custom') continue;
            if (cleanValue(AI_PROVIDER_PRESETS[key][field]) === value) return true;
        }

        return false;
    }

    function applyAiProviderPreset(prefix, provider, force) {
        provider = cleanValue(provider) || 'custom';

        var preset = AI_PROVIDER_PRESETS[provider] || AI_PROVIDER_PRESETS.custom;
        var currentBase = cleanValue(storeGet(prefix + 'base', ''));
        var currentModel = cleanValue(storeGet(prefix + 'model', ''));

        if (provider !== 'custom' && (force || isKnownAiPresetValue(currentBase, 'base'))) {
            storeSet(prefix + 'base', preset.base || '');
        }

        if (provider !== 'custom' && (force || isKnownAiPresetValue(currentModel, 'model'))) {
            storeSet(prefix + 'model', preset.model || '');
        }
    }

    function normalizeAiBase(base) {
        base = cleanValue(base).replace(/\/+$/, '');
        if (!base) return '';
        if (/\/chat\/completions$/i.test(base)) return base;
        return base + '/chat/completions';
    }

    function requireTmdbKey() {
        var key = cleanValue(storeGet(AI_TMDB_KEY, ''));
        if (!key) throw new Error('Добавьте ключ TMDB в Настройки → AI Поиск.');
        return key;
    }

    function aiKeyMessage() {
        return 'Добавьте API ключ активного AI-профиля в Настройки → AI Поиск.';
    }

    function tmdbKeyMessage() {
        return 'Добавьте ключ TMDB в Настройки → AI Поиск.';
    }

    function ensureAiReady() {
        var profile = activeProfile();

        if (!profile.key) {
            notify(aiKeyMessage());
            return false;
        }

        if (!profile.base) {
            notify('Выберите провайдера или укажите адрес сервиса в Настройки → AI Поиск.');
            return false;
        }

        if (!profile.model) {
            notify('Выберите провайдера или укажите модель в Настройки → AI Поиск.');
            return false;
        }

        return true;
    }

    function ensureTmdbReady() {
        if (!cleanValue(storeGet(AI_TMDB_KEY, ''))) {
            notify(tmdbKeyMessage());
            return false;
        }

        return true;
    }

    function ensureActionReady(action) {
        if (action === 'actor_movies') return ensureTmdbReady();
        if (action === 'facts' || action === 'spoiler_free_summary' || action === 'series_brief') return ensureAiReady();
        if (action === 'recommendations' || action === 'better_rated' || action === 'mood') return ensureAiReady() && ensureTmdbReady();
        if (action === 'watch_order') return ensureAiReady();

        return true;
    }

    function readAiContent(data) {
        try {
            if (data.choices && data.choices[0] && data.choices[0].message) return data.choices[0].message.content || '';
            if (data.choices && data.choices[0] && data.choices[0].text) return data.choices[0].text || '';
            if (data.output_text) return data.output_text;
            if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
                var out = [];
                for (var i = 0; i < data.candidates[0].content.parts.length; i++) out.push(data.candidates[0].content.parts[i].text || '');
                return out.join('');
            }
        } catch (e) {}
        return '';
    }

    var text = {
        ru: {
            ai_search: 'AI поиск',
            assistant: 'AI Ассистент',
            recommendations: 'Рекомендации',
            better_rated: 'Похожие, но лучше рейтингом',
            similar_same_rating: 'Похожие с таким же рейтингом',
            facts: 'Малоизвестные факты',
            spoiler_free_summary: 'Краткий пересказ без спойлеров',
            watch_order: 'Порядок просмотра',
            series_brief: 'Коротко о фильме/сериале',
            actor_movies: 'Работы актера',
            mood: 'По настроению',
            loading: 'Загрузка...',
            no_data: 'Нет данных о фильме',
            no_results: 'Ничего не найдено',
            no_better_results: 'Похожих фильмов с рейтингом выше не найдено',
            same_rating_fallback: 'Выше рейтингом не найдено, показываю похожие с таким же рейтингом',
            no_watch_order: 'Порядок просмотра не найден',
            standalone_watch_order: 'Для этого фильма/сериала не найдено обязательной франшизы или отдельного порядка просмотра.\n\nМожно смотреть как самостоятельную историю: дополнительных частей, приквелов или спин-оффов перед просмотром не требуется.',
            open: 'Открыть',
            close: 'Закрыть',
            choose_actor: 'Выберите актера',
            choose_mood: 'Выберите настроение',
            movies_found: 'Найдено',
            rating_from: 'Рейтинг выше',
            movie_type_movie: 'Фильм',
            movie_type_tv: 'Сериал',
            rating_votes: 'оценок',
            error: 'Ошибка',
            retry: 'Повторить',
            facts_title: 'Факты',
            summary_title: 'Краткий пересказ',
            watch_order_title: 'Порядок просмотра',
            series_brief_title: 'Коротко о сериале',
            movie_brief_title: 'Коротко о фильме',
            mood_comedy: 'Хочу посмеяться / Комедия',
            mood_drama: 'Хочу драму',
            mood_thriller: 'Триллер и напряжение',
            mood_inspiring: 'Вдохновение',
            mood_romantic: 'Романтика',
            mood_mystery: 'Детектив / Загадка',
            mood_adventure: 'Приключения',
            mood_horror: 'Ужасы',
            mood_cozy: 'Уютный вечер',
            mood_scifi: 'Фантастика'
        },
        uk: {
            ai_search: 'AI пошук',
            assistant: 'AI Асистент',
            recommendations: 'Рекомендації',
            better_rated: 'Схожі, але з кращим рейтингом',
            similar_same_rating: 'Схожі з таким самим рейтингом',
            facts: 'Маловідомі факти',
            spoiler_free_summary: 'Короткий переказ без спойлерів',
            watch_order: 'Порядок перегляду',
            series_brief: 'Коротко про фільм/серіал',
            actor_movies: 'Роботи актора',
            mood: 'За настроєм',
            loading: 'Завантаження...',
            no_data: 'Немає даних про фільм',
            no_results: 'Нічого не знайдено',
            no_better_results: 'Схожих фільмів з вищим рейтингом не знайдено',
            same_rating_fallback: 'Вище рейтингом не знайдено, показую схожі з таким самим рейтингом',
            no_watch_order: 'Порядок перегляду не знайдено',
            standalone_watch_order: 'Для цього фільму/серіалу не знайдено обов’язкової франшизи або окремого порядку перегляду.\n\nМожна дивитися як самостійну історію: додаткові частини, приквели або спін-офи перед переглядом не потрібні.',
            open: 'Відкрити',
            close: 'Закрити',
            choose_actor: 'Виберіть актора',
            choose_mood: 'Виберіть настрій',
            movies_found: 'Знайдено',
            rating_from: 'Рейтинг вище',
            movie_type_movie: 'Фільм',
            movie_type_tv: 'Серіал',
            rating_votes: 'оцінок',
            error: 'Помилка',
            retry: 'Повторити',
            facts_title: 'Факти',
            summary_title: 'Короткий переказ',
            watch_order_title: 'Порядок перегляду',
            series_brief_title: 'Коротко про серіал',
            movie_brief_title: 'Коротко про фільм',
            mood_comedy: 'Хочу посміятися / Комедія',
            mood_drama: 'Хочу драму',
            mood_thriller: 'Трилер і напруга',
            mood_inspiring: 'Натхнення',
            mood_romantic: 'Романтика',
            mood_mystery: 'Детектив / Загадка',
            mood_adventure: 'Пригоди',
            mood_horror: 'Жахи',
            mood_cozy: 'Затишний вечір',
            mood_scifi: 'Фантастика'
        },
        en: {
            ai_search: 'AI Search',
            assistant: 'AI Assistant',
            recommendations: 'Recommendations',
            better_rated: 'Similar, but better rated',
            similar_same_rating: 'Similar with same rating',
            facts: 'Unknown facts',
            spoiler_free_summary: 'Short spoiler-free summary',
            watch_order: 'Watch order',
            series_brief: 'Movie/series brief',
            actor_movies: 'Actor works',
            mood: 'By mood',
            loading: 'Loading...',
            no_data: 'No movie data',
            no_results: 'Nothing found',
            no_better_results: 'No similar higher-rated titles found',
            same_rating_fallback: 'No higher-rated titles found, showing similar titles with the same rating',
            no_watch_order: 'Watch order not found',
            standalone_watch_order: 'No required franchise or special watch order was found for this movie/series.\n\nYou can watch it as a standalone story: no prequels, sequels, or spin-offs are required before watching.',
            open: 'Open',
            close: 'Close',
            choose_actor: 'Choose actor',
            choose_mood: 'Choose mood',
            movies_found: 'Found',
            rating_from: 'Rating above',
            movie_type_movie: 'Movie',
            movie_type_tv: 'TV',
            rating_votes: 'ratings',
            error: 'Error',
            retry: 'Retry',
            facts_title: 'Facts',
            summary_title: 'Short summary',
            watch_order_title: 'Watch order',
            series_brief_title: 'Series brief',
            movie_brief_title: 'Movie brief',
            mood_comedy: 'Want to laugh / Comedy',
            mood_drama: 'Drama',
            mood_thriller: 'Thriller and tension',
            mood_inspiring: 'Inspiring',
            mood_romantic: 'Romance',
            mood_mystery: 'Mystery',
            mood_adventure: 'Adventure',
            mood_horror: 'Horror',
            mood_cozy: 'Cozy evening',
            mood_scifi: 'Sci-Fi'
        }
    };

    function log() {
        if (!window.ai_search_debug || !window.console) return;
        try { console.log.apply(console, arguments); } catch (e) {}
    }

    function currentLang() {
        var lang = 'ru';
        try {
            if (window.Lampa && Lampa.Lang && Lampa.Lang.select) lang = Lampa.Lang.select;
            else if (window.Lampa && Lampa.Storage) lang = Lampa.Storage.field('language') || 'ru';
        } catch (e) {}

        if (lang !== 'ru' && lang !== 'uk' && lang !== 'en') lang = 'ru';
        return lang;
    }

    function t(key) {
        var lang = currentLang();
        return (text[lang] && text[lang][key]) || text.ru[key] || key;
    }

    function aiLang() {
        var lang = currentLang();
        if (lang === 'uk') return 'Ukrainian';
        if (lang === 'en') return 'English';
        return 'Russian';
    }

    function tmdbLang() {
        var lang = currentLang();
        if (lang === 'uk') return 'uk-UA';
        if (lang === 'en') return 'en-US';
        return 'ru-RU';
    }

    function safeString(value) {
        if (value === null || value === undefined) return '';
        return String(value);
    }

    function trim(value) {
        return safeString(value).replace(/^\s+|\s+$/g, '');
    }

    function stripHtml(value) {
        return trim(safeString(value).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' '));
    }

    function notify(message) {
        try {
            if (window.Lampa && Lampa.Noty) Lampa.Noty.show(message);
            else alert(message);
        } catch (e) {}
    }

    function showLoading() {
        hideLoading();
        var html = '<div class="ai-legacy-loading selector"><div class="ai-legacy-loading__box">' +
            '<div class="ai-legacy-loading__dot"></div><div class="ai-legacy-loading__text">' + t('loading') + '</div>' +
            '</div></div>';
        $('body').append(html);
    }

    function hideLoading() {
        $('.ai-legacy-loading').remove();
    }

    function xhrJson(method, url, body, headers, success, fail) {
        var xhr = new XMLHttpRequest();
        var done = false;

        xhr.onreadystatechange = function () {
            if (xhr.readyState !== 4 || done) return;
            done = true;

            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    success(JSON.parse(xhr.responseText || '{}'));
                } catch (e) {
                    fail(e);
                }
            } else {
                fail(new Error('HTTP ' + xhr.status));
            }
        };

        xhr.onerror = function () {
            if (done) return;
            done = true;
            fail(new Error('Network error'));
        };

        xhr.ontimeout = function () {
            if (done) return;
            done = true;
            fail(new Error('Timeout'));
        };

        try {
            xhr.open(method, url, true);
            xhr.timeout = 35000;
            if (headers) {
                for (var k in headers) if (headers.hasOwnProperty(k)) xhr.setRequestHeader(k, headers[k]);
            }
            xhr.send(body ? JSON.stringify(body) : null);
        } catch (e) {
            fail(e);
        }
    }

    function deepSeek(prompt, system, maxTokens, success, fail, temperature) {
        var profile = activeProfile();
        if (!profile.key) return fail(new Error(aiKeyMessage()));
        if (!profile.base) return fail(new Error('Укажите адрес сервиса в Настройки → AI Поиск.'));
        if (!profile.model) return fail(new Error('Укажите модель в Настройки → AI Поиск.'));

        var body;
        var url;
        var headers = { 'Content-Type': 'application/json' };

        if (profile.mode === 'gemini') {
            url = profile.base.replace(/\/+$/, '') + '/models/' + encodeURIComponent(profile.model) + ':generateContent?key=' + encodeURIComponent(profile.key);
            body = {
                contents: [{ role: 'user', parts: [{ text: (system ? system + '\n\n' : '') + prompt }] }],
                generationConfig: {
                    maxOutputTokens: maxTokens || 1300,
                    temperature: typeof temperature === 'number' ? temperature : 0.65
                }
            };
        } else {
            url = normalizeAiBase(profile.base);
            headers.Authorization = 'Bearer ' + profile.key;
            body = {
                model: profile.model,
                messages: [
                    { role: 'system', content: system || 'You are a helpful film expert. Return accurate and concise answers.' },
                    { role: 'user', content: prompt }
                ],
                temperature: typeof temperature === 'number' ? temperature : 0.65,
                max_tokens: maxTokens || 1300
            };
        }

        xhrJson('POST', url, body, headers, function (data) {
            var content = readAiContent(data);
            if (!content) fail(new Error('Empty AI response'));
            else success(content);
        }, fail);
    }

    function tmdbGet(path, params, success, fail) {
        params = params || {};
        try {
            params.api_key = requireTmdbKey();
        } catch (e) {
            if (fail) fail(e);
            else notify(e.message || tmdbKeyMessage());
            return;
        }
        params.language = params.language || tmdbLang();

        var query = [];
        for (var k in params) {
            if (params.hasOwnProperty(k) && params[k] !== undefined && params[k] !== null && params[k] !== '') {
                query.push(encodeURIComponent(k) + '=' + encodeURIComponent(params[k]));
            }
        }

        xhrJson('GET', 'https://api.themoviedb.org/3/' + path + '?' + query.join('&'), null, null, success, fail);
    }

    function getActiveMovie() {
        var data = {
            title: '',
            original_title: '',
            year: '',
            id: '',
            media_type: 'movie',
            overview: '',
            genres: '',
            cast: '',
            director: '',
            poster_path: '',
            backdrop_path: '',
            rating: ''
        };

        try {
            var active = window.Lampa && Lampa.Activity ? Lampa.Activity.active() : null;
            if (active) {
                data.id = active.id || '';
                data.media_type = active.method || active.media_type || 'movie';

                if (active.card) {
                    var c = active.card;
                    data.title = c.title || c.name || '';
                    data.original_title = c.original_title || c.original_name || '';
                    data.overview = c.overview || '';
                    data.poster_path = c.poster_path || '';
                    data.backdrop_path = c.backdrop_path || '';
                    data.rating = c.vote_average || '';

                    var date = c.release_date || c.first_air_date || '';
                    if (date) data.year = safeString(date).split('-')[0];

                    if (c.genres && c.genres.length) data.genres = joinNames(c.genres, 'name', 6);
                    if (c.credits && c.credits.cast && c.credits.cast.length) data.cast = joinNames(c.credits.cast, 'name', 8);
                    if (c.credits && c.credits.crew && c.credits.crew.length) data.director = crewByJob(c.credits.crew, 'Director');
                }
            }
        } catch (e) {
            log('activity data error', e);
        }

        if (!data.title) data.title = stripHtml($('.full-start-new__title, .full-start__title, .full__title').first().text());
        if (!data.year) {
            var details = stripHtml($('.full-start-new__details, .full-start__details, .full__details').first().text());
            var m = details.match(/\b(19|20)\d{2}\b/);
            if (m) data.year = m[0];
        }

        if (!data.media_type || data.media_type === 'tvshow') data.media_type = 'tv';
        if (data.media_type !== 'movie' && data.media_type !== 'tv') data.media_type = 'movie';
        return data;
    }

    function joinNames(arr, key, limit) {
        var out = [];
        var i;
        for (i = 0; arr && i < arr.length && out.length < limit; i++) {
            if (arr[i] && arr[i][key]) out.push(arr[i][key]);
        }
        return out.join(', ');
    }

    function crewByJob(crew, job) {
        var out = [];
        var i;
        for (i = 0; crew && i < crew.length; i++) {
            if (crew[i] && crew[i].job === job && crew[i].name) out.push(crew[i].name);
        }
        return out.join(', ');
    }

    function movieInfo(movie) {
        var lines = [];
        if (movie.title) lines.push('Title: ' + movie.title);
        if (movie.original_title && movie.original_title !== movie.title) lines.push('Original title: ' + movie.original_title);
        if (movie.year) lines.push('Year: ' + movie.year);
        if (movie.media_type) lines.push('Type: ' + movie.media_type);
        if (movie.genres) lines.push('Genres: ' + movie.genres);
        if (movie.director) lines.push('Director: ' + movie.director);
        if (movie.cast) lines.push('Cast: ' + movie.cast);
        if (movie.rating) lines.push('Rating: ' + movie.rating);
        if (movie.overview) lines.push('Overview: ' + movie.overview);
        return lines.join('\n');
    }

    function parseAIList(raw) {
        var textValue = safeString(raw);
        var json = '';
        var start = textValue.indexOf('[');
        var end = textValue.lastIndexOf(']');

        if (start >= 0 && end > start) {
            json = textValue.substring(start, end + 1);
            try {
                var arr = JSON.parse(json);
                return normalizeAIItems(arr);
            } catch (e) {}
        }

        var lines = textValue.split(/\n+/);
        var out = [];
        var i;
        for (i = 0; i < lines.length; i++) {
            var line = trim(lines[i].replace(/^\d+[\.\)]\s*/, '').replace(/^[-*]\s*/, ''));
            if (!line) continue;

            var year = '';
            var ym = line.match(/\b(19|20)\d{2}\b/);
            if (ym) year = ym[0];

            line = line.replace(/\((19|20)\d{2}\)/g, '').replace(/\b(19|20)\d{2}\b/g, '');
            line = trim(line.replace(/["']/g, ''));
            if (line) out.push({ title: line, year: year, type: '' });
            if (out.length >= 20) break;
        }
        return out;
    }

    function normalizeAIItems(arr) {
        var out = [];
        var i, item, title, year, type;
        for (i = 0; arr && i < arr.length; i++) {
            item = arr[i] || {};
            if (typeof item === 'string') item = { title: item };
            title = item.title || item.name || item.ru_title || item.original_title || '';
            year = item.year || item.release_year || '';
            type = item.type || item.media_type || '';
            if (title) out.push({ title: safeString(title), year: safeString(year), type: safeString(type) });
        }
        return out;
    }

    function parseWatchOrderList(raw) {
        var textValue = safeString(raw);
        var json = '';
        var start = textValue.indexOf('[');
        var end = textValue.lastIndexOf(']');

        if (start >= 0 && end > start) {
            json = textValue.substring(start, end + 1);
            try {
                return normalizeWatchOrderItems(JSON.parse(json));
            } catch (e) {}
        }

        return parseWatchOrderLines(textValue);
    }

    function normalizeWatchOrderItems(arr) {
        var out = [];
        var i, item, title, originalTitle, order, year, type, note;
        for (i = 0; arr && i < arr.length && out.length < 35; i++) {
            item = arr[i] || {};
            if (typeof item === 'string') item = { title: item };

            title = item.title || item.name || item.ru_title || item.original_title || '';
            if (!title) continue;
            originalTitle = item.original_title || item.original_name || item.en_title || '';

            order = parseInt(item.order || item.number || (out.length + 1), 10);
            if (!order || isNaN(order)) order = out.length + 1;

            year = item.year || item.release_year || '';
            type = item.type || item.media_type || '';
            note = item.note || item.comment || item.description || '';

            out.push({
                order: order,
                title: safeString(title),
                original_title: safeString(originalTitle),
                year: safeString(year),
                type: safeString(type),
                note: safeString(note)
            });
        }

        out.sort(function (a, b) {
            return a.order - b.order;
        });

        return out;
    }

    function parseWatchOrderLines(raw) {
        var lines = safeString(raw).split(/\n+/);
        var out = [];
        var i, line, year, ym, order, title, note, dashIndex;

        for (i = 0; i < lines.length && out.length < 35; i++) {
            line = trim(lines[i]);
            if (!line) continue;
            if (!/^\s*(\d+|[-*])[\.\)]?\s+/.test(line)) continue;

            order = out.length + 1;
            line = line.replace(/^\s*\d+[\.\)]?\s+/, '').replace(/^\s*[-*]\s+/, '');

            year = '';
            ym = line.match(/\b(19|20)\d{2}\b/);
            if (ym) year = ym[0];

            dashIndex = line.indexOf(' - ');
            if (dashIndex < 0) dashIndex = line.indexOf(' — ');
            if (dashIndex >= 0) {
                title = trim(line.substring(0, dashIndex));
                note = trim(line.substring(dashIndex + 3));
            } else {
                title = line;
                note = '';
            }

            title = trim(title.replace(/\((19|20)\d{2}\)/g, '').replace(/\b(19|20)\d{2}\b/g, '').replace(/["']/g, ''));
            if (title) out.push({ order: order, title: title, original_title: '', year: year, type: '', note: note });
        }

        return out;
    }

    function watchOrderCacheKey(movie) {
        var id = movie && movie.id ? movie.id : normalizeTitleForCompare(movie && movie.title);
        var type = movie && movie.media_type ? movie.media_type : 'movie';
        var lang = currentLang();
        return 'ai_search_legacy_watch_order_' + WATCH_ORDER_CACHE_VERSION + '_' + lang + '_' + type + '_' + id;
    }

    function getCachedWatchOrder(movie) {
        var raw, data, now;
        try {
            raw = window.localStorage ? localStorage.getItem(watchOrderCacheKey(movie)) : '';
            if (!raw) return null;
            data = JSON.parse(raw);
            now = new Date().getTime();
            if (!data || !data.time || !data.list || now - data.time > 30 * 24 * 60 * 60 * 1000) return null;
            return data.list;
        } catch (e) {
            return null;
        }
    }

    function setCachedWatchOrder(movie, list) {
        try {
            if (!window.localStorage || !list || !list.length) return;
            localStorage.setItem(watchOrderCacheKey(movie), JSON.stringify({
                time: new Date().getTime(),
                list: list
            }));
        } catch (e) {}
    }

    function isTrivialWatchOrder(movie, list) {
        var currentTitle, currentOriginal, onlyTitle, onlyOriginal;
        if (!list || list.length !== 1) return false;

        currentTitle = normalizeTitleForCompare(movie && movie.title);
        currentOriginal = normalizeTitleForCompare(movie && movie.original_title);
        onlyTitle = normalizeTitleForCompare(list[0] && list[0].title);
        onlyOriginal = normalizeTitleForCompare(list[0] && list[0].original_title);

        if (!onlyTitle && !onlyOriginal) return false;
        if (currentTitle && (onlyTitle === currentTitle || onlyOriginal === currentTitle)) return true;
        if (currentOriginal && (onlyTitle === currentOriginal || onlyOriginal === currentOriginal)) return true;

        return false;
    }

    function standaloneWatchOrderText(raw) {
        var value = trim(safeString(raw));
        if (!value || value === '[]' || value === '[ ]') return t('standalone_watch_order');
        if (/^\[\s*\]$/.test(value)) return t('standalone_watch_order');
        return value;
    }

    function selectMenu(title, items, onSelect) {
        try {
            Lampa.Select.show({
                title: title,
                items: items,
                onSelect: onSelect
            });
        } catch (e) {
            notify(title);
        }
    }

    function showAssistant() {
        var movie = getActiveMovie();
        if (!movie.title && !movie.id) {
            notify(t('no_data'));
            return;
        }

        window.ai_search_legacy_movie = movie;

        selectMenu(t('assistant'), [
            { title: t('recommendations'), action: 'recommendations' },
            { title: t('better_rated'), action: 'better_rated' },
            { title: t('facts'), action: 'facts' },
            { title: t('spoiler_free_summary'), action: 'spoiler_free_summary' },
            { title: t('watch_order'), action: 'watch_order' },
            { title: t('series_brief'), action: 'series_brief' },
            { title: t('actor_movies'), action: 'actor_movies' },
            { title: t('mood'), action: 'mood' }
        ], function (item) {
            if (!item) return;
            if (!ensureActionReady(item.action)) return;

            if (item.action === 'recommendations') getRecommendations(movie);
            else if (item.action === 'better_rated') getBetterRatedRecommendations(movie);
            else if (item.action === 'facts') getFacts(movie);
            else if (item.action === 'spoiler_free_summary') getSpoilerFreeSummary(movie);
            else if (item.action === 'watch_order') getWatchOrder(movie);
            else if (item.action === 'series_brief') getSeriesBrief(movie);
            else if (item.action === 'actor_movies') getActors(movie);
            else if (item.action === 'mood') showMoodMenu();
        });
    }

    function getRecommendations(movie) {
        showLoading();
        var prompt = 'Recommend 15 popular movies or TV series similar to this title.\n' +
            'Use ' + aiLang() + ' language for titles if possible.\n' +
            'Return ONLY valid JSON array. Format: [{"title":"Movie title","year":"2020","type":"movie"}].\n\n' +
            movieInfo(movie);

        deepSeek(prompt, 'You are an expert movie recommendation system. Recommend only real and well-known movies or series.', 1500, function (raw) {
            var list = parseAIList(raw);
            if (!list.length) {
                hideLoading();
                notify(t('no_results'));
                return;
            }
            findMoviesForList(list, 0, [], function (results) {
                hideLoading();
                showMovieResults(t('recommendations'), results);
            });
        }, function (err) {
            hideLoading();
            notify(t('error') + ': ' + err.message);
        });
    }

    function getBetterRatedRecommendations(movie) {
        showLoading();

        var currentRating = numericRating(movie.rating);
        var minRating = currentRating > 0 ? currentRating : 7.0;
        var prompt = 'Recommend 25 popular movies or TV series similar to this title, but with a higher audience/TMDB reputation.\n' +
            'Use ' + aiLang() + ' language for titles if possible.\n' +
            'Avoid obscure or barely rated titles. Prefer well-known movies and series with strong ratings.\n' +
            'The current title rating is about ' + (currentRating > 0 ? currentRating.toFixed(1) : 'unknown') + '.\n' +
            'Return ONLY valid JSON array. Format: [{"title":"Movie title","year":"2020","type":"movie"}].\n\n' +
            movieInfo(movie);

        deepSeek(prompt, 'You are an expert movie recommendation system. Recommend only real, well-known and highly rated movies or series.', 1800, function (raw) {
            var list = parseAIList(raw);
            if (!list.length) {
                hideLoading();
                notify(t('no_better_results'));
                return;
            }

            findBetterMoviesForList(list, 0, [], minRating, false, function (results) {
                hideLoading();
                results.sort(function (a, b) {
                    return numericRating(b.movie && b.movie.vote_average) - numericRating(a.movie && a.movie.vote_average);
                });

                if (!results.length) {
                    notify(t('same_rating_fallback'));
                    showLoading();
                    findBetterMoviesForList(list, 0, [], minRating, true, function (sameResults) {
                        hideLoading();
                        sameResults.sort(function (a, b) {
                            return numericRating(b.movie && b.movie.vote_average) - numericRating(a.movie && a.movie.vote_average);
                        });

                        if (!sameResults.length) {
                            notify(t('no_better_results') + ' (' + t('rating_from') + ' ' + minRating.toFixed(1) + ')');
                            return;
                        }

                        showMovieResults(t('similar_same_rating') + ' (' + minRating.toFixed(1) + ')', sameResults);
                    });
                    return;
                }

                showMovieResults(t('better_rated') + ' (' + t('rating_from') + ' ' + minRating.toFixed(1) + ')', results);
            });
        }, function (err) {
            hideLoading();
            notify(t('error') + ': ' + err.message);
        });
    }

    function showMoodMenu() {
        selectMenu(t('choose_mood'), [
            { title: t('mood_comedy'), mood: 'comedy' },
            { title: t('mood_drama'), mood: 'drama' },
            { title: t('mood_thriller'), mood: 'thriller' },
            { title: t('mood_inspiring'), mood: 'inspiring' },
            { title: t('mood_romantic'), mood: 'romantic' },
            { title: t('mood_mystery'), mood: 'mystery' },
            { title: t('mood_adventure'), mood: 'adventure' },
            { title: t('mood_horror'), mood: 'horror' },
            { title: t('mood_cozy'), mood: 'cozy' },
            { title: t('mood_scifi'), mood: 'scifi' }
        ], function (item) {
            if (item && item.mood) getMoodRecommendations(item.title);
        });
    }

    function getMoodRecommendations(moodTitle) {
        showLoading();
        var prompt = 'Recommend 15 popular movies or TV series for this mood: ' + moodTitle + '.\n' +
            'Use ' + aiLang() + ' language for titles if possible.\n' +
            'Return ONLY valid JSON array. Format: [{"title":"Movie title","year":"2020","type":"movie"}].';

        deepSeek(prompt, 'You are an expert movie recommendation system.', 1400, function (raw) {
            var list = parseAIList(raw);
            if (!list.length) {
                hideLoading();
                notify(t('no_results'));
                return;
            }
            findMoviesForList(list, 0, [], function (results) {
                hideLoading();
                showMovieResults(t('mood'), results);
            });
        }, function (err) {
            hideLoading();
            notify(t('error') + ': ' + err.message);
        });
    }

    function getFacts(movie) {
        showLoading();
        var prompt = 'Give exactly 7 interesting and little-known facts about this movie or TV series.\n' +
            'Write in ' + aiLang() + '. Be specific, concise and factual.\n\n' + movieInfo(movie);

        deepSeek(prompt, 'You are a careful film historian. Do not invent facts.', 1500, function (raw) {
            hideLoading();
            showTextScreen(t('facts_title') + ': ' + (movie.title || ''), raw);
        }, function (err) {
            hideLoading();
            notify(t('error') + ': ' + err.message);
        });
    }

    function getSpoilerFreeSummary(movie) {
        showLoading();
        var prompt = 'Write a short spoiler-free summary for this movie or TV series.\n' +
            'Write in ' + aiLang() + '.\n' +
            'Important rules:\n' +
            '1. Do not reveal the ending.\n' +
            '2. Do not reveal major twists, deaths, betrayals, secret identities, or final solutions.\n' +
            '3. Explain the premise, mood, genre, and why the story may be interesting.\n' +
            '4. Keep it clear and useful for a viewer deciding whether to watch.\n' +
            '5. Use 4-6 short paragraphs or bullet-like lines.\n\n' + movieInfo(movie);

        deepSeek(prompt, 'You write spoiler-free movie summaries. Never reveal endings or twists.', 1200, function (raw) {
            hideLoading();
            showTextScreen(t('summary_title') + ': ' + (movie.title || ''), raw);
        }, function (err) {
            hideLoading();
            notify(t('error') + ': ' + err.message);
        });
    }

    function getWatchOrder(movie) {
        var cachedList = getCachedWatchOrder(movie);
        if (cachedList && cachedList.length) {
            showLoading();
            findWatchOrderMoviesForList(cachedList, 0, [], function (cachedResults) {
                hideLoading();
                if (cachedResults && cachedResults.length) {
                    showMovieResults(t('watch_order_title') + ': ' + (movie.title || ''), cachedResults);
                } else {
                    showWatchOrderPlainList(movie, cachedList);
                }
            });
            return;
        }

        showLoading();
        requestWatchOrder(movie, false);
    }

    function requestWatchOrder(movie, retryExpanded) {
        var prompt = 'Find the best watch order for this movie or TV series if it belongs to a franchise, universe, saga, remake chain, or has sequels/prequels/spin-offs.\n' +
            'Write in ' + aiLang() + '.\n' +
            'Important rules:\n' +
            '1. Return one canonical recommended order for a first-time viewer. Do not provide alternatives.\n' +
            '2. Include the connected parent franchise, original main series, prequels, sequels, spin-offs, and specials when they are meaningfully connected.\n' +
            '3. Keep it spoiler-free. Do not reveal endings or major twists.\n' +
            '4. Add short notes like "optional", "spin-off", "watch after season 2", or "can be skipped" when useful, but do not create separate duplicate rows for seasons.\n' +
            '5. If this title is standalone and has no useful franchise watch order, return an empty JSON array: [].\n' +
            '6. Do not repeat the same movie or the same TV series twice. Do not split seasons into duplicate title rows unless the season is a separate TMDB title.\n' +
            '7. If the current title is a prequel or spin-off, include the original main title too.\n' +
            '8. Do not return only the current title when a larger franchise exists.\n' +
            '9. Return ONLY valid JSON array, no markdown and no explanation.\n' +
            'Use original English title in "original_title" when you know it.\n' +
            'Format: [{"order":1,"title":"Localized title","original_title":"Original English title","year":"1999","type":"movie","note":"main film"}].\n\n' +
            (retryExpanded ? 'The previous answer was too narrow. Expand to the whole connected franchise/universe and include the parent/original title if it exists.\n\n' : '') +
            movieInfo(movie);

        deepSeek(prompt, 'You are a film and TV franchise guide. Build accurate spoiler-free watch orders.', 1700, function (raw) {
            var list = parseWatchOrderList(raw);
            if (!list.length) {
                hideLoading();
                showTextScreen(t('watch_order_title') + ': ' + (movie.title || ''), standaloneWatchOrderText(raw));
                return;
            }

            if (!retryExpanded && isTrivialWatchOrder(movie, list)) {
                requestWatchOrder(movie, true);
                return;
            }

            setCachedWatchOrder(movie, list);
            findWatchOrderMoviesForList(list, 0, [], function (results) {
                hideLoading();
                if (!results.length) {
                    showWatchOrderPlainList(movie, list);
                    return;
                }

                showMovieResults(t('watch_order_title') + ': ' + (movie.title || ''), results);
            });
        }, function (err) {
            hideLoading();
            notify(t('error') + ': ' + err.message);
        }, 0.15);
    }

    function getSeriesBrief(movie) {
        showLoading();

        if (movie && movie.id) {
            tmdbGet('tv/' + movie.id, { append_to_response: 'content_ratings' }, function (data) {
                requestSeriesBrief(movie, data);
            }, function () {
                requestSeriesBrief(movie, null);
            });
        } else {
            requestSeriesBrief(movie, null);
        }
    }

    function requestSeriesBrief(movie, tmdbData) {
        var info = movieInfo(movie);
        var seasonsInfo = buildSeriesTmdbInfo(tmdbData);
        var isSeries = movie && movie.media_type === 'tv';
        var prompt = 'Create a concise spoiler-free viewer guide for this ' + (isSeries ? 'TV series' : 'movie') + '.\n' +
            'Write in ' + aiLang() + '.\n' +
            'Important rules:\n' +
            '1. For a series, say how many seasons and episodes are available when known.\n' +
            '2. For a series, say whether it is finished, ongoing, canceled, or unknown.\n' +
            '3. For a movie, say runtime/one-evening suitability when known and whether it is worth watching.\n' +
            '4. Explain whether it is worth starting/watching now and for whom.\n' +
            '5. For a series, mention if there is a known quality drop, weaker seasons, slow start, or strong later seasons, but avoid spoilers.\n' +
            '6. Keep it practical: 5-8 short lines.\n' +
            '7. Do not say that the function is only for series. Adapt the answer to the current type.\n\n' +
            info + (seasonsInfo ? '\n\nTMDB series data:\n' + seasonsInfo : '');

        deepSeek(prompt, 'You are a movie and TV guide. Give practical spoiler-free advice for viewers.', 1400, function (raw) {
            hideLoading();
            showTextScreen(briefTitle(movie) + ': ' + (movie.title || ''), raw);
        }, function (err) {
            hideLoading();
            notify(t('error') + ': ' + err.message);
        }, 0.35);
    }

    function briefTitle(movie) {
        return movie && movie.media_type === 'tv' ? t('series_brief_title') : t('movie_brief_title');
    }

    function buildSeriesTmdbInfo(data) {
        var lines = [];
        var seasons = [];
        var i, s, episodeCount;

        if (!data) return '';

        if (data.name) lines.push('Name: ' + data.name);
        if (data.original_name) lines.push('Original name: ' + data.original_name);
        if (data.status) lines.push('Status: ' + data.status);
        if (data.number_of_seasons !== undefined) lines.push('Seasons: ' + data.number_of_seasons);
        if (data.number_of_episodes !== undefined) lines.push('Episodes: ' + data.number_of_episodes);
        if (data.first_air_date) lines.push('First air date: ' + data.first_air_date);
        if (data.last_air_date) lines.push('Last air date: ' + data.last_air_date);
        if (data.vote_average) lines.push('TMDB rating: ' + data.vote_average);
        if (data.overview) lines.push('Overview: ' + data.overview);

        if (data.seasons && data.seasons.length) {
            for (i = 0; i < data.seasons.length && seasons.length < 12; i++) {
                s = data.seasons[i] || {};
                if (s.season_number === 0) continue;
                episodeCount = s.episode_count !== undefined ? s.episode_count : '?';
                seasons.push('S' + s.season_number + ': ' + episodeCount + ' eps' + (s.air_date ? ', ' + s.air_date : '') + (s.vote_average ? ', rating ' + s.vote_average : ''));
            }
            if (seasons.length) lines.push('Seasons detail: ' + seasons.join('; '));
        }

        return lines.join('\n');
    }

    function getActors(movie) {
        if (!movie.id) {
            notify(t('no_data'));
            return;
        }

        showLoading();
        tmdbGet(movie.media_type + '/' + movie.id, { append_to_response: 'credits' }, function (data) {
            hideLoading();
            var cast = data && data.credits && data.credits.cast ? data.credits.cast : [];
            var items = [];
            var i;
            for (i = 0; i < cast.length && items.length < 20; i++) {
                if (cast[i] && cast[i].id && cast[i].name) {
                    items.push({
                        title: cast[i].name,
                        subtitle: cast[i].character || '',
                        person_id: cast[i].id
                    });
                }
            }
            if (!items.length) {
                notify(t('no_results'));
                return;
            }
            selectMenu(t('choose_actor'), items, function (item) {
                if (item && item.person_id) getActorWorks(item);
            });
        }, function (err) {
            hideLoading();
            notify(t('error') + ': ' + err.message);
        });
    }

    function getActorWorks(actor) {
        showLoading();
        tmdbGet('person/' + actor.person_id + '/combined_credits', {}, function (data) {
            hideLoading();
            var cast = data && data.cast ? data.cast : [];
            var items = [];
            var seen = {};
            var i, it, id, title, date, year, score;

            cast.sort(function (a, b) {
                return (b.vote_count || 0) - (a.vote_count || 0);
            });

            for (i = 0; i < cast.length && items.length < 30; i++) {
                it = cast[i] || {};
                id = it.id + ':' + (it.media_type || 'movie');
                title = it.title || it.name || '';
                if (!it.id || !title || seen[id]) continue;
                seen[id] = true;
                date = it.release_date || it.first_air_date || '';
                year = date ? safeString(date).split('-')[0] : '';
                score = it.vote_average ? ' · ' + Number(it.vote_average).toFixed(1) : '';
                items.push(makeMovieItem({
                    id: it.id,
                    title: title,
                    name: title,
                    original_title: it.original_title || it.original_name || '',
                    media_type: it.media_type || 'movie',
                    poster_path: it.poster_path || '',
                    backdrop_path: it.backdrop_path || '',
                    release_date: it.release_date || '',
                    first_air_date: it.first_air_date || '',
                    vote_average: it.vote_average || 0,
                    overview: it.overview || ''
                }, year + score));
            }
            showMovieResults(actor.title, items);
        }, function (err) {
            hideLoading();
            notify(t('error') + ': ' + err.message);
        });
    }

    function findMoviesForList(list, index, results, done) {
        if (!list || index >= list.length || results.length >= 24) {
            done(results);
            return;
        }

        var item = list[index];
        var query = item.title || '';
        if (!query) {
            findMoviesForList(list, index + 1, results, done);
            return;
        }

        tmdbGet('search/multi', {
            query: query,
            include_adult: false,
            year: item.year || '',
            page: 1
        }, function (data) {
            var best = pickBestResult(data && data.results ? data.results : [], item);
            if (best) results.push(makeMovieItem(best, item.year || ''));
            findMoviesForList(list, index + 1, results, done);
        }, function () {
            findMoviesForList(list, index + 1, results, done);
        });
    }

    function findWatchOrderMoviesForList(list, index, results, done) {
        if (!list || index >= list.length || results.length >= 35) {
            done(results);
            return;
        }

        var item = list[index];
        if (!item || !item.title) {
            findWatchOrderMoviesForList(list, index + 1, results, done);
            return;
        }

        searchWatchOrderItem(item, 0, function (data) {
            var best = pickWatchOrderResult(data && data.results ? data.results : [], item);
            var menuItem;
            if (best) {
                if (!isDuplicateWatchOrderMovie(best, results)) {
                    menuItem = makeMovieItem(best, watchOrderSubtitle(item));
                    menuItem.title = formatOrderNumber(item.order) + '. ' + menuItem.title;
                    results.push(menuItem);
                }
            } else {
                if (!isDuplicateWatchOrderTitle(item, results)) {
                    results.push(makeWatchOrderPlainItem(item));
                }
            }
            findWatchOrderMoviesForList(list, index + 1, results, done);
        }, function () {
            if (!isDuplicateWatchOrderTitle(item, results)) {
                results.push(makeWatchOrderPlainItem(item));
            }
            findWatchOrderMoviesForList(list, index + 1, results, done);
        });
    }

    function isDuplicateWatchOrderMovie(movie, results) {
        var i, item, existing;
        for (i = 0; results && i < results.length; i++) {
            item = results[i] || {};
            existing = item.movie;
            if (!existing) continue;
            if (existing.id === movie.id && (existing.media_type || '') === (movie.media_type || '')) return true;
        }
        return false;
    }

    function isDuplicateWatchOrderTitle(watchItem, results) {
        var i, item, title, existingTitle;
        title = normalizeTitleForCompare(watchItem && (watchItem.title || watchItem.original_title));
        if (!title) return false;

        for (i = 0; results && i < results.length; i++) {
            item = results[i] || {};
            if (item.movie) {
                existingTitle = normalizeTitleForCompare(item.movie.title || item.movie.name || item.movie.original_title || item.movie.original_name);
            } else {
                existingTitle = normalizeTitleForCompare(item.title);
            }
            if (existingTitle && existingTitle === title) return true;
        }
        return false;
    }

    function normalizeTitleForCompare(value) {
        return trim(safeString(value).toLowerCase()
            .replace(/^\d+[\.\)]\s*/, '')
            .replace(/[«»"']/g, '')
            .replace(/\s+/g, ' '));
    }

    function searchWatchOrderItem(item, attempt, success, fail) {
        var queries = [];
        if (item.title) queries.push({ query: item.title, year: item.year || '' });
        if (item.original_title && item.original_title !== item.title) queries.push({ query: item.original_title, year: item.year || '' });
        if (item.title && item.year) queries.push({ query: item.title, year: '' });
        if (item.original_title && item.original_title !== item.title && item.year) queries.push({ query: item.original_title, year: '' });

        if (!queries.length || attempt >= queries.length) {
            fail();
            return;
        }

        tmdbGet('search/multi', {
            query: queries[attempt].query,
            include_adult: false,
            year: queries[attempt].year,
            page: 1
        }, function (data) {
            if (data && data.results && data.results.length) success(data);
            else searchWatchOrderItem(item, attempt + 1, success, fail);
        }, function () {
            searchWatchOrderItem(item, attempt + 1, success, fail);
        });
    }

    function findBetterMoviesForList(list, index, results, minRating, allowSameRating, done) {
        if (!list || index >= list.length || results.length >= 18) {
            done(results);
            return;
        }

        var item = list[index];
        var query = item.title || '';
        if (!query) {
            findBetterMoviesForList(list, index + 1, results, minRating, allowSameRating, done);
            return;
        }

        tmdbGet('search/multi', {
            query: query,
            include_adult: false,
            year: item.year || '',
            page: 1
        }, function (data) {
            var best = pickBetterResult(data && data.results ? data.results : [], item, minRating, allowSameRating, results);
            if (best) {
                results.push(makeMovieItem(best, betterSubtitle(best, minRating)));
            }
            findBetterMoviesForList(list, index + 1, results, minRating, allowSameRating, done);
        }, function () {
            findBetterMoviesForList(list, index + 1, results, minRating, allowSameRating, done);
        });
    }

    function pickBestResult(results, expected) {
        var i, r, type, title;
        for (i = 0; results && i < results.length; i++) {
            r = results[i];
            type = r.media_type || '';
            if (type !== 'movie' && type !== 'tv') continue;
            title = r.title || r.name || '';
            if (!title) continue;
            return r;
        }
        return null;
    }

    function pickWatchOrderResult(results, expected) {
        var i, r, type, title, year, rating, score, best, bestScore, expectedYear;
        best = null;
        bestScore = -1;
        expectedYear = safeString(expected && expected.year);

        for (i = 0; results && i < results.length; i++) {
            r = results[i];
            type = r.media_type || '';
            if (type !== 'movie' && type !== 'tv') continue;

            title = r.title || r.name || '';
            if (!title) continue;

            year = safeString(r.release_date || r.first_air_date).split('-')[0];
            rating = numericRating(r.vote_average);
            score = numericRating(r.popularity) + rating * 4 + numericRating(r.vote_count) / 400;

            if (expectedYear && year === expectedYear) score += 50;
            if (expected && expected.type && normalizeMediaType(expected.type) === type) score += 20;

            if (score > bestScore) {
                bestScore = score;
                best = r;
            }
        }

        return best;
    }

    function pickBetterResult(results, expected, minRating, allowSameRating, selected) {
        var i, r, type, title, rating, votes, currentBest, currentScore, score;
        currentBest = null;
        currentScore = -1;

        for (i = 0; results && i < results.length; i++) {
            r = results[i];
            type = r.media_type || '';
            if (type !== 'movie' && type !== 'tv') continue;

            title = r.title || r.name || '';
            if (!title || isDuplicateMovie(r, selected)) continue;

            rating = numericRating(r.vote_average);
            votes = numericRating(r.vote_count);
            if (allowSameRating) {
                if (rating < Math.max(0, minRating - 0.15)) continue;
                if (rating > minRating + 0.25) continue;
            } else {
                if (rating <= minRating) continue;
            }
            if (votes > 0 && votes < 80) continue;

            score = rating * 100 + Math.min(votes, 2000) / 40 + numericRating(r.popularity) / 10;
            if (score > currentScore) {
                currentScore = score;
                currentBest = r;
            }
        }

        return currentBest;
    }

    function isDuplicateMovie(movie, selected) {
        var i, item;
        for (i = 0; selected && i < selected.length; i++) {
            item = selected[i] && selected[i].movie;
            if (!item) continue;
            if (item.id === movie.id && (item.media_type || '') === (movie.media_type || '')) return true;
        }
        return false;
    }

    function numericRating(value) {
        var n;
        if (value === null || value === undefined || value === '') return 0;
        n = parseFloat(safeString(value).replace(',', '.'));
        return isNaN(n) ? 0 : n;
    }

    function normalizeMediaType(value) {
        value = safeString(value).toLowerCase();
        if (value === 'tv' || value === 'series' || value === 'show' || value === 'serial') return 'tv';
        return 'movie';
    }

    function formatOrderNumber(value) {
        var n = parseInt(value, 10);
        if (!n || isNaN(n)) n = 1;
        return n < 10 ? '0' + n : safeString(n);
    }

    function watchOrderSubtitle(item) {
        var parts = [];
        if (item && item.note) parts.push(item.note);
        if (item && item.type) parts.push(normalizeMediaType(item.type) === 'tv' ? t('movie_type_tv') : t('movie_type_movie'));
        return parts.join(' · ');
    }

    function betterSubtitle(movie, minRating) {
        var rating = numericRating(movie.vote_average);
        var votes = numericRating(movie.vote_count);
        var diff = rating - minRating;
        var arrow = diff >= 0 ? '↑' : '↓';
        var parts = [];

        if (rating > 0) parts.push(arrow + ' ' + Math.abs(diff).toFixed(1));
        if (votes > 0) parts.push(formatNumber(Math.round(votes)) + ' ' + t('rating_votes'));

        return parts.join(' · ');
    }

    function formatNumber(value) {
        var s = safeString(value);
        return s.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    }

    function makeMovieItem(movie, extra) {
        var title = movie.title || movie.name || '';
        var date = movie.release_date || movie.first_air_date || '';
        var year = date ? safeString(date).split('-')[0] : '';
        var rating = movie.vote_average ? Number(movie.vote_average).toFixed(1) : '';
        var subtitle = [];
        if (year) subtitle.push(year);
        if (movie.media_type) subtitle.push(movie.media_type === 'tv' ? t('movie_type_tv') : t('movie_type_movie'));
        if (rating) subtitle.push('TMDB ' + rating);
        if (extra) subtitle.push(extra);

        return {
            title: title,
            subtitle: subtitle.join(' · '),
            movie: movie,
            id: movie.id,
            media_type: movie.media_type || (movie.name ? 'tv' : 'movie')
        };
    }

    function showMovieResults(title, items) {
        if (!items || !items.length) {
            notify(t('no_results'));
            return;
        }

        selectMenu(title + ' · ' + t('movies_found') + ': ' + items.length, items, function (item) {
            if (item && item.movie) openMovie(item.movie);
            else if (item && item.notice) notify(item.notice);
        });
    }

    function showWatchOrderPlainList(movie, list) {
        var items = [];
        var i;
        for (i = 0; list && i < list.length; i++) {
            items.push(makeWatchOrderPlainItem(list[i]));
        }
        if (!items.length) {
            notify(t('no_watch_order'));
            return;
        }
        showMovieResults(t('watch_order_title') + ': ' + (movie.title || ''), items);
    }

    function makeWatchOrderPlainItem(item) {
        var title = formatOrderNumber(item.order) + '. ' + (item.title || item.original_title || t('no_data'));
        var parts = [];
        if (item.year) parts.push(item.year);
        if (item.type) parts.push(normalizeMediaType(item.type) === 'tv' ? t('movie_type_tv') : t('movie_type_movie'));
        if (item.note) parts.push(item.note);

        return {
            title: title,
            subtitle: parts.join(' · '),
            notice: t('no_results')
        };
    }

    function openMovie(movie) {
        try {
            var method = movie.media_type || (movie.name ? 'tv' : 'movie');
            var card = {
                id: movie.id,
                title: movie.title,
                name: movie.name,
                original_title: movie.original_title,
                original_name: movie.original_name,
                poster_path: movie.poster_path,
                backdrop_path: movie.backdrop_path,
                release_date: movie.release_date,
                first_air_date: movie.first_air_date,
                vote_average: movie.vote_average,
                overview: movie.overview
            };
            Lampa.Activity.push({
                url: '',
                title: movie.title || movie.name || '',
                component: 'full',
                id: movie.id,
                method: method,
                source: 'tmdb',
                card: card
            });
            scheduleButtonScan();
        } catch (e) {
            notify(t('error') + ': ' + e.message);
        }
    }

    function showTextScreen(title, body) {
        var clean = safeString(body).replace(/\n{3,}/g, '\n\n');
        var html = '<div class="ai-legacy-modal selector">' +
            '<div class="ai-legacy-modal__box">' +
            '<div class="ai-legacy-modal__title">' + escapeHtml(title) + '</div>' +
            '<div class="ai-legacy-modal__body">' + formatText(clean) + '</div>' +
            '<div class="ai-legacy-modal__buttons">' +
            '<div class="selector ai-legacy-close">' + t('close') + '</div>' +
            '</div></div></div>';

        $('.ai-legacy-modal').remove();
        $('body').append(html);

        $('.ai-legacy-close').on('hover:enter click', function () {
            closeTextScreen();
        });

        try {
            Lampa.Controller.add('ai_legacy_modal', {
                toggle: function () {},
                enter: function () {
                    $('.ai-legacy-close').trigger('hover:enter');
                },
                up: function () {
                    scrollTextModal(-1);
                },
                down: function () {
                    scrollTextModal(1);
                },
                left: function () {
                    scrollTextModal(-1);
                },
                right: function () {
                    scrollTextModal(1);
                },
                back: function () {
                    closeTextScreen();
                }
            });
            Lampa.Controller.toggle('ai_legacy_modal');
            Lampa.Controller.collectionSet($('.ai-legacy-modal'));
            Lampa.Controller.collectionFocus($('.ai-legacy-close')[0], $('.ai-legacy-modal'));
        } catch (e) {}
    }

    function scrollTextModal(direction) {
        var body = $('.ai-legacy-modal__body');
        var current, step;
        if (!body.length) return;

        current = body.scrollTop();
        step = Math.max(80, Math.floor(body.height() * 0.55));
        body.scrollTop(current + step * direction);
    }

    function closeTextScreen() {
        $('.ai-legacy-modal').remove();
        try { Lampa.Controller.toggle('content'); } catch (e) {}
    }

    function escapeHtml(value) {
        return safeString(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function formatText(value) {
        var parts = safeString(value).split(/\n+/);
        var out = [];
        var i, line;
        for (i = 0; i < parts.length; i++) {
            line = trim(parts[i]);
            if (line) out.push('<p>' + formatInlineMarkdown(line) + '</p>');
        }
        return out.join('');
    }

    function formatInlineMarkdown(value) {
        var line = escapeHtml(value);

        line = line.replace(/^\s*[-*]\s+/, '');
        line = line.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        line = line.replace(/__([^_]+)__/g, '<strong>$1</strong>');
        line = line.replace(/\*([^*]+)\*/g, '<em>$1</em>');
        line = line.replace(/_([^_]+)_/g, '<em>$1</em>');

        return line;
    }

    function createButton(container) {
        if (!container || !container.length || container.find('.ai-search-legacy-button').length) return;

        var button = $('<div class="full-start__button selector ai-search-legacy-button" tabindex="0">' +
            '<span class="ai-search-legacy-button__icon">' +
            '<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">' +
            '<path d="M13.5 4.2l1.25 3.65 3.65 1.25-3.65 1.25-1.25 3.65-1.25-3.65L8.6 9.1l3.65-1.25 1.25-3.65z" fill="currentColor"/>' +
            '<path d="M20.2 2.8l.65 1.9 1.9.65-1.9.65-.65 1.9-.65-1.9-1.9-.65 1.9-.65.65-1.9z" fill="currentColor" opacity=".75"/>' +
            '<path d="M11.9 14.6a5.1 5.1 0 1 0 0 10.2 5.1 5.1 0 0 0 0-10.2zm0 2.15a2.95 2.95 0 1 1 0 5.9 2.95 2.95 0 0 1 0-5.9z" fill="currentColor"/>' +
            '<path d="M15.75 23.15l3.35 3.35" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>' +
            '</svg></span><span class="ai-search-legacy-button__text">' + t('ai_search') + '</span></div>');

        button.on('hover:enter click', function () {
            showAssistant();
        });

        container.append(button);
        refreshController(container);
    }

    function refreshController(container) {
        setTimeout(function () {
            try {
                if (window.Lampa && Lampa.Controller) {
                    var full = $('.full-start-new:visible, .full-start:visible, .full:visible').last();
                    if (!full.length) full = $('.full-start-new, .full-start, .full').last();
                    Lampa.Controller.collectionSet(full.length ? full : container);
                }
            } catch (e) {}
        }, 120);
    }

    function scanButton() {
        try {
            var container = findFullButtonsContainer();
            if (container && container.length) createButton(container);
        } catch (e) {}
    }

    function findFullButtonsContainer() {
        var containers = $('.full-start-new__buttons:visible, .full-start__buttons:visible, .full__buttons:visible');
        if (containers.length) return containers.last();

        containers = $('.full-start-new__buttons, .full-start__buttons, .full__buttons');
        if (containers.length) return containers.last();

        return $();
    }

    function scheduleButtonScan() {
        setTimeout(scanButton, 80);
        setTimeout(scanButton, 250);
        setTimeout(scanButton, 600);
        setTimeout(scanButton, 1200);
        setTimeout(scanButton, 2200);
    }

    function addStyles() {
        if ($('#ai-search-legacy-css').length) return;
        $('head').append('<style id="ai-search-legacy-css">' +
            '.ai-search-legacy-button{position:relative!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:12px!important;min-width:0!important;width:auto!important;height:66px!important;min-height:66px!important;padding:0 24px!important;border-radius:22px!important;border:1px solid rgba(109,216,255,.28)!important;background:linear-gradient(135deg,rgba(14,24,38,.74),rgba(18,25,46,.58))!important;color:#dff8ff!important;box-shadow:0 12px 34px rgba(0,0,0,.28),inset 0 1px 0 rgba(255,255,255,.10)!important;backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);transition:transform .16s ease,box-shadow .16s ease,border-color .16s ease,background .16s ease!important;overflow:hidden!important}' +
            '.ai-search-legacy-button:before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 22% 10%,rgba(100,221,255,.22),transparent 38%),radial-gradient(circle at 82% 88%,rgba(121,87,255,.18),transparent 42%);opacity:.9;pointer-events:none}' +
            '.ai-search-legacy-button__icon,.ai-search-legacy-button__text{position:relative;z-index:1;opacity:1!important;visibility:visible!important}' +
            '.ai-search-legacy-button__icon{display:flex!important;align-items:center!important;justify-content:center!important;width:36px!important;height:36px!important;min-width:36px!important;border-radius:13px;background:rgba(104,216,255,.20);color:#7ee7ff!important;box-shadow:inset 0 0 0 1px rgba(132,230,255,.28),0 0 18px rgba(104,216,255,.24)}' +
            '.ai-search-legacy-button__icon svg{display:block!important;width:28px!important;height:28px!important;opacity:1!important;filter:drop-shadow(0 0 10px rgba(104,216,255,.72))}' +
            '.ai-search-legacy-button__icon svg path{fill:currentColor;stroke:currentColor}' +
            '.ai-search-legacy-button__text{font-size:22px;font-weight:700;line-height:1;letter-spacing:0;color:#f5fdff;text-shadow:0 0 14px rgba(104,216,255,.18);white-space:nowrap}' +
            '.ai-search-legacy-button.focus,.ai-search-legacy-button.hover{transform:translateY(-2px) scale(1.035)!important;border-color:rgba(104,216,255,.78)!important;background:linear-gradient(135deg,rgba(24,51,76,.90),rgba(30,36,70,.74))!important;color:#fff!important;box-shadow:0 18px 44px rgba(0,0,0,.36),0 0 0 3px rgba(104,216,255,.18),0 0 26px rgba(104,216,255,.34)!important}' +
            '.ai-search-legacy-button.focus .ai-search-legacy-button__icon,.ai-search-legacy-button.hover .ai-search-legacy-button__icon{background:rgba(104,216,255,.22);color:#8ee7ff}' +
            '.ai-legacy-loading{position:fixed;left:0;right:0;top:0;bottom:0;z-index:99999;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center}' +
            '.ai-legacy-loading__box{min-width:260px;padding:34px 40px;border-radius:14px;background:#20242b;color:#fff;text-align:center;box-shadow:0 18px 60px rgba(0,0,0,.45)}' +
            '.ai-legacy-loading__dot{width:42px;height:42px;margin:0 auto 18px;border-radius:50%;border:5px solid rgba(104,216,255,.25);border-top-color:#68d8ff;animation:aiLegacySpin 1s linear infinite}' +
            '.ai-legacy-loading__text{font-size:24px;line-height:1.3}' +
            '@keyframes aiLegacySpin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}' +
            '.ai-legacy-modal{position:fixed;left:0;right:0;top:0;bottom:0;z-index:99998;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:4vw}' +
            '.ai-legacy-modal__box{width:780px;max-width:92vw;max-height:86vh;background:#20242b;color:#fff;border-radius:12px;box-shadow:0 20px 70px rgba(0,0,0,.5);display:flex;flex-direction:column;overflow:hidden}' +
            '.ai-legacy-modal__title{font-size:32px;line-height:1.2;padding:28px 34px;border-bottom:1px solid rgba(255,255,255,.08)}' +
            '.ai-legacy-modal__body{font-size:24px;line-height:1.35;padding:26px 34px;overflow:auto;-webkit-overflow-scrolling:touch}' +
            '.ai-legacy-modal__body p{margin:0 0 16px}' +
            '.ai-legacy-modal__body strong{font-weight:700;color:#fff}' +
            '.ai-legacy-modal__body em{font-style:italic;color:rgba(255,255,255,.88)}' +
            '.ai-legacy-modal__buttons{padding:18px 34px 28px;display:flex;justify-content:center}' +
            '.ai-legacy-close{font-size:22px;padding:14px 32px;border-radius:8px;background:#2d8cff;color:#fff;min-width:150px;text-align:center}' +
            '.ai-legacy-close.focus,.ai-legacy-close.hover{background:#58b9ff}' +
            '@media(max-width:700px){.ai-search-legacy-button{height:56px!important;min-height:56px!important;padding:0 18px!important;border-radius:18px!important;gap:10px!important}.ai-search-legacy-button__icon{width:30px;height:30px;border-radius:10px}.ai-search-legacy-button__text{font-size:19px}.ai-legacy-modal__title{font-size:26px;padding:22px}.ai-legacy-modal__body{font-size:20px;padding:22px}.ai-legacy-loading__text{font-size:20px}}' +
            '</style>');
    }


    function registerSettings() {
        try {
            if (!window.Lampa || !Lampa.SettingsApi) return;

            if (!window.ai_search_legacy_user_api_settings_component_ready) {
                window.ai_search_legacy_user_api_settings_component_ready = true;

                Lampa.SettingsApi.addComponent({
                    component: AI_SETTINGS_COMPONENT,
                    name: 'AI Поиск',
                    icon: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L14.8 8.3L22 9L16.6 13.7L18.2 21L12 17.2L5.8 21L7.4 13.7L2 9L9.2 8.3L12 2Z" fill="white"/></svg>'
                });
            }

            renderSettingsParams();
        } catch (e) {
            log('settings error', e);
        }
    }

    function rerenderSettingsParams() {
        window.ai_search_legacy_user_api_settings_rendered_profile = '';

        setTimeout(function () {
            renderSettingsParams();

            try {
                if (window.Lampa && Lampa.Settings && Lampa.Settings.create) {
                    Lampa.Settings.create(AI_SETTINGS_COMPONENT);
                }
            } catch (e) {}
        }, 80);
    }

    function renderSettingsParams() {
        if (!window.Lampa || !Lampa.SettingsApi) return;

        var num = activeProfileNumber();
        var profileKey = String(num);

        try {
            if (Lampa.SettingsApi.removeParams) {
                Lampa.SettingsApi.removeParams(AI_SETTINGS_COMPONENT);
            } else if (window.ai_search_legacy_user_api_settings_rendered_profile === profileKey) {
                return;
            }
        } catch (e) {}

        window.ai_search_legacy_user_api_settings_rendered_profile = profileKey;

        var prefix = 'ai_search_legacy_profile_' + num + '_';
        var defaultProvider = num === 1 ? 'deepseek' : 'custom';
        var currentProvider = cleanValue(storeGet(prefix + 'provider', defaultProvider)) || defaultProvider;
        var currentPreset = AI_PROVIDER_PRESETS[currentProvider] || AI_PROVIDER_PRESETS[defaultProvider] || AI_PROVIDER_PRESETS.custom;

        Lampa.SettingsApi.addParam({ component: AI_SETTINGS_COMPONENT, param: { type: 'title' }, field: { name: 'Основной профиль' } });
        Lampa.SettingsApi.addParam({
            component: AI_SETTINGS_COMPONENT,
            param: { name: AI_ACTIVE_PROFILE, type: 'select', values: { '1': 'Профиль 1', '2': 'Профиль 2', '3': 'Профиль 3' }, default: '1' },
            field: { name: 'Использовать профиль', description: 'Ниже показываются настройки только выбранного профиля.' },
            onChange: rerenderSettingsParams
        });

        Lampa.SettingsApi.addParam({ component: AI_SETTINGS_COMPONENT, param: { type: 'title' }, field: { name: 'Настройки профиля ' + num } });
        Lampa.SettingsApi.addParam({
            component: AI_SETTINGS_COMPONENT,
            param: { name: prefix + 'title', type: 'input', values: '', default: num === 1 ? 'DeepSeek' : '' },
            field: { name: 'Название' }
        });
        Lampa.SettingsApi.addParam({
            component: AI_SETTINGS_COMPONENT,
            param: {
                name: prefix + 'provider',
                type: 'select',
                values: {
                    deepseek: 'DeepSeek',
                    openai: 'OpenAI',
                    openrouter: 'OpenRouter',
                    together: 'Together',
                    groq: 'Groq',
                    custom: 'Совместимый / свой адрес'
                },
                default: defaultProvider
            },
            field: { name: 'Провайдер' },
            onChange: function () {
                var provider = cleanValue(storeGet(prefix + 'provider', defaultProvider)) || 'custom';
                applyAiProviderPreset(prefix, provider);

                rerenderSettingsParams();
            }
        });
        Lampa.SettingsApi.addParam({ component: AI_SETTINGS_COMPONENT, param: { name: prefix + 'key', type: 'input', values: '', default: '' }, field: { name: 'Ключ' } });
        Lampa.SettingsApi.addParam({ component: AI_SETTINGS_COMPONENT, param: { name: prefix + 'base', type: 'input', values: '', default: currentProvider === 'custom' ? '' : (currentPreset.base || '') }, field: { name: 'Адрес сервиса' } });
        Lampa.SettingsApi.addParam({ component: AI_SETTINGS_COMPONENT, param: { name: prefix + 'model', type: 'input', values: '', default: currentProvider === 'custom' ? '' : (currentPreset.model || '') }, field: { name: 'Модель' } });

        Lampa.SettingsApi.addParam({ component: AI_SETTINGS_COMPONENT, param: { type: 'title' }, field: { name: 'Каталог фильмов' } });
        Lampa.SettingsApi.addParam({
            component: AI_SETTINGS_COMPONENT,
            param: { name: AI_TMDB_KEY, type: 'input', values: '', default: '' },
            field: { name: 'Ключ TMDB', description: 'Нужен для карточек, постеров и рейтингов. Общий для всех профилей.' }
        });
    }

    function ensureSettingsRegistration() {
        registerSettings();
        setTimeout(registerSettings, 300);
        setTimeout(registerSettings, 900);
        setTimeout(registerSettings, 1800);

        try {
            if (window.Lampa && Lampa.Listener && !window.ai_search_legacy_user_api_settings_listener) {
                window.ai_search_legacy_user_api_settings_listener = true;
                Lampa.Listener.follow('app', function (e) {
                    if (e && e.type === 'ready') registerSettings();
                });
            }
        } catch (e) {}

        try {
            if (window.Lampa && Lampa.Settings && Lampa.Settings.listener && !window.ai_search_legacy_user_api_settings_open_listener) {
                window.ai_search_legacy_user_api_settings_open_listener = true;
                Lampa.Settings.listener.follow('open', function () {
                    registerSettings();
                });
            }
        } catch (e) {}
    }

    function start() {
        if (!window.Lampa || !window.$) {
            setTimeout(start, 300);
            return;
        }

        ensureSettingsRegistration();
        addStyles();
        scheduleButtonScan();

        if (window.Lampa && Lampa.Listener) {
            try {
                Lampa.Listener.follow('activity', function (e) {
                    if (e) scheduleButtonScan();
                });
            } catch (e) {}
        }

        if (!SCAN_TIMER) {
            SCAN_TIMER = setInterval(scanButton, 1500);
        }

        log('AI Search Legacy started', VERSION);
    }

    start();
})();


