'use strict';

const { postForm, postJson, fetchJson, sleep, normalizeUuid, randomId, offlineUuid } = require('./util');
const {
  getSettings,
  getAccount,
  getRawAccounts,
  upsertAccount,
  publicAccount,
} = require('./store');

const XBL_URL = 'https://user.auth.xboxlive.com/user/authenticate';
const XSTS_URL = 'https://xsts.auth.xboxlive.com/xsts/authorize';
const MC_LOGIN_URL = 'https://api.minecraftservices.com/authentication/login_with_xbox';
const MC_PROFILE_URL = 'https://api.minecraftservices.com/minecraft/profile';

const V1_DEVICE_CODE_URL = 'https://login.live.com/oauth20_connect.srf';
const V1_TOKEN_URL = 'https://login.live.com/oauth20_token.srf';
const V1_SCOPE = 'service::user.auth.xboxlive.com::MBI_SSL';
const V2_DEVICE_CODE_URL = 'https://login.microsoftonline.com/consumers/oauth2/v2.0/devicecode';
const V2_TOKEN_URL = 'https://login.microsoftonline.com/consumers/oauth2/v2.0/token';
const V2_SCOPE = 'XboxLive.signin offline_access';

const logins = new Map();

function detectFlow(id) {
  const value = String(id || '').trim();
  if (/^[0-9a-f]{16}$/i.test(value)) {
    return {
      key: 'live',
      clientId: value,
      deviceCodeUrl: V1_DEVICE_CODE_URL,
      tokenUrl: V1_TOKEN_URL,
      scope: V1_SCOPE,
      rpsPrefix: 't',
      deviceCodeExtra: { response_type: 'device_code' },
    };
  }
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
    return {
      key: 'entra',
      clientId: value,
      deviceCodeUrl: V2_DEVICE_CODE_URL,
      tokenUrl: V2_TOKEN_URL,
      scope: V2_SCOPE,
      rpsPrefix: 'd',
      deviceCodeExtra: {},
    };
  }
  throw new Error(
    'O Client ID da Microsoft é inválido. Usa o ID público do launcher (00000000402b5328) ou um Application (client) ID Azure em formato UUID.',
  );
}

function clientId() {
  const value = String(getSettings().microsoftClientId || '').trim();
  if (!value) {
    throw new Error(
      'Configura um Client ID da Microsoft nas Definições para iniciar sessão. Consulta o README para criar a tua aplicação Azure.',
    );
  }
  return value;
}

function publicLogin(state) {
  if (!state) return null;
  return {
    id: state.id,
    status: state.status,
    userCode: state.userCode,
    verificationUri: state.verificationUri,
    message: state.message,
    expiresIn: state.expiresIn,
    interval: state.interval,
    error: state.error,
    account: state.account ? publicAccount(state.account) : null,
    startedAt: state.startedAt,
  };
}

function xstsError(code) {
  const map = {
    2148916233: 'Esta conta Microsoft ainda não tem uma conta Xbox. Cria uma em xbox.com e tenta novamente.',
    2148916235: 'O Xbox Live não está disponível no país desta conta.',
    2148916236: 'É necessário verificar a idade da conta Microsoft em xbox.com.',
    2148916237: 'É necessário verificar a idade da conta Microsoft em xbox.com.',
    2148916238: 'Esta conta é de um menor e tem de ser adicionada a uma família Microsoft.',
  };
  return map[Number(code)] || `A Xbox Live recusou a autenticação (código ${code}).`;
}

