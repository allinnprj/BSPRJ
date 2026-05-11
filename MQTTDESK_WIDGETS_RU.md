# MqttDesk Widgets Checklist

Краткая шпаргалка по виджетам `MqttDesk` для проекта `BS Test WPM`.

Основано на официальном user guide `ioCtrl / MqttDesk`.

## Как читать эту шпаргалку

- `Что делает` — основная роль виджета.
- `Как использовать` — как его обычно настраивать в MQTT.
- `Полезно нам` — нужен ли он для нашего проекта.

## Общий принцип для нашего проекта

Для панели `BS Test WPM` в первую очередь полезны:

- `LED Indicator`
- `Value`
- `Gauge`
- `Vertical Progress`
- `Circular Progress`
- `Line Graph`
- `Bar Chart`
- `Text`
- `Multi state Indicator`
- `Informative text`
- `Node status`

Менее полезны или не нужны сейчас:

- `Slider`
- `Button`
- `Switch`
- `Combo Box`
- `Radio Button`
- `Text Input`
- `Color Picker`
- `Time Picker`
- `Map`
- `Image`
- `URI`
- `Iframe`

## Widget Checklist

### 1. Text

- Что делает: показывает текстовое значение из topic.
- Как использовать: подписать на текстовый topic.
- Полезно нам: да.
- Хорошо подходит для:
  - `bs/devices/bs-esp32-01/status/ip`
  - `bs/devices/bs-esp32-01/period/current`
  - `bs/devices/bs-esp32-01/sound/signal`
  - `bs/devices/bs-esp32-01/status/wifi`

### 2. Multi text

- Что делает: показывает несколько текстовых значений в одном блоке.
- Как использовать: несколько topic в одном виджете.
- Полезно нам: да, но позже.
- Хорошо подходит для:
  - `signal + period + ip`
  - компактный статус-блок

### 3. Static text

- Что делает: просто выводит фиксированный текст.
- Как использовать: подписи, заголовки, пояснения.
- Полезно нам: иногда.
- Хорошо подходит для:
  - названия секций панели
  - пояснение типа `Relative sound level`

### 4. Toggle / Switch

- Что делает: переключает состояние и публикует payload.
- Как использовать: publish widget для on/off управления.
- Полезно нам: нет, пока проект в основном мониторинговый.

### 5. Button

- Что делает: отправляет payload по нажатию.
- Как использовать: publish command в topic.
- Полезно нам: нет, пока команды устройству не нужны.

### 6. Textarea / Text Input

- Что делает: позволяет вводить и публиковать текст.
- Как использовать: отправка строковых команд.
- Полезно нам: нет, пока не нужен ручной publish control.

### 7. Slider

- Что делает: публикует/показывает диапазон значений.
- Как использовать: publish topic с min/max.
- Полезно нам: нет, это скорее управляющий виджет.

### 8. Color Picker

- Что делает: публикует цвет.
- Как использовать: RGB/HEX в topic.
- Полезно нам: нет.

### 9. Map

- Что делает: показывает координаты на карте.
- Как использовать: topics latitude/longitude.
- Полезно нам: нет.

### 10. Status Indicator / LED Indicator

- Что делает: показывает бинарный статус через цвет.
- Как использовать: настроить payload ON/OFF.
- Полезно нам: да, очень.
- Хорошо подходит для:
  - `bs/devices/bs-esp32-01/status/online`
  - `bs/devices/bs-esp32-01/status/time_synced`

### 11. Multi state Indicator

- Что делает: показывает больше двух состояний.
- Как использовать: несколько возможных payload и цветов.
- Полезно нам: да.
- Хорошо подходит для:
  - `bs/devices/bs-esp32-01/sound/signal`
    - `SILENT`
    - `NORMAL`
    - `LOUD`
    - `PEAK`
  - `bs/devices/bs-esp32-01/period/current`
    - `day`
    - `evening`
    - `night`

### 12. Formula

- Что делает: вычисляет значение по выражению.
- Как использовать: math expression над payload.
- Полезно нам: возможно.
- Хорошо подходит для:
  - будущих derived metrics
  - пересчёта процентов в шкалу уровня

### 13. Radial Gauge / Gauge

- Что делает: круговой аналоговый индикатор диапазона.
- Как использовать: подписать на числовой topic, задать min/max и цветовые зоны.
- Полезно нам: да, один из главных.
- Хорошо подходит для:
  - `bs/devices/bs-esp32-01/sound/now_pct`
  - `bs/devices/bs-esp32-01/status/wifi_pct`

Рекомендуемый диапазон для `%`:

- Min: `0`
- Max: `100`
- 4 зоны:
  - `0..20`
  - `21..40`
  - `41..60`
  - `61..100`

### 14. Linear Gauge / Vertical Progress / Circular Progress

