using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SocietyPujaManagerNet.Data;
using SocietyPujaManagerNet.Models;
using SocietyPujaManagerNet.Services;
using System.Security.Claims;

namespace SocietyPujaManagerNet.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FeedbackController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IAuditService _audit;
    private readonly IDashboardStatsService _stats;

    public FeedbackController(AppDbContext db, IAuditService audit, IDashboardStatsService stats)
    {
        _db = db;
        _audit = audit;
        _stats = stats;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await _db.Feedbacks.OrderByDescending(f => f.CreatedAt).ToListAsync());

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var item = await _db.Feedbacks.FindAsync(id);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Feedback data)
    {
        data.Id = Guid.NewGuid().ToString();
        data.CreatedAt = DateTime.UtcNow;
        data.UpdatedAt = DateTime.UtcNow;
        if (!string.IsNullOrWhiteSpace(data.FlatNumber))
        {
            data.FlatNumber = data.FlatNumber.Trim().ToUpper();
        }
        if (!string.IsNullOrWhiteSpace(data.Name))
        {
            data.Name = data.Name.Trim();
        }
        if (!string.IsNullOrWhiteSpace(data.PhoneNumber))
        {
            data.PhoneNumber = data.PhoneNumber.Trim();
        }
        if (!string.IsNullOrWhiteSpace(data.Message))
        {
            data.Message = data.Message.Trim();
        }
        _db.Feedbacks.Add(data);
        await _db.SaveChangesAsync();
        await _audit.LogAsync("CREATE", "Feedback", data.Id, data, User);
        _stats.QueueRefresh();
        return Ok(data);
    }

    [HttpPost("{id}/reply")]
    [Authorize]
    public async Task<IActionResult> Reply(string id, [FromBody] Dictionary<string, string> payload)
    {
        var existing = await _db.Feedbacks.FindAsync(id);
        if (existing == null) return NotFound();

        if (!payload.ContainsKey("replyMessage")) return BadRequest(new { error = "replyMessage required" });

        existing.ReplyMessage = payload["replyMessage"];
        existing.RepliedBy = User.FindFirstValue("fullName") ?? User.FindFirstValue(ClaimTypes.Name);
        existing.RepliedAt = DateTime.UtcNow;
        existing.UpdatedAt = DateTime.UtcNow;
        
        await _db.SaveChangesAsync();
        await _audit.LogAsync("UPDATE", "FeedbackReply", id, payload, User);
        return Ok(existing);
    }

    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> Delete(string id)
    {
        var existing = await _db.Feedbacks.FindAsync(id);
        if (existing == null) return NotFound();
        _db.Feedbacks.Remove(existing);
        await _db.SaveChangesAsync();
        await _audit.LogAsync("DELETE", "Feedback", id, existing, User);
        _stats.QueueRefresh();
        return Ok();
    }
}
