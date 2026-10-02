namespace SocietyPujaManagerNet.Models;

public class DraftCartItem
{
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
}
