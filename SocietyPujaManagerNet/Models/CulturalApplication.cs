using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace SocietyPujaManagerNet.Models;

public class CulturalApplication
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string EventId { get; set; } = "";
    public string EventName { get; set; } = "";
    public string FlatNumber { get; set; } = "";
    public string ParticipantName { get; set; } = "";
    public int? Age { get; set; }
    public string ContactNumber { get; set; } = "";
    public string? Comment { get; set; }
    public string? AdminComment { get; set; }
    public string? SelectedDate { get; set; }
    public bool IsGroup { get; set; }
    public string CalculatedAgeGroup { get; set; } = "";
    public string Status { get; set; } = "confirmed";
    public int ScheduleSequence { get; set; }
    public string ScheduleTime { get; set; } = "";
    public int ItemCount { get; set; }
    public decimal AmountPaid { get; set; }
    public bool PaymentConfirmed { get; set; }
    public bool AdminPaymentConfirmed { get; set; }
    public string PaymentMode { get; set; } = "";
    public string PaymentReference { get; set; } = "";
    public int CapacityConsumed { get; set; } = 1;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Database JSON backing columns
    [JsonIgnore]
    public string SelectedSubEventsJson { get; set; } = "[]";
    [JsonIgnore]
    public string CustomFieldResponsesJson { get; set; } = "{}";
    [JsonIgnore]
    public string ParticipantsJson { get; set; } = "[]";

    [NotMapped]
    public object? SelectedSubEvents
    {
        get => DeserializeJson(SelectedSubEventsJson, "[]");
        set => SelectedSubEventsJson = SerializeJson(value, "[]");
    }

    [NotMapped]
    public object? CustomFieldResponses
    {
        get => DeserializeJson(CustomFieldResponsesJson, "{}");
        set => CustomFieldResponsesJson = SerializeJson(value, "{}");
    }

    [NotMapped]
    public object? Participants
    {
        get => DeserializeJson(ParticipantsJson, "[]");
        set => ParticipantsJson = SerializeJson(value, "[]");
    }

    private static object? DeserializeJson(string? json, string fallback)
    {
        if (string.IsNullOrWhiteSpace(json)) json = fallback;
        try
        {
            return JsonSerializer.Deserialize<JsonElement>(json);
        }
        catch
        {
            return JsonSerializer.Deserialize<JsonElement>(fallback);
        }
    }

    private static string SerializeJson(object? value, string fallback)
    {
        if (value == null) return fallback;
        if (value is JsonElement je) return je.GetRawText();
        if (value is string s && (s.StartsWith("[") || s.StartsWith("{"))) return s;
        try
        {
            return JsonSerializer.Serialize(value);
        }
        catch
        {
            return fallback;
        }
    }
}
