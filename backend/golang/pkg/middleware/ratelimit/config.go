package ratelimit

import (
	"os"
	"strconv"
	"time"
)

// DefaultConfig returns the default rate limiting configuration
func DefaultConfig() *Config {
	config := &Config{
		TableName:           getEnv("RATE_LIMIT_TABLE_NAME", "listbackup-rate-limits"),
		DefaultLimit:        getEnvInt("RATE_LIMIT_DEFAULT_LIMIT", 100),
		DefaultWindow:       getEnvDuration("RATE_LIMIT_DEFAULT_WINDOW", 1*time.Minute),
		PerIPLimit:          getEnvInt("RATE_LIMIT_PER_IP_LIMIT", 1000),
		PerIPWindow:         getEnvDuration("RATE_LIMIT_PER_IP_WINDOW", 1*time.Hour),
		PerUserLimit:        getEnvInt("RATE_LIMIT_PER_USER_LIMIT", 5000),
		PerUserWindow:       getEnvDuration("RATE_LIMIT_PER_USER_WINDOW", 1*time.Hour),
		LoginAttemptLimit:   getEnvInt("RATE_LIMIT_LOGIN_ATTEMPTS", 5),
		LoginAttemptWindow:  getEnvDuration("RATE_LIMIT_LOGIN_WINDOW", 15*time.Minute),
		PasswordResetLimit:  getEnvInt("RATE_LIMIT_PASSWORD_RESET_ATTEMPTS", 3),
		PasswordResetWindow: getEnvDuration("RATE_LIMIT_PASSWORD_RESET_WINDOW", 1*time.Hour),
		RegistrationLimit:   getEnvInt("RATE_LIMIT_REGISTRATION_ATTEMPTS", 3),
		RegistrationWindow:  getEnvDuration("RATE_LIMIT_REGISTRATION_WINDOW", 24*time.Hour),
	}
	
	return config
}

// EndpointConfig holds rate limiting configuration for a specific endpoint
type EndpointConfig struct {
	Path   string
	Limit  int
	Window time.Duration
}

// GetEndpointConfigs returns rate limiting configurations for all endpoints
func GetEndpointConfigs() []EndpointConfig {
	return []EndpointConfig{
		// Auth endpoints
		{Path: "/auth/login", Limit: 5, Window: 15 * time.Minute},
		{Path: "/auth/register", Limit: 3, Window: 24 * time.Hour},
		{Path: "/auth/password-reset-request", Limit: 3, Window: 1 * time.Hour},
		{Path: "/auth/password-reset-confirm", Limit: 5, Window: 1 * time.Hour},
		{Path: "/auth/verify-account", Limit: 10, Window: 1 * time.Hour},
		{Path: "/auth/mfa-verify", Limit: 5, Window: 15 * time.Minute},
		{Path: "/auth/refresh", Limit: 10, Window: 1 * time.Minute},
		
		// User endpoints
		{Path: "/users/profile", Limit: 100, Window: 1 * time.Minute},
		{Path: "/users/settings", Limit: 50, Window: 1 * time.Minute},
		
		// Account endpoints
		{Path: "/accounts/create", Limit: 10, Window: 1 * time.Hour},
		{Path: "/accounts/list", Limit: 100, Window: 1 * time.Minute},
		
		// Default for other endpoints
		{Path: "/", Limit: 100, Window: 1 * time.Minute},
	}
}

// Helper functions

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return defaultValue
}

func getEnvDuration(key string, defaultValue time.Duration) time.Duration {
	if value := os.Getenv(key); value != "" {
		if duration, err := time.ParseDuration(value); err == nil {
			return duration
		}
	}
	return defaultValue
}