// Package migrations embeds the brokers service goose migrations.
package migrations

import "embed"

//go:embed *.sql
var FS embed.FS
