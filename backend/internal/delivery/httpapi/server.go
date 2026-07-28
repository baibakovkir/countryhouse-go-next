package httpapi

import (
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"

	"github.com/example/countryhouse/backend/internal/application/expenseapp"
	"github.com/example/countryhouse/backend/internal/application/plotapp"
	"github.com/example/countryhouse/backend/internal/application/timelineapp"
	"github.com/example/countryhouse/backend/internal/domain/domainerr"
	"github.com/example/countryhouse/backend/internal/domain/expense"
	"github.com/example/countryhouse/backend/internal/domain/money"
	"github.com/example/countryhouse/backend/internal/domain/plot"
	"github.com/example/countryhouse/backend/internal/domain/timeline"
)

type Server struct {
	plot     *plotapp.Service
	expenses *expenseapp.Service
	timeline *timelineapp.Service
	logger   *slog.Logger
	origin   string
	health   func() error
}

func New(plotService *plotapp.Service, expenseService *expenseapp.Service, timelineService *timelineapp.Service, logger *slog.Logger, origin string, health func() error) http.Handler {
	s := &Server{plot: plotService, expenses: expenseService, timeline: timelineService, logger: logger, origin: origin, health: health}
	r := chi.NewRouter()
	r.Use(middleware.RequestID, middleware.RealIP, middleware.Recoverer, s.cors)
	r.Get("/healthz", s.healthz)
	r.Route("/api/v1", func(r chi.Router) {
		r.Get("/plot", s.getPlot)
		r.Post("/plot", s.createPlot)
		r.Post("/plot/objects", s.createObject)
		r.Get("/expenses", s.listExpenses)
		r.Post("/expenses", s.createExpense)
		r.Get("/timeline/tasks", s.listTasks)
		r.Post("/timeline/tasks", s.createTask)
	})
	return r
}

