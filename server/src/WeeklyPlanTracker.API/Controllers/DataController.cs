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
            try
            {
                var teamMembers = await _db.TeamMembers.AsNoTracking()
                    .Select(t => new { t.Id, t.Name, t.Role, t.IsActive, t.CreatedAt }).ToListAsync();
                var backlogItems = await _db.BacklogItems.AsNoTracking()
                    .Select(b => new { b.Id, b.Title, b.Description, b.Category, b.EstimatedHours, b.IsArchived, b.CreatedAt }).ToListAsync();
                var weeklyPlans = await _db.WeeklyPlans.AsNoTracking()
                    .Select(w => new { w.Id, w.PlanningDate, w.WorkStartDate, w.WorkEndDate, w.State, w.ClientFocusedPercent, w.TechDebtPercent, w.RAndDPercent, w.CreatedAt }).ToListAsync();
                var weeklyPlanMembers = await _db.Set<WeeklyPlanMember>().AsNoTracking()
                    .Select(m => new { m.WeeklyPlanId, m.TeamMemberId, m.IsPlanningDone }).ToListAsync();
                var planAssignments = await _db.PlanAssignments.AsNoTracking()
                    .Select(a => new { a.Id, a.WeeklyPlanId, a.TeamMemberId, a.BacklogItemId, a.CommittedHours, a.HoursCompleted, a.Status, a.CreatedAt }).ToListAsync();
                var progressUpdates = await _db.ProgressUpdates.AsNoTracking()
                    .Select(p => new { p.Id, p.PlanAssignmentId, p.HoursDone, p.Status, p.Notes, p.Timestamp }).ToListAsync();

                return Ok(new { TeamMembers = teamMembers, BacklogItems = backlogItems, WeeklyPlans = weeklyPlans, WeeklyPlanMembers = weeklyPlanMembers, PlanAssignments = planAssignments, ProgressUpdates = progressUpdates });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // ─────────────────────────────────────────────
        // POST /api/data/seed — Load sample data
        // ─────────────────────────────────────────────

        [HttpPost("seed")]
        public async Task<IActionResult> Seed()
        {
            // ── Step 1: Clear all existing data ──
            _db.ProgressUpdates.RemoveRange(_db.ProgressUpdates);
            _db.PlanAssignments.RemoveRange(_db.PlanAssignments);
            _db.Set<WeeklyPlanMember>().RemoveRange(_db.Set<WeeklyPlanMember>());
            _db.WeeklyPlans.RemoveRange(_db.WeeklyPlans);
            _db.BacklogItems.RemoveRange(_db.BacklogItems);
            _db.TeamMembers.RemoveRange(_db.TeamMembers);
            await _db.SaveChangesAsync();

            // ── Step 2: Seed team members ──
            var alice = new TeamMember { Id = Guid.NewGuid(), Name = "Alice Chen", Role = MemberRole.Lead, IsActive = true, CreatedAt = DateTime.UtcNow };
            var bob = new TeamMember { Id = Guid.NewGuid(), Name = "Bob Martinez", Role = MemberRole.Member, IsActive = true, CreatedAt = DateTime.UtcNow };
            var carol = new TeamMember { Id = Guid.NewGuid(), Name = "Carol Williams", Role = MemberRole.Member, IsActive = true, CreatedAt = DateTime.UtcNow };
            var dave = new TeamMember { Id = Guid.NewGuid(), Name = "Dave Kim", Role = MemberRole.Member, IsActive = true, CreatedAt = DateTime.UtcNow };

            _db.TeamMembers.AddRange(alice, bob, carol, dave);

            // ── Step 3: Seed backlog items ──
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

            // ── Step 4: Seed weekly plan with ALL 4 members ──
            // Percentages: Client 50%, TechDebt 30%, R&D 20%
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
                    new WeeklyPlanMember { TeamMemberId = alice.Id, IsPlanningDone = false },
                    new WeeklyPlanMember { TeamMemberId = bob.Id, IsPlanningDone = true },
                    new WeeklyPlanMember { TeamMemberId = carol.Id, IsPlanningDone = false },
                    new WeeklyPlanMember { TeamMemberId = dave.Id, IsPlanningDone = true }
                }
            };
            _db.WeeklyPlans.Add(plan);

            // ── Step 5: Seed plan assignments — each member gets exactly 30h ──
            var assignments = new[]
            {
                // Alice (Lead): 30h — Client 15h, TechDebt 9h, R&D 6h
                new PlanAssignment { Id = Guid.NewGuid(), WeeklyPlanId = plan.Id, TeamMemberId = alice.Id, BacklogItemId = b4.Id, CommittedHours = 15, Status = AssignmentStatus.NotStarted, CreatedAt = DateTime.UtcNow },
                new PlanAssignment { Id = Guid.NewGuid(), WeeklyPlanId = plan.Id, TeamMemberId = alice.Id, BacklogItemId = b8.Id, CommittedHours = 9, Status = AssignmentStatus.NotStarted, CreatedAt = DateTime.UtcNow },
                new PlanAssignment { Id = Guid.NewGuid(), WeeklyPlanId = plan.Id, TeamMemberId = alice.Id, BacklogItemId = b10.Id, CommittedHours = 6, Status = AssignmentStatus.NotStarted, CreatedAt = DateTime.UtcNow },
                // Bob: 30h — Client 15h, TechDebt 10h, R&D 5h
                new PlanAssignment { Id = Guid.NewGuid(), WeeklyPlanId = plan.Id, TeamMemberId = bob.Id, BacklogItemId = b1.Id, CommittedHours = 15, Status = AssignmentStatus.NotStarted, CreatedAt = DateTime.UtcNow },
                new PlanAssignment { Id = Guid.NewGuid(), WeeklyPlanId = plan.Id, TeamMemberId = bob.Id, BacklogItemId = b5.Id, CommittedHours = 10, Status = AssignmentStatus.NotStarted, CreatedAt = DateTime.UtcNow },
                new PlanAssignment { Id = Guid.NewGuid(), WeeklyPlanId = plan.Id, TeamMemberId = bob.Id, BacklogItemId = b10.Id, CommittedHours = 5, Status = AssignmentStatus.NotStarted, CreatedAt = DateTime.UtcNow },
                // Carol: 30h — Client 15h, TechDebt 8h, R&D 7h
                new PlanAssignment { Id = Guid.NewGuid(), WeeklyPlanId = plan.Id, TeamMemberId = carol.Id, BacklogItemId = b3.Id, CommittedHours = 15, Status = AssignmentStatus.NotStarted, CreatedAt = DateTime.UtcNow },
                new PlanAssignment { Id = Guid.NewGuid(), WeeklyPlanId = plan.Id, TeamMemberId = carol.Id, BacklogItemId = b6.Id, CommittedHours = 8, Status = AssignmentStatus.NotStarted, CreatedAt = DateTime.UtcNow },
                new PlanAssignment { Id = Guid.NewGuid(), WeeklyPlanId = plan.Id, TeamMemberId = carol.Id, BacklogItemId = b9.Id, CommittedHours = 7, Status = AssignmentStatus.NotStarted, CreatedAt = DateTime.UtcNow },
                // Dave: 30h — Client 15h, TechDebt 9h, R&D 6h
                new PlanAssignment { Id = Guid.NewGuid(), WeeklyPlanId = plan.Id, TeamMemberId = dave.Id, BacklogItemId = b2.Id, CommittedHours = 3, Status = AssignmentStatus.NotStarted, CreatedAt = DateTime.UtcNow },
                new PlanAssignment { Id = Guid.NewGuid(), WeeklyPlanId = plan.Id, TeamMemberId = dave.Id, BacklogItemId = b4.Id, CommittedHours = 12, Status = AssignmentStatus.NotStarted, CreatedAt = DateTime.UtcNow },
                new PlanAssignment { Id = Guid.NewGuid(), WeeklyPlanId = plan.Id, TeamMemberId = dave.Id, BacklogItemId = b7.Id, CommittedHours = 9, Status = AssignmentStatus.NotStarted, CreatedAt = DateTime.UtcNow },
                new PlanAssignment { Id = Guid.NewGuid(), WeeklyPlanId = plan.Id, TeamMemberId = dave.Id, BacklogItemId = b10.Id, CommittedHours = 6, Status = AssignmentStatus.NotStarted, CreatedAt = DateTime.UtcNow },
            };
            _db.PlanAssignments.AddRange(assignments);

            await _db.SaveChangesAsync();

            return Ok(new { message = "All previous data cleared. Fresh sample data loaded with 4 team members, 10 backlog items, and a weekly plan!" });
        }

        // ─────────────────────────────────────────────
        // POST /api/data/import — Import data from JSON
        // ─────────────────────────────────────────────

        [HttpPost("import")]
        public async Task<IActionResult> Import([FromBody] System.Text.Json.JsonElement data)
        {
            try
            {
                var opts = new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                opts.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());

                // Clear existing data
                _db.ProgressUpdates.RemoveRange(_db.ProgressUpdates);
                _db.PlanAssignments.RemoveRange(_db.PlanAssignments);
                _db.Set<WeeklyPlanMember>().RemoveRange(_db.Set<WeeklyPlanMember>());
                _db.WeeklyPlans.RemoveRange(_db.WeeklyPlans);
                _db.BacklogItems.RemoveRange(_db.BacklogItems);
                _db.TeamMembers.RemoveRange(_db.TeamMembers);
                await _db.SaveChangesAsync();

                // Import each collection
                if (data.TryGetProperty("teamMembers", out var tm) || data.TryGetProperty("TeamMembers", out tm))
                {
                    var items = System.Text.Json.JsonSerializer.Deserialize<List<TeamMember>>(tm.GetRawText(), opts);
                    if (items != null) _db.TeamMembers.AddRange(items);
                }

                if (data.TryGetProperty("backlogItems", out var bi) || data.TryGetProperty("BacklogItems", out bi))
                {
                    var items = System.Text.Json.JsonSerializer.Deserialize<List<BacklogItem>>(bi.GetRawText(), opts);
                    if (items != null) _db.BacklogItems.AddRange(items);
                }

                if (data.TryGetProperty("weeklyPlans", out var wp) || data.TryGetProperty("WeeklyPlans", out wp))
                {
                    var items = System.Text.Json.JsonSerializer.Deserialize<List<WeeklyPlan>>(wp.GetRawText(), opts);
                    if (items != null)
                    {
                        // Clear navigation properties to avoid tracking conflicts
                        foreach (var p in items) { p.WeeklyPlanMembers = new List<WeeklyPlanMember>(); p.PlanAssignments = new List<PlanAssignment>(); }
                        _db.WeeklyPlans.AddRange(items);
                    }
                }

                if (data.TryGetProperty("weeklyPlanMembers", out var wpm) || data.TryGetProperty("WeeklyPlanMembers", out wpm))
                {
                    var items = System.Text.Json.JsonSerializer.Deserialize<List<WeeklyPlanMember>>(wpm.GetRawText(), opts);
                    if (items != null)
                    {
                        foreach (var m in items) { m.TeamMember = null!; m.WeeklyPlan = null!; }
                        _db.Set<WeeklyPlanMember>().AddRange(items);
                    }
                }

                if (data.TryGetProperty("planAssignments", out var pa) || data.TryGetProperty("PlanAssignments", out pa))
                {
                    var items = System.Text.Json.JsonSerializer.Deserialize<List<PlanAssignment>>(pa.GetRawText(), opts);
                    if (items != null)
                    {
                        foreach (var a in items) { a.TeamMember = null!; a.BacklogItem = null!; a.WeeklyPlan = null!; a.ProgressUpdates = new List<ProgressUpdate>(); }
                        _db.PlanAssignments.AddRange(items);
                    }
                }

                if (data.TryGetProperty("progressUpdates", out var pu) || data.TryGetProperty("ProgressUpdates", out pu))
                {
                    var items = System.Text.Json.JsonSerializer.Deserialize<List<ProgressUpdate>>(pu.GetRawText(), opts);
                    if (items != null)
                    {
                        foreach (var p in items) { p.PlanAssignment = null!; }
                        _db.ProgressUpdates.AddRange(items);
                    }
                }

                await _db.SaveChangesAsync();
                return Ok(new { message = "Data restored from file!" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message, detail = ex.InnerException?.Message });
            }
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
}
