# Планировщик участка — MVP

Монорепозиторий содержит Go REST API, Next.js-приложение и PostgreSQL. MVP позволяет создать один участок, разместить на нём объекты, учитывать расходы и вести список работ.

## Запуск через Docker

1. Скопируйте настройки: `cp .env.example .env`.
2. Запустите сервисы: `docker compose up --build`.
3. Откройте http://localhost:3000. API healthcheck доступен на http://localhost:8080/healthz.

Сервис `migrate` автоматически применяет SQL-миграции перед запуском backend. Остановить окружение можно командой `docker compose down`; данные PostgreSQL сохраняются в volume. Для полного удаления локальных данных явно выполните `docker compose down -v`.

## Локальная разработка

Запустите PostgreSQL через Compose, примените миграцию и задайте `DATABASE_URL`. Затем используйте `go run ./cmd/api` из `backend` и `npm run dev` из `frontend`. Проверки запускаются командами `make backend-test` и `make frontend-check`.

## API

- `GET|POST /api/v1/plot`
- `POST /api/v1/plot/objects`
- `GET|POST /api/v1/expenses`
- `GET|POST /api/v1/timeline/tasks`

Денежные значения передаются строками (`"12500.00"`), даты — в формате `YYYY-MM-DD`, геометрия — в метрах.

