package main

import (
	"context"
	"encoding/hex"
	"encoding/json"
	"github.com/jmoiron/sqlx"
	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/structpb"
	"log"
	"net"
	"net/http"
	"net/url"
	"os"
	"server-core/internal/skillauth"
	"strings"
	"time"
)

func env(k, d string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return d
}
func main() {
	godotenv.Load()
	secret := os.Getenv("SKILLHUB_JWT_SECRET")
	if len(secret) < 32 {
		log.Fatal("Set SKILLHUB_JWT_SECRET to at least 32 random characters")
	}
	u := &url.URL{Scheme: "postgres", User: url.UserPassword(env("POSTGRES_USER", "postgres"), os.Getenv("POSTGRES_PASSWORD")), Host: net.JoinHostPort("localhost", env("POSTGRES_PORT", "5432")), Path: "skillhub"}
	q := u.Query()
	q.Set("sslmode", env("POSTGRES_SSLMODE", "disable"))
	u.RawQuery = q.Encode()
	adminURL := *u
	adminURL.Path = "postgres"
	admin, err := sqlx.Connect("postgres", adminURL.String())
	if err != nil {
		log.Fatal("Cannot connect to PostgreSQL maintenance database")
	}
	var exists bool
	if err = admin.Get(&exists, `SELECT EXISTS(SELECT 1 FROM pg_database WHERE datname='skillhub')`); err != nil {
		log.Fatal(err)
	}
	if !exists {
		if _, err = admin.Exec(`CREATE DATABASE skillhub`); err != nil {
			log.Fatal("Cannot create skillhub database: ", err)
		}
	}
	admin.Close()
	db, e := sqlx.Connect("postgres", u.String())
	if e != nil {
		log.Fatal("Cannot connect to localhost PostgreSQL / skillhub: ", e)
	}
	defer db.Close()
	db.SetMaxOpenConns(15)
	if _, e = db.Exec(skillauth.Schema); e != nil {
		log.Fatal(e)
	}
	if _, e = db.Exec(skillauth.ModuleSchema); e != nil {
		log.Fatal(e)
	}
	if _, e = db.Exec(skillauth.PeopleSchema); e != nil {
		log.Fatal(e)
	}
	if _, e = db.Exec(skillauth.PermissionHierarchySchema); e != nil {
		log.Fatal(e)
	}
	if _, e = db.Exec(skillauth.LevelSchema); e != nil {
		log.Fatal(e)
	}
	historyKey, e := hex.DecodeString(os.Getenv("SKILLHUB_HISTORY_KEY"))
	if e != nil || len(historyKey) != 32 {
		log.Fatal("Set SKILLHUB_HISTORY_KEY to 64 hex characters")
	}
	authServer := &skillauth.Server{DB: db, Secret: []byte(secret), HistoryKey: historyKey}
	if e = authServer.InitPermissionGroups(context.Background()); e != nil {
		log.Fatal(e)
	}
	if e = authServer.InitLevelPolicy(context.Background()); e != nil {
		log.Fatal(e)
	}
	if e = authServer.MigrateMetadata(context.Background()); e != nil {
		log.Fatal("Cannot encrypt existing metadata: ", e)
	}
	listener, e := net.Listen("tcp", "127.0.0.1:60052")
	if e != nil {
		log.Fatal(e)
	}
	g := grpc.NewServer()
	skillauth.Register(g, authServer)
	go func() {
		if e := g.Serve(listener); e != nil {
			log.Fatal(e)
		}
	}()
	conn, e := grpc.NewClient("127.0.0.1:60052", grpc.WithTransportCredentials(insecure.NewCredentials()))
	if e != nil {
		log.Fatal(e)
	}
	defer conn.Close()
	secure := env("SKILLHUB_COOKIE_SECURE", "true") == "true"
	allowedOrigins := map[string]bool{}
	for _, origin := range strings.Split(env("SKILLHUB_ORIGINS", env("SKILLHUB_ORIGIN", "http://localhost:5173")), ",") {
		allowedOrigins[strings.TrimSpace(origin)] = true
	}
	if !secure {
		allowedOrigins["http://localhost:5173"] = true
		allowedOrigins["http://127.0.0.1:5173"] = true
	}
	mux := http.NewServeMux()
	mux.HandleFunc("/api/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
	})
	mux.HandleFunc("/api/auth/", func(w http.ResponseWriter, r *http.Request) {
		requestOrigin := r.Header.Get("Origin")
		w.Header().Add("Vary", "Origin")
		if allowedOrigins[requestOrigin] {
			w.Header().Set("Access-Control-Allow-Origin", requestOrigin)
			w.Header().Set("Access-Control-Allow-Credentials", "true")
			w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		}
		if r.Method == http.MethodOptions {
			if !allowedOrigins[requestOrigin] {
				http.Error(w, "Origin rejected", http.StatusForbidden)
				return
			}
			w.WriteHeader(http.StatusNoContent)
			return
		}
		w.Header().Set("Cache-Control", "no-store")
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("X-Content-Type-Options", "nosniff")
		fail := func(n int, msg string) {
			w.WriteHeader(n)
			json.NewEncoder(w).Encode(map[string]string{"message": msg})
		}
		if r.Method != "POST" {
			fail(405, "POST required")
			return
		}
		if !allowedOrigins[r.Header.Get("Origin")] {
			fail(403, "Địa chỉ frontend chưa được cho phép. Kiểm tra SKILLHUB_ORIGINS trong cấu hình server.")
			return
		}
		if !strings.HasPrefix(r.Header.Get("Content-Type"), "application/json") {
			fail(415, "JSON required")
			return
		}
		action := strings.TrimPrefix(r.URL.Path, "/api/auth/")
		switch action {
		case "login", "register", "refresh", "logout", "me", "history", "profile_update", "password_change", "modules", "module_export", "module_create", "module_update", "module_delete", "module_import", "grants", "grant_save", "people", "user_update", "user_create", "group_list", "group_save", "group_delete", "group_members", "directory_save", "level_config", "level_save", "level_simulate":
		default:
			fail(404, "Not found")
			return
		}
		var body struct {
			Email    string `json:"email"`
			Username string `json:"username"`
			Password string `json:"password"`
			Name     string `json:"name"`
			Remember bool   `json:"remember"`
			Payload  any    `json:"payload"`
		}
		r.Body = http.MaxBytesReader(w, r.Body, 65536)
		if e := json.NewDecoder(r.Body).Decode(&body); e != nil {
			fail(400, "Invalid JSON")
			return
		}
		ip, _, _ := net.SplitHostPort(r.RemoteAddr)
		token := strings.TrimPrefix(r.Header.Get("Authorization"), "Bearer ")
		if action == "refresh" || action == "logout" {
			c, e := r.Cookie("skillhub_refresh")
			if e != nil {
				fail(401, "Phiên đăng nhập đã hết hạn")
				return
			}
			token = c.Value
		}
		input, _ := structpb.NewStruct(map[string]any{"action": action, "email": body.Email, "username": body.Username, "password": body.Password, "name": body.Name, "remember": body.Remember, "ip": ip, "user_agent": r.UserAgent(), "token": token, "payload": body.Payload})
		out := new(structpb.Struct)
		ctx, cancel := context.WithTimeout(r.Context(), 15*time.Second)
		defer cancel()
		e := conn.Invoke(ctx, "/skillhub.Auth/Execute", input, out)
		if e != nil {
			code := 500
			switch status.Code(e) {
			case codes.Unauthenticated:
				code = 401
			case codes.PermissionDenied:
				code = 403
			case codes.FailedPrecondition:
				code = 409
			case codes.NotFound:
				code = 404
			case codes.InvalidArgument:
				code = 400
			case codes.AlreadyExists:
				code = 409
			case codes.ResourceExhausted:
				code = 429
			}
			msg := status.Convert(e).Message()
			if code == 500 {
				msg = "Không thể xử lý yêu cầu"
			}
			if code == 401 && (action == "refresh" || action == "logout") {
				http.SetCookie(w, &http.Cookie{Name: "skillhub_refresh", Path: "/api/auth/", HttpOnly: true, Secure: secure, SameSite: http.SameSiteStrictMode, MaxAge: -1})
			}
			fail(code, msg)
			return
		}
		result := out.AsMap()
		if refresh, ok := result["refresh_token"].(string); ok && refresh != "" {
			age := 0
			if body.Remember || action == "refresh" {
				age = 30 * 24 * 3600
			}
			http.SetCookie(w, &http.Cookie{Name: "skillhub_refresh", Value: refresh, Path: "/api/auth/", HttpOnly: true, Secure: secure, SameSite: http.SameSiteStrictMode, MaxAge: age})
		}
		delete(result, "refresh_token")
		if action == "logout" {
			http.SetCookie(w, &http.Cookie{Name: "skillhub_refresh", Path: "/api/auth/", HttpOnly: true, Secure: secure, SameSite: http.SameSiteStrictMode, MaxAge: -1})
		}
		json.NewEncoder(w).Encode(result)
	})
	log.Println("SkillHub HTTP 127.0.0.1:8081; gRPC 127.0.0.1:60052")
	log.Fatal((&http.Server{Addr: "127.0.0.1:8081", Handler: mux, ReadHeaderTimeout: 5 * time.Second, ReadTimeout: 20 * time.Second, WriteTimeout: 20 * time.Second, IdleTimeout: 60 * time.Second}).ListenAndServe())
}
