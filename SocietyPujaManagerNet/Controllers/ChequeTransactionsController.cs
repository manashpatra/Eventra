using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SocietyPujaManagerNet.Data;
using SocietyPujaManagerNet.Models;
using SocietyPujaManagerNet.Services;

namespace SocietyPujaManagerNet.Controllers;

[ApiController]
[Route("api/cheque-transactions")]
[Route("api/withdraw-transactions")]
[Route("api/withdrawals")]
public class ChequeTransactionsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IAuditService _audit;
    private readonly IDashboardStatsService _stats;

    public ChequeTransactionsController(AppDbContext db, IAuditService audit, IDashboardStatsService stats)
    {
        _db = db;
        _audit = audit;
        _stats = stats;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await _db.ChequeTransactions.OrderByDescending(c => c.TransactionDate).ToListAsync());

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var item = await _db.ChequeTransactions.FindAsync(id);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> Create([FromBody] ChequeTransaction data)
    {
        data.Id = Guid.NewGuid().ToString();
        data.CreatedAt = DateTime.UtcNow;
        data.UpdatedAt = DateTime.UtcNow;
        _db.ChequeTransactions.Add(data);
        await _db.SaveChangesAsync();
        await _audit.LogAsync("CREATE", "ChequeTransaction", data.Id, data, User);
        _stats.QueueRefresh();
        return Ok(data);
    }

    [HttpPut("{id}")]
    [Authorize]
    public async Task<IActionResult> Update(string id, [FromBody] ChequeTransaction data)
    {
        var existing = await _db.ChequeTransactions.FindAsync(id);
        if (existing == null) return NotFound();

        existing.ChequeNumber = data.ChequeNumber;
        existing.TransactionDate = data.TransactionDate;
        existing.Amount = data.Amount;
        existing.TransactionType = data.TransactionType;
        existing.VendorName = data.VendorName;
        existing.Remarks = data.Remarks;
        existing.ExpenseId = data.ExpenseId;
        existing.UpdatedAt = DateTime.UtcNow;
        
        await _db.SaveChangesAsync();
        await _audit.LogAsync("UPDATE", "ChequeTransaction", id, data, User);
        _stats.QueueRefresh();
        return Ok(existing);
    }

    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> Delete(string id)
    {
        var existing = await _db.ChequeTransactions.FindAsync(id);
        if (existing == null) return NotFound();
        _db.ChequeTransactions.Remove(existing);
        await _db.SaveChangesAsync();
        await _audit.LogAsync("DELETE", "ChequeTransaction", id, existing, User);
        _stats.QueueRefresh();
        return Ok();
    }
}
