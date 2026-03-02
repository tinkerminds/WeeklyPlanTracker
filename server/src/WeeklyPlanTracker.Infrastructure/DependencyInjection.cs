using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using WeeklyPlanTracker.Core.Interfaces;
using WeeklyPlanTracker.Infrastructure.Data;
using WeeklyPlanTracker.Infrastructure.Repositories;

namespace WeeklyPlanTracker.Infrastructure
{
    /// <summary>
    /// Extension methods to register Infrastructure services in the DI container.
    /// </summary>
    public static class DependencyInjection
    {
        public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
        {
            // Register EF Core DbContext with SQL Server
            services.AddDbContext<AppDbContext>(options =>
                options.UseSqlServer(
                    configuration.GetConnectionString("DefaultConnection"),
                    b => b.MigrationsAssembly(typeof(AppDbContext).Assembly.FullName)));

            // Register Unit of Work and repositories
            services.AddScoped<IUnitOfWork, UnitOfWork>();

            return services;
        }
    }
}
