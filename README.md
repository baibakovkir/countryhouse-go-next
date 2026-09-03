# Планировщик участка

Веб-приложение для проектирования загородного участка. Оно объединяет план территории, объекты, расходы и календарь работ в одном пространстве с метрической системой координат.

**Live demo: [countryhouse.baibakovkir.space](https://countryhouse.baibakovkir.space)**

## Возможности

- регистрация и вход с серверной сессией в HttpOnly cookie;
- несколько независимых участков у одного пользователя;
- точный 2D-план с масштабом и координатной сеткой;
- интерактивное планирование рельефа, террас, зданий и инженерных коммуникаций в 2D/3D;
- размещение объектов в метрах с размерами, отметками высоты и signed `z` для подземных коммуникаций;
- расширяемая геометрия `footprint`, `polygon` и `polyline` для стандартных и пользовательских элементов;
- история расходов — общих и связанных с объектами;
- календарь задач со сроками и плановым бюджетом;
- изоляция данных между владельцами участков.

## Архитектура

Проект организован как монорепозиторий:

```text
backend/                 Go REST API и SQL-миграции
frontend/                Next.js App Router приложение
ops/                     обезличенные инфраструктурные шаблоны
.github/workflows/       CI/CD pipeline
compose.yml              локальное Docker-окружение
compose.prod.yml         production compose без секретов
```

Backend следует упрощённой Clean Architecture: доменные модели не зависят от транспорта и PostgreSQL, application-сервисы содержат сценарии, repository работает через `pgx`, а HTTP-слой отвечает за валидацию протокола и статусы ошибок.

Frontend построен на Next.js, TypeScript и Tailwind CSS. Base UI предоставляет доступные headless-компоненты, React Hook Form и Zod отвечают за формы, Zustand разделяет серверные данные и состояние редактора, а SVG и React Three Fiber визуализируют одну метрическую модель в 2D и 3D.

## Модель координат

Участок и его объекты описываются в метрах. `x` и `y` задают положение на плоскости, signed `z` — отметку по высоте (отрицательная отметка означает подземное расположение), а `width`, `length` и `height` — габариты. Элементы могут иметь footprint, polygon или polyline-геометрию, а произвольные свойства хранятся расширяемым набором параметров. Backend является единственным источником истины; визуализаторы не изменяют исходные координаты.

Денежные значения передаются строками, например `"12500.00"`, чтобы исключить ошибки округления. Даты используют формат `YYYY-MM-DD`.

## Запуск через Docker

```bash
cp .env.example .env
docker compose up --build
```

После запуска frontend доступен на `http://localhost:3000`, API healthcheck — на `http://localhost:8080/healthz`. Миграции применяются автоматически до старта backend, данные PostgreSQL сохраняются в Docker volume.

Остановить окружение:

```bash
docker compose down
```

Удаление volume и локальной базы выполняется только явно:

```bash
docker compose down -v
```

## Локальная разработка

Запустите PostgreSQL и миграции:

```bash
docker compose up -d postgres
docker compose run --rm migrate
```

Backend:

```bash
cd backend
DATABASE_URL='postgres://countryhouse:countryhouse_dev@localhost:5432/countryhouse?sslmode=disable' \
CORS_ALLOWED_ORIGIN='http://localhost:3000' go run ./cmd/api
```

Frontend:

```bash
cd frontend
npm ci
NEXT_PUBLIC_API_URL='http://localhost:8080' npm run dev
```

## Проверки

```bash
make backend-test
make frontend-check
```

Frontend-команды также доступны отдельно:

```bash
cd frontend
npm run format:check
npm run lint
npm test
npm run build
```

GitHub Actions независимо проверяет backend и frontend, затем собирает immutable Docker-образы. Production-параметры, адреса серверов и ключи хранятся только в защищённых настройках окружения и не документируются в репозитории.

## API

- `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `POST /api/v1/auth/logout`, `GET /api/v1/auth/me`;
- `GET|POST /api/v1/plots`;
- `GET|PATCH|DELETE /api/v1/plots/{plotId}`;
- CRUD `/api/v1/plots/{plotId}/objects/{objectId}`;
- CRUD `/api/v1/plots/{plotId}/expenses/{expenseId}`;
- CRUD `/api/v1/plots/{plotId}/timeline/tasks/{taskId}`.

Изменяющие запросы требуют корректный `Origin`, а доступ к данным всегда проверяется относительно текущего пользователя.
