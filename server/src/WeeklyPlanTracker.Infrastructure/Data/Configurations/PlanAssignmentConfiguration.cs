using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WeeklyPlanTracker.Core.Entities;

namespace WeeklyPlanTracker.Infrastructure.Data.Configurations
{
    public class PlanAssignmentConfiguration : IEntityTypeConfiguration<PlanAssignment>
    {
        public void Configure(EntityTypeBuilder<PlanAssignment> builder)
        {
            builder.HasKey(e => e.Id);
            builder.Property(e => e.CommittedHours).IsRequired();
            builder.Property(e => e.HoursCompleted).HasPrecision(5, 1).HasDefaultValue(0m);
            builder.Property(e => e.Status).IsRequired().HasConversion<string>().HasMaxLength(20);
            builder.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");

            // Unique constraint: one member can only have one assignment per backlog item per week
            builder.HasIndex(e => new { e.WeeklyPlanId, e.TeamMemberId, e.BacklogItemId }).IsUnique();

            builder.HasOne(e => e.WeeklyPlan)
                .WithMany(wp => wp.PlanAssignments)
                .HasForeignKey(e => e.WeeklyPlanId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(e => e.TeamMember)
                .WithMany(tm => tm.PlanAssignments)
                .HasForeignKey(e => e.TeamMemberId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(e => e.BacklogItem)
                .WithMany(bi => bi.PlanAssignments)
                .HasForeignKey(e => e.BacklogItemId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
