namespace SocietyPujaManagerNet.Models;

public class ChequeTransaction
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string ChequeNumber { get; set; } = "";
    public DateTime TransactionDate { get; set; } = DateTime.UtcNow;
    public decimal Amount { get; set; }
    public string TransactionType { get; set; } = "To Cash";
    public string VendorName { get; set; } = "";
    public string Remarks { get; set; } = "";
    public string? ExpenseId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
