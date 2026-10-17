package skillauth

import (
	"context"
	"encoding/json"
	"github.com/google/uuid"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/structpb"
	"math"
	"strings"
	"time"
)

const LevelSchema = `CREATE TABLE IF NOT EXISTS skillhub_level_policies(id uuid PRIMARY KEY,version bigserial UNIQUE NOT NULL,rules jsonb NOT NULL,created_by uuid REFERENCES skillhub_users(id),created_at timestamptz NOT NULL DEFAULT now());
INSERT INTO skillhub_modules(key,label,actions,system) VALUES('exam_levels','Cấp thi & Quy tắc lên cấp','["view","update"]',true) ON CONFLICT DO NOTHING;`

type LevelRule struct {
	Code          string  `json:"code"`
	Label         string  `json:"label"`
	PassPercent   float64 `json:"pass_percent"`
	MaxAttempts   int     `json:"max_attempts"`
	CooldownHours int     `json:"cooldown_hours"`
}
type LevelPolicy struct {
	LowerFailure string      `json:"lower_failure"`
	Levels       []LevelRule `json:"levels"`
}
type LevelScenarioAttempt struct {
	Level          string  `json:"level"`
	Score          float64 `json:"score"`
	MaxScore       float64 `json:"max_score"`
	CriticalFailed int     `json:"critical_failed"`
	At             string  `json:"at"`
}
type LevelOutcome struct {
	Level         string  `json:"level"`
	Percent       float64 `json:"percent"`
	Eligible      bool    `json:"eligible"`
	Passed        bool    `json:"passed"`
	Reason        string  `json:"reason"`
	HighestEarned string  `json:"highest_earned"`
	CurrentLevel  string  `json:"current_level"`
	Suspended     bool    `json:"suspended"`
}

func DefaultLevelPolicy() LevelPolicy {
	return LevelPolicy{LowerFailure: "preserve", Levels: []LevelRule{{"L0", "Nền tảng", 75, 0, 0}, {"L1", "Thực hành", 75, 0, 0}, {"L2", "Nâng cao", 75, 0, 0}, {"L3", "Chuyên gia", 75, 0, 0}}}
}
func validateLevelPolicy(p LevelPolicy) error {
	if p.LowerFailure != "preserve" && p.LowerFailure != "suspend" && p.LowerFailure != "recalculate" {
		return invalid("Chính sách thi lại không hợp lệ")
	}
	if len(p.Levels) != 4 {
		return invalid("Cần cấu hình đủ L0, L1, L2, L3")
	}
	for i, l := range p.Levels {
		if l.Code != []string{"L0", "L1", "L2", "L3"}[i] || len(strings.TrimSpace(l.Label)) < 2 || len(l.Label) > 120 || math.IsNaN(l.PassPercent) || math.IsInf(l.PassPercent, 0) || l.PassPercent < 0 || l.PassPercent > 100 || l.MaxAttempts < 0 || l.MaxAttempts > 100 || l.CooldownHours < 0 || l.CooldownHours > 8760 {
			return invalid("Tên cấp, ngưỡng điểm, số lượt hoặc thời gian chờ không hợp lệ")
		}
	}
	return nil
}

