# 14. Users, Roles & Authentication (Identity Context)

### 14.1 Roles do Sistema B2B

| Role | Descrição | Responsabilidade |
|------|-----------|------------------|
| **SELLER** | Vendedor | Realiza vendas para clientes B2B cadastrados |
| **PURCHASER** | Comprador | Realiza compras de fornecedores cadastrados |
| **MANAGER** | Gerente | Aprova pedidos, visualiza relatórios, gerencia equipe |
| **ADMIN** | Administrador | Acesso total: catálogo, preços, usuários, configurações |

### 14.2 Domain — Aggregates do Identity Context

```kotlin
// identity/domain/User.kt
data class User(
    val id: UserId,
    val email: Email,
    val name: FullName,
    val role: Role,
    val preferredLanguage: Locale,           // pt-BR, es-PY, en-US
    val preferredCurrency: Currency,          // BRL, PYG, USD
    val status: UserStatus,
    val createdAt: Instant,
    val lastLoginAt: Instant?
) {
    fun canApprovePurchaseOrders(): Boolean = role in listOf(Role.MANAGER, Role.ADMIN)
    fun canApproveSalesOrders(): Boolean = role in listOf(Role.MANAGER, Role.ADMIN)
    fun isAutoApproved(): Boolean = role == Role.ADMIN

    fun changeRole(newRole: Role): Pair<User, UserRoleChanged> {
        val updated = copy(role = newRole)
        return updated to UserRoleChanged(id, role, newRole, Instant.now())
    }

    fun deactivate(): Pair<User, UserDeactivated> {
        require(status == UserStatus.ACTIVE) { "User already inactive" }
        val updated = copy(status = UserStatus.INACTIVE)
        return updated to UserDeactivated(id, Instant.now())
    }
}

enum class Role {
    SELLER,      // Vendedor — realiza vendas
    PURCHASER,   // Comprador — realiza compras
    MANAGER,     // Gerente — aprova pedidos
    ADMIN        // Administrador — acesso total
}

enum class UserStatus { ACTIVE, INACTIVE, SUSPENDED }

// Value Objects
data class UserId(val value: UUID)
data class Email(val value: String) {
    init { require(value.matches(Regex("^[\\w.-]+@[\\w.-]+\\.\\w+$"))) { "Invalid email" } }
}
data class FullName(val firstName: String, val lastName: String) {
    val displayName: String get() = "$firstName $lastName"
}
```

