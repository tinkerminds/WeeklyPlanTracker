using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using WeeklyPlanTracker.API.Controllers;
using WeeklyPlanTracker.API.DTOs;
using WeeklyPlanTracker.Core.Entities;
using WeeklyPlanTracker.Core.Enums;
using WeeklyPlanTracker.Core.Interfaces;

namespace WeeklyPlanTracker.UnitTests.Controllers;

public class PlanAssignmentsControllerTests
{
    private readonly Mock<IUnitOfWork> _uow = new();
    private readonly Mock<IPlanAssignmentRepository> _assignmentRepo = new();
    private readonly Mock<IWeeklyPlanRepository> _planRepo = new();
    private readonly Mock<IBacklogItemRepository> _backlogRepo = new();
    private readonly Mock<IProgressUpdateRepository> _progressRepo = new();
    private readonly PlanAssignmentsController _controller;

    public PlanAssignmentsControllerTests()
    {
        _uow.Setup(u => u.PlanAssignments).Returns(_assignmentRepo.Object);
        _uow.Setup(u => u.WeeklyPlans).Returns(_planRepo.Object);
        _uow.Setup(u => u.BacklogItems).Returns(_backlogRepo.Object);
        _uow.Setup(u => u.ProgressUpdates).Returns(_progressRepo.Object);
        _controller = new PlanAssignmentsController(_uow.Object);
    }

    private static PlanAssignment CreateAssignment(Guid? planId = null, Guid? memberId = null)
    {
        return new PlanAssignment
        {
            Id = Guid.NewGuid(),
            WeeklyPlanId = planId ?? Guid.NewGuid(),
            TeamMemberId = memberId ?? Guid.NewGuid(),
            BacklogItemId = Guid.NewGuid(),
            CommittedHours = 10,
            Status = AssignmentStatus.NotStarted,
            TeamMember = new TeamMember { Name = "Alice" },
            BacklogItem = new BacklogItem { Title = "Task", Category = BacklogCategory.ClientFocused, EstimatedHours = 10 }
        };
    }

    // ═══════════════════════════════════════════
    // GetByWeek
    // ═══════════════════════════════════════════

    [Fact]
    public async Task GetByWeek_ReturnsAssignments()
    {
        var planId = Guid.NewGuid();
        var assignments = new List<PlanAssignment> { CreateAssignment(planId), CreateAssignment(planId) };
        _assignmentRepo.Setup(r => r.GetByWeekWithDetailsAsync(planId)).ReturnsAsync(assignments);

        var result = await _controller.GetByWeek(planId);

        var ok = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var dtos = ok.Value.Should().BeAssignableTo<IEnumerable<PlanAssignmentResponse>>().Subject.ToList();
        dtos.Should().HaveCount(2);
    }

    // ═══════════════════════════════════════════
    // GetByWeekAndMember
    // ═══════════════════════════════════════════

    [Fact]
    public async Task GetByWeekAndMember_ReturnsFilteredAssignments()
    {
        var planId = Guid.NewGuid();
        var memberId = Guid.NewGuid();
        var assignments = new List<PlanAssignment> { CreateAssignment(planId, memberId) };
        _assignmentRepo.Setup(r => r.GetByWeekAndMemberAsync(planId, memberId)).ReturnsAsync(assignments);

        var result = await _controller.GetByWeekAndMember(planId, memberId);

        var ok = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var dtos = ok.Value.Should().BeAssignableTo<IEnumerable<PlanAssignmentResponse>>().Subject.ToList();
        dtos.Should().HaveCount(1);
    }

    // ═══════════════════════════════════════════
    // GetById
    // ═══════════════════════════════════════════

    [Fact]
    public async Task GetById_ReturnsAssignment()
    {
        var assignment = CreateAssignment();
        _assignmentRepo.Setup(r => r.GetWithDetailsAsync(assignment.Id)).ReturnsAsync(assignment);

        var result = await _controller.GetById(assignment.Id);

        var ok = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var dto = ok.Value.Should().BeOfType<PlanAssignmentResponse>().Subject;
        dto.CommittedHours.Should().Be(10);
    }

