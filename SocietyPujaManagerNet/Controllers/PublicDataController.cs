using SocietyPujaManagerNet.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SocietyPujaManagerNet.Data;

namespace SocietyPujaManagerNet.Controllers;

[ApiController]
[Route("api/public")]
public class PublicDataController : ControllerBase
{
    private readonly AppDbContext _db;

    public PublicDataController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet("subscription-report")]
    public async Task<IActionResult> GetSubscriptionReport()
    {
        var all = await _db.Residents.ToListAsync();
        var totalFlats = all.Count;
        var paidResidents = all.Where(r => string.Equals(r.SubscriptionStatus, "paid", StringComparison.OrdinalIgnoreCase)).ToList();
        var totalPaid = paidResidents.Count;
        var totalPending = totalFlats - totalPaid;
        var totalAmount = paidResidents.Sum(r => r.SubscriptionAmount);
        var collectionPercentage = totalFlats > 0 ? Math.Round((double)totalPaid / totalFlats * 100, 1) : 0;

        var blockSummary = all
            .GroupBy(r => {
                if (r.Block > 0) return r.Block;
                var raw = (r.FlatNumber ?? "").Trim();
                var part = raw.Split(new[] { '/', '-' }, StringSplitOptions.RemoveEmptyEntries).FirstOrDefault();
                return int.TryParse(part, out var b) ? b : 0;
            })
            .OrderBy(g => g.Key)
            .Select(g => {
                var paidInBlock = g.Count(r => string.Equals(r.SubscriptionStatus, "paid", StringComparison.OrdinalIgnoreCase));
                var totalInBlock = g.Count();
                return new {
                    block = g.Key,
                    total = totalInBlock,
                    paid = paidInBlock,
                    pending = totalInBlock - paidInBlock,
                    amount = g.Where(r => string.Equals(r.SubscriptionStatus, "paid", StringComparison.OrdinalIgnoreCase)).Sum(r => r.SubscriptionAmount),
                    flats = g.Select(r => new {
                        flatNumber = r.FlatNumber,
                        status = r.SubscriptionStatus,
                        amount = r.SubscriptionAmount
                    }).ToList()
                };
            }).ToList();

        return Ok(new {
            totalFlats,
            totalPaid,
            totalPending,
            totalAmount,
            collectionPercentage,
            blockSummary,
            flats = all.Select(r => new {
                flatNumber = r.FlatNumber,
                status = r.SubscriptionStatus,
                amount = r.SubscriptionAmount
            }).ToList()
        });
    }

    [HttpGet("flat/{flatNumber}")]
    public async Task<IActionResult> GetFlatData(string flatNumber)
    {
        var decoded = Uri.UnescapeDataString(flatNumber ?? "").Trim();
        var variants = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { decoded };

        // Parse block, floor, type if possible
        var clean = decoded.Replace(" ", "").ToUpper();
        var parts = clean.Split(new[] { '-', '/' }, StringSplitOptions.RemoveEmptyEntries);
        string? block = null;
        string? floor = null;
        string? type = null;

        if (parts.Length == 3)
        {
            block = parts[0];
            floor = parts[1];
            type = parts[2];
        }
        else if (parts.Length == 2)
        {
            block = parts[0];
            var rest = parts[1];
            if (rest.Length >= 2)
            {
                type = rest.Substring(rest.Length - 1);
                floor = rest.Substring(0, rest.Length - 1);
            }
        }

        if (!string.IsNullOrEmpty(block) && !string.IsNullOrEmpty(floor) && !string.IsNullOrEmpty(type))
        {
            variants.Add($"{block}/{floor}{type}");      // e.g. 1/1A
            variants.Add($"{block}-{floor}-{type}");    // e.g. 1-1-A
            variants.Add($"{block}-{floor}{type}");     // e.g. 1-1A
            variants.Add($"{block}/{floor}/{type}");    // e.g. 1/1/A
            variants.Add($"{block}{floor}{type}");      // e.g. 11A
        }

        var variantsList = variants.ToList();

        var resident = await _db.Residents.FirstOrDefaultAsync(r => 
            variantsList.Contains(r.FlatNumber));

        if (resident == null)
        {
            resident = new Resident
            {
                Id = "",
                FlatNumber = decoded,
                Name = "",
                SubscriptionStatus = "pending",
                SubscriptionAmount = 0
            };
        }

        var resId = resident?.Id;

        var donations = await _db.Donations
            .Where(d => variantsList.Contains(d.FlatNumber) || (resId != null && d.ResidentId == resId))
            .OrderByDescending(d => d.CreatedAt)
            .ToListAsync();

        var fc = await _db.FoodCoupons
            .Where(f => variantsList.Contains(f.FlatNumber) || (resId != null && f.ResidentId == resId))
            .OrderByDescending(f => f.CreatedAt)
            .ToListAsync();

        var draftCarts = await _db.DraftCarts
            .Where(d => (variantsList.Contains(d.FlatNumber) || (resId != null && d.ResidentId == resId)) && d.Status == "pending")
            .ToListAsync();

        var feedbacks = await _db.Feedbacks
            .Where(f => variantsList.Contains(f.FlatNumber))
            .OrderByDescending(f => f.CreatedAt)
            .ToListAsync();
        
        return Ok(new {
            resident,
            donations,
            foodCoupons = fc,
            draftCarts,
            feedbacks
        });
    }
}


