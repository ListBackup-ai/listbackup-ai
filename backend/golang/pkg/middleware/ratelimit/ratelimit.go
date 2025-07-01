package ratelimit

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
)

// RateLimiter interface defines the rate limiting contract
type RateLimiter interface {
	Allow(ctx context.Context, key string) (bool, error)
	AllowWithLimit(ctx context.Context, key string, limit int, window time.Duration) (bool, error)
	GetRemainingRequests(ctx context.Context, key string) (int, error)
	Reset(ctx context.Context, key string) error
}

// Config holds rate limiter configuration
type Config struct {
	TableName           string
	DefaultLimit        int
	DefaultWindow       time.Duration
	PerIPLimit          int
	PerIPWindow         time.Duration
	PerUserLimit        int
	PerUserWindow       time.Duration
	LoginAttemptLimit   int
	LoginAttemptWindow  time.Duration
	PasswordResetLimit  int
	PasswordResetWindow time.Duration
	RegistrationLimit   int
	RegistrationWindow  time.Duration
}

// DynamoDBRateLimiter implements distributed rate limiting using DynamoDB
type DynamoDBRateLimiter struct {
	db     *dynamodb.DynamoDB
	config *Config
	mu     sync.RWMutex
}

// RateLimitEntry represents a rate limit entry in DynamoDB
type RateLimitEntry struct {
	Key         string    `json:"key"`
	Count       int       `json:"count"`
	WindowStart time.Time `json:"window_start"`
	TTL         int64     `json:"ttl"`
}

// NewDynamoDBRateLimiter creates a new DynamoDB-based rate limiter
func NewDynamoDBRateLimiter(sess *session.Session, config *Config) *DynamoDBRateLimiter {
	if config.DefaultLimit == 0 {
		config.DefaultLimit = 100
	}
	if config.DefaultWindow == 0 {
		config.DefaultWindow = 1 * time.Minute
	}
	if config.PerIPLimit == 0 {
		config.PerIPLimit = 1000
	}
	if config.PerIPWindow == 0 {
		config.PerIPWindow = 1 * time.Hour
	}
	if config.PerUserLimit == 0 {
		config.PerUserLimit = 5000
	}
	if config.PerUserWindow == 0 {
		config.PerUserWindow = 1 * time.Hour
	}
	if config.LoginAttemptLimit == 0 {
		config.LoginAttemptLimit = 5
	}
	if config.LoginAttemptWindow == 0 {
		config.LoginAttemptWindow = 15 * time.Minute
	}
	if config.PasswordResetLimit == 0 {
		config.PasswordResetLimit = 3
	}
	if config.PasswordResetWindow == 0 {
		config.PasswordResetWindow = 1 * time.Hour
	}
	if config.RegistrationLimit == 0 {
		config.RegistrationLimit = 3
	}
	if config.RegistrationWindow == 0 {
		config.RegistrationWindow = 24 * time.Hour
	}

	return &DynamoDBRateLimiter{
		db:     dynamodb.New(sess),
		config: config,
	}
}

// Allow checks if a request is allowed under the default rate limit
func (r *DynamoDBRateLimiter) Allow(ctx context.Context, key string) (bool, error) {
	return r.AllowWithLimit(ctx, key, r.config.DefaultLimit, r.config.DefaultWindow)
}

