using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WeeklyPlanTracker.Core.Entities;

namespace WeeklyPlanTracker.Infrastructure.Data.Configurations
{
    public class WeeklyPlanConfiguration : IEntityTypeConfiguration<WeeklyPlan>
    {
        public void Configure(EntityTypeBuilder<WeeklyPlan> builder)
        {
            builder.HasKey(e => e.Id);
            builder.Property(e => e.PlanningDate).IsRequired();
            builder.Property(e => e.State).IsRequired().HasConversion<string>().HasMaxLength(20);
            builder.Property(e => e.ClientFocusedPercent).IsRequired();
            builder.Property(e => e.TechDebtPercent).IsRequired();
            builder.Property(e => e.RAndDPercent).IsRequired();
            builder.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");

            // Ignore computed properties — they are calculated, not stored
            builder.Ignore(e => e.WorkStartDate);
            builder.Ignore(e => e.WorkEndDate);
            builder.Ignore(e => e.TotalHours);
            builder.Ignore(e => e.ClientFocusedBudgetHours);
            builder.Ignore(e => e.TechDebtBudgetHours);
            builder.Ignore(e => e.RAndDBudgetHours);
        }
    }
}
