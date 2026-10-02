using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SocietyPujaManagerNet.Services;

namespace SocietyPujaManagerNet.Controllers;

[ApiController]
[Route("api/payment-proofs")]
[Authorize]
public class PaymentProofsController : ControllerBase
{
    private readonly IPaymentProofService _proofService;

    public PaymentProofsController(IPaymentProofService proofService)
    {
        _proofService = proofService;
    }

    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetById(string id)
    {
        var images = await _proofService.GetProofAsync(id);
        if (images == null || images.Count == 0) return NotFound();
        return Ok(images);
    }

    [HttpPost("{id}")]
    public async Task<IActionResult> Save(string id, [FromBody] List<string> images)
    {
        await _proofService.SaveProofAsync(id, images);
        return Ok();
    }
}
