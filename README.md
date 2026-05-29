# Arch Back Node Layer (arch-back-node-layer)

Este proyecto implementa un arquetipo backend en Node.js con **Arquitectura Hexagonal (Clean Architecture)** completa, diseñado para microservicios escalables y mantenibles. Incluye soporte nativo para AWS Lambda y despliegue serverless.

## 🏗️ Arquitectura

### Estructura del Proyecto
```
src/
├── adapter/
│   ├── in/
│   │   └── lambda/                         # Handler de entrada AWS Lambda
│   └── out/
│       ├── broker/                         # Adaptador SQS
│       ├── environment/                    # Variables de entorno
│       ├── persistence/
│       │   ├── DynamoQueryConfiguration.ts # Configuración del proxy
│       │   └── user/                       # Persistencia de usuarios
│       │       ├── DynamoUserRepository.ts
│       │       └── InMemoryUserRepository.ts
│       ├── secretmanager/                  # Adaptador Secrets Manager
│       └── web/                            # Cliente HTTP
├── application/
│   ├── domain/                             # Modelos de dominio del arquetipo
│   ├── ports/
│   │   ├── in/                             # Casos de uso
│   │   └── out/                            # Puertos hacia adaptadores
│   └── services/                           # Implementación de casos de uso
├── infrastructure/
│   └── config/DependencyInjection.ts       # Composición de dependencias
├── index.ts                                # Entrada Lambda
└── server.ts                               # Servidor HTTP Fastify
```

### Capas de la Arquitectura
- **Aplicación/Dominio**: modelos puros en `src/application/domain` y casos de uso en `src/application/services`.
- **Puertos**: contratos de entrada y salida en `src/application/ports`.
- **Adaptadores**: implementaciones concretas en `src/adapter/in` y `src/adapter/out`.
- **Infraestructura**: composición y wiring en `src/infrastructure/config/DependencyInjection.ts`.

## 📋 Requisitos

- Node.js 18+ (recomendado 18.x o 20.x)
- npm 9+
- AWS CLI configurado (para despliegue en Lambda)

## 🚀 Instalación y Configuración

### 1. Instalar dependencias
```bash
npm install
```

### 2. Compilar TypeScript
```bash
npm run build
```

### 3. Ejecutar tests
```bash
npm test
```

## 🖥️ Ejecución Local

### Modo Desarrollo
```bash
npm run dev
```

### Modo Producción
```bash
npm start
```

El servidor se iniciará en `http://localhost:3100` (configurable con `PORT`).

## 🌐 API Endpoints

### Health Check
```http
GET /health
```
**Respuesta:**
```json
{ "status": "ok" }
```

### Crear Usuario
```http
POST /users
Content-Type: application/json

{
  "name": "Juan Pérez",
  "email": "juan@example.com"
}
```
**Respuesta:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Ejemplos con curl
```bash
# Health check
curl http://localhost:3100/health

# Crear usuario
curl -X POST http://localhost:3100/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Juan Pérez","email":"juan@example.com"}'
```

## ☁️ Despliegue en AWS Lambda

### Configuración Serverless
El proyecto incluye configuración completa para AWS Lambda usando Serverless Framework:

```bash
# Instalar Serverless Framework globalmente
npm install -g serverless

# Desplegar a AWS
serverless deploy
```

### Variables de Entorno
```bash
# Para desarrollo local
export NODE_ENV=development

# Para producción (Lambda)
export DYNAMO_TABLE=proxy-config-table
export USERS_TABLE=users-table
export AWS_REGION=us-east-1
```

`DYNAMO_TABLE` se mantiene para la configuración del proxy. `USERS_TABLE` se usa únicamente para persistencia de usuarios; si no está definida, el servidor Fastify usa el repositorio en memoria.

## 🧪 Testing

### Ejecutar todos los tests
```bash
npm test
```

### Tests incluidos
- ✅ **Tests unitarios** - Servicios y repositorios
- ✅ **Tests de integración** - API HTTP completa
- ✅ **Tests de adaptadores** - Lambda handlers y clientes HTTP
- ✅ **Mocks de AWS** - DynamoDB, SQS, Secrets Manager

### Cobertura de tests
```bash
npm run test:coverage
```

## 📦 Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `npm run build` | Compila TypeScript a `dist/` |
| `npm start` | Ejecuta servidor en modo producción |
| `npm run dev` | Ejecuta servidor en modo desarrollo con hot-reload |
| `npm test` | Ejecuta todos los tests |
| `npm run test:watch` | Ejecuta tests en modo watch |
| `npm run lint` | Ejecuta linter |
| `npm run format` | Formatea código con Prettier |

## 🔧 Configuración

### Persistencia de usuarios
El arquetipo soporta dos adaptadores de persistencia detrás de `UserRepositoryPort`:

