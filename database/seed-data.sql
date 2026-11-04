/*
    OpsInsight sample data
    SQL Server

    Run after schema.sql.

    Demo login password for all four seeded users:
        OpsInsightDemo!2026

    These are public demonstration accounts only.
*/

USE [OpsInsight];
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;

BEGIN TRY
    BEGIN TRANSACTION;

    /* 
       1. SERVICES
        */

    IF NOT EXISTS (
        SELECT 1 FROM [dbo].[Services]
        WHERE [Name] = N'Payment Gateway'
    )
    INSERT INTO [dbo].[Services]
        ([Name], [Category], [Status], [UptimePercentage], [ResponseTimeMs], [CreatedAt])
    VALUES
        (N'Payment Gateway', N'Payments', N'Operational', 99.98, 142, DATEADD(DAY, -180, SYSUTCDATETIME()));

    IF NOT EXISTS (
        SELECT 1 FROM [dbo].[Services]
        WHERE [Name] = N'Customer Portal'
    )
    INSERT INTO [dbo].[Services]
        ([Name], [Category], [Status], [UptimePercentage], [ResponseTimeMs], [CreatedAt])
    VALUES
        (N'Customer Portal', N'Web Application', N'Degraded', 98.72, 680, DATEADD(DAY, -160, SYSUTCDATETIME()));

    IF NOT EXISTS (
        SELECT 1 FROM [dbo].[Services]
        WHERE [Name] = N'Identity Service'
    )
    INSERT INTO [dbo].[Services]
        ([Name], [Category], [Status], [UptimePercentage], [ResponseTimeMs], [CreatedAt])
    VALUES
        (N'Identity Service', N'Security', N'Operational', 99.95, 118, DATEADD(DAY, -150, SYSUTCDATETIME()));

    IF NOT EXISTS (
        SELECT 1 FROM [dbo].[Services]
        WHERE [Name] = N'Notification Engine'
    )
    INSERT INTO [dbo].[Services]
        ([Name], [Category], [Status], [UptimePercentage], [ResponseTimeMs], [CreatedAt])
    VALUES
        (N'Notification Engine', N'Messaging', N'Degraded', 97.85, 920, DATEADD(DAY, -140, SYSUTCDATETIME()));

    IF NOT EXISTS (
        SELECT 1 FROM [dbo].[Services]
        WHERE [Name] = N'Reporting API'
    )
    INSERT INTO [dbo].[Services]
        ([Name], [Category], [Status], [UptimePercentage], [ResponseTimeMs], [CreatedAt])
    VALUES
        (N'Reporting API', N'Data', N'Operational', 99.91, 245, DATEADD(DAY, -120, SYSUTCDATETIME()));

    IF NOT EXISTS (
        SELECT 1 FROM [dbo].[Services]
        WHERE [Name] = N'Order Processing'
    )
    INSERT INTO [dbo].[Services]
        ([Name], [Category], [Status], [UptimePercentage], [ResponseTimeMs], [CreatedAt])
    VALUES
        (N'Order Processing', N'Operations', N'Operational', 99.99, 96, DATEADD(DAY, -100, SYSUTCDATETIME()));


    /* 
       2. USERS
       Demo password: OpsInsightDemo!2026
       These hashes use ASP.NET Core Identity V3 format.
        */

    IF NOT EXISTS (
        SELECT 1 FROM [OpsInsight].[Users]
        WHERE [Email] = N'admin@opsinsight.demo'
    )
    INSERT INTO [OpsInsight].[Users]
        ([Name], [Surname], [Email], [Permission], [PasswordHash], [CreatedAt])
    VALUES
        (
            N'Alex',
            N'Morgan',
            N'admin@opsinsight.demo',
            N'Administrator',
            N'AQAAAAIAAYagAAAAEJVrjf0rxzj/V/7YyOERk1YHAGnmfq19g0e99EAjvw8FeWqM7HC5nTEyU37VYm44vQ==',
            DATEADD(DAY, -90, SYSUTCDATETIME())
        );

    IF NOT EXISTS (
        SELECT 1 FROM [OpsInsight].[Users]
        WHERE [Email] = N'sam.taylor@opsinsight.demo'
    )
    INSERT INTO [OpsInsight].[Users]
        ([Name], [Surname], [Email], [Permission], [PasswordHash], [CreatedAt])
    VALUES
        (
            N'Sam',
            N'Taylor',
            N'sam.taylor@opsinsight.demo',
            N'Contributor',
            N'AQAAAAIAAYagAAAAEB3AXjGuGO1fYW5trTKuCSQOnAQ/UL8ogGH1HmbuO8C8U50qp09RbTue+6g9tMsd1A==',
            DATEADD(DAY, -75, SYSUTCDATETIME())
        );

    IF NOT EXISTS (
        SELECT 1 FROM [OpsInsight].[Users]
        WHERE [Email] = N'jordan.lee@opsinsight.demo'
    )
    INSERT INTO [OpsInsight].[Users]
        ([Name], [Surname], [Email], [Permission], [PasswordHash], [CreatedAt])
    VALUES
        (
            N'Jordan',
            N'Lee',
            N'jordan.lee@opsinsight.demo',
            N'Contributor',
            N'AQAAAAIAAYagAAAAEPdWJZhqqFgTVO4PwYyOkqHtbOYvCqSDa6fxCSWLiaFPLIAD67uUsDBSb8hPgF/Dtg==',
            DATEADD(DAY, -60, SYSUTCDATETIME())
        );

    IF NOT EXISTS (
        SELECT 1 FROM [OpsInsight].[Users]
        WHERE [Email] = N'priya.naidoo@opsinsight.demo'
    )
    INSERT INTO [OpsInsight].[Users]
        ([Name], [Surname], [Email], [Permission], [PasswordHash], [CreatedAt])
    VALUES
        (
            N'Priya',
            N'Naidoo',
            N'priya.naidoo@opsinsight.demo',
            N'Contributor',
            N'AQAAAAIAAYagAAAAELznT1AIvveHDNqDwMlvS+RishUSkhE9A4SPMxU0h387OX7Sq+IDVn+zoGxHVfE+SQ==',
            DATEADD(DAY, -45, SYSUTCDATETIME())
        );


    /* 
       3. INCIDENTS
       Resolve service IDs by name instead of assuming
       identity values start at 1.
        */

    DECLARE @PaymentGateway INT =
        (SELECT TOP (1) [Id]
         FROM [dbo].[Services]
         WHERE [Name] = N'Payment Gateway');

    DECLARE @CustomerPortal INT =
        (SELECT TOP (1) [Id]
         FROM [dbo].[Services]
         WHERE [Name] = N'Customer Portal');

    DECLARE @IdentityService INT =
        (SELECT TOP (1) [Id]
         FROM [dbo].[Services]
         WHERE [Name] = N'Identity Service');

    DECLARE @NotificationEngine INT =
        (SELECT TOP (1) [Id]
         FROM [dbo].[Services]
         WHERE [Name] = N'Notification Engine');

    DECLARE @ReportingApi INT =
        (SELECT TOP (1) [Id]
         FROM [dbo].[Services]
         WHERE [Name] = N'Reporting API');

    DECLARE @OrderProcessing INT =
        (SELECT TOP (1) [Id]
         FROM [dbo].[Services]
         WHERE [Name] = N'Order Processing');


    IF NOT EXISTS (
        SELECT 1 FROM [dbo].[Incidents]
        WHERE [ServiceId] = @PaymentGateway
          AND [Title] = N'Intermittent payment authorisation timeouts'
    )
    INSERT INTO [dbo].[Incidents]
        ([ServiceId], [Title], [Description], [Severity], [Status], [CreatedAt], [ResolvedAt])
    VALUES
        (
            @PaymentGateway,
            N'Intermittent payment authorisation timeouts',
            N'Some payment requests are taking longer than expected and occasionally timing out during authorisation.',
            N'High',
            N'Investigating',
            DATEADD(HOUR, -5, SYSUTCDATETIME()),
            NULL
        );

    IF NOT EXISTS (
        SELECT 1 FROM [dbo].[Incidents]
        WHERE [ServiceId] = @CustomerPortal
          AND [Title] = N'Customer portal sign-in failures'
    )
    INSERT INTO [dbo].[Incidents]
        ([ServiceId], [Title], [Description], [Severity], [Status], [CreatedAt], [ResolvedAt])
    VALUES
        (
            @CustomerPortal,
            N'Customer portal sign-in failures',
            N'A subset of customers are unable to complete the sign-in process.',
            N'Critical',
            N'Open',
            DATEADD(HOUR, -3, SYSUTCDATETIME()),
            NULL
        );

    IF NOT EXISTS (
        SELECT 1 FROM [dbo].[Incidents]
        WHERE [ServiceId] = @ReportingApi
          AND [Title] = N'Delayed report generation'
    )
    INSERT INTO [dbo].[Incidents]
        ([ServiceId], [Title], [Description], [Severity], [Status], [CreatedAt], [ResolvedAt])
    VALUES
        (
            @ReportingApi,
            N'Delayed report generation',
            N'Large reports are taking longer than the expected processing window.',
            N'Medium',
            N'Monitoring',
            DATEADD(HOUR, -18, SYSUTCDATETIME()),
            NULL
        );

    IF NOT EXISTS (
        SELECT 1 FROM [dbo].[Incidents]
        WHERE [ServiceId] = @NotificationEngine
          AND [Title] = N'Notification queue backlog'
    )
    INSERT INTO [dbo].[Incidents]
        ([ServiceId], [Title], [Description], [Severity], [Status], [CreatedAt], [ResolvedAt])
    VALUES
        (
            @NotificationEngine,
            N'Notification queue backlog',
            N'The outbound notification queue is growing and delivery is delayed.',
            N'Medium',
            N'Open',
            DATEADD(HOUR, -8, SYSUTCDATETIME()),
            NULL
        );

    IF NOT EXISTS (
        SELECT 1 FROM [dbo].[Incidents]
        WHERE [ServiceId] = @IdentityService
          AND [Title] = N'Elevated token response times'
    )
    INSERT INTO [dbo].[Incidents]
        ([ServiceId], [Title], [Description], [Severity], [Status], [CreatedAt], [ResolvedAt])
    VALUES
        (
            @IdentityService,
            N'Elevated token response times',
            N'Authentication token requests are experiencing increased response times.',
            N'High',
            N'Investigating',
            DATEADD(HOUR, -12, SYSUTCDATETIME()),
            NULL
        );

    IF NOT EXISTS (
        SELECT 1 FROM [dbo].[Incidents]
        WHERE [ServiceId] = @OrderProcessing
          AND [Title] = N'Order processing latency'
    )
    INSERT INTO [dbo].[Incidents]
        ([ServiceId], [Title], [Description], [Severity], [Status], [CreatedAt], [ResolvedAt])
    VALUES
        (
            @OrderProcessing,
            N'Order processing latency',
            N'Order processing latency increased following a recent deployment.',
            N'High',
            N'Monitoring',
            DATEADD(DAY, -2, SYSUTCDATETIME()),
            NULL
        );

    IF NOT EXISTS (
        SELECT 1 FROM [dbo].[Incidents]
        WHERE [ServiceId] = @CustomerPortal
          AND [Title] = N'Session cache invalidation issue'
    )
    INSERT INTO [dbo].[Incidents]
        ([ServiceId], [Title], [Description], [Severity], [Status], [CreatedAt], [ResolvedAt])
    VALUES
        (
            @CustomerPortal,
            N'Session cache invalidation issue',
            N'Some users experienced stale session data after signing out.',
            N'Low',
            N'Resolved',
            DATEADD(DAY, -2, SYSUTCDATETIME()),
            DATEADD(DAY, -1, SYSUTCDATETIME())
        );

    IF NOT EXISTS (
        SELECT 1 FROM [dbo].[Incidents]
        WHERE [ServiceId] = @PaymentGateway
          AND [Title] = N'Webhook delivery retries'
    )
    INSERT INTO [dbo].[Incidents]
        ([ServiceId], [Title], [Description], [Severity], [Status], [CreatedAt], [ResolvedAt])
    VALUES
        (
            @PaymentGateway,
            N'Webhook delivery retries',
            N'A temporary downstream issue caused webhook deliveries to be retried.',
            N'Medium',
            N'Resolved',
            DATEADD(DAY, -4, SYSUTCDATETIME()),
            DATEADD(DAY, -3, SYSUTCDATETIME())
        );


    /* 
       4. ASSIGNMENTS
       Includes active assignments, pending abandonment,
       and historical/reassigned records.
        */

    DECLARE @AdminId INT =
        (SELECT TOP (1) [Id]
         FROM [OpsInsight].[Users]
         WHERE [Email] = N'admin@opsinsight.demo');

    DECLARE @SamId INT =
        (SELECT TOP (1) [Id]
         FROM [OpsInsight].[Users]
         WHERE [Email] = N'sam.taylor@opsinsight.demo');

    DECLARE @JordanId INT =
        (SELECT TOP (1) [Id]
         FROM [OpsInsight].[Users]
         WHERE [Email] = N'jordan.lee@opsinsight.demo');

    DECLARE @PriyaId INT =
        (SELECT TOP (1) [Id]
         FROM [OpsInsight].[Users]
         WHERE [Email] = N'priya.naidoo@opsinsight.demo');


    DECLARE @IncidentPayment INT =
        (SELECT TOP (1) [Id]
         FROM [dbo].[Incidents]
         WHERE [ServiceId] = @PaymentGateway
           AND [Title] = N'Intermittent payment authorisation timeouts');

    DECLARE @IncidentPortal INT =
        (SELECT TOP (1) [Id]
         FROM [dbo].[Incidents]
         WHERE [ServiceId] = @CustomerPortal
           AND [Title] = N'Customer portal sign-in failures');

    DECLARE @IncidentReporting INT =
        (SELECT TOP (1) [Id]
         FROM [dbo].[Incidents]
         WHERE [ServiceId] = @ReportingApi
           AND [Title] = N'Delayed report generation');

    DECLARE @IncidentNotifications INT =
        (SELECT TOP (1) [Id]
         FROM [dbo].[Incidents]
         WHERE [ServiceId] = @NotificationEngine
           AND [Title] = N'Notification queue backlog');

    DECLARE @IncidentIdentity INT =
        (SELECT TOP (1) [Id]
         FROM [dbo].[Incidents]
         WHERE [ServiceId] = @IdentityService
           AND [Title] = N'Elevated token response times');

    DECLARE @IncidentOrders INT =
        (SELECT TOP (1) [Id]
         FROM [dbo].[Incidents]
         WHERE [ServiceId] = @OrderProcessing
           AND [Title] = N'Order processing latency');

    DECLARE @IncidentResolved INT =
        (SELECT TOP (1) [Id]
         FROM [dbo].[Incidents]
         WHERE [ServiceId] = @CustomerPortal
           AND [Title] = N'Session cache invalidation issue');


    IF NOT EXISTS (
        SELECT 1 FROM [OpsInsight].[Assignments]
        WHERE [IncidentId] = @IncidentPayment
          AND [UnassignedAt] IS NULL
    )
    INSERT INTO [OpsInsight].[Assignments]
        ([UserId], [IncidentId], [AssignedByUserId], [AssignedAt], [Status])
    VALUES
        (@SamId, @IncidentPayment, @AdminId, DATEADD(HOUR, -4, SYSUTCDATETIME()), N'Active');


    IF NOT EXISTS (
        SELECT 1 FROM [OpsInsight].[Assignments]
        WHERE [IncidentId] = @IncidentPortal
          AND [UnassignedAt] IS NULL
    )
    INSERT INTO [OpsInsight].[Assignments]
        ([UserId], [IncidentId], [AssignedByUserId], [AssignedAt], [Status])
    VALUES
        (@JordanId, @IncidentPortal, @AdminId, DATEADD(HOUR, -2, SYSUTCDATETIME()), N'Active');


    IF NOT EXISTS (
        SELECT 1 FROM [OpsInsight].[Assignments]
        WHERE [IncidentId] = @IncidentReporting
          AND [UnassignedAt] IS NULL
    )
    INSERT INTO [OpsInsight].[Assignments]
        ([UserId], [IncidentId], [AssignedByUserId], [AssignedAt], [Status])
    VALUES
        (@PriyaId, @IncidentReporting, @AdminId, DATEADD(HOUR, -16, SYSUTCDATETIME()), N'Active');


    IF NOT EXISTS (
        SELECT 1 FROM [OpsInsight].[Assignments]
        WHERE [IncidentId] = @IncidentNotifications
          AND [UnassignedAt] IS NULL
    )
    INSERT INTO [OpsInsight].[Assignments]
        ([UserId], [IncidentId], [AssignedByUserId], [AssignedAt], [Status])
    VALUES
        (@SamId, @IncidentNotifications, @AdminId, DATEADD(HOUR, -7, SYSUTCDATETIME()), N'PendingAbandonment');


    IF NOT EXISTS (
        SELECT 1 FROM [OpsInsight].[Assignments]
        WHERE [IncidentId] = @IncidentIdentity
          AND [UnassignedAt] IS NULL
    )
    INSERT INTO [OpsInsight].[Assignments]
        ([UserId], [IncidentId], [AssignedByUserId], [AssignedAt], [Status])
    VALUES
        (@JordanId, @IncidentIdentity, @AdminId, DATEADD(HOUR, -10, SYSUTCDATETIME()), N'Active');


    /* Reassignment history */

    IF NOT EXISTS (
        SELECT 1 FROM [OpsInsight].[Assignments]
        WHERE [IncidentId] = @IncidentOrders
    )
    BEGIN
        INSERT INTO [OpsInsight].[Assignments]
            ([UserId], [IncidentId], [AssignedByUserId], [AssignedAt],
             [UnassignedAt], [Status], [ClosureReason], [ClosureNotes])
        VALUES
            (
                @SamId,
                @IncidentOrders,
                @AdminId,
                DATEADD(DAY, -2, SYSUTCDATETIME()),
                DATEADD(DAY, -1, SYSUTCDATETIME()),
                N'Closed',
                N'Reassigned',
                N'Original assignment closed during reassignment.'
            );

        DECLARE @PreviousAssignmentId INT = SCOPE_IDENTITY();

        INSERT INTO [OpsInsight].[Assignments]
            ([UserId], [IncidentId], [AssignedByUserId], [AssignedAt],
             [Status], [PreviousAssignmentId])
        VALUES
            (
                @PriyaId,
                @IncidentOrders,
                @AdminId,
                DATEADD(HOUR, -20, SYSUTCDATETIME()),
                N'Active',
                @PreviousAssignmentId
            );
    END;


    IF NOT EXISTS (
        SELECT 1 FROM [OpsInsight].[Assignments]
        WHERE [IncidentId] = @IncidentResolved
          AND [Status] = N'Closed'
    )
    INSERT INTO [OpsInsight].[Assignments]
        ([UserId], [IncidentId], [AssignedByUserId], [AssignedAt],
         [UnassignedAt], [Status], [ClosureReason], [ClosureNotes])
    VALUES
        (
            @JordanId,
            @IncidentResolved,
            @AdminId,
            DATEADD(DAY, -2, SYSUTCDATETIME()),
            DATEADD(DAY, -1, SYSUTCDATETIME()),
            N'Closed',
            N'Resolved',
            N'Incident resolved; assignment automatically closed.'
        );


    /* 
       5. ABANDONMENT REQUEST
        */

    DECLARE @PendingAssignmentId INT =
        (
            SELECT TOP (1) [Id]
            FROM [OpsInsight].[Assignments]
            WHERE [IncidentId] = @IncidentNotifications
              AND [UnassignedAt] IS NULL
        );

    IF @PendingAssignmentId IS NOT NULL
       AND NOT EXISTS (
            SELECT 1
            FROM [OpsInsight].[AbandonmentRequests]
            WHERE [AssignmentId] = @PendingAssignmentId
              AND [Status] = N'Pending'
       )
    BEGIN
        INSERT INTO [OpsInsight].[AbandonmentRequests]
            ([AssignmentId], [RequestedByUserId], [Reason], [RequestedAt], [Status])
        VALUES
            (
                @PendingAssignmentId,
                @SamId,
                N'The current workload has changed and I may not be able to complete this investigation within the expected timeframe.',
                DATEADD(HOUR, -1, SYSUTCDATETIME()),
                N'Pending'
            );
    END;


    COMMIT TRANSACTION;

    PRINT N'OpsInsight sample data has been inserted.';
    PRINT N'Demo password for all seeded accounts: OpsInsightDemo!2026';

