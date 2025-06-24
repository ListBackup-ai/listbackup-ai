package services

import (
	"context"
	"encoding/json"
	"fmt"
	"log"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/secretsmanager"
)

// SecretsService handles AWS Secrets Manager operations
type SecretsService struct {
	client *secretsmanager.Client
}

// NewSecretsService creates a new secrets service
func NewSecretsService() (*SecretsService, error) {
	cfg, err := config.LoadDefaultConfig(context.TODO())
	if err != nil {
		return nil, fmt.Errorf("unable to load SDK config: %w", err)
	}

	return &SecretsService{
		client: secretsmanager.NewFromConfig(cfg),
	}, nil
}

// GetSecret retrieves a secret string from AWS Secrets Manager
func (s *SecretsService) GetSecret(ctx context.Context, secretName string) (string, error) {
	log.Printf("Retrieving secret: %s", secretName)

	input := &secretsmanager.GetSecretValueInput{
		SecretId: aws.String(secretName),
	}

	result, err := s.client.GetSecretValue(ctx, input)
	if err != nil {
		return "", fmt.Errorf("failed to retrieve secret %s: %w", secretName, err)
	}

	if result.SecretString != nil {
		return *result.SecretString, nil
	}

	return "", fmt.Errorf("secret %s has no string value", secretName)
}

// GetJSONSecret retrieves and unmarshals a JSON secret
func (s *SecretsService) GetJSONSecret(ctx context.Context, secretName string, target interface{}) error {
	secretString, err := s.GetSecret(ctx, secretName)
	if err != nil {
		return err
	}

	if err := json.Unmarshal([]byte(secretString), target); err != nil {
		return fmt.Errorf("failed to unmarshal secret %s: %w", secretName, err)
	}

	return nil
}

// StoreSecret stores a secret in AWS Secrets Manager
func (s *SecretsService) StoreSecret(ctx context.Context, secretName string, secretValue string) error {
	log.Printf("Storing secret: %s", secretName)

	// Try to update first
	updateInput := &secretsmanager.UpdateSecretInput{
		SecretId:     aws.String(secretName),
		SecretString: aws.String(secretValue),
	}

	_, err := s.client.UpdateSecret(ctx, updateInput)
	if err != nil {
		// If update fails, try to create
		createInput := &secretsmanager.CreateSecretInput{
			Name:         aws.String(secretName),
			SecretString: aws.String(secretValue),
		}

		_, createErr := s.client.CreateSecret(ctx, createInput)
		if createErr != nil {
			return fmt.Errorf("failed to store secret %s: %w", secretName, createErr)
		}
	}

	return nil
}

// StoreJSONSecret marshals and stores a JSON secret
func (s *SecretsService) StoreJSONSecret(ctx context.Context, secretName string, secretValue interface{}) error {
	jsonBytes, err := json.Marshal(secretValue)
	if err != nil {
		return fmt.Errorf("failed to marshal secret %s: %w", secretName, err)
	}

	return s.StoreSecret(ctx, secretName, string(jsonBytes))
}