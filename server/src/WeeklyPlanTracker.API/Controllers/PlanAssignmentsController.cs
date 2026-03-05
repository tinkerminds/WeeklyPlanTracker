using Microsoft.AspNetCore.Mvc;
using WeeklyPlanTracker.API.DTOs;
using WeeklyPlanTracker.Core.Entities;
using WeeklyPlanTracker.Core.Enums;
using WeeklyPlanTracker.Core.Interfaces;

namespace WeeklyPlanTracker.API.Controllers
{
    /// <summary>
    /// REST API for managing plan assignments — adding, updating, and removing
    /// backlog items from a team member's weekly plan.
    /// </summary>
    [ApiController]
    [Route("api/plan-assignments")]
    public class PlanAssignmentsController : ControllerBase
    {
        private readonly IUnitOfWork _unitOfWork;

        public PlanAssignmentsController(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        // ─────────────────────────────────────────────
        // GET endpoints
        // ─────────────────────────────────────────────

        /// <summary>GET /api/plan-assignments/week/{weeklyPlanId} — All assignments for a weekly plan.</summary>
        [HttpGet("week/{weeklyPlanId:guid}")]
        public async Task<ActionResult<IEnumerable<PlanAssignmentResponse>>> GetByWeek(Guid weeklyPlanId)
        {
            var assignments = await _unitOfWork.PlanAssignments.GetByWeekWithDetailsAsync(weeklyPlanId);
            return Ok(assignments.Select(MapToResponse));
        }

        /// <summary>GET /api/plan-assignments/week/{weeklyPlanId}/member/{memberId} — Assignments for a specific member in a week.</summary>
        [HttpGet("week/{weeklyPlanId:guid}/member/{memberId:guid}")]
        public async Task<ActionResult<IEnumerable<PlanAssignmentResponse>>> GetByWeekAndMember(Guid weeklyPlanId, Guid memberId)
        {
            var assignments = await _unitOfWork.PlanAssignments.GetByWeekAndMemberAsync(weeklyPlanId, memberId);
            return Ok(assignments.Select(MapToResponse));
        }

        /// <summary>GET /api/plan-assignments/{id} — Get a single assignment with details.</summary>
        [HttpGet("{id:guid}")]
        public async Task<ActionResult<PlanAssignmentResponse>> GetById(Guid id)
        {
            var assignment = await _unitOfWork.PlanAssignments.GetWithDetailsAsync(id);
            if (assignment == null)
                return NotFound();

            return Ok(MapToResponse(assignment));
        }

        // ─────────────────────────────────────────────
        // POST — Add an item to a member's plan
        // ─────────────────────────────────────────────

        /// <summary>POST /api/plan-assignments — Assign a backlog item to a member's weekly plan.</summary>
        [HttpPost]
        public async Task<ActionResult<PlanAssignmentResponse>> Create([FromBody] CreatePlanAssignmentRequest request)
        {
            // Validate the weekly plan exists and is in PlanningOpen state
            var plan = await _unitOfWork.WeeklyPlans.GetWithDetailsAsync(request.WeeklyPlanId);
            if (plan == null)
                return NotFound("Weekly plan not found.");

            if (plan.State != WeekState.PlanningOpen)
                return BadRequest("Assignments can only be added when planning is open.");

            // Validate the member is part of this plan
            if (!plan.WeeklyPlanMembers.Any(wpm => wpm.TeamMemberId == request.TeamMemberId))
                return BadRequest("This team member is not part of the weekly plan.");

            // Validate the backlog item exists
            var backlogItem = await _unitOfWork.BacklogItems.GetByIdAsync(request.BacklogItemId);
            if (backlogItem == null)
                return NotFound("Backlog item not found.");

            // Validate committed hours > 0
            if (request.CommittedHours <= 0)
                return BadRequest("Committed hours must be greater than 0.");

            var assignment = new PlanAssignment
            {
                Id = Guid.NewGuid(),
                WeeklyPlanId = request.WeeklyPlanId,
                TeamMemberId = request.TeamMemberId,
                BacklogItemId = request.BacklogItemId,
                CommittedHours = request.CommittedHours,
                Status = AssignmentStatus.NotStarted,
                CreatedAt = DateTime.UtcNow
            };

            await _unitOfWork.PlanAssignments.AddAsync(assignment);
            await _unitOfWork.SaveChangesAsync();

            // Re-fetch with details for the response
            var created = await _unitOfWork.PlanAssignments.GetWithDetailsAsync(assignment.Id);
            return CreatedAtAction(nameof(GetById), new { id = assignment.Id }, MapToResponse(created!));
        }

        // ─────────────────────────────────────────────
        // PUT — Update committed hours
        // ─────────────────────────────────────────────

        /// <summary>PUT /api/plan-assignments/{id} — Update committed hours on an assignment.</summary>
        [HttpPut("{id:guid}")]
        public async Task<ActionResult<PlanAssignmentResponse>> Update(Guid id, [FromBody] UpdatePlanAssignmentRequest request)
        {
            var assignment = await _unitOfWork.PlanAssignments.GetWithDetailsAsync(id);
            if (assignment == null)
                return NotFound();

            // Validate the plan is still in PlanningOpen state
            var plan = await _unitOfWork.WeeklyPlans.GetByIdAsync(assignment.WeeklyPlanId);
            if (plan == null || plan.State != WeekState.PlanningOpen)
                return BadRequest("Assignments can only be updated when planning is open.");

            if (request.CommittedHours <= 0)
                return BadRequest("Committed hours must be greater than 0.");

            assignment.CommittedHours = request.CommittedHours;
            _unitOfWork.PlanAssignments.Update(assignment);
            await _unitOfWork.SaveChangesAsync();

            // Re-fetch with details
            var updated = await _unitOfWork.PlanAssignments.GetWithDetailsAsync(id);
            return Ok(MapToResponse(updated!));
        }

        // ─────────────────────────────────────────────
        // DELETE — Remove an assignment
        // ─────────────────────────────────────────────

        /// <summary>DELETE /api/plan-assignments/{id} — Remove an assignment from the plan.</summary>
        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var assignment = await _unitOfWork.PlanAssignments.GetWithDetailsAsync(id);
            if (assignment == null)
                return NotFound();

            // Validate the plan is still in PlanningOpen state
            var plan = await _unitOfWork.WeeklyPlans.GetByIdAsync(assignment.WeeklyPlanId);
            if (plan == null || plan.State != WeekState.PlanningOpen)
                return BadRequest("Assignments can only be removed when planning is open.");

            _unitOfWork.PlanAssignments.Remove(assignment);
            await _unitOfWork.SaveChangesAsync();

            return NoContent();
        }