END TRY
BEGIN CATCH

    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;

    THROW;

END CATCH;
GO


/* 
   6. QUICK VERIFICATION
   */

SELECT
    [Id],
    [Name],
    [Category],
    [Status],
    [UptimePercentage],
    [ResponseTimeMs]
FROM [dbo].[Services]
ORDER BY [Id];


SELECT
    [Id],
    [Title],
    [Severity],
    [Status],
    [CreatedAt]
FROM [dbo].[Incidents]
ORDER BY [CreatedAt] DESC;


SELECT
    assignment.[Id],
    incident.[Title] AS [Incident],
    assignedUser.[Name] + N' ' + assignedUser.[Surname] AS [AssignedTo],
    assignment.[Status] AS [AssignmentStatus],
    assignment.[AssignedAt],
    assignment.[UnassignedAt]
FROM [OpsInsight].[Assignments] AS assignment
INNER JOIN [dbo].[Incidents] AS incident
    ON incident.[Id] = assignment.[IncidentId]
INNER JOIN [OpsInsight].[Users] AS assignedUser
    ON assignedUser.[Id] = assignment.[UserId]
ORDER BY assignment.[AssignedAt] DESC;


SELECT
    [Id],
    [Name],
    [Surname],
    [Email],
    [Permission],
    [CreatedAt]
FROM [OpsInsight].[Users]
ORDER BY [Id];


SELECT
    request.[Id],
    request.[Status],
    request.[Reason],
    request.[RequestedAt],
    assignment.[IncidentId]
FROM [OpsInsight].[AbandonmentRequests] AS request
INNER JOIN [OpsInsight].[Assignments] AS assignment
    ON assignment.[Id] = request.[AssignmentId]
ORDER BY request.[RequestedAt] DESC;
GO