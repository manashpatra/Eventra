namespace SocietyPujaManagerNet.Models;

public class CollectionTracker
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Name { get; set; } = "";
    public string Contact { get; set; } = "";
    public string TrackedBy { get; set; } = "";
    public decimal Amount { get; set; }
    public string Notes { get; set; } = "";
    public string Status { get; set; } = "Pending";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
