import { useState } from "react";

const BORDEAUX = "#722F37";
const BORDEAUX_LIGHT = "#8B4553";
const GOLD = "#C4A35A";
const DARK = "#1A1A2E";
const SURFACE = "#F5F3F0";
const PARCHMENT = "#FAF8F5";

const sections = [
  "Overview",
  "Microservices",
  "Hexagonal",
  "CDC & Events",
  "Saga",
  "Data Flow",
  "i18n & Currency",
  "Observability",
  "Infrastructure",
  "SLOs",
];

const ServiceBox = ({ name, desc, tech, color = BORDEAUX, small }) => (
  <div style={{
    background: "white",
    border: `2px solid ${color}`,
    borderRadius: 8,
    padding: small ? "10px 12px" : "14px 18px",
    minWidth: small ? 110 : 150,
    textAlign: "center",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    transition: "transform 0.2s, box-shadow 0.2s",
    cursor: "default",
  }}
    onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(114,47,55,0.15)"; }}
    onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)"; }}
  >
    <div style={{ fontWeight: 700, fontSize: small ? 13 : 15, color: DARK }}>{name}</div>
    {desc && <div style={{ fontSize: 11, color: "#666", marginTop: 4 }}>{desc}</div>}
    {tech && <div style={{ fontSize: 10, color, marginTop: 4, fontFamily: "monospace" }}>{tech}</div>}
  </div>
);

const Arrow = ({ label, direction = "down", color = "#999" }) => {
  const isDown = direction === "down";
  const isRight = direction === "right";
  return (
    <div style={{ display: "flex", flexDirection: isRight ? "row" : "column", alignItems: "center", gap: 2, padding: isRight ? "0 4px" : "4px 0" }}>
      {isDown && <div style={{ width: 2, height: 20, background: color }} />}
      {isRight && <div style={{ height: 2, width: 20, background: color }} />}
      {label && <div style={{ fontSize: 9, color, fontStyle: "italic", padding: "0 4px" }}>{label}</div>}
      <div style={{
        width: 0, height: 0,
        borderLeft: isDown ? "5px solid transparent" : isRight ? "none" : "5px solid transparent",
        borderRight: isDown ? "5px solid transparent" : isRight ? `8px solid ${color}` : "5px solid transparent",
        borderTop: isDown ? `8px solid ${color}` : isRight ? "5px solid transparent" : "none",
        borderBottom: isDown ? "none" : isRight ? "5px solid transparent" : `8px solid ${color}`,
      }} />
    </div>
  );
};

const Badge = ({ children, color = BORDEAUX }) => (
  <span style={{
    display: "inline-block",
    background: `${color}15`,
    color,
    border: `1px solid ${color}40`,
    borderRadius: 4,
    padding: "2px 8px",
    fontSize: 11,
    fontWeight: 600,
    fontFamily: "monospace",
  }}>{children}</span>
);

const SectionTitle = ({ children, sub }) => (
  <div style={{ marginBottom: sub ? 12 : 24, marginTop: sub ? 16 : 0 }}>
    <h2 style={{
      fontSize: sub ? 18 : 26,
      fontWeight: 700,
      color: DARK,
      margin: 0,
      letterSpacing: "-0.02em",
      borderBottom: sub ? "none" : `3px solid ${BORDEAUX}`,
      paddingBottom: sub ? 0 : 8,
      display: "inline-block",
    }}>{children}</h2>
  </div>
);

const Card = ({ title, children, accent = BORDEAUX }) => (
  <div style={{
    background: "white",
    borderRadius: 10,
    padding: 20,
    borderLeft: `4px solid ${accent}`,
    boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
    marginBottom: 16,
  }}>
    {title && <div style={{ fontWeight: 700, fontSize: 15, color: DARK, marginBottom: 10 }}>{title}</div>}
    {children}
  </div>
);

const FlowStep = ({ num, title, desc }) => (
  <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 10 }}>
    <div style={{
      width: 28, height: 28, borderRadius: "50%", background: BORDEAUX, color: "white",
      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0,
    }}>{num}</div>
    <div>
      <div style={{ fontWeight: 600, fontSize: 13, color: DARK }}>{title}</div>
      <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>{desc}</div>
    </div>
  </div>
);

// ─── SECTIONS ────────────────────────────────────────────────

