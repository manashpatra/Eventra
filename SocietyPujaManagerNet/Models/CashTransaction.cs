namespace SocietyPujaManagerNet.Models;

public class CashTransaction
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string MemberId { get; set; } = "";
    public string MemberName { get; set; } = "";
    public string Type { get; set; } = "ADD"; // ADD, SUBTRACT, TRANSFER_OUT, TRANSFER_IN
    public string? ToMemberId { get; set; }
    public string? ToMemberName { get; set; }
    public string? FromMemberId { get; set; }
    public string? FromMemberName { get; set; }
    public decimal Amount { get; set; }
    public decimal BalanceAfter { get; set; }
    public string? Date { get; set; }
    public string? Reason { get; set; }
    public string? Notes { get; set; }
    public string? RecordedBy { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public string? UpdatedBy { get; set; }
}
