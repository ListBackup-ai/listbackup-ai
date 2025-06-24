package util

import (
	"fmt"
	"net/http"
	"strings"
	"time"
)

const (
	idTokenCookieName      = "id_token"
	accessTokenCookieName  = "access_token"
	refreshTokenCookieName = "refresh_token"
)

func CreateAuthCookies(idToken, accessToken, refreshToken, domain string) []string {
	idCookie := createCookie(idTokenCookieName, idToken, domain, 1*time.Hour)
	accessCookie := createCookie(accessTokenCookieName, accessToken, domain, 1*time.Hour)
	refreshCookie := createCookie(refreshTokenCookieName, refreshToken, domain, 30*24*time.Hour) // 30 days

	return []string{idCookie.String(), accessCookie.String(), refreshCookie.String()}
}

func ClearAuthCookies(domain string) []string {
	idCookie := clearCookie(idTokenCookieName, domain)
	accessCookie := clearCookie(accessTokenCookieName, domain)
	refreshCookie := clearCookie(refreshTokenCookieName, domain)

	return []string{idCookie.String(), accessCookie.String(), refreshCookie.String()}
}

func ParseRefreshToken(cookies []string) (string, error) {
	for _, c := range cookies {
		parts := strings.SplitN(c, "=", 2)
		if len(parts) == 2 && strings.TrimSpace(parts[0]) == refreshTokenCookieName {
			return parts[1], nil
		}
	}
	return "", fmt.Errorf("refresh token cookie not found")
}

func createCookie(name, value, domain string, duration time.Duration) *http.Cookie {
	return &http.Cookie{
		Name:     name,
		Value:    value,
		Expires:  time.Now().Add(duration),
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteLaxMode,
		Path:     "/",
		Domain:   domain,
	}
}

func clearCookie(name, domain string) *http.Cookie {
	return &http.Cookie{
		Name:     name,
		Value:    "",
		Expires:  time.Unix(0, 0), // Expire immediately
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteLaxMode,
		Path:     "/",
		Domain:   domain,
	}
}