// Package migrations embeds the audit service goose migrations.
package migrations

import "embed"

//go:embed *.sql
var FS embed.FS
