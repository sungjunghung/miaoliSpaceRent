using Microsoft.AspNetCore.Mvc;

namespace MiaoliSpaceRent.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TestController : ControllerBase
{
    // GET /api/test
    [HttpGet]
    public IActionResult Get() =>
        Ok(new { message = "測試 API 正常運作", timestamp = DateTimeOffset.UtcNow });
}
