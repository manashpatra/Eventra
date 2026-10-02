using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SocietyPujaManagerNet.Data;
using SocietyPujaManagerNet.Models;
using SocietyPujaManagerNet.Services;
using System.Text.Json;

namespace SocietyPujaManagerNet.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class VendorsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IAuditService _audit;

    public VendorsController(AppDbContext db, IAuditService audit)
    {
        _db = db;
        _audit = audit;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await _db.Vendors.OrderByDescending(v => v.CreatedAt).ToListAsync());

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var item = await _db.Vendors.FindAsync(id);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Vendor data)
    {
        data.Id = Guid.NewGuid().ToString();
        data.CreatedAt = DateTime.UtcNow;
        data.UpdatedAt = DateTime.UtcNow;
        _db.Vendors.Add(data);
        await _db.SaveChangesAsync();
        await _audit.LogAsync("CREATE", "Vendor", data.Id, data, User);
        return Ok(data);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] Vendor data)
    {
        var existing = await _db.Vendors.FindAsync(id);
        if (existing == null) return NotFound();

        existing.VendorFor = data.VendorFor;
        existing.Name = data.Name;
        existing.Contact = data.Contact;
        existing.Email = data.Email;
        existing.Address = data.Address;
        existing.Description = data.Description;
        existing.DealAmount = data.DealAmount;
        existing.DealImageUrl = data.DealImageUrl;
        existing.ExpenseCategory = data.ExpenseCategory;
        existing.ExpenseSubCategory = data.ExpenseSubCategory;
        existing.UpdatedAt = DateTime.UtcNow;
        
        await _db.SaveChangesAsync();
        await _audit.LogAsync("UPDATE", "Vendor", id, data, User);
        return Ok(existing);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var existing = await _db.Vendors.FindAsync(id);
        if (existing == null) return NotFound();
        _db.Vendors.Remove(existing);
        await _db.SaveChangesAsync();
        await _audit.LogAsync("DELETE", "Vendor", id, existing, User);
        return Ok();
    }

    [HttpPost("{id}/payments")]
    public async Task<IActionResult> AddPayment(string id, [FromBody] VendorPayment payment)
    {
        var existing = await _db.Vendors.FindAsync(id);
        if (existing == null) return NotFound();

        payment.Id = Guid.NewGuid().ToString();
        var payments = JsonSerializer.Deserialize<List<VendorPayment>>(existing.PaymentsJson) ?? new List<VendorPayment>();
        payments.Add(payment);
        
        existing.PaymentsJson = JsonSerializer.Serialize(payments);
        existing.UpdatedAt = DateTime.UtcNow;
        
        await _db.SaveChangesAsync();
        await _audit.LogAsync("CREATE", "VendorPayment", $"{id}/{payment.Id}", payment, User);
        return Ok(existing);
    }

    [HttpDelete("{id}/payments/{paymentId}")]
    public async Task<IActionResult> DeletePayment(string id, string paymentId)
    {
        var existing = await _db.Vendors.FindAsync(id);
        if (existing == null) return NotFound();

        var payments = JsonSerializer.Deserialize<List<VendorPayment>>(existing.PaymentsJson) ?? new List<VendorPayment>();
        var payment = payments.FirstOrDefault(p => p.Id == paymentId);
        if (payment != null)
        {
            payments.Remove(payment);
            existing.PaymentsJson = JsonSerializer.Serialize(payments);
            existing.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            await _audit.LogAsync("DELETE", "VendorPayment", $"{id}/{paymentId}", null, User);
        }
        return Ok(existing);
    }
}
