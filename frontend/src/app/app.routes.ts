import { Routes } from '@angular/router';
import { authGuard, guestGuard, sellerGuard, purchaserGuard, managerGuard, adminGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./shared/components/layout/shell/shell.component').then(m => m.ShellComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'catalog',
        children: [
          {
            path: '',
            loadComponent: () => import('./features/catalog/pages/wine-list/wine-list.component').then(m => m.WineListComponent)
          },
          {
            path: ':id',
            loadComponent: () => import('./features/catalog/pages/wine-detail/wine-detail.component').then(m => m.WineDetailComponent)
          }
        ]
      },
      {
        path: 'sales',
        canActivate: [sellerGuard],
        children: [
          {
            path: '',
            loadComponent: () => import('./features/sales/pages/sales-order-list/sales-order-list.component').then(m => m.SalesOrderListComponent)
          },
          {
            path: 'create',
            loadComponent: () => import('./features/sales/pages/sales-order-create/sales-order-create.component').then(m => m.SalesOrderCreateComponent)
          },
          {
            path: 'new',
            redirectTo: 'create',
            pathMatch: 'full'
          },
          {
            path: ':id',
            loadComponent: () => import('./features/sales/pages/sales-order-detail/sales-order-detail.component').then(m => m.SalesOrderDetailComponent)
          }
        ]
      },
      {
        path: 'purchases',
        canActivate: [purchaserGuard],
        children: [
          {
            path: '',
            loadComponent: () => import('./features/purchases/pages/purchase-order-list/purchase-order-list.component').then(m => m.PurchaseOrderListComponent)
          },
          {
            path: 'new',
            loadComponent: () => import('./features/purchases/pages/purchase-order-create/purchase-order-create.component').then(m => m.PurchaseOrderCreateComponent)
          }
        ]
      },
      {
        path: 'approvals',
        canActivate: [managerGuard],
        loadComponent: () => import('./features/approvals/pages/approval-queue/approval-queue.component').then(m => m.ApprovalQueueComponent)
      },
      {
        path: 'fulfillments',
        children: [
          {
            path: '',
            loadComponent: () => import('./features/fulfillments/pages/fulfillment-list/fulfillment-list.component').then(m => m.FulfillmentListComponent)
          },
          {
            path: ':id',
            loadComponent: () => import('./features/fulfillments/pages/fulfillment-tracking/fulfillment-tracking.component').then(m => m.FulfillmentTrackingComponent)
          }
        ]
      },
      {
        path: 'customers',
        loadComponent: () => import('./features/customers/pages/customer-list/customer-list.component').then(m => m.CustomerListComponent)
      },
      {
        path: 'suppliers',
        canActivate: [purchaserGuard],
        loadComponent: () => import('./features/suppliers/pages/supplier-list/supplier-list.component').then(m => m.SupplierListComponent)
      },
      {
        path: 'admin',
        canActivate: [adminGuard],
        children: [
          {
            path: 'customers',
            children: [
              {
                path: '',
                loadComponent: () => import('./features/customers/pages/customer-list/customer-list.component').then(m => m.CustomerListComponent)
              },
              {
                path: ':id',
                loadComponent: () => import('./features/customers/pages/customer-detail/customer-detail.component').then(m => m.CustomerDetailComponent)
              }
            ]
          },
          {
            path: 'suppliers',
            children: [
              {
                path: '',
                loadComponent: () => import('./features/suppliers/pages/supplier-list/supplier-list.component').then(m => m.SupplierListComponent)
              },
              {
                path: ':id',
                loadComponent: () => import('./features/suppliers/pages/supplier-detail/supplier-detail.component').then(m => m.SupplierDetailComponent)
              }
            ]
          },
          {
            path: 'warehouses',
            children: [
              {
                path: '',
                loadComponent: () => import('./features/warehouses/pages/warehouse-list/warehouse-list.component').then(m => m.WarehouseListComponent)
              },
              {
                path: ':id/stock',
                loadComponent: () => import('./features/warehouses/pages/warehouse-stock/warehouse-stock.component').then(m => m.WarehouseStockComponent)
              }
            ]
          },
          {
            path: 'pricing',
            loadComponent: () => import('./features/pricing/pages/price-tables/price-tables.component').then(m => m.PriceTablesComponent)
          },
          {
            path: 'users',
            loadComponent: () => import('./features/users/pages/user-management/user-management.component').then(m => m.UserManagementComponent)
          },
          {
            path: 'exchange-rates',
            loadComponent: () => import('./features/exchange-rates/pages/exchange-rate-list/exchange-rate-list.component').then(m => m.ExchangeRateListComponent)
          }
        ]
      },
      {
        path: 'fiscal-report',
        canActivate: [managerGuard],
        loadComponent: () => import('./features/fiscal-report/pages/fiscal-report/fiscal-report.component').then(m => m.FiscalReportComponent)
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: 'unauthorized',
    loadComponent: () => import('./features/auth/unauthorized/unauthorized.component').then(m => m.UnauthorizedComponent)
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
