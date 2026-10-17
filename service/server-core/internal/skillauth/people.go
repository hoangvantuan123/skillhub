package skillauth

import (
	"context"
	"encoding/json"
	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
	"github.com/lib/pq"
	"golang.org/x/crypto/bcrypt"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/structpb"
	"regexp"
	"strings"
)

const PeopleSchema = `ALTER TABLE skillhub_users ADD COLUMN IF NOT EXISTS department text NOT NULL DEFAULT '';
ALTER TABLE skillhub_users ADD COLUMN IF NOT EXISTS position text NOT NULL DEFAULT '';
ALTER TABLE skillhub_users ADD COLUMN IF NOT EXISTS job_role text NOT NULL DEFAULT '';
CREATE TABLE IF NOT EXISTS skillhub_directory(kind text NOT NULL CHECK(kind IN ('department','position','job_role')),key text NOT NULL,label text NOT NULL,PRIMARY KEY(kind,key));
CREATE TABLE IF NOT EXISTS skillhub_permission_groups(key text PRIMARY KEY,label text NOT NULL,enabled boolean NOT NULL DEFAULT true,department text NOT NULL DEFAULT '',position text NOT NULL DEFAULT '',job_role text NOT NULL DEFAULT '');
CREATE TABLE IF NOT EXISTS skillhub_group_permissions(group_key text NOT NULL REFERENCES skillhub_permission_groups(key) ON DELETE CASCADE,module_key text NOT NULL REFERENCES skillhub_modules(key) ON DELETE CASCADE,action text NOT NULL,PRIMARY KEY(group_key,module_key,action));
CREATE TABLE IF NOT EXISTS skillhub_group_members(group_key text NOT NULL REFERENCES skillhub_permission_groups(key) ON DELETE CASCADE,user_id uuid NOT NULL REFERENCES skillhub_users(id) ON DELETE CASCADE,PRIMARY KEY(group_key,user_id));
INSERT INTO skillhub_modules(key,label,actions,system) VALUES('users','Quản lý tài khoản','["view","create","update"]',true) ON CONFLICT DO NOTHING;`
const groupMatch = `(EXISTS(SELECT 1 FROM skillhub_group_members gm WHERE gm.group_key=g.key AND gm.user_id=u.id) OR ((g.department<>'' OR g.position<>'' OR g.job_role<>'') AND (g.department='' OR g.department=u.department) AND (g.position='' OR g.position=u.position) AND (g.job_role='' OR g.job_role=u.job_role)))`

type GroupPermission struct {
	Module  string   `json:"module"`
	Actions []string `json:"actions"`
}
type PermissionGroup struct {
	Key         string            `json:"key"`
	Label       string            `json:"label"`
	Enabled     bool              `json:"enabled"`
	Department  string            `json:"department"`
	Position    string            `json:"position"`
	JobRole     string            `json:"job_role"`
	Permissions []GroupPermission `json:"permissions"`
	MemberCount int               `json:"member_count"`
}

