namespace SocietyPujaManagerNet.Models;

public class AuditLog
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Action { get; set; } = "";
    public string EntityType { get; set; } = "";
    public string EntityId { get; set; } = "";
    public string PerformedByEmail { get; set; } = "";
    public string PerformedByName { get; set; } = "";
    public string PerformedByRole { get; set; } = "";
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public string? Details { get; set; }
}
