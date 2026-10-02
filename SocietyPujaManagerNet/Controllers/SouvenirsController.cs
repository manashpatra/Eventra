using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SocietyPujaManagerNet.Data;
using SocietyPujaManagerNet.Models;
using SocietyPujaManagerNet.Services;

namespace SocietyPujaManagerNet.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SouvenirsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IAuditService _audit;
    private readonly IDashboardStatsService _stats;
    private readonly IPaymentProofService _proofService;

    public SouvenirsController(AppDbContext db, IAuditService audit, IDashboardStatsService stats, IPaymentProofService proofService)
    {
        _db = db;
        _audit = audit;
        _stats = stats;
        _proofService = proofService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await _db.Souvenirs.OrderByDescending(d => d.TransactionDate).ToListAsync());

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var item = await _db.Souvenirs.FindAsync(id);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> Create([FromBody] Souvenir data)
    {
        if (string.IsNullOrEmpty(data.Id))
        {
            data.Id = Guid.NewGuid().ToString();
        }
        data.CreatedAt = DateTime.UtcNow;
        data.UpdatedAt = DateTime.UtcNow;
        _db.Souvenirs.Add(data);
        await _db.SaveChangesAsync();
        await _audit.LogAsync("CREATE", "Souvenir", data.Id, data, User);
        _stats.QueueRefresh();
        return Ok(data);
    }

    [HttpPut("{id}")]
    [Authorize]
    public async Task<IActionResult> Update(string id, [FromBody] Souvenir data)
    {
        var existing = await _db.Souvenirs.FindAsync(id);
        if (existing == null) return NotFound();

        existing.ResidentName = data.ResidentName;
        existing.FlatNumber = data.FlatNumber;
        existing.DonorName = data.DonorName;
        existing.Amount = data.Amount;
        existing.PaymentMode = data.PaymentMode;
        existing.Remarks = data.Remarks;
        existing.PaymentProofUrl = data.PaymentProofUrl;
        existing.TransactionDate = data.TransactionDate;
        existing.UpdatedAt = DateTime.UtcNow;
        
        await _db.SaveChangesAsync();
        await _audit.LogAsync("UPDATE", "Souvenir", id, data, User);
        _stats.QueueRefresh();
        return Ok(existing);
    }

    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> Delete(string id)
    {
        var existing = await _db.Souvenirs.FindAsync(id);
        if (existing == null) return NotFound();
        _db.Souvenirs.Remove(existing);
        await _db.SaveChangesAsync();
        await _proofService.DeleteProofAsync(id);
        await _audit.LogAsync("DELETE", "Souvenir", id, existing, User);
        _stats.QueueRefresh();
        return Ok();
    }
}
