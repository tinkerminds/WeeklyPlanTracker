using Microsoft.AspNetCore.Mvc;
using WeeklyPlanTracker.API.DTOs;
using WeeklyPlanTracker.Core.Entities;
using WeeklyPlanTracker.Core.Enums;
using WeeklyPlanTracker.Core.Interfaces;

namespace WeeklyPlanTracker.API.Controllers
{
    /// <summary>
    /// REST API for managing backlog items.
    /// Supports CRUD, filtering by category/search/archive status, and archive/unarchive.
    /// </summary>
    [ApiController]
    [Route("api/backlog-items")]
    public class BacklogItemsController : ControllerBase
    {
        private readonly IUnitOfWork _unitOfWork;

        public BacklogItemsController(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        /// <summary>GET /api/backlog-items — Get all backlog items with optional filters.</summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<BacklogItemResponse>>> GetAll(
            [FromQuery] BacklogCategory? category = null,
            [FromQuery] string? search = null,
            [FromQuery] bool includeArchived = false)
        {
            var items = await _unitOfWork.BacklogItems.GetFilteredAsync(category, search, includeArchived);
            return Ok(items.Select(MapToResponse));
        }

        /// <summary>GET /api/backlog-items/{id} — Get a single backlog item.</summary>
        [HttpGet("{id:guid}")]
        public async Task<ActionResult<BacklogItemResponse>> GetById(Guid id)
        {
            var item = await _unitOfWork.BacklogItems.GetByIdAsync(id);
            if (item == null) return NotFound();
            return Ok(MapToResponse(item));
        }

        /// <summary>POST /api/backlog-items — Create a new backlog item.</summary>
        [HttpPost]
        public async Task<ActionResult<BacklogItemResponse>> Create([FromBody] CreateBacklogItemRequest request)
        {
            // Validation
            if (string.IsNullOrWhiteSpace(request.Title))
                return BadRequest("Title is required.");
            if (request.EstimatedHours <= 0)
                return BadRequest("Estimated hours must be greater than 0.");

            var item = new BacklogItem
            {
                Id = Guid.NewGuid(),
                Title = request.Title.Trim(),
                Description = request.Description?.Trim(),
                Category = request.Category,
                EstimatedHours = request.EstimatedHours,
                IsArchived = false,
                CreatedAt = DateTime.UtcNow
            };

            await _unitOfWork.BacklogItems.AddAsync(item);
            await _unitOfWork.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = item.Id }, MapToResponse(item));
        }

        /// <summary>PUT /api/backlog-items/{id} — Update a backlog item.</summary>
        [HttpPut("{id:guid}")]
        public async Task<ActionResult<BacklogItemResponse>> Update(Guid id, [FromBody] UpdateBacklogItemRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Title))
                return BadRequest("Title is required.");
            if (request.EstimatedHours <= 0)
                return BadRequest("Estimated hours must be greater than 0.");

            var item = await _unitOfWork.BacklogItems.GetByIdAsync(id);
            if (item == null) return NotFound();

            item.Title = request.Title.Trim();
            item.Description = request.Description?.Trim();
            item.Category = request.Category;
            item.EstimatedHours = request.EstimatedHours;

            _unitOfWork.BacklogItems.Update(item);
            await _unitOfWork.SaveChangesAsync();

            return Ok(MapToResponse(item));
        }

        /// <summary>PUT /api/backlog-items/{id}/archive — Archive a backlog item.</summary>
        [HttpPut("{id:guid}/archive")]
        public async Task<IActionResult> Archive(Guid id)
        {
            var item = await _unitOfWork.BacklogItems.GetByIdAsync(id);
            if (item == null) return NotFound();

            item.IsArchived = true;
            _unitOfWork.BacklogItems.Update(item);
            await _unitOfWork.SaveChangesAsync();

            return NoContent();
        }

        /// <summary>PUT /api/backlog-items/{id}/unarchive — Restore an archived backlog item.</summary>
        [HttpPut("{id:guid}/unarchive")]
        public async Task<IActionResult> Unarchive(Guid id)
        {
            var item = await _unitOfWork.BacklogItems.GetByIdAsync(id);
            if (item == null) return NotFound();

            item.IsArchived = false;
            _unitOfWork.BacklogItems.Update(item);
            await _unitOfWork.SaveChangesAsync();

            return NoContent();
        }

        /// <summary>DELETE /api/backlog-items/{id} — Permanently delete a backlog item.</summary>
        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var item = await _unitOfWork.BacklogItems.GetByIdAsync(id);
            if (item == null) return NotFound();

            _unitOfWork.BacklogItems.Remove(item);
            await _unitOfWork.SaveChangesAsync();

            return NoContent();
        }

        /// <summary>Maps a BacklogItem entity to a response DTO.</summary>
        private static BacklogItemResponse MapToResponse(BacklogItem item) => new()
        {
            Id = item.Id,
            Title = item.Title,
            Description = item.Description,
            Category = item.Category,
            EstimatedHours = item.EstimatedHours,
            IsArchived = item.IsArchived,
            CreatedAt = item.CreatedAt
        };
    }
}