async function authenticateMsa(msAccessToken, refreshToken, expiresIn, previous = {}, options = {}) {
  const rpsPrefix = options.rpsPrefix === 't' ? 't' : 'd';
  const flow = options.flow || previous.msaFlow || detectFlow(previous.msaClientId || clientId()).key;
  const msaClientId = options.clientId || previous.msaClientId || clientId();
  const xbl = await postJson(XBL_URL, {
    Properties: {
      AuthMethod: 'RPS',
      SiteName: 'user.auth.xboxlive.com',
      RpsTicket: `${rpsPrefix}=${msAccessToken}`,
    },
    RelyingParty: 'http://auth.xboxlive.com',
    TokenType: 'JWT',
  });
  if (!xbl.ok || !xbl.data?.Token) {
    throw new Error(`Falha na autenticação Xbox Live: ${xbl.data?.Message || `HTTP ${xbl.status}`}`);
  }

  const xsts = await postJson(XSTS_URL, {
    Properties: {
      SandboxId: 'RETAIL',
      UserTokens: [xbl.data.Token],
    },
    RelyingParty: 'rp://api.minecraftservices.com/',
    TokenType: 'JWT',
  });
  if (!xsts.ok || !xsts.data?.Token) {
    const xerr = xsts.data?.XErr;
    throw new Error(xerr ? xstsError(xerr) : `Falha na autorização XSTS: ${xsts.data?.Message || `HTTP ${xsts.status}`}`);
  }

  const userHash = xsts.data.DisplayClaims?.xui?.[0]?.uhs || xbl.data.DisplayClaims?.xui?.[0]?.uhs;
  const xuid = xsts.data.DisplayClaims?.xui?.[0]?.xid || null;
  if (!userHash) throw new Error('A Xbox Live não devolveu o identificador de utilizador (uhs).');

  const mcLogin = await postJson(MC_LOGIN_URL, {
    identityToken: `XBL3.0 x=${userHash};${xsts.data.Token}`,
  });
  if (!mcLogin.ok || !mcLogin.data?.access_token) {
    throw new Error(`Falha no login Minecraft: ${mcLogin.data?.errorMessage || mcLogin.data?.error || `HTTP ${mcLogin.status}`}`);
  }

  const profileRes = await fetch(MC_PROFILE_URL, {
    headers: {
      Authorization: `Bearer ${mcLogin.data.access_token}`,
      Accept: 'application/json',
      'User-Agent': 'MineSphereLauncher/1.0.0',
    },
    signal: AbortSignal.timeout(30000),
  });
  if (profileRes.status === 404) {
    throw new Error('Esta conta Microsoft não possui o Minecraft Java Edition. Compra o jogo em minecraft.net.');
  }
  if (!profileRes.ok) {
    throw new Error(`Não foi possível obter o perfil Minecraft (HTTP ${profileRes.status}).`);
  }
  const profile = await profileRes.json();
  if (!profile?.id || !profile?.name) throw new Error('Perfil Minecraft inválido.');

  const account = {
    id: normalizeUuid(profile.id),
    type: 'msa',
    name: profile.name,
    uuid: normalizeUuid(profile.id),
    accessToken: mcLogin.data.access_token,
    refreshToken: refreshToken || previous.refreshToken || null,
    expiresAt: Date.now() + (Number(mcLogin.data.expires_in) || 86400) * 1000,
    xuid,
    userHash,
    skinUrl: profile.skins?.[0]?.url || previous.skinUrl || null,
    remoteSkinUrl: profile.skins?.[0]?.url || previous.remoteSkinUrl || previous.skinUrl || null,
    skinSource: 'remote',
    hasLocalSkin: false,
    msaClientId,
    msaFlow: flow,
    createdAt: previous.createdAt,
  };
  const saved = upsertAccount(account, { activate: true });
  const raw = getAccount(saved.id);
  return raw;
}

function startPolling(state) {
  const intervalMs = Math.max(1, Number(state.interval) || 5) * 1000;
  const expiresAt = Date.now() + (Number(state.expiresIn) || 900) * 1000;
  (async () => {
    let interval = intervalMs;
    try {
      while (Date.now() < expiresAt && state.status === 'pending') {
        await sleep(interval);
        if (state.status !== 'pending') return;
        const result = await postForm(state.tokenUrl, {
          grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
          client_id: state.clientId,
          device_code: state.deviceCode,
        });
        const data = result.data || {};
        if (result.ok && data.access_token) {
          state.message = 'A autenticar com a Xbox Live...';
          const account = await authenticateMsa(data.access_token, data.refresh_token, data.expires_in, {}, {
            rpsPrefix: state.rpsPrefix,
            flow: state.flow,
            clientId: state.clientId,
          });
          state.account = account;
          state.status = 'success';
          state.message = `Sessão iniciada como ${account.name}.`;
          return;
        }
        if (data.error === 'authorization_pending') continue;
        if (data.error === 'slow_down') {
          interval += 5000;
          continue;
        }
        if (data.error === 'expired_token') {
          state.status = 'expired';
          state.error = 'O código expirou. Pede um novo código.';
          return;
        }
        if (data.error === 'authorization_declined') {
          state.status = 'failed';
          state.error = 'O início de sessão foi cancelado.';
          return;
        }
        state.status = 'failed';
        state.error = data.error_description || data.error || 'Falha no início de sessão Microsoft.';
        return;
      }
      if (state.status === 'pending') {
        state.status = 'expired';
        state.error = 'O código expirou. Pede um novo código.';
      }
    } catch (error) {
      state.status = 'failed';
      state.error = error.message;
    }
  })();
}

