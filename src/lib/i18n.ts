export type Lang = "kk" | "ru";

type Dict = Record<string, { kk: string; ru: string }>;

export const dict: Dict = {
  appName: { kk: "Аралық жеткізу", ru: "Межгород Логистика" },
  tagline: { kk: "Түнгі маршрут", ru: "Ночной маршрут" },

  // auth
  authTitle: { kk: "Кіру / Тіркелу", ru: "Вход / Регистрация" },
  authHint: {
    kk: "Телефон нөмірі мен 4 таңбалы PIN коды жеткілікті",
    ru: "Достаточно номера телефона и 4-значного PIN-кода",
  },
  name: { kk: "Атыңыз", ru: "Ваше имя" },
  phone: { kk: "Телефон нөмірі", ru: "Номер телефона" },
  pin: { kk: "PIN коды (4 сан)", ru: "PIN-код (4 цифры)" },
  enter: { kk: "Кіру", ru: "Войти" },
  wrongPin: { kk: "PIN коды қате", ru: "Неверный PIN-код" },
  needName: { kk: "Жаңа нөмір — атыңызды енгізіңіз", ru: "Новый номер — введите имя" },
  badPhone: { kk: "Нөмірді толық енгізіңіз", ru: "Введите номер полностью" },
  badPin: { kk: "PIN 4 саннан тұруы керек", ru: "PIN должен быть из 4 цифр" },
  logout: { kk: "Шығу", ru: "Выйти" },

  // cash
  cashTracker: { kk: "Кассa", ru: "Касса" },
  total: { kk: "Барлығы", ru: "Всего" },
  collected: { kk: "Жиналды", ru: "Собрано" },
  remaining: { kk: "Қалды", ru: "Осталось" },
  stopsLeft: { kk: "тоқтау қалды", ru: "остановок" },
  pctCollected: { kk: "жиналды", ru: "собрано" },

  // route
  districts: { kk: "Аудандар", ru: "Районы" },
  optimize: { kk: "Маршрут құру", ru: "Оптимизировать" },
  roadbook: { kk: "Маршрут", ru: "Маршрут" },
  ofOrders: { kk: "тапсырыс", ru: "заказов" },
  call: { kk: "Қоңырау", ru: "Звонок" },
  markDelivered: { kk: "Жеткізілді", ru: "Доставлено" },
  delivered: { kk: "Жеткізілді", ru: "Доставлено" },
  pushToEnd: { kk: "Соңына", ru: "В конец" },
  paid: { kk: "Төленген", ru: "Оплачено" },
  pending: { kk: "Төлем күтілуде", ru: "К оплате" },
  emptyRoute: {
    kk: "Тапсырыс жоқ. Төменнен қосыңыз.",
    ru: "Заказов нет. Добавьте ниже.",
  },
  done: { kk: "Орындалды", ru: "Выполнено" },
  undo: { kk: "Қайтару", ru: "Вернуть" },
  clearDone: { kk: "Орындалғанды тазалау", ru: "Очистить выполненные" },

  // intake
  newOrder: { kk: "Жаңа тапсырыс", ru: "Новый заказ" },
  address: { kk: "Жеткізу мекенжайы", ru: "Адрес доставки" },
  recipientPhone: { kk: "Алушының телефоны", ru: "Телефон получателя" },
  amount: { kk: "Сомасы, ₸", ru: "Сумма, ₸" },
  note: { kk: "Қысқа ескертпе", ru: "Короткая заметка" },
  notePh: { kk: "мыс.: ауыр қорап", ru: "напр.: тяжёлая коробка" },
  addOrder: { kk: "Тапсырысты қосу", ru: "Добавить заказ" },
  voice: { kk: "Дауыспен енгізу", ru: "Голосовой ввод" },
  listening: { kk: "Тыңдап тұрмын…", ru: "Слушаю…" },
  voiceUnsupported: {
    kk: "Бұл браузер дауысты танымайды",
    ru: "Браузер не поддерживает распознавание речи",
  },
  needAddress: { kk: "Мекенжай қажет", ru: "Нужен адрес" },
  needPhone: { kk: "Телефон қажет", ru: "Нужен телефон" },
  savedLocally: {
    kk: "Барлығы құрылғыда сақталады — интернетсіз де жоғалмайды",
    ru: "Всё хранится на устройстве — не пропадёт без интернета",
  },

  // home
  finalDest: { kk: "Соңғы нүкте (үй / қонақүй)", ru: "Финальная точка (дом / отель)" },
  finalDestPh: { kk: "Үй немесе қонақүй мекенжайы", ru: "Адрес дома или отеля" },

  // tabs
  tabRoute: { kk: "Маршрут", ru: "Маршрут" },
  tabAdd: { kk: "Қосу", ru: "Заказ" },
  tabProfile: { kk: "Профиль", ru: "Профиль" },
  tabAdmin: { kk: "Әкімші", ru: "Админ" },

  // subscription
  plan: { kk: "Тариф", ru: "Тариф" },
  free: { kk: "Тегін", ru: "Бесплатно" },
  pro: { kk: "Pro", ru: "Pro" },
  trialLeft: { kk: "тегін тапсырыс қалды", ru: "бесплатных заказов осталось" },
  trialOver: {
    kk: "Тегін лимит бітті — Pro қосыңыз",
    ru: "Бесплатный лимит исчерпан — подключите Pro",
  },
  buyPro: { kk: "Pro қосу — 1 500 ₸/ай", ru: "Подключить Pro — 1 500 ₸/мес" },
  payTitle: { kk: "Төлем", ru: "Оплата" },
  payHint: {
    kk: "1 500 ₸ аударыңыз, содан соң нөміріңіз белсендіріледі",
    ru: "Переведите 1 500 ₸, после чего номер будет активирован",
  },
  copied: { kk: "Көшірілді", ru: "Скопировано" },
  proUntil: { kk: "Pro дейін", ru: "Pro до" },
  close: { kk: "Жабу", ru: "Закрыть" },

  // admin
  drivers: { kk: "Жүргізушілер", ru: "Водители" },
  regDate: { kk: "Тіркелген", ru: "Регистрация" },
  ordersCount: { kk: "Тапсырыс", ru: "Заказов" },
  activatePro: { kk: "Pro қосу (30 күн)", ru: "Активировать Pro (30 дней)" },
  proActive: { kk: "Pro белсенді", ru: "Pro активен" },
  noDrivers: { kk: "Жүргізушілер жоқ", ru: "Водителей нет" },
};

export function t(key: keyof typeof dict, lang: Lang): string {
  return dict[key]?.[lang] ?? String(key);
}

export function formatKzt(value: number): string {
  return new Intl.NumberFormat("ru-RU").format(Math.round(value));
}
