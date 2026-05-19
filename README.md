# Laudo de Autismo

Frontend de uma plataforma clínica para cadastro, login, questionários, acompanhamento de testes, agendamentos, compra de serviços e área administrativa.

## Tecnologias

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Supabase

## Estrutura principal

```txt
frontend/
  src/
    components/   Componentes reutilizáveis
    pages/        Telas da aplicação
    services/     Serviços de autenticação e API
    utils/        Configurações auxiliares
```

Arquivos externos relevantes:

- `UML.uml`: diagrama base com entidades como usuário, questionário, teste, resposta, agendamento, contato e pacote de serviço.
- `frontend/.env`: variáveis locais usadas pelo frontend.

## Funcionalidades atuais do frontend

- Login e cadastro com e-mail/senha.
- Login e cadastro com Google via Supabase.
- Rotas protegidas por sessão.
- Tela inicial com resumo de testes, agendamentos e contato rápido.
- Questionário com progresso e cálculo local de pontuação.
- Página de testes com resultado preliminar e recomendações.
- Página de agendamentos com contato por WhatsApp e e-mail.
- Página de serviços com seleção de pacote.
- Página de configurações do perfil.
- Página administrativa para ajustar contatos, serviços e perguntas localmente.

## Variáveis de ambiente

Crie ou atualize `frontend/.env` com:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

O serviço de API também aceita `VITE_API_URL`. Se não for informado, o frontend usa `http://localhost:3000`.

Crie ou atualize `backend/.env` usando `backend/.env.example` como base. Para notificações e pagamentos, preencha as chaves do EmailJS e da InfinitePay. Enquanto a URL pública do webhook não existir, mantenha `INFINITEPAY_WEBHOOK_URL=` vazio.

Antes de usar compras de serviço, execute o SQL em `docs/checkout-infinitepay.sql` no Supabase.

## Como rodar

```bash
cd frontend
npm install
npm run dev
```

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

## Observações

- Algumas telas ainda usam dados mockados no frontend.
- A área administrativa salva alterações apenas em estado local.
- A autenticação está integrada ao Supabase.
