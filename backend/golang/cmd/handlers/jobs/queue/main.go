package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/sqs"
	apitypes "github.com/listbackup/api/internal/types"
)

type QueueJobHandler struct {
	sqsClient *sqs.SQS
	queueURLs map[string]string
}

func NewQueueJobHandler() (*QueueJobHandler, error) {
	// Get region from environment or default to us-west-2
	region := os.Getenv("AWS_REGION")
	if region == "" {
		region = "us-west-2"
	}

	// Create AWS session
	sess, err := session.NewSession(&aws.Config{
		Region: aws.String(region),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create AWS session: %v", err)
	}

	queueURLs := map[string]string{
		"sync":        os.Getenv("SYNC_QUEUE_URL"),
		"backup":      os.Getenv("BACKUP_QUEUE_URL"),
		"export":      os.Getenv("EXPORT_QUEUE_URL"),
		"analytics":   os.Getenv("ANALYTICS_QUEUE_URL"),
		"maintenance": os.Getenv("MAINTENANCE_QUEUE_URL"),
		"alert":       os.Getenv("ALERT_QUEUE_URL"),
	}

	return &QueueJobHandler{
		sqsClient: sqs.New(sess),
		queueURLs: queueURLs,
	}, nil
}

func (h *QueueJobHandler) Handle(ctx context.Context, event events.DynamoDBEvent) error {
	log.Printf("Processing %d DynamoDB stream records", len(event.Records))

	for _, record := range event.Records {
		log.Printf("Processing record: EventName=%s, SourceARN=%s", record.EventName, record.EventSourceArn)

		switch record.EventName {
		case "INSERT":
			// New job created - queue it for processing
			job, err := h.extractJobFromNewImage(record)
			if err != nil {
				log.Printf("Failed to extract job from INSERT record: %v", err)
				continue
			}

			err = h.routeJobToQueue(ctx, job)
			if err != nil {
				log.Printf("Failed to route new job %s to queue: %v", job.JobID, err)
				continue
			}

			log.Printf("Successfully queued new job %s (type: %s, priority: %s)", job.JobID, job.Type, job.Priority)

		case "MODIFY":
			// Job status changed - handle state transitions
			oldJob, newJob, err := h.extractJobFromModifyRecord(record)
			if err != nil {
				log.Printf("Failed to extract jobs from MODIFY record: %v", err)
				continue
			}

			err = h.handleJobStatusChange(ctx, oldJob, newJob)
			if err != nil {
				log.Printf("Failed to handle job status change for %s: %v", newJob.JobID, err)
				continue
			}

			log.Printf("Handled job status change %s: %s → %s", newJob.JobID, oldJob.Status, newJob.Status)

		case "REMOVE":
			// Job deleted - cleanup related resources
			job, err := h.extractJobFromOldImage(record)
			if err != nil {
				log.Printf("Failed to extract job from REMOVE record: %v", err)
				continue
			}

			err = h.handleJobDeletion(ctx, job)
			if err != nil {
				log.Printf("Failed to handle job deletion for %s: %v", job.JobID, err)
				continue
			}

			log.Printf("Handled job deletion %s", job.JobID)
		}
	}

	return nil
}

// extractJobFromNewImage extracts job from NewImage (for INSERT and MODIFY)
func (h *QueueJobHandler) extractJobFromNewImage(record events.DynamoDBEventRecord) (*apitypes.Job, error) {
	if record.Change.NewImage == nil {
		return nil, fmt.Errorf("no new image in DynamoDB record")
	}
	return h.extractJobFromImage(record.Change.NewImage)
}

// extractJobFromOldImage extracts job from OldImage (for REMOVE and MODIFY)
func (h *QueueJobHandler) extractJobFromOldImage(record events.DynamoDBEventRecord) (*apitypes.Job, error) {
	if record.Change.OldImage == nil {
		return nil, fmt.Errorf("no old image in DynamoDB record")
	}
	return h.extractJobFromImage(record.Change.OldImage)
}

// extractJobFromModifyRecord extracts both old and new job states from MODIFY event
func (h *QueueJobHandler) extractJobFromModifyRecord(record events.DynamoDBEventRecord) (*apitypes.Job, *apitypes.Job, error) {
	if record.Change.OldImage == nil || record.Change.NewImage == nil {
		return nil, nil, fmt.Errorf("missing old or new image in MODIFY record")
	}

	oldJob, err := h.extractJobFromImage(record.Change.OldImage)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to extract old job: %v", err)
	}

	newJob, err := h.extractJobFromImage(record.Change.NewImage)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to extract new job: %v", err)
	}

	return oldJob, newJob, nil
}

// extractJobFromImage extracts job from DynamoDB attribute map
func (h *QueueJobHandler) extractJobFromImage(image map[string]events.DynamoDBAttributeValue) (*apitypes.Job, error) {
	job := &apitypes.Job{}

	// Extract essential fields for job routing
	// DynamoDB stream records use String() method for string attributes
	if attr, ok := image["jobId"]; ok && attr.DataType() == events.DataTypeString {
		job.JobID = attr.String()
	}
	if attr, ok := image["accountId"]; ok && attr.DataType() == events.DataTypeString {
		job.AccountID = attr.String()
	}
	if attr, ok := image["userId"]; ok && attr.DataType() == events.DataTypeString {
		job.UserID = attr.String()
	}
	if attr, ok := image["sourceId"]; ok && attr.DataType() == events.DataTypeString {
		job.SourceID = attr.String()
	}
	if attr, ok := image["type"]; ok && attr.DataType() == events.DataTypeString {
		job.Type = attr.String()
	}
	if attr, ok := image["subType"]; ok && attr.DataType() == events.DataTypeString {
		job.SubType = attr.String()
	}
	if attr, ok := image["priority"]; ok && attr.DataType() == events.DataTypeString {
		job.Priority = attr.String()
	}
	if attr, ok := image["status"]; ok && attr.DataType() == events.DataTypeString {
		job.Status = attr.String()
	}

	if job.JobID == "" || job.Type == "" {
		return nil, fmt.Errorf("missing required job fields: jobId=%s, type=%s", job.JobID, job.Type)
	}

	return job, nil
}

