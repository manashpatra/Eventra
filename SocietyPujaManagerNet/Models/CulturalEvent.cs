using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace SocietyPujaManagerNet.Models;

public class CulturalEvent
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string ReadableId { get; set; } = "";
    public string Title { get; set; } = "";
    public string Description { get; set; } = "";
    public DateTime? EventDate { get; set; }
    public DateTime? EventEndDate { get; set; }
    public bool IsTentative { get; set; }
    public DateTime? LastDateToApply { get; set; }
    public bool AllowGroupRegistration { get; set; }
    public string AgeFieldMode { get; set; } = "required";
    public int MaxCapacity { get; set; }
    public int ApplicationCount { get; set; }
    public bool Active { get; set; } = true;
    public bool IsPaidEvent { get; set; }
    public string ItemLabel { get; set; } = "";
    public decimal ItemCost { get; set; }
    public int MaxItems { get; set; }
    public string PaymentPrefix { get; set; } = "";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Database JSON backing columns
    [JsonIgnore]
    public string SubEventsJson { get; set; } = "[]";
    [JsonIgnore]
    public string CustomFieldsJson { get; set; } = "[]";
    [JsonIgnore]
    public string AgeGroupsJson { get; set; } = "[]";
    [JsonIgnore]
    public string SubEventCapacitiesJson { get; set; } = "{}";
    [JsonIgnore]
    public string SubEventCountsJson { get; set; } = "{}";

    [NotMapped]
    public object? SubEvents
    {
        get => DeserializeJson(SubEventsJson, "[]");
        set => SubEventsJson = SerializeJson(value, "[]");
    }

    [NotMapped]
    public object? CustomFields
    {
        get => DeserializeJson(CustomFieldsJson, "[]");
        set => CustomFieldsJson = SerializeJson(value, "[]");
    }

    [NotMapped]
    public object? AgeGroups
    {
        get => DeserializeJson(AgeGroupsJson, "[]");
        set => AgeGroupsJson = SerializeJson(value, "[]");
    }

    [NotMapped]
    public object? SubEventCapacities
    {
        get => DeserializeJson(SubEventCapacitiesJson, "{}");
        set => SubEventCapacitiesJson = SerializeJson(value, "{}");
    }

    [NotMapped]
    public object? SubEventCounts
    {
        get => DeserializeJson(SubEventCountsJson, "{}");
        set => SubEventCountsJson = SerializeJson(value, "{}");
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
