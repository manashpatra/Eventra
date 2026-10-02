using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SocietyPujaManagerNet.Data;
using SocietyPujaManagerNet.Models;
using SocietyPujaManagerNet.Services;

namespace SocietyPujaManagerNet.Controllers;

[ApiController]
[Route("api/cultural-events")]
public class CulturalEventsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IAuditService _audit;

    public CulturalEventsController(AppDbContext db, IAuditService audit)
    {
        _db = db;
        _audit = audit;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await _db.CulturalEvents.OrderByDescending(e => e.CreatedAt).ToListAsync());

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var item = await _db.CulturalEvents.FindAsync(id);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpGet("{id}/stats")]
    public async Task<IActionResult> GetStats(string id)
    {
        var ev = await _db.CulturalEvents.FindAsync(id);
        if (ev == null) return NotFound();

        var apps = await _db.CulturalApplications.Where(a => a.EventId == id).ToListAsync();
        var totalConsumed = apps.Sum(a => a.CapacityConsumed > 0 ? a.CapacityConsumed : 1);
        var totalPaidAmount = apps.Where(a => a.PaymentConfirmed || a.AdminPaymentConfirmed).Sum(a => a.AmountPaid);

        return Ok(new
        {
            eventId = id,
            eventTitle = ev.Title,
            maxCapacity = ev.MaxCapacity,
            totalApplications = apps.Count,
            capacityConsumed = totalConsumed,
            spotsLeft = ev.MaxCapacity > 0 ? Math.Max(0, ev.MaxCapacity - totalConsumed) : (int?)null,
            isFull = ev.MaxCapacity > 0 && totalConsumed >= ev.MaxCapacity,
            totalPaidAmount
        });
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> Create([FromBody] CulturalEvent data)
    {
        data.Id = string.IsNullOrEmpty(data.Id) ? Guid.NewGuid().ToString() : data.Id;
        data.CreatedAt = DateTime.UtcNow;
        data.UpdatedAt = DateTime.UtcNow;

        if (string.IsNullOrWhiteSpace(data.ReadableId))
        {
            var allEvents = await _db.CulturalEvents.Select(e => e.ReadableId).ToListAsync();
            int maxNum = 0;
            foreach (var rId in allEvents)
            {
                if (!string.IsNullOrEmpty(rId) && rId.StartsWith("evt", StringComparison.OrdinalIgnoreCase))
                {
                    if (int.TryParse(rId.Substring(3), out int n) && n > maxNum)
                    {
                        maxNum = n;
                    }
                }
            }
            data.ReadableId = $"evt{(maxNum + 1):D4}";
        }

        _db.CulturalEvents.Add(data);
        await _db.SaveChangesAsync();
        await _audit.LogAsync("CREATE", "CulturalEvent", data.Id, data, User);

        // Auto-publish notification if active
        if (data.Active)
        {
            try
            {
                var notifId = $"event-{data.Id}";
                var dateStr = data.IsTentative ? "Tentative" : (data.EventDate.HasValue ? data.EventDate.Value.ToString("dd/MM/yyyy") : "TBA");
                var msg = $"{data.Description}\n\nEvent Date: {dateStr}\n\nRegister via the Cultural tab!";
                if (data.LastDateToApply.HasValue) msg += $"\nLast Date to Apply: {data.LastDateToApply.Value:dd/MM/yyyy}";

                _db.Notifications.Add(new Notification
                {
                    Id = notifId,
                    Title = $"Cultural Event: {data.Title}",
                    Message = msg,
                    Priority = "general",
                    Active = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });
                await _db.SaveChangesAsync();
            }
            catch { /* Best effort */ }
        }

        return Ok(data);
    }

    [NonAction]
    public Task<IActionResult> Update(string id, CulturalEvent data) =>
        Update(id, System.Text.Json.JsonSerializer.SerializeToElement(data));

    [HttpPut("{id}")]
    [Authorize]
    public async Task<IActionResult> Update(string id, [FromBody] System.Text.Json.JsonElement raw)
    {
        var existing = await _db.CulturalEvents.FindAsync(id);
        if (existing == null) return NotFound();

        bool TryGet(string name, out System.Text.Json.JsonElement el)
        {
            if (raw.TryGetProperty(name, out el)) return true;
            var pascal = char.ToUpperInvariant(name[0]) + name.Substring(1);
            return raw.TryGetProperty(pascal, out el);
        }

        if (TryGet("title", out var pTitle) && pTitle.ValueKind == System.Text.Json.JsonValueKind.String)
            existing.Title = pTitle.GetString() ?? existing.Title;

        if (TryGet("description", out var pDesc) && pDesc.ValueKind == System.Text.Json.JsonValueKind.String)
            existing.Description = pDesc.GetString() ?? existing.Description;

        if (TryGet("eventDate", out var pDate))
        {
            if (pDate.ValueKind == System.Text.Json.JsonValueKind.String && DateTime.TryParse(pDate.GetString(), out var dt))
                existing.EventDate = dt;
            else if (pDate.ValueKind == System.Text.Json.JsonValueKind.Null)
                existing.EventDate = null;
        }

        if (TryGet("eventEndDate", out var pEndDate))
        {
            if (pEndDate.ValueKind == System.Text.Json.JsonValueKind.String && DateTime.TryParse(pEndDate.GetString(), out var dt))
                existing.EventEndDate = dt;
            else if (pEndDate.ValueKind == System.Text.Json.JsonValueKind.Null)
                existing.EventEndDate = null;
        }

        if (TryGet("isTentative", out var pTentative))
            existing.IsTentative = pTentative.ValueKind == System.Text.Json.JsonValueKind.True;

        if (TryGet("lastDateToApply", out var pLastDate))
        {
            if (pLastDate.ValueKind == System.Text.Json.JsonValueKind.String && DateTime.TryParse(pLastDate.GetString(), out var dt))
                existing.LastDateToApply = dt;
            else if (pLastDate.ValueKind == System.Text.Json.JsonValueKind.Null)
                existing.LastDateToApply = null;
        }

        if (TryGet("allowGroupRegistration", out var pAllowGroup))
            existing.AllowGroupRegistration = pAllowGroup.ValueKind == System.Text.Json.JsonValueKind.True;

        if (TryGet("ageFieldMode", out var pAgeMode) && pAgeMode.ValueKind == System.Text.Json.JsonValueKind.String)
            existing.AgeFieldMode = pAgeMode.GetString() ?? existing.AgeFieldMode;

        if (TryGet("maxCapacity", out var pMaxCap) && pMaxCap.ValueKind == System.Text.Json.JsonValueKind.Number)
            existing.MaxCapacity = pMaxCap.GetInt32();

        if (TryGet("applicationCount", out var pAppCount) && pAppCount.ValueKind == System.Text.Json.JsonValueKind.Number)
            existing.ApplicationCount = pAppCount.GetInt32();

        if (TryGet("active", out var pActive))
            existing.Active = pActive.ValueKind == System.Text.Json.JsonValueKind.True;

        if (TryGet("isPaidEvent", out var pPaid))
            existing.IsPaidEvent = pPaid.ValueKind == System.Text.Json.JsonValueKind.True;

        if (TryGet("itemLabel", out var pItemLabel) && pItemLabel.ValueKind == System.Text.Json.JsonValueKind.String)
            existing.ItemLabel = pItemLabel.GetString() ?? existing.ItemLabel;

        if (TryGet("itemCost", out var pItemCost) && pItemCost.ValueKind == System.Text.Json.JsonValueKind.Number)
            existing.ItemCost = pItemCost.GetDecimal();

        if (TryGet("maxItems", out var pMaxItems) && pMaxItems.ValueKind == System.Text.Json.JsonValueKind.Number)
            existing.MaxItems = pMaxItems.GetInt32();

        if (TryGet("paymentPrefix", out var pPayPrefix) && pPayPrefix.ValueKind == System.Text.Json.JsonValueKind.String)
            existing.PaymentPrefix = pPayPrefix.GetString() ?? existing.PaymentPrefix;

        if (TryGet("subEvents", out var pSub) && pSub.ValueKind != System.Text.Json.JsonValueKind.Null && pSub.ValueKind != System.Text.Json.JsonValueKind.Undefined)
            existing.SubEventsJson = pSub.GetRawText();
        else if (TryGet("subEventsJson", out var pSubJson) && pSubJson.ValueKind == System.Text.Json.JsonValueKind.String)
            existing.SubEventsJson = pSubJson.GetString() ?? "[]";

        if (TryGet("customFields", out var pCust) && pCust.ValueKind != System.Text.Json.JsonValueKind.Null && pCust.ValueKind != System.Text.Json.JsonValueKind.Undefined)
            existing.CustomFieldsJson = pCust.GetRawText();
        else if (TryGet("customFieldsJson", out var pCustJson) && pCustJson.ValueKind == System.Text.Json.JsonValueKind.String)
            existing.CustomFieldsJson = pCustJson.GetString() ?? "[]";

        if (TryGet("ageGroups", out var pAgeG) && pAgeG.ValueKind != System.Text.Json.JsonValueKind.Null && pAgeG.ValueKind != System.Text.Json.JsonValueKind.Undefined)
            existing.AgeGroupsJson = pAgeG.GetRawText();
        else if (TryGet("ageGroupsJson", out var pAgeGJson) && pAgeGJson.ValueKind == System.Text.Json.JsonValueKind.String)
            existing.AgeGroupsJson = pAgeGJson.GetString() ?? "[]";

        if (TryGet("subEventCapacities", out var pSubCap) && pSubCap.ValueKind != System.Text.Json.JsonValueKind.Null && pSubCap.ValueKind != System.Text.Json.JsonValueKind.Undefined)
            existing.SubEventCapacitiesJson = pSubCap.GetRawText();
        else if (TryGet("subEventCapacitiesJson", out var pSubCapJson) && pSubCapJson.ValueKind == System.Text.Json.JsonValueKind.String)
            existing.SubEventCapacitiesJson = pSubCapJson.GetString() ?? "{}";

        if (TryGet("subEventCounts", out var pSubCounts) && pSubCounts.ValueKind != System.Text.Json.JsonValueKind.Null && pSubCounts.ValueKind != System.Text.Json.JsonValueKind.Undefined)
            existing.SubEventCountsJson = pSubCounts.GetRawText();
        else if (TryGet("subEventCountsJson", out var pSubCountsJson) && pSubCountsJson.ValueKind == System.Text.Json.JsonValueKind.String)
            existing.SubEventCountsJson = pSubCountsJson.GetString() ?? "{}";

        existing.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        await _audit.LogAsync("UPDATE", "CulturalEvent", id, existing, User);

        // Update corresponding notification if present
        try
        {
            var notif = await _db.Notifications.FindAsync($"event-{id}");
            if (notif != null)
            {
                notif.Active = existing.Active;
                notif.Title = $"Cultural Event: {existing.Title}";
                notif.UpdatedAt = DateTime.UtcNow;
                await _db.SaveChangesAsync();
            }
        }
        catch { /* Best effort */ }

        return Ok(existing);
    }

    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> Delete(string id)
    {
        var existing = await _db.CulturalEvents.FindAsync(id);
        if (existing == null) return NotFound();
        _db.CulturalEvents.Remove(existing);

        // cascade delete applications
        var apps = await _db.CulturalApplications.Where(a => a.EventId == id).ToListAsync();
        _db.CulturalApplications.RemoveRange(apps);

        // delete corresponding notification
        try
        {
            var notif = await _db.Notifications.FindAsync($"event-{id}");
            if (notif != null)
            {
                _db.Notifications.Remove(notif);
            }
        }
        catch { /* Best effort */ }

        await _db.SaveChangesAsync();
        await _audit.LogAsync("DELETE", "CulturalEvent", id, existing, User);
        return Ok();
    }
}
