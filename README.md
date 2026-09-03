# Планировщик участка — MVP

Монорепозиторий содержит Go REST API, Next.js-приложение и PostgreSQL. Пользователь может зарегистрироваться, вести несколько участков, размещать на них объекты, учитывать расходы и планировать работы.

## Запуск через Docker

1. Скопируйте настройки: `cp .env.example .env`.
2. Запустите сервисы: `docker compose up --build`.
3. Откройте http://localhost:3000. API healthcheck доступен на http://localhost:8080/healthz.

Сервис `migrate` автоматически применяет SQL-миграции перед запуском backend. Остановить окружение можно командой `docker compose down`; данные PostgreSQL сохраняются в volume. Для полного удаления локальных данных явно выполните `docker compose down -v`.

## Локальная разработка

Запустите PostgreSQL и примените миграцию:

```bash
docker compose up -d postgres
docker compose run --rm migrate
```

Backend использует адрес БД на хосте, а не имя контейнера:

```bash
cd backend
DATABASE_URL='postgres://countryhouse:countryhouse_dev@localhost:5432/countryhouse?sslmode=disable' \
CORS_ALLOWED_ORIGIN='http://localhost:3000' go run ./cmd/api
```

Frontend запускается в другом терминале:

```bash
cd frontend
npm ci
NEXT_PUBLIC_API_URL='http://localhost:8080' npm run dev
```

Проверки запускаются командами `make backend-test` и `make frontend-check`. Для frontend также доступны `npm run format`, `npm run format:check` и `npm run lint:fix`.

## Развёртывание на VM

Production использует `compose.prod.yml`: PostgreSQL остаётся внутри Docker, а backend и frontend публикуются только на loopback-портах `18080` и `13000`. Системный Nginx завершает TLS и остаётся единственной публичной точкой входа. CI публикует три приватных образа в GHCR и разворачивает immutable-тег вида `sha-<commit>`.

### 1. Подготовка VM

Целевая VM — `176.123.163.174`, пользователь `user`; Docker Engine, Compose plugin, Nginx и Certbot уже установлены. Пользователь должен иметь доступ к Docker и право выполнять одноразовые административные команды через `sudo`.

Создайте DNS A-запись `countryhouse.baibakovkir.space` на `176.123.163.174`. В firewall должны быть открыты `22/tcp`, `80/tcp` и `443/tcp`. Порты `13000`, `18080` и `5432` открывать нельзя.

```bash
sudo install -d -o user -g user -m 750 /opt/countryhouse
sudo install -d -o user -g user -m 750 /var/backups/countryhouse
```

Установите virtual host и получите сертификат после появления DNS-записи:

```bash
sudo install -o root -g root -m 644 ops/nginx-countryhouse.conf /etc/nginx/sites-available/countryhouse.conf
sudo ln -s /etc/nginx/sites-available/countryhouse.conf /etc/nginx/sites-enabled/countryhouse.conf
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d countryhouse.baibakovkir.space
```

Скопируйте на VM `compose.prod.yml`, `ops/backup.sh`, `.env.production.example` и создайте секреты:

```bash
cd /opt/countryhouse
cp .env.production.example .env
chmod 600 .env
printf '%s\n' 'IMAGE_TAG=sha-<existing-commit-sha>' > .release.env
chmod 600 .release.env
```

В `.env` укажите один длинный буквенно-цифровой пароль одновременно в `POSTGRES_PASSWORD` и `DATABASE_URL`. Production origin должен быть `https://countryhouse.baibakovkir.space`, а `COOKIE_SECURE` — `true`.

При первом развёртывании поверх версии без авторизации также задайте `BOOTSTRAP_EMAIL` и `BOOTSTRAP_PASSWORD` (не менее 12 символов). Миграция передаст этому владельцу ранее созданные участки. На чистой базе эти значения не требуются.

Создайте GitHub classic PAT только с `read:packages` и войдите в private GHCR на VM:

```bash
echo "$GHCR_TOKEN" | docker login ghcr.io -u <github-user> --password-stdin
```

### 2. Первый запуск

```bash
cd /opt/countryhouse
docker compose --env-file .env --env-file .release.env -f compose.prod.yml pull
docker compose --env-file .env --env-file .release.env -f compose.prod.yml up -d
docker compose --env-file .env --env-file .release.env -f compose.prod.yml ps
curl --fail http://127.0.0.1:18080/healthz
curl --fail https://countryhouse.baibakovkir.space/healthz
```

`migrate` должен завершиться с кодом `0`. В браузере приложение открывается по `https://countryhouse.baibakovkir.space`; прямого внешнего доступа к backend, frontend и PostgreSQL нет.

### 3. Автоматический deploy

В GitHub создайте environment `production` и secrets:

- `VM_HOST` — IP VM;
- `VM_USER` — `user`;
- `VM_PORT` — SSH-порт, можно оставить пустым для `22`;
- `VM_SSH_KEY` — приватный deploy-ключ без passphrase.
- `VM_KNOWN_HOSTS` — заранее проверенная строка host key VM из `ssh-keyscan -H <VM_HOST>`; fingerprint следует отдельно сверить через консоль облачного провайдера.

Pull request запускает проверки и тестовую сборку образов без публикации. После merge/push в `main` workflow публикует образы в GHCR, делает backup работающей БД, разворачивает новый SHA и проверяет локальный и публичный `/healthz`. При ошибке он возвращает предыдущий тег образов. Постоянный `.env` через CI не передаётся; миграции должны оставаться обратно совместимыми.

### 4. Backup и rollback

Проверить backup вручную:

```bash
/opt/countryhouse/backup.sh
```

Добавьте ежедневный запуск от пользователя `user`, например в `crontab -e`:

```cron
0 3 * * * /opt/countryhouse/backup.sh >> /var/backups/countryhouse/backup.log 2>&1
```

Локальные dump-файлы хранятся 14 дней. Для внешней копии установите `restic` и добавьте `RESTIC_REPOSITORY`, `RESTIC_PASSWORD` и credentials S3-совместимого хранилища в защищённый `.env`.

Для отката замените тег на предыдущий успешный SHA:

```bash
cd /opt/countryhouse
printf '%s\n' 'IMAGE_TAG=sha-<previous-commit-sha>' > .release.env
docker compose --env-file .env --env-file .release.env -f compose.prod.yml pull
docker compose --env-file .env --env-file .release.env -f compose.prod.yml up -d
```

Откат образов не откатывает БД, поэтому production-миграции должны оставаться обратно совместимыми.

## API

- `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `POST /api/v1/auth/logout`, `GET /api/v1/auth/me`
- `GET|POST /api/v1/plots`
- `GET|PATCH|DELETE /api/v1/plots/{plotId}`
- CRUD `/api/v1/plots/{plotId}/objects/{objectId}`
- CRUD `/api/v1/plots/{plotId}/expenses/{expenseId}`
- CRUD `/api/v1/plots/{plotId}/timeline/tasks/{taskId}`

Авторизация использует серверную сессию в `HttpOnly` cookie. Все запросы к данным проверяют владельца участка; браузерный API-клиент должен отправлять cookies (`credentials: include`). Для изменяющих запросов backend проверяет `Origin`.

Денежные значения передаются строками (`"12500.00"`), даты — в формате `YYYY-MM-DD`, геометрия — в метрах.
