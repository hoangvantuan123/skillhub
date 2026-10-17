package skillauth

import (
	"bytes"
	"encoding/base64"
	"image"
	"image/png"
	"strings"
	"testing"
)

func TestPersonalProfileValidation(t *testing.T) {
	valid := personalProfile{Name: "Nguyễn Văn An", Email: "an@example.com", BirthDate: "1990-02-20", Phone: "+84 901 234 567"}
	if e := validatePersonalProfile(valid); e != nil {
		t.Fatal(e)
	}
	for _, change := range []func(*personalProfile){func(p *personalProfile) { p.Name = " " }, func(p *personalProfile) { p.Email = "invalid" }, func(p *personalProfile) { p.BirthDate = "2999-01-01" }, func(p *personalProfile) { p.BirthDate = "2000-02-31" }, func(p *personalProfile) { p.Phone = "<script>" }, func(p *personalProfile) { p.AvatarURL = "https://example.com/a.png" }, func(p *personalProfile) { p.AvatarURL = "data:image/png;base64,not-an-image" }} {
		p := valid
		change(&p)
		if validatePersonalProfile(p) == nil {
			t.Fatalf("invalid profile accepted: %+v", p)
		}
	}
	var buffer bytes.Buffer
	png.Encode(&buffer, image.NewRGBA(image.Rect(0, 0, 160, 160)))
	valid.AvatarURL = "data:image/png;base64," + base64.StdEncoding.EncodeToString(buffer.Bytes())
	if e := validatePersonalProfile(valid); e != nil {
		t.Fatal(e)
	}
	buffer.Reset()
	png.Encode(&buffer, image.NewRGBA(image.Rect(0, 0, 600, 1)))
	valid.AvatarURL = "data:image/png;base64," + base64.StdEncoding.EncodeToString(buffer.Bytes())
	if validatePersonalProfile(valid) == nil {
		t.Fatal("oversized image dimensions accepted")
	}
}
func TestPersonalPasswordRules(t *testing.T) {
	if e := validatePasswordChange("old-password", "new-password-123"); e != nil {
		t.Fatal(e)
	}
	for _, pair := range [][2]string{{"", "new-password-123"}, {"old", "short"}, {"same-password-123", "same-password-123"}, {"old", strings.Repeat("a", 73)}, {"old", strings.Repeat("ấ", 25)}} {
		if validatePasswordChange(pair[0], pair[1]) == nil {
			t.Fatal("invalid password accepted")
		}
	}
}
