using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SocietyPujaManagerNet.Data;
using SocietyPujaManagerNet.Models;
using SocietyPujaManagerNet.Services;

namespace SocietyPujaManagerNet.Controllers;

[ApiController]
[Route("api/[controller]")]
public class NotificationsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IAuditService _audit;

    public NotificationsController(AppDbContext db, IAuditService audit)
    {
        _db = db;
        _audit = audit;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await _db.Notifications.OrderByDescending(n => n.CreatedAt).ToListAsync());

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var item = await _db.Notifications.FindAsync(id);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> Create([FromBody] Notification data)
    {
        if (string.IsNullOrEmpty(data.Id))
            data.Id = Guid.NewGuid().ToString();
        data.CreatedAt = DateTime.UtcNow;
        data.UpdatedAt = DateTime.UtcNow;
        _db.Notifications.Add(data);
        await _db.SaveChangesAsync();
        await _audit.LogAsync("CREATE", "Notification", data.Id, data, User);
        return Ok(data);
    }

    [HttpPut("{id}")]
    [Authorize]
    public async Task<IActionResult> Update(string id, [FromBody] Notification data)
    {
        var existing = await _db.Notifications.FindAsync(id);
        if (existing == null) return NotFound();

        existing.Title = data.Title;
        existing.Message = data.Message;
        existing.Priority = data.Priority;
        existing.Active = data.Active;
        existing.UpdatedAt = DateTime.UtcNow;
        
        await _db.SaveChangesAsync();
        await _audit.LogAsync("UPDATE", "Notification", id, data, User);
        return Ok(existing);
    }

    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> Delete(string id)
    {
        var existing = await _db.Notifications.FindAsync(id);
        if (existing == null) return NotFound();
        _db.Notifications.Remove(existing);
        await _db.SaveChangesAsync();
        await _audit.LogAsync("DELETE", "Notification", id, existing, User);
        return Ok();
    }
}
