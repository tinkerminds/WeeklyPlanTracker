using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WeeklyPlanTracker.Core.Entities;
using WeeklyPlanTracker.Core.Enums;
using WeeklyPlanTracker.Infrastructure.Data;

namespace WeeklyPlanTracker.API.Controllers
{
    /// <summary>
    /// Data management endpoints: export, import, seed sample data, and reset.
    /// </summary>
    [ApiController]
    [Route("api/data")]
    public class DataController : ControllerBase
    {
        private readonly AppDbContext _db;

        public DataController(AppDbContext db)
        {
            _db = db;
        }

        // ─────────────────────────────────────────────
        // GET /api/data/export — Download all data as JSON
        // ─────────────────────────────────────────────

        [HttpGet("export")]
        public async Task<IActionResult> Export()
        {
            var teamMembers = await _db.TeamMembers.ToListAsync();
            var backlogItems = await _db.BacklogItems.ToListAsync();
            var weeklyPlans = await _db.WeeklyPlans
                .Include(w => w.WeeklyPlanMembers)
                .Select(w => new {
                    w.Id, w.PlanningDate, w.State,
                    w.ClientFocusedPercent, w.TechDebtPercent, w.RAndDPercent,
                    w.CreatedAt,
                    WeeklyPlanMembers = w.WeeklyPlanMembers.Select(m => new {
                        m.WeeklyPlanId, m.TeamMemberId, m.IsPlanningDone
                    })
                }).ToListAsync();
            var planAssignments = await _db.PlanAssignments
                .Select(a => new {
                    a.Id, a.WeeklyPlanId, a.TeamMemberId, a.BacklogItemId,
                    a.CommittedHours, a.HoursCompleted, a.Status, a.CreatedAt
                }).ToListAsync();
            var progressUpdates = await _db.ProgressUpdates.ToListAsync();

            var data = new { TeamMembers = teamMembers, BacklogItems = backlogItems, WeeklyPlans = weeklyPlans, PlanAssignments = planAssignments, ProgressUpdates = progressUpdates };
            return Ok(data);
        }

        // ─────────────────────────────────────────────
        // POST /api/data/seed — Load sample data
        // ─────────────────────────────────────────────

