using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;

namespace SocietyPujaManagerNet.Models;

public class DraftCart
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string ResidentId { get; set; } = "";
    public string ResidentName { get; set; } = "";
    public string FlatNumber { get; set; } = "";
    public string PaymentMode { get; set; } = "Cash";
    public decimal TotalAmount { get; set; }
    public string Status { get; set; } = "pending";
    public string ItemsJson { get; set; } = "[]";

    [NotMapped]
    public JsonElement? Items
    {
        get
        {
            if (string.IsNullOrWhiteSpace(ItemsJson) || ItemsJson == "[]") return null;
            try
            {
                using var doc = JsonDocument.Parse(ItemsJson);
                return doc.RootElement.Clone();
            }
            catch
            {
                return null;
            }
        }
        set
        {
            if (value.HasValue)
            {
                ItemsJson = value.Value.GetRawText();
            }
        }
    }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