- Что делает: показывает числовое значение как прогресс.
- Как использовать: подписать на числовой topic.
- Полезно нам: да.
- Хорошо подходит для:
  - `hour_pct`
  - `mean_pct`
  - `current_period_pct`
  - `day_pct`
  - `evening_pct`
  - `night_pct`

### 15. Value

- Что делает: показывает одно числовое значение крупно и просто.
- Как использовать: подписать на один topic, указать unit.
- Полезно нам: да, очень.
- Хорошо подходит для:
  - `bs/devices/bs-esp32-01/sound/now_pct`
  - `bs/devices/bs-esp32-01/sound/hour_pct`
  - `bs/devices/bs-esp32-01/sound/mean_pct`
  - `bs/devices/bs-esp32-01/status/wifi_pct`

### 16. Text Log

- Что делает: показывает поток сообщений / лог.
- Как использовать: подписать на topic и копить историю.
- Полезно нам: да, как диагностический блок.
- Хорошо подходит для:
  - `status/json`
  - `sound/json`
  - `period/json`

### 17. Line Graph

- Что делает: график значений во времени.
- Как использовать: подписать на один или несколько числовых topic.
- Полезно нам: да, один из лучших.
- Хорошо подходит для:
  - `now_pct`
  - `hour_pct`
  - `mean_pct`

### 18. Chart / Pie / Donut

- Что делает: показывает доли/сравнение категорий.
- Как использовать: несколько числовых источников.
- Полезно нам: ограниченно.
- Хорошо подходит для:
  - сравнение `day/evening/night`

### 19. Bar Chart

- Что делает: столбиковое сравнение нескольких значений.
- Как использовать: несколько topic в одном виджете.
- Полезно нам: да.
- Хорошо подходит для:
  - `day_pct`
  - `evening_pct`
  - `night_pct`
  - иногда `now/hour/mean`

### 20. Histogram

- Что делает: распределение по bins/frequency.
- Как использовать: требует более статистического сценария.
- Полезно нам: нет, пока избыточно.

### 21. Image

- Что делает: показывает статичную картинку или картинку из topic.
- Как использовать: image payload/static image.
- Полезно нам: нет.

### 22. URI

- Что делает: отображает URL.
- Как использовать: topic со ссылкой.
- Полезно нам: нет.

### 23. Iframe

- Что делает: встраивает внешний контент.
- Как использовать: URL/embedded page.
- Полезно нам: нет, пока не нужно.

### 24. Node status

- Что делает: показывает статус другого MQTT client/device.
- Как использовать: мониторинг живости узла.
- Полезно нам: да.
- Хорошо подходит для:
  - `status/online`
  - в комбинации с connection state

### 25. Combo Box

- Что делает: publish/subscribe нескольких payload к одному topic.
- Как использовать: выбирать режим и отправлять его.
- Полезно нам: нет, пока нет управляющих режимов.

### 26. Radio Button

- Что делает: как Combo Box, но видимые варианты сразу.
- Как использовать: publish/select mode.
- Полезно нам: нет, пока нет командных режимов.

### 27. Complex / Scheme / Multiplier / Form

- Что делает: специальные или более составные сценарии визуализации/управления.
- Как использовать: для сложных панелей и составных данных.
- Полезно нам: пока нет, можно отложить.

## Лучший набор виджетов для BS Test WPM

Если собирать панель без лишнего шума, то я бы рекомендовал такой набор:

### Core

- `LED Indicator` -> `status/online`
- `LED Indicator` -> `status/time_synced`
- `Gauge` -> `sound/now_pct`
- `Value` -> `sound/hour_pct`
- `Value` -> `sound/mean_pct`
- `Value` -> `status/wifi_pct`

### Context

- `Multi state Indicator` -> `sound/signal`
- `Multi state Indicator` -> `period/current`
- `Text` -> `status/ip`

### Comparison / Trend

- `Bar Chart` -> `period/day_pct`, `period/evening_pct`, `period/night_pct`
- `Line Graph` -> `sound/now_pct`, optionally also `hour_pct`

### Diagnostic / Optional

- `Text Log` -> `status/json`
- `Text Log` -> `sound/json`

## Practical Build Order

Лучше собирать `MqttDesk` так:

1. `LED Indicator` -> `status/online`
2. `Gauge` -> `sound/now_pct`
3. `Value` -> `sound/hour_pct`
4. `Value` -> `sound/mean_pct`
5. `Value` -> `status/wifi_pct`
6. `Multi state Indicator` -> `sound/signal`
7. `Multi state Indicator` -> `period/current`
8. `Bar Chart` -> `day/evening/night`
9. `Line Graph` -> `now_pct`

## JSON Topics In Our Project

Эти topics лучше использовать не как первые виджеты, а как диагностические или для более сложных конфигураций:

- `bs/devices/bs-esp32-01/status/json`
- `bs/devices/bs-esp32-01/sound/json`
- `bs/devices/bs-esp32-01/period/json`

Для основной панели проще и надёжнее использовать прямые топики, а не JSON topics.