func (h *QueueJobHandler) routeJobToQueue(ctx context.Context, job *apitypes.Job) error {
	// Get queue URL for job type
	queueURL, exists := h.queueURLs[job.Type]
	if !exists {
		return fmt.Errorf("no queue configured for job type: %s", job.Type)
	}

	if queueURL == "" {
		return fmt.Errorf("queue URL not configured for job type: %s", job.Type)
	}

	// Create message body
	messageBody, err := json.Marshal(job)
	if err != nil {
		return fmt.Errorf("failed to marshal job: %v", err)
	}

	// Create message group ID for FIFO ordering
	// Use sourceId so all jobs for the same source are processed in order
	messageGroupID := job.SourceID
	if messageGroupID == "" {
		messageGroupID = job.AccountID // Fallback to accountId
	}

	// Create deduplication ID to prevent duplicate messages
	// Use jobId for unique identification
	deduplicationID := job.JobID

	// Send message to appropriate queue
	input := &sqs.SendMessageInput{
		QueueUrl:               aws.String(queueURL),
		MessageBody:            aws.String(string(messageBody)),
		MessageGroupId:         aws.String(messageGroupID),
		MessageDeduplicationId: aws.String(deduplicationID),
		MessageAttributes: map[string]*sqs.MessageAttributeValue{
			"JobType": {
				DataType:    aws.String("String"),
				StringValue: aws.String(job.Type),
			},
			"Priority": {
				DataType:    aws.String("String"),
				StringValue: aws.String(job.Priority),
			},
			"SourceId": {
				DataType:    aws.String("String"),
				StringValue: aws.String(job.SourceID),
			},
			"AccountId": {
				DataType:    aws.String("String"),
				StringValue: aws.String(job.AccountID),
			},
		},
	}

	// Add SubType if present
	if job.SubType != "" {
		input.MessageAttributes["SubType"] = &sqs.MessageAttributeValue{
			DataType:    aws.String("String"),
			StringValue: aws.String(job.SubType),
		}
	}

	_, err = h.sqsClient.SendMessage(input)
	if err != nil {
		return fmt.Errorf("failed to send message to queue %s: %v", queueURL, err)
	}

	log.Printf("Sent job %s to %s queue (group: %s)", job.JobID, job.Type, messageGroupID)
	return nil
}

// handleJobStatusChange processes job status transitions (MODIFY events)
func (h *QueueJobHandler) handleJobStatusChange(ctx context.Context, oldJob, newJob *apitypes.Job) error {
	// Handle specific status transitions
	switch {
	case oldJob.Status == "pending" && newJob.Status == "running":
		log.Printf("Job %s started processing", newJob.JobID)
		// Could send notifications, update metrics, etc.

	case oldJob.Status == "running" && newJob.Status == "completed":
		log.Printf("Job %s completed successfully", newJob.JobID)
		// Could trigger follow-up jobs, send success notifications

	case oldJob.Status == "running" && newJob.Status == "failed":
		log.Printf("Job %s failed - considering retry", newJob.JobID)
		// Could implement retry logic by re-queuing the job
		return h.handleJobRetry(ctx, newJob)

	case newJob.Status == "cancelled":
		log.Printf("Job %s was cancelled", newJob.JobID)
		// Could cleanup resources, send cancellation notifications

	default:
		log.Printf("Job %s status change: %s → %s (no special handling)", 
			newJob.JobID, oldJob.Status, newJob.Status)
	}

	return nil
}

// handleJobRetry implements retry logic for failed jobs
func (h *QueueJobHandler) handleJobRetry(ctx context.Context, failedJob *apitypes.Job) error {
	// Check if job should be retried (could be based on retry count, error type, etc.)
	maxRetries := 3
	currentRetries := 0 // This would come from job metadata
	
	if currentRetries < maxRetries {
		log.Printf("Retrying failed job %s (attempt %d/%d)", failedJob.JobID, currentRetries+1, maxRetries)
		
		// Re-queue the job for retry
		return h.routeJobToQueue(ctx, failedJob)
	}
	
	log.Printf("Job %s exceeded max retries (%d), moving to dead letter", failedJob.JobID, maxRetries)
	// Could move to dead letter queue or mark as permanently failed
	return nil
}

// handleJobDeletion cleans up resources when a job is deleted (REMOVE events)
func (h *QueueJobHandler) handleJobDeletion(ctx context.Context, deletedJob *apitypes.Job) error {
	log.Printf("Cleaning up resources for deleted job %s", deletedJob.JobID)
	
	// Could cleanup:
	// - Remove pending messages from queues
	// - Delete associated files/data
	// - Send cleanup notifications
	// - Update metrics
	
	return nil
}

func main() {
	handler, err := NewQueueJobHandler()
	if err != nil {
		log.Fatalf("Failed to create queue job handler: %v", err)
	}

	lambda.Start(handler.Handle)
}