async function startMicrosoftLogin() {
  const id = randomId(6);
  const flow = detectFlow(clientId());
  const result = await postForm(flow.deviceCodeUrl, {
    client_id: flow.clientId,
    scope: flow.scope,
    ...flow.deviceCodeExtra,
  });
  if (!result.ok) {
    const description =
      result.data?.error_description ||
      result.data?.error ||
      `HTTP ${result.status}. Verifica se o Client ID permite "public client flows" (device code).`;
    throw new Error(`Microsoft recusou o pedido: ${description}`);
  }
  const data = result.data;
  if (!data?.device_code || !data?.user_code) throw new Error('Resposta inválida do serviço de autenticação Microsoft.');
  const state = {
    id,
    status: 'pending',
    deviceCode: data.device_code,
    userCode: data.user_code,
    verificationUri: data.verification_uri || data.verification_url,
    message: data.message || 'Abre a página e introduz o código.',
    expiresIn: Number(data.expires_in) || 900,
    interval: Number(data.interval) || 5,
    clientId: flow.clientId,
    tokenUrl: flow.tokenUrl,
    rpsPrefix: flow.rpsPrefix,
    flow: flow.key,
    error: null,
    account: null,
    startedAt: Date.now(),
  };
  logins.set(id, state);
  startPolling(state);
  setTimeout(() => {
    if (logins.has(id) && state.status !== 'pending') logins.delete(id);
  }, 20 * 60 * 1000).unref?.();
  return publicLogin(state);
}

function getLoginStatus(id) {
  return publicLogin(logins.get(id));
}

function cancelLogin(id) {
  const state = logins.get(id);
  if (state) {
    state.status = 'cancelled';
    state.error = 'Cancelado.';
    logins.delete(id);
  }
  return true;
}

async function refreshAccount(id) {
  const account = getAccount(id);
  if (!account) throw new Error('Conta não encontrada.');
  if (account.type !== 'msa') throw new Error('Apenas contas Microsoft podem ser renovadas.');
  if (!account.refreshToken) throw new Error('Esta conta não tem refresh token. Inicia sessão novamente.');
  const flow = detectFlow(account.msaClientId || clientId());
  const result = await postForm(flow.tokenUrl, {
    grant_type: 'refresh_token',
    client_id: flow.clientId,
    refresh_token: account.refreshToken,
    scope: flow.scope,
  });
  if (!result.ok || !result.data?.access_token) {
    const description = result.data?.error_description || result.data?.error || `HTTP ${result.status}`;
    throw new Error(`Não foi possível renovar a sessão: ${description}. Inicia sessão novamente.`);
  }
  return authenticateMsa(result.data.access_token, result.data.refresh_token, result.data.expires_in, account, {
    rpsPrefix: flow.rpsPrefix,
    flow: flow.key,
    clientId: flow.clientId,
  });
}

async function ensureFreshAccount(account) {
  if (!account) throw new Error('Nenhuma conta selecionada.');
  if (account.type === 'offline') return account;
  if (!account.expiresAt || account.expiresAt < Date.now() + 5 * 60 * 1000) {
    return refreshAccount(account.id);
  }
  return account;
}

function createOfflineAccount(name) {
  const cleaned = String(name || '').trim();
  if (!/^[A-Za-z0-9_]{3,16}$/.test(cleaned)) {
    throw new Error('O nome offline deve ter entre 3 e 16 caracteres (letras, números e _).');
  }
  const uuid = offlineUuid(cleaned);
  const existing = getRawAccounts().find(
    (account) => account.type === 'offline' && account.name.toLowerCase() === cleaned.toLowerCase(),
  );
  if (existing) {
    upsertAccount(existing, { activate: true });
    return publicAccount(existing);
  }
  const account = {
    id: `offline-${uuid}`,
    type: 'offline',
    name: cleaned,
    uuid,
    accessToken: '0',
    refreshToken: null,
    expiresAt: null,
    skinUrl: `https://mc-heads.net/avatar/${uuid}/128`,
    remoteSkinUrl: `https://mc-heads.net/avatar/${uuid}/128`,
    skinSource: 'remote',
    hasLocalSkin: false,
  };
  return upsertAccount(account, { activate: true });
}

function getSessionInfo(account) {
  return {
    accessToken: account.accessToken,
    uuid: normalizeUuid(account.uuid),
    name: account.name,
    xuid: account.xuid || '',
    userType: account.type === 'msa' ? 'msa' : 'legacy',
  };
}

module.exports = {
  startMicrosoftLogin,
  getLoginStatus,
  cancelLogin,
  refreshAccount,
  ensureFreshAccount,
  createOfflineAccount,
  getSessionInfo,
  authenticateMsa,
};
