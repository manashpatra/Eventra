namespace SocietyPujaManagerNet.Models;

public class Sponsorship
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string SponsorName { get; set; } = "";
    public string SponsorType { get; set; } = "External";
    public string ContactNumber { get; set; } = "";
    public string Email { get; set; } = "";
    public string? TrackingLead { get; set; }
    public string StatusNote { get; set; } = "";
    public string Organization { get; set; } = "";
    public decimal Amount { get; set; }
    public string PaymentMode { get; set; } = "";
    public string? PaymentProofUrl { get; set; }
    public string Remarks { get; set; } = "";
    public DateTime? TransactionDate { get; set; }
    public string InvoiceRef { get; set; } = "";
    public string InvoiceDate { get; set; } = "";
    public string InvoiceDescription { get; set; } = "";
    public int InvoiceQuantity { get; set; } = 1;
    public string Status { get; set; } = "Pending";
    public DateTime? RefundDate { get; set; }
    public string? RefundMode { get; set; }
    public string? RefundRemarks { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
