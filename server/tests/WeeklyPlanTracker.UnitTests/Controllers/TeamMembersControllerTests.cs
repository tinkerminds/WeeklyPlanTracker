using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using WeeklyPlanTracker.API.Controllers;
using WeeklyPlanTracker.API.DTOs;
using WeeklyPlanTracker.Core.Entities;
using WeeklyPlanTracker.Core.Enums;
using WeeklyPlanTracker.Core.Interfaces;

namespace WeeklyPlanTracker.UnitTests.Controllers;

public class TeamMembersControllerTests
{
    private readonly Mock<IUnitOfWork> _uow = new();
    private readonly Mock<ITeamMemberRepository> _memberRepo = new();
    private readonly TeamMembersController _controller;

    public TeamMembersControllerTests()
    {
        _uow.Setup(u => u.TeamMembers).Returns(_memberRepo.Object);
        _controller = new TeamMembersController(_uow.Object);
    }

    // ────────── GetAll ──────────

    [Fact]
    public async Task GetAll_ReturnsAllActiveMembers()
    {
        var members = new List<TeamMember>
        {
            new() { Id = Guid.NewGuid(), Name = "Alice", Role = MemberRole.Lead, IsActive = true },
            new() { Id = Guid.NewGuid(), Name = "Bob", Role = MemberRole.Member, IsActive = true }
        };
        _memberRepo.Setup(r => r.GetActiveAsync()).ReturnsAsync(members);

        var result = await _controller.GetAll();

        var ok = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var items = ok.Value.Should().BeAssignableTo<IEnumerable<TeamMemberResponse>>().Subject.ToList();
        items.Should().HaveCount(2);
        items[0].Name.Should().Be("Alice");
        items[0].Role.Should().Be(MemberRole.Lead);
    }

    [Fact]
    public async Task GetAll_ReturnsEmpty_WhenNoMembers()
    {
        _memberRepo.Setup(r => r.GetActiveAsync()).ReturnsAsync(new List<TeamMember>());

        var result = await _controller.GetAll();

        var ok = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var items = ok.Value.Should().BeAssignableTo<IEnumerable<TeamMemberResponse>>().Subject.ToList();
        items.Should().BeEmpty();
    }

    // ────────── GetById ──────────

    [Fact]
    public async Task GetById_ReturnsMember_WhenExists()
    {
        var id = Guid.NewGuid();
        var member = new TeamMember { Id = id, Name = "Alice", Role = MemberRole.Lead, IsActive = true };
        _memberRepo.Setup(r => r.GetByIdAsync(id)).ReturnsAsync(member);

        var result = await _controller.GetById(id);

        var ok = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var dto = ok.Value.Should().BeOfType<TeamMemberResponse>().Subject;
        dto.Name.Should().Be("Alice");
    }