### 14.3 Permissões por Role — Matriz de Acesso B2B

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                              Matriz de Permissões B2B                                 │
├────────────────────────────────────┬──────────┬───────────┬──────────┬──────────────┤
│  Recurso / Ação                    │  SELLER  │ PURCHASER │ MANAGER  │    ADMIN     │
├────────────────────────────────────┼──────────┼───────────┼──────────┼──────────────┤
│  Catálogo: visualizar vinhos       │  ✅      │  ✅       │  ✅      │  ✅          │
│  Catálogo: criar/editar vinho      │  ❌      │  ❌       │  ❌      │  ✅          │
│  Catálogo: descontinuar vinho      │  ❌      │  ❌       │  ❌      │  ✅          │
├────────────────────────────────────┼──────────┼───────────┼──────────┼──────────────┤
│  Fornecedores: visualizar          │  ❌      │  ✅       │  ✅      │  ✅          │
│  Fornecedores: criar/editar        │  ❌      │  ❌       │  ❌      │  ✅          │
├────────────────────────────────────┼──────────┼───────────┼──────────┼──────────────┤
│  Clientes: visualizar              │  ✅      │  ❌       │  ✅      │  ✅          │
│  Clientes: criar/editar            │  ❌      │  ❌       │  ❌      │  ✅          │
│  Clientes: ver condições comerciais│  ✅      │  ❌       │  ✅      │  ✅          │
├────────────────────────────────────┼──────────┼───────────┼──────────┼──────────────┤
│  Depósitos: visualizar             │  ✅      │  ✅       │  ✅      │  ✅          │
│  Depósitos: criar/editar           │  ❌      │  ❌       │  ❌      │  ✅          │
│  Estoque: visualizar               │  ✅      │  ✅       │  ✅      │  ✅          │
│  Estoque: ajustar manualmente      │  ❌      │  ❌       │  ❌      │  ✅          │
├────────────────────────────────────┼──────────┼───────────┼──────────┼──────────────┤
│  Pedido Compra: criar              │  ❌      │  ✅       │  ❌      │  ✅          │
│  Pedido Compra: visualizar próprios│  ❌      │  ✅       │  ✅      │  ✅          │
│  Pedido Compra: visualizar todos   │  ❌      │  ❌       │  ✅      │  ✅          │
│  Pedido Compra: aprovar            │  ❌      │  ❌       │  ✅      │  ✅ (auto)   │
│  Pedido Compra: receber mercadoria │  ❌      │  ✅       │  ✅      │  ✅          │
├────────────────────────────────────┼──────────┼───────────┼──────────┼──────────────┤
│  Pedido Venda: criar               │  ✅      │  ❌       │  ❌      │  ✅          │
│  Pedido Venda: visualizar próprios │  ✅      │  ❌       │  ✅      │  ✅          │
│  Pedido Venda: visualizar todos    │  ❌      │  ❌       │  ✅      │  ✅          │
│  Pedido Venda: aprovar             │  ❌      │  ❌       │  ✅      │  ✅ (auto)   │
│  Pedido Venda: ver margem          │  ✅      │  ❌       │  ✅      │  ✅          │
├────────────────────────────────────┼──────────┼───────────┼──────────┼──────────────┤
│  Fulfillment: visualizar           │  ✅      │  ❌       │  ✅      │  ✅          │
│  Fulfillment: atualizar status     │  ❌      │  ❌       │  ✅      │  ✅          │
├────────────────────────────────────┼──────────┼───────────┼──────────┼──────────────┤
│  Preços: visualizar tabelas        │  ✅      │  ✅       │  ✅      │  ✅          │
│  Preços: criar/editar tabelas      │  ❌      │  ❌       │  ❌      │  ✅          │
├────────────────────────────────────┼──────────┼───────────┼──────────┼──────────────┤
│  Relatórios: vendas                │  ❌      │  ❌       │  ✅      │  ✅          │
│  Relatórios: compras               │  ❌      │  ❌       │  ✅      │  ✅          │
│  Relatórios: fiscais               │  ❌      │  ❌       │  ❌      │  ✅          │
│  Dashboard: margem consolidada     │  ❌      │  ❌       │  ✅      │  ✅          │
├────────────────────────────────────┼──────────┼───────────┼──────────┼──────────────┤
│  Usuários: ver perfil próprio      │  ✅      │  ✅       │  ✅      │  ✅          │
│  Usuários: editar perfil próprio   │  ✅      │  ✅       │  ✅      │  ✅          │
│  Usuários: listar todos            │  ❌      │  ❌       │  ✅      │  ✅          │
│  Usuários: criar/editar/suspender  │  ❌      │  ❌       │  ❌      │  ✅          │
└────────────────────────────────────┴──────────┴───────────┴──────────┴──────────────┘
```

### 14.4 Fluxo de Aprovação por Role

```
┌─────────────────────────────────────────────────────────────────┐
│                    APPROVAL WORKFLOW                             │
│                                                                  │
│  Usuário cria pedido (Purchase ou Sales)                        │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────┐                                               │
│  │ Criador é    │───── SIM ────▶ Pedido APPROVED automaticamente│
│  │ ADMIN?       │                                               │
│  └──────┬───────┘                                               │
│         │ NÃO                                                    │
│         ▼                                                        │
│  ┌──────────────┐                                               │
│  │ Status =     │                                               │
│  │ PENDING_     │                                               │
│  │ APPROVAL     │                                               │
│  └──────┬───────┘                                               │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────┐                                               │
│  │ MANAGER ou   │                                               │
│  │ ADMIN revisa │                                               │
│  └──────┬───────┘                                               │
│         │                                                        │
│    ┌────┴────┐                                                  │
│    ▼         ▼                                                  │
│ APPROVED  REJECTED                                              │
│    │         │                                                  │
│    ▼         ▼                                                  │
│ Continua   Notifica                                             │
│ fluxo      criador                                              │
└─────────────────────────────────────────────────────────────────┘
```

### 14.5 Autenticação — AWS Cognito + JWT

```
┌───────────────────────────────────────────────────────────────┐
│                   Auth Flow (OAuth 2.0 + OIDC)                 │
│                                                                │
│  [Angular SPA]                                                 │
│       │                                                        │
│       │ 1. Login (email + password)                            │
│       ▼                                                        │
│  ┌─────────────────┐                                          │
│  │  AWS Cognito     │  User Pool (identity provider)          │
│  │  ┌─────────────┐ │                                          │
│  │  │ User Pool   │ │  - Armazena usuários (email, role)      │
│  │  │ + App Client│ │  - MFA opcional                          │
│  │  └─────────────┘ │  - Password policies                    │
│  └────────┬────────┘                                          │
│           │                                                    │
│           │ 2. Retorna tokens (id_token + access_token + refresh)
│           ▼                                                    │
│  [Angular SPA]                                                 │
│       │                                                        │
│       │ 3. Envia access_token no header Authorization: Bearer  │
│       ▼                                                        │
│  ┌─────────────────┐                                          │
│  │  Quarkus API    │                                          │
│  │  (OIDC Filter)  │  4. Valida JWT com Cognito JWKS          │
│  │                 │  5. Extrai role do claim "custom:role"    │
│  │  @RolesAllowed  │  6. Autoriza baseado na role              │
│  └─────────────────┘                                          │
└───────────────────────────────────────────────────────────────┘
```

### 14.6 Backend — Quarkus OIDC + Role-Based Access

#### Dependência

```kotlin
// build.gradle.kts
implementation("io.quarkus:quarkus-oidc")
implementation("io.quarkus:quarkus-keycloak-authorization")
```

#### Configuração Quarkus — Cognito OIDC

```yaml
# application.yaml
quarkus:
  oidc:
    auth-server-url: https://cognito-idp.us-east-1.amazonaws.com/${COGNITO_USER_POOL_ID}
    client-id: ${COGNITO_APP_CLIENT_ID}
    token:
      issuer: https://cognito-idp.us-east-1.amazonaws.com/${COGNITO_USER_POOL_ID}
    roles:
      role-claim-path: "custom:role"
    tls:
      verification: required
