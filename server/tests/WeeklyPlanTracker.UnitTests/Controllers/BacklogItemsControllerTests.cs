using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using WeeklyPlanTracker.API.Controllers;
using WeeklyPlanTracker.API.DTOs;
using WeeklyPlanTracker.Core.Entities;
using WeeklyPlanTracker.Core.Enums;
using WeeklyPlanTracker.Core.Interfaces;

namespace WeeklyPlanTracker.UnitTests.Controllers;

public class BacklogItemsControllerTests
{
    private readonly Mock<IUnitOfWork> _uow = new();
    private readonly Mock<IBacklogItemRepository> _backlogRepo = new();
    private readonly BacklogItemsController _controller;

    public BacklogItemsControllerTests()
    {
        _uow.Setup(u => u.BacklogItems).Returns(_backlogRepo.Object);
        _controller = new BacklogItemsController(_uow.Object);
    }

    // ────────── GetAll ──────────

    [Fact]
    public async Task GetAll_ReturnsAllItems_WithNoFilters()
    {
        var items = new List<BacklogItem>
        {
            new() { Id = Guid.NewGuid(), Title = "Task 1", Category = BacklogCategory.ClientFocused, EstimatedHours = 8 },
            new() { Id = Guid.NewGuid(), Title = "Task 2", Category = BacklogCategory.TechDebt, EstimatedHours = 4 }
        };
        _backlogRepo.Setup(r => r.GetFilteredAsync(null, null, false)).ReturnsAsync(items);

        var result = await _controller.GetAll();

        var ok = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var dtos = ok.Value.Should().BeAssignableTo<IEnumerable<BacklogItemResponse>>().Subject.ToList();
        dtos.Should().HaveCount(2);
    }

    [Fact]
    public async Task GetAll_PassesFilterParameters()
    {
        _backlogRepo.Setup(r => r.GetFilteredAsync(BacklogCategory.TechDebt, "search", true))
            .ReturnsAsync(new List<BacklogItem>());

        var result = await _controller.GetAll(BacklogCategory.TechDebt, "search", true);

        _backlogRepo.Verify(r => r.GetFilteredAsync(BacklogCategory.TechDebt, "search", true), Times.Once);
    }

    // ────────── GetById ──────────

    [Fact]
    public async Task GetById_ReturnsItem_WhenExists()
    {
        var id = Guid.NewGuid();
        var item = new BacklogItem { Id = id, Title = "Task 1", Category = BacklogCategory.ClientFocused, EstimatedHours = 10 };
        _backlogRepo.Setup(r => r.GetByIdAsync(id)).ReturnsAsync(item);

        var result = await _controller.GetById(id);

        var ok = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var dto = ok.Value.Should().BeOfType<BacklogItemResponse>().Subject;
        dto.Title.Should().Be("Task 1");
        dto.EstimatedHours.Should().Be(10);
    }

