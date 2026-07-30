package httpapi

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"

	"github.com/example/countryhouse/backend/internal/application/authapp"
	"github.com/example/countryhouse/backend/internal/application/expenseapp"
	"github.com/example/countryhouse/backend/internal/application/plotapp"
	"github.com/example/countryhouse/backend/internal/application/timelineapp"
	domainauth "github.com/example/countryhouse/backend/internal/domain/auth"
	"github.com/example/countryhouse/backend/internal/domain/domainerr"
	"github.com/example/countryhouse/backend/internal/domain/expense"
	"github.com/example/countryhouse/backend/internal/domain/money"
	"github.com/example/countryhouse/backend/internal/domain/plot"
	"github.com/example/countryhouse/backend/internal/domain/timeline"
)

const sessionCookie = "countryhouse_session"

type userContextKey struct{}

type Server struct {
	auth         *authapp.Service
	plot         *plotapp.Service
	expenses     *expenseapp.Service
	timeline     *timelineapp.Service
	logger       *slog.Logger
	origin       string
	secureCookie bool
	health       func() error
}

func New(authService *authapp.Service, plotService *plotapp.Service, expenseService *expenseapp.Service, timelineService *timelineapp.Service, logger *slog.Logger, origin string, secureCookie bool, health func() error) http.Handler {
	s := &Server{auth: authService, plot: plotService, expenses: expenseService, timeline: timelineService, logger: logger, origin: strings.TrimRight(origin, "/"), secureCookie: secureCookie, health: health}
	r := chi.NewRouter()
	r.Use(middleware.RequestID, middleware.RealIP, middleware.Recoverer, s.cors)
	r.Get("/healthz", s.healthz)
	r.Route("/api/v1", func(r chi.Router) {
		r.Post("/auth/register", s.register)
		r.Post("/auth/login", s.login)
		r.Group(func(r chi.Router) {
			r.Use(s.authenticate)
			r.Get("/auth/me", s.me)
			r.Post("/auth/logout", s.logout)
			r.Route("/plots", func(r chi.Router) {
				r.Get("/", s.listPlots)
				r.Post("/", s.createPlot)
				r.Route("/{plotId}", func(r chi.Router) {
					r.Get("/", s.getPlot)
					r.Patch("/", s.updatePlot)
					r.Delete("/", s.deletePlot)
					r.Route("/objects", func(r chi.Router) {
						r.Get("/", s.listObjects)
						r.Post("/", s.createObject)
						r.Route("/{objectId}", func(r chi.Router) {
							r.Get("/", s.getObject)
							r.Patch("/", s.updateObject)
							r.Delete("/", s.deleteObject)
						})
					})
					r.Route("/expenses", func(r chi.Router) {
						r.Get("/", s.listExpenses)
						r.Post("/", s.createExpense)
						r.Route("/{expenseId}", func(r chi.Router) {
							r.Get("/", s.getExpense)
							r.Patch("/", s.updateExpense)
							r.Delete("/", s.deleteExpense)
						})
					})
					r.Route("/timeline/tasks", func(r chi.Router) {
						r.Get("/", s.listTasks)
						r.Post("/", s.createTask)
						r.Route("/{taskId}", func(r chi.Router) { r.Get("/", s.getTask); r.Patch("/", s.updateTask); r.Delete("/", s.deleteTask) })
					})
				})
			})
		})
	})
	return r
}

func (s *Server) cors(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", s.origin)
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		w.Header().Set("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS")
		w.Header().Add("Vary", "Origin")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}
