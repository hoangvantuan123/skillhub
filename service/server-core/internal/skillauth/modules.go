package skillauth

import (
	"context"
	"encoding/json"
	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/structpb"
	"regexp"
	"strings"
)

const ModuleSchema = `CREATE TABLE IF NOT EXISTS skillhub_modules(key text PRIMARY KEY,label text NOT NULL,actions jsonb NOT NULL,enabled boolean NOT NULL DEFAULT true,system boolean NOT NULL DEFAULT false);
CREATE TABLE IF NOT EXISTS skillhub_grants(user_id uuid NOT NULL REFERENCES skillhub_users(id),module_key text NOT NULL REFERENCES skillhub_modules(key) ON DELETE CASCADE,action text NOT NULL,PRIMARY KEY(user_id,module_key,action));
CREATE TABLE IF NOT EXISTS skillhub_security_audit(id bigserial PRIMARY KEY,actor_id uuid NOT NULL REFERENCES skillhub_users(id),operation text NOT NULL,resource text NOT NULL,created_at timestamptz NOT NULL DEFAULT now());
INSERT INTO skillhub_modules(key,label,actions,system) VALUES ('modules','Module hệ thống','["view","create","update","delete","import","export"]',true),('permissions','Phân quyền','["view","update"]',true),('learning','Khóa học','["view","create","update","delete","import","export","publish"]',true),('questions','Ngân hàng câu hỏi','["view","create","update","delete","import","export","approve"]',true) ON CONFLICT DO NOTHING;
INSERT INTO skillhub_modules(key,label,actions,system) VALUES ('exams','Kỳ thi của tôi','["view"]',true),('attempts','Làm bài thi','["view","take"]',true),('practice','Luyện tập','["view","run"]',true),('knowledge','Kho kiến thức','["view"]',true),('assessments','Quản lý bộ đề','["view","create","update","publish"]',true),('blueprints','Cấu hình bộ đề','["view","update"]',true),('exam_management','Tổ chức ca thi','["view","create","update"]',true),('grading','Chấm bài thi','["view","update"]',true),('training_groups','Lớp và nhóm','["view","create","update"]',true),('reports','Báo cáo đào tạo','["view","export"]',true),('catalog','Danh mục hệ thống','["view","create","update"]',true) ON CONFLICT DO NOTHING;`

type Module struct {
	Key             string   `json:"key"`
	Label           string   `json:"label"`
	Actions         []string `json:"actions"`
	Enabled         bool     `json:"enabled"`
	System          bool     `json:"system"`
	RequiredActions []string `json:"required_actions,omitempty"`
}

// Core capabilities are required by existing routes and cannot be removed through the editor.
var systemActions = map[string][]string{
	"catalog":         {"view", "create", "update"},
	"reports":         {"view", "export"},
	"training_groups": {"view", "create", "update"},
	"grading":         {"view", "update"},
	"exam_management": {"view", "create", "update"},
	"blueprints":      {"view", "update"},
	"assessments":     {"view", "create", "update", "publish"},
	"knowledge":       {"view"},
	"practice":        {"view", "run"},
	"attempts":        {"view", "take"},
	"exams":           {"view"},
	"modules":         {"view", "create", "update", "delete", "import", "export"},
	"permissions":     {"view", "update"},
	"learning":        {"view", "create", "update", "delete", "import", "export", "publish"},
	"exam_levels":     {"view", "update"},
	"users":           {"view", "create", "update"},
	"questions":       {"view", "create", "update", "delete", "import", "export", "approve"},
}

func validateSystemUpdate(m Module) error {
	if !m.Enabled {
		return status.Error(codes.FailedPrecondition, "Không thể tắt module hệ thống")
	}
	for _, required := range systemActions[m.Key] {
		found := false
		for _, action := range m.Actions {
			if action == required {
				found = true
				break
			}
		}
		if !found {
			return status.Error(codes.FailedPrecondition, "Không thể bỏ quyền cốt lõi: "+required)
		}
	}
	return nil
}

