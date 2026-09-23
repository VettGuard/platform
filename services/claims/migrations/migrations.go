// Package migrations embeds the claims service goose migrations.
package migrations

import "embed"

//go:embed *.sql
var FS embed.FS
