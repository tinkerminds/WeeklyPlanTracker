using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using WeeklyPlanTracker.API.Controllers;
using WeeklyPlanTracker.API.DTOs;
using WeeklyPlanTracker.Core.Entities;
using WeeklyPlanTracker.Core.Enums;
using WeeklyPlanTracker.Core.Interfaces;

namespace WeeklyPlanTracker.UnitTests.Controllers;

public class WeeklyPlansControllerTests
{
    private readonly Mock<IUnitOfWork> _uow = new();
    private readonly Mock<IWeeklyPlanRepository> _planRepo = new();
    private readonly Mock<ITeamMemberRepository> _memberRepo = new();
    private readonly Mock<IPlanAssignmentRepository> _assignmentRepo = new();
    private readonly WeeklyPlansController _controller;

    // A known Tuesday for test data
    private static readonly DateTime Tuesday = new(2026, 3, 3); // Tuesday

    public WeeklyPlansControllerTests()
    {
        _uow.Setup(u => u.WeeklyPlans).Returns(_planRepo.Object);
        _uow.Setup(u => u.TeamMembers).Returns(_memberRepo.Object);
        _uow.Setup(u => u.PlanAssignments).Returns(_assignmentRepo.Object);
        _controller = new WeeklyPlansController(_uow.Object);
    }

    // ═══════════════════════════════════════════
    // Helper to build a plan with members + assignments
    // ═══════════════════════════════════════════

    private static WeeklyPlan CreatePlanWithMembers(
        WeekState state = WeekState.Setup,
        int memberCount = 3,
        int clientPct = 50, int techPct = 30, int rndPct = 20)
    {
        var plan = new WeeklyPlan
        {
            Id = Guid.NewGuid(),
            PlanningDate = Tuesday,
            State = state,
            ClientFocusedPercent = clientPct,
            TechDebtPercent = techPct,
            RAndDPercent = rndPct,
            CreatedAt = DateTime.UtcNow
        };

        for (int i = 0; i < memberCount; i++)
        {
            var memberId = Guid.NewGuid();
            plan.WeeklyPlanMembers.Add(new WeeklyPlanMember
            {
                WeeklyPlanId = plan.Id,
                TeamMemberId = memberId,
                TeamMember = new TeamMember { Id = memberId, Name = $"Member{i}", Role = i == 0 ? MemberRole.Lead : MemberRole.Member, IsActive = true }
            });
        }

        return plan;
    }

    private static void AddBalancedAssignments(WeeklyPlan plan)
    {
        // 3 members × 30h = 90h total
        // Client 50% = 45h, Tech 30% = 27h, R&D 20% = 18h
        var members = plan.WeeklyPlanMembers.ToList();

        // Each member gets 30h: 15h client, 9h tech, 6h R&D
        foreach (var wpm in members)
        {
            plan.PlanAssignments.Add(new PlanAssignment
            {
                Id = Guid.NewGuid(),
                WeeklyPlanId = plan.Id,
                TeamMemberId = wpm.TeamMemberId,
                BacklogItemId = Guid.NewGuid(),
                BacklogItem = new BacklogItem { Category = BacklogCategory.ClientFocused },
                CommittedHours = 15,
                Status = AssignmentStatus.NotStarted
            });
            plan.PlanAssignments.Add(new PlanAssignment
            {
                Id = Guid.NewGuid(),
                WeeklyPlanId = plan.Id,
                TeamMemberId = wpm.TeamMemberId,
                BacklogItemId = Guid.NewGuid(),
                BacklogItem = new BacklogItem { Category = BacklogCategory.TechDebt },
                CommittedHours = 9,
                Status = AssignmentStatus.NotStarted
            });
            plan.PlanAssignments.Add(new PlanAssignment
            {
                Id = Guid.NewGuid(),
                WeeklyPlanId = plan.Id,
                TeamMemberId = wpm.TeamMemberId,
                BacklogItemId = Guid.NewGuid(),
                BacklogItem = new BacklogItem { Category = BacklogCategory.RAndD },
                CommittedHours = 6,
                Status = AssignmentStatus.NotStarted
            });
        }
    }

