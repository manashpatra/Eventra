namespace SocietyPujaManagerNet.Models;

public class Expense
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string PayeeName { get; set; } = "";
    public string Category { get; set; } = "General";
    public string SubCategory { get; set; } = "";
    public decimal Amount { get; set; }
    public string PaymentMode { get; set; } = "Cash";
    public string? PaymentProofUrl { get; set; }
    public string Remarks { get; set; } = "";
    public DateTime ExpenseDate { get; set; } = DateTime.UtcNow;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
