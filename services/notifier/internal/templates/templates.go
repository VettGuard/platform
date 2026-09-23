// Package templates renders the 5 transactional email templates. Plain
// text/html.Template with inline content — no external file loading at
// startup, so the binary is self-contained.
//
// Templates intentionally use neutral, brand-consistent copy. Real
// localization (i18n) lands in Phase 4 with native-speaker review; for now
// the `locale` var is forwarded as a hint to the future renderer.
package templates

import (
	"bytes"
	"errors"
	"fmt"
	htmltpl "html/template"
	texttpl "text/template"
)

var (
	ErrUnknown        = errors.New("templates: unknown template name")
	ErrMissingVar     = errors.New("templates: required var missing")
)

// Known template names — keep in sync with the SendEmailRequest.template field.
const (
	AuthVerify              = "auth.verify"
	AuthReset               = "auth.reset"
	AuthMFA                 = "auth.mfa"
	BillingInvoice          = "billing.invoice"
	NotifyGeneric           = "notify.generic"
	MarketingWaitlistConfirm = "marketing.waitlist_confirm"
)

type Rendered struct {
	Subject  string
	HTMLBody string
	TextBody string
}

// Render returns the rendered email for name. `vars` carries template
// substitutions (e.g. `verify_url`, `full_name`, `invoice_amount`).
func Render(name string, vars map[string]string) (Rendered, error) {
	tpl, ok := registry[name]
	if !ok {
		return Rendered{}, fmt.Errorf("%w: %q", ErrUnknown, name)
	}
	for _, v := range tpl.required {
		if vars[v] == "" {
			return Rendered{}, fmt.Errorf("%w: template=%q var=%q", ErrMissingVar, name, v)
		}
	}
	subject, err := execText(tpl.subject, vars)
	if err != nil {
		return Rendered{}, fmt.Errorf("subject: %w", err)
	}
	text, err := execText(tpl.text, vars)
	if err != nil {
		return Rendered{}, fmt.Errorf("text body: %w", err)
	}
	html, err := execHTML(tpl.html, vars)
	if err != nil {
		return Rendered{}, fmt.Errorf("html body: %w", err)
	}
	return Rendered{Subject: subject, HTMLBody: html, TextBody: text}, nil
}

type tplDef struct {
	subject  string
	text     string
	html     string
	required []string
}

var registry = map[string]tplDef{
	AuthVerify: {
		subject:  "Verify your VettGuard email",
		required: []string{"full_name", "verify_url"},
		text: `Hi {{.full_name}},

Click the link below to verify your VettGuard email address:

{{.verify_url}}

This link expires in 24 hours. If you didn't sign up, you can ignore this email.

— The VettGuard team`,
		html: `<p>Hi {{.full_name}},</p>
<p>Click the link below to verify your VettGuard email address:</p>
<p><a href="{{.verify_url}}">Verify email</a></p>
<p>This link expires in 24 hours. If you didn't sign up, you can ignore this email.</p>
<p>— The VettGuard team</p>`,
	},
	AuthReset: {
		subject:  "Reset your VettGuard password",
		required: []string{"full_name", "reset_url"},
		text: `Hi {{.full_name}},

We received a request to reset your VettGuard password. Click the link below to choose a new one:

{{.reset_url}}

This link expires in 1 hour. If you didn't request this, you can safely ignore this email.

— The VettGuard team`,
		html: `<p>Hi {{.full_name}},</p>
<p>We received a request to reset your VettGuard password. Click the link below to choose a new one:</p>
<p><a href="{{.reset_url}}">Reset password</a></p>
<p>This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
<p>— The VettGuard team</p>`,
	},
	AuthMFA: {
		subject:  "Two-factor authentication is now enabled",
		required: []string{"full_name"},
		text: `Hi {{.full_name}},

Two-factor authentication (TOTP) is now active on your VettGuard account. Keep your recovery codes somewhere safe — you'll need them if you lose access to your authenticator app.

If you didn't enable 2FA, contact security@vettguard.com immediately.

— The VettGuard team`,
		html: `<p>Hi {{.full_name}},</p>
<p>Two-factor authentication (TOTP) is now active on your VettGuard account. Keep your recovery codes somewhere safe — you'll need them if you lose access to your authenticator app.</p>
<p>If you didn't enable 2FA, contact <a href="mailto:security@vettguard.com">security@vettguard.com</a> immediately.</p>
<p>— The VettGuard team</p>`,
	},
	BillingInvoice: {
		subject:  "Your VettGuard invoice {{.invoice_number}}",
		required: []string{"invoice_number", "amount", "hosted_url"},
		text: `Your VettGuard invoice {{.invoice_number}} for {{.amount}} is ready.

View and pay: {{.hosted_url}}

— VettGuard Billing`,
		html: `<p>Your VettGuard invoice <strong>{{.invoice_number}}</strong> for {{.amount}} is ready.</p>
<p><a href="{{.hosted_url}}">View and pay</a></p>
<p>— VettGuard Billing</p>`,
	},
	NotifyGeneric: {
		subject:  "{{.subject}}",
		required: []string{"subject", "body"},
		text:     `{{.body}}`,
		html:     `<div>{{.body}}</div>`,
	},
	MarketingWaitlistConfirm: {
		subject:  "Confirm your VettGuard waitlist spot",
		required: []string{"confirm_url"},
		text: `Thanks for joining the VettGuard waitlist.

Confirm your email so we can let you know when your spot opens:

{{.confirm_url}}

This link expires in 7 days. If you didn't sign up, you can ignore this email — we won't reach out again.

— The VettGuard team
https://vettguard.com`,
		html: `<p>Thanks for joining the VettGuard waitlist.</p>
<p>Confirm your email so we can let you know when your spot opens:</p>
<p><a href="{{.confirm_url}}">Confirm email</a></p>
<p>This link expires in 7 days. If you didn't sign up, you can ignore this email — we won't reach out again.</p>
<p>— The VettGuard team<br/><a href="https://vettguard.com">vettguard.com</a></p>`,
	},
}

func execText(s string, vars map[string]string) (string, error) {
	t, err := texttpl.New("t").Parse(s)
	if err != nil {
		return "", err
	}
	var buf bytes.Buffer
	if err := t.Execute(&buf, vars); err != nil {
		return "", err
	}
	return buf.String(), nil
}

func execHTML(s string, vars map[string]string) (string, error) {
	t, err := htmltpl.New("h").Parse(s)
	if err != nil {
		return "", err
	}
	var buf bytes.Buffer
	if err := t.Execute(&buf, vars); err != nil {
		return "", err
	}
	return buf.String(), nil
}
