package skillauth

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"

	"errors"
	"regexp"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
	"github.com/lib/pq"
	"golang.org/x/crypto/bcrypt"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/structpb"
)

const Schema = `CREATE TABLE IF NOT EXISTS skillhub_users(id uuid PRIMARY KEY, email text UNIQUE NOT NULL, name text NOT NULL, password_hash text NOT NULL, role text NOT NULL DEFAULT 'learner', created_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE skillhub_users ADD COLUMN IF NOT EXISTS birth_date date;
ALTER TABLE skillhub_users ADD COLUMN IF NOT EXISTS phone text NOT NULL DEFAULT '';
ALTER TABLE skillhub_users ADD COLUMN IF NOT EXISTS contact_email text NOT NULL DEFAULT '';
ALTER TABLE skillhub_users ADD COLUMN IF NOT EXISTS avatar_url text NOT NULL DEFAULT '';
ALTER TABLE skillhub_users ADD COLUMN IF NOT EXISTS username text;
ALTER TABLE skillhub_users ADD COLUMN IF NOT EXISTS enabled boolean NOT NULL DEFAULT true;
ALTER TABLE skillhub_users ADD COLUMN IF NOT EXISTS source_db text;
UPDATE skillhub_users SET username=email WHERE username IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS skillhub_users_username ON skillhub_users(username);
CREATE TABLE IF NOT EXISTS skillhub_sessions(id uuid PRIMARY KEY,user_id uuid NOT NULL REFERENCES skillhub_users(id), token_hash text UNIQUE NOT NULL, expires_at timestamptz NOT NULL, revoked boolean NOT NULL DEFAULT false, ip text NOT NULL, user_agent text NOT NULL);
CREATE TABLE IF NOT EXISTS skillhub_login_events(id bigserial PRIMARY KEY,user_id uuid REFERENCES skillhub_users(id),email text NOT NULL,ip text NOT NULL,user_agent text NOT NULL,success boolean NOT NULL,created_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE skillhub_login_events ADD COLUMN IF NOT EXISTS ip_key text;
CREATE INDEX IF NOT EXISTS skillhub_login_rate ON skillhub_login_events(ip,created_at);`

type Server struct {
	DB         *sqlx.DB
	Secret     []byte
	HistoryKey []byte
}
type account struct {
	ID    string
	Email string
	Name  string
	Hash  string
	Role  string
}

