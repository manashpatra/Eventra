namespace SocietyPujaManagerNet.Models;

public class FoodCoupon
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string ResidentId { get; set; } = "";
    public string ResidentName { get; set; } = "";
    public string FlatNumber { get; set; } = "";
    public string Day { get; set; } = "";
    public string DayDate { get; set; } = "";
    public string MealType { get; set; } = "";
    public string FoodType { get; set; } = "Veg";
    public int NormalDineOutCount { get; set; }
    public int NormalParcelCount { get; set; }
    public int AdditionalDineOutCount { get; set; }
    public int AdditionalParcelCount { get; set; }
    public decimal NormalPrice { get; set; }
    public decimal AdditionalPrice { get; set; }
    public decimal ParcelPackingCharge { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal FocValue { get; set; }
    public string PaymentMode { get; set; } = "Cash";
    public decimal MixedCashAmount { get; set; }
    public decimal MixedUpiAmount { get; set; }
    public string Remarks { get; set; } = "";
    public string IssuedBy { get; set; } = "";
    public string CouponNumbers { get; set; } = "";
    public int ServedNormalDineOut { get; set; }
    public int ServedNormalParcel { get; set; }
    public int ServedAdditionalDineOut { get; set; }
    public int ServedAdditionalParcel { get; set; }
    public bool IsOnline { get; set; }
    public bool Redeemed { get; set; }
    public DateTime? RedeemedAt { get; set; }
    public string? RedeemedBy { get; set; }
    public string? LastServedBy { get; set; }
    public DateTime? LastServedAt { get; set; }
    public string? FlatDocId { get; set; }
    public string? AccessCode { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