func (s *Server) cors(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", s.origin)
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		w.Header().Set("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func (s *Server) healthz(w http.ResponseWriter, _ *http.Request) {
	if err := s.health(); err != nil {
		s.writeError(w, &domainerr.Error{Kind: domainerr.Internal, Message: "database is unavailable", Err: err})
		return
	}
	s.writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

type createPlotRequest struct {
	Width  float64 `json:"width"`
	Length float64 `json:"length"`
}

func (s *Server) createPlot(w http.ResponseWriter, r *http.Request) {
	var request createPlotRequest
	if !s.decode(w, r, &request) {
		return
	}
	result, err := s.plot.Create(r.Context(), request.Width, request.Length)
	if err != nil {
		s.writeError(w, err)
		return
	}
	s.writeJSON(w, http.StatusCreated, result)
}

func (s *Server) getPlot(w http.ResponseWriter, r *http.Request) {
	result, err := s.plot.Get(r.Context())
	if err != nil {
		s.writeError(w, err)
		return
	}
	s.writeJSON(w, http.StatusOK, result)
}

type createObjectRequest struct {
	Type   plot.ObjectType `json:"type"`
	Name   string          `json:"name"`
	X      float64         `json:"x"`
	Y      float64         `json:"y"`
	Z      float64         `json:"z"`
	Width  float64         `json:"width"`
	Length float64         `json:"length"`
	Height float64         `json:"height"`
}

func (s *Server) createObject(w http.ResponseWriter, r *http.Request) {
	var request createObjectRequest
	if !s.decode(w, r, &request) {
		return
	}
	result, err := s.plot.AddObject(r.Context(), plot.Object{Type: request.Type, Name: request.Name, X: request.X, Y: request.Y, Z: request.Z, Width: request.Width, Length: request.Length, Height: request.Height})
	if err != nil {
		s.writeError(w, err)
		return
	}
	s.writeJSON(w, http.StatusCreated, result)
}

type createExpenseRequest struct {
	PlotObjectID *string `json:"plotObjectId"`
	Category     string  `json:"category"`
	Amount       string  `json:"amount"`
	Currency     string  `json:"currency"`
	Date         string  `json:"date"`
	Description  string  `json:"description"`
}

type expenseResponse struct {
	ID           string       `json:"id"`
	PlotObjectID *string      `json:"plotObjectId"`
	Category     string       `json:"category"`
	Amount       money.Amount `json:"amount"`
	Currency     string       `json:"currency"`
	Date         string       `json:"date"`
	Description  string       `json:"description"`
	CreatedAt    time.Time    `json:"createdAt"`
}

func expenseDTO(item expense.Expense) expenseResponse {
	return expenseResponse{item.ID, item.PlotObjectID, item.Category, item.Amount, strings.TrimSpace(item.Currency), item.Date.Format(time.DateOnly), item.Description, item.CreatedAt}
}

func (s *Server) createExpense(w http.ResponseWriter, r *http.Request) {
	var request createExpenseRequest
	if !s.decode(w, r, &request) {
		return
	}
	amount, err := money.Parse(request.Amount, false)
	if err != nil {
		s.writeError(w, err)
		return
	}
	date, err := time.Parse(time.DateOnly, request.Date)
	if err != nil {
		s.writeError(w, domainerr.Field("date", "must use YYYY-MM-DD"))
		return
	}
	result, err := s.expenses.Create(r.Context(), expense.Expense{PlotObjectID: request.PlotObjectID, Category: request.Category, Amount: amount, Currency: request.Currency, Date: date, Description: request.Description})
	if err != nil {
		s.writeError(w, err)
		return
	}
	s.writeJSON(w, http.StatusCreated, expenseDTO(result))
}

func (s *Server) listExpenses(w http.ResponseWriter, r *http.Request) {
	items, err := s.expenses.List(r.Context())
	if err != nil {
		s.writeError(w, err)
		return
	}
	response := make([]expenseResponse, 0, len(items))
	for _, item := range items {
		response = append(response, expenseDTO(item))
	}
	s.writeJSON(w, http.StatusOK, response)
}

type createTaskRequest struct {
	Title         string  `json:"title"`
	DueDate       string  `json:"dueDate"`
	PlannedBudget *string `json:"plannedBudget"`
	Currency      string  `json:"currency"`
	Description   string  `json:"description"`
}

type taskResponse struct {
	ID            string        `json:"id"`
	Title         string        `json:"title"`
	DueDate       string        `json:"dueDate"`
	PlannedBudget *money.Amount `json:"plannedBudget"`
	Currency      string        `json:"currency"`
	Description   string        `json:"description"`
	CreatedAt     time.Time     `json:"createdAt"`
}

func taskDTO(item timeline.Task) taskResponse {
	return taskResponse{item.ID, item.Title, item.DueDate.Format(time.DateOnly), item.PlannedBudget, strings.TrimSpace(item.Currency), item.Description, item.CreatedAt}
}

func (s *Server) createTask(w http.ResponseWriter, r *http.Request) {
	var request createTaskRequest
	if !s.decode(w, r, &request) {
		return
	}
	dueDate, err := time.Parse(time.DateOnly, request.DueDate)
	if err != nil {
		s.writeError(w, domainerr.Field("dueDate", "must use YYYY-MM-DD"))
		return
	}
	var budget *money.Amount
	if request.PlannedBudget != nil && *request.PlannedBudget != "" {
		value, err := money.Parse(*request.PlannedBudget, true)
		if err != nil {
			s.writeError(w, err)
			return
		}
		budget = &value
	}
	result, err := s.timeline.Create(r.Context(), timeline.Task{Title: request.Title, DueDate: dueDate, PlannedBudget: budget, Currency: request.Currency, Description: request.Description})
	if err != nil {
		s.writeError(w, err)
		return
	}
	s.writeJSON(w, http.StatusCreated, taskDTO(result))
}

func (s *Server) listTasks(w http.ResponseWriter, r *http.Request) {
	items, err := s.timeline.List(r.Context())
	if err != nil {
		s.writeError(w, err)
		return
	}
	response := make([]taskResponse, 0, len(items))
	for _, item := range items {
		response = append(response, taskDTO(item))
	}
	s.writeJSON(w, http.StatusOK, response)
}

func (s *Server) decode(w http.ResponseWriter, r *http.Request, target any) bool {
	decoder := json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<20))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(target); err != nil {
		s.writeError(w, &domainerr.Error{Kind: domainerr.Validation, Message: "invalid JSON body", Err: err})
		return false
	}
	return true
}

func (s *Server) writeError(w http.ResponseWriter, err error) {
	var typed *domainerr.Error
	if !errors.As(err, &typed) {
		typed = &domainerr.Error{Kind: domainerr.Internal, Message: "internal server error", Err: err}
	}
	status := http.StatusInternalServerError
	switch typed.Kind {
	case domainerr.Validation:
		status = http.StatusBadRequest
	case domainerr.NotFound:
		status = http.StatusNotFound
	case domainerr.Conflict:
		status = http.StatusConflict
	}
	if status == http.StatusInternalServerError {
		s.logger.Error("request failed", "error", err)
	}
	s.writeJSON(w, status, map[string]any{"error": map[string]any{"code": typed.Kind, "message": typed.Message, "details": typed.Details}})
}

func (s *Server) writeJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(value); err != nil {
		s.logger.Error("could not encode response", "error", err)
	}
}
