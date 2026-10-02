namespace SocietyPujaManagerNet.Models;

public class PaymentProof
{
    public string Id { get; set; } = "";
    public string ImagesJson { get; set; } = "[]";
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
