package skillauth

import (
	"context"
	"encoding/json"
)

type groupTemplate struct {
	Key, Label  string
	Permissions []GroupPermission
}

var defaultPermissionGroups = []groupTemplate{
	{"learner_basic", "Người học — Học & Thi", []GroupPermission{{"learning", []string{"view"}}, {"exams", []string{"view"}}, {"attempts", []string{"view", "take"}}, {"practice", []string{"view", "run"}}, {"knowledge", []string{"view"}}}},
	{"question_author", "Biên soạn câu hỏi & Bộ đề", []GroupPermission{{"questions", []string{"view", "create", "update", "import"}}, {"assessments", []string{"view", "create", "update"}}}},
	{"exam_operator", "Tổ chức kỳ thi", []GroupPermission{{"exam_management", []string{"view", "create", "update"}}, {"training_groups", []string{"view", "create", "update"}}, {"blueprints", []string{"view", "update"}}, {"reports", []string{"view"}}}},
	{"exam_grader", "Chấm bài thi", []GroupPermission{{"grading", []string{"view", "update"}}, {"reports", []string{"view"}}}},
	{"training_reader", "Theo dõi đào tạo", []GroupPermission{{"reports", []string{"view", "export"}}, {"exam_management", []string{"view"}}, {"assessments", []string{"view"}}}},
}

// Seed only absent templates. Never overwrite edited groups or enroll users.
func (s *Server) InitPermissionGroups(ctx context.Context) error {
	tx, e := s.DB.BeginTxx(ctx, nil)
	if e != nil {
		return e
	}
	defer tx.Rollback()
	for _, template := range defaultPermissionGroups {
		result, e := tx.ExecContext(ctx, `INSERT INTO skillhub_permission_groups(key,label) VALUES($1,$2) ON CONFLICT DO NOTHING`, template.Key, template.Label)
		if e != nil {
			return e
		}
		n, e := result.RowsAffected()
		if e != nil {
			return e
		}
		if n == 0 {
			continue
		}
		for _, permission := range template.Permissions {
			actions, e := json.Marshal(permission.Actions)
			if e != nil {
				return e
			}
			if _, e = tx.ExecContext(ctx, `INSERT INTO skillhub_group_permissions(group_key,module_key,action) SELECT $1,m.key,a.value FROM skillhub_modules m CROSS JOIN jsonb_array_elements_text($3::jsonb) a WHERE m.key=$2 AND m.enabled AND m.actions ? a.value ON CONFLICT DO NOTHING`, template.Key, permission.Module, string(actions)); e != nil {
				return e
			}
		}
	}
	return tx.Commit()
}