function OverviewSection() {
  return (
    <div>
      <SectionTitle>System Overview — Vinheria Digital</SectionTitle>
      <div style={{ fontSize: 14, color: "#555", marginBottom: 24, lineHeight: 1.7 }}>
        Plataforma de marketplace de vinhos para <strong>3 mercados</strong> (Brasil, Paraguai, EUA), projetada para movimentar <strong>+5.000 SKUs/dia</strong> com
        comunicação reativa, orquestração de sagas distribuídas, consistência
        via CDC, suporte a <strong>3 idiomas</strong> (pt-BR, es-PY, en-US) e <strong>3 moedas</strong> (BRL, PYG, USD).
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 28 }}>
        {[
          { label: "Backend", value: "Quarkus 3.x + Kotlin", icon: "⚡" },
          { label: "Frontend", value: "Angular 18+ + PrimeNG", icon: "🎨" },
          { label: "Broker", value: "Kafka KRaft (no ZK)", icon: "📨" },
          { label: "CDC", value: "Debezium + Outbox", icon: "🔄" },
          { label: "Cache", value: "Valkey 8", icon: "🗄️" },
          { label: "Search", value: "OpenSearch", icon: "🔍" },
          { label: "DB", value: "PostgreSQL 16 (R2DBC)", icon: "🐘" },
          { label: "Saga", value: "Orkes Conductor", icon: "🎼" },
          { label: "IaC", value: "Terraform + AWS EKS", icon: "☁️" },
          { label: "Observability", value: "OTel → Grafana", icon: "📊" },
          { label: "CI/CD", value: "GitHub Actions", icon: "🚀" },
          { label: "Git", value: "Trunk-Based + CC", icon: "🌿" },
          { label: "i18n", value: "Transloco (3 langs)", icon: "🌍" },
          { label: "Currency", value: "BRL / PYG / USD", icon: "💱" },
          { label: "Accounting", value: "BRL (fiscal/NF-e)", icon: "📋" },
          { label: "Auth", value: "Cognito (USER/ADMIN)", icon: "🔐" },
        ].map((t, i) => (
          <div key={i} style={{
            background: "white", borderRadius: 8, padding: "12px 14px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)", display: "flex", gap: 10, alignItems: "center",
          }}>
            <span style={{ fontSize: 22 }}>{t.icon}</span>
            <div>
              <div style={{ fontSize: 10, color: BORDEAUX, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{t.label}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: DARK }}>{t.value}</div>
            </div>
          </div>
        ))}
      </div>

      <SectionTitle sub>High-Level Architecture</SectionTitle>
      <div style={{ background: "white", borderRadius: 12, padding: 28, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", overflowX: "auto" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          {/* Users */}
          <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
            <ServiceBox name="🌐 Browser" desc="Angular + PrimeNG" tech="SSE / REST" color={GOLD} />
            <ServiceBox name="📱 Mobile" desc="Future PWA" tech="REST API" color={GOLD} />
          </div>
          <Arrow label="HTTPS + SSE" />

          {/* API Gateway / Load Balancer */}
          <div style={{ background: `${BORDEAUX}10`, borderRadius: 8, padding: "8px 40px", border: `1px dashed ${BORDEAUX}` }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: BORDEAUX }}>Kubernetes Ingress / API Gateway</span>
          </div>
          <Arrow label="Internal ClusterIP" />

          {/* Microservices Row */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
            {["catalog", "order", "inventory", "pricing", "payment", "shipping", "identity"].map(s => (
              <ServiceBox key={s} name={s} tech="Quarkus Native" small />
            ))}
          </div>

          <div style={{ display: "flex", gap: 40, marginTop: 12, justifyContent: "center", flexWrap: "wrap" }}>
            {/* Left: Event backbone */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <Arrow label="Outbox → WAL" />
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <ServiceBox name="Kafka Connect" desc="Debezium CDC" tech="Outbox EventRouter" color="#E76F51" small />
                <Arrow direction="right" label="publish" color="#E76F51" />
                <ServiceBox name="Kafka" desc="KRaft mode" tech="Domain Events" color="#E76F51" small />
              </div>
            </div>

            {/* Right: Saga */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <Arrow label="poll tasks" />
              <ServiceBox name="Orkes Conductor" desc="Saga Orchestration" tech="checkout / fulfillment / return" color="#2A9D8F" small />
            </div>
          </div>

          <Arrow label="persist / query" />

          {/* Data Stores Row */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
            <ServiceBox name="PostgreSQL 16" desc="WAL logical" tech="DB per Service" color="#336791" small />
            <ServiceBox name="Valkey 8" desc="Cache + Sessions" tech="I/O threads" color="#8B5CF6" small />
            <ServiceBox name="OpenSearch" desc="Full-text Search" tech="Wine Facets" color="#005EB8" small />
          </div>

          <Arrow label="OTel OTLP" />

          {/* Observability */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
            <ServiceBox name="OTel Collector" tech="gRPC 4317" color="#4A5568" small />
            <ServiceBox name="Tempo" desc="Traces" color="#4A5568" small />
            <ServiceBox name="Loki" desc="Logs" color="#4A5568" small />
            <ServiceBox name="Prometheus" desc="Metrics" color="#4A5568" small />
            <ServiceBox name="Grafana" desc="Dashboards" color="#4A5568" small />
          </div>
        </div>
      </div>
    </div>
  );
}

function MicroservicesSection() {
  const services = [
    { name: "catalog", desc: "Catálogo de vinhos, busca, SKU management", domain: "Wine, WineRegion, GrapeVariety", events: ["WineRegistered", "WinePriceChanged", "WineDiscontinued"], deps: "PostgreSQL, Valkey, OpenSearch" },
    { name: "order", desc: "Pedidos, checkout, status tracking", domain: "Order, OrderItem, OrderStatus", events: ["OrderPlaced", "OrderCancelled", "OrderCompleted"], deps: "PostgreSQL, Conductor (saga)" },
    { name: "inventory", desc: "Estoque, reservas, controle de SKU", domain: "Stock, StockReservation, StockQuantity", events: ["StockReserved", "StockReleased", "StockDepleted"], deps: "PostgreSQL, Valkey" },
    { name: "pricing", desc: "Precificação dinâmica, promoções, multi-currency (BRL/PYG/USD)", domain: "PriceRule, Discount, Money, Currency, ExchangeRate", events: ["PriceUpdated", "PromotionActivated", "ExchangeRateRefreshed"], deps: "PostgreSQL, Valkey, Exchange Rate API" },
    { name: "payment", desc: "Processamento de pagamento, gateway", domain: "Payment, PaymentMethod, Transaction", events: ["PaymentConfirmed", "PaymentFailed", "RefundProcessed"], deps: "PostgreSQL, Gateway externo" },
    { name: "shipping", desc: "Frete, despacho, tracking", domain: "Shipment, ShippingLabel, Carrier", events: ["ShipmentDispatched", "ShipmentDelivered"], deps: "PostgreSQL, Carrier APIs" },
    { name: "identity", desc: "Auth (Cognito OIDC), RBAC (USER/ADMIN), perfil de idioma/moeda", domain: "User, Role, Email, FullName, UserStatus", events: ["UserRegistered", "UserPromoted", "UserDeactivated"], deps: "PostgreSQL, Valkey (sessions), AWS Cognito" },
  ];

  return (
    <div>
      <SectionTitle>Microservices Map</SectionTitle>
      <div style={{ fontSize: 13, color: "#555", marginBottom: 20 }}>
        7 microserviços, cada um com database isolado (Database per Service), comunicação via Debezium CDC + Kafka.
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 14 }}>
        {services.map((s, i) => (
          <Card key={i} title={`vinheria-${s.name}`}>
            <div style={{ fontSize: 12, color: "#666", marginBottom: 10 }}>{s.desc}</div>
            <div style={{ marginBottom: 6 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: BORDEAUX, textTransform: "uppercase" }}>Domain: </span>
              <span style={{ fontSize: 11, fontFamily: "monospace" }}>{s.domain}</span>
            </div>
            <div style={{ marginBottom: 6 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#E76F51", textTransform: "uppercase" }}>Events (CDC): </span>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 4 }}>
                {s.events.map((e, j) => <Badge key={j} color="#E76F51">{e}</Badge>)}
              </div>
            </div>
            <div style={{ marginTop: 6 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#336791", textTransform: "uppercase" }}>Dependencies: </span>
              <span style={{ fontSize: 11, color: "#555" }}>{s.deps}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function HexagonalSection() {
  return (
    <div>
      <SectionTitle>Hexagonal Architecture + Vertical Slices</SectionTitle>
      <div style={{ fontSize: 13, color: "#555", marginBottom: 20, lineHeight: 1.7 }}>
        Cada microserviço segue <strong>Ports & Adapters</strong>. Dentro, o código é organizado por <strong>Vertical Slices</strong> — cada feature é uma fatia autossuficiente.
      </div>

      <Card title="Dependency Rule">
        <div style={{ background: PARCHMENT, borderRadius: 8, padding: 20, fontFamily: "monospace", fontSize: 12, lineHeight: 2 }}>
          <div style={{ textAlign: "center", marginBottom: 8 }}>
            <span style={{ color: BORDEAUX, fontWeight: 700 }}>REGRA DE OURO:</span> Dependências apontam SEMPRE para dentro → domain
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ background: "#E76F5120", padding: "8px 16px", borderRadius: 6, border: "1px solid #E76F51" }}>
                <div style={{ fontWeight: 700, color: "#E76F51" }}>Adapters Inbound</div>
                <div style={{ fontSize: 10 }}>REST, gRPC, Kafka Consumer, Conductor Worker</div>
              </div>
            </div>
            <div style={{ alignSelf: "center", fontSize: 20 }}>→</div>
            <div style={{ textAlign: "center" }}>
              <div style={{ background: "#2A9D8F20", padding: "8px 16px", borderRadius: 6, border: "1px solid #2A9D8F" }}>
                <div style={{ fontWeight: 700, color: "#2A9D8F" }}>Application</div>
                <div style={{ fontSize: 10 }}>Use Cases (RegisterWine, PlaceOrder)</div>
              </div>
            </div>
            <div style={{ alignSelf: "center", fontSize: 20 }}>→</div>
            <div style={{ textAlign: "center" }}>
              <div style={{ background: `${BORDEAUX}20`, padding: "8px 16px", borderRadius: 6, border: `2px solid ${BORDEAUX}` }}>
                <div style={{ fontWeight: 700, color: BORDEAUX }}>Domain</div>
                <div style={{ fontSize: 10 }}>Aggregates, Value Objects, Ports</div>
              </div>
            </div>
            <div style={{ alignSelf: "center", fontSize: 20 }}>←</div>
            <div style={{ textAlign: "center" }}>
              <div style={{ background: "#005EB820", padding: "8px 16px", borderRadius: 6, border: "1px solid #005EB8" }}>
                <div style={{ fontWeight: 700, color: "#005EB8" }}>Adapters Outbound</div>
                <div style={{ fontSize: 10 }}>Postgres, Valkey, OpenSearch, Kafka</div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card title="Vertical Slice Example: catalog/order">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[
            { path: "catalog/domain/", files: "Wine.kt, WineRegion.kt, WineRepository.kt (port)", color: BORDEAUX },
            { path: "catalog/application/", files: "RegisterWine.kt, SearchWines.kt, UpdateStock.kt", color: "#2A9D8F" },
            { path: "catalog/adapters/inbound/", files: "WineResource.kt (REST), WineKafkaConsumer.kt", color: "#E76F51" },
            { path: "catalog/adapters/outbound/", files: "WinePostgresRepository.kt, WineValkeyCache.kt", color: "#005EB8" },
          ].map((s, i) => (
            <div key={i} style={{ background: `${s.color}08`, padding: 10, borderRadius: 6, borderLeft: `3px solid ${s.color}` }}>
              <div style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: s.color }}>{s.path}</div>
              <div style={{ fontSize: 11, color: "#666", marginTop: 4 }}>{s.files}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function CDCSection() {
  return (
    <div>
      <SectionTitle>CDC — Debezium + Outbox Pattern</SectionTitle>
      <div style={{ fontSize: 13, color: "#555", marginBottom: 20, lineHeight: 1.7 }}>
        Elimina dual-write (DB + Kafka separados). Domain events persistem na tabela <Badge>outbox_events</Badge> na mesma transação ACID.
        Debezium captura via PostgreSQL WAL e publica no Kafka automaticamente.
      </div>

      <Card title="CDC Pipeline Flow">
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <FlowStep num="1" title="Use Case persiste entidade + outbox event" desc="Transação ACID única — RegisterWine.execute() → repository.save() + event.fire()" />
          <FlowStep num="2" title="PostgreSQL escreve no WAL" desc="wal_level=logical — cada INSERT na outbox_events gera um WAL record" />
          <FlowStep num="3" title="Debezium lê o WAL stream" desc="PostgreSQL Connector via pgoutput plugin — slot de replicação dedicado" />
          <FlowStep num="4" title="Outbox EventRouter transforma" desc="aggregate_type 'Wine' → topic 'vinheria.wine.events' — routing automático" />
          <FlowStep num="5" title="Kafka recebe o domain event" desc="KRaft broker publica no topic — consumers processam assincronamente" />
          <FlowStep num="6" title="Debezium deleta registro processado" desc="Outbox table limpa automaticamente — sem acúmulo de dados" />
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Card title="Kafka KRaft (sem Zookeeper)" accent="#E76F51">
          <div style={{ fontSize: 12, color: "#555", lineHeight: 1.7 }}>
            Kafka opera exclusivamente em <strong>KRaft mode</strong>. Nós combinam roles <Badge color="#E76F51">broker + controller</Badge>.
            Metadata gerenciado via Raft consensus — sem dependência externa de Zookeeper.
          </div>
          <div style={{ marginTop: 10, padding: 10, background: "#f5f0ea", borderRadius: 6, fontSize: 11, fontFamily: "monospace" }}>
            KAFKA_CFG_PROCESS_ROLES: broker,controller<br/>
            KAFKA_CFG_CONTROLLER_QUORUM_VOTERS: 1@kafka:9093
          </div>
        </Card>

        <Card title="Outbox Table Schema" accent="#336791">
          <div style={{ fontSize: 11, fontFamily: "monospace", lineHeight: 1.8, color: "#555" }}>
            <div><span style={{color: BORDEAUX}}>id</span> UUID PRIMARY KEY</div>
            <div><span style={{color: BORDEAUX}}>aggregate_type</span> VARCHAR — "Wine", "Order"</div>
            <div><span style={{color: BORDEAUX}}>aggregate_id</span> VARCHAR — entity ID</div>
            <div><span style={{color: BORDEAUX}}>type</span> VARCHAR — "WineRegistered"</div>
            <div><span style={{color: BORDEAUX}}>payload</span> JSONB — event data</div>
            <div><span style={{color: BORDEAUX}}>timestamp</span> TIMESTAMP</div>
            <div><span style={{color: BORDEAUX}}>tracingspancontext</span> TEXT — OTel propagation</div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function SagaSection() {
  const steps = [
    { name: "validate_order", svc: "order", comp: "—" },
    { name: "reserve_stock", svc: "inventory", comp: "cancel_stock_reservation" },
    { name: "process_payment", svc: "payment", comp: "refund_payment" },
    { name: "initiate_shipment", svc: "shipping", comp: "cancel_shipment" },
    { name: "send_confirmation", svc: "order", comp: "notify_customer_failure" },
  ];

  return (
    <div>
      <SectionTitle>Saga Orchestration — Orkes Conductor</SectionTitle>
      <Card title="checkout_saga_wf — Happy Path + Compensation">
        <div style={{ overflowX: "auto" }}>
          <div style={{ display: "flex", gap: 0, alignItems: "flex-start", minWidth: 700, padding: "10px 0" }}>
            {steps.map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, minWidth: 130 }}>
                  <div style={{
                    background: "#2A9D8F15", border: "2px solid #2A9D8F", borderRadius: 8, padding: "10px 8px",
                    textAlign: "center", width: "100%",
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#2A9D8F" }}>{s.name}</div>
                    <div style={{ fontSize: 10, color: "#888" }}>{s.svc} service</div>
                  </div>
                  {s.comp !== "—" && (
                    <>
                      <div style={{ fontSize: 9, color: "#E76F51", fontStyle: "italic" }}>on failure ↓</div>
                      <div style={{
                        background: "#E76F5115", border: "1px dashed #E76F51", borderRadius: 6, padding: "6px 8px",
                        textAlign: "center", width: "100%",
                      }}>
                        <div style={{ fontSize: 10, fontWeight: 600, color: "#E76F51" }}>{s.comp}</div>
                      </div>
                    </>
                  )}
                </div>
                {i < steps.length - 1 && (
                  <div style={{ display: "flex", alignItems: "center", padding: "14px 4px 0" }}>
                    <div style={{ width: 20, height: 2, background: "#2A9D8F" }} />
                    <div style={{ width: 0, height: 0, borderTop: "4px solid transparent", borderBottom: "4px solid transparent", borderLeft: "6px solid #2A9D8F" }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
        {[
          { wf: "checkout_saga_wf", desc: "Order → Reserve → Pay → Ship → Notify", steps: 5 },
          { wf: "fulfillment_saga_wf", desc: "Pick → Pack → Label → Ship → Track", steps: 5 },
          { wf: "return_saga_wf", desc: "Validate → Restock → Refund → Notify", steps: 4 },
        ].map((w, i) => (
          <Card key={i} accent="#2A9D8F">
            <div style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 700, color: "#2A9D8F" }}>{w.wf}</div>
            <div style={{ fontSize: 11, color: "#666", marginTop: 6 }}>{w.desc}</div>
            <div style={{ fontSize: 10, color: "#999", marginTop: 4 }}>{w.steps} steps + failureWorkflow compensation</div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function DataFlowSection() {
  return (
    <div>
      <SectionTitle>Data Flow & Communication Patterns</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {[
          { pattern: "REST + Valkey Cache", useCase: "Busca de catálogo", desc: "Read-heavy, TTL 60s. P95 < 100ms.", color: BORDEAUX },
          { pattern: "SSE (Server-Sent Events)", useCase: "Estoque real-time", desc: "Push unidirecional ao browser. Lag < 500ms.", color: GOLD },
          { pattern: "Debezium CDC (Outbox)", useCase: "Domain events", desc: "Atomicidade DB+Kafka via WAL. Zero dual-write.", color: "#E76F51" },
          { pattern: "Conductor Saga", useCase: "Checkout / Fulfillment", desc: "Multi-step com compensação automática. P95 < 2s.", color: "#2A9D8F" },
          { pattern: "gRPC Streaming", useCase: "Bulk import SKUs", desc: "Alta throughput binário. Importação massiva.", color: "#005EB8" },
          { pattern: "Kafka (via CDC)", useCase: "Sync → OpenSearch", desc: "Full table CDC replica automática para busca.", color: "#8B5CF6" },
          { pattern: "Valkey + Exchange API", useCase: "Multi-Currency Pricing", desc: "Taxas BRL/PYG/USD cached em Valkey. Preços pré-convertidos por SKU.", color: "#C4A35A" },
        ].map((p, i) => (
          <Card key={i} accent={p.color}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Badge color={p.color}>{p.pattern}</Badge>
              <span style={{ fontSize: 11, color: "#999" }}>{p.useCase}</span>
            </div>
            <div style={{ fontSize: 12, color: "#555", marginTop: 8 }}>{p.desc}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function I18nSection() {
  return (
    <div>
      <SectionTitle>Internationalization & Multi-Currency</SectionTitle>
      <div style={{ fontSize: 13, color: "#555", marginBottom: 20, lineHeight: 1.7 }}>
        A aplicação opera em <strong>3 mercados</strong> com idioma e moeda independentes — um usuário pode usar a interface em Português mas ver preços em Dólar.
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 20 }}>
        {[
          { flag: "🇧🇷", lang: "Português (BR)", locale: "pt-BR", currency: "BRL", symbol: "R$", example: "R$ 189,90", decimals: 2 },
          { flag: "🇵🇾", lang: "Español (PY)", locale: "es-PY", currency: "PYG", symbol: "₲", example: "₲ 283.402", decimals: 0 },
          { flag: "🇺🇸", lang: "English (US)", locale: "en-US", currency: "USD", symbol: "US$", example: "US$ 35.50", decimals: 2 },
        ].map((l, i) => (
          <Card key={i} accent={[BORDEAUX, "#2A9D8F", "#005EB8"][i]}>
            <div style={{ textAlign: "center", marginBottom: 10 }}>
              <span style={{ fontSize: 36 }}>{l.flag}</span>
            </div>
            <div style={{ textAlign: "center", fontWeight: 700, fontSize: 15, color: DARK }}>{l.lang}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 12, fontSize: 11 }}>
              <div style={{ padding: 6, background: PARCHMENT, borderRadius: 4 }}>
                <span style={{ fontWeight: 700, color: "#888" }}>Locale:</span> <Badge>{l.locale}</Badge>
              </div>
              <div style={{ padding: 6, background: PARCHMENT, borderRadius: 4 }}>
                <span style={{ fontWeight: 700, color: "#888" }}>Moeda:</span> <Badge color={[BORDEAUX, "#2A9D8F", "#005EB8"][i]}>{l.currency}</Badge>
              </div>
              <div style={{ padding: 6, background: PARCHMENT, borderRadius: 4 }}>
                <span style={{ fontWeight: 700, color: "#888" }}>Symbol:</span> {l.symbol}
              </div>
              <div style={{ padding: 6, background: PARCHMENT, borderRadius: 4 }}>
                <span style={{ fontWeight: 700, color: "#888" }}>Decimals:</span> {l.decimals}
              </div>
            </div>
            <div style={{ textAlign: "center", marginTop: 10, fontSize: 18, fontWeight: 700, color: DARK, fontFamily: "monospace" }}>
              {l.example}
            </div>
          </Card>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Card title="Frontend — Transloco + PrimeNG Locale" accent={BORDEAUX}>
          <div style={{ fontSize: 12, color: "#555", lineHeight: 1.8 }}>
            <FlowStep num="1" title="@jsverse/transloco" desc="Runtime language switching sem reload. Lazy loading de traduções por feature slice." />
            <FlowStep num="2" title="transloco-locale" desc="Pipes para data, número e moeda formatados automaticamente por locale." />
            <FlowStep num="3" title="PrimeNGConfig.setTranslation()" desc="Componentes PrimeNG (calendar, paginator) traduzidos dinamicamente." />
            <FlowStep num="4" title="CurrencyService (Signal)" desc="Seleção de moeda via Signal reativo — todos os componentes reagem." />
          </div>
        </Card>

        <Card title="Backend — Money Value Object + Exchange" accent="#2A9D8F">
          <div style={{ fontSize: 12, color: "#555", lineHeight: 1.8 }}>
            <FlowStep num="1" title="Money(amount, Currency)" desc="Value Object imutável no domain. Suporta BRL, PYG (0 decimais), USD." />
            <FlowStep num="2" title="ExchangeRateProvider (Port)" desc="Interface no domain. Adapter busca taxas de API externa." />
            <FlowStep num="3" title="ConvertPrice (Use Case)" desc="Converte preços entre moedas usando taxa vigente." />
            <FlowStep num="4" title="WinePriceResponse" desc="API retorna preço nas 3 moedas pré-calculadas. Cache Valkey por SKU." />
          </div>
        </Card>
      </div>

      <Card title="Translation File Structure">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 12, color: DARK, marginBottom: 8 }}>Arquivos por Feature Slice</div>
            <div style={{ fontFamily: "monospace", fontSize: 11, lineHeight: 1.8, color: "#555" }}>
              <div>src/assets/i18n/<strong>pt-BR.json</strong></div>
              <div>src/assets/i18n/<strong>es-PY.json</strong></div>
              <div>src/assets/i18n/<strong>en-US.json</strong></div>
              <div>src/assets/i18n/catalog/<strong>pt-BR.json</strong></div>
              <div>src/assets/i18n/catalog/<strong>es-PY.json</strong></div>
              <div>src/assets/i18n/catalog/<strong>en-US.json</strong></div>
              <div style={{ color: "#999" }}>... (order/, shared/, etc.)</div>
            </div>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 12, color: DARK, marginBottom: 8 }}>Key Pattern</div>
            <div style={{ fontSize: 11, lineHeight: 1.8, color: "#555" }}>
              <div><Badge>common.search</Badge> → global keys</div>
              <div><Badge>catalog.wine.vintage</Badge> → feature scope</div>
              <div><Badge>catalog.filters.region</Badge> → nested feature</div>
              <div style={{ marginTop: 8, fontSize: 10, color: "#999" }}>
                Interpolation: <code style={{ background: "#f5f0ea", padding: "1px 4px", borderRadius: 3 }}>{"{{ count }}"} vinhos encontrados</code>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <SectionTitle sub>Moeda Contábil (Functional Currency) — BRL</SectionTitle>
      <div style={{ fontSize: 13, color: "#555", marginBottom: 16, lineHeight: 1.7 }}>
        <strong>BRL é a moeda contábil.</strong> Toda transação é registrada em <em>dual-amount</em>: moeda original do cliente + equivalente em BRL
        com a taxa do momento. Isso garante compliance fiscal, emissão de NF-e em BRL, e consolidação contábil unificada.
      </div>

      <Card title="Dual-Amount Recording — Fluxo Contábil" accent={BORDEAUX}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <FlowStep num="1" title="Cliente compra em PYG (₲ 283.402)" desc="Moeda escolhida pelo cliente paraguaio na interface." />
          <FlowStep num="2" title="ExchangeRateProvider busca spot rate" desc="PYG → BRL = 0.000670 (taxa congelada no instante da transação)." />
          <FlowStep num="3" title="TransactionRecord com dual-amount" desc="transaction_amount: ₲ 283.402 (PYG) | accounting_amount: R$ 189,88 (BRL)." />
          <FlowStep num="4" title="NF-e emitida em R$ 189,88" desc="Nota Fiscal sempre em BRL — exigência da Receita Federal (IN RFB 1.585)." />
          <FlowStep num="5" title="Relatório fiscal por período" desc="Consolidação mensal em BRL com breakdown por moeda de origem e resultado cambial." />
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Card title="TransactionRecord Schema" accent="#336791">
          <div style={{ fontSize: 11, fontFamily: "monospace", lineHeight: 1.9, color: "#555" }}>
            <div><span style={{color: BORDEAUX}}>transaction_amount</span> DECIMAL — valor original</div>
            <div><span style={{color: BORDEAUX}}>transaction_currency</span> VARCHAR — BRL/PYG/USD</div>
            <div style={{ borderTop: "1px dashed #ddd", margin: "6px 0" }} />
            <div><span style={{color: "#2A9D8F", fontWeight: 700}}>accounting_amount</span> DECIMAL — SEMPRE BRL</div>
            <div><span style={{color: "#2A9D8F", fontWeight: 700}}>accounting_currency</span> CHECK = 'BRL'</div>
            <div style={{ borderTop: "1px dashed #ddd", margin: "6px 0" }} />
            <div><span style={{color: "#888"}}>exchange_rate</span> DECIMAL — taxa congelada</div>
            <div><span style={{color: "#888"}}>fiscal_period</span> VARCHAR — "2026-03"</div>
          </div>
        </Card>

        <Card title="Resultado Cambial" accent="#E76F51">
          <div style={{ fontSize: 12, color: "#555", lineHeight: 1.8 }}>
            <div style={{ marginBottom: 8 }}>Quando a taxa de câmbio varia entre a <strong>data da venda</strong> e a <strong>data do recebimento</strong>:</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
              <Badge color="#2A9D8F">EXCHANGE_GAIN</Badge>
              <span style={{ fontSize: 11, color: "#666" }}>Taxa subiu → recebeu mais BRL que o registrado</span>
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <Badge color="#E76F51">EXCHANGE_LOSS</Badge>
              <span style={{ fontSize: 11, color: "#666" }}>Taxa caiu → recebeu menos BRL que o registrado</span>
            </div>
            <div style={{ fontSize: 11, color: "#999", fontStyle: "italic" }}>
              Ganhos/perdas cambiais são registrados como receita/despesa financeira no período do recebimento.
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function ObservabilitySection() {
  return (
    <div>
      <SectionTitle>Observability — Three Pillars</SectionTitle>
      <Card title="OTel Pipeline: App → Collector → Grafana Stack">
        <div style={{ display: "flex", justifyContent: "center", gap: 20, flexWrap: "wrap", padding: "10px 0" }}>
          <div style={{ textAlign: "center" }}>
            <ServiceBox name="Quarkus App" desc="OTel SDK + MDC" tech="traces + metrics + logs" color={BORDEAUX} />
          </div>
          <Arrow direction="right" label="OTLP gRPC" color={BORDEAUX} />
          <div style={{ textAlign: "center" }}>
            <ServiceBox name="OTel Collector" desc="Receive → Process → Export" tech=":4317 gRPC" color="#4A5568" />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-start" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Arrow direction="right" label="traces" color="#E76F51" />
              <ServiceBox name="Tempo" tech="trace storage" color="#E76F51" small />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Arrow direction="right" label="logs" color="#2A9D8F" />
              <ServiceBox name="Loki" tech="log aggregation" color="#2A9D8F" small />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Arrow direction="right" label="metrics" color="#8B5CF6" />
              <ServiceBox name="Prometheus" tech="TSDB" color="#8B5CF6" small />
            </div>
          </div>
          <Arrow direction="right" label="query" />
          <div style={{ textAlign: "center" }}>
            <ServiceBox name="Grafana" desc="Dashboards + Alerts" tech=":3000" color={GOLD} />
          </div>
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
        <Card title="Traces" accent="#E76F51">
          <div style={{ fontSize: 12, color: "#555", lineHeight: 1.7 }}>
            Spans automáticos via Quarkus OTel. Spans customizados em cada Use Case com business attributes (<Badge color="#E76F51">sku</Badge>, <Badge color="#E76F51">orderId</Badge>).
          </div>
        </Card>
        <Card title="Logs (MDC)" accent="#2A9D8F">
          <div style={{ fontSize: 12, color: "#555", lineHeight: 1.7 }}>
            Structured JSON via <Badge color="#2A9D8F">quarkus-logging-json</Badge>. MDC propaga <Badge color="#2A9D8F">traceId</Badge>, <Badge color="#2A9D8F">spanId</Badge>, <Badge color="#2A9D8F">requestId</Badge> em contextos reativos.
          </div>
        </Card>
        <Card title="Metrics" accent="#8B5CF6">
          <div style={{ fontSize: 12, color: "#555", lineHeight: 1.7 }}>
            Micrometer + OTel. HTTP request duration, JVM stats, custom business metrics. Scrape via Prometheus.
          </div>
        </Card>
      </div>
    </div>
  );
}

function InfraSection() {
  return (
    <div>
      <SectionTitle>Infrastructure & Deployment</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Card title="CI/CD Pipeline (GitHub Actions)" accent={BORDEAUX}>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <FlowStep num="1" title="Lint" desc="Ktlint (formatting) + Detekt (static analysis) → SARIF upload" />
            <FlowStep num="2" title="Test" desc="Kotest unit + Integration (Testcontainers) + ArchUnit + Kover ≥ 80%" />
            <FlowStep num="3" title="Build" desc="Quarkus native image → Docker → push GHCR" />
            <FlowStep num="4" title="K6 Smoke" desc="Smoke tests validam endpoints críticos" />
            <FlowStep num="5" title="Deploy Staging" desc="Terraform plan/apply → K8s rolling update → K6 smoke" />
            <FlowStep num="6" title="Deploy Production" desc="Manual approval → Terraform apply → K8s rolling update" />
          </div>
        </Card>

        <Card title="Terraform IaC — AWS Modules (us-east-1 Virginia)" accent="#005EB8">
          <div style={{ fontSize: 12, color: "#555", lineHeight: 1.8 }}>
            {[
              { mod: "modules/vpc", desc: "VPC 3-AZ, public/private subnets, NAT GW" },
              { mod: "modules/eks", desc: "Amazon EKS, Karpenter, IRSA, ADOT addon" },
              { mod: "modules/rds-postgres", desc: "RDS PostgreSQL 16 Multi-AZ (7 dbs)" },
              { mod: "modules/elasticache-valkey", desc: "ElastiCache for Valkey, cluster mode" },
              { mod: "modules/msk", desc: "Amazon MSK (Kafka KRaft), MSK Connect" },
              { mod: "modules/opensearch", desc: "Amazon OpenSearch Service" },
              { mod: "modules/cloudfront-spa", desc: "CloudFront + S3 (Angular SPA)" },
              { mod: "modules/observability", desc: "AMP + AMG + ADOT + CloudWatch" },
              { mod: "modules/secrets", desc: "Secrets Manager + KMS (CMK)" },
              { mod: "modules/cognito", desc: "Cognito User Pool (USER/ADMIN roles)" },
              { mod: "modules/microservice", desc: "K8s Deployment + Service + HPA" },
            ].map((m, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <Badge color="#005EB8">{m.mod}</Badge>
                <span style={{ fontSize: 11, color: "#888" }}>{m.desc}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, padding: 8, background: "#f5f0ea", borderRadius: 6, fontSize: 11, color: "#666" }}>
            Environments: <Badge color="#2A9D8F">staging</Badge> <Badge color="#E76F51">production</Badge> — AWS us-east-1 (Virginia), S3 + DynamoDB state, OIDC → GitHub Actions
          </div>
        </Card>
      </div>

      <Card title="Amazon EKS — Microservice Deployment Template">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          {[
            { k: "Cluster", v: "EKS 1.31, Karpenter autoscaling" },
            { k: "Registry", v: "Amazon ECR (private, per service)" },
            { k: "Strategy", v: "RollingUpdate (25% surge, 0 unavail)" },
            { k: "Liveness", v: "GET /q/health/live (Quarkus)" },
            { k: "Readiness", v: "GET /q/health/ready" },
            { k: "HPA", v: "CPU 70% → min 2, max 8 replicas" },
            { k: "OTel", v: "ADOT DaemonSet + inject annotations" },
            { k: "IAM", v: "IRSA (pod-level least privilege)" },
            { k: "Secrets", v: "AWS Secrets Manager (not K8s Secrets)" },
          ].map((r, i) => (
            <div key={i} style={{ fontSize: 11, padding: 8, background: PARCHMENT, borderRadius: 4 }}>
              <span style={{ fontWeight: 700, color: DARK }}>{r.k}: </span>
              <span style={{ color: "#666" }}>{r.v}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function SLOsSection() {
  const slos = [
    { metric: "REST P95 Latency", target: "< 100ms", monitor: "OTel Histogram" },
    { metric: "REST P99 Latency", target: "< 250ms", monitor: "OTel Histogram" },
    { metric: "Catalog Throughput", target: "> 500 req/s", monitor: "Prometheus" },
    { metric: "SSE Delivery Lag", target: "< 500ms", monitor: "Custom OTel" },
    { metric: "Kafka Consumer Lag", target: "< 1000 msgs", monitor: "Kafka Metrics" },
    { metric: "Saga P95 Duration", target: "< 2s", monitor: "Conductor + OTel" },
    { metric: "CDC Outbox Lag", target: "< 1s", monitor: "Debezium JMX" },
    { metric: "FCP (Frontend)", target: "< 1.2s", monitor: "Web Vitals" },
    { metric: "TTI (Frontend)", target: "< 2.5s", monitor: "Web Vitals" },
    { metric: "Cache Hit Ratio", target: "> 85%", monitor: "Valkey Metrics" },
    { metric: "Coverage (Kover)", target: "≥ 80%", monitor: "CI Pipeline" },
    { metric: "Checkout Failure Rate", target: "< 5%", monitor: "K6 + OTel" },
    { metric: "Exchange Rate Freshness", target: "< 15 min", monitor: "Valkey TTL + OTel" },
    { metric: "i18n Bundle Load", target: "< 50ms", monitor: "Transloco Lazy Load" },
  ];

  return (
    <div>
      <SectionTitle>SLOs & Performance Targets</SectionTitle>
      <div style={{ background: "white", borderRadius: 10, overflow: "hidden", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 1fr", background: DARK, padding: "10px 16px" }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: GOLD, textTransform: "uppercase" }}>Metric</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: GOLD, textTransform: "uppercase", textAlign: "center" }}>Target</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: GOLD, textTransform: "uppercase" }}>Monitoring</span>
        </div>
        {slos.map((s, i) => (
          <div key={i} style={{
            display: "grid", gridTemplateColumns: "1fr 120px 1fr", padding: "10px 16px",
            background: i % 2 === 0 ? PARCHMENT : "white", borderBottom: "1px solid #eee",
          }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: DARK }}>{s.metric}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: BORDEAUX, textAlign: "center", fontFamily: "monospace" }}>{s.target}</span>
            <span style={{ fontSize: 12, color: "#888" }}>{s.monitor}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MAIN ────────────────────────────────────────────────

export default function SystemDesign() {
  const [active, setActive] = useState(0);
  const sectionComponents = [
    OverviewSection, MicroservicesSection, HexagonalSection, CDCSection,
    SagaSection, DataFlowSection, I18nSection, ObservabilitySection, InfraSection, SLOsSection,
  ];
  const ActiveComponent = sectionComponents[active];

  return (
    <div style={{ fontFamily: "'Source Sans 3', 'Segoe UI', sans-serif", background: SURFACE, minHeight: "100vh" }}>
      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${DARK} 0%, ${BORDEAUX} 100%)`,
        padding: "28px 32px 20px",
        color: "white",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 6 }}>
          <span style={{ fontSize: 32 }}>🍷</span>
          <div>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em" }}>
              Vinheria Digital
            </h1>
            <div style={{ fontSize: 13, opacity: 0.8, marginTop: 2 }}>System Design Document — v4.1</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div style={{
        background: "white", borderBottom: "1px solid #e5e2de",
        padding: "0 24px", display: "flex", gap: 0, overflowX: "auto",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      }}>
        {sections.map((s, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            style={{
              padding: "12px 16px",
              background: "none",
              border: "none",
              borderBottom: active === i ? `3px solid ${BORDEAUX}` : "3px solid transparent",
              color: active === i ? BORDEAUX : "#888",
              fontWeight: active === i ? 700 : 500,
              fontSize: 13,
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all 0.2s",
              fontFamily: "inherit",
            }}
          >{s}</button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: "28px 32px", maxWidth: 1100, margin: "0 auto" }}>
        <ActiveComponent />
      </div>

      {/* Footer */}
      <div style={{ textAlign: "center", padding: "20px 0 32px", fontSize: 11, color: "#999" }}>
        Vinheria Digital — System Design v4.1 — Março 2026
      </div>
    </div>
  );
}
