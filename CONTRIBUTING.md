# Contribuir

Obrigado pelo interesse no MineSphere Launcher. O projeto é pequeno, open source e sem dependências externas.

## Antes de abrir um issue

- Confirma que estás a usar a versão mais recente de `main`.
- Inclui o sistema operativo, a versão do Node.js (se aplicável) e os passos para reproduzir.
- Remove tokens, nomes de contas, caminhos pessoais e outros dados sensíveis dos logs.
- Para problemas com mods ou modpacks, indica a versão do Minecraft, o loader e a origem do conteúdo.

## Desenvolvimento local

```powershell
git clone https://github.com/MundumIgnotum/MineSphere-Launcher.git
cd MineSphere-Launcher
.\start.bat --no-open
```

O `start.bat` prepara o Node.js portátil no Windows. Se já tiveres Node.js 18.17+:

```powershell
node server.js
```

Não é necessário `npm install`.

## Verificações

```powershell
node --check server.js
node --check public/js/app.js
node --check src/api.js
node --check src/skins.js
node --check src/launch.js
node --check src/instances.js
node --check src/store.js
node --check src/auth.js
```

Se tiveres npm:

```powershell
npm run check
```

Testa a interface em `http://127.0.0.1:47821`, incluindo o tema claro/escuro e uma janela estreita.

## Pull requests

- Mantém as alterações focadas e descreve o problema que resolvem.
- Preserva o estilo existente e não adiciones dependências sem necessidade.
- Não incluas `data/`, `game/`, `instances/`, `runtime/`, tokens ou ficheiros de jogo.
- Atualiza a documentação quando alterares comportamento, requisitos ou limitações.
- Indica o que testaste e em que sistema operativo.

## Website

A página está em `docs/` e é publicada por GitHub Actions. Para a testar localmente, serve a pasta com um servidor HTTP simples e abre `http://127.0.0.1:8080/`.

## Licença

Ao contribuíres, concordas que as tuas alterações são distribuídas sob a licença MIT do projeto.