```

#### REST Resource com Role-Based Access Control

```kotlin
// sales/adapters/inbound/SalesOrderResource.kt
@Path("/api/v1/sales-orders")
@Authenticated
@ApplicationScoped
class SalesOrderResource(
    private val createSalesOrder: CreateSalesOrder,
    private val listSalesOrders: ListSalesOrders
) {
    // SELLER + ADMIN — criar pedido de venda
    @POST
    @RolesAllowed("SELLER", "ADMIN")
    fun create(@Valid request: CreateSalesOrderRequest): Uni<Response> =
        createSalesOrder.execute(request.toCommand())
            .map { Response.created(URI.create("/api/v1/sales-orders/${it.id}")).entity(it).build() }

    // SELLER vê próprios, MANAGER/ADMIN vê todos
    @GET
    @RolesAllowed("SELLER", "MANAGER", "ADMIN")
    fun list(@Context securityContext: SecurityContext): Uni<Response> {
        val userId = securityContext.userPrincipal.name
        val role = extractRole(securityContext)
        return when (role) {
            Role.SELLER -> listSalesOrders.byCreator(UserId(UUID.fromString(userId)))
            else -> listSalesOrders.all()
        }.map { Response.ok(it).build() }
    }
}

// purchase/adapters/inbound/PurchaseOrderResource.kt
@Path("/api/v1/purchase-orders")
@Authenticated
@ApplicationScoped
class PurchaseOrderResource(
    private val createPurchaseOrder: CreatePurchaseOrder
) {
    // PURCHASER + ADMIN — criar pedido de compra
    @POST
    @RolesAllowed("PURCHASER", "ADMIN")
    fun create(@Valid request: CreatePurchaseOrderRequest): Uni<Response> =
        createPurchaseOrder.execute(request.toCommand())
            .map { Response.created(URI.create("/api/v1/purchase-orders/${it.id}")).entity(it).build() }
}