func invalid(message string) error { return status.Error(codes.InvalidArgument, message) }
func validateDirectory(ctx context.Context, tx *sqlx.Tx, department, position, jobRole string) error {
	for kind, value := range map[string]string{"department": department, "position": position, "job_role": jobRole} {
		if value == "" {
			continue
		}
		var exists bool
		if e := tx.GetContext(ctx, &exists, `SELECT EXISTS(SELECT 1 FROM skillhub_directory WHERE kind=$1 AND key=$2)`, kind, value); e != nil {
			return e
		}
		if !exists {
			return invalid("Giá trị phòng ban/vị trí/vai trò chưa có trong danh mục")
		}
	}
	return nil
}
func (s *Server) peopleAction(ctx context.Context, u account, action string, payload any) (*structpb.Struct, error) {
	required := map[string]string{"people": "users:view", "user_update": "users:update", "user_create": "users:create", "group_list": "permissions:view", "group_save": "permissions:update", "group_delete": "permissions:update", "group_members": "permissions:update", "directory_save": "users:update"}
	permission, ok := required[action]
	if !ok {
		return nil, invalid("Unknown operation")
	}
	if !s.allowed(ctx, u, permission) {
		return nil, status.Error(codes.PermissionDenied, "Bạn không có quyền "+permission)
	}
	if action == "people" {
		rows, e := s.DB.QueryContext(ctx, `SELECT u.id,u.username,u.name,u.role,u.enabled,u.department,u.position,u.job_role,COALESCE((SELECT jsonb_agg(g.key ORDER BY g.key) FROM skillhub_permission_groups g WHERE g.enabled AND `+groupMatch+`),'[]'::jsonb),COALESCE((SELECT jsonb_agg(gm.group_key ORDER BY gm.group_key) FROM skillhub_group_members gm WHERE gm.user_id=u.id),'[]'::jsonb) FROM skillhub_users u ORDER BY u.username`)
		if e != nil {
			return nil, e
		}
		defer rows.Close()
		users := []any{}
		for rows.Next() {
			var id, login, name, role, dept, pos, job string
			var enabled bool
			var groupsRaw, membersRaw []byte
			if e = rows.Scan(&id, &login, &name, &role, &enabled, &dept, &pos, &job, &groupsRaw, &membersRaw); e != nil {
				return nil, e
			}
			var groups, members any
			json.Unmarshal(groupsRaw, &groups)
			json.Unmarshal(membersRaw, &members)
			users = append(users, map[string]any{"id": id, "username": login, "name": name, "role": role, "enabled": enabled, "department": dept, "position": pos, "job_role": job, "groups": groups, "manual_groups": members})
		}
		if rows.Err() != nil {
			return nil, rows.Err()
		}
		rows.Close()
		dirRows, e := s.DB.QueryContext(ctx, `SELECT kind,key,label FROM skillhub_directory ORDER BY kind,label`)
		if e != nil {
			return nil, e
		}
		defer dirRows.Close()
		directory := []any{}
		for dirRows.Next() {
			var kind, key, label string
			if e = dirRows.Scan(&kind, &key, &label); e != nil {
				return nil, e
			}
			directory = append(directory, map[string]any{"kind": kind, "key": key, "label": label})
		}
		if dirRows.Err() != nil {
			return nil, dirRows.Err()
		}
		return jsonReply(map[string]any{"users": users, "directory": directory})
	}
	if action == "group_list" {
		rows, e := s.DB.QueryContext(ctx, `SELECT g.key,g.label,g.enabled,g.department,g.position,g.job_role,(SELECT count(*) FROM skillhub_users u WHERE `+groupMatch+`) FROM skillhub_permission_groups g ORDER BY g.label`)
		if e != nil {
			return nil, e
		}
		groups := []PermissionGroup{}
		for rows.Next() {
			var g PermissionGroup
			if e = rows.Scan(&g.Key, &g.Label, &g.Enabled, &g.Department, &g.Position, &g.JobRole, &g.MemberCount); e != nil {
				rows.Close()
				return nil, e
			}
			g.Permissions = []GroupPermission{}
			groups = append(groups, g)
		}
		e = rows.Err()
		rows.Close()
		if e != nil {
			return nil, e
		}
		for i := range groups {
			permRows, e := s.DB.QueryContext(ctx, `SELECT module_key,jsonb_agg(action ORDER BY action) FROM skillhub_group_permissions WHERE group_key=$1 GROUP BY module_key ORDER BY module_key`, groups[i].Key)
			if e != nil {
				return nil, e
			}
			for permRows.Next() {
				var p GroupPermission
				var raw []byte
				if e = permRows.Scan(&p.Module, &raw); e != nil {
					permRows.Close()
					return nil, e
				}
				json.Unmarshal(raw, &p.Actions)
				groups[i].Permissions = append(groups[i].Permissions, p)
			}
			e = permRows.Err()
			permRows.Close()
			if e != nil {
				return nil, e
			}
		}
		return jsonReply(map[string]any{"groups": groups})
	}
	raw, e := json.Marshal(payload)
	if e != nil {
		return nil, invalid("Invalid payload")
	}
	tx, e := s.DB.BeginTxx(ctx, nil)
	if e != nil {
		return nil, e
	}
	defer tx.Rollback()
	resource := ""
	switch action {
	case "directory_save":
		var p struct {
			Kind  string `json:"kind"`
			Key   string `json:"key"`
			Label string `json:"label"`
		}
		if json.Unmarshal(raw, &p) != nil || !regexp.MustCompile(`^[a-z][a-z0-9_]{1,47}$`).MatchString(p.Key) || len(strings.TrimSpace(p.Label)) < 2 || len(p.Label) > 120 || (p.Kind != "department" && p.Kind != "position" && p.Kind != "job_role") {
			return nil, invalid("Danh mục không hợp lệ")
		}
		_, e = tx.ExecContext(ctx, `INSERT INTO skillhub_directory(kind,key,label) VALUES($1,$2,$3) ON CONFLICT(kind,key) DO UPDATE SET label=excluded.label`, p.Kind, p.Key, strings.TrimSpace(p.Label))
		resource = p.Kind + ":" + p.Key
	case "user_create":
		var p struct {
			Username string `json:"username"`
			Name     string `json:"name"`
			Password string `json:"password"`
		}
		if json.Unmarshal(raw, &p) != nil {
			return nil, invalid("Invalid user")
		}
		p.Username = strings.ToLower(strings.TrimSpace(p.Username))
		if !regexp.MustCompile(`^[a-z0-9][a-z0-9._@+-]{2,63}$`).MatchString(p.Username) || len(strings.TrimSpace(p.Name)) < 2 || len(p.Name) > 120 || len(p.Password) < 12 || len(p.Password) > 72 {
			return nil, invalid("Tài khoản 3–64 ký tự, họ tên 2–120 ký tự, mật khẩu 12–72 byte")
		}
		hash, err := bcrypt.GenerateFromPassword([]byte(p.Password), 12)
		if err != nil {
			return nil, err
		}
		resource = uuid.NewString()
		_, e = tx.ExecContext(ctx, `INSERT INTO skillhub_users(id,email,username,name,password_hash) VALUES($1,$2,$2,$3,$4)`, resource, p.Username, strings.TrimSpace(p.Name), string(hash))
	case "user_update":
		var p struct {
			IDs        []string `json:"ids"`
			Name       *string  `json:"name"`
			Department *string  `json:"department"`
			Position   *string  `json:"position"`
			JobRole    *string  `json:"job_role"`
			Enabled    *bool    `json:"enabled"`
		}
		if json.Unmarshal(raw, &p) != nil || len(p.IDs) < 1 || len(p.IDs) > 200 {
			return nil, invalid("Chọn 1–200 tài khoản")
		}
		seen := map[string]bool{}
		for _, id := range p.IDs {
			if _, err := uuid.Parse(id); err != nil || seen[id] {
				return nil, invalid("Tài khoản không hợp lệ hoặc trùng lặp")
			}
			seen[id] = true
		}
		if p.Name != nil && (len(p.IDs) != 1 || len(strings.TrimSpace(*p.Name)) < 2 || len(*p.Name) > 120) {
			return nil, invalid("Họ tên không hợp lệ")
		}
		for kind, value := range map[string]*string{"department": p.Department, "position": p.Position, "job_role": p.JobRole} {
			if value != nil && *value != "" {
				var exists bool
				if err := tx.GetContext(ctx, &exists, `SELECT EXISTS(SELECT 1 FROM skillhub_directory WHERE kind=$1 AND key=$2)`, kind, *value); err != nil {
					return nil, err
				}
				if !exists {
					return nil, invalid("Giá trị danh mục không hợp lệ")
				}
			}
		}
		if p.Enabled != nil && !*p.Enabled {
			var protected int
			if err := tx.GetContext(ctx, &protected, `SELECT count(*) FROM skillhub_users WHERE id=ANY($1) AND (role='admin' OR id=$2)`, pq.Array(p.IDs), u.ID); err != nil {
				return nil, err
			}
			if protected > 0 {
				return nil, status.Error(codes.FailedPrecondition, "Không thể khóa chính mình hoặc quản trị viên tại đây")
			}
		}
		result, err := tx.ExecContext(ctx, `UPDATE skillhub_users SET name=COALESCE($2,name),department=COALESCE($3,department),position=COALESCE($4,position),job_role=COALESCE($5,job_role),enabled=COALESCE($6,enabled) WHERE id=ANY($1)`, pq.Array(p.IDs), p.Name, p.Department, p.Position, p.JobRole, p.Enabled)
		if err != nil {
			return nil, err
		}
		n, _ := result.RowsAffected()
		if n != int64(len(p.IDs)) {
			return nil, invalid("Một số tài khoản không tồn tại")
		}
		if p.Enabled != nil && !*p.Enabled {
			if _, e = tx.ExecContext(ctx, `UPDATE skillhub_sessions SET revoked=true WHERE user_id=ANY($1)`, pq.Array(p.IDs)); e != nil {
				return nil, e
			}
		}
		resource = strings.Join(p.IDs, ",")
	case "group_save":
		var p PermissionGroup
		if json.Unmarshal(raw, &p) != nil || !regexp.MustCompile(`^[a-z][a-z0-9_]{1,47}$`).MatchString(p.Key) || len(strings.TrimSpace(p.Label)) < 2 || len(p.Label) > 120 || len(p.Permissions) > 100 {
			return nil, invalid("Mã/tên nhóm hoặc số quyền không hợp lệ")
		}
		if e = validateDirectory(ctx, tx, p.Department, p.Position, p.JobRole); e != nil {
			return nil, e
		}
		seen := map[string]bool{}
		for _, perm := range p.Permissions {
			if seen[perm.Module] {
				return nil, invalid("Module bị trùng trong nhóm")
			}
			seen[perm.Module] = true
			var actsRaw []byte
			if e = tx.QueryRowContext(ctx, `SELECT actions FROM skillhub_modules WHERE key=$1 AND enabled FOR UPDATE`, perm.Module).Scan(&actsRaw); e != nil {
				return nil, invalid("Module không hợp lệ")
			}
			var acts []string
			json.Unmarshal(actsRaw, &acts)
			allowed := map[string]bool{}
			for _, a := range acts {
				allowed[a] = true
			}
			used := map[string]bool{}
			for _, a := range perm.Actions {
				if !allowed[a] || used[a] {
					return nil, invalid("Quyền không thuộc module hoặc bị trùng")
				}
				used[a] = true
			}
		}
		_, e = tx.ExecContext(ctx, `INSERT INTO skillhub_permission_groups(key,label,enabled,department,position,job_role) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(key) DO UPDATE SET label=excluded.label,enabled=excluded.enabled,department=excluded.department,position=excluded.position,job_role=excluded.job_role`, p.Key, strings.TrimSpace(p.Label), p.Enabled, p.Department, p.Position, p.JobRole)
		if e != nil {
			return nil, e
		}
		if _, e = tx.ExecContext(ctx, `DELETE FROM skillhub_group_permissions WHERE group_key=$1`, p.Key); e != nil {
			return nil, e
		}
		for _, perm := range p.Permissions {
			for _, a := range perm.Actions {
				if _, e = tx.ExecContext(ctx, `INSERT INTO skillhub_group_permissions(group_key,module_key,action) VALUES($1,$2,$3)`, p.Key, perm.Module, a); e != nil {
					return nil, e
				}
			}
		}
		resource = p.Key
	case "group_delete":
		var p struct {
			Key string `json:"key"`
		}
		if json.Unmarshal(raw, &p) != nil {
			return nil, invalid("Invalid group")
		}
		result, err := tx.ExecContext(ctx, `DELETE FROM skillhub_permission_groups WHERE key=$1`, p.Key)
		if err != nil {
			return nil, err
		}
		n, _ := result.RowsAffected()
		if n != 1 {
			return nil, status.Error(codes.NotFound, "Nhóm không tồn tại")
		}
		resource = p.Key
	case "group_members":
		var p struct {
			Key    string   `json:"key"`
			Keys   []string `json:"keys"`
			IDs    []string `json:"ids"`
			Remove bool     `json:"remove"`
		}
		if json.Unmarshal(raw, &p) != nil || len(p.IDs) < 1 || len(p.IDs) > 200 {
			return nil, invalid("Chọn 1–200 tài khoản")
		}
		if len(p.Keys) == 0 && p.Key != "" {
			p.Keys = []string{p.Key}
		}
		if len(p.Keys) < 1 || len(p.Keys) > 50 {
			return nil, invalid("Chọn 1–50 nhóm quyền")
		}
		var exists bool
		seenGroups := map[string]bool{}
		for _, key := range p.Keys {
			if seenGroups[key] {
				return nil, invalid("Nhóm quyền bị trùng")
			}
			seenGroups[key] = true
			if e = tx.GetContext(ctx, &exists, `SELECT EXISTS(SELECT 1 FROM skillhub_permission_groups WHERE key=$1)`, key); e != nil || !exists {
				return nil, invalid("Nhóm không tồn tại")
			}
		}
		seen := map[string]bool{}
		for _, id := range p.IDs {
			if _, err := uuid.Parse(id); err != nil || seen[id] {
				return nil, invalid("Tài khoản không hợp lệ hoặc trùng")
			}
			seen[id] = true
			if e = tx.GetContext(ctx, &exists, `SELECT EXISTS(SELECT 1 FROM skillhub_users WHERE id=$1)`, id); e != nil || !exists {
				return nil, invalid("Tài khoản không tồn tại")
			}
			for _, key := range p.Keys {
				if p.Remove {
					_, e = tx.ExecContext(ctx, `DELETE FROM skillhub_group_members WHERE group_key=$1 AND user_id=$2`, key, id)
				} else {
					_, e = tx.ExecContext(ctx, `INSERT INTO skillhub_group_members(group_key,user_id) VALUES($1,$2) ON CONFLICT DO NOTHING`, key, id)
				}
				if e != nil {
					return nil, e
				}
			}
		}
		resource = strings.Join(p.Keys, ",") + ":" + strings.Join(p.IDs, ",")
	}
	if e != nil {
		return nil, status.Error(codes.AlreadyExists, "Dữ liệu đã tồn tại hoặc không hợp lệ")
	}
	if _, e = tx.ExecContext(ctx, `INSERT INTO skillhub_security_audit(actor_id,operation,resource) VALUES($1,$2,$3)`, u.ID, action, resource); e != nil {
		return nil, e
	}
	if e = tx.Commit(); e != nil {
		return nil, e
	}
	return structpb.NewStruct(map[string]any{"ok": true})
}
