using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WeeklyPlanTracker.API.Controllers;
using WeeklyPlanTracker.Core.Entities;
using WeeklyPlanTracker.Core.Enums;
using WeeklyPlanTracker.Infrastructure.Data;

namespace WeeklyPlanTracker.UnitTests.Controllers;

public class DataControllerTests : IDisposable
{
    private readonly AppDbContext _db;
    private readonly DataController _controller;

    public DataControllerTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _db = new AppDbContext(options);
        _controller = new DataController(_db);
    }

    public void Dispose() => _db.Dispose();

    // ═══════════════════════════════════════════
    // Export
    // ═══════════════════════════════════════════

    [Fact]
    public async Task Export_ReturnsAllData()
    {
        // Seed some data
        var member = new TeamMember { Id = Guid.NewGuid(), Name = "Alice", Role = MemberRole.Lead, IsActive = true };
        var item = new BacklogItem { Id = Guid.NewGuid(), Title = "Task", Category = BacklogCategory.ClientFocused, EstimatedHours = 10 };
        _db.TeamMembers.Add(member);
        _db.BacklogItems.Add(item);
        await _db.SaveChangesAsync();

        var result = await _controller.Export();

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().NotBeNull();
    }

    [Fact]
    public async Task Export_ReturnsEmpty_WhenNoData()
    {
        var result = await _controller.Export();

        result.Should().BeOfType<OkObjectResult>();
    }

    // ═══════════════════════════════════════════
    // Seed
    // ═══════════════════════════════════════════

    [Fact]
    public async Task Seed_CreatesTeamMembersAndBacklogItems()
    {
        var result = await _controller.Seed();

        result.Should().BeOfType<OkObjectResult>();

        var members = await _db.TeamMembers.ToListAsync();
        members.Should().HaveCount(4);
        members.Count(m => m.Role == MemberRole.Lead).Should().Be(1);

        var items = await _db.BacklogItems.ToListAsync();
        items.Should().HaveCount(10);

        var plan = await _db.WeeklyPlans.FirstOrDefaultAsync();
        plan.Should().NotBeNull();
        plan!.State.Should().Be(WeekState.PlanningOpen);
    }

    [Fact]
    public async Task Seed_ClearsExistingDataFirst()
    {
        // Add pre-existing data that should be cleared
        _db.TeamMembers.Add(new TeamMember
        {
            Id = Guid.NewGuid(), Name = "Existing Lead", Role = MemberRole.Lead, IsActive = true
        });
        await _db.SaveChangesAsync();

        var result = await _controller.Seed();

        result.Should().BeOfType<OkObjectResult>();

        // All old data should be gone, replaced by fresh seed data
        var members = await _db.TeamMembers.ToListAsync();
        members.Should().HaveCount(4);
        members.Any(m => m.Name == "Existing Lead").Should().BeFalse();

        // Alice should be Lead since old data was cleared
        var leads = members.Where(m => m.Role == MemberRole.Lead).ToList();
        leads.Should().HaveCount(1);
        leads[0].Name.Should().Be("Alice Chen");
    }

    // ═══════════════════════════════════════════
    // Reset
    // ═══════════════════════════════════════════

    [Fact]
    public async Task Reset_ClearsAllData()
    {
        // Seed first
        await _controller.Seed();
        (await _db.TeamMembers.CountAsync()).Should().BeGreaterThan(0);

        var result = await _controller.Reset();

        result.Should().BeOfType<OkObjectResult>();
        (await _db.TeamMembers.CountAsync()).Should().Be(0);
        (await _db.BacklogItems.CountAsync()).Should().Be(0);
        (await _db.WeeklyPlans.CountAsync()).Should().Be(0);
        (await _db.PlanAssignments.CountAsync()).Should().Be(0);
    }

    // ═══════════════════════════════════════════
    // Import
    // ═══════════════════════════════════════════

    [Fact]
    public async Task Import_ClearsAndRestoresData()
    {
        // Add pre-existing data that should be cleared
        _db.TeamMembers.Add(new TeamMember { Id = Guid.NewGuid(), Name = "Old", Role = MemberRole.Lead, IsActive = true });
        await _db.SaveChangesAsync();

        var importJson = @"{
            ""TeamMembers"": [
                { ""Id"": ""aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"", ""Name"": ""Alice"", ""Role"": ""Lead"", ""IsActive"": true, ""CreatedAt"": ""2026-01-01T00:00:00"" },
                { ""Id"": ""bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"", ""Name"": ""Bob"", ""Role"": ""Member"", ""IsActive"": true, ""CreatedAt"": ""2026-01-01T00:00:00"" }
            ],
            ""BacklogItems"": [
                { ""Id"": ""cccccccc-cccc-cccc-cccc-cccccccccccc"", ""Title"": ""Task 1"", ""Category"": ""ClientFocused"", ""EstimatedHours"": 10, ""IsArchived"": false, ""CreatedAt"": ""2026-01-01T00:00:00"" }
            ]
        }";

        var jsonElement = System.Text.Json.JsonSerializer.Deserialize<System.Text.Json.JsonElement>(importJson);

        var result = await _controller.Import(jsonElement);

        result.Should().BeOfType<OkObjectResult>();
        var members = await _db.TeamMembers.ToListAsync();
        members.Should().HaveCount(2);
        members.Any(m => m.Name == "Alice").Should().BeTrue();
        members.Any(m => m.Name == "Old").Should().BeFalse();
    }

    [Fact]
    public async Task Import_HandlesEmptyJson()
    {
        var importJson = "{}";
        var jsonElement = System.Text.Json.JsonSerializer.Deserialize<System.Text.Json.JsonElement>(importJson);

        var result = await _controller.Import(jsonElement);

        result.Should().BeOfType<OkObjectResult>();
        (await _db.TeamMembers.CountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task Import_HandlesPartialData()
    {
        var importJson = @"{
            ""TeamMembers"": [
                { ""Id"": ""aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"", ""Name"": ""Solo"", ""Role"": ""Lead"", ""IsActive"": true, ""CreatedAt"": ""2026-01-01T00:00:00"" }
            ]
        }";

        var jsonElement = System.Text.Json.JsonSerializer.Deserialize<System.Text.Json.JsonElement>(importJson);

        var result = await _controller.Import(jsonElement);

        result.Should().BeOfType<OkObjectResult>();
        (await _db.TeamMembers.CountAsync()).Should().Be(1);
        (await _db.BacklogItems.CountAsync()).Should().Be(0);
    }
}
