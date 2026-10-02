using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SocietyPujaManagerNet.Data;
using SocietyPujaManagerNet.Models;
using SocietyPujaManagerNet.Services;

namespace SocietyPujaManagerNet.Controllers;

[ApiController]
[Route("api/cultural-applications")]
public class CulturalApplicationsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IAuditService _audit;

    public CulturalApplicationsController(AppDbContext db, IAuditService audit)
    {
        _db = db;
        _audit = audit;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await _db.CulturalApplications.OrderByDescending(a => a.CreatedAt).ToListAsync());

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var item = await _db.CulturalApplications.FindAsync(id);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpGet("by-event/{eventId}")]
    public async Task<IActionResult> GetByEvent(string eventId) =>
        Ok(await _db.CulturalApplications.Where(a => a.EventId == eventId).ToListAsync());

    [HttpGet("by-flat/{flatNumber}")]
    public async Task<IActionResult> GetByFlat(string flatNumber) =>
        Ok(await _db.CulturalApplications.Where(a => a.FlatNumber == flatNumber).ToListAsync());

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CulturalApplication data)
    {
        data.Id = string.IsNullOrEmpty(data.Id) ? Guid.NewGuid().ToString() : data.Id;
        data.CreatedAt = DateTime.UtcNow;
        data.UpdatedAt = DateTime.UtcNow;

        if (data.CapacityConsumed <= 0)
        {
            data.CapacityConsumed = 1;
        }

        _db.CulturalApplications.Add(data);

        // Update event capacity count
        if (!string.IsNullOrEmpty(data.EventId))
        {
            var ev = await _db.CulturalEvents.FindAsync(data.EventId);
            if (ev != null)
            {
                ev.ApplicationCount += data.CapacityConsumed;
                ev.UpdatedAt = DateTime.UtcNow;
            }
        }

        await _db.SaveChangesAsync();
        await _audit.LogAsync("CREATE", "CulturalApplication", data.Id, data, User);
        return Ok(data);
    }

    [NonAction]
    public Task<IActionResult> Update(string id, CulturalApplication data) =>
        Update(id, System.Text.Json.JsonSerializer.SerializeToElement(data));

    [HttpPut("{id}")]
    [Authorize]
    public async Task<IActionResult> Update(string id, [FromBody] System.Text.Json.JsonElement raw)
    {
        var existing = await _db.CulturalApplications.FindAsync(id);
        if (existing == null) return NotFound();

        var oldConsumed = existing.CapacityConsumed;

        bool TryGet(string name, out System.Text.Json.JsonElement el)
        {
            if (raw.TryGetProperty(name, out el)) return true;
            var pascal = char.ToUpperInvariant(name[0]) + name.Substring(1);
            return raw.TryGetProperty(pascal, out el);
        }

        if (TryGet("participantName", out var pName) && pName.ValueKind == System.Text.Json.JsonValueKind.String)
            existing.ParticipantName = pName.GetString() ?? existing.ParticipantName;

        if (TryGet("age", out var pAge))
        {
            if (pAge.ValueKind == System.Text.Json.JsonValueKind.Number) existing.Age = pAge.GetInt32();
            else if (pAge.ValueKind == System.Text.Json.JsonValueKind.Null) existing.Age = null;
        }

        if (TryGet("contactNumber", out var pContact) && pContact.ValueKind == System.Text.Json.JsonValueKind.String)
            existing.ContactNumber = pContact.GetString() ?? existing.ContactNumber;

        if (TryGet("comment", out var pComment) && pComment.ValueKind == System.Text.Json.JsonValueKind.String)
            existing.Comment = pComment.GetString() ?? existing.Comment;

        if (TryGet("adminComment", out var pAdminComment))
            existing.AdminComment = pAdminComment.ValueKind == System.Text.Json.JsonValueKind.String ? pAdminComment.GetString() : null;

        if (TryGet("selectedDate", out var pDate))
        {
            if (pDate.ValueKind == System.Text.Json.JsonValueKind.String)
                existing.SelectedDate = pDate.GetString();
            else if (pDate.ValueKind == System.Text.Json.JsonValueKind.Null)
                existing.SelectedDate = null;
        }

        if (TryGet("isGroup", out var pGroup))
            existing.IsGroup = pGroup.ValueKind == System.Text.Json.JsonValueKind.True;

        if (TryGet("calculatedAgeGroup", out var pAgeGroup) && pAgeGroup.ValueKind == System.Text.Json.JsonValueKind.String)
            existing.CalculatedAgeGroup = pAgeGroup.GetString() ?? existing.CalculatedAgeGroup;

        if (TryGet("status", out var pStatus) && pStatus.ValueKind == System.Text.Json.JsonValueKind.String)
            existing.Status = pStatus.GetString() ?? existing.Status;

        if (TryGet("scheduleSequence", out var pSeq) && pSeq.ValueKind == System.Text.Json.JsonValueKind.Number)
            existing.ScheduleSequence = pSeq.GetInt32();

        if (TryGet("scheduleTime", out var pTime) && pTime.ValueKind == System.Text.Json.JsonValueKind.String)
            existing.ScheduleTime = pTime.GetString() ?? existing.ScheduleTime;

        if (TryGet("itemCount", out var pItemCount) && pItemCount.ValueKind == System.Text.Json.JsonValueKind.Number)
            existing.ItemCount = pItemCount.GetInt32();

        if (TryGet("amountPaid", out var pAmount) && pAmount.ValueKind == System.Text.Json.JsonValueKind.Number)
            existing.AmountPaid = pAmount.GetDecimal();

        if (TryGet("paymentConfirmed", out var pPayConf))
            existing.PaymentConfirmed = pPayConf.ValueKind == System.Text.Json.JsonValueKind.True;

        if (TryGet("adminPaymentConfirmed", out var pAdminPayConf))
            existing.AdminPaymentConfirmed = pAdminPayConf.ValueKind == System.Text.Json.JsonValueKind.True;

        if (TryGet("paymentMode", out var pMode) && pMode.ValueKind == System.Text.Json.JsonValueKind.String)
            existing.PaymentMode = pMode.GetString() ?? existing.PaymentMode;

        if (TryGet("paymentReference", out var pRef) && pRef.ValueKind == System.Text.Json.JsonValueKind.String)
            existing.PaymentReference = pRef.GetString() ?? existing.PaymentReference;

        if (TryGet("capacityConsumed", out var pCap) && pCap.ValueKind == System.Text.Json.JsonValueKind.Number)
        {
            var cap = pCap.GetInt32();
            if (cap > 0) existing.CapacityConsumed = cap;
        }

        if (TryGet("selectedSubEvents", out var pSub) && pSub.ValueKind != System.Text.Json.JsonValueKind.Null && pSub.ValueKind != System.Text.Json.JsonValueKind.Undefined)
            existing.SelectedSubEventsJson = pSub.GetRawText();
        else if (TryGet("selectedSubEventsJson", out var pSubJson) && pSubJson.ValueKind == System.Text.Json.JsonValueKind.String)
            existing.SelectedSubEventsJson = pSubJson.GetString() ?? "[]";

        if (TryGet("customFieldResponses", out var pCust) && pCust.ValueKind != System.Text.Json.JsonValueKind.Null && pCust.ValueKind != System.Text.Json.JsonValueKind.Undefined)
            existing.CustomFieldResponsesJson = pCust.GetRawText();
        else if (TryGet("customFieldResponsesJson", out var pCustJson) && pCustJson.ValueKind == System.Text.Json.JsonValueKind.String)
            existing.CustomFieldResponsesJson = pCustJson.GetString() ?? "{}";

        if (TryGet("participants", out var pParts) && pParts.ValueKind != System.Text.Json.JsonValueKind.Null && pParts.ValueKind != System.Text.Json.JsonValueKind.Undefined)
            existing.ParticipantsJson = pParts.GetRawText();
        else if (TryGet("participantsJson", out var pPartsJson) && pPartsJson.ValueKind == System.Text.Json.JsonValueKind.String)
            existing.ParticipantsJson = pPartsJson.GetString() ?? "[]";

        existing.UpdatedAt = DateTime.UtcNow;

        // Adjust capacity consumed if changed
        if (existing.CapacityConsumed != oldConsumed && !string.IsNullOrEmpty(existing.EventId))
        {
            var ev = await _db.CulturalEvents.FindAsync(existing.EventId);
            if (ev != null)
            {
                ev.ApplicationCount += (existing.CapacityConsumed - oldConsumed);
                ev.UpdatedAt = DateTime.UtcNow;
            }
        }

        await _db.SaveChangesAsync();
        await _audit.LogAsync("UPDATE", "CulturalApplication", id, existing, User);
        return Ok(existing);
    }

    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> Delete(string id)
    {
        var existing = await _db.CulturalApplications.FindAsync(id);
        if (existing == null) return NotFound();

        // Decrement event capacity count
        if (!string.IsNullOrEmpty(existing.EventId))
        {
            var ev = await _db.CulturalEvents.FindAsync(existing.EventId);
            if (ev != null)
            {
                var consumed = existing.CapacityConsumed > 0 ? existing.CapacityConsumed : 1;
                ev.ApplicationCount = Math.Max(0, ev.ApplicationCount - consumed);
                ev.UpdatedAt = DateTime.UtcNow;
            }
        }

        _db.CulturalApplications.Remove(existing);
        await _db.SaveChangesAsync();
        await _audit.LogAsync("DELETE", "CulturalApplication", id, existing, User);
        return Ok();
    }
}
