// Package oauth wires Google + Microsoft OAuth2 for sign-in / link.
package oauth

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"sync"
	"time"

	"golang.org/x/oauth2"
	googleEndpoint "golang.org/x/oauth2/google"
	msEndpoint "golang.org/x/oauth2/microsoft"
)

// Provider names — also the value stored in oauth_links.provider.
const (
	ProviderGoogle    = "google"
	ProviderMicrosoft = "microsoft"
)

// UserInfo is the subset of the provider's profile we keep.
type UserInfo struct {
	ExternalID string // provider-stable id (sub)
	Email      string
	FullName   string
}

// Config holds per-provider OAuth client credentials and the post-callback
// redirect URI the auth code is exchanged against.
type Config struct {
	Google    *oauth2.Config
	Microsoft *oauth2.Config
}

func NewConfig(googleID, googleSecret, msID, msSecret, redirectURL string) *Config {
	c := &Config{}
	if googleID != "" {
		c.Google = &oauth2.Config{
			ClientID:     googleID,
			ClientSecret: googleSecret,
			Endpoint:     googleEndpoint.Endpoint,
			RedirectURL:  redirectURL,
			Scopes:       []string{"openid", "email", "profile"},
		}
	}
	if msID != "" {
		c.Microsoft = &oauth2.Config{
			ClientID:     msID,
			ClientSecret: msSecret,
			Endpoint:     msEndpoint.AzureADEndpoint("common"),
			RedirectURL:  redirectURL,
			Scopes:       []string{"openid", "email", "profile", "User.Read"},
		}
	}
	return c
}

// configFor returns the provider config or an error.
func (c *Config) configFor(provider string) (*oauth2.Config, error) {
	switch provider {
	case ProviderGoogle:
		if c.Google == nil {
			return nil, errors.New("oauth: google not configured")
		}
		return c.Google, nil
	case ProviderMicrosoft:
		if c.Microsoft == nil {
			return nil, errors.New("oauth: microsoft not configured")
		}
		return c.Microsoft, nil
	default:
		return nil, fmt.Errorf("oauth: unknown provider %q", provider)
	}
}

// AuthorizeURL returns the URL the browser should be redirected to + the
// state token the caller must persist (StateStore) and re-validate on callback.
func (c *Config) AuthorizeURL(provider, state string) (string, error) {
	cfg, err := c.configFor(provider)
	if err != nil {
		return "", err
	}
	return cfg.AuthCodeURL(state, oauth2.AccessTypeOnline), nil
}

// Exchange swaps an auth code for tokens, then fetches userinfo.
func (c *Config) Exchange(ctx context.Context, provider, code string) (*UserInfo, error) {
	cfg, err := c.configFor(provider)
	if err != nil {
		return nil, err
	}
	tok, err := cfg.Exchange(ctx, code)
	if err != nil {
		return nil, fmt.Errorf("oauth %s: exchange: %w", provider, err)
	}
	return fetchUserInfo(ctx, cfg.Client(ctx, tok), provider)
}

func fetchUserInfo(ctx context.Context, client *http.Client, provider string) (*UserInfo, error) {
	var url string
	switch provider {
	case ProviderGoogle:
		url = "https://openidconnect.googleapis.com/v1/userinfo"
	case ProviderMicrosoft:
		url = "https://graph.microsoft.com/oidc/userinfo"
	default:
		return nil, fmt.Errorf("oauth: unknown provider %q", provider)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("oauth %s: userinfo: %w", provider, err)
	}
	defer resp.Body.Close()
	if resp.StatusCode/100 != 2 {
		return nil, fmt.Errorf("oauth %s: userinfo status %d", provider, resp.StatusCode)
	}
	var payload struct {
		Sub   string `json:"sub"`
		Email string `json:"email"`
		Name  string `json:"name"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		return nil, fmt.Errorf("oauth %s: decode userinfo: %w", provider, err)
	}
	if payload.Sub == "" || payload.Email == "" {
		return nil, errors.New("oauth: provider returned empty sub or email")
	}
	return &UserInfo{ExternalID: payload.Sub, Email: payload.Email, FullName: payload.Name}, nil
}

// StateStore is a minimal in-process store for the CSRF `state` parameter.
// Each state maps to a provider and an expiry; consumed on callback. For
// multi-replica deployments, swap this for Redis (same interface).
type StateStore struct {
	mu     sync.Mutex
	states map[string]stateEntry
	ttl    time.Duration
}

type stateEntry struct {
	Provider  string
	ExpiresAt time.Time
}

func NewStateStore(ttl time.Duration) *StateStore {
	return &StateStore{states: make(map[string]stateEntry), ttl: ttl}
}

func (s *StateStore) Save(state, provider string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.states[state] = stateEntry{Provider: provider, ExpiresAt: time.Now().Add(s.ttl)}
	s.gcLocked()
}

// Consume validates the state, returns its provider, and removes it.
func (s *StateStore) Consume(state string) (string, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	e, ok := s.states[state]
	if !ok {
		return "", errors.New("oauth: unknown state")
	}
	delete(s.states, state)
	if time.Now().After(e.ExpiresAt) {
		return "", errors.New("oauth: state expired")
	}
	return e.Provider, nil
}

func (s *StateStore) gcLocked() {
	if len(s.states) < 256 {
		return
	}
	now := time.Now()
	for k, e := range s.states {
		if now.After(e.ExpiresAt) {
			delete(s.states, k)
		}
	}
}
