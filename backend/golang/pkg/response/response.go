package response

import (
	"encoding/json"

	"github.com/aws/aws-lambda-go/events"
	"github.com/listbackup/api/internal/types"
)

const (
	StatusOK                  = 200
	StatusCreated             = 201
	StatusBadRequest          = 400
	StatusUnauthorized        = 401
	StatusForbidden           = 403
	StatusNotFound            = 404
	StatusInternalServerError = 500
)

func GetCORSHeaders() map[string]string {
	return map[string]string{
		"Content-Type":                     "application/json",
		"Access-Control-Allow-Origin":      "*",
		"Access-Control-Allow-Methods":     "GET, POST, PUT, DELETE, OPTIONS",
		"Access-Control-Allow-Headers":     "Content-Type, Authorization, X-Requested-With",
		"Access-Control-Allow-Credentials": "true",
	}
}

func Success(data interface{}) events.APIGatewayProxyResponse {
	response := types.APIResponse{
		Success: true,
		Data:    data,
	}

	body, _ := json.Marshal(response)
	return events.APIGatewayProxyResponse{
		StatusCode: StatusOK,
		Headers:    GetCORSHeaders(),
		Body:       string(body),
	}
}

func Created(data interface{}) events.APIGatewayProxyResponse {
	response := types.APIResponse{
		Success: true,
		Data:    data,
	}

	body, _ := json.Marshal(response)
	return events.APIGatewayProxyResponse{
		StatusCode: StatusCreated,
		Headers:    GetCORSHeaders(),
		Body:       string(body),
	}
}

func Error(statusCode int, message string) events.APIGatewayProxyResponse {
	response := types.APIResponse{
		Success: false,
		Error:   message,
	}

	body, _ := json.Marshal(response)
	return events.APIGatewayProxyResponse{
		StatusCode: statusCode,
		Headers:    GetCORSHeaders(),
		Body:       string(body),
	}
}

func BadRequest(message string) events.APIGatewayProxyResponse {
	return Error(StatusBadRequest, message)
}

func Unauthorized(message string) events.APIGatewayProxyResponse {
	return Error(StatusUnauthorized, message)
}

func Forbidden(message string) events.APIGatewayProxyResponse {
	return Error(StatusForbidden, message)
}

func NotFound(message string) events.APIGatewayProxyResponse {
	return Error(StatusNotFound, message)
}

func InternalServerError(message string) events.APIGatewayProxyResponse {
	return Error(StatusInternalServerError, message)
}

func MFARequired(session string) events.APIGatewayProxyResponse {
	response := types.APIResponse{
		Success: false,
		Message: "MFA code required",
		Data: map[string]interface{}{
			"requiresMfa": true,
			"session":     session,
		},
	}

	body, _ := json.Marshal(response)
	return events.APIGatewayProxyResponse{
		StatusCode: StatusOK,
		Headers:    GetCORSHeaders(),
		Body:       string(body),
	}
}

func Options() events.APIGatewayProxyResponse {
	return events.APIGatewayProxyResponse{
		StatusCode: StatusOK,
		Headers:    GetCORSHeaders(),
		Body:       "",
	}
}

// CORS handles CORS preflight requests
func CORS() events.APIGatewayProxyResponse {
	return Options()
}

// SuccessWithCORS returns a success response with CORS headers
func SuccessWithCORS(data interface{}) events.APIGatewayProxyResponse {
	return Success(data)
}