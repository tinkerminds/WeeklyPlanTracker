using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WeeklyPlanTracker.Core.Entities;

namespace WeeklyPlanTracker.Infrastructure.Data.Configurations
{
    public class ProgressUpdateConfiguration : IEntityTypeConfiguration<ProgressUpdate>
    {
        public void Configure(EntityTypeBuilder<ProgressUpdate> builder)
        {
            builder.HasKey(e => e.Id);
            builder.Property(e => e.HoursDone).HasPrecision(5, 1);
            builder.Property(e => e.Status).IsRequired().HasConversion<string>().HasMaxLength(20);
            builder.Property(e => e.Notes).HasMaxLength(1000);
            builder.Property(e => e.Timestamp).HasDefaultValueSql("GETUTCDATE()");

            builder.HasOne(e => e.PlanAssignment)
                .WithMany(pa => pa.ProgressUpdates)
                .HasForeignKey(e => e.PlanAssignmentId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