func (s *Server) authenticate(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		cookie, err := r.Cookie(sessionCookie)
		if err != nil {
			s.writeError(w, domainerr.New(domainerr.Unauthorized, "authentication required"))
			return
		}
		user, err := s.auth.Authenticate(r.Context(), cookie.Value)
		if err != nil {
			s.writeError(w, err)
			return
		}
		if r.Method != http.MethodGet && r.Method != http.MethodHead && r.Method != http.MethodOptions && r.Header.Get("Origin") != s.origin {
			s.writeError(w, domainerr.New(domainerr.Unauthorized, "invalid request origin"))
			return
		}
		next.ServeHTTP(w, r.WithContext(context.WithValue(r.Context(), userContextKey{}, user)))
	})
}
func currentUser(r *http.Request) domainauth.User {
	return r.Context().Value(userContextKey{}).(domainauth.User)
}
func (s *Server) setSession(w http.ResponseWriter, result authapp.Result) {
	http.SetCookie(w, &http.Cookie{Name: sessionCookie, Value: result.Token, Path: "/", HttpOnly: true, Secure: s.secureCookie, SameSite: http.SameSiteLaxMode, Expires: result.ExpiresAt, MaxAge: int(time.Until(result.ExpiresAt).Seconds())})
}
func (s *Server) clearSession(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{Name: sessionCookie, Value: "", Path: "/", HttpOnly: true, Secure: s.secureCookie, SameSite: http.SameSiteLaxMode, Expires: time.Unix(1, 0), MaxAge: -1})
}

type authRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func (s *Server) register(w http.ResponseWriter, r *http.Request) {
	var in authRequest
	if !s.decode(w, r, &in) {
		return
	}
	result, err := s.auth.Register(r.Context(), in.Email, in.Password)
	if err != nil {
		s.writeError(w, err)
		return
	}
	s.setSession(w, result)
	s.writeJSON(w, http.StatusCreated, result.User)
}
func (s *Server) login(w http.ResponseWriter, r *http.Request) {
	var in authRequest
	if !s.decode(w, r, &in) {
		return
	}
	result, err := s.auth.Login(r.Context(), in.Email, in.Password)
	if err != nil {
		s.writeError(w, err)
		return
	}
	s.setSession(w, result)
	s.writeJSON(w, http.StatusOK, result.User)
}
func (s *Server) logout(w http.ResponseWriter, r *http.Request) {
	cookie, _ := r.Cookie(sessionCookie)
	if cookie != nil {
		if err := s.auth.Logout(r.Context(), cookie.Value); err != nil {
			s.writeError(w, err)
			return
		}
	}
	s.clearSession(w)
	w.WriteHeader(http.StatusNoContent)
}
func (s *Server) me(w http.ResponseWriter, r *http.Request) {
	s.writeJSON(w, http.StatusOK, currentUser(r))
}

type createPlotRequest struct {
	Name   string  `json:"name"`
	Width  float64 `json:"width"`
	Length float64 `json:"length"`
}
type updatePlotRequest struct {
	Name   *string  `json:"name"`
	Width  *float64 `json:"width"`
	Length *float64 `json:"length"`
}

