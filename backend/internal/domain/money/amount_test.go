package money

import "testing"

func TestParse(t *testing.T) {
	t.Parallel()
	for _, test := range []struct {
		value            string
		allowZero, valid bool
	}{
		{"10", false, true}, {"10.50", false, true}, {"0", true, true},
		{"0", false, false}, {"1.234", false, false}, {"-1", false, false}, {"1e3", false, false},
	} {
		_, err := Parse(test.value, test.allowZero)
		if (err == nil) != test.valid {
			t.Errorf("Parse(%q) valid=%v, error=%v", test.value, test.valid, err)
		}
	}
}