    [Fact]
    public async Task GetById_ReturnsNotFound_WhenMissing()
    {
        _assignmentRepo.Setup(r => r.GetWithDetailsAsync(It.IsAny<Guid>())).ReturnsAsync((PlanAssignment?)null);

        var result = await _controller.GetById(Guid.NewGuid());

        result.Result.Should().BeOfType<NotFoundResult>();
    }

    // ═══════════════════════════════════════════
    // Create
    // ═══════════════════════════════════════════

    [Fact]
    public async Task Create_CreatesAssignment_WhenValid()
    {
        var planId = Guid.NewGuid();
        var memberId = Guid.NewGuid();
        var backlogId = Guid.NewGuid();

        var plan = new WeeklyPlan
        {
            Id = planId,
            State = WeekState.PlanningOpen,
            WeeklyPlanMembers = new List<WeeklyPlanMember>
            {
                new() { TeamMemberId = memberId }
            }
        };

        _planRepo.Setup(r => r.GetWithDetailsAsync(planId)).ReturnsAsync(plan);
        _backlogRepo.Setup(r => r.GetByIdAsync(backlogId))
            .ReturnsAsync(new BacklogItem { Id = backlogId, Title = "Task" });

        var created = CreateAssignment(planId, memberId);
        _assignmentRepo.Setup(r => r.GetWithDetailsAsync(It.IsAny<Guid>())).ReturnsAsync(created);

        var request = new CreatePlanAssignmentRequest
        {
            WeeklyPlanId = planId,
            TeamMemberId = memberId,
            BacklogItemId = backlogId,
            CommittedHours = 8
        };

        var result = await _controller.Create(request);

        result.Result.Should().BeOfType<CreatedAtActionResult>();
        _assignmentRepo.Verify(r => r.AddAsync(It.IsAny<PlanAssignment>()), Times.Once);
    }

