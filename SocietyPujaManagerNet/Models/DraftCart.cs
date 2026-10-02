namespace SocietyPujaManagerNet.Models;

public class DraftCart
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string ResidentId { get; set; } = "";
    public string ResidentName { get; set; } = "";
    public string FlatNumber { get; set; } = "";
    public string PaymentMode { get; set; } = "Cash";
    public decimal TotalAmount { get; set; }
    public string Status { get; set; } = "pending";
    public string ItemsJson { get; set; } = "[]";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