// AllowWithLimit checks if a request is allowed under a specific rate limit
func (r *DynamoDBRateLimiter) AllowWithLimit(ctx context.Context, key string, limit int, window time.Duration) (bool, error) {
	now := time.Now()
	windowStart := now.Truncate(window)
	ttl := windowStart.Add(window).Unix()

	// Try to increment the counter
	input := &dynamodb.UpdateItemInput{
		TableName: aws.String(r.config.TableName),
		Key: map[string]*dynamodb.AttributeValue{
			"key": {
				S: aws.String(key),
			},
		},
		UpdateExpression: aws.String("SET #count = if_not_exists(#count, :zero) + :one, window_start = :window_start, #ttl = :ttl"),
		ConditionExpression: aws.String("attribute_not_exists(#count) OR window_start = :window_start OR #count < :limit"),
		ExpressionAttributeNames: map[string]*string{
			"#count": aws.String("count"),
			"#ttl":   aws.String("ttl"),
		},
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":zero": {
				N: aws.String("0"),
			},
			":one": {
				N: aws.String("1"),
			},
			":window_start": {
				S: aws.String(windowStart.Format(time.RFC3339)),
			},
			":ttl": {
				N: aws.String(fmt.Sprintf("%d", ttl)),
			},
			":limit": {
				N: aws.String(fmt.Sprintf("%d", limit)),
			},
		},
		ReturnValues: aws.String("ALL_NEW"),
	}

	result, err := r.db.UpdateItemWithContext(ctx, input)
	if err != nil {
		if strings.Contains(err.Error(), "ConditionalCheckFailedException") {
			// Rate limit exceeded
			return false, nil
		}
		return false, fmt.Errorf("failed to update rate limit: %w", err)
	}

	// Check if we need to reset the window
	var entry RateLimitEntry
	if err := dynamodbattribute.UnmarshalMap(result.Attributes, &entry); err != nil {
		return false, fmt.Errorf("failed to unmarshal rate limit entry: %w", err)
	}

	// If the window has changed, reset the counter
	if entry.WindowStart.Before(windowStart) {
		resetInput := &dynamodb.UpdateItemInput{
			TableName: aws.String(r.config.TableName),
			Key: map[string]*dynamodb.AttributeValue{
				"key": {
					S: aws.String(key),
				},
			},
			UpdateExpression: aws.String("SET #count = :one, window_start = :window_start, #ttl = :ttl"),
			ExpressionAttributeNames: map[string]*string{
				"#count": aws.String("count"),
				"#ttl":   aws.String("ttl"),
			},
			ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
				":one": {
					N: aws.String("1"),
				},
				":window_start": {
					S: aws.String(windowStart.Format(time.RFC3339)),
				},
				":ttl": {
					N: aws.String(fmt.Sprintf("%d", ttl)),
				},
			},
		}

		_, err = r.db.UpdateItemWithContext(ctx, resetInput)
		if err != nil {
			return false, fmt.Errorf("failed to reset rate limit window: %w", err)
		}
		return true, nil
	}

	return entry.Count <= limit, nil
}

// GetRemainingRequests returns the number of remaining requests in the current window
func (r *DynamoDBRateLimiter) GetRemainingRequests(ctx context.Context, key string) (int, error) {
	input := &dynamodb.GetItemInput{
		TableName: aws.String(r.config.TableName),
		Key: map[string]*dynamodb.AttributeValue{
			"key": {
				S: aws.String(key),
			},
		},
	}

	result, err := r.db.GetItemWithContext(ctx, input)
	if err != nil {
		return 0, fmt.Errorf("failed to get rate limit entry: %w", err)
	}

	if result.Item == nil {
		return r.config.DefaultLimit, nil
	}

	var entry RateLimitEntry
	if err := dynamodbattribute.UnmarshalMap(result.Item, &entry); err != nil {
		return 0, fmt.Errorf("failed to unmarshal rate limit entry: %w", err)
	}

	// Check if window has expired
	now := time.Now()
	windowStart := now.Truncate(r.config.DefaultWindow)
	if entry.WindowStart.Before(windowStart) {
		return r.config.DefaultLimit, nil
	}

	remaining := r.config.DefaultLimit - entry.Count
	if remaining < 0 {
		remaining = 0
	}

	return remaining, nil
}

// Reset resets the rate limit for a given key
func (r *DynamoDBRateLimiter) Reset(ctx context.Context, key string) error {
	input := &dynamodb.DeleteItemInput{
		TableName: aws.String(r.config.TableName),
		Key: map[string]*dynamodb.AttributeValue{
			"key": {
				S: aws.String(key),
			},
		},
	}

	_, err := r.db.DeleteItemWithContext(ctx, input)
	if err != nil {
		return fmt.Errorf("failed to reset rate limit: %w", err)
	}

	return nil
}

