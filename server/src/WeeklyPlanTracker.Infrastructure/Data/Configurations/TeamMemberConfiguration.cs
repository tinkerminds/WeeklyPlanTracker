using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WeeklyPlanTracker.Core.Entities;

namespace WeeklyPlanTracker.Infrastructure.Data.Configurations
{
    public class TeamMemberConfiguration : IEntityTypeConfiguration<TeamMember>
    {
        public void Configure(EntityTypeBuilder<TeamMember> builder)
        {
            builder.HasKey(e => e.Id);
            builder.Property(e => e.Name).IsRequired().HasMaxLength(100);
            builder.Property(e => e.Role).IsRequired().HasConversion<string>().HasMaxLength(20);
            builder.Property(e => e.IsActive).HasDefaultValue(true);
            builder.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
        }
    }
}
