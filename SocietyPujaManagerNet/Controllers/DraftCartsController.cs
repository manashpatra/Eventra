using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SocietyPujaManagerNet.Data;
using SocietyPujaManagerNet.Models;
using SocietyPujaManagerNet.Services;
using System.Text.Json;

namespace SocietyPujaManagerNet.Controllers;

[ApiController]
[Route("api/draft-carts")]
public class DraftCartsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IAuditService _audit;
    private readonly IDashboardStatsService _stats;

    public DraftCartsController(AppDbContext db, IAuditService audit, IDashboardStatsService stats)
    {
        _db = db;
        _audit = audit;
        _stats = stats;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await _db.DraftCarts.OrderByDescending(d => d.CreatedAt).ToListAsync());

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var item = await _db.DraftCarts.FindAsync(id);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] DraftCart data)
    {
        data.Id = Guid.NewGuid().ToString();
        data.CreatedAt = DateTime.UtcNow;
        data.UpdatedAt = DateTime.UtcNow;
        _db.DraftCarts.Add(data);
        await _db.SaveChangesAsync();
        await _audit.LogAsync("CREATE", "DraftCart", data.Id, data, User);
        return Ok(data);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] DraftCart data)
    {
        var existing = await _db.DraftCarts.FindAsync(id);
        if (existing == null) return NotFound();

        existing.TotalAmount = data.TotalAmount;
        existing.PaymentMode = data.PaymentMode;
        existing.ItemsJson = data.ItemsJson;
        existing.UpdatedAt = DateTime.UtcNow;
        
        await _db.SaveChangesAsync();
        await _audit.LogAsync("UPDATE", "DraftCart", id, data, User);
        return Ok(existing);
    }

    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> Delete(string id)
    {
        var existing = await _db.DraftCarts.FindAsync(id);
        if (existing == null) return NotFound();
        _db.DraftCarts.Remove(existing);
        await _db.SaveChangesAsync();
        await _audit.LogAsync("DELETE", "DraftCart", id, existing, User);
        return Ok();
    }

    [HttpPost("{id}/confirm")]
    [Authorize]
    public async Task<IActionResult> ConfirmCart(string id)
    {
        var cart = await _db.DraftCarts.FindAsync(id);
        if (cart == null) return NotFound(new { error = "Cart not found" });
        if (cart.Status == "completed") return BadRequest(new { error = "Cart already confirmed" });

        var resident = await _db.Residents.FindAsync(cart.ResidentId);
        if (resident == null) return BadRequest(new { error = "Resident not found" });

        var items = JsonSerializer.Deserialize<List<DraftCartItem>>(cart.ItemsJson);
        if (items == null || items.Count == 0) return BadRequest(new { error = "Cart is empty" });

        using var transaction = await _db.Database.BeginTransactionAsync();
        try
        {
            var createdCoupons = new List<FoodCoupon>();
            
            foreach (var item in items)
            {
                var coupon = new FoodCoupon
                {
                    Id = Guid.NewGuid().ToString(),
                    ResidentId = cart.ResidentId,
                    ResidentName = cart.ResidentName,
                    FlatNumber = cart.FlatNumber,
                    Day = item.Day,
                    DayDate = item.DayDate,
                    MealType = item.MealType,
                    FoodType = item.FoodType,
                    NormalDineOutCount = item.NormalDineOutCount,
                    NormalParcelCount = item.NormalParcelCount,
                    AdditionalDineOutCount = item.AdditionalDineOutCount,
                    AdditionalParcelCount = item.AdditionalParcelCount,
                    NormalPrice = item.NormalPrice,
                    AdditionalPrice = item.AdditionalPrice,
                    ParcelPackingCharge = item.ParcelPackingCharge,
                    TotalAmount = item.TotalAmount,
                    PaymentMode = cart.PaymentMode,
                    Remarks = $"Confirmed from cart {cart.Id}",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _db.FoodCoupons.Add(coupon);
                createdCoupons.Add(coupon);
            }

            cart.Status = "completed";
            cart.UpdatedAt = DateTime.UtcNow;
            
            await _db.SaveChangesAsync();
            await transaction.CommitAsync();

            await _audit.LogAsync("CONFIRM", "DraftCart", cart.Id, new { cartId = cart.Id, itemsCount = items.Count }, User);
            _stats.QueueRefresh();

            return Ok(new { message = "Cart confirmed successfully", coupons = createdCoupons });
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return StatusCode(500, new { error = ex.Message });
        }
    }
}
