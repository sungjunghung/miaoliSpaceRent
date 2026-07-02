using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace MiaoliSpaceRent.Infrastructure;

/// <summary>
/// Infrastructure 層的服務註冊進入點。DbContext、儲存庫、金流／檔案等外部整合在此掛載。
/// </summary>
public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // TODO: 註冊 DbContext 與外部服務
        //       services.AddDbContext<AppDbContext>(o =>
        //           o.UseNpgsql(configuration.GetConnectionString("Default")));
        return services;
    }
}
