namespace SocietyPujaManagerNet.Models;

public class VendorPayment
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Date { get; set; } = "";
    public decimal Amount { get; set; }
    public string Mode { get; set; } = "Cash";
    public string Remarks { get; set; } = "";
    public string? ExpenseId { get; set; }
}
