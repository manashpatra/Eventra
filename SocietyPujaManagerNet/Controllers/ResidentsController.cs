using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SocietyPujaManagerNet.Data;
using SocietyPujaManagerNet.Models;
using SocietyPujaManagerNet.Services;

namespace SocietyPujaManagerNet.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ResidentsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IAuditService _audit;
    private readonly IDashboardStatsService _stats;
    private readonly IPaymentProofService _proofService;

    public ResidentsController(AppDbContext db, IAuditService audit, IDashboardStatsService stats, IPaymentProofService proofService)
    {
        _db = db;
        _audit = audit;
        _stats = stats;
        _proofService = proofService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await _db.Residents.ToListAsync());

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var resident = await _db.Residents.FindAsync(id);
        return resident == null ? NotFound() : Ok(resident);
    }

    [HttpGet("search")]
    public async Task<IActionResult> Search([FromQuery] string? term, [FromQuery] string? block, [FromQuery] string? status, [FromQuery] string? paymentMode, [FromQuery] string? date)
    {
        var query = _db.Residents.AsQueryable();
        if (!string.IsNullOrEmpty(block) && block != "all")
            query = query.Where(r => r.Block == int.Parse(block));
        if (!string.IsNullOrEmpty(status) && status != "all")
            query = query.Where(r => r.SubscriptionStatus == status);
        if (!string.IsNullOrEmpty(paymentMode) && paymentMode != "all")
            query = query.Where(r => r.PaymentMode == paymentMode);
        if (!string.IsNullOrEmpty(term))
        {
            var lowerTerm = term.ToLower();
            query = query.Where(r =>
                r.Name.ToLower().Contains(lowerTerm) ||
                r.FlatNumber.ToLower().Contains(lowerTerm) ||
                r.Mobile.Contains(term));
        }
        return Ok(await query.ToListAsync());
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> Create([FromBody] Resident data)
    {
        data.Id = Guid.NewGuid().ToString();
        data.FlatNumber = $"{data.Block}-{data.Floor}-{data.FlatType}";
        data.SubscriptionStatus = "pending";
        data.CreatedAt = DateTime.UtcNow;
        data.UpdatedAt = DateTime.UtcNow;
        _db.Residents.Add(data);
        await _db.SaveChangesAsync();
        await _audit.LogAsync("CREATE", "Resident", data.Id, data, User);
        _stats.QueueRefresh();
        return Ok(data);
    }

    [HttpPut("{id}")]
    [Authorize]
    public async Task<IActionResult> Update(string id, [FromBody] Resident data)
    {
        var existing = await _db.Residents.FindAsync(id);
        if (existing == null) return NotFound();

        existing.Name = data.Name;
        existing.Mobile = data.Mobile;
        existing.Email = data.Email;
        existing.Block = data.Block;
        existing.Floor = data.Floor;
        existing.FlatType = data.FlatType;
        existing.FlatNumber = $"{data.Block}-{data.Floor}-{data.FlatType}";
        existing.Remarks = data.Remarks;
        existing.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        await _audit.LogAsync("UPDATE", "Resident", id, data, User);
        _stats.QueueRefresh();
        return Ok(existing);
    }

    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> Delete(string id)
    {
        var existing = await _db.Residents.FindAsync(id);
        if (existing == null) return NotFound();
        _db.Residents.Remove(existing);
        await _db.SaveChangesAsync();
        await _proofService.DeleteProofAsync(id);
        await _audit.LogAsync("DELETE", "Resident", id, existing, User);
        _stats.QueueRefresh();
        return Ok();
    }

    [HttpPost("{id}/subscription")]
    [Authorize]
    public async Task<IActionResult> RecordSubscription(string id, [FromBody] Dictionary<string, object> paymentData)
    {
        var existing = await _db.Residents.FindAsync(id);
        if (existing == null) return NotFound();

        existing.SubscriptionStatus = "paid";
        existing.SubscriptionAmount = paymentData.ContainsKey("amount") ? Convert.ToDecimal(paymentData["amount"].ToString()) : 0;
        existing.PaymentDate = DateTime.UtcNow;
        existing.TransactionDate = paymentData.ContainsKey("transactionDate") ? DateTime.Parse(paymentData["transactionDate"].ToString()!) : DateTime.UtcNow;
        existing.PaymentMode = paymentData.ContainsKey("paymentMode") ? paymentData["paymentMode"].ToString() : "Cash";
        existing.Remarks = paymentData.ContainsKey("remarks") ? paymentData["remarks"].ToString() ?? "" : "";
        existing.UpdatedAt = DateTime.UtcNow;

        if (paymentData.ContainsKey("proofImages"))
        {
            var images = System.Text.Json.JsonSerializer.Deserialize<List<string>>(paymentData["proofImages"].ToString()!);
            if (images != null && images.Count > 0)
            {
                await _proofService.SaveProofAsync(id, images);
                existing.PaymentProofUrl = $"paymentProofs/{id}";
            }
        }

        await _db.SaveChangesAsync();
        await _audit.LogAsync("CREATE", "Subscription", id, paymentData, User);
        _stats.QueueRefresh();
        return Ok(existing);
    }

    [HttpDelete("{id}/subscription")]
    [Authorize]
    public async Task<IActionResult> DeleteSubscription(string id)
    {
        var existing = await _db.Residents.FindAsync(id);
        if (existing == null) return NotFound();

        existing.SubscriptionStatus = "pending";
        existing.SubscriptionAmount = 0;
        existing.PaymentDate = null;
        existing.TransactionDate = null;
        existing.PaymentMode = null;
        existing.PaymentProofUrl = null;
        existing.Remarks = "";
        existing.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        await _proofService.DeleteProofAsync(id);
        await _audit.LogAsync("DELETE", "Subscription", id, null, User);
        _stats.QueueRefresh();
        return Ok(existing);
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var all = await _db.Residents.ToListAsync();
        var paid = all.Where(r => r.SubscriptionStatus == "paid").ToList();
        var pending = all.Where(r => r.SubscriptionStatus == "pending").ToList();
        var totalCollected = paid.Sum(r => r.SubscriptionAmount);
        var cashCollected = paid.Where(r => string.Equals(r.PaymentMode, "Cash", StringComparison.OrdinalIgnoreCase)).Sum(r => r.SubscriptionAmount);

        return Ok(new
        {
            totalFlats = all.Count,
            paidCount = paid.Count,
            pendingCount = pending.Count,
            totalCollected,
            cashCollected,
            bankCollected = totalCollected - cashCollected,
            cashCount = paid.Count(r => string.Equals(r.PaymentMode, "Cash", StringComparison.OrdinalIgnoreCase)),
            accountCount = paid.Count(r => !string.Equals(r.PaymentMode, "Cash", StringComparison.OrdinalIgnoreCase)),
            collectionPercentage = all.Count > 0 ? Math.Round((double)paid.Count / all.Count * 100, 1) : 0.0
        });
    }
}