    // ═══════════════════════════════════════════
    // GetCurrent
    // ═══════════════════════════════════════════

    [Fact]
    public async Task GetCurrent_ReturnsNull_WhenNoPlan()
    {
        _planRepo.Setup(r => r.GetCurrentAsync()).ReturnsAsync((WeeklyPlan?)null);

        var result = await _controller.GetCurrent();

        var ok = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeNull();
    }

    [Fact]
    public async Task GetCurrent_ReturnsPlan_WhenExists()
    {
        var plan = CreatePlanWithMembers(WeekState.PlanningOpen);
        _planRepo.Setup(r => r.GetCurrentAsync()).ReturnsAsync(plan);

        var result = await _controller.GetCurrent();

        var ok = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var dto = ok.Value.Should().BeOfType<WeeklyPlanResponse>().Subject;
        dto.State.Should().Be(WeekState.PlanningOpen);
        dto.Members.Should().NotBeNull();
    }

    // ═══════════════════════════════════════════
    // GetPast
    // ═══════════════════════════════════════════

    [Fact]
    public async Task GetPast_ReturnsCompletedPlans()
    {
        var plans = new List<WeeklyPlan>
        {
            CreatePlanWithMembers(WeekState.Completed),
            CreatePlanWithMembers(WeekState.Completed)
        };
        _planRepo.Setup(r => r.GetCompletedAsync()).ReturnsAsync(plans);

        var result = await _controller.GetPast();

        var ok = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var dtos = ok.Value.Should().BeAssignableTo<IEnumerable<WeeklyPlanResponse>>().Subject.ToList();
        dtos.Should().HaveCount(2);
    }

    // ═══════════════════════════════════════════
    // Create
    // ═══════════════════════════════════════════

    [Fact]
    public async Task Create_CreatesNewPlan_WhenValid()
    {
        _planRepo.Setup(r => r.GetCurrentAsync()).ReturnsAsync((WeeklyPlan?)null);

        var result = await _controller.Create(new CreateWeeklyPlanRequest { PlanningDate = Tuesday });

        var created = result.Result.Should().BeOfType<CreatedAtActionResult>().Subject;
        var dto = created.Value.Should().BeOfType<WeeklyPlanResponse>().Subject;
        dto.State.Should().Be(WeekState.Setup);
        _planRepo.Verify(r => r.AddAsync(It.IsAny<WeeklyPlan>()), Times.Once);
    }

