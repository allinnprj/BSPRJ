# Источники V1

Начало работы: 2026-10-12. Продолжение и финальная серия: 2026-10-13, Asia/Baku.

## Пользовательские ориентиры

- Открытый металлический корпус с зелёной платой и батареей снизу — неизменная основа V1. Локальный прежний концепт `../../build/pcb-pv.png` соответствует этому визуальному ориентиру; он не является реальной электрической схемой.
- Пользовательские изображения определяют круглый INMP441, чёрный INA3221 (38,1 × 31,6 мм), отдельный синий SS56 (12,7 × 13,0 мм), фиолетовый SHT3X и OLED. Указанные размеры взяты из подписей на изображениях, не из нового измерения.
- Вариант V2 зафиксирован как компактный закрытый узел на столбе, солнечная панель сверху, аккуратные кронштейны и защищённая кабельная трасса. Он отложен до согласования V1; настоящая серия V2 не создавалась.
- Батарейный узел V1: 10 000 мА·ч, выход 5 В — по прямому уточнению пользователя.

## Фотографии внешнего вида, сохранённые без обработки

| Файл | Источник / роль |
| --- | --- |
| `references/wroom32u-real.png` | Локальный `D:/MD/Downloads/INA3221/ESP32 WROOM 32U.png`; антенное гнездо и форма реальной платы |
| `references/c3-supermini-real.jpg` | Локальный `D:/MD/Downloads/INA3221/ESP32_C3_SM.jpg`; форма C3, USB-C, две кнопки |
| `references/inmp441-real.png` | [ShillehTek: INMP441, круглая плата](https://shillehtek.com/blogs/shillehtek-product-manuals/inmp441-i2s-omnidirectional-microphone-module-with-soldering-manual); изображение https://cdn.shopify.com/s/files/1/0837/4340/8415/files/INMP441-pinout.png |
| `references/ina3221-real.jpg` | Каталоговый снимок чёрной платы: https://m.media-amazon.com/images/I/71cd9NXnFIL.jpg ; только внешняя форма, не источник распиновки новой сборки |
| `references/sht3x-real.jpg` | [VXB: фиолетовая плата SHT3X](https://vxb.com/products/temperature-and-humidity-sensor-module-with-i2c-br); изображение https://vxb.com/cdn/shop/files/61IL0jf4QXL.jpg?v=1777112507&width=480 ; только внешний вид |
| `references/gps-m8-form-real.jpg` | [Каталоговый образец M8 с отдельной антенной](https://www.electronicscomp.com/neo-m8n-gps-module-with-ceramic-active-antenna); изображение https://www.electronicscomp.com/image/cache/catalog/neo-m8n-gps-module-with-ceramic-active-antenna-800x800.jpg ; установленную ревизию ещё надо подтвердить |
| `references/ss56-real.jpg` | [QuartzComponents: плата с двумя SS56](https://quartzcomponents.com/products/60v-10a-anti-reverse-diode-constant-current-power-module); изображение https://quartzcomponents.com/cdn/shop/files/60V10AAnti-ReverseDiodeConstant-CurrentPowerModule1.jpg?v=1736596021 ; только форма, рекламное название не подтверждает регулирование тока |

## Технические источники

- [Espressif: ESP32-WROOM-32D/32U](https://documentation.espressif.com/esp32-wroom-32d_esp32-wroom-32u_datasheet_en.html): у 32U внешняя антенна через разъём. USB относится к конкретной плате DevKit, а не к голому модулю.
- [TDK/InvenSense: INMP441](https://invensense.tdk.com/wp-content/uploads/2015/02/INMP441.pdf): цифровой I2S-микрофон с нижним акустическим портом.
- Текущий локальный `src/display_view.cpp`: четыре строки OLED, статус A16 EST / Wi-Fi / ECO, dBA, H/M и температура/влажность. Все цифры на серии — пример, не новые измерения.
- Текущий `src/sht31_service.cpp`: используется драйвер SHT31. Маркировка SHT3X на фотографии сама по себе не доказывает конкретную модификацию сенсора.
- `CONTROLLER_UART_PROTOCOL.md` и `D:/DEV/INA3221-C3/INA3221_ACTUAL_WIRING.net` прочитаны без изменений. Старая силовая цепь 12 В не переносилась на новый узел 5 В. Реальная схема, заряд и геометрия для изготовления остаются отдельной задачей.

## Происхождение и границы проверки

Все десять номерных кадров созданы встроенным Imagegen с реальными фотографиями модулей и канонической компоновкой V1 в качестве референсов. Они визуально проверены, но не являются фотографиями изготовленного устройства. Печатные надписи, количество/форма мелких контактов, проводка и масштаб могут отличаться от реальных плат; при сборке нужно использовать исходные фотографии, спецификации и проверенную netlist, а не извлекать распиновку из генерации.

Не подтверждены зарядный узел для конкретной батареи, размеры корпуса/батареи, финальная PCB, герметичность, акустическая точность с губкой или миграция прошивки. Визуальная серия не повышает готовность проекта выше 60%.
