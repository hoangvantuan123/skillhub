package skillauth

import (
	"context"
	"github.com/jmoiron/sqlx"
	"github.com/joho/godotenv"
	"net"
	"net/url"
	"os"
	"reflect"
	"testing"
)

func TestPermissionStructureIntegration(t *testing.T) {
	if os.Getenv("SKILLHUB_STRUCTURE_TEST") != "1" {
		t.Skip("opt-in permission structure regression")
	}
	godotenv.Load("../../.env")
	conn := &url.URL{Scheme: "postgres", User: url.UserPassword(os.Getenv("POSTGRES_USER"), os.Getenv("POSTGRES_PASSWORD")), Host: net.JoinHostPort("localhost", os.Getenv("POSTGRES_PORT")), Path: "skillhub", RawQuery: "sslmode=disable"}
	db, e := sqlx.Connect("postgres", conn.String())
	if e != nil {
		t.Fatal(e)
	}
	defer db.Close()
	s := &Server{DB: db}
	ctx := context.Background()
	var before, after int
	db.Get(&before, `SELECT count(*) FROM skillhub_group_members`)
	if e = s.InitPermissionGroups(ctx); e != nil {
		t.Fatal(e)
	}
	db.Get(&after, `SELECT count(*) FROM skillhub_group_members`)
	if before != after {
		t.Fatal("template initialization assigned members")
	}
	nodes, e := loadPermissionHierarchy(ctx, db)
	if e != nil {
		t.Fatal(e)
	}
	byID := map[string]PermissionNode{}
	for _, node := range nodes {
		byID[node.ID] = node
	}
	count := 0
	for _, node := range nodes {
		if node.Kind != "Quyền thao tác" {
			continue
		}
		count++
		kinds := []string{node.Kind}
		current := node
		for current.ParentID != nil {
			parent, ok := byID[*current.ParentID]
			if !ok {
				t.Fatal("missing parent")
			}
			kinds = append(kinds, parent.Kind)
			current = parent
			if len(kinds) > 5 {
				t.Fatal("cycle or extra hierarchy layer")
			}
		}
		if !reflect.DeepEqual(kinds, []string{"Quyền thao tác", "Chức năng", "Menu / Màn hình", "Nhóm menu", "Module"}) {
			t.Fatal(kinds)
		}
	}
	if count == 0 {
		t.Fatal("no permission data")
	}
	var admin account
	if e = db.QueryRow(`SELECT id,role FROM skillhub_users WHERE role='admin' AND enabled LIMIT 1`).Scan(&admin.ID, &admin.Role); e != nil {
		t.Fatal(e)
	}
	groups, e := s.peopleAction(ctx, admin, "group_list", nil)
	if e != nil {
		t.Fatal(e)
	}
	items := groups.AsMap()["groups"].([]any)
	found := map[string]bool{}
	for _, item := range items {
		g := item.(map[string]any)
		found[g["key"].(string)] = true
	}
	for _, template := range defaultPermissionGroups {
		if !found[template.Key] {
			t.Fatal("missing template", template.Key)
		}
	}
	people, e := s.peopleAction(ctx, admin, "people", nil)
	if e != nil {
		t.Fatal(e)
	}
	if len(people.AsMap()["users"].([]any)) < 1 {
		t.Fatal("member table has no users")
	}
	t.Logf("Validated %d persisted hierarchy nodes, %d rights, %d groups and real account data", len(nodes), count, len(items))
}
