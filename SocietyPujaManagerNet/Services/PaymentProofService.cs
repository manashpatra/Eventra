using SocietyPujaManagerNet.Data;
using SocietyPujaManagerNet.Models;
using System.Text.Json;

namespace SocietyPujaManagerNet.Services;

public interface IPaymentProofService
{
    Task SaveProofAsync(string id, List<string> base64Images);
    Task<List<string>> GetProofAsync(string id);
    Task DeleteProofAsync(string id);
}

public class PaymentProofService : IPaymentProofService
{
    private readonly AppDbContext _db;

    public PaymentProofService(AppDbContext db)
    {
        _db = db;
    }

    public async Task SaveProofAsync(string id, List<string> base64Images)
    {
        var existing = await _db.PaymentProofs.FindAsync(id);
        if (existing != null)
        {
            existing.ImagesJson = JsonSerializer.Serialize(base64Images);
            existing.UpdatedAt = DateTime.UtcNow;
        }
        else
        {
            _db.PaymentProofs.Add(new PaymentProof
            {
                Id = id,
                ImagesJson = JsonSerializer.Serialize(base64Images),
                UpdatedAt = DateTime.UtcNow
            });
        }
        await _db.SaveChangesAsync();
    }

    public async Task<List<string>> GetProofAsync(string id)
    {
        var proof = await _db.PaymentProofs.FindAsync(id);
        if (proof == null) return new List<string>();
        try
        {
            return JsonSerializer.Deserialize<List<string>>(proof.ImagesJson) ?? new List<string>();
        }
        catch
        {
            return new List<string>();
        }
    }

    public async Task DeleteProofAsync(string id)
    {
        var proof = await _db.PaymentProofs.FindAsync(id);
        if (proof != null)
        {
            _db.PaymentProofs.Remove(proof);
            await _db.SaveChangesAsync();
        }
    }
}
