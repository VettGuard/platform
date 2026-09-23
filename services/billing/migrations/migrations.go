// Package migrations embeds the billing service goose migrations.
package migrations

import "embed"

//go:embed *.sql
var FS embed.FS
