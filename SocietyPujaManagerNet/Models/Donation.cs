namespace SocietyPujaManagerNet.Models;

public class Donation
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string? ResidentId { get; set; }
    public string ResidentName { get; set; } = "";
    public string FlatNumber { get; set; } = "";
    public string DonorName { get; set; } = "";
    public decimal Amount { get; set; }
    public string PaymentMode { get; set; } = "Cash";
    public string? PaymentProofUrl { get; set; }
    public string Remarks { get; set; } = "";
    public DateTime TransactionDate { get; set; } = DateTime.UtcNow;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
