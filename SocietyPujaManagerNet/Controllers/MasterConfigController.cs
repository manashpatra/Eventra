using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SocietyPujaManagerNet.Data;
using SocietyPujaManagerNet.Models;
using SocietyPujaManagerNet.Services;
using System.Text.Json;
using Microsoft.AspNetCore.Identity;

namespace SocietyPujaManagerNet.Controllers;

[ApiController]
[Route("api/master-config")]
[Route("api/config")]
public class MasterConfigController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IAuditService _audit;
    private readonly UserManager<AppUser> _userManager;

    public MasterConfigController(AppDbContext db, IAuditService audit, UserManager<AppUser> userManager)
    {
        _db = db;
        _audit = audit;
        _userManager = userManager;
    }

    [HttpGet]
    public async Task<IActionResult> GetConfig()
    {
        var config = await _db.MasterConfigs.FindAsync("main-config");
        if (config == null) return NotFound();
        return Ok(JsonSerializer.Deserialize<object>(config.ConfigJson));
    }

    [HttpPost]
    [HttpPut]
    [Authorize]
    public async Task<IActionResult> UpdateConfig([FromBody] object data)
    {
        var json = JsonSerializer.Serialize(data);
        var doc = JsonDocument.Parse(json);
        
        var existing = await _db.MasterConfigs.FindAsync("main-config");
        if (existing == null)
        {
            existing = new MasterConfig { Id = "main-config" };
            _db.MasterConfigs.Add(existing);
        }

        existing.ConfigJson = json;
        existing.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        await _audit.LogAsync("UPDATE", "MasterConfig", "main-config", data, User);
        
        // Sync Admin Roles
        try 
        {
            if (doc.RootElement.TryGetProperty("userRoles", out var rolesElement) && rolesElement.ValueKind == JsonValueKind.Array)
            {
                var roleDefs = JsonSerializer.Deserialize<List<Dictionary<string, string>>>(rolesElement.GetRawText());
                if (roleDefs != null)
                {
                    foreach (var roleDef in roleDefs)
                    {
                        if (roleDef.TryGetValue("email", out var email) && roleDef.TryGetValue("role", out var role))
                        {
                            var user = await _userManager.FindByEmailAsync(email);
                            if (user == null)
                            {
                                user = new AppUser { UserName = email, Email = email, FullName = roleDef.GetValueOrDefault("name"), Role = role, EmailConfirmed = true, IsActive = true };
                                await _userManager.CreateAsync(user, "Default@123");
                            }
                            else
                            {
                                user.Role = role;
                                user.FullName = roleDef.GetValueOrDefault("name");
                                user.IsActive = true;
                                await _userManager.UpdateAsync(user);
                            }
                        }
                    }
                }
            }
        } 
        catch (Exception ex) 
        {
            Console.WriteLine("Error syncing roles: " + ex.Message);
        }

        return Ok(data);
    }

    [HttpGet("print-assets")]
    public async Task<IActionResult> GetPrintAssets()
    {
        var config = await _db.MasterConfigs.FindAsync("print-assets");
        if (config == null) return Ok(new { });
        return Ok(JsonSerializer.Deserialize<object>(config.ConfigJson));
    }

    [HttpPost("print-assets")]
    [HttpPut("print-assets")]
    [Authorize]
    public async Task<IActionResult> UpdatePrintAssets([FromBody] object data)
    {
        var json = JsonSerializer.Serialize(data);
        var existing = await _db.MasterConfigs.FindAsync("print-assets");
        if (existing == null)
        {
            existing = new MasterConfig { Id = "print-assets" };
            _db.MasterConfigs.Add(existing);
        }

        existing.ConfigJson = json;
        existing.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        await _audit.LogAsync("UPDATE", "PrintAssets", "print-assets", data, User);

        return Ok(data);
    }
}
