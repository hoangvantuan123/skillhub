package skillauth

import (
	"context"
	"encoding/hex"
	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
	"github.com/joho/godotenv"
	"golang.org/x/crypto/bcrypt"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/structpb"
	"net"
	"net/url"
	"os"
	"testing"
)

// Explicit opt-in only; fixtures are created and removed within the local skillhub DB.
func TestSecurityIntegration(t *testing.T) {
	if os.Getenv("SKILLHUB_INTEGRATION") != "1" {
		t.Skip("set SKILLHUB_INTEGRATION=1")
	}
	godotenv.Load("../../.env")
	key, e := hex.DecodeString(os.Getenv("SKILLHUB_HISTORY_KEY"))
	if e != nil || len(key) != 32 {
		t.Fatal("missing history key")
	}
	port := os.Getenv("POSTGRES_PORT")
	if port == "" {
		port = "5432"
	}
	u := &url.URL{Scheme: "postgres", User: url.UserPassword(os.Getenv("POSTGRES_USER"), os.Getenv("POSTGRES_PASSWORD")), Host: net.JoinHostPort("localhost", port), Path: "skillhub", RawQuery: "sslmode=disable"}
	db, e := sqlx.Connect("postgres", u.String())
	if e != nil {
		t.Fatal(e)
	}
	defer db.Close()
	s := &Server{DB: db, Secret: []byte(os.Getenv("SKILLHUB_JWT_SECRET")), HistoryKey: key}
	ctx := context.Background()
	idA, idB := uuid.NewString(), uuid.NewString()
	module := "test_" + uuid.NewString()[:8]
	password, _ := randomToken()
	hash, _ := bcrypt.GenerateFromPassword([]byte(password), 4)
	defer func() {
		db.Exec(`DELETE FROM skillhub_modules WHERE key=$1 OR key=$2`, module, module+"_import")
		db.Exec(`DELETE FROM skillhub_security_audit WHERE actor_id IN ($1,$2)`, idA, idB)
		db.Exec(`DELETE FROM skillhub_login_events WHERE user_id IN ($1,$2)`, idA, idB)
		db.Exec(`DELETE FROM skillhub_sessions WHERE user_id IN ($1,$2)`, idA, idB)
		db.Exec(`DELETE FROM skillhub_grants WHERE user_id IN ($1,$2)`, idA, idB)
		db.Exec(`DELETE FROM skillhub_users WHERE id IN ($1,$2)`, idA, idB)
	}()
	for i, id := range []string{idA, idB} {
		role := "learner"
		if i == 0 {
			role = "admin"
		}
		_, e = db.Exec(`INSERT INTO skillhub_users(id,email,username,name,password_hash,role) VALUES($1,$2,$2,'Test fixture',$3,$4)`, id, "fixture_"+id, string(hash), role)
		if e != nil {
			t.Fatal(e)
		}
	}
	invoke := func(action, token string, payload any) (map[string]any, error) {
		in, _ := structpb.NewStruct(map[string]any{"action": action, "token": token, "payload": payload, "ip": "127.0.0.1", "user_agent": "Security integration", "username": "", "password": ""})
		out, e := s.Execute(ctx, in)
		if e != nil {
			return nil, e
		}
		return out.AsMap(), nil
	}
	login := func(id string) string {
		in, _ := structpb.NewStruct(map[string]any{"action": "login", "username": "fixture_" + id, "password": password, "ip": "127.0.0.1", "user_agent": "Security integration"})
		out, e := s.Execute(ctx, in)
		if e != nil {
			t.Fatal(e)
		}
		return out.AsMap()["access_token"].(string)
	}
	admin, learner := login(idA), login(idB)
	if _, e = invoke("modules", learner, nil); status.Code(e) != codes.PermissionDenied {
		t.Fatal("learner bypassed module view", e)
	}
	manifest := map[string]any{"key": module, "label": "Test module", "enabled": true, "actions": []any{"view", "create", "update", "delete", "import", "export", "approve"}}
	if _, e = invoke("module_create", admin, manifest); e != nil {
		t.Fatal(e)
	}
	if _, e = invoke("module_create", learner, manifest); status.Code(e) != codes.PermissionDenied {
		t.Fatal("learner bypassed create", e)
	}
	manifest["label"] = "Updated test module"
	if _, e = invoke("module_update", admin, manifest); e != nil {
		t.Fatal(e)
	}
	if _, e = invoke("grant_save", admin, map[string]any{"user_id": idB, "module": module, "actions": []any{"view", "import"}}); e != nil {
		t.Fatal(e)
	}
	result, e := invoke("me", learner, nil)
	if e != nil {
		t.Fatal(e)
	}
	user := result["user"].(map[string]any)
	found := false
	for _, p := range user["permissions"].([]any) {
		if p == module+":import" {
			found = true
		}
	}
	if !found {
		t.Fatal("grant not effective")
	}
	if _, e = invoke("grant_save", learner, map[string]any{"user_id": idB, "module": "modules", "actions": []any{"create"}}); status.Code(e) != codes.PermissionDenied {
		t.Fatal("privilege escalation", e)
	}
	if _, e = invoke("grant_save", admin, map[string]any{"user_id": idB, "module": module, "actions": []any{"unknown"}}); status.Code(e) != codes.InvalidArgument {
		t.Fatal("unknown permission accepted", e)
	}
	if _, e = invoke("module_import", admin, map[string]any{"modules": []any{map[string]any{"key": module + "_import", "label": "Import fixture", "enabled": true, "actions": []any{"view"}}, map[string]any{"key": "../bad", "label": "Bad fixture", "enabled": true, "actions": []any{"view"}}}}); status.Code(e) != codes.InvalidArgument {
		t.Fatal("bad import accepted", e)
	}
	var n int
	db.Get(&n, `SELECT count(*) FROM skillhub_modules WHERE key=$1`, module+"_import")
	if n != 0 {
		t.Fatal("import not atomic")
	}
	history, e := invoke("history", learner, nil)
	if e != nil {
		t.Fatal(e)
	}
	if len(history["history"].([]any)) != 1 {
		t.Fatal("history leaked other users")
	}
	var encrypted string
	db.Get(&encrypted, `SELECT ip FROM skillhub_login_events WHERE user_id=$1 LIMIT 1`, idB)
	if encrypted == "127.0.0.1" || len(encrypted) < 10 {
		t.Fatal("plaintext metadata")
	}
	if _, e = invoke("module_delete", admin, map[string]any{"key": "modules"}); status.Code(e) != codes.FailedPrecondition {
		t.Fatal("system module deleted", e)
	}
	if _, e = invoke("module_delete", admin, map[string]any{"key": module}); e != nil {
		t.Fatal(e)
	}
	if s.allowed(ctx, account{ID: idB, Role: "learner"}, module+":import") {
		t.Fatal("deleted grants still active")
	}
}