    [Fact]
    public async Task GetById_ReturnsNotFound_WhenMissing()
    {
        _backlogRepo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>())).ReturnsAsync((BacklogItem?)null);

        var result = await _controller.GetById(Guid.NewGuid());

        result.Result.Should().BeOfType<NotFoundResult>();
    }

    // ────────── Create ──────────

    [Fact]
    public async Task Create_CreatesItem_WhenValid()
    {
        var request = new CreateBacklogItemRequest
        {
            Title = "New Task",
            Description = "Description",
            Category = BacklogCategory.RAndD,
            EstimatedHours = 12
        };

        var result = await _controller.Create(request);

        var created = result.Result.Should().BeOfType<CreatedAtActionResult>().Subject;
        var dto = created.Value.Should().BeOfType<BacklogItemResponse>().Subject;
        dto.Title.Should().Be("New Task");
        dto.Category.Should().Be(BacklogCategory.RAndD);
        dto.EstimatedHours.Should().Be(12);
        dto.IsArchived.Should().BeFalse();
        _backlogRepo.Verify(r => r.AddAsync(It.IsAny<BacklogItem>()), Times.Once);
        _uow.Verify(u => u.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    public async Task Create_ReturnsBadRequest_WhenTitleEmpty()
    {
        var result = await _controller.Create(new CreateBacklogItemRequest { Title = "", EstimatedHours = 5 });

        result.Result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task Create_ReturnsBadRequest_WhenTitleWhitespace()
    {
        var result = await _controller.Create(new CreateBacklogItemRequest { Title = "   ", EstimatedHours = 5 });

        result.Result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task Create_ReturnsBadRequest_WhenEstimatedHoursZero()
    {
        var result = await _controller.Create(new CreateBacklogItemRequest { Title = "Task", EstimatedHours = 0 });

        result.Result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task Create_ReturnsBadRequest_WhenEstimatedHoursNegative()
    {
        var result = await _controller.Create(new CreateBacklogItemRequest { Title = "Task", EstimatedHours = -5 });

        result.Result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task Create_TrimsTitle()
    {
        var request = new CreateBacklogItemRequest { Title = "  Test  ", EstimatedHours = 5 };

        var result = await _controller.Create(request);

        var created = result.Result.Should().BeOfType<CreatedAtActionResult>().Subject;
        var dto = created.Value.Should().BeOfType<BacklogItemResponse>().Subject;
        dto.Title.Should().Be("Test");
    }

    // ────────── Update ──────────

    [Fact]
    public async Task Update_UpdatesAllFields_WhenValid()
    {
        var id = Guid.NewGuid();
        var item = new BacklogItem { Id = id, Title = "Old", Category = BacklogCategory.ClientFocused, EstimatedHours = 5 };
        _backlogRepo.Setup(r => r.GetByIdAsync(id)).ReturnsAsync(item);

        var request = new UpdateBacklogItemRequest
        {
            Title = "Updated",
            Description = "New desc",
            Category = BacklogCategory.TechDebt,
            EstimatedHours = 10
        };

        var result = await _controller.Update(id, request);

        var ok = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var dto = ok.Value.Should().BeOfType<BacklogItemResponse>().Subject;
        dto.Title.Should().Be("Updated");
        dto.Description.Should().Be("New desc");
        dto.Category.Should().Be(BacklogCategory.TechDebt);
        dto.EstimatedHours.Should().Be(10);
    }

    [Fact]
    public async Task Update_ReturnsNotFound_WhenMissing()
    {
        _backlogRepo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>())).ReturnsAsync((BacklogItem?)null);

        var result = await _controller.Update(Guid.NewGuid(), new UpdateBacklogItemRequest { Title = "X", EstimatedHours = 5 });

        result.Result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task Update_ReturnsBadRequest_WhenTitleEmpty()
    {
        var result = await _controller.Update(Guid.NewGuid(), new UpdateBacklogItemRequest { Title = "", EstimatedHours = 5 });

        result.Result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task Update_ReturnsBadRequest_WhenHoursZero()
    {
        var result = await _controller.Update(Guid.NewGuid(), new UpdateBacklogItemRequest { Title = "Task", EstimatedHours = 0 });

        result.Result.Should().BeOfType<BadRequestObjectResult>();
    }

    // ────────── Archive / Unarchive ──────────

    [Fact]
    public async Task Archive_SetsIsArchived_ToTrue()
    {
        var id = Guid.NewGuid();
        var item = new BacklogItem { Id = id, Title = "Task", IsArchived = false };
        _backlogRepo.Setup(r => r.GetByIdAsync(id)).ReturnsAsync(item);

        var result = await _controller.Archive(id);

        result.Should().BeOfType<NoContentResult>();
        item.IsArchived.Should().BeTrue();
        _uow.Verify(u => u.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    public async Task Archive_ReturnsNotFound_WhenMissing()
    {
        _backlogRepo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>())).ReturnsAsync((BacklogItem?)null);

        var result = await _controller.Archive(Guid.NewGuid());

        result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task Unarchive_SetsIsArchived_ToFalse()
    {
        var id = Guid.NewGuid();
        var item = new BacklogItem { Id = id, Title = "Task", IsArchived = true };
        _backlogRepo.Setup(r => r.GetByIdAsync(id)).ReturnsAsync(item);

        var result = await _controller.Unarchive(id);

        result.Should().BeOfType<NoContentResult>();
        item.IsArchived.Should().BeFalse();
    }

    [Fact]
    public async Task Unarchive_ReturnsNotFound_WhenMissing()
    {
        _backlogRepo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>())).ReturnsAsync((BacklogItem?)null);

        var result = await _controller.Unarchive(Guid.NewGuid());

        result.Should().BeOfType<NotFoundResult>();
    }

    // ────────── Delete ──────────

    [Fact]
    public async Task Delete_RemovesItem()
    {
        var id = Guid.NewGuid();
        var item = new BacklogItem { Id = id, Title = "Task" };
        _backlogRepo.Setup(r => r.GetByIdAsync(id)).ReturnsAsync(item);

        var result = await _controller.Delete(id);

        result.Should().BeOfType<NoContentResult>();
        _backlogRepo.Verify(r => r.Remove(item), Times.Once);
        _uow.Verify(u => u.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    public async Task Delete_ReturnsNotFound_WhenMissing()
    {
        _backlogRepo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>())).ReturnsAsync((BacklogItem?)null);

        var result = await _controller.Delete(Guid.NewGuid());

        result.Should().BeOfType<NotFoundResult>();
    }
}
