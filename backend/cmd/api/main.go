package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"

	"github.com/example/countryhouse/backend/internal/application/authapp"
	"github.com/example/countryhouse/backend/internal/application/expenseapp"
	"github.com/example/countryhouse/backend/internal/application/plotapp"
	"github.com/example/countryhouse/backend/internal/application/timelineapp"
	"github.com/example/countryhouse/backend/internal/delivery/httpapi"
	domainauth "github.com/example/countryhouse/backend/internal/domain/auth"
	"github.com/example/countryhouse/backend/internal/repository/postgres"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	databaseURL := required("DATABASE_URL", logger)
	pool, err := pgxpool.New(context.Background(), databaseURL)
	if err != nil {
		logger.Error("invalid database configuration", "error", err)
		os.Exit(1)
	}
	defer pool.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := pool.Ping(ctx); err != nil {
		logger.Error("database is unavailable", "error", err)
		os.Exit(1)
	}

	store := postgres.New(pool)
	legacy, err := store.HasLegacyOwner(ctx)
	if err != nil {
		logger.Error("could not inspect legacy owner", "error", err)
		os.Exit(1)
	}
	if legacy {
		email := domainauth.NormalizeEmail(required("BOOTSTRAP_EMAIL", logger))
		password := required("BOOTSTRAP_PASSWORD", logger)
		if err := domainauth.ValidateEmail(email); err != nil {
			logger.Error("invalid bootstrap email", "error", err)
			os.Exit(1)
		}
		if err := domainauth.ValidatePassword(password); err != nil {
			logger.Error("invalid bootstrap password", "error", err)
			os.Exit(1)
		}
		hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
		if err == nil {
			err = store.ConfigureLegacyOwner(ctx, email, string(hash))
		}
		if err != nil {
			logger.Error("could not configure legacy owner", "error", err)
			os.Exit(1)
		}
	}
	authService := authapp.New(store)
	plotService := plotapp.New(store)
	expenseService := expenseapp.New(postgres.ExpenseRepository{Store: store}, store)
	timelineService := timelineapp.New(postgres.TimelineRepository{Store: store}, store)
	origin := env("CORS_ALLOWED_ORIGIN", "http://localhost:3000")
	secureCookie, err := strconv.ParseBool(env("COOKIE_SECURE", "false"))
	if err != nil {
		logger.Error("invalid COOKIE_SECURE", "error", err)
		os.Exit(1)
	}
	handler := httpapi.New(authService, plotService, expenseService, timelineService, logger, origin, secureCookie, func() error { return pool.Ping(context.Background()) })

	server := &http.Server{Addr: env("HTTP_ADDR", ":8080"), Handler: handler, ReadHeaderTimeout: 5 * time.Second, ReadTimeout: 15 * time.Second, WriteTimeout: 15 * time.Second, IdleTimeout: 60 * time.Second}
	go func() {
		logger.Info("api started", "address", server.Addr)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Error("server failed", "error", err)
			os.Exit(1)
		}
	}()

	stop, stopSignal := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stopSignal()
	<-stop.Done()
	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer shutdownCancel()
	if err := server.Shutdown(shutdownCtx); err != nil {
		logger.Error("graceful shutdown failed", "error", err)
	}
}

func env(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
func required(key string, logger *slog.Logger) string {
	value := os.Getenv(key)
	if value == "" {
		logger.Error("missing required environment variable", "name", key)
		os.Exit(1)
	}
	return value
}
