package postgres

import (
	"context"
	"errors"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"

	domainauth "github.com/example/countryhouse/backend/internal/domain/auth"
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
func deleted(command pgconn.CommandTag, message string) error {
	if command.RowsAffected() == 0 {
		return domainerr.New(domainerr.NotFound, message)
	}
	return nil
}

const legacyOwnerID = "00000000-0000-0000-0000-000000000001"

func (s *Store) HasLegacyOwner(ctx context.Context) (bool, error) {
	var exists bool
	err := s.pool.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM users WHERE id=$1 AND password_hash='!bootstrap-required!')`, legacyOwnerID).Scan(&exists)
	if err != nil {
		return false, internal("could not inspect legacy owner", err)
	}
	return exists, nil
}
func (s *Store) ConfigureLegacyOwner(ctx context.Context, email, passwordHash string) error {
	command, err := s.pool.Exec(ctx, `UPDATE users SET email=$1,password_hash=$2,updated_at=now() WHERE id=$3 AND password_hash='!bootstrap-required!'`, email, passwordHash, legacyOwnerID)
	if err != nil {
		return internal("could not configure legacy owner", err)
	}
	return deleted(command, "legacy owner does not require configuration")
}

func (s *Store) CreateUser(ctx context.Context, email, passwordHash string) (domainauth.User, error) {
	var user domainauth.User
	err := s.pool.QueryRow(ctx, `INSERT INTO users (email,password_hash) VALUES ($1,$2) RETURNING id,email,created_at`, email, passwordHash).Scan(&user.ID, &user.Email, &user.CreatedAt)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return domainauth.User{}, domainerr.New(domainerr.Conflict, "email is already registered")
		}
		return domainauth.User{}, internal("could not create user", err)
	}
	return user, nil
}
func (s *Store) FindUserByEmail(ctx context.Context, email string) (domainauth.Credentials, error) {
	var result domainauth.Credentials
	err := s.pool.QueryRow(ctx, `SELECT id,email,password_hash,created_at FROM users WHERE email=$1`, email).Scan(&result.ID, &result.Email, &result.PasswordHash, &result.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return domainauth.Credentials{}, domainerr.New(domainerr.NotFound, "user not found")
	}
	if err != nil {
		return domainauth.Credentials{}, internal("could not load user", err)
	}
	return result, nil
}
func (s *Store) CreateSession(ctx context.Context, userID, tokenHash string, expiresAt time.Time) error {
	_, err := s.pool.Exec(ctx, `INSERT INTO sessions(user_id,token_hash,expires_at) VALUES($1,$2,$3)`, userID, tokenHash, expiresAt)
	if err != nil {
		return internal("could not create session", err)
	}
	return nil
}
func (s *Store) FindUserBySession(ctx context.Context, tokenHash string, now time.Time) (domainauth.User, error) {
	var user domainauth.User
	err := s.pool.QueryRow(ctx, `SELECT u.id,u.email,u.created_at FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>$2`, tokenHash, now).Scan(&user.ID, &user.Email, &user.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return domainauth.User{}, domainerr.New(domainerr.NotFound, "session not found")
	}
	if err != nil {
		return domainauth.User{}, internal("could not load session", err)
	}
	return user, nil
}
func (s *Store) DeleteSession(ctx context.Context, tokenHash string) error {
	_, err := s.pool.Exec(ctx, `DELETE FROM sessions WHERE token_hash=$1`, tokenHash)
	if err != nil {
		return internal("could not delete session", err)
	}
	return nil
}

func (s *Store) Create(ctx context.Context, p plot.Plot) (plot.Plot, error) {
	err := s.pool.QueryRow(ctx, `INSERT INTO plots(owner_id,name,width,length) VALUES($1,$2,$3,$4) RETURNING id,created_at,updated_at`, p.OwnerID, p.Name, p.Width, p.Length).Scan(&p.ID, &p.CreatedAt, &p.UpdatedAt)
	if err != nil {
		return plot.Plot{}, internal("could not create plot", err)
	}
	p.Objects = []plot.Object{}
	return p, nil
}
func (s *Store) List(ctx context.Context, ownerID string) ([]plot.Plot, error) {
	rows, err := s.pool.Query(ctx, `SELECT id,owner_id,name,width,length,created_at,updated_at FROM plots WHERE owner_id=$1 ORDER BY created_at`, ownerID)
	if err != nil {
		return nil, internal("could not list plots", err)
	}
	defer rows.Close()
	items := []plot.Plot{}
	for rows.Next() {
		var p plot.Plot
		if err := rows.Scan(&p.ID, &p.OwnerID, &p.Name, &p.Width, &p.Length, &p.CreatedAt, &p.UpdatedAt); err != nil {
			return nil, internal("could not scan plot", err)
		}
		p.Objects = []plot.Object{}
		items = append(items, p)
	}
	return items, rows.Err()
}
func (s *Store) Get(ctx context.Context, ownerID, plotID string) (plot.Plot, error) {
	var p plot.Plot
	err := s.pool.QueryRow(ctx, `SELECT id,owner_id,name,width,length,created_at,updated_at FROM plots WHERE owner_id=$1 AND id=$2`, ownerID, plotID).Scan(&p.ID, &p.OwnerID, &p.Name, &p.Width, &p.Length, &p.CreatedAt, &p.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return plot.Plot{}, domainerr.New(domainerr.NotFound, "plot not found")
	}
	if err != nil {
		return plot.Plot{}, internal("could not load plot", err)
	}
	p.Objects, err = s.ListObjects(ctx, ownerID, plotID)
	if err != nil {
		return plot.Plot{}, err
	}
	return p, nil
}
func (s *Store) Update(ctx context.Context, p plot.Plot) (plot.Plot, error) {
	err := s.pool.QueryRow(ctx, `UPDATE plots SET name=$1,width=$2,length=$3,updated_at=now() WHERE id=$4 AND owner_id=$5 RETURNING updated_at`, p.Name, p.Width, p.Length, p.ID, p.OwnerID).Scan(&p.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return plot.Plot{}, domainerr.New(domainerr.NotFound, "plot not found")
	}
	if err != nil {
		return plot.Plot{}, internal("could not update plot", err)
	}
	return p, nil
}
func (s *Store) Delete(ctx context.Context, ownerID, plotID string) error {
	command, err := s.pool.Exec(ctx, `DELETE FROM plots WHERE owner_id=$1 AND id=$2`, ownerID, plotID)
	if err != nil {
		return internal("could not delete plot", err)
	}
	return deleted(command, "plot not found")
}

const objectColumns = `o.id,o.plot_id,o.type,o.name,o.x,o.y,o.z,o.width,o.length,o.height,o.created_at,o.updated_at`

func scanObject(row pgx.Row) (plot.Object, error) {
	var o plot.Object
	err := row.Scan(&o.ID, &o.PlotID, &o.Type, &o.Name, &o.X, &o.Y, &o.Z, &o.Width, &o.Length, &o.Height, &o.CreatedAt, &o.UpdatedAt)
	return o, err
}
func (s *Store) AddObject(ctx context.Context, ownerID string, o plot.Object) (plot.Object, error) {
	err := s.pool.QueryRow(ctx, `INSERT INTO plot_objects(plot_id,type,name,x,y,z,width,length,height) SELECT p.id,$1,$2,$3,$4,$5,$6,$7,$8 FROM plots p WHERE p.id=$9 AND p.owner_id=$10 RETURNING id,created_at,updated_at`, o.Type, o.Name, o.X, o.Y, o.Z, o.Width, o.Length, o.Height, o.PlotID, ownerID).Scan(&o.ID, &o.CreatedAt, &o.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return plot.Object{}, domainerr.New(domainerr.NotFound, "plot not found")
	}
	if err != nil {
		return plot.Object{}, internal("could not create plot object", err)
	}
	return o, nil
}
func (s *Store) ListObjects(ctx context.Context, ownerID, plotID string) ([]plot.Object, error) {
	rows, err := s.pool.Query(ctx, `SELECT `+objectColumns+` FROM plot_objects o JOIN plots p ON p.id=o.plot_id WHERE p.owner_id=$1 AND p.id=$2 ORDER BY o.created_at`, ownerID, plotID)
	if err != nil {
		return nil, internal("could not list plot objects", err)
	}
	defer rows.Close()
	items := []plot.Object{}
	for rows.Next() {
		var o plot.Object
		if err := rows.Scan(&o.ID, &o.PlotID, &o.Type, &o.Name, &o.X, &o.Y, &o.Z, &o.Width, &o.Length, &o.Height, &o.CreatedAt, &o.UpdatedAt); err != nil {
			return nil, internal("could not scan plot object", err)
		}
		items = append(items, o)
	}
	return items, rows.Err()
}
func (s *Store) GetObject(ctx context.Context, ownerID, plotID, objectID string) (plot.Object, error) {
	o, err := scanObject(s.pool.QueryRow(ctx, `SELECT `+objectColumns+` FROM plot_objects o JOIN plots p ON p.id=o.plot_id WHERE p.owner_id=$1 AND p.id=$2 AND o.id=$3`, ownerID, plotID, objectID))
	if errors.Is(err, pgx.ErrNoRows) {
		return plot.Object{}, domainerr.New(domainerr.NotFound, "plot object not found")
	}
	if err != nil {
		return plot.Object{}, internal("could not load plot object", err)
	}
	return o, nil
}
func (s *Store) UpdateObject(ctx context.Context, ownerID string, o plot.Object) (plot.Object, error) {
	err := s.pool.QueryRow(ctx, `UPDATE plot_objects o SET type=$1,name=$2,x=$3,y=$4,z=$5,width=$6,length=$7,height=$8,updated_at=now() FROM plots p WHERE o.plot_id=p.id AND p.owner_id=$9 AND o.id=$10 RETURNING o.updated_at`, o.Type, o.Name, o.X, o.Y, o.Z, o.Width, o.Length, o.Height, ownerID, o.ID).Scan(&o.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return plot.Object{}, domainerr.New(domainerr.NotFound, "plot object not found")
	}
	if err != nil {
		return plot.Object{}, internal("could not update plot object", err)
	}
	return o, nil
}
func (s *Store) DeleteObject(ctx context.Context, ownerID, plotID, objectID string) error {
	command, err := s.pool.Exec(ctx, `DELETE FROM plot_objects o USING plots p WHERE o.plot_id=p.id AND p.owner_id=$1 AND p.id=$2 AND o.id=$3`, ownerID, plotID, objectID)
	if err != nil {
		return internal("could not delete plot object", err)
	}
	return deleted(command, "plot object not found")
}

func scanExpense(row pgx.Row) (expense.Expense, error) {
	var e expense.Expense
	err := row.Scan(&e.ID, &e.PlotID, &e.PlotObjectID, &e.Category, &e.Amount, &e.Currency, &e.Date, &e.Description, &e.CreatedAt, &e.UpdatedAt)
	return e, err
}

const expenseColumns = `e.id,e.plot_id,e.plot_object_id,e.category,e.amount::text,e.currency,e.spent_on,e.description,e.created_at,e.updated_at`

func (s *Store) CreateExpense(ctx context.Context, ownerID string, e expense.Expense) (expense.Expense, error) {
	err := s.pool.QueryRow(ctx, `INSERT INTO expenses(plot_id,plot_object_id,category,amount,currency,spent_on,description) SELECT p.id,$1,$2,$3::numeric,$4,$5,$6 FROM plots p WHERE p.id=$7 AND p.owner_id=$8 RETURNING id,created_at,updated_at`, e.PlotObjectID, e.Category, string(e.Amount), e.Currency, e.Date, e.Description, e.PlotID, ownerID).Scan(&e.ID, &e.CreatedAt, &e.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return expense.Expense{}, domainerr.New(domainerr.NotFound, "plot not found")
	}
	if err != nil {
		return expense.Expense{}, internal("could not create expense", err)
	}
	return e, nil
}
func (s *Store) ListExpenses(ctx context.Context, ownerID, plotID string) ([]expense.Expense, error) {
	rows, err := s.pool.Query(ctx, `SELECT `+expenseColumns+` FROM expenses e JOIN plots p ON p.id=e.plot_id WHERE p.owner_id=$1 AND p.id=$2 ORDER BY e.spent_on DESC,e.created_at DESC`, ownerID, plotID)
	if err != nil {
		return nil, internal("could not list expenses", err)
	}
	defer rows.Close()
	items := []expense.Expense{}
	for rows.Next() {
		var e expense.Expense
		if err := rows.Scan(&e.ID, &e.PlotID, &e.PlotObjectID, &e.Category, &e.Amount, &e.Currency, &e.Date, &e.Description, &e.CreatedAt, &e.UpdatedAt); err != nil {
			return nil, internal("could not scan expense", err)
		}
		items = append(items, e)
	}
	return items, rows.Err()
}
func (s *Store) GetExpense(ctx context.Context, ownerID, plotID, id string) (expense.Expense, error) {
	e, err := scanExpense(s.pool.QueryRow(ctx, `SELECT `+expenseColumns+` FROM expenses e JOIN plots p ON p.id=e.plot_id WHERE p.owner_id=$1 AND p.id=$2 AND e.id=$3`, ownerID, plotID, id))
	if errors.Is(err, pgx.ErrNoRows) {
		return expense.Expense{}, domainerr.New(domainerr.NotFound, "expense not found")
	}
	if err != nil {
		return expense.Expense{}, internal("could not load expense", err)
	}
	return e, nil
}
func (s *Store) UpdateExpense(ctx context.Context, ownerID string, e expense.Expense) (expense.Expense, error) {
	err := s.pool.QueryRow(ctx, `UPDATE expenses e SET plot_object_id=$1,category=$2,amount=$3::numeric,currency=$4,spent_on=$5,description=$6,updated_at=now() FROM plots p WHERE e.plot_id=p.id AND p.owner_id=$7 AND e.id=$8 RETURNING e.updated_at`, e.PlotObjectID, e.Category, string(e.Amount), e.Currency, e.Date, e.Description, ownerID, e.ID).Scan(&e.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return expense.Expense{}, domainerr.New(domainerr.NotFound, "expense not found")
	}
	if err != nil {
		return expense.Expense{}, internal("could not update expense", err)
	}
	return e, nil
}
func (s *Store) DeleteExpense(ctx context.Context, ownerID, plotID, id string) error {
	command, err := s.pool.Exec(ctx, `DELETE FROM expenses e USING plots p WHERE e.plot_id=p.id AND p.owner_id=$1 AND p.id=$2 AND e.id=$3`, ownerID, plotID, id)
	if err != nil {
		return internal("could not delete expense", err)
	}
	return deleted(command, "expense not found")
}

func scanTask(row pgx.Row) (timeline.Task, error) {
	var t timeline.Task
	var budget string
	err := row.Scan(&t.ID, &t.PlotID, &t.Title, &t.DueDate, &budget, &t.Currency, &t.Description, &t.CreatedAt, &t.UpdatedAt)
	if budget != "" {
		value := money.Amount(budget)
		t.PlannedBudget = &value
	}
	return t, err
}

const taskColumns = `t.id,t.plot_id,t.title,t.due_date,COALESCE(t.planned_budget::text,''),t.currency,t.description,t.created_at,t.updated_at`

func (s *Store) CreateTask(ctx context.Context, ownerID string, t timeline.Task) (timeline.Task, error) {
	var budget any
	if t.PlannedBudget != nil {
		budget = string(*t.PlannedBudget)
	}
	err := s.pool.QueryRow(ctx, `INSERT INTO timeline_tasks(plot_id,title,due_date,planned_budget,currency,description) SELECT p.id,$1,$2,$3::numeric,$4,$5 FROM plots p WHERE p.id=$6 AND p.owner_id=$7 RETURNING id,created_at,updated_at`, t.Title, t.DueDate, budget, t.Currency, t.Description, t.PlotID, ownerID).Scan(&t.ID, &t.CreatedAt, &t.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return timeline.Task{}, domainerr.New(domainerr.NotFound, "plot not found")
	}
	if err != nil {
		return timeline.Task{}, internal("could not create timeline task", err)
	}
	return t, nil
}
func (s *Store) ListTasks(ctx context.Context, ownerID, plotID string) ([]timeline.Task, error) {
	rows, err := s.pool.Query(ctx, `SELECT `+taskColumns+` FROM timeline_tasks t JOIN plots p ON p.id=t.plot_id WHERE p.owner_id=$1 AND p.id=$2 ORDER BY t.due_date,t.created_at`, ownerID, plotID)
	if err != nil {
		return nil, internal("could not list tasks", err)
	}
	defer rows.Close()
	items := []timeline.Task{}
	for rows.Next() {
		var t timeline.Task
		var budget string
		if err := rows.Scan(&t.ID, &t.PlotID, &t.Title, &t.DueDate, &budget, &t.Currency, &t.Description, &t.CreatedAt, &t.UpdatedAt); err != nil {
			return nil, internal("could not scan task", err)
		}
		if budget != "" {
			value := money.Amount(budget)
			t.PlannedBudget = &value
		}
		items = append(items, t)
	}
	return items, rows.Err()
}
func (s *Store) GetTask(ctx context.Context, ownerID, plotID, id string) (timeline.Task, error) {
	t, err := scanTask(s.pool.QueryRow(ctx, `SELECT `+taskColumns+` FROM timeline_tasks t JOIN plots p ON p.id=t.plot_id WHERE p.owner_id=$1 AND p.id=$2 AND t.id=$3`, ownerID, plotID, id))
	if errors.Is(err, pgx.ErrNoRows) {
		return timeline.Task{}, domainerr.New(domainerr.NotFound, "task not found")
	}
	if err != nil {
		return timeline.Task{}, internal("could not load task", err)
	}
	return t, nil
}
func (s *Store) UpdateTask(ctx context.Context, ownerID string, t timeline.Task) (timeline.Task, error) {
	var budget any
	if t.PlannedBudget != nil {
		budget = string(*t.PlannedBudget)
	}
	err := s.pool.QueryRow(ctx, `UPDATE timeline_tasks t SET title=$1,due_date=$2,planned_budget=$3::numeric,currency=$4,description=$5,updated_at=now() FROM plots p WHERE t.plot_id=p.id AND p.owner_id=$6 AND t.id=$7 RETURNING t.updated_at`, t.Title, t.DueDate, budget, t.Currency, t.Description, ownerID, t.ID).Scan(&t.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return timeline.Task{}, domainerr.New(domainerr.NotFound, "task not found")
	}
	if err != nil {
		return timeline.Task{}, internal("could not update task", err)
	}
	return t, nil
}
func (s *Store) DeleteTask(ctx context.Context, ownerID, plotID, id string) error {
	command, err := s.pool.Exec(ctx, `DELETE FROM timeline_tasks t USING plots p WHERE t.plot_id=p.id AND p.owner_id=$1 AND p.id=$2 AND t.id=$3`, ownerID, plotID, id)
	if err != nil {
		return internal("could not delete task", err)
	}
	return deleted(command, "task not found")
}

type ExpenseRepository struct{ *Store }

func (r ExpenseRepository) Create(ctx context.Context, owner string, e expense.Expense) (expense.Expense, error) {
	return r.CreateExpense(ctx, owner, e)
}
func (r ExpenseRepository) List(ctx context.Context, owner, plotID string) ([]expense.Expense, error) {
	return r.ListExpenses(ctx, owner, plotID)
}
func (r ExpenseRepository) Get(ctx context.Context, owner, plotID, id string) (expense.Expense, error) {
	return r.GetExpense(ctx, owner, plotID, id)
}
func (r ExpenseRepository) Update(ctx context.Context, owner string, e expense.Expense) (expense.Expense, error) {
	return r.UpdateExpense(ctx, owner, e)
}
func (r ExpenseRepository) Delete(ctx context.Context, owner, plotID, id string) error {
	return r.DeleteExpense(ctx, owner, plotID, id)
}

type TimelineRepository struct{ *Store }

func (r TimelineRepository) Create(ctx context.Context, owner string, t timeline.Task) (timeline.Task, error) {
	return r.CreateTask(ctx, owner, t)
}
func (r TimelineRepository) List(ctx context.Context, owner, plotID string) ([]timeline.Task, error) {
	return r.ListTasks(ctx, owner, plotID)
}
func (r TimelineRepository) Get(ctx context.Context, owner, plotID, id string) (timeline.Task, error) {
	return r.GetTask(ctx, owner, plotID, id)
}
func (r TimelineRepository) Update(ctx context.Context, owner string, t timeline.Task) (timeline.Task, error) {
	return r.UpdateTask(ctx, owner, t)
}
func (r TimelineRepository) Delete(ctx context.Context, owner, plotID, id string) error {
	return r.DeleteTask(ctx, owner, plotID, id)
}
