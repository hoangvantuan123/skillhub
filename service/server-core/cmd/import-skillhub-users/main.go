package main

import (
	"context"
	"fmt"
	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
	"golang.org/x/crypto/bcrypt"
	"log"
	"net"
	"net/url"
	"os"
	"server-core/internal/skillauth"
	"strings"
	"time"
)

func main() {
	godotenv.Load()
	source := os.Getenv("POSTGRES_DB")
	if source == "" || source == "skillhub" {
		log.Fatal("POSTGRES_DB must name the legacy source database")
	}
	port := os.Getenv("POSTGRES_PORT")
	if port == "" {
		port = "5432"
	}
	u := &url.URL{Scheme: "postgres", User: url.UserPassword(os.Getenv("POSTGRES_USER"), os.Getenv("POSTGRES_PASSWORD")), Host: net.JoinHostPort("localhost", port), Path: source}
	q := u.Query()
	q.Set("sslmode", "disable")
	u.RawQuery = q.Encode()
	src, e := sqlx.Connect("postgres", u.String())
	if e != nil {
		log.Fatal("Cannot connect source")
	}
	defer src.Close()
	u.Path = "skillhub"
	dst, e := sqlx.Connect("postgres", u.String())
	if e != nil {
		log.Fatal("Cannot connect destination")
	}
	defer dst.Close()
	ctx, cancel := context.WithTimeout(context.Background(), time.Minute)
	defer cancel()
	if _, e = dst.ExecContext(ctx, skillauth.Schema); e != nil {
		log.Fatal(e)
	}
	rows, e := src.QueryContext(ctx, `SELECT COALESCE("UserId",''),COALESCE("UserName",''),COALESCE("Password2",''),COALESCE("StatusAcc",true),COALESCE("CheckPass1",false),COALESCE("Active",false) FROM "_ERPUsers"`)
	if e != nil {
		log.Fatal(e)
	}
	defer rows.Close()
	tx, e := dst.BeginTxx(ctx, nil)
	if e != nil {
		log.Fatal(e)
	}
	defer tx.Rollback()
	inserted, disabled, skipped := 0, 0, 0
	for rows.Next() {
		var login, name, hash string
		var locked, activated, active bool
		if e = rows.Scan(&login, &name, &hash, &locked, &activated, &active); e != nil {
			log.Fatal(e)
		}
		login = strings.ToLower(strings.TrimSpace(login))
		if login == "" {
			skipped++
			continue
		}
		if _, e = bcrypt.Cost([]byte(hash)); e != nil {
			skipped++
			continue
		}
		if name == "" {
			name = login
		}
		enabled := !locked && activated && active
		result, e := tx.ExecContext(ctx, `INSERT INTO skillhub_users(id,email,username,name,password_hash,enabled,source_db) VALUES($1,$2,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING`, uuid.NewString(), login, name, hash, enabled, source)
		if e != nil {
			log.Fatal(e)
		}
		n, _ := result.RowsAffected()
		if n == 0 {
			skipped++
			continue
		}
		inserted++
		if !enabled {
			disabled++
		}
	}
	if e = rows.Err(); e != nil {
		log.Fatal(e)
	}
	if e = tx.Commit(); e != nil {
		log.Fatal(e)
	}
	fmt.Printf("source=%s destination=skillhub inserted=%d disabled=%d skipped=%d; bcrypt hashes preserved; existing accounts unchanged; role=learner\n", source, inserted, disabled, skipped)
}
