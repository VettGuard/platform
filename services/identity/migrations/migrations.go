// Package migrations embeds the identity service SQL files so the migrate
// binary doesn't need them on disk at runtime.
package migrations

import "embed"

//go:embed *.sql
var FS embed.FS
