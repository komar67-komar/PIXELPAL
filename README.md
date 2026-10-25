# PIXELPAL 🐾

PIXELPAL — браузерная игра-уход за питомцем в пиксельном стиле. Это статический сайт на HTML, CSS и нативных JavaScript ES-модулях: сборщик и установка npm-зависимостей для запуска не нужны. Главная точка входа — корневой `index.html`.

## Требования

- Современный браузер с поддержкой JavaScript ES-модулей и Canvas.
- Для локального запуска — Python 3 или Node.js (любой статический HTTP-сервер).
- Git и доступ к существующему GitHub-репозиторию, если вы публикуете проект.

## Установка и локальный запуск

Скачайте или клонируйте проект и перейдите в его папку. Запустите сервер из корня проекта:

```sh
python -m http.server 8000
```

Откройте <http://localhost:8000>. Адрес localhost нужен только для локальной разработки и нигде не зашит в клиентские файлы. Не открывайте `index.html` через `file://`: браузеру нужен HTTP-сервер для загрузки ES-модулей.

Если Python не установлен, запустите любой статический сервер Node.js или расширение Live Server редактора. Собирать проект перед запуском не требуется.

## Публикация на GitHub Pages

В репозитории уже есть workflow [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml). Он публикует содержимое корня репозитория после каждого push в `main`, а также поддерживает ручной запуск через вкладку **Actions**.

1. Файлы PIXELPAL публикуются в подпапке `pixelpal/` существующего репозитория; текущие файлы в корне репозитория при этом сохраняются.
2. Откройте репозиторий на GitHub → **Settings → Pages**.
3. В разделе **Build and deployment** выберите **Source: GitHub Actions**.
4. Дождитесь успешного workflow **Deploy PIXELPAL to GitHub Pages** во вкладке **Actions**. Ссылка на опубликованный сайт появится в job deployment и настройках Pages.

Игра использует относительные ссылки `./styles.css` и `./src/main.js`, поэтому работает в подпапке `pixelpal/` без настройки `base`. В выбранном репозитории `komar67-komar/our-little-world-2d1` адрес игры будет `https://komar67-komar.github.io/our-little-world-2d1/pixelpal/`, если GitHub Pages включён для этого репозитория. Корневая страница существующего сайта сохраняется.

### Git-команды

Источник размещения — существующий репозиторий `https://github.com/komar67-komar/our-little-world-2d1`. Эта локальная рабочая копия не содержит `.git`; команды ниже клонируют существующий репозиторий в отдельную папку, чтобы не затирать его корневые файлы.

В PowerShell укажите путь к этой рабочей папке в `$source`, затем выполните:

```powershell
$source = 'C:\Users\КОМАР\Desktop\111'
$repo = Join-Path $env:TEMP 'pixelpal-github-work'
git clone https://github.com/komar67-komar/our-little-world-2d1.git $repo
New-Item -ItemType Directory -Force "$repo\pixelpal", "$repo\.github\workflows"
Copy-Item "$source\index.html", "$source\styles.css", "$source\README.md" -Destination "$repo\pixelpal"
Copy-Item "$source\src" -Destination "$repo\pixelpal" -Recurse
Copy-Item "$source\.github\workflows\deploy-pages.yml" -Destination "$repo\.github\workflows\deploy-pages.yml"
git -C $repo status
git -C $repo add pixelpal .github/workflows/deploy-pages.yml
git -C $repo commit -m "Add PIXELPAL and GitHub Pages deployment"
git -C $repo push origin main
```

После push дождитесь успешного workflow. Не используйте `--force`: он не нужен и может перезаписать историю.

## Игровые сохранения

Прогресс автоматически хранится в браузерном `localStorage` на том же устройстве и в том же браузерном origin. Обычная публикация новой версии GitHub Pages не удаляет эти данные. Не переименовывайте ключ `pixelpal.save.v1` и сохраняйте миграцию схемы в `src/store.js`, если меняете формат.

`localStorage` не синхронизируется между браузерами и устройствами. Перед публикацией можно выгрузить JSON-копию через меню настроек игры. Если меняется домен сайта, браузер считает его другим origin; используйте экспорт/импорт сохранения для переноса.

## Структура

- `index.html` — точка входа и разметка интерфейса.
- `styles.css` — адаптивное оформление.
- `src/main.js` — интерфейс, уход за питомцем, магазин и мини-игры.
- `src/scene.js` — Canvas-комната и питомец.
- `src/game.js` — игровая логика и расчёт времени.
- `src/store.js` — сохранение, валидация и резервные копии.
- `src/data.js` — каталог питомцев, предметов и игр.

## Проверки и ограничения

Синтаксис модулей можно проверить установленным Node.js: `node --check src/main.js` (повторить для остальных файлов в `src/`). В проекте нет внешних API и секретных ключей. Локальный адрес localhost используется только в примерах запуска этого README.

Питомцы и комната рисуются геометрическими Canvas-спрайтами. Мебель можно купить и разместить, но пока нельзя двигать перетаскиванием. Облачная синхронизация и PWA-режим не реализованы.

