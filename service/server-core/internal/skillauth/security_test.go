package skillauth

import (
	"bytes"
	"testing"
)

func TestMetadataEncryption(t *testing.T) {
	key := bytes.Repeat([]byte{7}, 32)
	a, e := seal(key, "127.0.0.1")
	if e != nil {
		t.Fatal(e)
	}
	b, e := seal(key, "127.0.0.1")
	if e != nil {
		t.Fatal(e)
	}
	if a == b {
		t.Fatal("nonce reuse")
	}
	plain, e := openMetadata(key, a)
	if e != nil || plain != "127.0.0.1" {
		t.Fatal("round trip failed")
	}
	if _, e = openMetadata(bytes.Repeat([]byte{9}, 32), a); e == nil {
		t.Fatal("wrong key accepted")
	}
	if _, e = openMetadata(key, "enc1:AAAA"); e == nil {
		t.Fatal("invalid ciphertext accepted")
	}
}
func TestModuleValidation(t *testing.T) {
	for _, tc := range []struct {
		m  Module
		ok bool
	}{{Module{Key: "courses", Label: "Khóa học", Actions: []string{"view", "import"}}, true}, {Module{Key: "../evil", Label: "Bad", Actions: []string{"view"}}, false}, {Module{Key: "courses", Label: "Khóa học", Actions: []string{"create"}}, false}, {Module{Key: "courses", Label: "Khóa học", Actions: []string{"view", "view"}}, false}, {Module{Key: "courses", Label: "Khóa học", Actions: []string{"view", "*"}}, false}} {
		if (validateModule(tc.m) == nil) != tc.ok {
			t.Fatalf("unexpected validation: %+v", tc.m)
		}
	}
}

func TestSystemModuleEditing(t *testing.T) {
	base := Module{Key: "modules", Label: "Tên mới", Enabled: true, Actions: append([]string{}, systemActions["modules"]...)}
	if e := validateSystemUpdate(base); e != nil {
		t.Fatal("renaming system module should be allowed", e)
	}
	base.Actions = append(base.Actions, "archive")
	if e := validateSystemUpdate(base); e != nil {
		t.Fatal("custom action should be allowed", e)
	}
	base.Enabled = false
	if e := validateSystemUpdate(base); e == nil {
		t.Fatal("system module disabled")
	}
	base.Enabled = true
	base.Actions = []string{"view"}
	if e := validateSystemUpdate(base); e == nil {
		t.Fatal("core actions removed")
	}
}
