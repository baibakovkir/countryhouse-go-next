package money

import (
	"math/big"
	"regexp"

	"github.com/example/countryhouse/backend/internal/domain/domainerr"
)

var amountPattern = regexp.MustCompile(`^(0|[1-9][0-9]{0,11})(\.[0-9]{1,2})?$`)

type Amount string

func Parse(value string, allowZero bool) (Amount, error) {
	if !amountPattern.MatchString(value) {
		return "", domainerr.Field("amount", "must be a decimal with at most two fraction digits")
	}
	r, ok := new(big.Rat).SetString(value)
	if !ok || r.Sign() < 0 || (!allowZero && r.Sign() == 0) {
		return "", domainerr.Field("amount", "must be greater than zero")
	}
	return Amount(value), nil
}