// Pure preview evaluator. It never awards real qualifications or stores client-supplied scores.
func EvaluateLevelScenario(p LevelPolicy, attempts []LevelScenarioAttempt) ([]LevelOutcome, error) {
	if e := validateLevelPolicy(p); e != nil {
		return nil, e
	}
	if len(attempts) > 100 {
		return nil, invalid("Tối đa 100 lượt mô phỏng")
	}
	credited := make([]bool, 4)
	everPassed := make([]bool, 4)
	hold := make([]bool, 4)
	counts := make([]int, 4)
	last := make([]time.Time, 4)
	highest := -1
	out := []LevelOutcome{}
	previous := time.Time{}
	for _, a := range attempts {
		idx := -1
		for i, l := range p.Levels {
			if l.Code == a.Level {
				idx = i
			}
		}
		if idx < 0 || math.IsNaN(a.Score) || math.IsInf(a.Score, 0) || math.IsNaN(a.MaxScore) || math.IsInf(a.MaxScore, 0) || a.MaxScore <= 0 || a.Score < 0 || a.Score > a.MaxScore || a.CriticalFailed < 0 {
			return nil, invalid("Điểm/lượt mô phỏng không hợp lệ")
		}
		at, e := time.Parse(time.RFC3339, a.At)
		if e != nil || (!previous.IsZero() && at.Before(previous)) {
			return nil, invalid("Thời gian lượt thi phải hợp lệ và theo thứ tự tăng dần")
		}
		previous = at
		rule := p.Levels[idx]
		r := LevelOutcome{Level: a.Level, Percent: a.Score / a.MaxScore * 100, Eligible: true}
		if idx > 0 {
			for j := 0; j < idx; j++ {
				if !credited[j] || hold[j] {
					r.Eligible = false
					r.Reason = "Chưa đạt hoặc cần xác nhận lại cấp tiên quyết"
					break
				}
			}
		}
		if r.Eligible && rule.MaxAttempts > 0 && counts[idx] >= rule.MaxAttempts {
			r.Eligible = false
			r.Reason = "Đã hết số lượt thi trong kịch bản"
		}
		if r.Eligible && !last[idx].IsZero() && at.Before(last[idx].Add(time.Duration(rule.CooldownHours)*time.Hour)) {
			r.Eligible = false
			r.Reason = "Chưa đủ thời gian chờ thi lại"
		}
		if r.Eligible {
			counts[idx]++
			last[idx] = at
			r.Passed = r.Percent >= rule.PassPercent && a.CriticalFailed == 0
			if r.Passed {
				credited[idx] = true
				everPassed[idx] = true
				hold[idx] = false
				if idx > highest {
					highest = idx
				}
				r.Reason = "Đạt điểm và điều kiện cấp"
			} else {
				r.Reason = "Chưa đạt ngưỡng điểm"
				if a.CriticalFailed > 0 {
					r.Reason = "Không đạt câu điểm liệt"
				}
				switch p.LowerFailure {
				case "recalculate":
					for j := idx; j < 4; j++ {
						credited[j] = false
						hold[j] = false
					}
				case "suspend":
					if everPassed[idx] {
						hold[idx] = true
					}
				}
			}
		}
		current := -1
		suspended := false
		for j := 0; j < 4; j++ {
			if !credited[j] || hold[j] {
				break
			}
			current = j
		}
		for j := 0; j <= highest; j++ {
			if hold[j] {
				suspended = true
			}
		}
		if highest >= 0 {
			r.HighestEarned = p.Levels[highest].Code
		}
		if current >= 0 {
			r.CurrentLevel = p.Levels[current].Code
		}
		r.Suspended = suspended
		out = append(out, r)
	}
	return out, nil
}
func (s *Server) levelAction(ctx context.Context, u account, action string, payload any) (*structpb.Struct, error) {
	required := "exam_levels:view"
	if action == "level_save" {
		required = "exam_levels:update"
	}
	if !s.allowed(ctx, u, required) {
		return nil, status.Error(codes.PermissionDenied, "Bạn không có quyền "+required)
	}
	switch action {
	case "level_config":
		var raw []byte
		var version int
		var at time.Time
		e := s.DB.QueryRowContext(ctx, `SELECT rules,version,created_at FROM skillhub_level_policies ORDER BY version DESC LIMIT 1`).Scan(&raw, &version, &at)
		if e != nil {
			return nil, e
		}
		var p LevelPolicy
		if e = json.Unmarshal(raw, &p); e != nil {
			return nil, e
		}
		return jsonReply(map[string]any{"policy": p, "version": version, "updated_at": at.Format(time.RFC3339)})
	case "level_save":
		var p struct {
			Policy          LevelPolicy `json:"policy"`
			ExpectedVersion int         `json:"expected_version"`
		}
		raw, e := json.Marshal(payload)
		if e != nil || json.Unmarshal(raw, &p) != nil {
			return nil, invalid("Invalid policy")
		}
		if e = validateLevelPolicy(p.Policy); e != nil {
			return nil, e
		}
		tx, e := s.DB.BeginTxx(ctx, nil)
		if e != nil {
			return nil, e
		}
		defer tx.Rollback()
		if _, e = tx.ExecContext(ctx, `SELECT pg_advisory_xact_lock(57139014)`); e != nil {
			return nil, e
		}
		var version int
		if e = tx.GetContext(ctx, &version, `SELECT COALESCE(max(version),0) FROM skillhub_level_policies`); e != nil {
			return nil, e
		}
		if version != p.ExpectedVersion {
			return nil, status.Error(codes.FailedPrecondition, "Cấu hình đã thay đổi. Tải lại trước khi lưu.")
		}
		rules, _ := json.Marshal(p.Policy)
		if e = tx.QueryRowContext(ctx, `INSERT INTO skillhub_level_policies(id,rules,created_by) VALUES($1,$2,$3) RETURNING version`, uuid.NewString(), string(rules), u.ID).Scan(&version); e != nil {
			return nil, e
		}
		if _, e = tx.ExecContext(ctx, `INSERT INTO skillhub_security_audit(actor_id,operation,resource) VALUES($1,'level_save',$2)`, u.ID, "level-policy:"+strings.Join([]string{p.Policy.LowerFailure}, "")); e != nil {
			return nil, e
		}
		if e = tx.Commit(); e != nil {
			return nil, e
		}
		return structpb.NewStruct(map[string]any{"ok": true, "version": version})
	case "level_simulate":
		var p struct {
			Policy   LevelPolicy            `json:"policy"`
			Attempts []LevelScenarioAttempt `json:"attempts"`
		}
		raw, e := json.Marshal(payload)
		if e != nil || json.Unmarshal(raw, &p) != nil {
			return nil, invalid("Invalid scenario")
		}
		result, e := EvaluateLevelScenario(p.Policy, p.Attempts)
		if e != nil {
			return nil, e
		}
		return jsonReply(map[string]any{"outcomes": result, "simulation_only": true})
	}
	return nil, invalid("Unknown level action")
}
func (s *Server) InitLevelPolicy(ctx context.Context) error {
	raw, _ := json.Marshal(DefaultLevelPolicy())
	_, e := s.DB.ExecContext(ctx, `INSERT INTO skillhub_level_policies(id,rules) SELECT $1,$2 WHERE NOT EXISTS(SELECT 1 FROM skillhub_level_policies)`, uuid.NewString(), string(raw))
	return e
}
