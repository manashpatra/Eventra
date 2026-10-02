namespace SocietyPujaManagerNet.Models;

public class Feedback
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Name { get; set; } = "";
    public string PhoneNumber { get; set; } = "";
    public string FlatNumber { get; set; } = "";
    public string Category { get; set; } = "General";
    public string Message { get; set; } = "";
    public string? ReplyMessage { get; set; }
    public string? RepliedBy { get; set; }
    public DateTime? RepliedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
