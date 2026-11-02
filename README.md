# Catálogo digital

Protótipo React/Vite de vitrine digital com produtos, lista de interesse e contato comercial pelo WhatsApp.

## Funcionalidades

- Busca e filtros por categoria, com preços que podem ser ocultados
- Fotos e botões dos produtos iniciam o pedido individual no WhatsApp
- Lista de interesse com quantidades e envio consolidado ao WhatsApp
- Temas e cores personalizáveis; imagem de fundo apenas por upload; alternância entre modo claro/escuro
- Até cinco fotos por produto, adicionadas pelo computador e navegáveis por miniaturas na vitrine; imagens existentes podem ser mantidas ao editar
- Vitrine inicial simplificada; detalhes e lista de interesse são exibidos em telas próprias
- Upload da foto da identidade da loja, com otimização local no navegador
- Atalho visível “Área da equipe” na home, com painel demonstrativo protegido por senha
- Edição do nome e da foto da loja pela Área da equipe; imagens enviadas são otimizadas e salvas neste navegador
- Configuração dos links de Instagram, Facebook, TikTok e YouTube, exibidos no cabeçalho e no rodapé da vitrine
- Tela de abertura animada e transições na vitrine, nos produtos e nas telas de interesse
- Layout adaptado para celular; animações respeitam a preferência por movimento reduzido

## Executar

```bash
npm install
npm run dev
```

## Publicação

O GitHub Actions publica esta vitrine no GitHub Pages a cada atualização da branch `main`:

https://neysidi40-debug.github.io/catalogo-digital/

A Área da equipe está em `/admin/`. O acesso é demonstrativo e não protege informações em uma página pública.

## Acesso administrativo demonstrativo

Use o atalho **Área da equipe** no cabeçalho da home ou acesse `/admin`. A senha padrão da demonstração é `zoo2026`. Para trocá-la localmente, copie `.env.example` para `.env.local`, altere `VITE_ADMIN_PASSWORD` e reinicie o Vite. O login é pedido novamente ao recarregar a página.

O gate de senha existe no frontend e não é autenticação segura: a variável Vite fica acessível no bundle do navegador. Não use dados reais nem publique esse painel como sistema administrativo. Uma versão de produção precisa validar identidade e autorização no servidor.

## Build e limitações

```bash
npm run build
```

LocalStorage é específico do navegador/dispositivo. Redes sociais e catálogo são salvos localmente. O WhatsApp usa `+55 81 98976-9880`; o cliente precisa ter acesso ao WhatsApp. As imagens do catálogo são URLs externas HTTPS.
