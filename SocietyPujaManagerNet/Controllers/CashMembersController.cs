using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SocietyPujaManagerNet.Data;
using SocietyPujaManagerNet.Models;
using SocietyPujaManagerNet.Services;

namespace SocietyPujaManagerNet.Controllers;

[ApiController]
[Route("api/[controller]")]
[Route("api/cash-members")]
public class CashMembersController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IAuditService _audit;
    private readonly IDashboardStatsService _stats;

    public CashMembersController(AppDbContext db, IAuditService audit, IDashboardStatsService stats)
    {
        _db = db;
        _audit = audit;
        _stats = stats;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await _db.CashMembers.OrderBy(m => m.Name).ToListAsync());

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var item = await _db.CashMembers.FindAsync(id);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> Create([FromBody] CashMember data)
    {
        if (string.IsNullOrEmpty(data.Id))
        {
            data.Id = Guid.NewGuid().ToString();
        }
        data.CreatedAt = DateTime.UtcNow;
        _db.CashMembers.Add(data);
        await _db.SaveChangesAsync();
        await _audit.LogAsync("CREATE", "CashMember", data.Id, data, User);
        _stats.QueueRefresh();
        return Ok(data);
    }

    [HttpPut("{id}")]
    [Authorize]
    public async Task<IActionResult> Update(string id, [FromBody] CashMember data)
    {
        var existing = await _db.CashMembers.FindAsync(id);
        if (existing == null) return NotFound();

        existing.Name = data.Name ?? existing.Name;
        existing.Phone = data.Phone ?? existing.Phone;
        existing.Role = data.Role ?? existing.Role;
        existing.InitialBalance = data.InitialBalance;
        existing.CurrentBalance = data.CurrentBalance;
        existing.Notes = data.Notes ?? existing.Notes;
        existing.IsActive = data.IsActive;
        existing.LastTransactionAt = data.LastTransactionAt ?? existing.LastTransactionAt;

        await _db.SaveChangesAsync();
        await _audit.LogAsync("UPDATE", "CashMember", id, data, User);
        _stats.QueueRefresh();
        return Ok(existing);
    }

    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> Delete(string id)
    {
        var existing = await _db.CashMembers.FindAsync(id);
        if (existing == null) return NotFound();
        _db.CashMembers.Remove(existing);
        await _db.SaveChangesAsync();
        await _audit.LogAsync("DELETE", "CashMember", id, existing, User);
        _stats.QueueRefresh();
        return Ok();
    }
}
