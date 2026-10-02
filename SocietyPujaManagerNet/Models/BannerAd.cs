namespace SocietyPujaManagerNet.Models;

public class BannerAd
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Slot { get; set; } = "";
    public string? ImageData { get; set; }
    public bool Active { get; set; } = true;
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public int Priority { get; set; }
    public string? LinkUrl { get; set; }
    public string? Title { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
