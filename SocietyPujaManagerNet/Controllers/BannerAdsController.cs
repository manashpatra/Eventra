using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SocietyPujaManagerNet.Data;
using SocietyPujaManagerNet.Models;
using SocietyPujaManagerNet.Services;

namespace SocietyPujaManagerNet.Controllers;

[ApiController]
[Route("api/banner-ads")]
public class BannerAdsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IAuditService _audit;

    public BannerAdsController(AppDbContext db, IAuditService audit)
    {
        _db = db;
        _audit = audit;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await _db.BannerAds.OrderByDescending(b => b.Priority).ToListAsync());

    [HttpGet("active")]
    public async Task<IActionResult> GetActive([FromQuery] string? slot)
    {
        var query = _db.BannerAds.Where(b => b.Active);
        if (!string.IsNullOrEmpty(slot))
            query = query.Where(b => b.Slot == slot);
            
        var now = DateTime.UtcNow;
        var ads = await query.ToListAsync();
        
        // Filter by date if specified
        var activeAds = ads.Where(b => 
            (!b.StartDate.HasValue || b.StartDate.Value <= now) &&
            (!b.EndDate.HasValue || b.EndDate.Value >= now)
        ).OrderBy(b => b.Priority).ToList();
        
        return Ok(activeAds);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var item = await _db.BannerAds.FindAsync(id);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> Create([FromBody] BannerAd data)
    {
        data.Id = Guid.NewGuid().ToString();
        data.CreatedAt = DateTime.UtcNow;
        data.UpdatedAt = DateTime.UtcNow;
        _db.BannerAds.Add(data);
        await _db.SaveChangesAsync();
        await _audit.LogAsync("CREATE", "BannerAd", data.Id, data, User);
        return Ok(data);
    }

    [HttpPut("{id}")]
    [Authorize]
    public async Task<IActionResult> Update(string id, [FromBody] BannerAd data)
    {
        var existing = await _db.BannerAds.FindAsync(id);
        if (existing == null) return NotFound();

        existing.Slot = data.Slot;
        existing.ImageData = data.ImageData;
        existing.Active = data.Active;
        existing.StartDate = data.StartDate;
        existing.EndDate = data.EndDate;
        existing.Priority = data.Priority;
        existing.LinkUrl = data.LinkUrl;
        existing.Title = data.Title;
        existing.UpdatedAt = DateTime.UtcNow;
        
        await _db.SaveChangesAsync();
        await _audit.LogAsync("UPDATE", "BannerAd", id, data, User);
        return Ok(existing);
    }

    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> Delete(string id)
    {
        var existing = await _db.BannerAds.FindAsync(id);
        if (existing == null) return NotFound();
        _db.BannerAds.Remove(existing);
        await _db.SaveChangesAsync();
        await _audit.LogAsync("DELETE", "BannerAd", id, existing, User);
        return Ok();
    }
}
