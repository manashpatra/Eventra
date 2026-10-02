using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SocietyPujaManagerNet.Data;
using SocietyPujaManagerNet.Models;
using SocietyPujaManagerNet.Services;

namespace SocietyPujaManagerNet.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SponsorshipsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IAuditService _audit;
    private readonly IDashboardStatsService _stats;
    private readonly IPaymentProofService _proofService;

    public SponsorshipsController(AppDbContext db, IAuditService audit, IDashboardStatsService stats, IPaymentProofService proofService)
    {
        _db = db;
        _audit = audit;
        _stats = stats;
        _proofService = proofService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await _db.Sponsorships.OrderByDescending(s => s.CreatedAt).ToListAsync());

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var item = await _db.Sponsorships.FindAsync(id);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> Create([FromBody] Sponsorship data)
    {
        data.Id = Guid.NewGuid().ToString();
        data.CreatedAt = DateTime.UtcNow;
        data.UpdatedAt = DateTime.UtcNow;
        _db.Sponsorships.Add(data);
        await _db.SaveChangesAsync();
        await _audit.LogAsync("CREATE", "Sponsorship", data.Id, data, User);
        _stats.QueueRefresh();
        return Ok(data);
    }

    [HttpPut("{id}")]
    [Authorize]
    public async Task<IActionResult> Update(string id, [FromBody] Sponsorship data)
    {
        var existing = await _db.Sponsorships.FindAsync(id);
        if (existing == null) return NotFound();

        existing.SponsorName = data.SponsorName;
        existing.SponsorType = data.SponsorType;
        existing.ContactNumber = data.ContactNumber;
        existing.Email = data.Email;
        existing.TrackingLead = data.TrackingLead;
        existing.StatusNote = data.StatusNote;
        existing.Organization = data.Organization;
        existing.Amount = data.Amount;
        existing.PaymentMode = data.PaymentMode;
        existing.Remarks = data.Remarks;
        existing.TransactionDate = data.TransactionDate;
        existing.InvoiceRef = data.InvoiceRef;
        existing.InvoiceDate = data.InvoiceDate;
        existing.InvoiceDescription = data.InvoiceDescription;
        existing.InvoiceQuantity = data.InvoiceQuantity;
        existing.Status = data.Status;
        existing.RefundDate = data.RefundDate;
        existing.RefundMode = data.RefundMode;
        existing.RefundRemarks = data.RefundRemarks;
        existing.UpdatedAt = DateTime.UtcNow;
        
        await _db.SaveChangesAsync();
        await _audit.LogAsync("UPDATE", "Sponsorship", id, data, User);
        _stats.QueueRefresh();
        return Ok(existing);
    }

    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> Delete(string id)
    {
        var existing = await _db.Sponsorships.FindAsync(id);
        if (existing == null) return NotFound();
        _db.Sponsorships.Remove(existing);
        await _db.SaveChangesAsync();
        await _proofService.DeleteProofAsync(id);
        await _audit.LogAsync("DELETE", "Sponsorship", id, existing, User);
        _stats.QueueRefresh();
        return Ok();
    }
}