func loadModules(ctx context.Context, db *sqlx.DB) ([]Module, error) {
	rows, e := db.QueryContext(ctx, `SELECT key,label,actions,enabled,system FROM skillhub_modules ORDER BY key`)
	if e != nil {
		return nil, e
	}
	defer rows.Close()
	list := []Module{}
	for rows.Next() {
		var m Module
		var raw []byte
		if e = rows.Scan(&m.Key, &m.Label, &raw, &m.Enabled, &m.System); e != nil {
			return nil, e
		}
		if e = json.Unmarshal(raw, &m.Actions); e != nil {
			return nil, e
		}
		if m.System {
			m.RequiredActions = systemActions[m.Key]
		}
		list = append(list, m)
	}
	return list, rows.Err()
}
func validateModule(m Module) error {
	if !regexp.MustCompile(`^[a-z][a-z0-9_]{1,47}$`).MatchString(m.Key) || len(strings.TrimSpace(m.Label)) < 2 || len(m.Label) > 120 || len(m.Actions) == 0 || len(m.Actions) > 24 {
		return status.Error(codes.InvalidArgument, "Mã module 2–48 ký tự chữ thường/số/_, tên 2–120 ký tự và 1–24 quyền")
	}
	seen := map[string]bool{}
	for _, a := range m.Actions {
		if !regexp.MustCompile(`^[a-z][a-z0-9_]{1,31}$`).MatchString(a) || seen[a] {
			return status.Error(codes.InvalidArgument, "Quyền không hợp lệ hoặc trùng lặp")
		}
		seen[a] = true
	}
	if !seen["view"] {
		return status.Error(codes.InvalidArgument, "Module phải có quyền view")
	}
	return nil
}
func (s *Server) permissions(ctx context.Context, u account) ([]any, error) {
	out := []any{"learner:read", "learning:view", "exams:view", "attempts:view", "attempts:take", "practice:view", "practice:run", "knowledge:view"}
	if u.Role == "admin" {
		modules, e := loadModules(ctx, s.DB)
		if e != nil {
			return nil, e
		}
		for _, m := range modules {
			if m.Enabled {
				for _, a := range m.Actions {
					out = append(out, m.Key+":"+a)
				}
			}
		}
		return out, nil
	}
	rows, e := s.DB.QueryContext(ctx, `SELECT DISTINCT effective.permission FROM (SELECT g.module_key||':'||g.action AS permission FROM skillhub_grants g JOIN skillhub_modules m ON m.key=g.module_key WHERE g.user_id=$1 AND m.enabled AND m.actions ? g.action UNION SELECT gp.module_key||':'||gp.action FROM skillhub_users u JOIN skillhub_permission_groups g ON g.enabled JOIN skillhub_group_permissions gp ON gp.group_key=g.key JOIN skillhub_modules m ON m.key=gp.module_key AND m.enabled AND m.actions ? gp.action WHERE u.id=$1 AND `+groupMatch+`) effective ORDER BY 1`, u.ID)
	if e != nil {
		return nil, e
	}
	defer rows.Close()
	for rows.Next() {
		var p string
		if e = rows.Scan(&p); e != nil {
			return nil, e
		}
		out = append(out, p)
	}
	return out, rows.Err()
}
func (s *Server) allowed(ctx context.Context, u account, permission string) bool {
	ps, e := s.permissions(ctx, u)
	if e != nil {
		return false
	}
	for _, p := range ps {
		if p == permission {
			return true
		}
	}
	return false
}
func jsonReply(v any) (*structpb.Struct, error) {
	b, e := json.Marshal(v)
	if e != nil {
		return nil, e
	}
	m := map[string]any{}
	if e = json.Unmarshal(b, &m); e != nil {
		return nil, e
	}
	return structpb.NewStruct(m)
}
func (s *Server) moduleAction(ctx context.Context, u account, action string, payload any) (*structpb.Struct, error) {
	required := map[string]string{"modules": "modules:view", "module_export": "modules:export", "module_create": "modules:create", "module_update": "modules:update", "module_delete": "modules:delete", "module_import": "modules:import", "grants": "permissions:view", "grant_save": "permissions:update"}
	permission, ok := required[action]
	if !ok {
		return s.peopleAction(ctx, u, action, payload)
	}
	if !s.allowed(ctx, u, permission) {
		return nil, status.Error(codes.PermissionDenied, "Bạn không có quyền "+permission)
	}
	if action == "modules" || action == "module_export" {
		ms, e := loadModules(ctx, s.DB)
		if e != nil {
			return nil, e
		}
		nodes, err := loadPermissionHierarchy(ctx, s.DB)
		if err != nil {
			return nil, err
		}
		return jsonReply(map[string]any{"modules": ms, "hierarchy": nodes})
	}
	if action == "grants" {
		rows, e := s.DB.QueryContext(ctx, `SELECT u.id,u.username,u.name,u.role,COALESCE(jsonb_agg(jsonb_build_object('module',g.module_key,'action',g.action)) FILTER(WHERE g.action IS NOT NULL),'[]'::jsonb) FROM skillhub_users u LEFT JOIN skillhub_grants g ON g.user_id=u.id GROUP BY u.id ORDER BY u.username`)
		if e != nil {
			return nil, e
		}
		defer rows.Close()
		users := []any{}
		for rows.Next() {
			var id, login, name, role string
			var raw []byte
			if e = rows.Scan(&id, &login, &name, &role, &raw); e != nil {
				return nil, e
			}
			var grants any
			if e = json.Unmarshal(raw, &grants); e != nil {
				return nil, e
			}
			users = append(users, map[string]any{"id": id, "username": login, "name": name, "role": role, "grants": grants})
		}
		if rows.Err() != nil {
			return nil, rows.Err()
		}
		return jsonReply(map[string]any{"users": users})
	}
	raw, e := json.Marshal(payload)
	if e != nil {
		return nil, status.Error(codes.InvalidArgument, "Invalid payload")
	}
	tx, e := s.DB.BeginTxx(ctx, nil)
	if e != nil {
		return nil, e
	}
	defer tx.Rollback()
	resource := ""
	if action == "grant_save" {
		var p struct {
			UserID  string   `json:"user_id"`
			Module  string   `json:"module"`
			Actions []string `json:"actions"`
		}
		if json.Unmarshal(raw, &p) != nil {
			return nil, status.Error(codes.InvalidArgument, "Invalid grant")
		}
		if _, e = uuid.Parse(p.UserID); e != nil {
			return nil, status.Error(codes.InvalidArgument, "Invalid user")
		}
		var exists bool
		if e = tx.GetContext(ctx, &exists, `SELECT EXISTS(SELECT 1 FROM skillhub_users WHERE id=$1 AND role<>'admin')`, p.UserID); e != nil || !exists {
			return nil, status.Error(codes.InvalidArgument, "Chọn tài khoản không phải quản trị viên")
		}
		var actions []byte
		if e = tx.QueryRowContext(ctx, `SELECT actions FROM skillhub_modules WHERE key=$1 AND enabled FOR UPDATE`, p.Module).Scan(&actions); e != nil {
			return nil, status.Error(codes.InvalidArgument, "Module không tồn tại")
		}
		var valid []string
		json.Unmarshal(actions, &valid)
		seen := map[string]bool{}
		for _, a := range p.Actions {
			found := false
			for _, v := range valid {
				if a == v {
					found = true
				}
			}
			if !found || seen[a] {
				return nil, status.Error(codes.InvalidArgument, "Quyền không thuộc module hoặc trùng lặp")
			}
			seen[a] = true
		}
		if _, e = tx.ExecContext(ctx, `DELETE FROM skillhub_grants WHERE user_id=$1 AND module_key=$2`, p.UserID, p.Module); e != nil {
			return nil, e
		}
		for _, a := range p.Actions {
			if _, e = tx.ExecContext(ctx, `INSERT INTO skillhub_grants(user_id,module_key,action) VALUES($1,$2,$3)`, p.UserID, p.Module, a); e != nil {
				return nil, e
			}
		}
		resource = p.UserID + ":" + p.Module
	} else if action == "module_delete" {
		var p Module
		if json.Unmarshal(raw, &p) != nil {
			return nil, status.Error(codes.InvalidArgument, "Invalid module")
		}
		result, e := tx.ExecContext(ctx, `DELETE FROM skillhub_modules WHERE key=$1 AND NOT system`, p.Key)
		if e != nil {
			return nil, e
		}
		n, _ := result.RowsAffected()
		if n == 0 {
			return nil, status.Error(codes.FailedPrecondition, "Module hệ thống không được xóa hoặc module không tồn tại")
		}
		resource = p.Key
	} else {
		list := []Module{}
		if action == "module_import" {
			var p struct {
				Modules []Module `json:"modules"`
			}
			if json.Unmarshal(raw, &p) != nil || len(p.Modules) < 1 || len(p.Modules) > 50 {
				return nil, status.Error(codes.InvalidArgument, "Import cần 1–50 module")
			}
			list = p.Modules
		} else {
			var m Module
			if json.Unmarshal(raw, &m) != nil {
				return nil, status.Error(codes.InvalidArgument, "Invalid module")
			}
			list = append(list, m)
		}
		seen := map[string]bool{}
		for _, m := range list {
			if e = validateModule(m); e != nil {
				return nil, e
			}
			if seen[m.Key] {
				return nil, status.Error(codes.InvalidArgument, "Trùng mã module")
			}
			seen[m.Key] = true
			acts, _ := json.Marshal(m.Actions)
			if action == "module_update" {
				var system bool
				if e = tx.QueryRowContext(ctx, `SELECT system FROM skillhub_modules WHERE key=$1 FOR UPDATE`, m.Key).Scan(&system); e != nil {
					return nil, status.Error(codes.NotFound, "Module không tồn tại")
				}
				if system {
					if e = validateSystemUpdate(m); e != nil {
						return nil, e
					}
				}
				_, e = tx.ExecContext(ctx, `UPDATE skillhub_modules SET label=$2,actions=$3,enabled=$4 WHERE key=$1`, m.Key, strings.TrimSpace(m.Label), string(acts), m.Enabled)
				if e == nil {
					_, e = tx.ExecContext(ctx, `DELETE FROM skillhub_grants WHERE module_key=$1 AND NOT ($2::jsonb ? action)`, m.Key, string(acts))
				}
				if e == nil {
					_, e = tx.ExecContext(ctx, `DELETE FROM skillhub_group_permissions WHERE module_key=$1 AND NOT ($2::jsonb ? action)`, m.Key, string(acts))
				}
			} else {
				_, e = tx.ExecContext(ctx, `INSERT INTO skillhub_modules(key,label,actions,enabled) VALUES($1,$2,$3,$4)`, m.Key, strings.TrimSpace(m.Label), string(acts), m.Enabled)
			}
			if e != nil {
				return nil, status.Error(codes.AlreadyExists, "Mã module đã tồn tại hoặc dữ liệu không hợp lệ")
			}
			resource += m.Key + ","
		}
	}
	if _, e = tx.ExecContext(ctx, `INSERT INTO skillhub_security_audit(actor_id,operation,resource) VALUES($1,$2,$3)`, u.ID, action, resource); e != nil {
		return nil, e
	}
	if e = tx.Commit(); e != nil {
		return nil, e
	}
	return structpb.NewStruct(map[string]any{"ok": true})
}
