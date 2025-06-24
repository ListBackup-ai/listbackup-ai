package services

import (
	"strings"
)

// Protected domains that cannot be registered by users
var protectedDomains = []string{
	"listbackup.ai",
	"listbackup.com",
	"listbackup.io",
	"listbackup-domains.com",
	"api.listbackup.ai",
	"app.listbackup.ai",
	"dashboard.listbackup.ai",
	"portal.listbackup.ai",
	"admin.listbackup.ai",
	"auth.listbackup.ai",
	"cdn.listbackup.ai",
	"static.listbackup.ai",
	"assets.listbackup.ai",
	"mx1.listbackup.ai",
	"mx2.listbackup.ai",
	"ns1.listbackup.ai",
	"ns2.listbackup.ai",
	"ns3.listbackup.ai",
	"ns4.listbackup.ai",
}

// Protected domain patterns
var protectedPatterns = []string{
	".listbackup.ai",
	".listbackup.com",
	".listbackup.io",
	".amazonaws.com",
	".cloudfront.net",
	".google.com",
	".microsoft.com",
	".apple.com",
}

// IsProtectedDomain checks if a domain is protected from user registration
func IsProtectedDomain(domain string) bool {
	domain = strings.ToLower(strings.TrimSpace(domain))
	
	// Check exact matches
	for _, protected := range protectedDomains {
		if domain == protected {
			return true
		}
	}
	
	// Check patterns
	for _, pattern := range protectedPatterns {
		if strings.HasSuffix(domain, pattern) {
			return true
		}
	}
	
	// Check if it's a subdomain of protected domains
	for _, protected := range protectedDomains {
		if strings.HasSuffix(domain, "."+protected) {
			return true
		}
	}
	
	return false
}

// IsReservedDomain checks for commonly reserved or special domains
func IsReservedDomain(domain string) bool {
	reserved := []string{
		"localhost",
		"local",
		"test",
		"example.com",
		"example.org",
		"example.net",
		"invalid",
		"localhost.localdomain",
	}
	
	domain = strings.ToLower(strings.TrimSpace(domain))
	
	for _, r := range reserved {
		if domain == r || strings.HasSuffix(domain, "."+r) {
			return true
		}
	}
	
	// Check for IP addresses
	if IsIPAddress(domain) {
		return true
	}
	
	return false
}

// IsIPAddress checks if the domain is an IP address
func IsIPAddress(domain string) bool {
	parts := strings.Split(domain, ".")
	if len(parts) != 4 {
		return false
	}
	
	for _, part := range parts {
		if len(part) == 0 || len(part) > 3 {
			return false
		}
		for _, ch := range part {
			if ch < '0' || ch > '9' {
				return false
			}
		}
	}
	
	return true
}

// SanitizeDomain cleans and validates a domain name
func SanitizeDomain(domain string) string {
	// Remove protocol if present
	domain = strings.TrimPrefix(domain, "http://")
	domain = strings.TrimPrefix(domain, "https://")
	
	// Remove trailing slash
	domain = strings.TrimSuffix(domain, "/")
	
	// Remove path if present
	if idx := strings.Index(domain, "/"); idx != -1 {
		domain = domain[:idx]
	}
	
	// Remove port if present
	if idx := strings.Index(domain, ":"); idx != -1 {
		domain = domain[:idx]
	}
	
	// Convert to lowercase
	domain = strings.ToLower(domain)
	
	// Trim whitespace
	domain = strings.TrimSpace(domain)
	
	return domain
}