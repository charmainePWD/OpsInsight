# OpsInsight – Database Setup

This directory contains the SQL Server database scripts required to configure and populate the OpsInsight application.

The database scripts provide the underlying structure and sample data used by the application's service monitoring, incident management, user permissions and assignment functionality.

## Database Technology

- Microsoft SQL Server
- Transact-SQL (T-SQL)
- SQL Server Management Studio (SSMS)

## Database Structure

The database is named `OpsInsight` and uses the following tables:

| Table | Description |
|-------            |---|
| `dbo.Services`     | Stores application services, their health status, uptime and response times. |
| `dbo.Incidents` | Stores incidents associated with monitored services. |
| `OpsInsight.Users` | Stores user details, login credentials and permission levels. |
| `OpsInsight.Assignments` | Tracks incident ownership, active assignments and assignment history. |
| `OpsInsight.AbandonmentRequests` | Stores requests to relinquish incident assignments and their review status. |

**Schema note:** The `Services` and `Incidents` tables are located in the `dbo` schema. The remaining tables are located in the `OpsInsight` schema.

## Setup Instructions

You will need a running SQL Server instance and SQL Server Management Studio (SSMS), or another SQL Server-compatible query tool.

### 1. Create the database structure

Open `schema.sql` in SSMS and execute the script.

This creates the `OpsInsight` database if it does not already exist, followed by the required schemas, tables, relationships, constraints and indexes.

### 2. Insert sample data

After the schema has been created successfully, open `seed-data.sql` and execute it.

The script populates the database with demonstration data, including:

- Sample application services and service health information.
- Incidents with different severity and status levels.
- Administrator and Contributor accounts.
- Active and historical incident assignments.
- A pending assignment abandonment request.

The seed script uses existence checks to avoid inserting duplicate demonstration records when it is run again.

### 3. Configure the API connection

Configure the API's SQL Server connection string using the `OpsInsightDb` connection string name.

For example, in `appsettings.Development.json`:

```json
{
  "ConnectionStrings": {
    "OpsInsightDb": "Server=YOUR_SERVER_NAME;Database=OpsInsight;Trusted_Connection=True;TrustServerCertificate=True;"
  }
}
```

Replace `YOUR_SERVER_NAME` with your SQL Server instance name.

For example, a local default SQL Server instance may use:

```text
Server=localhost;Database=OpsInsight;Trusted_Connection=True;TrustServerCertificate=True;
```

Use the connection settings appropriate for your environment. Avoid committing real database credentials or production connection strings to source control.

## Demo Accounts

The seed script provides four demonstration accounts.

| Account | Email | Permission |
|---|---|---|
| Administrator | admin@opsinsight.demo | Administrator |
| Sam Taylor | sam.taylor@opsinsight.demo | Contributor |
| Jordan Lee | jordan.lee@opsinsight.demo | Contributor |
| Priya Naidoo | priya.naidoo@opsinsight.demo | Contributor |

**Demo password for all accounts:**

`OpsInsightDemo!2026`

These accounts are intended for local development and demonstration purposes only.

## Important Notes

- Run `schema.sql` before `seed-data.sql`.
- Back up any existing database before running database scripts.
- The schema script creates missing tables but does not modify existing table definitions or migrate existing data.
- The seed script is designed for demonstration purposes and should not be used as production data.
- Demo credentials should be changed or removed before deploying the application in a real environment.

## Verification

Both scripts include SQL queries to verify the database structure and sample records.

After setup, you can refresh the database in SSMS and inspect the tables under the `OpsInsight` database.

---

Part of the [OpsInsight](../README.md) full-stack application project.