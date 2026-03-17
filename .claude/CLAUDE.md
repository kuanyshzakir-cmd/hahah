# B2B Manager (Dariger) — Project Rules

## Project Overview

B2B Manager — инструмент холодного аутрича для бренда **Dariger** (медицинская одежда, Казахстан).
Парсинг 2GIS → WhatsApp рассылки → AI-бот (OpenAI GPT-4.1) → Дашборд.

## Architecture

- **Next.js 15** (Vercel) — только UI/дашборд
- **n8n Cloud** (zakirkuanysh.app.n8n.cloud) — вся автоматизация (WA webhook, AI, follow-up, TG)
- **Supabase** (существующий проект, таблицы с префиксом `b2b_`)
- **2GIS Catalog API** — парсинг контактов
- **OpenAI GPT-4.1** — AI-бот (рус + каз)
- **Meta Cloud API** — WhatsApp (существующий Dariger Bot app)
- **Telegram Bot API** — уведомления о горячих лидах

## Key Constraints

- Dariger = B2B Manager (один бизнес, один WhatsApp номер)
- Supabase проект общий с barbershop (Project-1) — все таблицы с префиксом `b2b_`
- 6 городов КЗ: Астана, Алматы, Караганда, Атырау, Актобе, Шымкент
- До 100 контактов/день, отправка только 9:00-18:00 Asia/Almaty, пн-пт
- Follow-up: 2 касания (день 3 и 7)
- Дашборд только десктоп (не мобильный)
- Пользователь НЕ разработчик — код должен быть простым и чистым

## Tech Stack

| Layer | Tech |
|-------|------|
| Dashboard | Next.js 15, TypeScript, App Router |
| UI | Tailwind CSS, shadcn/ui |
| Automation | n8n Cloud |
| Database | Supabase (PostgreSQL) |
| 2GIS | 2GIS Catalog API (catalog.api.2gis.ru/3.0/items) |
| WhatsApp | Meta Cloud API |
| AI | OpenAI API (GPT-4.1) |
| Notifications | Telegram Bot API |
| Deploy | Vercel + Supabase Cloud + n8n Cloud |

## Code Conventions

- TypeScript strict mode
- Supabase JS SDK (без ORM) для доступа к БД
- Server Actions для форм и мутаций
- API routes только для: парсинг 2GIS, экспорт CSV
- Все таблицы БД с префиксом `b2b_`
- Timezone: Asia/Almaty (UTC+5) для всех дат
- Телефоны в формате `+7XXXXXXXXXX`
- Языки UI: русский

## Project Structure

```
src/
├── app/           # Pages (App Router)
├── lib/           # Business logic (supabase/, twogis/, utils/)
├── components/    # React components (ui/, layout/, contacts/, chat/, etc.)
├── actions/       # Server Actions (contacts.ts, parser.ts, campaigns.ts, etc.)
├── hooks/         # Custom React hooks
└── middleware.ts  # Auth guard

supabase/migrations/  # SQL migrations
n8n/                   # Exported n8n workflows (backup)
```

## Database Tables (prefix b2b_)

- `b2b_contacts` — спарсенные контакты из 2GIS
- `b2b_products` — каталог товаров (халаты, костюмы, шапочки)
- `b2b_parsing_tasks` — задачи парсинга
- `b2b_campaigns` — кампании рассылок
- `b2b_campaign_contacts` — связь кампания ↔ контакт
- `b2b_messages` — все сообщения (in/out)
- `b2b_conversations` — диалоги с AI контекстом
- `b2b_daily_stats` — ежедневная статистика
- `b2b_settings` — настройки (key-value)

## n8n Workflows

- **Workflow 1**: WhatsApp Webhook Handler (входящие → AI → ответ)
- **Workflow 2**: Campaign Sender (рассылка шаблонов с rate limiting)
- **Workflow 3**: Follow-up Engine (автоматические напоминания день 3 и 7)
- **Workflow 4**: Status Webhook (delivered/read/failed обновления)