// Uses an already authorized local administrator; does not create or elevate accounts.
func TestExistingAdminModuleUpdate(t *testing.T) {
	if os.Getenv("SKILLHUB_EXISTING_ADMIN_TEST") != "1" {
		t.Skip("opt-in DB edit regression")
	}
	godotenv.Load("../../.env")
	port := os.Getenv("POSTGRES_PORT")
	if port == "" {
		port = "5432"
	}
	connURL := &url.URL{Scheme: "postgres", User: url.UserPassword(os.Getenv("POSTGRES_USER"), os.Getenv("POSTGRES_PASSWORD")), Host: net.JoinHostPort("localhost", port), Path: "skillhub", RawQuery: "sslmode=disable"}
	db, e := sqlx.Connect("postgres", connURL.String())
	if e != nil {
		t.Fatal(e)
	}
	defer db.Close()
	var admin account
	if e = db.QueryRow(`SELECT id,email,name,password_hash,role FROM skillhub_users WHERE username='admin' AND role='admin' AND enabled`).Scan(&admin.ID, &admin.Email, &admin.Name, &admin.Hash, &admin.Role); e != nil {
		t.Fatal("already authorized admin required", e)
	}
	ctx := context.Background()
	s := &Server{DB: db}
	list, e := loadModules(ctx, db)
	if e != nil {
		t.Fatal(e)
	}
	var original Module
	for _, m := range list {
		if m.Key == "learning" {
			original = m
		}
	}
	if original.Key == "" {
		t.Fatal("missing learning module")
	}
	call := func(m Module) error {
		_, e := s.moduleAction(ctx, admin, "module_update", map[string]any{"key": m.Key, "label": m.Label, "enabled": m.Enabled, "actions": m.Actions})
		return e
	}
	defer func() {
		if e := call(original); e != nil {
			t.Error("restore original module failed", e)
		}
	}()
	edited := original
	edited.Label = original.Label + " · QA"
	edited.Actions = append(append([]string{}, original.Actions...), "qa_extension")
	if e = call(edited); e != nil {
		t.Fatal("system module edit rejected", e)
	}
	var label string
	if e = db.Get(&label, `SELECT label FROM skillhub_modules WHERE key='learning'`); e != nil || label != edited.Label {
		t.Fatal("update not persisted", e)
	}
	edited.Actions = []string{"view"}
	if e = call(edited); status.Code(e) != codes.FailedPrecondition {
		t.Fatal("core action removal accepted", e)
	}
	edited = original
	edited.Enabled = false
	if e = call(edited); status.Code(e) != codes.FailedPrecondition {
		t.Fatal("system disable accepted", e)
	}
}
