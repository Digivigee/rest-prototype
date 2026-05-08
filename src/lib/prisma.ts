import { PrismaClient } from '@prisma/client'
import { tenantContext, getActiveRestaurantId, getActiveBranchId, getAuthUserType } from './saas'

const basePrisma = new PrismaClient()


export const prisma = basePrisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        // Skip for global models
        if (model === 'Restaurant' || model === 'Role' || model === 'Branch') {
          return query(args)
        }

        // Skip User isolation for unique lookups (login/auth)
        if (model === 'User' && (operation === 'findUnique' || operation === 'findFirst')) {
          return query(args)
        }

        try {
          const context = tenantContext.getStore()
          
          let restaurantId = context?.restaurantId
          if (!restaurantId) {
            restaurantId = await getActiveRestaurantId() || undefined
          }

          let branchId = context?.branchId
          if (!branchId) {
            branchId = await getActiveBranchId() || undefined
          }

          const userType = context?.userType || await getAuthUserType()

          // Super Admin bypasses all isolation
          if (userType === 'SUPER_ADMIN') {
            return query(args)
          }

          const isolation = { 
            ...(restaurantId ? { restaurantId } : {}),
            ...(branchId ? { branchId } : {})
          }

          const injectIsolation = (data: any): any => {
            if (!data) return data;
            if (Array.isArray(data)) {
              return data.map(item => injectIsolation(item));
            }

            const result = { ...data };
            
            // 1. Inject restaurantId if missing
            if (isolation.restaurantId && !result.restaurantId) {
              result.restaurantId = isolation.restaurantId;
            }

            // 2. Inject branchId only if:
            // - It's missing in the data
            // - It's present in isolation
            // - The model is NOT 'User'
            // - AND the restaurantId matches (prevents cross-tenant branch leakage)
            if (
              model !== 'User' && 
              isolation.branchId && 
              !result.branchId && 
              (!result.restaurantId || result.restaurantId === isolation.restaurantId)
            ) {
              result.branchId = isolation.branchId;
            }

            // Recursively handle nested creates
            for (const key in result) {
              if (result[key] && typeof result[key] === 'object' && result[key].create) {
                result[key].create = injectIsolation(result[key].create);
              }
              if (result[key] && typeof result[key] === 'object' && result[key].update) {
                result[key].update = injectIsolation(result[key].update);
              }
              if (result[key] && typeof result[key] === 'object' && result[key].upsert) {
                if (result[key].upsert.create) result[key].upsert.create = injectIsolation(result[key].upsert.create);
                if (result[key].upsert.update) result[key].upsert.update = injectIsolation(result[key].upsert.update);
              }
            }
            return result;
          };

          if (Object.keys(isolation).length > 0) {
            const anyArgs = args as any;
            // 1. Inject into WHERE
            if (['findFirst', 'findMany', 'findUnique', 'update', 'updateMany', 'delete', 'deleteMany', 'count', 'aggregate', 'groupBy'].includes(operation)) {
              const whereIsolation = { ...isolation }
              if (model === 'User') {
                delete whereIsolation.branchId
              }
              anyArgs.where = { ...anyArgs.where, ...whereIsolation }
            }

            // 2. Inject into DATA (including nested)
            if (['create', 'createMany', 'update', 'updateMany', 'upsert'].includes(operation)) {
              if (operation === 'create' || operation === 'createMany') {
                anyArgs.data = injectIsolation(anyArgs.data);
              } else if (operation === 'update' || operation === 'updateMany') {
                anyArgs.data = injectIsolation(anyArgs.data);
              } else if (operation === 'upsert') {
                if (anyArgs.create) anyArgs.create = injectIsolation(anyArgs.create);
                if (anyArgs.update) anyArgs.update = injectIsolation(anyArgs.update);
              }
            }
          }

          return query(args)
        } catch (error) {
          console.error('Multi-tenant error:', error)
          return query(args)
        }
      }
    }
  }
})