## Related Projects (переиспользуемый код)

- `Project-1/barbershop/supabase/` — Supabase schema/RLS паттерны
- `Dariger/workflows/` — WhatsApp webhook handler для n8n
- `Wifey/` — Telegram bot handler для n8n
- `Dariger/create_openai.js` — OpenAI credential setup

---

# Available Skills & MCP Tools

## n8n Skills (use via /skill command or Skill tool)

При работе с n8n workflows ВСЕГДА используй релевантные skills:

### n8n-mcp-skills:n8n-workflow-patterns
Архитектурные паттерны для workflows. Используй при проектировании новых workflows.
- Webhook processing patterns
- HTTP API integration
- Database operations
- AI agent workflows
- Scheduled tasks

### n8n-mcp-skills:n8n-node-configuration
Конфигурация нод. Используй при настройке конкретных нод (HTTP Request, OpenAI, Supabase, etc.).
- Property dependencies
- Required fields by operation
- get_node detail levels

### n8n-mcp-skills:n8n-mcp-tools-expert
Гайд по всем n8n MCP инструментам. Используй при создании/редактировании workflows через API.
- search_nodes, get_node, validate_node
- n8n_create_workflow, n8n_update_partial_workflow
- n8n_validate_workflow, n8n_deploy_template
- Smart parameters (branch, case)

### n8n-mcp-skills:n8n-validation-expert
Интерпретация ошибок валидации. Используй при отладке workflow ошибок.
- Validation profiles (minimal, runtime, ai-friendly, strict)
- Error types and fixes
- False positive handling

### n8n-mcp-skills:n8n-expression-syntax
Синтаксис выражений n8n. Используй при написании expressions в полях нод.
- {{ }} syntax
- $json, $node, $input variables
- Common expression errors

### n8n-mcp-skills:n8n-code-javascript
JavaScript в Code нодах n8n. Используй при написании кастомной логики.
- $input, $json, $node syntax
- HTTP requests via $helpers
- DateTime handling

### n8n-mcp-skills:n8n-code-python
Python в Code нодах n8n. Используй при написании Python логики.
- _input, _json, _node syntax
- Standard library usage
- Python limitations in n8n

## n8n MCP Server Tools (доступны через MCP)

### Node Discovery
- `search_nodes` — поиск нод по ключевому слову
- `get_node` — детали ноды (operations, properties, examples)

### Validation
- `validate_node` — валидация конфигурации ноды
- `validate_workflow` — валидация всего workflow

### Workflow Management (requires n8n API)
- `n8n_create_workflow` — создание workflow
- `n8n_update_partial_workflow` — редактирование workflow (самый используемый!)
- `n8n_validate_workflow` — валидация по ID
- `n8n_list_workflows` — список workflows
- `n8n_get_workflow` — получить workflow по ID
- `n8n_test_workflow` — тестирование
- `n8n_executions` — просмотр execution логов
- `n8n_autofix_workflow` — автоматическое исправление ошибок

### Templates
- `search_templates` — поиск из 2700+ шаблонов
- `get_template` — детали шаблона
- `n8n_deploy_template` — деплой шаблона в n8n instance

### Docs & Health
- `tools_documentation` — документация инструментов
- `ai_agents_guide` — гайд по AI workflows
- `n8n_health_check` — проверка здоровья n8n instance

### Important: nodeType Formats
- Search/Validate tools: `nodes-base.httpRequest` (short prefix)
- Workflow tools: `n8n-nodes-base.httpRequest` (full prefix)
- Langchain nodes: `@n8n/n8n-nodes-langchain.agent` (workflow format)

## Other Available Skills

### claude-api
Для работы с Claude API / Anthropic SDK (если понадобится).

### last30days
Исследование актуальных тем за последние 30 дней. Полезно для проверки последних изменений в API (2GIS, Meta, OpenAI).
