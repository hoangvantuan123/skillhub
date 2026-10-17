package skillauth

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"golang.org/x/crypto/bcrypt"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/structpb"
	"image"
	_ "image/jpeg"
	_ "image/png"
	"net/mail"
	"regexp"
	"strings"
	"time"
)

type personalProfile struct {
	Name      string `json:"name"`
	Email     string `json:"email"`
	BirthDate string `json:"birthDate"`
	Phone     string `json:"phone"`
	AvatarURL string `json:"avatarUrl"`
}

func validatePersonalProfile(p personalProfile) error {
	if len(strings.TrimSpace(p.Name)) < 2 || len(p.Name) > 120 {
		return invalid("Họ tên cần từ 2–120 ký tự")
	}
	if p.Email != "" {
		address, e := mail.ParseAddress(p.Email)
		if e != nil || address.Address != p.Email || len(p.Email) > 254 {
			return invalid("Email không hợp lệ")
		}
	}
	if p.BirthDate != "" {
		date, e := time.Parse("2006-01-02", p.BirthDate)
		if e != nil || date.After(time.Now().UTC()) || date.Year() < 1900 {
			return invalid("Ngày sinh không hợp lệ")
		}
	}
	if p.Phone != "" && !regexp.MustCompile(`^[+0-9() .-]{6,30}$`).MatchString(p.Phone) {
		return invalid("Số điện thoại không hợp lệ")
	}
	if p.AvatarURL != "" {
		if len(p.AvatarURL) > 45000 {
			return invalid("Ảnh đại diện quá lớn")
		}
		parts := strings.SplitN(p.AvatarURL, ",", 2)
		if len(parts) != 2 || (parts[0] != "data:image/jpeg;base64" && parts[0] != "data:image/png;base64") {
			return invalid("Ảnh đại diện phải là JPEG hoặc PNG")
		}
		data, e := base64.StdEncoding.DecodeString(parts[1])
		if e != nil {
			return invalid("Ảnh đại diện không hợp lệ")
		}
		config, format, e := image.DecodeConfig(bytes.NewReader(data))
		if e != nil || config.Width < 1 || config.Height < 1 || config.Width > 512 || config.Height > 512 || (format != "png" && format != "jpeg") {
			return invalid("Ảnh đại diện không hợp lệ")
		}
	}
	return nil
}
func (s *Server) personalAction(ctx context.Context, u account, sid, action string, payload any) (*structpb.Struct, error) {
	raw, e := json.Marshal(payload)
	if e != nil {
		return nil, invalid("Dữ liệu không hợp lệ")
	}
	if action == "profile_update" {
		var p personalProfile
		if json.Unmarshal(raw, &p) != nil {
			return nil, invalid("Thông tin hồ sơ không hợp lệ")
		}
		p.Name = strings.TrimSpace(p.Name)
		p.Email = strings.TrimSpace(p.Email)
		p.Phone = strings.TrimSpace(p.Phone)
		if e = validatePersonalProfile(p); e != nil {
			return nil, e
		}
		tx, e := s.DB.BeginTxx(ctx, nil)
		if e != nil {
			return nil, e
		}
		defer tx.Rollback()
		if _, e = tx.ExecContext(ctx, `UPDATE skillhub_users SET name=$2,contact_email=$3,birth_date=NULLIF($4,'')::date,phone=$5,avatar_url=$6 WHERE id=$1`, u.ID, p.Name, p.Email, p.BirthDate, p.Phone, p.AvatarURL); e != nil {
			return nil, e
		}
		if _, e = tx.ExecContext(ctx, `INSERT INTO skillhub_security_audit(actor_id,operation,resource) VALUES($1,'profile_update','self')`, u.ID); e != nil {
			return nil, e
		}
		if e = tx.Commit(); e != nil {
			return nil, e
		}
		return structpb.NewStruct(map[string]any{"ok": true})
	}
	var p struct {
		Current string `json:"current_password"`
		New     string `json:"new_password"`
	}
	if json.Unmarshal(raw, &p) != nil {
		return nil, invalid("Dữ liệu đổi mật khẩu không hợp lệ")
	}
	if e = validatePasswordChange(p.Current, p.New); e != nil {
		return nil, e
	}
	tx, e := s.DB.BeginTxx(ctx, nil)
	if e != nil {
		return nil, e
	}
	defer tx.Rollback()
	var hash string
	if e = tx.GetContext(ctx, &hash, `SELECT password_hash FROM skillhub_users WHERE id=$1 AND enabled FOR UPDATE`, u.ID); e != nil {
		return nil, denied()
	}
	var failed int
	if e = tx.GetContext(ctx, &failed, `SELECT count(*) FROM skillhub_security_audit WHERE actor_id=$1 AND operation='password_change_failed' AND created_at>now()-interval '15 minutes'`, u.ID); e != nil {
		return nil, e
	}
	if failed >= 5 {
		return nil, status.Error(codes.ResourceExhausted, "Đã nhập sai nhiều lần. Vui lòng thử lại sau 15 phút")
	}
	if bcrypt.CompareHashAndPassword([]byte(hash), []byte(p.Current)) != nil {
		if _, e = tx.ExecContext(ctx, `INSERT INTO skillhub_security_audit(actor_id,operation,resource) VALUES($1,'password_change_failed','self')`, u.ID); e != nil {
			return nil, e
		}
		if e = tx.Commit(); e != nil {
			return nil, e
		}
		return nil, invalid("Mật khẩu hiện tại chưa đúng")
	}
	next, e := bcrypt.GenerateFromPassword([]byte(p.New), 12)
	if e != nil {
		return nil, e
	}
	if _, e = tx.ExecContext(ctx, `UPDATE skillhub_users SET password_hash=$2 WHERE id=$1`, u.ID, string(next)); e != nil {
		return nil, e
	}
	if _, e = tx.ExecContext(ctx, `UPDATE skillhub_sessions SET revoked=true WHERE user_id=$1 AND id<>$2`, u.ID, sid); e != nil {
		return nil, e
	}
	if _, e = tx.ExecContext(ctx, `INSERT INTO skillhub_security_audit(actor_id,operation,resource) VALUES($1,'password_change','self')`, u.ID); e != nil {
		return nil, e
	}
	if e = tx.Commit(); e != nil {
		return nil, e
	}
	return structpb.NewStruct(map[string]any{"ok": true})
}

func validatePasswordChange(current, next string) error {
	if len(current) < 1 || len(current) > 72 || len(next) < 12 || len(next) > 72 || current == next {
		return invalid("Mật khẩu mới cần từ 12–72 byte và khác mật khẩu hiện tại")
	}
	return nil
}
