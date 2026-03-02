using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WeeklyPlanTracker.Core.Entities;

namespace WeeklyPlanTracker.Infrastructure.Data.Configurations
{
    public class WeeklyPlanMemberConfiguration : IEntityTypeConfiguration<WeeklyPlanMember>
    {
        public void Configure(EntityTypeBuilder<WeeklyPlanMember> builder)
        {
            // Composite primary key
            builder.HasKey(e => new { e.WeeklyPlanId, e.TeamMemberId });

            builder.HasOne(e => e.WeeklyPlan)
                .WithMany(wp => wp.WeeklyPlanMembers)
                .HasForeignKey(e => e.WeeklyPlanId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(e => e.TeamMember)
                .WithMany(tm => tm.WeeklyPlanMembers)
                .HasForeignKey(e => e.TeamMemberId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
