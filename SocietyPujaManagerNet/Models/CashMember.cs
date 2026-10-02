namespace SocietyPujaManagerNet.Models;

public class CashMember
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Name { get; set; } = "";
    public string Phone { get; set; } = "";
    public string Role { get; set; } = "Member";
    public decimal InitialBalance { get; set; }
    public decimal CurrentBalance { get; set; }
    public string Notes { get; set; } = "";
    public bool IsActive { get; set; } = true;
    public string CreatedBy { get; set; } = "Admin";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastTransactionAt { get; set; }
}
