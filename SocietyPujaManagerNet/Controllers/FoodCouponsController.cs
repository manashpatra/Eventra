using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SocietyPujaManagerNet.Data;
using SocietyPujaManagerNet.Models;
using SocietyPujaManagerNet.Services;
using System.Text.Json;

namespace SocietyPujaManagerNet.Controllers;

[ApiController]
[Route("api/food-coupons")]
public class FoodCouponsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IAuditService _audit;
    private readonly IDashboardStatsService _stats;

    public FoodCouponsController(AppDbContext db, IAuditService audit, IDashboardStatsService stats)
    {
        _db = db;
        _audit = audit;
        _stats = stats;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await _db.FoodCoupons.OrderByDescending(f => f.CreatedAt).ToListAsync());

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var item = await _db.FoodCoupons.FindAsync(id);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpGet("by-resident/{residentId}")]
    public async Task<IActionResult> GetByResident(string residentId) =>
        Ok(await _db.FoodCoupons.Where(f => f.ResidentId == residentId).OrderByDescending(f => f.CreatedAt).ToListAsync());

    [HttpGet("flat-docs")]
    public async Task<IActionResult> GetAllFlatDocs()
    {
        var flatDocs = await _db.FoodCouponDocs.ToListAsync();
        var allCoupons = await _db.FoodCoupons.OrderByDescending(f => f.CreatedAt).ToListAsync();

        var result = new List<object>();

        // Flats with explicit doc
        foreach (var doc in flatDocs)
        {
            var couponsForDoc = allCoupons.Where(c => c.FlatDocId == doc.Id || (string.IsNullOrEmpty(c.FlatDocId) && c.FlatNumber == doc.FlatNumber)).ToList();
            result.Add(new
            {
                id = doc.Id,
                flatNumber = doc.FlatNumber,
                residentId = doc.ResidentId,
                residentName = doc.ResidentName,
                accessCode = doc.AccessCode,
                createdAt = doc.CreatedAt,
                updatedAt = doc.UpdatedAt,
                coupons = couponsForDoc
            });
        }

        // Add any coupons with a FlatDocId that wasn't in flatDocs, or grouped by flat
        var accountedFlatNumbers = new HashSet<string>(flatDocs.Select(d => d.FlatNumber));
        var orphanCouponsByFlat = allCoupons.Where(c => !accountedFlatNumbers.Contains(c.FlatNumber)).GroupBy(c => c.FlatNumber);

        foreach (var group in orphanCouponsByFlat)
        {
            var first = group.First();
            var docId = first.FlatDocId ?? Guid.NewGuid().ToString();
            result.Add(new
            {
                id = docId,
                flatNumber = group.Key,
                residentId = first.ResidentId,
                residentName = first.ResidentName,
                accessCode = first.AccessCode ?? "",
                createdAt = first.CreatedAt,
                updatedAt = first.UpdatedAt,
                coupons = group.ToList()
            });
        }

        return Ok(result);
    }

    [HttpGet("by-flat/{flatNumber}")]
    public async Task<IActionResult> GetByFlat(string flatNumber)
    {
        var doc = await _db.FoodCouponDocs.FirstOrDefaultAsync(d => d.FlatNumber == flatNumber);
        var coupons = await _db.FoodCoupons.Where(c => c.FlatNumber == flatNumber).OrderByDescending(f => f.CreatedAt).ToListAsync();

        if (doc == null && coupons.Count == 0) return NotFound();

        return Ok(new
        {
            id = doc?.Id ?? coupons.FirstOrDefault()?.FlatDocId ?? Guid.NewGuid().ToString(),
            flatNumber,
            residentId = doc?.ResidentId ?? coupons.FirstOrDefault()?.ResidentId ?? "",
            residentName = doc?.ResidentName ?? coupons.FirstOrDefault()?.ResidentName ?? "",
            accessCode = doc?.AccessCode ?? coupons.FirstOrDefault()?.AccessCode ?? "",
            coupons
        });
    }

    [HttpGet("doc/{flatDocId}")]
    public async Task<IActionResult> GetDocById(string flatDocId)
    {
        var doc = await _db.FoodCouponDocs.FindAsync(flatDocId);
        var coupons = await _db.FoodCoupons.Where(c => c.FlatDocId == flatDocId).OrderByDescending(f => f.CreatedAt).ToListAsync();

        if (doc == null)
        {
            if (coupons.Count == 0) return NotFound();
            var first = coupons.First();
            return Ok(new
            {
                id = flatDocId,
                flatNumber = first.FlatNumber,
                residentId = first.ResidentId,
                residentName = first.ResidentName,
                accessCode = first.AccessCode ?? "",
                coupons
            });
        }

        return Ok(new
        {
            id = doc.Id,
            flatNumber = doc.FlatNumber,
            residentId = doc.ResidentId,
            residentName = doc.ResidentName,
            accessCode = doc.AccessCode,
            coupons
        });
    }

    [HttpGet("entry/{flatDocId}/{couponId}")]
    public async Task<IActionResult> GetEntry(string flatDocId, string couponId)
    {
        var coupon = await _db.FoodCoupons.FindAsync(couponId);
        if (coupon == null) return NotFound();

        return Ok(coupon);
    }

    [HttpPost("validate-access-code")]
    public async Task<IActionResult> ValidateAccessCode([FromBody] JsonElement body)
    {
        string flatNumber = body.TryGetProperty("flatNumber", out var fn) ? fn.GetString() ?? "" : "";
        string accessCode = body.TryGetProperty("accessCode", out var ac) ? ac.GetString() ?? "" : "";

        if (string.IsNullOrWhiteSpace(flatNumber) || string.IsNullOrWhiteSpace(accessCode))
        {
            return BadRequest(new { error = "Flat number and access code are required" });
        }

        var doc = await _db.FoodCouponDocs.FirstOrDefaultAsync(d => d.FlatNumber == flatNumber);
        var coupons = await _db.FoodCoupons.Where(c => c.FlatNumber == flatNumber).OrderByDescending(f => f.CreatedAt).ToListAsync();

        string expectedCode = doc?.AccessCode ?? coupons.FirstOrDefault()?.AccessCode ?? "";
        if (string.IsNullOrEmpty(expectedCode) || expectedCode != accessCode)
        {
            return Unauthorized(new { error = "Invalid access code" });
        }

        return Ok(new
        {
            id = doc?.Id ?? coupons.FirstOrDefault()?.FlatDocId ?? Guid.NewGuid().ToString(),
            flatNumber,
            residentId = doc?.ResidentId ?? coupons.FirstOrDefault()?.ResidentId ?? "",
            residentName = doc?.ResidentName ?? coupons.FirstOrDefault()?.ResidentName ?? "",
            accessCode,
            coupons
        });
    }

    [HttpPost("update-access-code")]
    [Authorize]
    public async Task<IActionResult> UpdateAccessCode([FromBody] JsonElement body)
    {
        string flatDocId = body.TryGetProperty("flatDocId", out var fd) ? fd.GetString() ?? "" : "";
        string flatNumber = body.TryGetProperty("flatNumber", out var fn) ? fn.GetString() ?? "" : "";
        string newAccessCode = body.TryGetProperty("accessCode", out var ac) ? ac.GetString() ?? "" : "";

        if (string.IsNullOrWhiteSpace(newAccessCode))
        {
            return BadRequest(new { error = "New access code is required" });
        }

        FoodCouponDoc? doc = null;
        if (!string.IsNullOrEmpty(flatDocId))
        {
            doc = await _db.FoodCouponDocs.FindAsync(flatDocId);
        }
        if (doc == null && !string.IsNullOrEmpty(flatNumber))
        {
            doc = await _db.FoodCouponDocs.FirstOrDefaultAsync(d => d.FlatNumber == flatNumber);
        }

        if (doc != null)
        {
            doc.AccessCode = newAccessCode;
            doc.UpdatedAt = DateTime.UtcNow;
        }
        else if (!string.IsNullOrEmpty(flatNumber))
        {
            var firstCoupon = await _db.FoodCoupons.FirstOrDefaultAsync(c => c.FlatNumber == flatNumber);
            doc = new FoodCouponDoc
            {
                Id = string.IsNullOrEmpty(flatDocId) ? Guid.NewGuid().ToString() : flatDocId,
                FlatNumber = flatNumber,
                ResidentId = firstCoupon?.ResidentId ?? "",
                ResidentName = firstCoupon?.ResidentName ?? "",
                AccessCode = newAccessCode,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _db.FoodCouponDocs.Add(doc);
        }

        // Also update AccessCode on coupons for this flat
        var flatCoupons = await _db.FoodCoupons
            .Where(c => (doc != null && c.FlatDocId == doc.Id) || (!string.IsNullOrEmpty(flatNumber) && c.FlatNumber == flatNumber))
            .ToListAsync();

        foreach (var c in flatCoupons)
        {
            c.AccessCode = newAccessCode;
            if (doc != null) c.FlatDocId = doc.Id;
            c.UpdatedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();
        await _audit.LogAsync("UPDATE", "FoodCouponAccessCode", doc?.Id ?? flatDocId, new { newAccessCode }, User);
        return Ok(new { success = true, accessCode = newAccessCode });
    }

    [HttpPost("issue-online")]
    [Authorize]
    public async Task<IActionResult> IssueOnline([FromBody] JsonElement body)
    {
        string residentId = body.TryGetProperty("residentId", out var rId) ? rId.GetString() ?? "" : "";
        string flatNumber = body.TryGetProperty("flatNumber", out var fn) ? fn.GetString() ?? "" : "";
        string residentName = body.TryGetProperty("residentName", out var rn) ? rn.GetString() ?? "" : "";
        string accessCode = body.TryGetProperty("accessCode", out var ac) ? ac.GetString() ?? "" : "";
        string paymentMode = body.TryGetProperty("paymentMode", out var pm) ? pm.GetString() ?? "Cash" : "Cash";
        string remarks = body.TryGetProperty("remarks", out var rem) ? rem.GetString() ?? "" : "";
        string issuedBy = body.TryGetProperty("issuedBy", out var ib) ? ib.GetString() ?? "" : "";

        // Find or create flat doc
        var doc = await _db.FoodCouponDocs.FirstOrDefaultAsync(d => d.FlatNumber == flatNumber);
        if (doc == null)
        {
            if (string.IsNullOrEmpty(accessCode))
            {
                var random = new Random();
                accessCode = random.Next(1000, 9999).ToString();
            }

            doc = new FoodCouponDoc
            {
                Id = Guid.NewGuid().ToString(),
                FlatNumber = flatNumber,
                ResidentId = residentId,
                ResidentName = residentName,
                AccessCode = accessCode,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _db.FoodCouponDocs.Add(doc);
        }
        else if (!string.IsNullOrEmpty(accessCode))
        {
            doc.AccessCode = accessCode;
            doc.UpdatedAt = DateTime.UtcNow;
        }

        var createdCoupons = new List<FoodCoupon>();

        if (body.TryGetProperty("cartItems", out var itemsElement) && itemsElement.ValueKind == JsonValueKind.Array)
        {
            foreach (var item in itemsElement.EnumerateArray())
            {
                var coupon = new FoodCoupon
                {
                    Id = Guid.NewGuid().ToString(),
                    ResidentId = residentId,
                    ResidentName = residentName,
                    FlatNumber = flatNumber,
                    FlatDocId = doc.Id,
                    AccessCode = doc.AccessCode,
                    Day = item.TryGetProperty("day", out var d) ? d.GetString() ?? "" : "",
                    DayDate = item.TryGetProperty("dayDate", out var dd) ? dd.GetString() ?? "" : "",
                    MealType = item.TryGetProperty("mealType", out var mt) ? mt.GetString() ?? "" : "",
                    FoodType = item.TryGetProperty("foodType", out var ft) ? ft.GetString() ?? "Veg" : "Veg",
                    NormalDineOutCount = item.TryGetProperty("normalDineOutCount", out var ndo) ? ndo.GetInt32() : 0,
                    NormalParcelCount = item.TryGetProperty("normalParcelCount", out var np) ? np.GetInt32() : 0,
                    AdditionalDineOutCount = item.TryGetProperty("additionalDineOutCount", out var ado) ? ado.GetInt32() : 0,
                    AdditionalParcelCount = item.TryGetProperty("additionalParcelCount", out var ap) ? ap.GetInt32() : 0,
                    NormalPrice = item.TryGetProperty("normalPrice", out var npri) ? npri.GetDecimal() : 0,
                    AdditionalPrice = item.TryGetProperty("additionalPrice", out var apri) ? apri.GetDecimal() : 0,
                    ParcelPackingCharge = item.TryGetProperty("parcelPackingCharge", out var ppc) ? ppc.GetDecimal() : 0,
                    TotalAmount = item.TryGetProperty("totalAmount", out var ta) ? ta.GetDecimal() : 0,
                    FocValue = item.TryGetProperty("focValue", out var fv) ? fv.GetDecimal() : 0,
                    PaymentMode = paymentMode,
                    Remarks = remarks,
                    IssuedBy = issuedBy,
                    CouponNumbers = item.TryGetProperty("couponNumbers", out var cn) ? cn.GetString() ?? "" : "",
                    IsOnline = true,
                    Redeemed = false,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _db.FoodCoupons.Add(coupon);
                createdCoupons.Add(coupon);
            }
        }

        await _db.SaveChangesAsync();
        await _audit.LogAsync("ISSUE_ONLINE", "FoodCoupon", doc.Id, new { flatNumber, count = createdCoupons.Count }, User);
        _stats.QueueRefresh();

        return Ok(new
        {
            id = doc.Id,
            flatNumber = doc.FlatNumber,
            residentId = doc.ResidentId,
            residentName = doc.ResidentName,
            accessCode = doc.AccessCode,
            coupons = createdCoupons
        });
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> Create([FromBody] FoodCoupon data)
    {
        data.Id = string.IsNullOrEmpty(data.Id) ? Guid.NewGuid().ToString() : data.Id;
        data.CreatedAt = DateTime.UtcNow;
        data.UpdatedAt = DateTime.UtcNow;
        _db.FoodCoupons.Add(data);
        await _db.SaveChangesAsync();
        await _audit.LogAsync("CREATE", "FoodCoupon", data.Id, data, User);
        _stats.QueueRefresh();
        return Ok(data);
    }

    [HttpPost("{id}/serve")]
    [Authorize]
    public async Task<IActionResult> ServeCoupon(string id, [FromBody] JsonElement body)
    {
        var existing = await _db.FoodCoupons.FindAsync(id);
        if (existing == null) return NotFound();

        string field = body.TryGetProperty("field", out var f) ? f.GetString() ?? "" : "";
        string servedBy = body.TryGetProperty("servedBy", out var sb) ? sb.GetString() ?? "" : (User.Identity?.Name ?? "Admin");
        int increment = body.TryGetProperty("count", out var cnt) ? cnt.GetInt32() : 1;

        if (field == "servedNormalDineOut") existing.ServedNormalDineOut += increment;
        else if (field == "servedNormalParcel") existing.ServedNormalParcel += increment;
        else if (field == "servedAdditionalDineOut") existing.ServedAdditionalDineOut += increment;
        else if (field == "servedAdditionalParcel") existing.ServedAdditionalParcel += increment;

        existing.LastServedBy = servedBy;
        existing.LastServedAt = DateTime.UtcNow;
        existing.UpdatedAt = DateTime.UtcNow;

        bool isFullyServed =
            existing.ServedNormalDineOut >= existing.NormalDineOutCount &&
            existing.ServedNormalParcel >= existing.NormalParcelCount &&
            existing.ServedAdditionalDineOut >= existing.AdditionalDineOutCount &&
            existing.ServedAdditionalParcel >= existing.AdditionalParcelCount;

        if (isFullyServed)
        {
            existing.Redeemed = true;
            existing.RedeemedAt = DateTime.UtcNow;
            existing.RedeemedBy = servedBy;
        }

        await _db.SaveChangesAsync();
        await _audit.LogAsync("SERVE", "FoodCoupon", id, new { field, increment, isFullyServed }, User);
        _stats.QueueRefresh();
        return Ok(existing);
    }

    [HttpPost("{id}/redeem")]
    [Authorize]
    public async Task<IActionResult> RedeemCoupon(string id, [FromBody] JsonElement body)
    {
        var existing = await _db.FoodCoupons.FindAsync(id);
        if (existing == null) return NotFound();

        string redeemedBy = body.TryGetProperty("redeemedBy", out var rb) ? rb.GetString() ?? "" : (User.Identity?.Name ?? "Admin");
        existing.Redeemed = true;
        existing.RedeemedAt = DateTime.UtcNow;
        existing.RedeemedBy = redeemedBy;
        existing.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        await _audit.LogAsync("REDEEM", "FoodCoupon", id, new { redeemedBy }, User);
        _stats.QueueRefresh();
        return Ok(existing);
    }

    [HttpPut("{id}")]
    [Authorize]
    public async Task<IActionResult> Update(string id, [FromBody] FoodCoupon data)
    {
        var existing = await _db.FoodCoupons.FindAsync(id);
        if (existing == null) return NotFound();

        existing.ResidentName = data.ResidentName;
        existing.FlatNumber = data.FlatNumber;
        existing.Day = data.Day;
        existing.DayDate = data.DayDate;
        existing.MealType = data.MealType;
        existing.FoodType = data.FoodType;
        existing.NormalDineOutCount = data.NormalDineOutCount;
        existing.NormalParcelCount = data.NormalParcelCount;
        existing.AdditionalDineOutCount = data.AdditionalDineOutCount;
        existing.AdditionalParcelCount = data.AdditionalParcelCount;
        existing.NormalPrice = data.NormalPrice;
        existing.AdditionalPrice = data.AdditionalPrice;
        existing.ParcelPackingCharge = data.ParcelPackingCharge;
        existing.TotalAmount = data.TotalAmount;
        existing.FocValue = data.FocValue;
        existing.PaymentMode = data.PaymentMode;
        existing.Remarks = data.Remarks;
        existing.IssuedBy = data.IssuedBy;
        existing.CouponNumbers = data.CouponNumbers;
        existing.ServedNormalDineOut = data.ServedNormalDineOut;
        existing.ServedNormalParcel = data.ServedNormalParcel;
        existing.ServedAdditionalDineOut = data.ServedAdditionalDineOut;
        existing.ServedAdditionalParcel = data.ServedAdditionalParcel;
        existing.IsOnline = data.IsOnline;
        existing.Redeemed = data.Redeemed;
        existing.RedeemedAt = data.RedeemedAt;
        existing.RedeemedBy = data.RedeemedBy;
        existing.LastServedBy = data.LastServedBy;
        existing.LastServedAt = data.LastServedAt;
        existing.FlatDocId = data.FlatDocId;
        existing.AccessCode = data.AccessCode;
        existing.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        await _audit.LogAsync("UPDATE", "FoodCoupon", id, data, User);
        _stats.QueueRefresh();
        return Ok(existing);
    }

    [HttpPut("{flatDocId}/{couponId}")]
    [Authorize]
    public async Task<IActionResult> UpdateFlatCoupon(string flatDocId, string couponId, [FromBody] JsonElement body)
    {
        var existing = await _db.FoodCoupons.FindAsync(couponId);
        if (existing == null) return NotFound();

        if (body.TryGetProperty("servedNormalDineOut", out var sndo)) existing.ServedNormalDineOut = sndo.GetInt32();
        if (body.TryGetProperty("servedNormalParcel", out var snp)) existing.ServedNormalParcel = snp.GetInt32();
        if (body.TryGetProperty("servedAdditionalDineOut", out var sado)) existing.ServedAdditionalDineOut = sado.GetInt32();
        if (body.TryGetProperty("servedAdditionalParcel", out var sap)) existing.ServedAdditionalParcel = sap.GetInt32();
        if (body.TryGetProperty("redeemed", out var red)) existing.Redeemed = red.GetBoolean();
        if (body.TryGetProperty("redeemedBy", out var rb)) existing.RedeemedBy = rb.GetString();
        if (body.TryGetProperty("redeemedAt", out var ra)) existing.RedeemedAt = DateTime.UtcNow;
        if (body.TryGetProperty("lastServedBy", out var lsb)) existing.LastServedBy = lsb.GetString();
        if (body.TryGetProperty("lastServedAt", out var lsa)) existing.LastServedAt = DateTime.UtcNow;

        existing.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        await _audit.LogAsync("UPDATE", "FoodCouponEntry", flatDocId, new { couponId }, User);
        _stats.QueueRefresh();

        return Ok(existing);
    }

    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> Delete(string id)
    {
        var existing = await _db.FoodCoupons.FindAsync(id);
        if (existing == null) return NotFound();
        _db.FoodCoupons.Remove(existing);
        await _db.SaveChangesAsync();
        await _audit.LogAsync("DELETE", "FoodCoupon", id, existing, User);
        _stats.QueueRefresh();
        return Ok();
    }

    [HttpDelete("{flatDocId}/{couponId}")]
    [Authorize]
    public async Task<IActionResult> DeleteFlatCoupon(string flatDocId, string couponId)
    {
        var existing = await _db.FoodCoupons.FindAsync(couponId);
        if (existing == null) return NotFound();
        _db.FoodCoupons.Remove(existing);
        await _db.SaveChangesAsync();
        await _audit.LogAsync("DELETE", "FoodCouponEntry", flatDocId, new { deletedCouponId = couponId }, User);
        _stats.QueueRefresh();
        return Ok();
    }
}
