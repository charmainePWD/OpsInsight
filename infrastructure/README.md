# OpsInsight Infrastructure

## Overview

This directory contains the Infrastructure as Code (IaC) implementation for OpsInsight.

The infrastructure is managed using **Terraform** and follows a subscription-driven deployment approach. Environment-specific configuration is maintained in JSON files, allowing deployment pipelines to select the target subscription, environment and resources without hardcoding configuration into individual Terraform files.

The structure is designed to support modular deployments, reusable Terraform components, centralised monitoring and automated CI/CD workflows.

## Directory Structure

```text
infrastructure/
│
├── subscriptions/
│   ├── dev.json
│   ├── test.json
│   └── prod.json
│
├── resources/
│   ├── resource-groups/
│   ├── networking/
│   ├── app-service/
│   ├── sql-database/
│   ├── key-vault/
│   └── application-insights/
│
├── monitoring/
│
├── modules/
│   ├── naming/
│   ├── diagnostics/
│   └── common-tags/
│
├── pipelines/
│   ├── build/
│   ├── deploy/
│   └── templates/
│
├── scripts/
│
└── README.md
```

## Architecture

### 1. Subscription Configuration

The `subscriptions/` directory contains JSON configuration files for each deployment environment.

Each configuration defines:

- Azure subscription and tenant information.
- Deployment environment.
- Azure region.
- Resource group configuration.
- Common resource tags.
- Resources enabled for deployment.

This approach allows the same Terraform resource definitions to be reused across development, testing and production environments.

Subscription IDs and tenant IDs are configuration references, not credentials. Secrets must never be stored in these files.

### 2. Resources

The `resources/` directory contains independently managed Terraform resource deployments.

Each resource has its own directory and Terraform configuration.

Standard Terraform files include:

| File | Purpose |
|---|---|
| `main.tf` | Main resource configuration |
| `variables.tf` | Input variables |
| `outputs.tf` | Exported resource values |
| `providers.tf` | Provider configuration |
| `versions.tf` | Terraform and provider version constraints |
| `backend.tf` | Remote state backend configuration |

Resource-specific configuration files will be introduced as the infrastructure develops.

### 3. Monitoring

The `monitoring/` directory centralises Azure monitoring and alerting configuration.

Planned components include:

- Action groups.
- Metric alerts.
- Scheduled query alerts.
- Activity log alerts.
- Diagnostic settings.
- Monitoring-related role assignments.

Monitoring will provide visibility into infrastructure health and operational events.

### 4. Modules

The `modules/` directory contains reusable Terraform components.

| Module | Responsibility |
| `naming/` | Consistent Azure resource naming |
| `diagnostics/` | Reusable diagnostic configuration |
| `common-tags/` | Standardised resource tagging |

Modules will be referenced by resource configurations where appropriate to reduce duplication and maintain consistency.

### 5. Pipelines

The `pipelines/` directory will contain the reusable CI/CD pipeline implementation.

**Build**
- Terraform formatting checks.
- Terraform initialisation.
- Configuration validation.
- Terraform planning.

**Deploy**
- Environment selection.
- Subscription configuration loading.
- Resource deployment selection.
- Terraform plan and approval.
- Terraform apply.

**Templates**

Reusable pipeline steps to standardise Terraform initialisation, planning and deployment.

GitHub Actions workflow entry points will reside in the repository's `.github/workflows/` directory.

### 6. Scripts

The `scripts/` directory will contain supporting automation for:

- Reading subscription configuration.
- Identifying available deployment targets.
- Validating Terraform configuration.
- Supporting deployment selection.

## Deployment Approach

The intended deployment process is:

1. Select the target environment.
2. Load the corresponding subscription JSON configuration.
3. Authenticate against Azure.
4. Identify resources enabled for deployment.
5. Select the resource or deployment target.
6. Initialise Terraform using the appropriate remote state configuration.
7. Generate and review a Terraform plan.
8. Apply the deployment following the required approval process.

This allows individual infrastructure components to be deployed independently while retaining a consistent deployment framework.

## Terraform State Management

Terraform state will be maintained remotely using Azure Storage.

State files must be isolated by environment and deployment target to prevent unrelated infrastructure deployments from sharing the same state.

Terraform state files must not be committed to source control.

## Security

The infrastructure deployment framework will follow these principles:

- Use secure Azure authentication, preferably GitHub Actions OIDC / workload identity federation.
- Never commit credentials, secrets or sensitive configuration.
- Use Azure role-based access control (RBAC) with least-privilege permissions.
- Protect production deployments with approval controls.
- Store Terraform state in secured Azure Storage.
- Keep environment-specific configuration separate from deployment logic.

## Current Status

**Infrastructure baseline established.**

The initial directory structure and Terraform starter files have been created.

The next implementation milestones are:

1. Finalise subscription configuration conventions.
2. Implement configuration-reading and validation scripts.
3. Establish Terraform remote state management.
4. Implement reusable Terraform modules.
5. Develop build and deployment workflows.
6. Begin deploying and monitoring Azure resources.

---

OpsInsight Infrastructure — Infrastructure as Code, deployment automation and monitoring.