# Backend Refactoring Plan

This document outlines the step-by-step plan to refactor the ListBackup.ai Golang backend into a more robust, decoupled, and maintainable architecture using the Serverless Framework and `serverless-compose`.

**Last Updated**: `{{TIMESTAMP}}`
**Status**: `Not Started`

---

## **Guiding Principles**

1.  **Infrastructure as Code (IaC)**: All AWS resources will be defined in code.
2.  **Isolate Stateful Infrastructure**: Separate stateless application logic from stateful resources (databases, user pools, storage) to prevent accidental data loss.
3.  **Decouple with SSM**: Use AWS Systems Manager (SSM) Parameter Store to share resource identifiers between stacks, avoiding rigid CloudFormation dependencies.
4.  **Centralized API Gateway & Domain**: Use a single, central API Gateway with a consistent `stage.api.listbackup.ai` domain structure.
5.  **Least Privilege**: Ensure all IAM roles are scoped down to the minimum required permissions.
6.  **Preserve Existing Data**: Import and manage existing resources like the Cognito User Pool without disrupting them.

---

## **Phase 0: Investigation and Planning**

- [x] **TODO 0.1: Create Planning Document**: Create this `REFACTOR_PLAN.md` file.
- [!] **TODO 0.2: Investigate Existing Cognito Resources (Aborted)**:
    - [ ] List Cognito User Pools in `us-west-2`.
    - [ ] Identify the primary user pool.
    - [ ] Document the user pool's configuration.
    - [ ] List and document all User Groups within the pool.
- [!] **TODO 0.3: Update Plan with Findings (Aborted)**: Add discovered Cognito configuration details to this document.

> **Note**: After multiple attempts, no existing, usable Cognito User Pool could be found. The referenced CloudFormation stack was deleted, and an ID found in documentation was invalid. **The plan is now to create a new, clean Cognito User Pool** as part of the `infra/cognito` stack.

---

## **Phase 1: Project Restructuring**

- [x] **TODO 1.1:** Create new directory structure: `infra` and `services`.
- [x] **TODO 1.2:** Move all existing `serverless-*.yml` files into the `services` directory.

---

## **Phase 2: Isolate Stateful Infrastructure Stacks**

- [x] **TODO 2.1:** Create `infra/domains/serverless.yml` for the wildcard SSL certificate.
- [x] **TODO 2.2:** Create `infra/cognito/serverless.yml` to manage the new User Pool.
- [x] **TODO 2.3:** Create `infra/dynamodb/serverless.yml` to define all DynamoDB tables.
- [x] **TODO 2.4:** Create `infra/s3/serverless.yml` for all S3 buckets.
- [ ] **TODO 2.5:** Deploy all `infra` stacks and verify that resource details are in SSM.

---

## **Phase 3: Refactor Services**

- [ ] **TODO 3.1: Centralize API Gateway**:
    - [ ] Create `services/api-gateway/serverless.yml`.
    - [ ] Configure `serverless-domain-manager` to create `stage.api.listbackup.ai` endpoints.
    - [ ] Deploy the API Gateway stack.
- [ ] **TODO 3.2: Refactor Application Services**:
    - For each service file (`accounts`, `auth`, `clients`, etc.):
        - [ ] **TODO 3.2.1:** Add and configure the `serverless-go-plugin` to automatically build and package Go binaries.
        - [ ] **TODO 3.2.2:** Remove all `resources` definitions.
        - [ ] **TODO 3.2.3:** Replace `${cf:...}` dependencies with `${ssm:...}` parameters.
        - [ ] **TODO 3.2.4:** Refactor IAM roles to be specific and adhere to least-privilege.
        - [ ] **TODO 3.2.5:** Ensure functions attach correctly to the central API Gateway.

---

## **Phase 4: Orchestrate Deployment**

- [ ] **TODO 4.1:** Create `serverless-compose.yml`.
- [ ] **TODO 4.2:** Define the deployment order and dependencies for all `infra` and `services` stacks.
- [ ] **TODO 4.3:** Perform a full deployment of the entire backend using a single `serverless compose deploy` command.

---

## **Discovered AWS Resources**

*(This section will be populated during Phase 0)*

### **Cognito User Pool**
- **ID**: `TBD`
- **Name**: `TBD`
- **Configuration**:
    - `TBD`

### **Cognito User Groups**
- **Group 1**: `TBD`
- **Group 2**: `TBD` 