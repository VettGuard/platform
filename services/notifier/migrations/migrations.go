// Package migrations embeds the notifier service goose migrations.
package migrations

import "embed"

//go:embed *.sql
var FS embed.FS