        [HttpPost("seed")]
        public async Task<IActionResult> Seed()
        {
            // Seed team members (add to existing data)
            // If a Lead already exists, add Alice as Member to avoid duplicate leads
            var hasLead = await _db.TeamMembers.AnyAsync(t => t.Role == MemberRole.Lead && t.IsActive);
            var aliceRole = hasLead ? MemberRole.Member : MemberRole.Lead;

            var alice = new TeamMember { Id = Guid.NewGuid(), Name = "Alice Chen", Role = aliceRole, IsActive = true, CreatedAt = DateTime.UtcNow };
            var bob = new TeamMember { Id = Guid.NewGuid(), Name = "Bob Martinez", Role = MemberRole.Member, IsActive = true, CreatedAt = DateTime.UtcNow };
            var carol = new TeamMember { Id = Guid.NewGuid(), Name = "Carol Williams", Role = MemberRole.Member, IsActive = true, CreatedAt = DateTime.UtcNow };
            var dave = new TeamMember { Id = Guid.NewGuid(), Name = "Dave Kim", Role = MemberRole.Member, IsActive = true, CreatedAt = DateTime.UtcNow };

            _db.TeamMembers.AddRange(alice, bob, carol, dave);

            // Seed backlog items
            var b1 = new BacklogItem { Id = Guid.NewGuid(), Title = "Client Onboarding Flow", Description = "Build the full onboarding experience for new clients", Category = BacklogCategory.ClientFocused, EstimatedHours = 20, CreatedAt = DateTime.UtcNow };
            var b2 = new BacklogItem { Id = Guid.NewGuid(), Title = "Fix Billing Page Bugs", Description = "Fix critical bugs on the billing page", Category = BacklogCategory.ClientFocused, EstimatedHours = 8, CreatedAt = DateTime.UtcNow };
            var b3 = new BacklogItem { Id = Guid.NewGuid(), Title = "Dashboard Redesign", Description = "Redesign the main analytics dashboard", Category = BacklogCategory.ClientFocused, EstimatedHours = 15, CreatedAt = DateTime.UtcNow };
            var b4 = new BacklogItem { Id = Guid.NewGuid(), Title = "Support Ticket Integration", Description = "Integrate with the support ticket system", Category = BacklogCategory.ClientFocused, EstimatedHours = 12, CreatedAt = DateTime.UtcNow };
            var b5 = new BacklogItem { Id = Guid.NewGuid(), Title = "Migrate to PostgreSQL", Description = "Migrate from MySQL to PostgreSQL", Category = BacklogCategory.TechDebt, EstimatedHours = 20, CreatedAt = DateTime.UtcNow };
            var b6 = new BacklogItem { Id = Guid.NewGuid(), Title = "Remove Deprecated API Endpoints", Description = "Clean up old API endpoints", Category = BacklogCategory.TechDebt, EstimatedHours = 8, CreatedAt = DateTime.UtcNow };
            var b7 = new BacklogItem { Id = Guid.NewGuid(), Title = "Add Integration Tests", Description = "Add integration tests for core modules", Category = BacklogCategory.TechDebt, EstimatedHours = 10, CreatedAt = DateTime.UtcNow };
            var b8 = new BacklogItem { Id = Guid.NewGuid(), Title = "Refactor Auth Module", Description = "Refactor the authentication module", Category = BacklogCategory.TechDebt, EstimatedHours = 12, CreatedAt = DateTime.UtcNow };
            var b9 = new BacklogItem { Id = Guid.NewGuid(), Title = "Evaluate LLM for Support", Description = "Evaluate LLM capabilities for customer support", Category = BacklogCategory.RAndD, EstimatedHours = 12, CreatedAt = DateTime.UtcNow };
            var b10 = new BacklogItem { Id = Guid.NewGuid(), Title = "Prototype Real-time Notifications", Description = "Build a prototype for real-time push notifications", Category = BacklogCategory.RAndD, EstimatedHours = 6, CreatedAt = DateTime.UtcNow };

            _db.BacklogItems.AddRange(b1, b2, b3, b4, b5, b6, b7, b8, b9, b10);

            // Seed a weekly plan in PlanningOpen state
            // Percentages: Client 50%, TechDebt 30%, R&D 20%
            // Budget hours are auto-computed from member count * 30 * percentage
            var plan = new WeeklyPlan
            {
                Id = Guid.NewGuid(),
                PlanningDate = DateTime.UtcNow,
                State = WeekState.PlanningOpen,
                ClientFocusedPercent = 50,
                TechDebtPercent = 30,
                RAndDPercent = 20,
                CreatedAt = DateTime.UtcNow,
                WeeklyPlanMembers = new List<WeeklyPlanMember>
                {
                    new WeeklyPlanMember { TeamMemberId = bob.Id, IsPlanningDone = true },
                    new WeeklyPlanMember { TeamMemberId = carol.Id, IsPlanningDone = false },
                    new WeeklyPlanMember { TeamMemberId = dave.Id, IsPlanningDone = true }
                }
            };
            _db.WeeklyPlans.Add(plan);

            // Seed plan assignments (distribute work across members)
            var assignments = new[]
            {
                // Bob: 30h total — Client 15h, TechDebt 10h, R&D 5h
                new PlanAssignment { Id = Guid.NewGuid(), WeeklyPlanId = plan.Id, TeamMemberId = bob.Id, BacklogItemId = b1.Id, CommittedHours = 15, Status = AssignmentStatus.NotStarted, CreatedAt = DateTime.UtcNow },
                new PlanAssignment { Id = Guid.NewGuid(), WeeklyPlanId = plan.Id, TeamMemberId = bob.Id, BacklogItemId = b5.Id, CommittedHours = 10, Status = AssignmentStatus.NotStarted, CreatedAt = DateTime.UtcNow },
                new PlanAssignment { Id = Guid.NewGuid(), WeeklyPlanId = plan.Id, TeamMemberId = bob.Id, BacklogItemId = b10.Id, CommittedHours = 5, Status = AssignmentStatus.NotStarted, CreatedAt = DateTime.UtcNow },
                // Carol: 30h total — Client 15h, TechDebt 8h, R&D 7h
                new PlanAssignment { Id = Guid.NewGuid(), WeeklyPlanId = plan.Id, TeamMemberId = carol.Id, BacklogItemId = b3.Id, CommittedHours = 15, Status = AssignmentStatus.NotStarted, CreatedAt = DateTime.UtcNow },
                new PlanAssignment { Id = Guid.NewGuid(), WeeklyPlanId = plan.Id, TeamMemberId = carol.Id, BacklogItemId = b6.Id, CommittedHours = 8, Status = AssignmentStatus.NotStarted, CreatedAt = DateTime.UtcNow },
                new PlanAssignment { Id = Guid.NewGuid(), WeeklyPlanId = plan.Id, TeamMemberId = carol.Id, BacklogItemId = b9.Id, CommittedHours = 7, Status = AssignmentStatus.NotStarted, CreatedAt = DateTime.UtcNow },
                // Dave: 30h total — Client 15h, TechDebt 9h, R&D 6h
                new PlanAssignment { Id = Guid.NewGuid(), WeeklyPlanId = plan.Id, TeamMemberId = dave.Id, BacklogItemId = b4.Id, CommittedHours = 12, Status = AssignmentStatus.NotStarted, CreatedAt = DateTime.UtcNow },
                new PlanAssignment { Id = Guid.NewGuid(), WeeklyPlanId = plan.Id, TeamMemberId = dave.Id, BacklogItemId = b2.Id, CommittedHours = 3, Status = AssignmentStatus.NotStarted, CreatedAt = DateTime.UtcNow },
                new PlanAssignment { Id = Guid.NewGuid(), WeeklyPlanId = plan.Id, TeamMemberId = dave.Id, BacklogItemId = b7.Id, CommittedHours = 9, Status = AssignmentStatus.NotStarted, CreatedAt = DateTime.UtcNow },
                new PlanAssignment { Id = Guid.NewGuid(), WeeklyPlanId = plan.Id, TeamMemberId = dave.Id, BacklogItemId = b10.Id, CommittedHours = 6, Status = AssignmentStatus.NotStarted, CreatedAt = DateTime.UtcNow },
            };
            _db.PlanAssignments.AddRange(assignments);

            await _db.SaveChangesAsync();

            return Ok(new { message = "Sample data loaded!" });
        }

