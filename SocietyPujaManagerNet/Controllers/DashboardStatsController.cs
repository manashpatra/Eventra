using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SocietyPujaManagerNet.Services;
using System.Text.Json;

namespace SocietyPujaManagerNet.Controllers;

[ApiController]
[Route("api/dashboard-stats")]
[Route("api/dashboard/stats")]
public class DashboardStatsController : ControllerBase
{
    private readonly IDashboardStatsService _stats;

    public DashboardStatsController(IDashboardStatsService stats)
    {
        _stats = stats;
    }

    [HttpGet]
    public async Task<IActionResult> GetStats()
    {
        var stats = await _stats.GetStatsAsync();
        if (stats == null) return NotFound();
        return Ok(JsonSerializer.Deserialize<object>(stats.StatsJson));
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> RefreshStats()
    {
        await _stats.RefreshStatsAsync();
        return Ok();
    }
}
