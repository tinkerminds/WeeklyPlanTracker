using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WeeklyPlanTracker.Core.Entities;

namespace WeeklyPlanTracker.Infrastructure.Data.Configurations
{
    public class BacklogItemConfiguration : IEntityTypeConfiguration<BacklogItem>
    {
        public void Configure(EntityTypeBuilder<BacklogItem> builder)
        {
            builder.HasKey(e => e.Id);
            builder.Property(e => e.Title).IsRequired().HasMaxLength(200);
            builder.Property(e => e.Description).HasMaxLength(2000);
            builder.Property(e => e.Category).IsRequired().HasConversion<string>().HasMaxLength(20);
            builder.Property(e => e.EstimatedHours).IsRequired();
            builder.Property(e => e.IsArchived).HasDefaultValue(false);
            builder.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
        }
    }
}
