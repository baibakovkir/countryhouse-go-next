package domainerr

import "fmt"

type Kind string

const (
	Validation   Kind = "validation_error"
	NotFound     Kind = "not_found"
	Conflict     Kind = "conflict"
	Unauthorized Kind = "unauthorized"
	Internal     Kind = "internal_error"
)

type Error struct {
	Kind    Kind
	Message string
	Details map[string]string
	Err     error
}

func (e *Error) Error() string {
	if e.Err != nil {
		return fmt.Sprintf("%s: %v", e.Message, e.Err)
	}
	return e.Message
}

func (e *Error) Unwrap() error { return e.Err }

func New(kind Kind, message string) *Error { return &Error{Kind: kind, Message: message} }

func Field(field, message string) *Error {
	return &Error{Kind: Validation, Message: "invalid input", Details: map[string]string{field: message}}
}
