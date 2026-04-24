---
marp: true
theme: default
paginate: true
---

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap');

:root {
  --color-background: #ffffff;
  --color-foreground: #1f2937;
  --color-heading: #1e40af;
  --color-accent: #3b82f6;
  --color-border: #d1d5db;
  --font-default: 'Inter', sans-serif;
}

section {
  background-color: var(--color-background);
  color: var(--color-foreground);
  font-family: var(--font-default);
  font-weight: 400;
  box-sizing: border-box;
  border-top: 8px solid var(--color-heading);
  position: relative;
  line-height: 1.7;
  font-size: 22px;
  padding: 56px;
}

h1, h2, h3, h4, h5, h6 {
  font-weight: 700;
  color: var(--color-heading);
  margin: 0;
  padding: 0;
}

h1 {
  font-size: 54px;
  line-height: 1.3;
  text-align: left;
  font-weight: 700;
  letter-spacing: -0.02em;
}

h2 {
  position: absolute;
  top: 40px;
  left: 56px;
  right: 56px;
  font-size: 38px;
  padding-top: 0;
  padding-bottom: 16px;
  border-bottom: 3px solid var(--color-accent);
}

h2 + * {
  margin-top: 112px;
}

h3 {
  color: var(--color-accent);
  font-size: 26px;
  margin-top: 32px;
  margin-bottom: 12px;
  font-weight: 600;
}

ul, ol {
  padding-left: 32px;
}

li {
  margin-bottom: 14px;
  line-height: 1.7;
}

footer {
  font-size: 16px;
  color: #6b7280;
  position: absolute;
  left: 56px;
  right: 56px;
  bottom: 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

footer::before {
  content: '';
  flex: 1;
  height: 2px;
  background-color: var(--color-border);
  margin-right: 20px;
}

section.lead {
  border-top: 8px solid var(--color-heading);
  display: flex;
  flex-direction: column;
  justify-content: center;
  background: linear-gradient(135deg, #ffffff 0%, #f3f4f6 100%);
}

section.lead footer {
  display: none;
}

section.lead h1 {
  margin-bottom: 32px;
  color: var(--color-heading);
}

section.lead p {
  font-size: 24px;
  color: var(--color-foreground);
  font-weight: 500;
}

table {
  border-collapse: collapse;
  width: 100%;
  margin: 20px 0;
  font-size: 18px;
}

th, td {
  border: 1px solid var(--color-border);
  padding: 12px;
  text-align: left;
}

th {
  background-color: var(--color-heading);
  color: #ffffff;
  font-weight: 700;
}

tr:nth-child(even) {
  background-color: #f9fafb;
}

strong {
  color: var(--color-heading);
  font-weight: 700;
}

</style>

<!-- _class: lead -->

# Стратегический анализ

### Запаркуй

**Платформа аренды парковочных мест в ЖК Москвы**

*Апрель 2026*

---

## Рынок и возможности

| Показатель | Значение |
|------------|----------|
| TAM (весь рынок) | 45,8 млрд ₽/год |
| SAM (достижимый) | 12,4 млрд ₽/год |
| SOM (целевой) | 1,2 млрд ₽/год |

**Ключевые тренды:**
- Дефицит парковок в Москве — 1 место на 1000 авто
- Рост спроса на закрытые паркинги ЖК
- Цифровизация недвижимости

---

## Конкурентное преимущество

- **Единая экосистема** — поиск, бронирование, оплата в одном приложении
- **Геолокация** — карта парковок с навигацией
- **Геофенсинг** — уведомления при приближении
- **Push-уведомления** — напоминания и подтверждения

**Технологии:**
- Capacitor (мобильное приложение)
- OSM карты (независимость от Яндекс/Google)
- Supabase (авторизация, база данных)
- OneSignal (push-уведомления)

---

## Финансовые показатели

| Метрика | Прогноз |
|---------|---------|
| Выручка (год 5) | 847 млн ₽/год |
| Точка безубыточности | 18 месяцев |
| NPV (15% дисконт) | 1,84 млрд ₽ |
| IRR | 67% |
| Срок окупаемости | 26 месяцев |

**Запрошенное финансирование:** 180 млн ₽
- Развитие продукта: 55%
- Маркетинг: 30%
- Операции: 15%

---

## Статус и следующие шаги

**Выполнено:**
- Веб-сайт zaparkyi.ru работает
- Мобильное приложение (Capacitor) готово к сборке APK
- OneSignal подключён для push-уведомлений

**В разработке:**
- Финальная сборка APK для тестирования
- Интеграция ЮKassa (заглушка готова)
- Расширение базы парковок

**Планы:**
- Запуск MVP в Москве
- Привлечение первых ЖК-партнёров
- Масштабирование на другие города

---

## Контакты

**Запаркуй**
- Сайт: zaparkyi.ru
- GitHub: github.com/belix888/zaparkyi
- Email: [контакт в разработке]

*Презентация подготовлена для инвесторов и партнёров*