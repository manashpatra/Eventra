namespace SocietyPujaManagerNet.Models;

public class Resident
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Name { get; set; } = "";
    public string Mobile { get; set; } = "";
    public string Email { get; set; } = "";
    public int Block { get; set; }
    public int Floor { get; set; }
    public string FlatType { get; set; } = "";
    public string FlatNumber { get; set; } = "";
    public string SubscriptionStatus { get; set; } = "pending";
    public decimal SubscriptionAmount { get; set; }
    public DateTime? PaymentDate { get; set; }
    public DateTime? TransactionDate { get; set; }
    public string? PaymentMode { get; set; }
    public string? PaymentProofUrl { get; set; }
    public string Remarks { get; set; } = "";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
