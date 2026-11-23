# Firebase Hosting | AUDIOX

## Objetivo

Preparar o AUDIOX para uma publicação independente no Firebase Hosting, mantendo o GitHub Pages como publicação atual até uma decisão explícita de migração.

## Estado desta configuração

- O projeto Firebase informado pelo proprietário é **NEXUS AUDIOX**.
- O Console mostrou o plano **Spark** na captura de tela de 2026-11-23.
- O ID técnico do projeto Firebase ainda precisa ser confirmado no Console.
- O Firebase Hosting ainda não foi inicializado nem publicado.
- Nenhuma credencial ou segredo deve ser armazenado neste repositório.

## Build

O Firebase Hosting serve o conteúdo gerado em `dist`. O Vite usa `/` como base padrão, adequada a um domínio Firebase. O workflow do GitHub Pages define explicitamente `VITE_BASE_PATH=/AUDIOX/`, preservando o caminho atual do Pages.

## Configuração local (somente quando o ID do projeto for confirmado)

1. Instale o Firebase CLI em um computador de desenvolvimento com Node.js.
2. Faça login com a conta Google que administra o projeto NEXUS AUDIOX.
3. Na raiz do repositório, confirme o projeto pelo ID técnico, não apenas pelo nome de exibição.
4. Execute o build: `npm ci` e `npm run build`.
5. Revise `firebase.json` e faça um deploy de teste somente depois de confirmar o projeto e o destino.

Comandos previstos:

```bash
firebase login
firebase projects:list
npm ci
npm run build
firebase deploy --only hosting --project SEU_PROJECT_ID
```

Substitua `SEU_PROJECT_ID` pelo ID confirmado no Console. Não execute o deploy até revisar o projeto selecionado.

## Segurança e custos

- Não adicionar chave privada de conta de serviço, token ou arquivo de credenciais ao Git.
- Não habilitar Blaze nem adicionar cartão como parte desta configuração.
- Verificar os limites e cotas atuais do Spark antes de publicar.
- A configuração não cria backend, Cloud Functions, Storage ou banco de dados.
- O workflow de deploy automático fica deliberadamente fora desta etapa, pois ainda faltam o ID técnico confirmado e uma credencial de implantação armazenada como segredo no GitHub.

## Critério para migrar

A publicação do GitHub Pages permanece como produção atual. Só considerar troca depois de um deploy de teste confirmado, validação em iPhone/Android e aprovação explícita do proprietário.
