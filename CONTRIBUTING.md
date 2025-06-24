# Contributing to ListBackup.ai

First off, thank you for considering contributing to ListBackup.ai! It's people like you that make ListBackup.ai such a great tool.

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

* Use a clear and descriptive title
* Describe the exact steps which reproduce the problem
* Provide specific examples to demonstrate the steps
* Describe the behavior you observed after following the steps
* Explain which behavior you expected to see instead and why
* Include screenshots if possible

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

* Use a clear and descriptive title
* Provide a step-by-step description of the suggested enhancement
* Provide specific examples to demonstrate the steps
* Describe the current behavior and explain which behavior you expected to see instead
* Explain why this enhancement would be useful

### Pull Requests

1. Fork the repo and create your branch from `develop`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes.
5. Make sure your code lints.
6. Issue that pull request!

## Development Process

We use GitHub flow, so all code changes happen through pull requests:

1. Fork the repo and create your branch from `develop`
2. Make your changes
3. Write or adapt tests as needed
4. Update documentation
5. Create a pull request to `develop`

## Development Setup

### Prerequisites

- Node.js 20.x or higher
- Go 1.21 or higher
- AWS CLI configured with appropriate credentials
- Serverless Framework 3.x

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/ListBackup-ai/listbackup-ai.git
cd listbackup-ai
```

2. Install frontend dependencies:
```bash
cd platforms/web
npm install
```

3. Install backend dependencies:
```bash
cd backend/golang
go mod download
```

4. Set up environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

5. Run the development server:
```bash
cd platforms/web
npm run dev
```

## Coding Standards

### TypeScript/JavaScript

- Use TypeScript for all new code
- Follow the existing code style
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Keep functions small and focused

### Go

- Follow standard Go conventions
- Use `gofmt` to format your code
- Add comments to exported functions
- Handle errors appropriately
- Write tests for new functionality

### Commit Messages

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests liberally after the first line

Example:
```
Add user authentication to API endpoints

- Implement JWT token generation and validation
- Add middleware for protected routes
- Update API documentation

Fixes #123
```

## Testing

- Write tests for all new functionality
- Ensure all tests pass before submitting PR
- Include both unit and integration tests where appropriate
- Aim for high test coverage

### Running Tests

Frontend:
```bash
cd platforms/web
npm test
```

Backend:
```bash
cd backend/golang
go test ./...
```

## Documentation

- Update README.md if you change functionality
- Update API documentation for endpoint changes
- Add JSDoc/GoDoc comments for new functions
- Include examples where helpful

## Questions?

Feel free to open an issue with your question or reach out to the maintainers.

Thank you for contributing!