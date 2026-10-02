namespace SocietyPujaManagerNet.Models;

public class MasterConfig
{
    public string Id { get; set; } = "main-config";
    public string ConfigJson { get; set; } = "{}";
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