#### Desarrollo/Testing (InMemory)
```typescript
// Se usa automáticamente cuando USERS_TABLE no está configurado
const repo = new InMemoryUserRepository();
```

#### Producción (DynamoDB)
```typescript
// Se usa automáticamente cuando USERS_TABLE está configurado
const repo = DynamoUserRepository.fromEnv();
```

### Cliente HTTP
Configuración flexible para llamadas a APIs externas:
```typescript
const config: ConfigRequest = {
  baseURL: 'https://api.example.com',
  timeout: 30000,
  params: { version: 'v1' }
};
```

## 🏛️ Patrones Implementados

- ✅ **Hexagonal Architecture** - Separación clara entre dominio, aplicación e infraestructura
- ✅ **Dependency Injection** - Inversión de dependencias entre capas
- ✅ **Repository Pattern** - Abstracción de la capa de persistencia
- ✅ **Use Case Pattern** - Casos de uso bien definidos en la capa de aplicación
- ✅ **Adapter Pattern** - Adaptadores para servicios externos (AWS, HTTP)
- ✅ **Port Pattern** - Interfaces que definen contratos entre capas

## 🛠️ Tecnologías Utilizadas

| Tecnología | Propósito |
|------------|-----------|
| **Node.js + TypeScript** | Runtime y lenguaje |
| **Fastify** | Framework web rápido y eficiente |
| **AWS SDK v3** | Integración con servicios AWS |
| **Vitest** | Framework de testing moderno |
| **Axios** | Cliente HTTP para APIs externas |
| **UUID** | Generación de identificadores únicos |
| **Serverless Framework** | Despliegue en AWS Lambda |

## 🔄 Flujo de Datos

```
POST /users → Fastify server → CreateUserUseCase → UserRepositoryPort → InMemory/Dynamo adapter

AWS proxy request → ProxyLambdaHandler → ExecuteRequestUseCase → QueryConfigurationPort → HTTP/SQS adapters
```

## 📁 Archivos Clave

| Archivo | Descripción |
|---------|-------------|
| `src/server.ts` | Servidor Fastify y configuración de rutas |
| `src/adapter/in/lambda/ProxyLambdaHandler.ts` | Handler para AWS Lambda |
| `src/application/services/ExecuteRequestService.ts` | Caso de uso principal |
| `src/application/services/UserService.ts` | Caso de uso de creación de usuarios |
| `src/application/ports/in/user/CreateUserUseCase.ts` | Puerto de entrada de usuarios |
| `src/application/ports/out/persistence/UserRepositoryPort.ts` | Puerto de persistencia de usuarios |
| `src/adapter/out/persistence/user/DynamoUserRepository.ts` | Persistencia de usuarios en DynamoDB |
| `src/adapter/out/web/HttpClientExecutor.ts` | Cliente HTTP configurable |
| `serverless.yml` | Configuración de despliegue AWS |

## 🚨 Troubleshooting

### Problemas Comunes

**Error de compilación TypeScript:**
```bash
npm run build
```

**Tests fallando:**
```bash
# Limpiar cache y reinstalar
rm -rf node_modules package-lock.json
npm install
npm test
```

**Error de conexión DynamoDB:**
```bash
# Verificar variables de entorno
echo $DYNAMO_TABLE
echo $USERS_TABLE
echo $AWS_REGION

# Verificar credenciales AWS
aws sts get-caller-identity
```

**Puerto ocupado:**
```bash
# Cambiar puerto
## 🎯 Próximos Pasos

### Extensiones Recomendadas
- **Autenticación JWT** - Implementar middleware de autenticación
- **Validación avanzada** - Usar Joi o Zod para validación de schemas
- **Logging estructurado** - Implementar Winston o Pino
- **Métricas y monitoreo** - Integrar CloudWatch o Prometheus
- **Cache** - Añadir Redis para cache distribuido
- **Rate limiting** - Implementar limitación de requests

### Despliegue Avanzado
- **Docker** - Containerización para desarrollo local
- **Kubernetes** - Manifests para despliegue en K8s
- **CI/CD** - Pipeline con GitHub Actions o GitLab CI
- **Infrastructure as Code** - Terraform o CDK para AWS

### Mejoras de Arquitectura
- **Event Sourcing** - Para auditoría completa
- **CQRS** - Separación de comandos y queries
- **Saga Pattern** - Para transacciones distribuidas
- **Circuit Breaker** - Para resiliencia en llamadas externas

## 📚 Recursos Adicionales

- [Hexagonal Architecture](https://alistair.cockburn.us/hexagonal-architecture/)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [AWS Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)
- [Fastify Documentation](https://www.fastify.io/docs/latest/)
- [Vitest Testing Framework](https://vitest.dev/)

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Añadir nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crea un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

---

**¡Feliz coding! 🚀**

> Este arquetipo te proporciona una base sólida para desarrollar microservicios Node.js con arquitectura limpia, listos para producción y escalables.
