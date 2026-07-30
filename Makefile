.PHONY: dev down backend-test frontend-check

dev:
	docker compose up --build

down:
	docker compose down

backend-test:
	cd backend && go test -race ./...

frontend-check:
	cd frontend && npm run check
