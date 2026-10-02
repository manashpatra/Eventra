namespace SocietyPujaManagerNet.Models;

public class FoodCouponDoc
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string FlatNumber { get; set; } = "";
    public string ResidentId { get; set; } = "";
    public string ResidentName { get; set; } = "";
    public string AccessCode { get; set; } = "";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
