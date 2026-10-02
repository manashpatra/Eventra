using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SocietyPujaManagerNet.Data;

namespace SocietyPujaManagerNet.Controllers;

[ApiController]
[Route("api/audit-logs")]
[Authorize(Roles = "Super Admin")]
public class AuditLogsController : ControllerBase
{
    private readonly AppDbContext _db;

    public AuditLogsController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetLogs([FromQuery] string? action, [FromQuery] string? entityType, [FromQuery] string? userEmail, [FromQuery] int limit = 100)
    {
        var query = _db.AuditLogs.AsQueryable();
        
        if (!string.IsNullOrEmpty(action)) query = query.Where(a => a.Action == action);
        if (!string.IsNullOrEmpty(entityType)) query = query.Where(a => a.EntityType == entityType);
        if (!string.IsNullOrEmpty(userEmail)) query = query.Where(a => a.PerformedByEmail == userEmail);
        
        var logs = await query.OrderByDescending(a => a.Timestamp).Take(limit).ToListAsync();
        return Ok(logs);
    }
}
