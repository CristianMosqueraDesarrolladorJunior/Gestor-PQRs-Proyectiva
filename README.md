# Gestor-PQRs-Proyectiva

Gestor de PQRs para Proyectiva para atender solicitudes provenientes de la landing page.

---

## Arquitectura DDD para Google Apps Script

### Principios Aplicados

- **DDD con contextos delimitados** (Bounded Contexts)
- **Arquitectura simplificada** para despliegues manuales de GAS
- **Capas esenciales**: Dominio → Aplicación → Infraestructura → Interfaz

---

## Estructura de Directorios

```
Gestor-PQRs-Proyectiva/
│
├── src/
│   │
│   ├── domain/                    # DOMINIO - Entidades y lógica de negocio
│   │   │
│   │   ├── pqr/                   # Contexto: Gestión de PQRs
│   │   │   ├── PQR.js             # Entidad PQR
│   │   │   ├── PQRRepository.js   # Repositorio
│   │   │   └── PQRService.js      # Servicios
│   │   │
│   │   ├── leads/                 # Contexto: Gestión de Leads
│   │   │   ├── Lead.js            # Entidad Lead
│   │   │   ├── LeadRepository.js  # Repositorio
│   │   │   └── LeadService.js     # Servicios
│   │   │
│   │   ├── users/                 # Contexto: Usuarios y Roles
│   │   │   ├── User.js            # Entidad Usuario
│   │   │   ├── Role.js            # Definición de roles
│   │   │   ├── UserRepository.js  # Repositorio
│   │   │   └── UserService.js     # Servicios
│   │   │
│   │   ├── reports/               # Contexto: Reportes
│   │   │   ├── Report.js          # Entidad Reporte
│   │   │   └── ReportService.js   # Servicios
│   │   │
│   │   └── shared/                # Elementos compartidos del dominio
│   │       ├── BaseEntity.js      # Entidad base
│   │       └── ValueObjects.js    # Objetos de valor
│   │
│   ├── application/               # APLICACIÓN - Casos de uso
│   │   │
│   │   ├── pqr/                   # Casos de uso PQR
│   │   │   ├── CreatePQR.js
│   │   │   ├── UpdatePQR.js
│   │   │   ├── AssignPQR.js
│   │   │   └── ClosePQR.js
│   │   │
│   │   ├── leads/                 # Casos de uso Leads
│   │   │   ├── CreateLead.js
│   │   │   ├── UpdateLead.js
│   │   │   └── AssignLead.js
│   │   │
│   │   └── auth/                  # Casos de uso autenticación
│   │       ├── Authenticate.js
│   │       └── Authorize.js
│   │
│   ├── infrastructure/            # INFRAESTRUCTURA - Integraciones
│   │   │
│   │   ├── spreadsheet/           # Google Sheets
│   │   │   ├── SpreadsheetAdapter.js  # Adapter principal
│   │   │   ├── SheetReader.js     # Lectura
│   │   │   └── SheetWriter.js     # Escritura
│   │   │
│   │   ├── gmail/                 # Integración Gmail
│   │   │   ├── GmailAdapter.js    # Envío de emails
│   │   │   └── EmailTemplates.js  # Plantillas
│   │   │
│   │   ├── drive/                 # Google Drive
│   │   │   └── DriveAdapter.js    # Gestión documental
│   │   │
│   │   └── config/                # Configuración
│   │       ├── AppConfig.js       # Configuración app
│   │       └── SheetConfig.js     # IDs de hojas
│   │
│   ├── interface/                 # INTERFAZ - Frontend
│   │   │
│   │   ├── html/                  # Plantillas HTML
│   │   │   ├── index.html         # Entry point
│   │   │   ├── components/        # Componentes
│   │   │   └── styles/            # Estilos inline
│   │   │
│   │   └── js/                    # Frontend JS
│   │       ├── App.js             # Inicialización
│   │       ├── ApiClient.js       # Cliente GAS
│   │       └── Components.js      # UI Components
│   │
│   └── entry/                     # Puntos de entrada GAS
│       ├── doGet.js               # Servir aplicación
│       ├── doPost.js              # Webhooks
│       └── triggers.js             # Triggers
│
├── tests/                         # Pruebas (opcional)
│
├── appsscript.json                # Config GAS
├── .clasp.json                    # Config CLASP
└── README.md
```

---

## Capas de Arquitectura

| Capa | Descripción |
|------|-------------|
| **Domain** | Entidades, repositorios y servicios de dominio. Contiene la lógica de negocio pura. |
| **Application** | Casos de uso que orquestan el dominio. Coordinan las operaciones de negocio. |
| **Infrastructure** | Adaptadores para Google Sheets, Gmail, Drive. Implementa las integraciones externas. |
| **Interface** | Frontend HTML/CSS/JS. Punto de contacto con el usuario. |
| **Entry** | Puntos de entrada de GAS (doGet, doPost, triggers). |

---

## Bounded Contexts (Dominios)

1. **Gestión de PQRs**: Administración de Peticiones, Quejas y Reclamos
2. **Gestión de Leads**: Administración de prospectos y oportunidades
3. **Usuarios y Roles**: Control de acceso y autenticación
4. **Reportes**: Generación de reportes y métricas

---

## Beneficios

- **DDD**: Código organizado por dominio de negocio
- **Bounded Contexts**: Aislamiento de cambios, menor riesgo en actualizaciones
- **Capas mínimas**: Ideal para GAS, sin sobre-ingeniería
- **Infraestructura separada**: Fácil testing y reemplazo de integraciones
- **Despliegues manuales**: Estructura simple que minimiza errores

---

## Tecnologías

- Google Apps Script (GAS)
- Google Sheets API
- Google Drive API
- Google Mail API
- HTML/CSS/JavaScript (Frontend)