        // ─────────────────────────────────────────────
        // PUT — Update progress (hours done + status)
        // ─────────────────────────────────────────────

        /// <summary>PUT /api/plan-assignments/{id}/progress — Update progress on an assignment (Frozen state only).</summary>
        [HttpPut("{id:guid}/progress")]
        public async Task<ActionResult<PlanAssignmentResponse>> UpdateProgress(Guid id, [FromBody] UpdateProgressRequest request)
        {
            var assignment = await _unitOfWork.PlanAssignments.GetWithDetailsAsync(id);
            if (assignment == null)
                return NotFound();

            // Validate the plan is in Frozen state
            var plan = await _unitOfWork.WeeklyPlans.GetByIdAsync(assignment.WeeklyPlanId);
            if (plan == null || plan.State != WeekState.Frozen)
                return BadRequest("Progress can only be updated when the plan is frozen.");

            if (request.HoursCompleted < 0)
                return BadRequest("Hours completed cannot be negative.");

            // Update the assignment
            assignment.HoursCompleted = request.HoursCompleted;
            assignment.Status = request.Status;
            _unitOfWork.PlanAssignments.Update(assignment);

            // Log a progress update entry
            var progressUpdate = new ProgressUpdate
            {
                Id = Guid.NewGuid(),
                PlanAssignmentId = assignment.Id,
                Timestamp = DateTime.UtcNow,
                HoursDone = request.HoursCompleted,
                Status = request.Status,
                Notes = request.Notes
            };
            await _unitOfWork.ProgressUpdates.AddAsync(progressUpdate);
            await _unitOfWork.SaveChangesAsync();

            // Re-fetch with details
            var updated = await _unitOfWork.PlanAssignments.GetWithDetailsAsync(id);
            return Ok(MapToResponse(updated!));
        }

        // ─────────────────────────────────────────────
        // Mapping helper
        // ─────────────────────────────────────────────

        private static PlanAssignmentResponse MapToResponse(PlanAssignment pa) => new()
        {
            Id = pa.Id,
            WeeklyPlanId = pa.WeeklyPlanId,
            TeamMemberId = pa.TeamMemberId,
            TeamMemberName = pa.TeamMember?.Name ?? "",
            BacklogItemId = pa.BacklogItemId,
            BacklogItemTitle = pa.BacklogItem?.Title ?? "",
            BacklogItemCategory = pa.BacklogItem?.Category ?? BacklogCategory.ClientFocused,
            BacklogItemEstimatedHours = pa.BacklogItem?.EstimatedHours ?? 0,
            CommittedHours = pa.CommittedHours,
            HoursCompleted = pa.HoursCompleted,
            Status = pa.Status,
            CreatedAt = pa.CreatedAt
        };
    }
}