        // ─────────────────────────────────────────────
        // POST /api/data/import — Import data from JSON
        // ─────────────────────────────────────────────

        [HttpPost("import")]
        public async Task<IActionResult> Import([FromBody] ImportDataRequest data)
        {
            // Clear existing data
            _db.ProgressUpdates.RemoveRange(_db.ProgressUpdates);
            _db.PlanAssignments.RemoveRange(_db.PlanAssignments);
            _db.Set<WeeklyPlanMember>().RemoveRange(_db.Set<WeeklyPlanMember>());
            _db.WeeklyPlans.RemoveRange(_db.WeeklyPlans);
            _db.BacklogItems.RemoveRange(_db.BacklogItems);
            _db.TeamMembers.RemoveRange(_db.TeamMembers);
            await _db.SaveChangesAsync();

            // Import
            if (data.TeamMembers != null)
                _db.TeamMembers.AddRange(data.TeamMembers);
            if (data.BacklogItems != null)
                _db.BacklogItems.AddRange(data.BacklogItems);
            if (data.WeeklyPlans != null)
                _db.WeeklyPlans.AddRange(data.WeeklyPlans);
            if (data.PlanAssignments != null)
                _db.PlanAssignments.AddRange(data.PlanAssignments);
            if (data.ProgressUpdates != null)
                _db.ProgressUpdates.AddRange(data.ProgressUpdates);

            await _db.SaveChangesAsync();

            return Ok(new { message = "Data restored from file!" });
        }

        // ─────────────────────────────────────────────
        // DELETE /api/data/reset — Wipe all data
        // ─────────────────────────────────────────────

        [HttpDelete("reset")]
        public async Task<IActionResult> Reset()
        {
            _db.ProgressUpdates.RemoveRange(_db.ProgressUpdates);
            _db.PlanAssignments.RemoveRange(_db.PlanAssignments);
            _db.Set<WeeklyPlanMember>().RemoveRange(_db.Set<WeeklyPlanMember>());
            _db.WeeklyPlans.RemoveRange(_db.WeeklyPlans);
            _db.BacklogItems.RemoveRange(_db.BacklogItems);
            _db.TeamMembers.RemoveRange(_db.TeamMembers);
            await _db.SaveChangesAsync();

            return Ok(new { message = "All data reset." });
        }
    }

    /// <summary>Import request containing all entity collections.</summary>
    public class ImportDataRequest
    {
        public List<TeamMember>? TeamMembers { get; set; }
        public List<BacklogItem>? BacklogItems { get; set; }
        public List<WeeklyPlan>? WeeklyPlans { get; set; }
        public List<PlanAssignment>? PlanAssignments { get; set; }
        public List<ProgressUpdate>? ProgressUpdates { get; set; }
    }
}