    [Fact]
    public async Task GetById_ReturnsNotFound_WhenMissing()
    {
        _memberRepo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>())).ReturnsAsync((TeamMember?)null);

        var result = await _controller.GetById(Guid.NewGuid());

        result.Result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task GetById_ReturnsNotFound_WhenInactive()
    {
        var id = Guid.NewGuid();
        _memberRepo.Setup(r => r.GetByIdAsync(id))
            .ReturnsAsync(new TeamMember { Id = id, Name = "Alice", IsActive = false });

        var result = await _controller.GetById(id);

        result.Result.Should().BeOfType<NotFoundResult>();
    }

    // ────────── Create ──────────

    [Fact]
    public async Task Create_FirstMember_BecomesLead()
    {
        _memberRepo.Setup(r => r.AnyExistAsync()).ReturnsAsync(false);

        var result = await _controller.Create(new CreateTeamMemberRequest { Name = "Alice" });

        var created = result.Result.Should().BeOfType<CreatedAtActionResult>().Subject;
        var dto = created.Value.Should().BeOfType<TeamMemberResponse>().Subject;
        dto.Role.Should().Be(MemberRole.Lead);
        dto.Name.Should().Be("Alice");
        _memberRepo.Verify(r => r.AddAsync(It.Is<TeamMember>(m => m.Role == MemberRole.Lead)), Times.Once);
    }

    [Fact]
    public async Task Create_SubsequentMember_IsMember()
    {
        _memberRepo.Setup(r => r.AnyExistAsync()).ReturnsAsync(true);

        var result = await _controller.Create(new CreateTeamMemberRequest { Name = "Bob" });

        var created = result.Result.Should().BeOfType<CreatedAtActionResult>().Subject;
        var dto = created.Value.Should().BeOfType<TeamMemberResponse>().Subject;
        dto.Role.Should().Be(MemberRole.Member);
    }

    [Fact]
    public async Task Create_RejectsBadRequest_WhenNameEmpty()
    {
        var result = await _controller.Create(new CreateTeamMemberRequest { Name = "" });

        result.Result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task Create_RejectsBadRequest_WhenNameWhitespace()
    {
        var result = await _controller.Create(new CreateTeamMemberRequest { Name = "   " });

        result.Result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task Create_TrimsName()
    {
        _memberRepo.Setup(r => r.AnyExistAsync()).ReturnsAsync(true);

        var result = await _controller.Create(new CreateTeamMemberRequest { Name = "  Bob  " });

        var created = result.Result.Should().BeOfType<CreatedAtActionResult>().Subject;
        var dto = created.Value.Should().BeOfType<TeamMemberResponse>().Subject;
        dto.Name.Should().Be("Bob");
    }

    // ────────── Update ──────────

    [Fact]
    public async Task Update_UpdatesName_WhenValid()
    {
        var id = Guid.NewGuid();
        var member = new TeamMember { Id = id, Name = "Alice", IsActive = true };
        _memberRepo.Setup(r => r.GetByIdAsync(id)).ReturnsAsync(member);

        var result = await _controller.Update(id, new UpdateTeamMemberRequest { Name = "Alice Smith" });

        var ok = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var dto = ok.Value.Should().BeOfType<TeamMemberResponse>().Subject;
        dto.Name.Should().Be("Alice Smith");
        _memberRepo.Verify(r => r.Update(It.IsAny<TeamMember>()), Times.Once);
    }

    [Fact]
    public async Task Update_ReturnsNotFound_WhenMissing()
    {
        _memberRepo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>())).ReturnsAsync((TeamMember?)null);

        var result = await _controller.Update(Guid.NewGuid(), new UpdateTeamMemberRequest { Name = "X" });

        result.Result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task Update_ReturnsBadRequest_WhenNameEmpty()
    {
        var result = await _controller.Update(Guid.NewGuid(), new UpdateTeamMemberRequest { Name = "" });

        result.Result.Should().BeOfType<BadRequestObjectResult>();
    }

    // ────────── MakeLead ──────────

    [Fact]
    public async Task MakeLead_TransfersLeadRole()
    {
        var aliceId = Guid.NewGuid();
        var bobId = Guid.NewGuid();
        var alice = new TeamMember { Id = aliceId, Name = "Alice", Role = MemberRole.Lead, IsActive = true };
        var bob = new TeamMember { Id = bobId, Name = "Bob", Role = MemberRole.Member, IsActive = true };

        _memberRepo.Setup(r => r.GetByIdAsync(bobId)).ReturnsAsync(bob);
        _memberRepo.Setup(r => r.GetLeadAsync()).ReturnsAsync(alice);

        var result = await _controller.MakeLead(bobId);

        var ok = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var dto = ok.Value.Should().BeOfType<TeamMemberResponse>().Subject;
        dto.Role.Should().Be(MemberRole.Lead);

        alice.Role.Should().Be(MemberRole.Member);
        _uow.Verify(u => u.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    public async Task MakeLead_DoesNotDemote_WhenAlreadyLead()
    {
        var id = Guid.NewGuid();
        var member = new TeamMember { Id = id, Name = "Alice", Role = MemberRole.Lead, IsActive = true };
        _memberRepo.Setup(r => r.GetByIdAsync(id)).ReturnsAsync(member);
        _memberRepo.Setup(r => r.GetLeadAsync()).ReturnsAsync(member);

        var result = await _controller.MakeLead(id);

        result.Result.Should().BeOfType<OkObjectResult>();
        member.Role.Should().Be(MemberRole.Lead);
    }

    [Fact]
    public async Task MakeLead_ReturnsNotFound_WhenMissing()
    {
        _memberRepo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>())).ReturnsAsync((TeamMember?)null);

        var result = await _controller.MakeLead(Guid.NewGuid());

        result.Result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task MakeLead_HandlesNoCurrentLead()
    {
        var id = Guid.NewGuid();
        var member = new TeamMember { Id = id, Name = "Alice", Role = MemberRole.Member, IsActive = true };
        _memberRepo.Setup(r => r.GetByIdAsync(id)).ReturnsAsync(member);
        _memberRepo.Setup(r => r.GetLeadAsync()).ReturnsAsync((TeamMember?)null);

        var result = await _controller.MakeLead(id);

        var ok = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var dto = ok.Value.Should().BeOfType<TeamMemberResponse>().Subject;
        dto.Role.Should().Be(MemberRole.Lead);
    }

    // ────────── Delete ──────────

    [Fact]
    public async Task Delete_SoftDeletesMember()
    {
        var id = Guid.NewGuid();
        var member = new TeamMember { Id = id, Name = "Bob", Role = MemberRole.Member, IsActive = true };
        _memberRepo.Setup(r => r.GetByIdAsync(id)).ReturnsAsync(member);
        _memberRepo.Setup(r => r.GetActiveAsync())
            .ReturnsAsync(new List<TeamMember> { member, new() { Id = Guid.NewGuid(), Name = "Alice", IsActive = true } });

        var result = await _controller.Delete(id);

        result.Should().BeOfType<NoContentResult>();
        member.IsActive.Should().BeFalse();
        _uow.Verify(u => u.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    public async Task Delete_RejectsLeadDeletion()
    {
        var id = Guid.NewGuid();
        var member = new TeamMember { Id = id, Name = "Alice", Role = MemberRole.Lead, IsActive = true };
        _memberRepo.Setup(r => r.GetByIdAsync(id)).ReturnsAsync(member);

        var result = await _controller.Delete(id);

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task Delete_RejectsLastMemberDeletion()
    {
        var id = Guid.NewGuid();
        var member = new TeamMember { Id = id, Name = "Bob", Role = MemberRole.Member, IsActive = true };
        _memberRepo.Setup(r => r.GetByIdAsync(id)).ReturnsAsync(member);
        _memberRepo.Setup(r => r.GetActiveAsync()).ReturnsAsync(new List<TeamMember> { member });

        var result = await _controller.Delete(id);

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task Delete_ReturnsNotFound_WhenMissing()
    {
        _memberRepo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>())).ReturnsAsync((TeamMember?)null);

        var result = await _controller.Delete(Guid.NewGuid());

        result.Should().BeOfType<NotFoundResult>();
    }

    // ────────── AnyExist ──────────

    [Fact]
    public async Task AnyExist_ReturnsTrue_WhenMembersExist()
    {
        _memberRepo.Setup(r => r.AnyExistAsync()).ReturnsAsync(true);

        var result = await _controller.AnyExist();

        var ok = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().Be(true);
    }

    [Fact]
    public async Task AnyExist_ReturnsFalse_WhenEmpty()
    {
        _memberRepo.Setup(r => r.AnyExistAsync()).ReturnsAsync(false);

        var result = await _controller.AnyExist();

        var ok = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().Be(false);
    }
}
