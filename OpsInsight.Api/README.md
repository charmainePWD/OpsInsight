# OpsInsight API

The OpsInsight API is the backend of the OpsInsight application. It is built with ASP.NET Core and C# and provides REST endpoints for service monitoring, incident management, authentication, user management and assignment workflows.

## Technology

- C#
- ASP.NET Core Web API
- .NET 10
- Entity Framework Core
- Microsoft SQL Server
- Cookie-based authentication

## Prerequisites

- .NET 10 SDK
- Microsoft SQL Server
- A configured OpsInsight database

## Configuration

The API requires a SQL Server connection string named `OpsInsightDb`.

Create a local `appsettings.Development.json` file in this directory, or configure the connection string using .NET user secrets.

Example:

```json
{
  "ConnectionStrings": {
    "OpsInsightDb": "Server=YOUR_SERVER_NAME;Database=OpsInsight;Trusted_Connection=True;TrustServerCertificate=True;"
  }
}
```

Replace `YOUR_SERVER_NAME` with your SQL Server instance.

The repository includes `appsettings.example.json` as a configuration reference. Keep actual credentials and private connection strings out of source control.

## Database Setup

Before starting the API, create and populate the database.

See [`../database/README.md`](../database/README.md) for the database setup instructions.

## Running the API

Open a terminal in the `OpsInsight.Api` directory.

Restore dependencies:

```bash
dotnet restore
```

Start the API:

```bash
dotnet run
```

The API will start using the configured launch profile and display its local addresses in the terminal.

Use the displayed address when configuring the frontend API URL.

## API Functionality

The API provides functionality for:

- User authentication and session management.
- Retrieving service information.
- Retrieving and updating incidents.
- Managing incident assignments.
- Managing users and permissions.
- Handling assignment abandonment requests.

The API uses cookie-based authentication and role-based authorisation to control access to protected operations.

## OpenAPI

In the Development environment, the application exposes an OpenAPI document.

Use the `/openapi/v1.json` endpoint at the API's local address to inspect the available API definition.

