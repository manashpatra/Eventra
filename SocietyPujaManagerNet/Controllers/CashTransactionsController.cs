using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SocietyPujaManagerNet.Data;
using SocietyPujaManagerNet.Models;
using SocietyPujaManagerNet.Services;

namespace SocietyPujaManagerNet.Controllers;

[ApiController]
[Route("api/[controller]")]
[Route("api/cash-transactions")]
public class CashTransactionsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IAuditService _audit;
    private readonly IDashboardStatsService _stats;

    public CashTransactionsController(AppDbContext db, IAuditService audit, IDashboardStatsService stats)
    {
        _db = db;
        _audit = audit;
        _stats = stats;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await _db.CashTransactions.OrderByDescending(t => t.CreatedAt).ToListAsync());

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var item = await _db.CashTransactions.FindAsync(id);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> Create([FromBody] CashTransaction data)
    {
        if (string.IsNullOrEmpty(data.Id))
        {
            data.Id = Guid.NewGuid().ToString();
        }
        data.CreatedAt = DateTime.UtcNow;
        _db.CashTransactions.Add(data);
        await _db.SaveChangesAsync();
        await _audit.LogAsync("CREATE", "CashTransaction", data.Id, data, User);
        _stats.QueueRefresh();
        return Ok(data);
    }

    [HttpPut("{id}")]
    [Authorize]
    public async Task<IActionResult> Update(string id, [FromBody] CashTransaction data)
    {
        var existing = await _db.CashTransactions.FindAsync(id);
        if (existing == null) return NotFound();

        existing.Amount = data.Amount;
        existing.BalanceAfter = data.BalanceAfter;
        existing.Date = data.Date ?? existing.Date;
        existing.Reason = data.Reason ?? existing.Reason;
        existing.Notes = data.Notes ?? existing.Notes;
        existing.UpdatedAt = DateTime.UtcNow;
        existing.UpdatedBy = data.UpdatedBy ?? User?.Identity?.Name ?? "Admin";

        await _db.SaveChangesAsync();
        await _audit.LogAsync("UPDATE", "CashTransaction", id, data, User);
        _stats.QueueRefresh();
        return Ok(existing);
    }

    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> Delete(string id)
    {
        var existing = await _db.CashTransactions.FindAsync(id);
        if (existing == null) return NotFound();
        _db.CashTransactions.Remove(existing);
        await _db.SaveChangesAsync();
        await _audit.LogAsync("DELETE", "CashTransaction", id, existing, User);
        _stats.QueueRefresh();
        return Ok();
    }
}
