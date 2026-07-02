using MiaoliSpaceRent.Application;
using MiaoliSpaceRent.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

// 各分層的服務註冊
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

builder.Services.AddControllers();
builder.Services.AddOpenApi();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}
else
{
    // HTTPS 轉址只在正式環境啟用；本機開發走純 http 不需轉址
    app.UseHttpsRedirection();
}

app.MapControllers();

app.Run();
