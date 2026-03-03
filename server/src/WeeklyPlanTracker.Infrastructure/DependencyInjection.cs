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
            // Use Azure SQL Server for persistent data storage
            var connectionString = configuration.GetConnectionString("DefaultConnection");
            services.AddDbContext<AppDbContext>(options =>
                options.UseSqlServer(connectionString, sqlOptions =>
                    sqlOptions.EnableRetryOnFailure(
                        maxRetryCount: 5,
                        maxRetryDelay: TimeSpan.FromSeconds(30),
                        errorNumbersToAdd: null)));

            // Register Unit of Work and repositories
            services.AddScoped<IUnitOfWork, UnitOfWork>();

            return services;
        }
    }
}
