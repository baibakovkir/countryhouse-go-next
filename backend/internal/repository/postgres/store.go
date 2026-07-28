package postgres

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/example/countryhouse/backend/internal/domain/domainerr"
	"github.com/example/countryhouse/backend/internal/domain/expense"
	"github.com/example/countryhouse/backend/internal/domain/money"
	"github.com/example/countryhouse/backend/internal/domain/plot"
	"github.com/example/countryhouse/backend/internal/domain/timeline"
)

type Store struct{ pool *pgxpool.Pool }

func New(pool *pgxpool.Pool) *Store { return &Store{pool: pool} }

func internal(message string, err error) error {
	return &domainerr.Error{Kind: domainerr.Internal, Message: message, Err: err}
}

func (s *Store) Create(ctx context.Context, width, length float64) (plot.Plot, error) {
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return plot.Plot{}, internal("could not start plot transaction", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()
	if _, err = tx.Exec(ctx, `SELECT pg_advisory_xact_lock(73001)`); err != nil {
		return plot.Plot{}, internal("could not lock plot creation", err)
	}
	var count int
	if err = tx.QueryRow(ctx, `SELECT count(*) FROM plots`).Scan(&count); err != nil {
		return plot.Plot{}, internal("could not inspect plots", err)
	}
	if count > 0 {
		return plot.Plot{}, domainerr.New(domainerr.Conflict, "current plot already exists")
	}
	var result plot.Plot
	err = tx.QueryRow(ctx, `INSERT INTO plots (width, length) VALUES ($1, $2) RETURNING id, width, length, created_at`, width, length).
		Scan(&result.ID, &result.Width, &result.Length, &result.CreatedAt)
	if err != nil {
		return plot.Plot{}, internal("could not create plot", err)
	}
	result.Objects = []plot.Object{}
	if err = tx.Commit(ctx); err != nil {
		return plot.Plot{}, internal("could not commit plot", err)
	}
	return result, nil
}

func (s *Store) GetCurrent(ctx context.Context) (plot.Plot, error) {
	rows, err := s.pool.Query(ctx, `SELECT id, width, length, created_at FROM plots ORDER BY created_at LIMIT 2`)
	if err != nil {
		return plot.Plot{}, internal("could not load plot", err)
	}
	defer rows.Close()
	var plots []plot.Plot
	for rows.Next() {
		var p plot.Plot
		if err := rows.Scan(&p.ID, &p.Width, &p.Length, &p.CreatedAt); err != nil {
			return plot.Plot{}, internal("could not scan plot", err)
		}
		plots = append(plots, p)
	}
	if err := rows.Err(); err != nil {
		return plot.Plot{}, internal("could not iterate plots", err)
	}
	if len(plots) == 0 {
		return plot.Plot{}, domainerr.New(domainerr.NotFound, "plot has not been created")
	}
	if len(plots) > 1 {
		return plot.Plot{}, domainerr.New(domainerr.Internal, "more than one current plot exists")
	}
	p := plots[0]
	objectRows, err := s.pool.Query(ctx, `
		SELECT id, plot_id, type, name, x, y, z, width, length, height, created_at
		FROM plot_objects WHERE plot_id = $1 ORDER BY created_at`, p.ID)
	if err != nil {
		return plot.Plot{}, internal("could not load plot objects", err)
	}
	defer objectRows.Close()
	p.Objects = []plot.Object{}
	for objectRows.Next() {
		var object plot.Object
		if err := objectRows.Scan(&object.ID, &object.PlotID, &object.Type, &object.Name, &object.X, &object.Y, &object.Z, &object.Width, &object.Length, &object.Height, &object.CreatedAt); err != nil {
			return plot.Plot{}, internal("could not scan plot object", err)
		}
		p.Objects = append(p.Objects, object)
	}
	return p, objectRows.Err()
}

func (s *Store) AddObject(ctx context.Context, object plot.Object) (plot.Object, error) {
	err := s.pool.QueryRow(ctx, `
		INSERT INTO plot_objects (plot_id, type, name, x, y, z, width, length, height)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
		RETURNING id, created_at`, object.PlotID, object.Type, object.Name, object.X, object.Y, object.Z, object.Width, object.Length, object.Height).
		Scan(&object.ID, &object.CreatedAt)
	if err != nil {
		return plot.Object{}, internal("could not create plot object", err)
	}
	return object, nil
}

func (s *Store) ObjectExists(ctx context.Context, plotID, objectID string) (bool, error) {
	var exists bool
	err := s.pool.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM plot_objects WHERE plot_id=$1 AND id=$2)`, plotID, objectID).Scan(&exists)
	if err != nil {
		return false, internal("could not inspect plot object", err)
	}
	return exists, nil
}

func (s *Store) CreateExpense(ctx context.Context, item expense.Expense) (expense.Expense, error) {
	err := s.pool.QueryRow(ctx, `
		INSERT INTO expenses (plot_id, plot_object_id, category, amount, currency, spent_on, description)
		VALUES ($1,$2,$3,$4::numeric,$5,$6,$7) RETURNING id, created_at`,
		item.PlotID, item.PlotObjectID, item.Category, string(item.Amount), item.Currency, item.Date, item.Description).
		Scan(&item.ID, &item.CreatedAt)
	if err != nil {
		return expense.Expense{}, internal("could not create expense", err)
	}
	return item, nil
}

func (s *Store) ListExpenses(ctx context.Context, plotID string) ([]expense.Expense, error) {
	rows, err := s.pool.Query(ctx, `
		SELECT id, plot_id, plot_object_id, category, amount::text, currency, spent_on, description, created_at
		FROM expenses WHERE plot_id=$1 ORDER BY spent_on DESC, created_at DESC`, plotID)
	if err != nil {
		return nil, internal("could not list expenses", err)
	}
	defer rows.Close()
	items := []expense.Expense{}
	for rows.Next() {
		var item expense.Expense
		if err := rows.Scan(&item.ID, &item.PlotID, &item.PlotObjectID, &item.Category, &item.Amount, &item.Currency, &item.Date, &item.Description, &item.CreatedAt); err != nil {
			return nil, internal("could not scan expense", err)
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (s *Store) CreateTask(ctx context.Context, task timeline.Task) (timeline.Task, error) {
	var budget any
	if task.PlannedBudget != nil {
		budget = string(*task.PlannedBudget)
	}
	err := s.pool.QueryRow(ctx, `
		INSERT INTO timeline_tasks (plot_id, title, due_date, planned_budget, currency, description)
		VALUES ($1,$2,$3,$4::numeric,$5,$6) RETURNING id, created_at`,
		task.PlotID, task.Title, task.DueDate, budget, task.Currency, task.Description).
		Scan(&task.ID, &task.CreatedAt)
	if err != nil {
		return timeline.Task{}, internal("could not create timeline task", err)
	}
	return task, nil
}

func (s *Store) ListTasks(ctx context.Context, plotID string) ([]timeline.Task, error) {
	rows, err := s.pool.Query(ctx, `
		SELECT id, plot_id, title, due_date, COALESCE(planned_budget::text,''), currency, description, created_at
		FROM timeline_tasks WHERE plot_id=$1 ORDER BY due_date, created_at`, plotID)
	if err != nil {
		return nil, internal("could not list timeline tasks", err)
	}
	defer rows.Close()
	items := []timeline.Task{}
	for rows.Next() {
		var item timeline.Task
		var budget string
		if err := rows.Scan(&item.ID, &item.PlotID, &item.Title, &item.DueDate, &budget, &item.Currency, &item.Description, &item.CreatedAt); err != nil {
			return nil, internal("could not scan timeline task", err)
		}
		if budget != "" {
			value := money.Amount(budget)
			item.PlannedBudget = &value
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

// Adapters keep the domain repository interfaces small while Store shares one pool.
type ExpenseRepository struct{ *Store }

func (r ExpenseRepository) Create(ctx context.Context, e expense.Expense) (expense.Expense, error) {
	return r.CreateExpense(ctx, e)
}
func (r ExpenseRepository) List(ctx context.Context, id string) ([]expense.Expense, error) {
	return r.ListExpenses(ctx, id)
}

type TimelineRepository struct{ *Store }

func (r TimelineRepository) Create(ctx context.Context, t timeline.Task) (timeline.Task, error) {
	return r.CreateTask(ctx, t)
}
func (r TimelineRepository) List(ctx context.Context, id string) ([]timeline.Task, error) {
	return r.ListTasks(ctx, id)
}
