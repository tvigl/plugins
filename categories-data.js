// Данные категорий
const categories = {
	"Оформления": { value: "design", color: "blue" },
	"Темы": { value: "themes", color: "purple" },
	"Подборки": { value: "collections", color: "pink" },
	"Торренты": { value: "torrents", color: "orange" },
	"Онлайн": { value: "online", color: "green" },
	"Разное": { value: "other", color: "gray" },
	"Аниме": { value: "anime", color: "red" },
	"UI": { value: "ui", color: "indigo" },
	"Плеер": { value: "player", color: "teal" }
};

// Маппинг категорий для фильтрации
const categoryFilterMap = {
	'design': 'Оформления',
	'themes': 'Темы',
	'collections': 'Подборки',
	'torrents': 'Торренты',
	'online': 'Онлайн',
	'other': 'Разное',
	'anime': 'Аниме',
	'ui': 'UI',
	'player': 'Плеер'
};

// Типы бейджей для отображения
const badgeTypes = {
	Оформления: "design",
	Темы: "themes",
	Подборки: "collections",
	Торренты: "torrents",
	Онлайн: "online",
	Разное: "other",
	Аниме: "anime",
	UI: "ui",
	Плеер: "player"
};
