using Microsoft.AspNetCore.Mvc;
using WeeklyPlanTracker.API.DTOs;
using WeeklyPlanTracker.Core.Entities;
using WeeklyPlanTracker.Core.Enums;
using WeeklyPlanTracker.Core.Interfaces;

namespace WeeklyPlanTracker.API.Controllers
{
    [ApiController]
    [Route("api/team-members")]
    public class TeamMembersController : ControllerBase
    {
        private readonly IUnitOfWork _unitOfWork;

        public TeamMembersController(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        /// <summary>GET /api/team-members — Get all active team members.</summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<TeamMemberResponse>>> GetAll()
        {
            var members = await _unitOfWork.TeamMembers.GetActiveAsync();
            return Ok(members.Select(MapToResponse));
        }

        /// <summary>GET /api/team-members/{id} — Get a single team member by ID.</summary>
        [HttpGet("{id:guid}")]
        public async Task<ActionResult<TeamMemberResponse>> GetById(Guid id)
        {
            var member = await _unitOfWork.TeamMembers.GetByIdAsync(id);
            if (member == null || !member.IsActive)
                return NotFound();

            return Ok(MapToResponse(member));
        }

        /// <summary>POST /api/team-members — Add a new team member.</summary>
        [HttpPost]
        public async Task<ActionResult<TeamMemberResponse>> Create([FromBody] CreateTeamMemberRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Name))
                return BadRequest("Name is required.");

            // First person added is automatically the Lead
            var anyExist = await _unitOfWork.TeamMembers.AnyExistAsync();

            var member = new TeamMember
            {
                Id = Guid.NewGuid(),
                Name = request.Name.Trim(),
                Role = anyExist ? MemberRole.Member : MemberRole.Lead,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            await _unitOfWork.TeamMembers.AddAsync(member);
            await _unitOfWork.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = member.Id }, MapToResponse(member));
        }

        /// <summary>PUT /api/team-members/{id} — Update a team member's name.</summary>
        [HttpPut("{id:guid}")]
        public async Task<ActionResult<TeamMemberResponse>> Update(Guid id, [FromBody] UpdateTeamMemberRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Name))
                return BadRequest("Name is required.");

            var member = await _unitOfWork.TeamMembers.GetByIdAsync(id);
            if (member == null || !member.IsActive)
                return NotFound();

            member.Name = request.Name.Trim();
            _unitOfWork.TeamMembers.Update(member);
            await _unitOfWork.SaveChangesAsync();

            return Ok(MapToResponse(member));
        }

        /// <summary>PUT /api/team-members/{id}/make-lead — Make this member the Team Lead.</summary>
        [HttpPut("{id:guid}/make-lead")]
        public async Task<ActionResult<TeamMemberResponse>> MakeLead(Guid id)
        {
            var member = await _unitOfWork.TeamMembers.GetByIdAsync(id);
            if (member == null || !member.IsActive)
                return NotFound();

            // Remove Lead from current Lead
            var currentLead = await _unitOfWork.TeamMembers.GetLeadAsync();
            if (currentLead != null && currentLead.Id != id)
            {
                currentLead.Role = MemberRole.Member;
                _unitOfWork.TeamMembers.Update(currentLead);
            }

            // Set new Lead
            member.Role = MemberRole.Lead;
            _unitOfWork.TeamMembers.Update(member);
            await _unitOfWork.SaveChangesAsync();

            return Ok(MapToResponse(member));
        }

        /// <summary>DELETE /api/team-members/{id} — Soft-delete (deactivate) a team member.</summary>
        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var member = await _unitOfWork.TeamMembers.GetByIdAsync(id);
            if (member == null || !member.IsActive)
                return NotFound();

            // Cannot remove the Lead without reassigning first
            if (member.Role == MemberRole.Lead)
                return BadRequest("Cannot remove the Team Lead. Reassign the Lead role first.");

            // Cannot remove the last member
            var activeMembers = await _unitOfWork.TeamMembers.GetActiveAsync();
            if (activeMembers.Count() <= 1)
                return BadRequest("Cannot remove the last team member.");

            member.IsActive = false;
            _unitOfWork.TeamMembers.Update(member);
            await _unitOfWork.SaveChangesAsync();

            return NoContent();
        }

        /// <summary>GET /api/team-members/exists — Check if any team members exist.</summary>
        [HttpGet("exists")]
        public async Task<ActionResult<bool>> AnyExist()
        {
            var exists = await _unitOfWork.TeamMembers.AnyExistAsync();
            return Ok(exists);
        }

        /// <summary>Maps a TeamMember entity to a TeamMemberResponse DTO.</summary>
        private static TeamMemberResponse MapToResponse(TeamMember member) => new()
        {
            Id = member.Id,
            Name = member.Name,
            Role = member.Role,
            IsActive = member.IsActive,
            CreatedAt = member.CreatedAt
        };
    }
}
