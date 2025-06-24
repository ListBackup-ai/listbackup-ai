# Platforms Service Testing Instructions

## Deployment Status

The platforms service has been successfully deployed to AWS with the following endpoints:

- `GET /platforms` - List all available platforms
- `GET /platforms/{id}` - Get specific platform details
- `GET /platforms/{platformId}/sources` - List data sources for a platform
- `GET /platforms/{platformId}/sources/{platformSourceId}` - Get specific platform source details
- `GET /platforms/{platformId}/connections` - List connections for a platform
- `POST /platforms/{platformId}/connections` - Create a new platform connection

Base URL: `https://b554ytt8w9.execute-api.us-west-2.amazonaws.com`

## Testing the Endpoints

### 1. Get an Authentication Token

First, you need to login to get an auth token:

```bash
./get-token.sh your-email@example.com your-password
```

This will output an auth token that you'll use for testing.

### 2. Run the Test Suite

Once you have the token, run the comprehensive test suite:

```bash
./test-platforms.sh "your-auth-token-here"
```

You can also specify a platform ID and source ID:

```bash
./test-platforms.sh "your-auth-token-here" "stripe" "customers"
```

### 3. Manual Testing with curl

You can also test individual endpoints manually:

```bash
# List all platforms
curl -X GET \
  -H "Authorization: Bearer your-auth-token" \
  https://b554ytt8w9.execute-api.us-west-2.amazonaws.com/platforms

# Get specific platform
curl -X GET \
  -H "Authorization: Bearer your-auth-token" \
  https://b554ytt8w9.execute-api.us-west-2.amazonaws.com/platforms/keap

# List platform sources
curl -X GET \
  -H "Authorization: Bearer your-auth-token" \
  https://b554ytt8w9.execute-api.us-west-2.amazonaws.com/platforms/keap/sources
```

## Build and Deploy Commands

To rebuild and redeploy the service:

```bash
# Build all handlers
./build.sh

# Deploy to AWS
sls deploy --config serverless.yml --aws-profile listbackup.ai --stage main --force
```

## Troubleshooting

1. **Unauthorized errors**: Your token may have expired. Get a new one using `get-token.sh`
2. **Function errors**: Check CloudWatch logs for the specific function
3. **Deployment issues**: Make sure all infrastructure services are deployed first

## Handler Locations

- `/cmd/handlers/platforms/list/` - List platforms handler
- `/cmd/handlers/platforms/get/` - Get platform details handler
- `/cmd/handlers/api/platform-sources-list/` - List platform sources handler
- `/cmd/handlers/api/platform-sources-get/` - Get platform source handler
- `/cmd/handlers/api/platform-connections-list/` - List connections handler
- `/cmd/handlers/api/platform-connections-create/` - Create connection handler