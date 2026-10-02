namespace SocietyPujaManagerNet.Models;

public class Vendor
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string VendorFor { get; set; } = "";
    public string Name { get; set; } = "";
    public string Contact { get; set; } = "";
    public string Email { get; set; } = "";
    public string Address { get; set; } = "";
    public string Description { get; set; } = "";
    public decimal DealAmount { get; set; }
    public string? DealImageUrl { get; set; }
    public string? ExpenseCategory { get; set; }
    public string? ExpenseSubCategory { get; set; }
    public string PaymentsJson { get; set; } = "[]";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