// approval/adapters/inbound/ApprovalResource.kt
@Path("/api/v1/approvals")
@Authenticated
@ApplicationScoped
class ApprovalResource(
    private val approveOrder: ApproveOrder,
    private val rejectOrder: RejectOrder
) {
    // MANAGER + ADMIN — aprovar pedidos
    @POST
    @Path("/{id}/approve")
    @RolesAllowed("MANAGER", "ADMIN")
    fun approve(@PathParam("id") id: UUID): Uni<Response> =
        approveOrder.execute(ApprovalId(id))
            .map { Response.ok(it).build() }

    @POST
    @Path("/{id}/reject")
    @RolesAllowed("MANAGER", "ADMIN")
    fun reject(@PathParam("id") id: UUID, @Valid request: RejectRequest): Uni<Response> =
        rejectOrder.execute(ApprovalId(id), request.reason)
            .map { Response.ok(it).build() }
}
```

#### AuthenticatedUser Helper

```kotlin
// _shared/adapters/security/AuthenticatedUser.kt
@ApplicationScoped
class AuthenticatedUser(
    @Inject private val identity: SecurityIdentity
) {
    val userId: UserId
        get() = UserId(UUID.fromString(identity.principal.name))

    val email: String
        get() = identity.getAttribute<String>("email")

    val role: Role
        get() = Role.valueOf(identity.getAttribute<String>("custom:role") ?: "SELLER")

    val isSeller: Boolean get() = role == Role.SELLER
    val isPurchaser: Boolean get() = role == Role.PURCHASER
    val isManager: Boolean get() = role == Role.MANAGER
    val isAdmin: Boolean get() = role == Role.ADMIN

    val canApprove: Boolean get() = role in listOf(Role.MANAGER, Role.ADMIN)
    val isAutoApproved: Boolean get() = role == Role.ADMIN

    val preferredLanguage: String
        get() = identity.getAttribute<String>("locale") ?: "pt-BR"

    val preferredCurrency: Currency
        get() = Currency.fromCode(identity.getAttribute<String>("custom:currency") ?: "BRL")
}
```

### 14.7 Frontend — Auth Guards B2B

```typescript
// core/auth/auth.service.ts
@Injectable({ providedIn: 'root' })
export class AuthService {
  currentUser = signal<AuthUser | null>(null);
  isAuthenticated = computed(() => this.currentUser() !== null);

  // Role checks
  isSeller = computed(() => this.currentUser()?.role === 'SELLER');
  isPurchaser = computed(() => this.currentUser()?.role === 'PURCHASER');
  isManager = computed(() => this.currentUser()?.role === 'MANAGER');
  isAdmin = computed(() => this.currentUser()?.role === 'ADMIN');
  canApprove = computed(() => ['MANAGER', 'ADMIN'].includes(this.currentUser()?.role || ''));
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'SELLER' | 'PURCHASER' | 'MANAGER' | 'ADMIN';
  preferredLanguage: string;
  preferredCurrency: string;
}
```

```typescript
// core/auth/guards.ts
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isAuthenticated() ? true : router.createUrlTree(['/login']);
};

export const sellerGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isAuthenticated()) return router.createUrlTree(['/login']);
  if (!auth.isSeller() && !auth.isAdmin()) return router.createUrlTree(['/unauthorized']);
  return true;
};

export const purchaserGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isAuthenticated()) return router.createUrlTree(['/login']);
  if (!auth.isPurchaser() && !auth.isAdmin()) return router.createUrlTree(['/unauthorized']);
  return true;
};