    [Fact]
    public async Task Create_ReturnsNotFound_WhenPlanMissing()
    {
        _planRepo.Setup(r => r.GetWithDetailsAsync(It.IsAny<Guid>())).ReturnsAsync((WeeklyPlan?)null);

        var result = await _controller.Create(new CreatePlanAssignmentRequest
        {
            WeeklyPlanId = Guid.NewGuid(),
            TeamMemberId = Guid.NewGuid(),
            BacklogItemId = Guid.NewGuid(),
            CommittedHours = 5
        });

        result.Result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task Create_ReturnsBadRequest_WhenNotPlanningOpen()
    {
        var plan = new WeeklyPlan { Id = Guid.NewGuid(), State = WeekState.Frozen };
        _planRepo.Setup(r => r.GetWithDetailsAsync(plan.Id)).ReturnsAsync(plan);

        var result = await _controller.Create(new CreatePlanAssignmentRequest
        {
            WeeklyPlanId = plan.Id,
            TeamMemberId = Guid.NewGuid(),
            BacklogItemId = Guid.NewGuid(),
            CommittedHours = 5
        });

        result.Result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task Create_ReturnsBadRequest_WhenMemberNotInPlan()
    {
        var plan = new WeeklyPlan
        {
            Id = Guid.NewGuid(),
            State = WeekState.PlanningOpen,
            WeeklyPlanMembers = new List<WeeklyPlanMember>() // No members
        };
        _planRepo.Setup(r => r.GetWithDetailsAsync(plan.Id)).ReturnsAsync(plan);

        var result = await _controller.Create(new CreatePlanAssignmentRequest
        {
            WeeklyPlanId = plan.Id,
            TeamMemberId = Guid.NewGuid(),
            BacklogItemId = Guid.NewGuid(),
            CommittedHours = 5
        });

        result.Result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task Create_ReturnsNotFound_WhenBacklogItemMissing()
    {
        var memberId = Guid.NewGuid();
        var plan = new WeeklyPlan
        {
            Id = Guid.NewGuid(),
            State = WeekState.PlanningOpen,
            WeeklyPlanMembers = new List<WeeklyPlanMember> { new() { TeamMemberId = memberId } }
        };
        _planRepo.Setup(r => r.GetWithDetailsAsync(plan.Id)).ReturnsAsync(plan);
        _backlogRepo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>())).ReturnsAsync((BacklogItem?)null);

        var result = await _controller.Create(new CreatePlanAssignmentRequest
        {
            WeeklyPlanId = plan.Id,
            TeamMemberId = memberId,
            BacklogItemId = Guid.NewGuid(),
            CommittedHours = 5
        });

        result.Result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task Create_ReturnsBadRequest_WhenHoursZero()
    {
        var memberId = Guid.NewGuid();
        var backlogId = Guid.NewGuid();
        var plan = new WeeklyPlan
        {
            Id = Guid.NewGuid(),
            State = WeekState.PlanningOpen,
            WeeklyPlanMembers = new List<WeeklyPlanMember> { new() { TeamMemberId = memberId } }
        };
        _planRepo.Setup(r => r.GetWithDetailsAsync(plan.Id)).ReturnsAsync(plan);
        _backlogRepo.Setup(r => r.GetByIdAsync(backlogId))
            .ReturnsAsync(new BacklogItem { Id = backlogId, Title = "Task" });

        var result = await _controller.Create(new CreatePlanAssignmentRequest
        {
            WeeklyPlanId = plan.Id,
            TeamMemberId = memberId,
            BacklogItemId = backlogId,
            CommittedHours = 0
        });

        result.Result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task Create_ReturnsBadRequest_WhenHoursNegative()
    {
        var memberId = Guid.NewGuid();
        var backlogId = Guid.NewGuid();
        var plan = new WeeklyPlan
        {
            Id = Guid.NewGuid(),
            State = WeekState.PlanningOpen,
            WeeklyPlanMembers = new List<WeeklyPlanMember> { new() { TeamMemberId = memberId } }
        };
        _planRepo.Setup(r => r.GetWithDetailsAsync(plan.Id)).ReturnsAsync(plan);
        _backlogRepo.Setup(r => r.GetByIdAsync(backlogId))
            .ReturnsAsync(new BacklogItem { Id = backlogId, Title = "Task" });

        var result = await _controller.Create(new CreatePlanAssignmentRequest
        {
            WeeklyPlanId = plan.Id,
            TeamMemberId = memberId,
            BacklogItemId = backlogId,
            CommittedHours = -5
        });

        result.Result.Should().BeOfType<BadRequestObjectResult>();
    }

    // ═══════════════════════════════════════════
    // Update
    // ═══════════════════════════════════════════

    [Fact]
    public async Task Update_UpdatesHours_WhenValid()
    {
        var assignment = CreateAssignment();
        var plan = new WeeklyPlan { Id = assignment.WeeklyPlanId, State = WeekState.PlanningOpen };

        _assignmentRepo.Setup(r => r.GetWithDetailsAsync(assignment.Id)).ReturnsAsync(assignment);
        _planRepo.Setup(r => r.GetByIdAsync(assignment.WeeklyPlanId)).ReturnsAsync(plan);

        var result = await _controller.Update(assignment.Id, new UpdatePlanAssignmentRequest { CommittedHours = 15 });

        result.Result.Should().BeOfType<OkObjectResult>();
        assignment.CommittedHours.Should().Be(15);
    }

    [Fact]
    public async Task Update_ReturnsNotFound_WhenMissing()
    {
        _assignmentRepo.Setup(r => r.GetWithDetailsAsync(It.IsAny<Guid>())).ReturnsAsync((PlanAssignment?)null);

        var result = await _controller.Update(Guid.NewGuid(), new UpdatePlanAssignmentRequest { CommittedHours = 5 });

        result.Result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task Update_ReturnsBadRequest_WhenNotPlanningOpen()
    {
        var assignment = CreateAssignment();
        var plan = new WeeklyPlan { Id = assignment.WeeklyPlanId, State = WeekState.Frozen };

        _assignmentRepo.Setup(r => r.GetWithDetailsAsync(assignment.Id)).ReturnsAsync(assignment);
        _planRepo.Setup(r => r.GetByIdAsync(assignment.WeeklyPlanId)).ReturnsAsync(plan);

        var result = await _controller.Update(assignment.Id, new UpdatePlanAssignmentRequest { CommittedHours = 5 });

        result.Result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task Update_ReturnsBadRequest_WhenHoursInvalid()
    {
        var assignment = CreateAssignment();
        var plan = new WeeklyPlan { Id = assignment.WeeklyPlanId, State = WeekState.PlanningOpen };

        _assignmentRepo.Setup(r => r.GetWithDetailsAsync(assignment.Id)).ReturnsAsync(assignment);
        _planRepo.Setup(r => r.GetByIdAsync(assignment.WeeklyPlanId)).ReturnsAsync(plan);

        var result = await _controller.Update(assignment.Id, new UpdatePlanAssignmentRequest { CommittedHours = 0 });

        result.Result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task Update_ReturnsBadRequest_WhenPlanNull()
    {
        var assignment = CreateAssignment();
        _assignmentRepo.Setup(r => r.GetWithDetailsAsync(assignment.Id)).ReturnsAsync(assignment);
        _planRepo.Setup(r => r.GetByIdAsync(assignment.WeeklyPlanId)).ReturnsAsync((WeeklyPlan?)null);

        var result = await _controller.Update(assignment.Id, new UpdatePlanAssignmentRequest { CommittedHours = 5 });

        result.Result.Should().BeOfType<BadRequestObjectResult>();
    }

    // ═══════════════════════════════════════════
    // Delete
    // ═══════════════════════════════════════════

    [Fact]
    public async Task Delete_RemovesAssignment_WhenValid()
    {
        var assignment = CreateAssignment();
        var plan = new WeeklyPlan { Id = assignment.WeeklyPlanId, State = WeekState.PlanningOpen };

        _assignmentRepo.Setup(r => r.GetWithDetailsAsync(assignment.Id)).ReturnsAsync(assignment);
        _planRepo.Setup(r => r.GetByIdAsync(assignment.WeeklyPlanId)).ReturnsAsync(plan);

        var result = await _controller.Delete(assignment.Id);

        result.Should().BeOfType<NoContentResult>();
        _assignmentRepo.Verify(r => r.Remove(assignment), Times.Once);
    }

    [Fact]
    public async Task Delete_ReturnsNotFound_WhenMissing()
    {
        _assignmentRepo.Setup(r => r.GetWithDetailsAsync(It.IsAny<Guid>())).ReturnsAsync((PlanAssignment?)null);

        var result = await _controller.Delete(Guid.NewGuid());

        result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task Delete_ReturnsBadRequest_WhenNotPlanningOpen()
    {
        var assignment = CreateAssignment();
        var plan = new WeeklyPlan { Id = assignment.WeeklyPlanId, State = WeekState.Frozen };

        _assignmentRepo.Setup(r => r.GetWithDetailsAsync(assignment.Id)).ReturnsAsync(assignment);
        _planRepo.Setup(r => r.GetByIdAsync(assignment.WeeklyPlanId)).ReturnsAsync(plan);

        var result = await _controller.Delete(assignment.Id);

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task Delete_ReturnsBadRequest_WhenPlanNull()
    {
        var assignment = CreateAssignment();
        _assignmentRepo.Setup(r => r.GetWithDetailsAsync(assignment.Id)).ReturnsAsync(assignment);
        _planRepo.Setup(r => r.GetByIdAsync(assignment.WeeklyPlanId)).ReturnsAsync((WeeklyPlan?)null);

        var result = await _controller.Delete(assignment.Id);

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    // ═══════════════════════════════════════════
    // UpdateProgress
    // ═══════════════════════════════════════════

    [Fact]
    public async Task UpdateProgress_UpdatesHoursAndStatus_WhenFrozen()
    {
        var assignment = CreateAssignment();
        var plan = new WeeklyPlan { Id = assignment.WeeklyPlanId, State = WeekState.Frozen };

        _assignmentRepo.Setup(r => r.GetWithDetailsAsync(assignment.Id)).ReturnsAsync(assignment);
        _planRepo.Setup(r => r.GetByIdAsync(assignment.WeeklyPlanId)).ReturnsAsync(plan);

        var request = new UpdateProgressRequest
        {
            HoursCompleted = 5.5m,
            Status = AssignmentStatus.InProgress,
            Notes = "Making progress"
        };

        var result = await _controller.UpdateProgress(assignment.Id, request);

        result.Result.Should().BeOfType<OkObjectResult>();
        assignment.HoursCompleted.Should().Be(5.5m);
        assignment.Status.Should().Be(AssignmentStatus.InProgress);
        _progressRepo.Verify(r => r.AddAsync(It.Is<ProgressUpdate>(p =>
            p.HoursDone == 5.5m &&
            p.Status == AssignmentStatus.InProgress &&
            p.Notes == "Making progress"
        )), Times.Once);
    }

    [Fact]
    public async Task UpdateProgress_ReturnsNotFound_WhenMissing()
    {
        _assignmentRepo.Setup(r => r.GetWithDetailsAsync(It.IsAny<Guid>())).ReturnsAsync((PlanAssignment?)null);

        var result = await _controller.UpdateProgress(Guid.NewGuid(), new UpdateProgressRequest
        {
            HoursCompleted = 1, Status = AssignmentStatus.InProgress
        });

        result.Result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task UpdateProgress_ReturnsBadRequest_WhenNotFrozen()
    {
        var assignment = CreateAssignment();
        var plan = new WeeklyPlan { Id = assignment.WeeklyPlanId, State = WeekState.PlanningOpen };

        _assignmentRepo.Setup(r => r.GetWithDetailsAsync(assignment.Id)).ReturnsAsync(assignment);
        _planRepo.Setup(r => r.GetByIdAsync(assignment.WeeklyPlanId)).ReturnsAsync(plan);

        var result = await _controller.UpdateProgress(assignment.Id, new UpdateProgressRequest
        {
            HoursCompleted = 1, Status = AssignmentStatus.InProgress
        });

        result.Result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task UpdateProgress_ReturnsBadRequest_WhenHoursNegative()
    {
        var assignment = CreateAssignment();
        var plan = new WeeklyPlan { Id = assignment.WeeklyPlanId, State = WeekState.Frozen };

        _assignmentRepo.Setup(r => r.GetWithDetailsAsync(assignment.Id)).ReturnsAsync(assignment);
        _planRepo.Setup(r => r.GetByIdAsync(assignment.WeeklyPlanId)).ReturnsAsync(plan);

        var result = await _controller.UpdateProgress(assignment.Id, new UpdateProgressRequest
        {
            HoursCompleted = -1, Status = AssignmentStatus.InProgress
        });

        result.Result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task UpdateProgress_ReturnsBadRequest_WhenPlanNull()
    {
        var assignment = CreateAssignment();
        _assignmentRepo.Setup(r => r.GetWithDetailsAsync(assignment.Id)).ReturnsAsync(assignment);
        _planRepo.Setup(r => r.GetByIdAsync(assignment.WeeklyPlanId)).ReturnsAsync((WeeklyPlan?)null);

        var result = await _controller.UpdateProgress(assignment.Id, new UpdateProgressRequest
        {
            HoursCompleted = 1, Status = AssignmentStatus.InProgress
        });

        result.Result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task UpdateProgress_AllowsZeroHours()
    {
        var assignment = CreateAssignment();
        var plan = new WeeklyPlan { Id = assignment.WeeklyPlanId, State = WeekState.Frozen };

        _assignmentRepo.Setup(r => r.GetWithDetailsAsync(assignment.Id)).ReturnsAsync(assignment);
        _planRepo.Setup(r => r.GetByIdAsync(assignment.WeeklyPlanId)).ReturnsAsync(plan);

        var result = await _controller.UpdateProgress(assignment.Id, new UpdateProgressRequest
        {
            HoursCompleted = 0, Status = AssignmentStatus.NotStarted
        });

        result.Result.Should().BeOfType<OkObjectResult>();
        assignment.HoursCompleted.Should().Be(0);
    }
}
