using Microsoft.EntityFrameworkCore;
using WeeklyPlanTracker.Core.Interfaces;
using WeeklyPlanTracker.Infrastructure.Data;

namespace WeeklyPlanTracker.Infrastructure.Repositories
{
    /// <summary>
    /// Generic repository implementation using EF Core.
    /// </summary>
    public class Repository<T> : IRepository<T> where T : class
    {
        protected readonly AppDbContext _context;
        protected readonly DbSet<T> _dbSet;

        public Repository(AppDbContext context)
        {
            _context = context;
            _dbSet = context.Set<T>();
        }

        public virtual async Task<T?> GetByIdAsync(Guid id)
            => await _dbSet.FindAsync(id);

        public virtual async Task<IEnumerable<T>> GetAllAsync()
            => await _dbSet.ToListAsync();

        public virtual async Task AddAsync(T entity)
            => await _dbSet.AddAsync(entity);

        public virtual void Update(T entity)
            => _dbSet.Update(entity);

        public virtual void Remove(T entity)
            => _dbSet.Remove(entity);
    }
}
