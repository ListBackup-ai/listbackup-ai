#!/bin/bash

# Script to seed platforms data
echo "Seeding platforms data..."

# Change to the directory containing the seed script
cd /Users/nickkulavic/Projects/listbackup.ai/listbackup-ai-v2/backend/golang/scripts

# Run the seed script
go run seed-platforms.go -stage main -profile listbackup.ai

echo "Seeding complete!"