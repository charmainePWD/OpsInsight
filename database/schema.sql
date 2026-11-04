/*
    OpsInsight database schema
    SQL Server

    Table mapping:
      dbo.Services
      dbo.Incidents
      OpsInsight.Users
      OpsInsight.Assignments
      OpsInsight.AbandonmentRequests

    Run this script in SQL Server Management Studio (SSMS).
*/

IF DB_ID(N'OpsInsight') IS NULL
BEGIN
    CREATE DATABASE [OpsInsight];
END;
GO

USE [OpsInsight];
GO

IF SCHEMA_ID(N'OpsInsight') IS NULL
BEGIN
    EXEC(N'CREATE SCHEMA [OpsInsight] AUTHORIZATION [dbo];');
END;
GO

/*
   1. SERVICES
   */

IF OBJECT_ID(N'dbo.Services', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[Services]
    (
        [Id] INT IDENTITY(1,1) NOT NULL,
        [Name] NVARCHAR(150) NOT NULL,
        [Category] NVARCHAR(100) NOT NULL,

        [Status] NVARCHAR(30) NOT NULL
            CONSTRAINT [DF_Services_Status]
            DEFAULT (N'Operational'),

        [UptimePercentage] DECIMAL(5,2) NOT NULL
            CONSTRAINT [DF_Services_UptimePercentage]
            DEFAULT (100.00),

        [ResponseTimeMs] INT NOT NULL
            CONSTRAINT [DF_Services_ResponseTimeMs]
            DEFAULT (0),

        [CreatedAt] DATETIME2(7) NOT NULL
            CONSTRAINT [DF_Services_CreatedAt]
            DEFAULT (SYSUTCDATETIME()),

        CONSTRAINT [PK_Services]
            PRIMARY KEY CLUSTERED ([Id]),

        CONSTRAINT [CK_Services_UptimePercentage]
            CHECK ([UptimePercentage] >= 0 AND [UptimePercentage] <= 100),

        CONSTRAINT [CK_Services_ResponseTimeMs]
            CHECK ([ResponseTimeMs] >= 0),

        CONSTRAINT [CK_Services_Status]
            CHECK ([Status] IN (
                N'Operational',
                N'Degraded',
                N'Down'
            ))
    );
END;
GO

/*
   2. INCIDENTS
   */

IF OBJECT_ID(N'dbo.Incidents', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[Incidents]
    (
        [Id] INT IDENTITY(1,1) NOT NULL,
        [ServiceId] INT NOT NULL,
        [Title] NVARCHAR(200) NOT NULL,
        [Description] NVARCHAR(2000) NULL,

        [Severity] NVARCHAR(20) NOT NULL
            CONSTRAINT [DF_Incidents_Severity]
            DEFAULT (N'Low'),

        [Status] NVARCHAR(30) NOT NULL
            CONSTRAINT [DF_Incidents_Status]
            DEFAULT (N'Open'),

        [CreatedAt] DATETIME2(7) NOT NULL
            CONSTRAINT [DF_Incidents_CreatedAt]
            DEFAULT (SYSUTCDATETIME()),

        [ResolvedAt] DATETIME2(7) NULL,

        CONSTRAINT [PK_Incidents]
            PRIMARY KEY CLUSTERED ([Id]),

        CONSTRAINT [FK_Incidents_Services]
            FOREIGN KEY ([ServiceId])
            REFERENCES [dbo].[Services]([Id]),

        CONSTRAINT [CK_Incidents_Severity]
            CHECK ([Severity] IN (
                N'Critical',
                N'High',
                N'Medium',
                N'Low'
            )),

        CONSTRAINT [CK_Incidents_Status]
            CHECK ([Status] IN (
                N'Open',
                N'Investigating',
                N'Monitoring',
                N'Resolved'
            ))
    );

    CREATE INDEX [IX_Incidents_ServiceId]
        ON [dbo].[Incidents] ([ServiceId]);

    CREATE INDEX [IX_Incidents_CreatedAt]
        ON [dbo].[Incidents] ([CreatedAt] DESC);
END;
GO

/*
   3. USERS
   */

IF OBJECT_ID(N'OpsInsight.Users', N'U') IS NULL
BEGIN
    CREATE TABLE [OpsInsight].[Users]
    (
        [Id] INT IDENTITY(1,1) NOT NULL,
        [Name] NVARCHAR(100) NOT NULL,
        [Surname] NVARCHAR(100) NOT NULL,
        [Email] NVARCHAR(256) NOT NULL,

        [Permission] NVARCHAR(30) NOT NULL
            CONSTRAINT [DF_Users_Permission]
            DEFAULT (N'Contributor'),

        [PasswordHash] NVARCHAR(500) NOT NULL,

        [CreatedAt] DATETIME2(7) NOT NULL
            CONSTRAINT [DF_Users_CreatedAt]
            DEFAULT (SYSUTCDATETIME()),

        CONSTRAINT [PK_Users]
            PRIMARY KEY CLUSTERED ([Id]),

        CONSTRAINT [CK_Users_Permission]
            CHECK ([Permission] IN (
                N'Administrator',
                N'Contributor'
            ))
    );

    CREATE UNIQUE INDEX [IX_Users_Email]
        ON [OpsInsight].[Users] ([Email]);
END;
GO

/* 
   4. ASSIGNMENTS TABLE
  */

IF OBJECT_ID(N'OpsInsight.Assignments', N'U') IS NULL
BEGIN
    CREATE TABLE [OpsInsight].[Assignments]
    (
        [Id] INT IDENTITY(1,1) NOT NULL,

        [UserId] INT NOT NULL,
        [IncidentId] INT NOT NULL,
        [AssignedByUserId] INT NULL,

        [AssignedAt] DATETIME2(7) NOT NULL
            CONSTRAINT [DF_Assignments_AssignedAt]
            DEFAULT (SYSUTCDATETIME()),

        [UnassignedAt] DATETIME2(7) NULL,

        [Status] NVARCHAR(30) NOT NULL
            CONSTRAINT [DF_Assignments_Status]
            DEFAULT (N'Active'),

        [ClosureReason] NVARCHAR(30) NULL,
        [PreviousAssignmentId] INT NULL,
        [ClosureNotes] NVARCHAR(1000) NULL,

        CONSTRAINT [PK_Assignments]
            PRIMARY KEY CLUSTERED ([Id]),

        CONSTRAINT [FK_Assignments_Users_User]
            FOREIGN KEY ([UserId])
            REFERENCES [OpsInsight].[Users]([Id]),

        CONSTRAINT [FK_Assignments_Users_AssignedBy]
            FOREIGN KEY ([AssignedByUserId])
            REFERENCES [OpsInsight].[Users]([Id]),

        CONSTRAINT [FK_Assignments_Incidents]
            FOREIGN KEY ([IncidentId])
            REFERENCES [dbo].[Incidents]([Id]),

        CONSTRAINT [FK_Assignments_PreviousAssignment]
            FOREIGN KEY ([PreviousAssignmentId])
            REFERENCES [OpsInsight].[Assignments]([Id]),

        CONSTRAINT [CK_Assignments_Status]
            CHECK ([Status] IN (
                N'Active',
                N'PendingAbandonment',
                N'Closed'
            ))
    );

    CREATE INDEX [IX_Assignments_UserId]
        ON [OpsInsight].[Assignments] ([UserId]);

    CREATE INDEX [IX_Assignments_IncidentId]
        ON [OpsInsight].[Assignments] ([IncidentId]);

    CREATE INDEX [IX_Assignments_AssignedAt]
        ON [OpsInsight].[Assignments] ([AssignedAt]);

    CREATE UNIQUE INDEX [IX_Assignments_PreviousAssignmentId]
        ON [OpsInsight].[Assignments] ([PreviousAssignmentId])
        WHERE [PreviousAssignmentId] IS NOT NULL;

    CREATE UNIQUE INDEX [IX_Assignments_OneCurrentAssignmentPerIncident]
        ON [OpsInsight].[Assignments] ([IncidentId])
        WHERE [UnassignedAt] IS NULL;
END;
GO

/*
   5. ABANDONMENT REQUESTS
   */

IF OBJECT_ID(N'OpsInsight.AbandonmentRequests', N'U') IS NULL
BEGIN
    CREATE TABLE [OpsInsight].[AbandonmentRequests]
    (
        [Id] INT IDENTITY(1,1) NOT NULL,

        [AssignmentId] INT NOT NULL,
        [RequestedByUserId] INT NOT NULL,

        [Reason] NVARCHAR(1000) NOT NULL,

        [RequestedAt] DATETIME2(7) NOT NULL
            CONSTRAINT [DF_AbandonmentRequests_RequestedAt]
            DEFAULT (SYSUTCDATETIME()),

        [Status] NVARCHAR(30) NOT NULL
            CONSTRAINT [DF_AbandonmentRequests_Status]
            DEFAULT (N'Pending'),

        [ReviewedByUserId] INT NULL,
        [ReviewedAt] DATETIME2(7) NULL,
        [AdminNote] NVARCHAR(1000) NULL,

        CONSTRAINT [PK_AbandonmentRequests]
            PRIMARY KEY CLUSTERED ([Id]),

        CONSTRAINT [FK_AbandonmentRequests_Assignments]
            FOREIGN KEY ([AssignmentId])
            REFERENCES [OpsInsight].[Assignments]([Id]),

        CONSTRAINT [FK_AbandonmentRequests_RequestedByUser]
            FOREIGN KEY ([RequestedByUserId])
            REFERENCES [OpsInsight].[Users]([Id]),

        CONSTRAINT [FK_AbandonmentRequests_ReviewedByUser]
            FOREIGN KEY ([ReviewedByUserId])
            REFERENCES [OpsInsight].[Users]([Id]),

        CONSTRAINT [CK_AbandonmentRequests_Status]
            CHECK ([Status] IN (
                N'Pending',
                N'Approved',
                N'Rejected',
                N'Reassigned'
            ))
    );

    CREATE UNIQUE INDEX [IX_AbandonmentRequests_OnePendingPerAssignment]
        ON [OpsInsight].[AbandonmentRequests] ([AssignmentId])
        WHERE [Status] = N'Pending';

    CREATE INDEX [IX_AbandonmentRequests_Status_RequestedAt]
        ON [OpsInsight].[AbandonmentRequests] ([Status], [RequestedAt]);
END;
GO

PRINT N'OpsInsight database schema is ready.';
GO