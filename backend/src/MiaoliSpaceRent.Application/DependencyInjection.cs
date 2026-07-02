using Microsoft.Extensions.DependencyInjection;

namespace MiaoliSpaceRent.Application;

/// <summary>
/// Application 層的服務註冊進入點。用例服務、驗證器、行為管線等在此掛載。
/// </summary>
public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        // TODO: 註冊用例服務（例如 AddScoped<IBookingService, BookingService>()）
        return services;
    }
}