    [Fact]
    public async Task Create_ReturnsBadRequest_WhenActivePlanExists()
    {
        _planRepo.Setup(r => r.GetCurrentAsync()).ReturnsAsync(CreatePlanWithMembers());

        var result = await _controller.Create(new CreateWeeklyPlanRequest { PlanningDate = Tuesday });

        result.Result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task Create_ReturnsBadRequest_WhenNotTuesday()
    {
        _planRepo.Setup(r => r.GetCurrentAsync()).ReturnsAsync((WeeklyPlan?)null);
        var wednesday = new DateTime(2026, 3, 4); // Wednesday

        var result = await _controller.Create(new CreateWeeklyPlanRequest { PlanningDate = wednesday });

        result.Result.Should().BeOfType<BadRequestObjectResult>();
    }

    // ═══════════════════════════════════════════
    // Setup
    // ═══════════════════════════════════════════

    [Fact]
    public async Task Setup_ConfiguresPlan_WhenValid()
    {
        var plan = CreatePlanWithMembers(WeekState.Setup, 0);
        var memberId = Guid.NewGuid();
        var member = new TeamMember { Id = memberId, Name = "Alice", IsActive = true };

        _planRepo.Setup(r => r.GetWithDetailsAsync(plan.Id)).ReturnsAsync(plan);
        _memberRepo.Setup(r => r.GetByIdAsync(memberId)).ReturnsAsync(member);

        // Re-fetch returns the same plan for response mapping
        _planRepo.Setup(r => r.GetWithDetailsAsync(plan.Id)).ReturnsAsync(plan);

        var request = new SetupWeeklyPlanRequest
        {
            PlanningDate = Tuesday,
            SelectedMemberIds = new List<Guid> { memberId },
            ClientFocusedPercent = 50,
            TechDebtPercent = 30,
            RAndDPercent = 20
        };

        var result = await _controller.Setup(plan.Id, request);

        var ok = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        plan.ClientFocusedPercent.Should().Be(50);
        plan.TechDebtPercent.Should().Be(30);
        plan.RAndDPercent.Should().Be(20);
    }

    [Fact]
    public async Task Setup_ReturnsNotFound_WhenPlanMissing()
    {
        _planRepo.Setup(r => r.GetWithDetailsAsync(It.IsAny<Guid>())).ReturnsAsync((WeeklyPlan?)null);

        var result = await _controller.Setup(Guid.NewGuid(), new SetupWeeklyPlanRequest
        {
            PlanningDate = Tuesday,
            SelectedMemberIds = new List<Guid> { Guid.NewGuid() },
            ClientFocusedPercent = 100,
            TechDebtPercent = 0,
            RAndDPercent = 0
        });

        result.Result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task Setup_ReturnsBadRequest_WhenNotSetupState()
    {
        var plan = CreatePlanWithMembers(WeekState.PlanningOpen);
        _planRepo.Setup(r => r.GetWithDetailsAsync(plan.Id)).ReturnsAsync(plan);

        var result = await _controller.Setup(plan.Id, new SetupWeeklyPlanRequest
        {
            PlanningDate = Tuesday,
            SelectedMemberIds = new List<Guid> { Guid.NewGuid() },
            ClientFocusedPercent = 100,
            TechDebtPercent = 0,
            RAndDPercent = 0
        });

        result.Result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task Setup_ReturnsBadRequest_WhenNotTuesday()
    {
        var plan = CreatePlanWithMembers(WeekState.Setup);
        _planRepo.Setup(r => r.GetWithDetailsAsync(plan.Id)).ReturnsAsync(plan);

        var result = await _controller.Setup(plan.Id, new SetupWeeklyPlanRequest
        {
            PlanningDate = new DateTime(2026, 3, 4), // Wednesday
            SelectedMemberIds = new List<Guid> { Guid.NewGuid() },
            ClientFocusedPercent = 100,
            TechDebtPercent = 0,
            RAndDPercent = 0
        });

        result.Result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task Setup_ReturnsBadRequest_WhenPercentagesNotAdd100()
    {
        var plan = CreatePlanWithMembers(WeekState.Setup);
        _planRepo.Setup(r => r.GetWithDetailsAsync(plan.Id)).ReturnsAsync(plan);

        var result = await _controller.Setup(plan.Id, new SetupWeeklyPlanRequest
        {
            PlanningDate = Tuesday,
            SelectedMemberIds = new List<Guid> { Guid.NewGuid() },
            ClientFocusedPercent = 50,
            TechDebtPercent = 30,
            RAndDPercent = 10 // Sum = 90
        });

        result.Result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task Setup_ReturnsBadRequest_WhenNoMembersSelected()
    {
        var plan = CreatePlanWithMembers(WeekState.Setup);
        _planRepo.Setup(r => r.GetWithDetailsAsync(plan.Id)).ReturnsAsync(plan);

        var result = await _controller.Setup(plan.Id, new SetupWeeklyPlanRequest
        {
            PlanningDate = Tuesday,
            SelectedMemberIds = new List<Guid>(),
            ClientFocusedPercent = 50,
            TechDebtPercent = 30,
            RAndDPercent = 20
        });

        result.Result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task Setup_ReturnsBadRequest_WhenMemberNotFound()
    {
        var plan = CreatePlanWithMembers(WeekState.Setup);
        var invalidId = Guid.NewGuid();
        _planRepo.Setup(r => r.GetWithDetailsAsync(plan.Id)).ReturnsAsync(plan);
        _memberRepo.Setup(r => r.GetByIdAsync(invalidId)).ReturnsAsync((TeamMember?)null);

        var result = await _controller.Setup(plan.Id, new SetupWeeklyPlanRequest
        {
            PlanningDate = Tuesday,
            SelectedMemberIds = new List<Guid> { invalidId },
            ClientFocusedPercent = 50,
            TechDebtPercent = 30,
            RAndDPercent = 20
        });

        result.Result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task Setup_ReturnsBadRequest_WhenMemberInactive()
    {
        var plan = CreatePlanWithMembers(WeekState.Setup);
        var memberId = Guid.NewGuid();
        _planRepo.Setup(r => r.GetWithDetailsAsync(plan.Id)).ReturnsAsync(plan);
        _memberRepo.Setup(r => r.GetByIdAsync(memberId))
            .ReturnsAsync(new TeamMember { Id = memberId, Name = "Gone", IsActive = false });

        var result = await _controller.Setup(plan.Id, new SetupWeeklyPlanRequest
        {
            PlanningDate = Tuesday,
            SelectedMemberIds = new List<Guid> { memberId },
            ClientFocusedPercent = 50,
            TechDebtPercent = 30,
            RAndDPercent = 20
        });

        result.Result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task Setup_ReturnsBadRequest_WhenMemberIdsNull()
    {
        var plan = CreatePlanWithMembers(WeekState.Setup);
        _planRepo.Setup(r => r.GetWithDetailsAsync(plan.Id)).ReturnsAsync(plan);

        var request = new SetupWeeklyPlanRequest
        {
            PlanningDate = Tuesday,
            SelectedMemberIds = null!,
            ClientFocusedPercent = 50,
            TechDebtPercent = 30,
            RAndDPercent = 20
        };

        var result = await _controller.Setup(plan.Id, request);

        result.Result.Should().BeOfType<BadRequestObjectResult>();
    }

    // ═══════════════════════════════════════════
    // OpenPlanning
    // ═══════════════════════════════════════════

    [Fact]
    public async Task OpenPlanning_TransitionsToOpen_WhenValid()
    {
        var plan = CreatePlanWithMembers(WeekState.Setup, 3, 50, 30, 20);
        _planRepo.Setup(r => r.GetWithDetailsAsync(plan.Id)).ReturnsAsync(plan);

        var result = await _controller.OpenPlanning(plan.Id);

        var ok = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var dto = ok.Value.Should().BeOfType<WeeklyPlanResponse>().Subject;
        dto.State.Should().Be(WeekState.PlanningOpen);
        plan.State.Should().Be(WeekState.PlanningOpen);
    }

    [Fact]
    public async Task OpenPlanning_ReturnsNotFound_WhenMissing()
    {
        _planRepo.Setup(r => r.GetWithDetailsAsync(It.IsAny<Guid>())).ReturnsAsync((WeeklyPlan?)null);

        var result = await _controller.OpenPlanning(Guid.NewGuid());

        result.Result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task OpenPlanning_ReturnsBadRequest_WhenNotSetupState()
    {
        var plan = CreatePlanWithMembers(WeekState.PlanningOpen);
        _planRepo.Setup(r => r.GetWithDetailsAsync(plan.Id)).ReturnsAsync(plan);

        var result = await _controller.OpenPlanning(plan.Id);

        result.Result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task OpenPlanning_ReturnsBadRequest_WhenNoMembers()
    {
        var plan = CreatePlanWithMembers(WeekState.Setup, 0, 50, 30, 20);
        _planRepo.Setup(r => r.GetWithDetailsAsync(plan.Id)).ReturnsAsync(plan);

        var result = await _controller.OpenPlanning(plan.Id);

        result.Result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task OpenPlanning_ReturnsBadRequest_WhenPercentagesNot100()
    {
        var plan = CreatePlanWithMembers(WeekState.Setup, 2, 50, 30, 10); // Sum = 90
        _planRepo.Setup(r => r.GetWithDetailsAsync(plan.Id)).ReturnsAsync(plan);

        var result = await _controller.OpenPlanning(plan.Id);

        result.Result.Should().BeOfType<BadRequestObjectResult>();
    }

    // ═══════════════════════════════════════════
    // Freeze
    // ═══════════════════════════════════════════

    [Fact]
    public async Task Freeze_TransitionsToFrozen_WhenAllValid()
    {
        var plan = CreatePlanWithMembers(WeekState.PlanningOpen, 3, 50, 30, 20);
        AddBalancedAssignments(plan);
        _planRepo.Setup(r => r.GetWithDetailsAsync(plan.Id)).ReturnsAsync(plan);

        var result = await _controller.Freeze(plan.Id);

        var ok = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        plan.State.Should().Be(WeekState.Frozen);
    }

    [Fact]
    public async Task Freeze_ReturnsNotFound_WhenMissing()
    {
        _planRepo.Setup(r => r.GetWithDetailsAsync(It.IsAny<Guid>())).ReturnsAsync((WeeklyPlan?)null);

        var result = await _controller.Freeze(Guid.NewGuid());

        result.Result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task Freeze_ReturnsBadRequest_WhenNotPlanningOpen()
    {
        var plan = CreatePlanWithMembers(WeekState.Setup);
        _planRepo.Setup(r => r.GetWithDetailsAsync(plan.Id)).ReturnsAsync(plan);

        var result = await _controller.Freeze(plan.Id);

        result.Result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task Freeze_ReturnsBadRequest_WhenMemberDoesntHave30Hours()
    {
        var plan = CreatePlanWithMembers(WeekState.PlanningOpen, 1, 100, 0, 0);
        // Add only 20h of client work instead of 30h
        var memberId = plan.WeeklyPlanMembers.First().TeamMemberId;
        plan.PlanAssignments.Add(new PlanAssignment
        {
            Id = Guid.NewGuid(),
            WeeklyPlanId = plan.Id,
            TeamMemberId = memberId,
            BacklogItemId = Guid.NewGuid(),
            BacklogItem = new BacklogItem { Category = BacklogCategory.ClientFocused },
            CommittedHours = 20
        });
        _planRepo.Setup(r => r.GetWithDetailsAsync(plan.Id)).ReturnsAsync(plan);

        var result = await _controller.Freeze(plan.Id);

        result.Result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task Freeze_ReturnsBadRequest_WhenCategoryBudgetMismatch()
    {
        var plan = CreatePlanWithMembers(WeekState.PlanningOpen, 1, 100, 0, 0);
        // Member has 30h but in wrong category
        var memberId = plan.WeeklyPlanMembers.First().TeamMemberId;
        plan.PlanAssignments.Add(new PlanAssignment
        {
            Id = Guid.NewGuid(),
            WeeklyPlanId = plan.Id,
            TeamMemberId = memberId,
            BacklogItemId = Guid.NewGuid(),
            BacklogItem = new BacklogItem { Category = BacklogCategory.TechDebt }, // Wrong category
            CommittedHours = 30
        });
        _planRepo.Setup(r => r.GetWithDetailsAsync(plan.Id)).ReturnsAsync(plan);

        var result = await _controller.Freeze(plan.Id);

        result.Result.Should().BeOfType<BadRequestObjectResult>();
    }

    // ═══════════════════════════════════════════
    // Complete
    // ═══════════════════════════════════════════

    [Fact]
    public async Task Complete_TransitionsToCompleted_WhenFrozen()
    {
        var plan = CreatePlanWithMembers(WeekState.Frozen);
        _planRepo.Setup(r => r.GetWithDetailsAsync(plan.Id)).ReturnsAsync(plan);

        var result = await _controller.Complete(plan.Id);

        var ok = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        plan.State.Should().Be(WeekState.Completed);
    }

    [Fact]
    public async Task Complete_ReturnsNotFound_WhenMissing()
    {
        _planRepo.Setup(r => r.GetWithDetailsAsync(It.IsAny<Guid>())).ReturnsAsync((WeeklyPlan?)null);

        var result = await _controller.Complete(Guid.NewGuid());

        result.Result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task Complete_ReturnsBadRequest_WhenNotFrozen()
    {
        var plan = CreatePlanWithMembers(WeekState.PlanningOpen);
        _planRepo.Setup(r => r.GetWithDetailsAsync(plan.Id)).ReturnsAsync(plan);

        var result = await _controller.Complete(plan.Id);

        result.Result.Should().BeOfType<BadRequestObjectResult>();
    }

    // ═══════════════════════════════════════════
    // Cancel
    // ═══════════════════════════════════════════

    [Fact]
    public async Task Cancel_RemovesPlan_FromSetup()
    {
        var plan = CreatePlanWithMembers(WeekState.Setup);
        _planRepo.Setup(r => r.GetWithDetailsAsync(plan.Id)).ReturnsAsync(plan);

        var result = await _controller.Cancel(plan.Id);

        result.Should().BeOfType<NoContentResult>();
        _planRepo.Verify(r => r.Remove(plan), Times.Once);
    }

    [Fact]
    public async Task Cancel_RemovesPlan_FromPlanningOpen()
    {
        var plan = CreatePlanWithMembers(WeekState.PlanningOpen);
        AddBalancedAssignments(plan);
        _planRepo.Setup(r => r.GetWithDetailsAsync(plan.Id)).ReturnsAsync(plan);

        var result = await _controller.Cancel(plan.Id);

        result.Should().BeOfType<NoContentResult>();
        _assignmentRepo.Verify(r => r.Remove(It.IsAny<PlanAssignment>()), Times.Exactly(plan.PlanAssignments.Count));
    }

    [Fact]
    public async Task Cancel_ReturnsBadRequest_FromFrozen()
    {
        var plan = CreatePlanWithMembers(WeekState.Frozen);
        _planRepo.Setup(r => r.GetWithDetailsAsync(plan.Id)).ReturnsAsync(plan);

        var result = await _controller.Cancel(plan.Id);

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task Cancel_ReturnsBadRequest_FromCompleted()
    {
        var plan = CreatePlanWithMembers(WeekState.Completed);
        _planRepo.Setup(r => r.GetWithDetailsAsync(plan.Id)).ReturnsAsync(plan);

        var result = await _controller.Cancel(plan.Id);

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task Cancel_ReturnsNotFound_WhenMissing()
    {
        _planRepo.Setup(r => r.GetWithDetailsAsync(It.IsAny<Guid>())).ReturnsAsync((WeeklyPlan?)null);

        var result = await _controller.Cancel(Guid.NewGuid());

        result.Should().BeOfType<NotFoundResult>();
    }

    // ═══════════════════════════════════════════
    // TogglePlanningDone
    // ═══════════════════════════════════════════

    [Fact]
    public async Task TogglePlanningDone_TogglesFlag()
    {
        var plan = CreatePlanWithMembers(WeekState.PlanningOpen, 1);
        var memberId = plan.WeeklyPlanMembers.First().TeamMemberId;
        plan.WeeklyPlanMembers.First().IsPlanningDone = false;
        _planRepo.Setup(r => r.GetWithDetailsAsync(plan.Id)).ReturnsAsync(plan);

        var result = await _controller.TogglePlanningDone(plan.Id, memberId);

        var ok = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        plan.WeeklyPlanMembers.First().IsPlanningDone.Should().BeTrue();
    }

    [Fact]
    public async Task TogglePlanningDone_TogglesBackToFalse()
    {
        var plan = CreatePlanWithMembers(WeekState.PlanningOpen, 1);
        var memberId = plan.WeeklyPlanMembers.First().TeamMemberId;
        plan.WeeklyPlanMembers.First().IsPlanningDone = true;
        _planRepo.Setup(r => r.GetWithDetailsAsync(plan.Id)).ReturnsAsync(plan);

        var result = await _controller.TogglePlanningDone(plan.Id, memberId);

        plan.WeeklyPlanMembers.First().IsPlanningDone.Should().BeFalse();
    }

    [Fact]
    public async Task TogglePlanningDone_ReturnsNotFound_WhenPlanMissing()
    {
        _planRepo.Setup(r => r.GetWithDetailsAsync(It.IsAny<Guid>())).ReturnsAsync((WeeklyPlan?)null);

        var result = await _controller.TogglePlanningDone(Guid.NewGuid(), Guid.NewGuid());

        result.Result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task TogglePlanningDone_ReturnsNotFound_WhenMemberNotInPlan()
    {
        var plan = CreatePlanWithMembers(WeekState.PlanningOpen, 1);
        _planRepo.Setup(r => r.GetWithDetailsAsync(plan.Id)).ReturnsAsync(plan);

        var result = await _controller.TogglePlanningDone(plan.Id, Guid.NewGuid());

        result.Result.Should().BeOfType<NotFoundObjectResult>();
    }
}
