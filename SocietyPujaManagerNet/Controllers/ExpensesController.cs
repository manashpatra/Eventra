using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SocietyPujaManagerNet.Data;
using SocietyPujaManagerNet.Models;
using SocietyPujaManagerNet.Services;

namespace SocietyPujaManagerNet.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ExpensesController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IAuditService _audit;
    private readonly IDashboardStatsService _stats;
    private readonly IPaymentProofService _proofService;

    public ExpensesController(AppDbContext db, IAuditService audit, IDashboardStatsService stats, IPaymentProofService proofService)
    {
        _db = db;
        _audit = audit;
        _stats = stats;
        _proofService = proofService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await _db.Expenses.OrderByDescending(e => e.ExpenseDate).ToListAsync());

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var item = await _db.Expenses.FindAsync(id);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> Create([FromBody] Expense data)
    {
        data.Id = Guid.NewGuid().ToString();
        data.CreatedAt = DateTime.UtcNow;
        data.UpdatedAt = DateTime.UtcNow;
        _db.Expenses.Add(data);
        await _db.SaveChangesAsync();
        await _audit.LogAsync("CREATE", "Expense", data.Id, data, User);
        _stats.QueueRefresh();
        return Ok(data);
    }

    [HttpPut("{id}")]
    [Authorize]
    public async Task<IActionResult> Update(string id, [FromBody] Expense data)
    {
        var existing = await _db.Expenses.FindAsync(id);
        if (existing == null) return NotFound();

        existing.PayeeName = data.PayeeName;
        existing.Category = data.Category;
        existing.SubCategory = data.SubCategory;
        existing.Amount = data.Amount;
        existing.PaymentMode = data.PaymentMode;
        existing.Remarks = data.Remarks;
        existing.ExpenseDate = data.ExpenseDate;
        existing.UpdatedAt = DateTime.UtcNow;
        
        await _db.SaveChangesAsync();
        await _audit.LogAsync("UPDATE", "Expense", id, data, User);
        _stats.QueueRefresh();
        return Ok(existing);
    }

    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> Delete(string id)
    {
        var existing = await _db.Expenses.FindAsync(id);
        if (existing == null) return NotFound();
        _db.Expenses.Remove(existing);
        await _db.SaveChangesAsync();
        await _proofService.DeleteProofAsync(id);
        await _audit.LogAsync("DELETE", "Expense", id, existing, User);
        _stats.QueueRefresh();
        return Ok();
    }
}
