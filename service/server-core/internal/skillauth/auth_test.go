package skillauth

import "testing"

func TestRefreshSecrets(t *testing.T) {
	a, e := randomToken()
	if e != nil {
		t.Fatal(e)
	}
	b, e := randomToken()
	if e != nil {
		t.Fatal(e)
	}
	if len(a) != 64 || a == b || digest(a) == a || digest(a) == digest(b) {
		t.Fatal("invalid random refresh token or digest")
	}
}
