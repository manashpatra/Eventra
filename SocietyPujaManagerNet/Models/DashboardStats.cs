namespace SocietyPujaManagerNet.Models;

public class DashboardStats
{
    public string Id { get; set; } = "summary";
    public string StatsJson { get; set; } = "{}";
    public DateTime LastUpdatedAt { get; set; } = DateTime.UtcNow;
}
