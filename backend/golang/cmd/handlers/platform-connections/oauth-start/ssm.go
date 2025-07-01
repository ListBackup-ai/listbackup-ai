package main

import (
	"fmt"
	"os"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/ssm"
)

// getOAuthCredentialsFromSSM retrieves OAuth client credentials from SSM Parameter Store
func getOAuthCredentialsFromSSM(platformID string) (clientID, clientSecret string, err error) {
	sess := session.Must(session.NewSession())
	svc := ssm.New(sess)
	
	stage := os.Getenv("STAGE")
	if stage == "" {
		stage = "dev"
	}
	
	// Extract platform name from platformID (e.g., "platform:google" -> "google")
	platformName := platformID
	if len(platformID) > 9 && platformID[:9] == "platform:" {
		platformName = platformID[9:]
	}
	
	// Construct SSM parameter names
	clientIDParam := fmt.Sprintf("/listbackup/%s/platforms/%s/oauth/client-id", stage, platformName)
	clientSecretParam := fmt.Sprintf("/listbackup/%s/platforms/%s/oauth/client-secret", stage, platformName)
	
	// Get client ID
	clientIDResult, err := svc.GetParameter(&ssm.GetParameterInput{
		Name:           aws.String(clientIDParam),
		WithDecryption: aws.Bool(true),
	})
	if err != nil {
		return "", "", fmt.Errorf("failed to get client ID from SSM: %w", err)
	}
	clientID = *clientIDResult.Parameter.Value
	
	// Get client secret
	clientSecretResult, err := svc.GetParameter(&ssm.GetParameterInput{
		Name:           aws.String(clientSecretParam),
		WithDecryption: aws.Bool(true),
	})
	if err != nil {
		return "", "", fmt.Errorf("failed to get client secret from SSM: %w", err)
	}
	clientSecret = *clientSecretResult.Parameter.Value
	
	return clientID, clientSecret, nil
}

// Enhanced platform struct with SSM references
type PlatformWithSSM struct {
	Platform
	OAuth *OAuthConfigurationWithSSM `json:"oauth,omitempty" dynamodbav:"oauth"`
}

type OAuthConfigurationWithSSM struct {
	ClientID       string   `json:"clientId,omitempty" dynamodbav:"clientId"`          // Deprecated - use SSM
	ClientSecret   string   `json:"clientSecret,omitempty" dynamodbav:"clientSecret"`  // Deprecated - use SSM
	ClientIDRef    string   `json:"clientIdRef,omitempty" dynamodbav:"clientIdRef"`    // SSM parameter path
	ClientSecretRef string  `json:"clientSecretRef,omitempty" dynamodbav:"clientSecretRef"` // SSM parameter path
	AuthURL        string   `json:"authUrl" dynamodbav:"authUrl"`
	TokenURL       string   `json:"tokenUrl" dynamodbav:"tokenUrl"`
	Scopes         []string `json:"scopes" dynamodbav:"scopes"`
	ResponseType   string   `json:"responseType" dynamodbav:"responseType"`
}