
using Microsoft.EntityFrameworkCore;
using OpsInsight.Api.Models;

namespace OpsInsight.Api.Data;

public class OpsInsightDbContext : DbContext
{
    public OpsInsightDbContext(
        DbContextOptions<OpsInsightDbContext> options)
        : base(options)
    {
    }

    public DbSet<Service> Services => Set<Service>();

    public DbSet<Incident> Incidents => Set<Incident>();

    public DbSet<User> Users => Set<User>();

    public DbSet<Assignment> Assignments => Set<Assignment>();

    public DbSet<AbandonmentRequest> AbandonmentRequests =>
        Set<AbandonmentRequest>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // USERS
        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("Users", "OpsInsight");

            entity.HasKey(user => user.Id);

            entity.Property(user => user.Name)
                .HasMaxLength(100)
                .IsRequired();

            entity.Property(user => user.Surname)
                .HasMaxLength(100)
                .IsRequired();

            entity.Property(user => user.Email)
                .HasMaxLength(256)
                .IsRequired();

            entity.HasIndex(user => user.Email)
                .IsUnique();

            entity.Property(user => user.Permission)
                .HasMaxLength(30)
                .IsRequired();

            entity.Property(user => user.PasswordHash)
                .HasMaxLength(500)
                .IsRequired();

            entity.Property(user => user.CreatedAt)
                .HasDefaultValueSql("SYSUTCDATETIME()");
        });

        // ASSIGNMENTS
        modelBuilder.Entity<Assignment>(entity =>
        {
            entity.ToTable("Assignments", "OpsInsight");

            entity.HasKey(assignment => assignment.Id);

            entity.Property(assignment => assignment.Status)
                .HasMaxLength(30)
                .HasDefaultValue("Active")
                .IsRequired();

            entity.Property(assignment => assignment.ClosureReason)
                .HasMaxLength(30);

            entity.Property(assignment => assignment.ClosureNotes)
                .HasMaxLength(1000);

            entity.HasOne(assignment => assignment.User)
                .WithMany(user => user.Assignments)
                .HasForeignKey(assignment => assignment.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(assignment => assignment.AssignedByUser)
                .WithMany()
                .HasForeignKey(assignment => assignment.AssignedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(assignment => assignment.Incident)
                .WithMany()
                .HasForeignKey(assignment => assignment.IncidentId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(assignment => assignment.PreviousAssignment)
                .WithOne()
                .HasForeignKey<Assignment>(
                    assignment => assignment.PreviousAssignmentId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(assignment => assignment.UserId);

            entity.HasIndex(assignment => assignment.IncidentId);

            entity.HasIndex(assignment => assignment.AssignedAt);

            entity.HasIndex(assignment => assignment.PreviousAssignmentId)
                .IsUnique()
                .HasFilter("[PreviousAssignmentId] IS NOT NULL");

            entity.HasIndex(assignment => assignment.IncidentId)
                .IsUnique()
                .HasFilter("[UnassignedAt] IS NULL");
        });

        // ABANDONMENT REQUESTS
        modelBuilder.Entity<AbandonmentRequest>(entity =>
        {
            entity.ToTable("AbandonmentRequests", "OpsInsight");

            entity.HasKey(request => request.Id);

            entity.Property(request => request.Reason)
                .HasMaxLength(1000)
                .IsRequired();

            entity.Property(request => request.Status)
                .HasMaxLength(30)
                .HasDefaultValue("Pending")
                .IsRequired();

            entity.Property(request => request.AdminNote)
                .HasMaxLength(1000);

            entity.Property(request => request.RequestedAt)
                .HasDefaultValueSql("SYSUTCDATETIME()");

            entity.HasOne(request => request.Assignment)
                .WithMany()
                .HasForeignKey(request => request.AssignmentId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(request => request.RequestedByUser)
                .WithMany()
                .HasForeignKey(request => request.RequestedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(request => request.ReviewedByUser)
                .WithMany()
                .HasForeignKey(request => request.ReviewedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(request => request.AssignmentId)
                .IsUnique()
                .HasFilter("[Status] = 'Pending'");

            entity.HasIndex(request => new
            {
                request.Status,
                request.RequestedAt
            });
        });
    }
}
