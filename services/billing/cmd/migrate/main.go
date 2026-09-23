// migrate — runs goose migrations for the billing service.
package main

import (
	"context"
	"database/sql"
	"flag"
	"fmt"
	"os"

	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/pressly/goose/v3"

	"github.com/vettguard/vettguard/services/billing/migrations"
)

func main() {
	flag.Parse()
	cmd := flag.Arg(0)
	if cmd == "" {
		cmd = "up"
	}
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		fmt.Fprintln(os.Stderr, "DATABASE_URL env var is required")
		os.Exit(2)
	}
	db, err := sql.Open("pgx", dsn)
	if err != nil {
		fail("open db", err)
	}
	defer db.Close()
	goose.SetBaseFS(migrations.FS)
	if err := goose.SetDialect("postgres"); err != nil {
		fail("set dialect", err)
	}
	if err := goose.RunContext(context.Background(), cmd, db, "."); err != nil {
		fail("run "+cmd, err)
	}
}

func fail(stage string, err error) {
	fmt.Fprintf(os.Stderr, "migrate: %s: %v\n", stage, err)
	os.Exit(1)
}
