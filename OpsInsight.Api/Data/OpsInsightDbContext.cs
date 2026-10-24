
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

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("Users", "OpsInsight");
            entity.HasKey(user => user.Id);

            entity.Property(user => user.Name)
                .HasMaxLength(100).IsRequired();

            entity.Property(user => user.Surname)
                .HasMaxLength(100).IsRequired();

            entity.Property(user => user.Email)
                .HasMaxLength(256).IsRequired();

            entity.HasIndex(user => user.Email).IsUnique();

            entity.Property(user => user.Permission)
                .HasMaxLength(30).IsRequired();

            entity.Property(user => user.PasswordHash)
                .HasMaxLength(500).IsRequired();

            entity.Property(user => user.CreatedAt)
                .HasDefaultValueSql("SYSUTCDATETIME()");
        });

        modelBuilder.Entity<Assignment>(entity =>
        {
            entity.ToTable("Assignments", "OpsInsight");
            entity.HasKey(assignment => assignment.Id);

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

            entity.HasIndex(assignment => assignment.UserId);
            entity.HasIndex(assignment => assignment.IncidentId);
            entity.HasIndex(assignment => assignment.AssignedAt);
        });
    }
}
