using Microsoft.AspNetCore.Mvc;
using WeeklyPlanTracker.API.DTOs;
using WeeklyPlanTracker.Core.Entities;
using WeeklyPlanTracker.Core.Enums;
using WeeklyPlanTracker.Core.Interfaces;

namespace WeeklyPlanTracker.API.Controllers
{
    /// <summary>
    /// REST API for managing the weekly planning lifecycle.
    /// Implements the state machine: Setup → PlanningOpen → Frozen → Completed.
    /// </summary>
    [ApiController]
    [Route("api/weekly-plans")]
    public class WeeklyPlansController : ControllerBase
    {
        private readonly IUnitOfWork _unitOfWork;

        public WeeklyPlansController(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        // ─────────────────────────────────────────────
        // GET endpoints
        // ─────────────────────────────────────────────

        /// <summary>GET /api/weekly-plans/current — Get the active (non-completed) weekly plan.</summary>
        [HttpGet("current")]
        public async Task<ActionResult<WeeklyPlanResponse?>> GetCurrent()
        {
            var plan = await _unitOfWork.WeeklyPlans.GetCurrentAsync();
            if (plan == null)
                return Ok((WeeklyPlanResponse?)null);

            return Ok(MapToDetailResponse(plan));
        }

        /// <summary>GET /api/weekly-plans/past — Get all completed weekly plans.</summary>
        [HttpGet("past")]
        public async Task<ActionResult<IEnumerable<WeeklyPlanResponse>>> GetPast()
        {
            var plans = await _unitOfWork.WeeklyPlans.GetCompletedAsync();
            return Ok(plans.Select(MapToResponse));
        }

        // ─────────────────────────────────────────────
        // POST — Start a new week
        // ─────────────────────────────────────────────

        /// <summary>POST /api/weekly-plans — Start a new week (creates Setup state).</summary>
        [HttpPost]
        public async Task<ActionResult<WeeklyPlanResponse>> Create([FromBody] CreateWeeklyPlanRequest request)
        {
            // Cannot have two active plans at once
            var existingPlan = await _unitOfWork.WeeklyPlans.GetCurrentAsync();
            if (existingPlan != null)
                return BadRequest("An active weekly plan already exists. Complete or cancel it first.");

            // Validate date is a Tuesday
            if (request.PlanningDate.DayOfWeek != DayOfWeek.Tuesday)
                return BadRequest("Planning date must be a Tuesday.");

            var plan = new WeeklyPlan
            {
                Id = Guid.NewGuid(),
                PlanningDate = request.PlanningDate.Date,
                State = WeekState.Setup,
                ClientFocusedPercent = 0,
                TechDebtPercent = 0,
                RAndDPercent = 0,
                CreatedAt = DateTime.UtcNow
            };

            await _unitOfWork.WeeklyPlans.AddAsync(plan);
            await _unitOfWork.SaveChangesAsync();

            return CreatedAtAction(nameof(GetCurrent), MapToResponse(plan));
        }

        // ─────────────────────────────────────────────
        // PUT — Configure / transition state
        // ─────────────────────────────────────────────

        /// <summary>PUT /api/weekly-plans/{id}/setup — Configure plan (members, date, percentages).</summary>
        [HttpPut("{id:guid}/setup")]
        public async Task<ActionResult<WeeklyPlanResponse>> Setup(Guid id, [FromBody] SetupWeeklyPlanRequest request)
        {
            var plan = await _unitOfWork.WeeklyPlans.GetWithDetailsAsync(id);
            if (plan == null)
                return NotFound();

            if (plan.State != WeekState.Setup)
                return BadRequest("Plan can only be configured during the Setup state.");

            // Validate date is a Tuesday
            if (request.PlanningDate.DayOfWeek != DayOfWeek.Tuesday)
                return BadRequest("Planning date must be a Tuesday.");

            // Validate percentages sum to 100
            var totalPercent = request.ClientFocusedPercent + request.TechDebtPercent + request.RAndDPercent;
            if (totalPercent != 100)
                return BadRequest($"Category percentages must total exactly 100%. Current total: {totalPercent}%.");

            // Validate at least one member selected
            if (request.SelectedMemberIds == null || request.SelectedMemberIds.Count == 0)
                return BadRequest("At least one team member must be selected.");

            // Validate all selected members exist and are active
            foreach (var memberId in request.SelectedMemberIds)
            {
                var member = await _unitOfWork.TeamMembers.GetByIdAsync(memberId);
                if (member == null || !member.IsActive)
                    return BadRequest($"Team member with ID {memberId} not found or inactive.");
            }

            // Update plan fields
            plan.PlanningDate = request.PlanningDate.Date;
            plan.ClientFocusedPercent = request.ClientFocusedPercent;
            plan.TechDebtPercent = request.TechDebtPercent;
            plan.RAndDPercent = request.RAndDPercent;

            // Clear existing members and set new ones
            plan.WeeklyPlanMembers.Clear();
            foreach (var memberId in request.SelectedMemberIds)
            {
                plan.WeeklyPlanMembers.Add(new WeeklyPlanMember
                {
                    WeeklyPlanId = plan.Id,
                    TeamMemberId = memberId
                });
            }

            _unitOfWork.WeeklyPlans.Update(plan);
            await _unitOfWork.SaveChangesAsync();

            // Re-fetch with full details for response
            var updated = await _unitOfWork.WeeklyPlans.GetWithDetailsAsync(id);
            return Ok(MapToDetailResponse(updated!));
        }

        /// <summary>PUT /api/weekly-plans/{id}/open-planning — Transition Setup → PlanningOpen.</summary>
        [HttpPut("{id:guid}/open-planning")]
        public async Task<ActionResult<WeeklyPlanResponse>> OpenPlanning(Guid id)
        {
            var plan = await _unitOfWork.WeeklyPlans.GetWithDetailsAsync(id);
            if (plan == null)
                return NotFound();

            if (plan.State != WeekState.Setup)
                return BadRequest("Planning can only be opened from the Setup state.");

            // Validate: at least one member selected
            if (plan.WeeklyPlanMembers.Count == 0)
                return BadRequest("At least one team member must be selected before opening planning.");

            // Validate: percentages sum to 100
            var totalPercent = plan.ClientFocusedPercent + plan.TechDebtPercent + plan.RAndDPercent;
            if (totalPercent != 100)
                return BadRequest($"Category percentages must total exactly 100%. Current total: {totalPercent}%.");

            plan.State = WeekState.PlanningOpen;
            _unitOfWork.WeeklyPlans.Update(plan);
            await _unitOfWork.SaveChangesAsync();

            return Ok(MapToDetailResponse(plan));
        }

        /// <summary>PUT /api/weekly-plans/{id}/freeze — Freeze the plan (validates all rules first).</summary>
        [HttpPut("{id:guid}/freeze")]
        public async Task<ActionResult<WeeklyPlanResponse>> Freeze(Guid id)
        {
            var plan = await _unitOfWork.WeeklyPlans.GetWithDetailsAsync(id);
            if (plan == null)
                return NotFound();

            if (plan.State != WeekState.PlanningOpen)
                return BadRequest("Plan can only be frozen from the PlanningOpen state.");

            // ── Freeze validation ──
            var issues = new List<string>();

            // 1. Every selected member must have exactly 30 hours committed
            foreach (var wpm in plan.WeeklyPlanMembers)
            {
                var memberHours = plan.PlanAssignments
                    .Where(pa => pa.TeamMemberId == wpm.TeamMemberId)
                    .Sum(pa => pa.CommittedHours);

                if (memberHours != 30)
                {
                    var memberName = wpm.TeamMember?.Name ?? wpm.TeamMemberId.ToString();
                    issues.Add($"{memberName} has {memberHours} hours (needs {30 - memberHours} more).");
                }
            }

            // 2. Category totals must match budget hours
            var clientPlanned = plan.PlanAssignments
                .Where(pa => pa.BacklogItem?.Category == BacklogCategory.ClientFocused)
                .Sum(pa => pa.CommittedHours);
            if (clientPlanned != plan.ClientFocusedBudgetHours)
                issues.Add($"Client Focused has {clientPlanned}h planned but budget is {plan.ClientFocusedBudgetHours}h.");

            var techDebtPlanned = plan.PlanAssignments
                .Where(pa => pa.BacklogItem?.Category == BacklogCategory.TechDebt)
                .Sum(pa => pa.CommittedHours);
            if (techDebtPlanned != plan.TechDebtBudgetHours)
                issues.Add($"Tech Debt has {techDebtPlanned}h planned but budget is {plan.TechDebtBudgetHours}h.");

            var rndPlanned = plan.PlanAssignments
                .Where(pa => pa.BacklogItem?.Category == BacklogCategory.RAndD)
                .Sum(pa => pa.CommittedHours);
            if (rndPlanned != plan.RAndDBudgetHours)
                issues.Add($"R&D has {rndPlanned}h planned but budget is {plan.RAndDBudgetHours}h.");

            if (issues.Count > 0)
                return BadRequest(new { message = "Can't freeze yet:", issues });

            // All validations passed — freeze the plan
            plan.State = WeekState.Frozen;
            _unitOfWork.WeeklyPlans.Update(plan);
            await _unitOfWork.SaveChangesAsync();

            return Ok(MapToDetailResponse(plan));
        }

        /// <summary>PUT /api/weekly-plans/{id}/complete — Mark week as completed.</summary>
        [HttpPut("{id:guid}/complete")]
        public async Task<ActionResult<WeeklyPlanResponse>> Complete(Guid id)
        {
            var plan = await _unitOfWork.WeeklyPlans.GetWithDetailsAsync(id);
            if (plan == null)
                return NotFound();

            if (plan.State != WeekState.Frozen)
                return BadRequest("Only a frozen plan can be completed.");

            plan.State = WeekState.Completed;
            _unitOfWork.WeeklyPlans.Update(plan);
            await _unitOfWork.SaveChangesAsync();

            return Ok(MapToDetailResponse(plan));
        }

        // ─────────────────────────────────────────────
        // DELETE — Cancel planning
        // ─────────────────────────────────────────────

        /// <summary>DELETE /api/weekly-plans/{id} — Cancel the week's planning.</summary>
        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Cancel(Guid id)
        {
            var plan = await _unitOfWork.WeeklyPlans.GetWithDetailsAsync(id);
            if (plan == null)
                return NotFound();

            if (plan.State != WeekState.Setup && plan.State != WeekState.PlanningOpen)
                return BadRequest("Only plans in Setup or PlanningOpen state can be cancelled.");

            // Remove all assignments for this plan
            foreach (var assignment in plan.PlanAssignments.ToList())
            {
                _unitOfWork.PlanAssignments.Remove(assignment);
            }

            // Remove the plan (EF will cascade-delete WeeklyPlanMembers via the relationship)
            _unitOfWork.WeeklyPlans.Remove(plan);
            await _unitOfWork.SaveChangesAsync();

            return NoContent();
        }

        // ─────────────────────────────────────────────
        // PUT — Toggle planning done status
        // ─────────────────────────────────────────────

        /// <summary>PUT /api/weekly-plans/{id}/members/{memberId}/toggle-planning-done</summary>
        [HttpPut("{id:guid}/members/{memberId:guid}/toggle-planning-done")]
        public async Task<ActionResult<object>> TogglePlanningDone(Guid id, Guid memberId)
        {
            var plan = await _unitOfWork.WeeklyPlans.GetWithDetailsAsync(id);
            if (plan == null)
                return NotFound();

            var wpm = plan.WeeklyPlanMembers.FirstOrDefault(m => m.TeamMemberId == memberId);
            if (wpm == null)
                return NotFound("Member not found in this plan.");

            wpm.IsPlanningDone = !wpm.IsPlanningDone;
            _unitOfWork.WeeklyPlans.Update(plan);
            await _unitOfWork.SaveChangesAsync();

            return Ok(new { isPlanningDone = wpm.IsPlanningDone });
        }

        // ─────────────────────────────────────────────
        // Mapping helpers
        // ─────────────────────────────────────────────

        /// <summary>Maps a WeeklyPlan entity to a basic response DTO.</summary>
        private static WeeklyPlanResponse MapToResponse(WeeklyPlan plan) => new()
        {
            Id = plan.Id,
            PlanningDate = plan.PlanningDate,
            WorkStartDate = plan.WorkStartDate,
            WorkEndDate = plan.WorkEndDate,
            State = plan.State,
            ClientFocusedPercent = plan.ClientFocusedPercent,
            TechDebtPercent = plan.TechDebtPercent,
            RAndDPercent = plan.RAndDPercent,
            CreatedAt = plan.CreatedAt,
            MemberCount = plan.WeeklyPlanMembers.Count,
            TotalHours = plan.TotalHours,
            ClientFocusedBudgetHours = plan.ClientFocusedBudgetHours,
            TechDebtBudgetHours = plan.TechDebtBudgetHours,
            RAndDBudgetHours = plan.RAndDBudgetHours
        };

        /// <summary>Maps a WeeklyPlan entity to a detailed response with members and assignments.</summary>
        private static WeeklyPlanResponse MapToDetailResponse(WeeklyPlan plan)
        {
            var response = MapToResponse(plan);

            response.Members = plan.WeeklyPlanMembers
                .Where(wpm => wpm.TeamMember != null)
                .Select(wpm => new WeeklyPlanMemberResponse
                {
                    Id = wpm.TeamMemberId,
                    Name = wpm.TeamMember.Name,
                    Role = wpm.TeamMember.Role,
                    IsPlanningDone = wpm.IsPlanningDone
                })
                .ToList();

            response.Assignments = plan.PlanAssignments
                .Select(pa => new PlanAssignmentSummaryResponse
                {
                    Id = pa.Id,
                    TeamMemberId = pa.TeamMemberId,
                    TeamMemberName = pa.TeamMember?.Name ?? "",
                    BacklogItemId = pa.BacklogItemId,
                    BacklogItemTitle = pa.BacklogItem?.Title ?? "",
                    BacklogItemCategory = pa.BacklogItem?.Category ?? BacklogCategory.ClientFocused,
                    CommittedHours = pa.CommittedHours,
                    HoursCompleted = pa.HoursCompleted,
                    Status = pa.Status
                })
                .ToList();

            return response;
        }
    }
}
