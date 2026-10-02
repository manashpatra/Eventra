using SocietyPujaManagerNet.Data;
using SocietyPujaManagerNet.Models;
using System.Security.Claims;
using System.Text.Json;

namespace SocietyPujaManagerNet.Services;

public interface IAuditService
{
    Task LogAsync(string action, string entityType, string entityId, object? details = null, ClaimsPrincipal? user = null);
}

public class AuditService : IAuditService
{
    private readonly AppDbContext _db;

    public AuditService(AppDbContext db)
    {
        _db = db;
    }

    public async Task LogAsync(string action, string entityType, string entityId, object? details = null, ClaimsPrincipal? user = null)
    {
        try
        {
            var email = user?.FindFirstValue(ClaimTypes.Email) ?? "system";
            var name = user?.FindFirstValue("fullName") ?? user?.FindFirstValue(ClaimTypes.Name) ?? "system";
            var role = user?.FindFirstValue("role") ?? "System";

            var auditLog = new AuditLog
            {
                Id = Guid.NewGuid().ToString(),
                Action = action,
                EntityType = entityType,
                EntityId = entityId,
                PerformedByEmail = email,
                PerformedByName = name,
                PerformedByRole = role,
                Timestamp = DateTime.UtcNow,
                Details = details != null ? JsonSerializer.Serialize(details) : null
            };

            _db.AuditLogs.Add(auditLog);
            await _db.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"Failed to write audit log: {ex.Message}");
        }
    }
}