func randomToken() (string, error) {
	b := make([]byte, 32)
	_, e := rand.Read(b)
	return hex.EncodeToString(b), e
}
func digest(t string) string { b := sha256.Sum256([]byte(t)); return hex.EncodeToString(b[:]) }
func denied() error {
	return status.Error(codes.Unauthenticated, "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.")
}
func (s *Server) Execute(ctx context.Context, in *structpb.Struct) (*structpb.Struct, error) {
	m := in.AsMap()
	get := func(k string) string { v, _ := m[k].(string); return v }
	action := get("action")
	email := strings.ToLower(strings.TrimSpace(get("username")))
	if email == "" {
		email = strings.ToLower(strings.TrimSpace(get("email")))
	}
	ip := get("ip")
	encryptedIP, encryptErr := seal(s.HistoryKey, ip)
	if encryptErr != nil {
		return nil, status.Error(codes.Internal, "Metadata encryption unavailable")
	}
	encryptedUA, encryptErr := seal(s.HistoryKey, get("user_agent"))
	if encryptErr != nil {
		return nil, status.Error(codes.Internal, "Metadata encryption unavailable")
	}
	ua := encryptedUA
	var u account
	sid := ""
	refresh := ""
	ttl := 24 * time.Hour
	if m["remember"] == true {
		ttl = 30 * 24 * time.Hour
	}
	if action == "login" || action == "register" {
		var n int
		if e := s.DB.GetContext(ctx, &n, `SELECT count(*) FROM skillhub_login_events WHERE ip_key=$1 AND email=$2 AND created_at>now()-interval '15 minutes' AND NOT success`, s.ipIndex(ip), email); e != nil {
			return nil, status.Error(codes.Internal, "Database unavailable")
		}
		if n >= 10 {
			return nil, status.Error(codes.ResourceExhausted, "Bạn đã nhập sai tài khoản hoặc mật khẩu quá nhiều lần. Để bảo vệ tài khoản, hệ thống tạm chặn đăng nhập từ địa chỉ mạng này cho tài khoản đang dùng. Vui lòng thử lại sau 15 phút.")
		}
		success := false
		defer func() {
			auditCtx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
			defer cancel()
			var id any
			if u.ID != "" {
				id = u.ID
			}
			s.DB.ExecContext(auditCtx, `INSERT INTO skillhub_login_events(user_id,email,ip,user_agent,success,ip_key) VALUES($1,$2,$3,$4,$5,$6)`, id, email, encryptedIP, ua, success, s.ipIndex(ip))
		}()
		if action == "register" {
			validAccount := regexp.MustCompile(`^[a-z0-9][a-z0-9._@+-]{2,63}$`).MatchString(email)
			if !validAccount || len(get("password")) < 12 || len(get("password")) > 72 || len(strings.TrimSpace(get("name"))) < 2 || len(get("name")) > 120 {
				return nil, status.Error(codes.InvalidArgument, "Tên tài khoản cần 3–64 ký tự (chữ, số, . _ @ + -), họ tên tối thiểu 2 ký tự; mật khẩu cần 12–72 byte")
			}
			hash, e := bcrypt.GenerateFromPassword([]byte(get("password")), 12)
			if e != nil {
				return nil, status.Error(codes.Internal, "Password error")
			}
			u = account{uuid.NewString(), email, strings.TrimSpace(get("name")), string(hash), "learner"}
			_, e = s.DB.ExecContext(ctx, `INSERT INTO skillhub_users(id,email,username,name,password_hash) VALUES($1,$2,$2,$3,$4)`, u.ID, email, u.Name, u.Hash)
			if e != nil {
				u.ID = ""
				var pe *pq.Error
				if errors.As(e, &pe) && pe.Code == "23505" {
					return nil, status.Error(codes.AlreadyExists, "Tên tài khoản đã được sử dụng")
				}
				return nil, status.Error(codes.Internal, "Database unavailable")
			}
		} else {
			e := s.DB.QueryRowContext(ctx, `SELECT id,email,name,password_hash,role FROM skillhub_users WHERE (username=$1 OR email=$1) AND enabled`, email).Scan(&u.ID, &u.Email, &u.Name, &u.Hash, &u.Role)
			if e != nil && !errors.Is(e, sql.ErrNoRows) {
				return nil, status.Error(codes.Internal, "Database unavailable")
			}
			if u.Hash == "" {
				u.Hash = "$2a$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW"
			}
			if bcrypt.CompareHashAndPassword([]byte(u.Hash), []byte(get("password"))) != nil || e != nil {
				return nil, status.Error(codes.Unauthenticated, "Tên tài khoản hoặc mật khẩu không đúng. Nếu chưa có tài khoản, vui lòng chọn Đăng ký.")
			}
		}
		var e error
		refresh, e = randomToken()
		if e != nil {
			return nil, status.Error(codes.Internal, "Random source unavailable")
		}
		sid = uuid.NewString()
		_, e = s.DB.ExecContext(ctx, `INSERT INTO skillhub_sessions(id,user_id,token_hash,expires_at,ip,user_agent) VALUES($1,$2,$3,$4,$5,$6)`, sid, u.ID, digest(refresh), time.Now().Add(ttl), encryptedIP, ua)
		if e != nil {
			return nil, status.Error(codes.Internal, "Database unavailable")
		}
		success = true
	} else if action == "refresh" || action == "logout" {
		tx, e := s.DB.BeginTxx(ctx, nil)
		if e != nil {
			return nil, status.Error(codes.Internal, "Database unavailable")
		}
		defer tx.Rollback()
		var expiry time.Time
		var revoked bool
		e = tx.QueryRowContext(ctx, `SELECT s.id,u.id,u.email,u.name,u.role,s.expires_at,s.revoked FROM skillhub_sessions s JOIN skillhub_users u ON u.id=s.user_id WHERE token_hash=$1 AND u.enabled FOR UPDATE OF s`, digest(get("token"))).Scan(&sid, &u.ID, &u.Email, &u.Name, &u.Role, &expiry, &revoked)
		if e != nil {
			return nil, denied()
		}
		if revoked {
			_, e = tx.ExecContext(ctx, `UPDATE skillhub_sessions SET revoked=true WHERE user_id=$1`, u.ID)
			if e == nil {
				e = tx.Commit()
			}
			return nil, denied()
		}
		if time.Now().After(expiry) {
			return nil, denied()
		}
		if action == "logout" {
			_, e = tx.ExecContext(ctx, `UPDATE skillhub_sessions SET revoked=true WHERE id=$1`, sid)
		} else {
			refresh, e = randomToken()
			if e == nil {
				_, e = tx.ExecContext(ctx, `UPDATE skillhub_sessions SET revoked=true WHERE id=$1`, sid)
			}
			sid = uuid.NewString()
			if e == nil {
				_, e = tx.ExecContext(ctx, `INSERT INTO skillhub_sessions(id,user_id,token_hash,expires_at,ip,user_agent) VALUES($1,$2,$3,$4,$5,$6)`, sid, u.ID, digest(refresh), expiry, encryptedIP, ua)
			}
		}
		if e != nil {
			return nil, status.Error(codes.Internal, "Database unavailable")
		}
		if e = tx.Commit(); e != nil {
			return nil, status.Error(codes.Internal, "Database unavailable")
		}
		if action == "logout" {
			return structpb.NewStruct(map[string]any{"ok": true})
		}
	} else {
		claims := jwt.MapClaims{}
		t, e := jwt.ParseWithClaims(get("token"), claims, func(t *jwt.Token) (any, error) { return s.Secret, nil }, jwt.WithValidMethods([]string{"HS256"}), jwt.WithIssuer("skillhub"), jwt.WithAudience("skillhub-web"), jwt.WithExpirationRequired())
		if e != nil || !t.Valid {
			return nil, denied()
		}
		sid, _ = claims["sid"].(string)
		id, _ := claims["sub"].(string)
		e = s.DB.QueryRowContext(ctx, `SELECT u.id,u.email,u.name,u.role FROM skillhub_users u JOIN skillhub_sessions s ON s.user_id=u.id WHERE s.id=$1 AND u.id=$2 AND u.enabled AND NOT s.revoked AND s.expires_at>now()`, sid, id).Scan(&u.ID, &u.Email, &u.Name, &u.Role)
		if e != nil {
			return nil, denied()
		}
		if action == "history" {
			rows, e := s.DB.QueryContext(ctx, `SELECT ip,user_agent,success,created_at FROM skillhub_login_events WHERE user_id=$1 ORDER BY id DESC LIMIT 50`, u.ID)
			if e != nil {
				return nil, status.Error(codes.Internal, "Database unavailable")
			}
			defer rows.Close()
			items := []any{}
			for rows.Next() {
				var p, a string
				var ok bool
				var at time.Time
				if e = rows.Scan(&p, &a, &ok, &at); e != nil {
					return nil, status.Error(codes.Internal, "Database unavailable")
				}
				p, e = openMetadata(s.HistoryKey, p)
				if e != nil {
					return nil, status.Error(codes.Internal, "Cannot decrypt login history")
				}
				a, e = openMetadata(s.HistoryKey, a)
				if e != nil {
					return nil, status.Error(codes.Internal, "Cannot decrypt login history")
				}
				items = append(items, map[string]any{"ip": p, "user_agent": a, "success": ok, "created_at": at.Format(time.RFC3339)})
			}
			if rows.Err() != nil {
				return nil, status.Error(codes.Internal, "Database unavailable")
			}
			return structpb.NewStruct(map[string]any{"history": items})
		}
		if action == "profile_update" || action == "password_change" {
			return s.personalAction(ctx, u, sid, action, m["payload"])
		}
		if action != "me" {
			if action == "level_config" || action == "level_save" || action == "level_simulate" {
				return s.levelAction(ctx, u, action, m["payload"])
			}
			return s.moduleAction(ctx, u, action, m["payload"])
		}
	}
	token, e := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{"sub": u.ID, "sid": sid, "iss": "skillhub", "aud": "skillhub-web", "exp": time.Now().Add(10 * time.Minute).Unix(), "iat": time.Now().Unix()}).SignedString(s.Secret)
	if e != nil {
		return nil, status.Error(codes.Internal, "Token error")
	}
	permissions, e := s.permissions(ctx, u)
	if e != nil {
		return nil, status.Error(codes.Internal, "Cannot load permissions")
	}
	roleName := "Người học"
	if u.Role == "admin" {
		roleName = "Quản trị viên"
	}
	user := map[string]any{"id": u.ID, "email": u.Email, "username": u.Email, "name": u.Name, "role": u.Role, "roles": []any{u.Role}, "roleName": roleName, "avatar": string([]rune(u.Name)[0]), "permissions": permissions, "assignedGroups": []any{}}
	var department, position, jobRole string
	if e = s.DB.QueryRowContext(ctx, `SELECT COALESCE(d.label,u.department),COALESCE(p.label,u.position),COALESCE(r.label,u.job_role) FROM skillhub_users u LEFT JOIN skillhub_directory d ON d.kind='department' AND d.key=u.department LEFT JOIN skillhub_directory p ON p.kind='position' AND p.key=u.position LEFT JOIN skillhub_directory r ON r.kind='job_role' AND r.key=u.job_role WHERE u.id=$1`, u.ID).Scan(&department, &position, &jobRole); e != nil {
		return nil, status.Error(codes.Internal, "Cannot load profile")
	}
	user["department"] = department
	user["position"] = position
	user["jobRole"] = jobRole
	var birthDate, phone, contactEmail, avatarURL, username string
	if e = s.DB.QueryRowContext(ctx, `SELECT COALESCE(birth_date::text,''),phone,contact_email,avatar_url,username FROM skillhub_users WHERE id=$1`, u.ID).Scan(&birthDate, &phone, &contactEmail, &avatarURL, &username); e != nil {
		return nil, status.Error(codes.Internal, "Cannot load personal profile")
	}
	user["username"] = username
	if contactEmail != "" {
		user["email"] = contactEmail
	} else if !strings.Contains(u.Email, "@") {
		user["email"] = ""
	}
	user["birthDate"] = birthDate
	user["phone"] = phone
	user["avatarUrl"] = avatarURL
	groupRows, err := s.DB.QueryContext(ctx, `SELECT g.key,g.label FROM skillhub_users u JOIN skillhub_permission_groups g ON g.enabled WHERE u.id=$1 AND `+groupMatch+` ORDER BY g.label`, u.ID)
	if err != nil {
		return nil, status.Error(codes.Internal, "Cannot load user groups")
	}
	groups := []any{}
	for groupRows.Next() {
		var key, label string
		if err = groupRows.Scan(&key, &label); err != nil {
			groupRows.Close()
			return nil, err
		}
		groups = append(groups, map[string]any{"key": key, "label": label})
	}
	err = groupRows.Err()
	groupRows.Close()
	if err != nil {
		return nil, err
	}
	user["assignedGroups"] = groups
	return structpb.NewStruct(map[string]any{"access_token": token, "refresh_token": refresh, "user": user})
}

// Protobuf Struct is a standard generated message; this binding mirrors skillhub.proto.
func Register(s *grpc.Server, impl *Server) {
	s.RegisterService(&grpc.ServiceDesc{ServiceName: "skillhub.Auth", HandlerType: (*authRPC)(nil), Methods: []grpc.MethodDesc{{MethodName: "Execute", Handler: func(srv any, ctx context.Context, dec func(any) error, interceptor grpc.UnaryServerInterceptor) (any, error) {
		in := new(structpb.Struct)
		if e := dec(in); e != nil {
			return nil, e
		}
		if interceptor == nil {
			return impl.Execute(ctx, in)
		}
		return interceptor(ctx, in, &grpc.UnaryServerInfo{Server: srv, FullMethod: "/skillhub.Auth/Execute"}, func(ctx context.Context, req any) (any, error) { return impl.Execute(ctx, req.(*structpb.Struct)) })
	}}}, Metadata: "skillhub.proto"}, impl)
}

type authRPC interface {
	Execute(context.Context, *structpb.Struct) (*structpb.Struct, error)
}
