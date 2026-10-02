using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SocietyPujaManagerNet.Data;
using SocietyPujaManagerNet.Models;
using SocietyPujaManagerNet.Services;

namespace SocietyPujaManagerNet.Controllers;

[ApiController]
[Route("api/leads")]
[Authorize]
public class CollectionTrackerController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IAuditService _audit;
    private readonly IDashboardStatsService _stats;

    public CollectionTrackerController(AppDbContext db, IAuditService audit, IDashboardStatsService stats)
    {
        _db = db;
        _audit = audit;
        _stats = stats;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await _db.CollectionTrackers.OrderByDescending(c => c.CreatedAt).ToListAsync());

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var item = await _db.CollectionTrackers.FindAsync(id);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CollectionTracker data)
    {
        data.Id = Guid.NewGuid().ToString();
        data.CreatedAt = DateTime.UtcNow;
        data.UpdatedAt = DateTime.UtcNow;
        _db.CollectionTrackers.Add(data);
        await _db.SaveChangesAsync();
        await _audit.LogAsync("CREATE", "Lead", data.Id, data, User);
        _stats.QueueRefresh();
        return Ok(data);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] CollectionTracker data)
    {
        var existing = await _db.CollectionTrackers.FindAsync(id);
        if (existing == null) return NotFound();

        existing.Name = data.Name;
        existing.Contact = data.Contact;
        existing.TrackedBy = data.TrackedBy;
        existing.Amount = data.Amount;
        existing.Notes = data.Notes;
        existing.Status = data.Status;
        existing.UpdatedAt = DateTime.UtcNow;
        
        await _db.SaveChangesAsync();
        await _audit.LogAsync("UPDATE", "Lead", id, data, User);
        _stats.QueueRefresh();
        return Ok(existing);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var existing = await _db.CollectionTrackers.FindAsync(id);
        if (existing == null) return NotFound();
        _db.CollectionTrackers.Remove(existing);
        await _db.SaveChangesAsync();
        await _audit.LogAsync("DELETE", "Lead", id, existing, User);
        _stats.QueueRefresh();
        return Ok();
    }
}