// Middleware returns a Lambda middleware function that enforces rate limiting
func Middleware(limiter RateLimiter, keyExtractor func(events.APIGatewayProxyRequest) string) func(handler func(context.Context, events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error)) func(context.Context, events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	return func(handler func(context.Context, events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error)) func(context.Context, events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
		return func(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
			key := keyExtractor(request)
			if key == "" {
				// If we can't extract a key, allow the request
				return handler(ctx, request)
			}

			allowed, err := limiter.Allow(ctx, key)
			if err != nil {
				// Log error but allow request on error to avoid blocking legitimate traffic
				fmt.Printf("Rate limiter error: %v\n", err)
				return handler(ctx, request)
			}

			if !allowed {
				// Get remaining requests for header
				remaining, _ := limiter.GetRemainingRequests(ctx, key)
				
				response := map[string]interface{}{
					"error": "Rate limit exceeded",
					"message": "Too many requests. Please try again later.",
				}
				
				body, _ := json.Marshal(response)
				
				return events.APIGatewayProxyResponse{
					StatusCode: http.StatusTooManyRequests,
					Headers: map[string]string{
						"Content-Type":             "application/json",
						"X-RateLimit-Limit":        fmt.Sprintf("%d", getLimit(request.Path)),
						"X-RateLimit-Remaining":    fmt.Sprintf("%d", remaining),
						"X-RateLimit-Reset":        fmt.Sprintf("%d", time.Now().Add(getWindow(request.Path)).Unix()),
						"Retry-After":              fmt.Sprintf("%d", int(getWindow(request.Path).Seconds())),
					},
					Body: string(body),
				}, nil
			}

			// Add rate limit headers to successful responses
			response, err := handler(ctx, request)
			if response.Headers == nil {
				response.Headers = make(map[string]string)
			}
			
			remaining, _ := limiter.GetRemainingRequests(ctx, key)
			response.Headers["X-RateLimit-Limit"] = fmt.Sprintf("%d", getLimit(request.Path))
			response.Headers["X-RateLimit-Remaining"] = fmt.Sprintf("%d", remaining)
			response.Headers["X-RateLimit-Reset"] = fmt.Sprintf("%d", time.Now().Add(getWindow(request.Path)).Unix())
			
			return response, err
		}
	}
}

// Helper functions to determine limits and windows based on endpoint
func getLimit(path string) int {
	if strings.Contains(path, "/login") {
		return 5
	} else if strings.Contains(path, "/register") {
		return 3
	} else if strings.Contains(path, "/password-reset") {
		return 3
	}
	return 100
}

func getWindow(path string) time.Duration {
	if strings.Contains(path, "/login") {
		return 15 * time.Minute
	} else if strings.Contains(path, "/register") {
		return 24 * time.Hour
	} else if strings.Contains(path, "/password-reset") {
		return 1 * time.Hour
	}
	return 1 * time.Minute
}

// Key extractors for different rate limiting strategies

// ExtractIPKey extracts the client IP address for IP-based rate limiting
func ExtractIPKey(request events.APIGatewayProxyRequest) string {
	// Check X-Forwarded-For header first (for requests through load balancers)
	if xff := request.Headers["X-Forwarded-For"]; xff != "" {
		// Take the first IP in the chain
		ips := strings.Split(xff, ",")
		if len(ips) > 0 {
			return fmt.Sprintf("ip:%s:%s", strings.TrimSpace(ips[0]), request.Path)
		}
	}
	
	// Fall back to source IP
	if request.RequestContext.Identity.SourceIP != "" {
		return fmt.Sprintf("ip:%s:%s", request.RequestContext.Identity.SourceIP, request.Path)
	}
	
	return ""
}

// ExtractUserKey extracts the user ID for user-based rate limiting
func ExtractUserKey(request events.APIGatewayProxyRequest) string {
	// Extract from JWT claims in authorizer context
	if request.RequestContext.Authorizer != nil {
		if userID, ok := request.RequestContext.Authorizer["userID"].(string); ok && userID != "" {
			return fmt.Sprintf("user:%s:%s", userID, request.Path)
		}
	}
	
	return ""
}

// ExtractCompositeKey combines IP and user-based keys
func ExtractCompositeKey(request events.APIGatewayProxyRequest) string {
	// For authenticated requests, use user key
	if userKey := ExtractUserKey(request); userKey != "" {
		return userKey
	}
	
	// For unauthenticated requests, use IP key
	return ExtractIPKey(request)
}