func (s *Server) listPlots(w http.ResponseWriter, r *http.Request) {
	items, err := s.plot.List(r.Context(), currentUser(r).ID)
	if err != nil {
		s.writeError(w, err)
		return
	}
	s.writeJSON(w, http.StatusOK, items)
}
func (s *Server) createPlot(w http.ResponseWriter, r *http.Request) {
	var in createPlotRequest
	if !s.decode(w, r, &in) {
		return
	}
	item, err := s.plot.Create(r.Context(), currentUser(r).ID, in.Name, in.Width, in.Length)
	if err != nil {
		s.writeError(w, err)
		return
	}
	s.writeJSON(w, http.StatusCreated, item)
}
func (s *Server) getPlot(w http.ResponseWriter, r *http.Request) {
	item, err := s.plot.Get(r.Context(), currentUser(r).ID, chi.URLParam(r, "plotId"))
	if err != nil {
		s.writeError(w, err)
		return
	}
	s.writeJSON(w, http.StatusOK, item)
}
func (s *Server) updatePlot(w http.ResponseWriter, r *http.Request) {
	var in updatePlotRequest
	if !s.decode(w, r, &in) {
		return
	}
	if in.Name == nil && in.Width == nil && in.Length == nil {
		s.writeError(w, domainerr.Field("request", "must include at least one field"))
		return
	}
	item, err := s.plot.Update(r.Context(), currentUser(r).ID, chi.URLParam(r, "plotId"), in.Name, in.Width, in.Length)
	if err != nil {
		s.writeError(w, err)
		return
	}
	s.writeJSON(w, http.StatusOK, item)
}
func (s *Server) deletePlot(w http.ResponseWriter, r *http.Request) {
	if err := s.plot.Delete(r.Context(), currentUser(r).ID, chi.URLParam(r, "plotId")); err != nil {
		s.writeError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

type objectInput struct {
	Type   plot.ObjectType `json:"type"`
	Name   string          `json:"name"`
	X      float64         `json:"x"`
	Y      float64         `json:"y"`
	Z      float64         `json:"z"`
	Width  float64         `json:"width"`
	Length float64         `json:"length"`
	Height float64         `json:"height"`
}

func (i objectInput) value() plot.Object {
	return plot.Object{Type: i.Type, Name: i.Name, X: i.X, Y: i.Y, Z: i.Z, Width: i.Width, Length: i.Length, Height: i.Height}
}

type updateObjectRequest struct {
	Type   *plot.ObjectType `json:"type"`
	Name   *string          `json:"name"`
	X      *float64         `json:"x"`
	Y      *float64         `json:"y"`
	Z      *float64         `json:"z"`
	Width  *float64         `json:"width"`
	Length *float64         `json:"length"`
	Height *float64         `json:"height"`
}

func (s *Server) listObjects(w http.ResponseWriter, r *http.Request) {
	items, err := s.plot.ListObjects(r.Context(), currentUser(r).ID, chi.URLParam(r, "plotId"))
	if err != nil {
		s.writeError(w, err)
		return
	}
	s.writeJSON(w, http.StatusOK, items)
}
func (s *Server) createObject(w http.ResponseWriter, r *http.Request) {
	var in objectInput
	if !s.decode(w, r, &in) {
		return
	}
	item, err := s.plot.AddObject(r.Context(), currentUser(r).ID, chi.URLParam(r, "plotId"), in.value())
	if err != nil {
		s.writeError(w, err)
		return
	}
	s.writeJSON(w, http.StatusCreated, item)
}
func (s *Server) getObject(w http.ResponseWriter, r *http.Request) {
	item, err := s.plot.GetObject(r.Context(), currentUser(r).ID, chi.URLParam(r, "plotId"), chi.URLParam(r, "objectId"))
	if err != nil {
		s.writeError(w, err)
		return
	}
	s.writeJSON(w, http.StatusOK, item)
}
func (s *Server) updateObject(w http.ResponseWriter, r *http.Request) {
	var in updateObjectRequest
	if !s.decode(w, r, &in) {
		return
	}
	if in.Type == nil && in.Name == nil && in.X == nil && in.Y == nil && in.Z == nil && in.Width == nil && in.Length == nil && in.Height == nil {
		s.writeError(w, domainerr.Field("request", "must include at least one field"))
		return
	}
	item, err := s.plot.UpdateObject(r.Context(), currentUser(r).ID, chi.URLParam(r, "plotId"), chi.URLParam(r, "objectId"), func(o *plot.Object) {
		if in.Type != nil {
			o.Type = *in.Type
		}
		if in.Name != nil {
			o.Name = *in.Name
		}
		if in.X != nil {
			o.X = *in.X
		}
		if in.Y != nil {
			o.Y = *in.Y
		}
		if in.Z != nil {
			o.Z = *in.Z
		}
		if in.Width != nil {
			o.Width = *in.Width
		}
		if in.Length != nil {
			o.Length = *in.Length
		}
		if in.Height != nil {
			o.Height = *in.Height
		}
	})
	if err != nil {
		s.writeError(w, err)
		return
	}
	s.writeJSON(w, http.StatusOK, item)
}
func (s *Server) deleteObject(w http.ResponseWriter, r *http.Request) {
	if err := s.plot.DeleteObject(r.Context(), currentUser(r).ID, chi.URLParam(r, "plotId"), chi.URLParam(r, "objectId")); err != nil {
		s.writeError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

type nullableString struct {
	Set   bool
	Value *string
}

func (n *nullableString) UnmarshalJSON(data []byte) error {
	n.Set = true
	if bytes.Equal(data, []byte("null")) {
		n.Value = nil
		return nil
	}
	var value string
	if err := json.Unmarshal(data, &value); err != nil {
		return err
	}
	n.Value = &value
	return nil
}

type expenseInput struct {
	PlotObjectID *string `json:"plotObjectId"`
	Category     string  `json:"category"`
	Amount       string  `json:"amount"`
	Currency     string  `json:"currency"`
	Date         string  `json:"date"`
	Description  string  `json:"description"`
}
type updateExpenseRequest struct {
	PlotObjectID nullableString `json:"plotObjectId"`
	Category     *string        `json:"category"`
	Amount       *string        `json:"amount"`
	Currency     *string        `json:"currency"`
	Date         *string        `json:"date"`
	Description  *string        `json:"description"`
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
	UpdatedAt    time.Time    `json:"updatedAt"`
}

func expenseDTO(e expense.Expense) expenseResponse {
	return expenseResponse{e.ID, e.PlotObjectID, e.Category, e.Amount, strings.TrimSpace(e.Currency), e.Date.Format(time.DateOnly), e.Description, e.CreatedAt, e.UpdatedAt}
}
func parseExpense(in expenseInput) (expense.Expense, error) {
	amount, err := money.Parse(in.Amount, false)
	if err != nil {
		return expense.Expense{}, err
	}
	date, err := time.Parse(time.DateOnly, in.Date)
	if err != nil {
		return expense.Expense{}, domainerr.Field("date", "must use YYYY-MM-DD")
	}
	return expense.Expense{PlotObjectID: in.PlotObjectID, Category: in.Category, Amount: amount, Currency: in.Currency, Date: date, Description: in.Description}, nil
}
func (s *Server) listExpenses(w http.ResponseWriter, r *http.Request) {
	items, err := s.expenses.List(r.Context(), currentUser(r).ID, chi.URLParam(r, "plotId"))
	if err != nil {
		s.writeError(w, err)
		return
	}
	out := make([]expenseResponse, 0, len(items))
	for _, item := range items {
		out = append(out, expenseDTO(item))
	}
	s.writeJSON(w, http.StatusOK, out)
}
func (s *Server) createExpense(w http.ResponseWriter, r *http.Request) {
	var in expenseInput
	if !s.decode(w, r, &in) {
		return
	}
	value, err := parseExpense(in)
	if err != nil {
		s.writeError(w, err)
		return
	}
	item, err := s.expenses.Create(r.Context(), currentUser(r).ID, chi.URLParam(r, "plotId"), value)
	if err != nil {
		s.writeError(w, err)
		return
	}
	s.writeJSON(w, http.StatusCreated, expenseDTO(item))
}
func (s *Server) getExpense(w http.ResponseWriter, r *http.Request) {
	item, err := s.expenses.Get(r.Context(), currentUser(r).ID, chi.URLParam(r, "plotId"), chi.URLParam(r, "expenseId"))
	if err != nil {
		s.writeError(w, err)
		return
	}
	s.writeJSON(w, http.StatusOK, expenseDTO(item))
}
func (s *Server) updateExpense(w http.ResponseWriter, r *http.Request) {
	var in updateExpenseRequest
	if !s.decode(w, r, &in) {
		return
	}
	if !in.PlotObjectID.Set && in.Category == nil && in.Amount == nil && in.Currency == nil && in.Date == nil && in.Description == nil {
		s.writeError(w, domainerr.Field("request", "must include at least one field"))
		return
	}
	var amount *money.Amount
	if in.Amount != nil {
		v, err := money.Parse(*in.Amount, false)
		if err != nil {
			s.writeError(w, err)
			return
		}
		amount = &v
	}
	var date *time.Time
	if in.Date != nil {
		v, err := time.Parse(time.DateOnly, *in.Date)
		if err != nil {
			s.writeError(w, domainerr.Field("date", "must use YYYY-MM-DD"))
			return
		}
		date = &v
	}
	item, err := s.expenses.Update(r.Context(), currentUser(r).ID, chi.URLParam(r, "plotId"), chi.URLParam(r, "expenseId"), func(e *expense.Expense) {
		if in.PlotObjectID.Set {
			e.PlotObjectID = in.PlotObjectID.Value
		}
		if in.Category != nil {
			e.Category = *in.Category
		}
		if amount != nil {
			e.Amount = *amount
		}
		if in.Currency != nil {
			e.Currency = *in.Currency
		}
		if date != nil {
			e.Date = *date
		}
		if in.Description != nil {
			e.Description = *in.Description
		}
	})
	if err != nil {
		s.writeError(w, err)
		return
	}
	s.writeJSON(w, http.StatusOK, expenseDTO(item))
}
func (s *Server) deleteExpense(w http.ResponseWriter, r *http.Request) {
	if err := s.expenses.Delete(r.Context(), currentUser(r).ID, chi.URLParam(r, "plotId"), chi.URLParam(r, "expenseId")); err != nil {
		s.writeError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

type taskInput struct {
	Title         string  `json:"title"`
	DueDate       string  `json:"dueDate"`
	PlannedBudget *string `json:"plannedBudget"`
	Currency      string  `json:"currency"`
	Description   string  `json:"description"`
}
type updateTaskRequest struct {
	Title         *string        `json:"title"`
	DueDate       *string        `json:"dueDate"`
	PlannedBudget nullableString `json:"plannedBudget"`
	Currency      *string        `json:"currency"`
	Description   *string        `json:"description"`
}
type taskResponse struct {
	ID            string        `json:"id"`
	Title         string        `json:"title"`
	DueDate       string        `json:"dueDate"`
	PlannedBudget *money.Amount `json:"plannedBudget"`
	Currency      string        `json:"currency"`
	Description   string        `json:"description"`
	CreatedAt     time.Time     `json:"createdAt"`
	UpdatedAt     time.Time     `json:"updatedAt"`
}

func taskDTO(t timeline.Task) taskResponse {
	return taskResponse{t.ID, t.Title, t.DueDate.Format(time.DateOnly), t.PlannedBudget, strings.TrimSpace(t.Currency), t.Description, t.CreatedAt, t.UpdatedAt}
}
func parseBudget(raw *string) (*money.Amount, error) {
	if raw == nil || *raw == "" {
		return nil, nil
	}
	value, err := money.Parse(*raw, true)
	if err != nil {
		return nil, err
	}
	return &value, nil
}
func parseTask(in taskInput) (timeline.Task, error) {
	date, err := time.Parse(time.DateOnly, in.DueDate)
	if err != nil {
		return timeline.Task{}, domainerr.Field("dueDate", "must use YYYY-MM-DD")
	}
	budget, err := parseBudget(in.PlannedBudget)
	if err != nil {
		return timeline.Task{}, err
	}
	return timeline.Task{Title: in.Title, DueDate: date, PlannedBudget: budget, Currency: in.Currency, Description: in.Description}, nil
}
func (s *Server) listTasks(w http.ResponseWriter, r *http.Request) {
	items, err := s.timeline.List(r.Context(), currentUser(r).ID, chi.URLParam(r, "plotId"))
	if err != nil {
		s.writeError(w, err)
		return
	}
	out := make([]taskResponse, 0, len(items))
	for _, item := range items {
		out = append(out, taskDTO(item))
	}
	s.writeJSON(w, http.StatusOK, out)
}
func (s *Server) createTask(w http.ResponseWriter, r *http.Request) {
	var in taskInput
	if !s.decode(w, r, &in) {
		return
	}
	value, err := parseTask(in)
	if err != nil {
		s.writeError(w, err)
		return
	}
	item, err := s.timeline.Create(r.Context(), currentUser(r).ID, chi.URLParam(r, "plotId"), value)
	if err != nil {
		s.writeError(w, err)
		return
	}
	s.writeJSON(w, http.StatusCreated, taskDTO(item))
}
func (s *Server) getTask(w http.ResponseWriter, r *http.Request) {
	item, err := s.timeline.Get(r.Context(), currentUser(r).ID, chi.URLParam(r, "plotId"), chi.URLParam(r, "taskId"))
	if err != nil {
		s.writeError(w, err)
		return
	}
	s.writeJSON(w, http.StatusOK, taskDTO(item))
}
func (s *Server) updateTask(w http.ResponseWriter, r *http.Request) {
	var in updateTaskRequest
	if !s.decode(w, r, &in) {
		return
	}
	if in.Title == nil && in.DueDate == nil && !in.PlannedBudget.Set && in.Currency == nil && in.Description == nil {
		s.writeError(w, domainerr.Field("request", "must include at least one field"))
		return
	}
	var date *time.Time
	if in.DueDate != nil {
		v, err := time.Parse(time.DateOnly, *in.DueDate)
		if err != nil {
			s.writeError(w, domainerr.Field("dueDate", "must use YYYY-MM-DD"))
			return
		}
		date = &v
	}
	var budget *money.Amount
	if in.PlannedBudget.Set && in.PlannedBudget.Value != nil {
		v, err := money.Parse(*in.PlannedBudget.Value, true)
		if err != nil {
			s.writeError(w, err)
			return
		}
		budget = &v
	}
	item, err := s.timeline.Update(r.Context(), currentUser(r).ID, chi.URLParam(r, "plotId"), chi.URLParam(r, "taskId"), func(t *timeline.Task) {
		if in.Title != nil {
			t.Title = *in.Title
		}
		if date != nil {
			t.DueDate = *date
		}
		if in.PlannedBudget.Set {
			t.PlannedBudget = budget
		}
		if in.Currency != nil {
			t.Currency = *in.Currency
		}
		if in.Description != nil {
			t.Description = *in.Description
		}
	})
	if err != nil {
		s.writeError(w, err)
		return
	}
	s.writeJSON(w, http.StatusOK, taskDTO(item))
}
func (s *Server) deleteTask(w http.ResponseWriter, r *http.Request) {
	if err := s.timeline.Delete(r.Context(), currentUser(r).ID, chi.URLParam(r, "plotId"), chi.URLParam(r, "taskId")); err != nil {
		s.writeError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (s *Server) healthz(w http.ResponseWriter, _ *http.Request) {
	if err := s.health(); err != nil {
		s.writeError(w, &domainerr.Error{Kind: domainerr.Internal, Message: "database is unavailable", Err: err})
		return
	}
	s.writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}
func (s *Server) decode(w http.ResponseWriter, r *http.Request, target any) bool {
	decoder := json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<20))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(target); err != nil {
		s.writeError(w, &domainerr.Error{Kind: domainerr.Validation, Message: "invalid JSON body", Err: err})
		return false
	}
	if err := decoder.Decode(&struct{}{}); err != io.EOF {
		s.writeError(w, domainerr.New(domainerr.Validation, "request body must contain one JSON object"))
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
	case domainerr.Unauthorized:
		status = http.StatusUnauthorized
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
