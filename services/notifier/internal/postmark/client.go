// Package postmark wraps the Postmark transactional email API. Minimal —
// just the /email endpoint we use. Dependency-free so we can swap providers
// (SES, Resend, etc.) by replacing one file.
package postmark

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"time"
)

const apiURL = "https://api.postmarkapp.com/email"

type Client struct {
	ServerToken string
	FromAddress string
	HTTPClient  *http.Client
}

func New(serverToken, from string) *Client {
	return &Client{
		ServerToken: serverToken,
		FromAddress: from,
		HTTPClient:  &http.Client{Timeout: 15 * time.Second},
	}
}

// Send delivers one transactional email. On 2xx returns the Postmark
// MessageID; non-2xx is wrapped as an error containing the body.
type Email struct {
	To        string
	Subject   string
	HTMLBody  string
	TextBody  string
	MessageStream string // default "outbound"
}

type sendBody struct {
	From          string `json:"From"`
	To            string `json:"To"`
	Subject       string `json:"Subject"`
	HTMLBody      string `json:"HtmlBody,omitempty"`
	TextBody      string `json:"TextBody,omitempty"`
	MessageStream string `json:"MessageStream,omitempty"`
}

type sendResponse struct {
	MessageID   string `json:"MessageID"`
	ErrorCode   int    `json:"ErrorCode"`
	Message     string `json:"Message"`
}

func (c *Client) Send(ctx context.Context, e Email) (string, error) {
	if e.MessageStream == "" {
		e.MessageStream = "outbound"
	}
	raw, err := json.Marshal(sendBody{
		From:          c.FromAddress,
		To:            e.To,
		Subject:       e.Subject,
		HTMLBody:      e.HTMLBody,
		TextBody:      e.TextBody,
		MessageStream: e.MessageStream,
	})
	if err != nil {
		return "", err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, apiURL, bytes.NewReader(raw))
	if err != nil {
		return "", err
	}
	req.Header.Set("Accept", "application/json")
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Postmark-Server-Token", c.ServerToken)

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("postmark: %w", err)
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)

	var parsed sendResponse
	_ = json.Unmarshal(body, &parsed)

	if resp.StatusCode/100 != 2 {
		return "", fmt.Errorf("postmark: status %d: %s", resp.StatusCode, string(body))
	}
	if parsed.ErrorCode != 0 {
		return "", errors.New("postmark: " + parsed.Message)
	}
	return parsed.MessageID, nil
}