export const managerGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isAuthenticated()) return router.createUrlTree(['/login']);
  if (!auth.canApprove()) return router.createUrlTree(['/unauthorized']);
  return true;
};

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isAuthenticated()) return router.createUrlTree(['/login']);
  if (!auth.isAdmin()) return router.createUrlTree(['/unauthorized']);
  return true;
};
```

```typescript
// app.routes.ts — Rotas B2B
export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/auth/login.component') },

  // Catálogo — todos autenticados
  {
    path: 'catalog',
    canActivate: [authGuard],
    loadChildren: () => import('./features/catalog/catalog.routes'),
  },

  // Vendas — SELLER + ADMIN
  {
    path: 'sales',
    canActivate: [sellerGuard],
    loadChildren: () => import('./features/sales/sales.routes'),
  },

  // Compras — PURCHASER + ADMIN
  {
    path: 'purchases',
    canActivate: [purchaserGuard],
    loadChildren: () => import('./features/purchases/purchases.routes'),
  },

  // Aprovações — MANAGER + ADMIN
  {
    path: 'approvals',
    canActivate: [managerGuard],
    loadChildren: () => import('./features/approvals/approvals.routes'),
  },

  // Administração — ADMIN only
  {
    path: 'admin',
    canActivate: [adminGuard],
    children: [
      { path: 'users', loadChildren: () => import('./features/users/users.routes') },
      { path: 'suppliers', loadChildren: () => import('./features/suppliers/suppliers.routes') },
      { path: 'customers', loadChildren: () => import('./features/customers/customers.routes') },
      { path: 'warehouses', loadChildren: () => import('./features/warehouses/warehouses.routes') },
      { path: 'pricing', loadChildren: () => import('./features/pricing/pricing.routes') },
      { path: 'reports', loadChildren: () => import('./features/reports/reports.routes') },
    ],
  },

  { path: 'unauthorized', loadComponent: () => import('./features/auth/unauthorized.component') },
  { path: '', redirectTo: 'catalog', pathMatch: 'full' },
  { path: '**', redirectTo: 'catalog' },
];
```

### 14.8 AWS Cognito — Terraform Module

```hcl
# modules/cognito/main.tf
resource "aws_cognito_user_pool" "vinheria" {
  name = "vinheria-${var.environment}"

  password_policy {
    minimum_length    = 10
    require_lowercase = true
    require_uppercase = true
    require_numbers   = true
    require_symbols   = true
  }

  # Custom attributes for B2B roles
  schema {
    name                = "role"
    attribute_data_type = "String"
    mutable             = true
    string_attribute_constraints {
      min_length = 5
      max_length = 10  # SELLER, PURCHASER, MANAGER, ADMIN
    }
  }
  schema {
    name                = "currency"
    attribute_data_type = "String"
    mutable             = true
    string_attribute_constraints {
      min_length = 3
      max_length = 3
    }
  }

  auto_verified_attributes = ["email"]
  mfa_configuration = var.environment == "production" ? "OPTIONAL" : "OFF"

  tags = local.common_tags
}

# Pre-create ADMIN user
resource "aws_cognito_user" "admin" {
  count        = var.create_initial_admin ? 1 : 0
  user_pool_id = aws_cognito_user_pool.vinheria.id
  username     = var.admin_email

  attributes = {
    email          = var.admin_email
    email_verified = true
    "custom:role"  = "ADMIN"
    "custom:currency" = "BRL"
  }
}
```

### 14.9 Regras de Auth para Agentes

1. **SEMPRE** usar `@RolesAllowed` com as roles específicas: SELLER, PURCHASER, MANAGER, ADMIN
2. **SEMPRE** verificar role no backend — frontend guards são apenas UX, não segurança
3. **SEMPRE** filtrar dados por criador para SELLER/PURCHASER — nunca expor dados de outros
4. **SEMPRE** implementar auto-approval apenas para ADMIN — outros roles passam por workflow
5. **SEMPRE** usar `AuthenticatedUser` helper para extrair dados do JWT
6. **NUNCA** permitir SELLER acessar endpoints de compra ou PURCHASER acessar endpoints de venda
7. **SEMPRE** validar que apenas MANAGER/ADMIN podem aprovar pedidos
8. **SEMPRE** incluir role no JWT como custom attribute do Cognito
9. **NUNCA** hardcodar roles — sempre extrair do token
10. **SEMPRE** logar ações de aprovação/rejeição com userId e timestamp

---
