export function renderAdminUi() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>SHOJOGI Admin</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f6f7f9;
      --surface: #ffffff;
      --surface-soft: #eef2f6;
      --text: #101820;
      --muted: #667085;
      --border: #d8dee7;
      --primary: #1b6f5c;
      --primary-strong: #105645;
      --danger: #b42318;
      --danger-soft: #fee4e2;
      --ok-soft: #dcfae6;
      --warn-soft: #fff4d6;
      --shadow: 0 18px 50px rgba(16, 24, 40, 0.08);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    * { box-sizing: border-box; }
    body { margin: 0; background: var(--bg); color: var(--text); }
    button, input, select, textarea { font: inherit; }
    button { border: 0; cursor: pointer; }
    button:disabled { cursor: not-allowed; opacity: .55; }
    .shell { min-height: 100vh; }
    .topbar {
      position: sticky; top: 0; z-index: 10; display: flex; align-items: center; justify-content: space-between;
      min-height: 68px; padding: 0 28px; background: rgba(255,255,255,.92); border-bottom: 1px solid var(--border);
      backdrop-filter: blur(14px);
    }
    .brand { display: flex; gap: 12px; align-items: center; font-weight: 800; letter-spacing: .02em; }
    .mark { width: 38px; height: 38px; border-radius: 10px; display: grid; place-items: center; background: var(--primary); color: white; }
    .layout { display: grid; grid-template-columns: 360px minmax(0, 1fr); gap: 20px; padding: 24px; }
    .panel { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; box-shadow: var(--shadow); }
    .login-wrap { min-height: 100vh; display: grid; place-items: center; padding: 24px; }
    .login-card { width: min(440px, 100%); padding: 28px; }
    h1, h2, h3 { margin: 0; letter-spacing: 0; }
    h1 { font-size: 26px; }
    h2 { font-size: 18px; }
    h3 { font-size: 15px; }
    p { color: var(--muted); line-height: 1.55; }
    label { display: grid; gap: 7px; color: #344054; font-size: 13px; font-weight: 700; }
    input, select, textarea {
      width: 100%; border: 1px solid var(--border); background: white; color: var(--text); border-radius: 8px;
      min-height: 44px; padding: 10px 12px; outline: none;
    }
    textarea { min-height: 92px; resize: vertical; }
    input:focus, select:focus, textarea:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(27,111,92,.14); }
    .stack { display: grid; gap: 14px; }
    .row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .between { justify-content: space-between; }
    .btn {
      min-height: 42px; padding: 0 15px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center;
      gap: 8px; font-weight: 800; background: var(--primary); color: white;
    }
    .btn:hover { background: var(--primary-strong); }
    .btn.secondary { background: var(--surface-soft); color: var(--text); }
    .btn.danger { background: var(--danger); }
    .btn.full { width: 100%; }
    .muted { color: var(--muted); }
    .error { display: none; padding: 12px; border-radius: 8px; color: var(--danger); background: var(--danger-soft); font-weight: 700; }
    .empty { padding: 28px; text-align: center; color: var(--muted); }
    .list-head { padding: 16px; border-bottom: 1px solid var(--border); }
    .merchant-list { max-height: calc(100vh - 158px); overflow: auto; }
    .merchant-item {
      width: 100%; display: grid; gap: 7px; text-align: left; padding: 14px 16px; background: white;
      border-bottom: 1px solid var(--border);
    }
    .merchant-item:hover, .merchant-item.active { background: #f1f7f5; }
    .merchant-title { display: flex; align-items: center; justify-content: space-between; gap: 10px; font-weight: 800; }
    .badge { display: inline-flex; align-items: center; min-height: 24px; padding: 0 8px; border-radius: 999px; font-size: 12px; font-weight: 800; }
    .underReview { background: var(--warn-soft); color: #7a4d00; }
    .approved { background: var(--ok-soft); color: #067647; }
    .rejected { background: var(--danger-soft); color: var(--danger); }
    .setupRequired, .draft { background: #e7f0ff; color: #1849a9; }
    .detail { min-height: calc(100vh - 116px); padding: 20px; overflow: auto; }
    .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
    .section { padding: 16px; border: 1px solid var(--border); border-radius: 8px; background: white; }
    .kv { display: grid; grid-template-columns: 150px minmax(0, 1fr); gap: 8px 12px; font-size: 14px; }
    .kv dt { color: var(--muted); }
    .kv dd { margin: 0; min-width: 0; overflow-wrap: anywhere; }
    .doc-link { color: var(--primary); font-weight: 800; text-decoration: none; }
    .doc-link:hover { text-decoration: underline; }
    .actions { position: sticky; bottom: 0; margin: 16px -20px -20px; padding: 16px 20px; background: rgba(255,255,255,.94); border-top: 1px solid var(--border); backdrop-filter: blur(14px); }
    .hidden { display: none !important; }
    @media (max-width: 860px) {
      .layout { grid-template-columns: 1fr; padding: 12px; }
      .merchant-list { max-height: none; }
      .grid { grid-template-columns: 1fr; }
      .topbar { padding: 0 14px; }
    }
  </style>
</head>
<body>
  <main id="loginView" class="login-wrap">
    <section class="panel login-card stack">
      <div class="brand"><div class="mark">S</div><div><h1>Admin Login</h1><div class="muted">Merchant application review</div></div></div>
      <div id="loginError" class="error"></div>
      <form id="loginForm" class="stack">
        <label>Email<input id="email" type="email" autocomplete="email" required /></label>
        <label>Password<input id="password" type="password" autocomplete="current-password" required /></label>
        <button id="loginButton" class="btn full" type="submit">Send OTP</button>
      </form>
      <form id="otpForm" class="stack hidden">
        <p>Enter the 6 digit login code sent to <strong id="otpEmail"></strong>.</p>
        <label>OTP code<input id="otp" inputmode="numeric" maxlength="6" autocomplete="one-time-code" required /></label>
        <button id="otpButton" class="btn full" type="submit">Verify and open dashboard</button>
        <button id="backToLogin" class="btn secondary full" type="button">Back</button>
      </form>
    </section>
  </main>

  <main id="dashboardView" class="shell hidden">
    <header class="topbar">
      <div class="brand"><div class="mark">S</div><div><h2>SHOJOGI Admin</h2><div id="adminEmail" class="muted"></div></div></div>
      <button id="logoutButton" class="btn secondary" type="button">Logout</button>
    </header>
    <section class="layout">
      <aside class="panel">
        <div class="list-head stack">
          <div class="row between"><h2>Merchant Applications</h2><button id="refreshButton" class="btn secondary" type="button">Refresh</button></div>
          <label>Status
            <select id="statusFilter">
              <option value="underReview">Under review</option>
              <option value="rejected">Rejected</option>
              <option value="approved">Approved</option>
              <option value="setupRequired">Setup required</option>
              <option value="">All active</option>
            </select>
          </label>
        </div>
        <div id="merchantList" class="merchant-list"></div>
      </aside>
      <section class="panel detail">
        <div id="detailEmpty" class="empty">Select a merchant application to review.</div>
        <div id="detailContent" class="stack hidden"></div>
      </section>
    </section>
  </main>

  <script>
    const apiBase = location.pathname.includes('/admin')
      ? location.pathname.split('/admin')[0]
      : '/api/v1';
    const state = { token: sessionStorage.getItem('adminAccessToken'), email: '', otpEmail: '', otpRequestId: '', merchants: [], selectedId: '' };
    const sections = ['identity', 'documents', 'tradeLicense', 'tin', 'bank', 'location', 'shop'];

    const $ = (id) => document.getElementById(id);
    const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
    const fmt = (value) => value ? new Date(value).toLocaleString() : 'Not available';
    const readable = (value) => String(value || '').replace(/([A-Z])/g, ' $1').replace(/^./, (char) => char.toUpperCase());

    function showError(message) {
      $('loginError').textContent = message;
      $('loginError').style.display = message ? 'block' : 'none';
    }

    async function request(path, options = {}) {
      const response = await fetch(apiBase + path, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(state.token ? { Authorization: 'Bearer ' + state.token } : {}),
          ...(options.headers || {}),
        },
      });
      const text = await response.text();
      const data = text ? JSON.parse(text) : null;
      if (!response.ok) {
        throw new Error(Array.isArray(data?.message) ? data.message.join('\\n') : data?.message || data?.error || 'Request failed');
      }
      return data;
    }

    function setLoading(button, loading, text) {
      button.disabled = loading;
      button.textContent = loading ? 'Please wait...' : text;
    }

    function showLogin() {
      $('loginView').classList.remove('hidden');
      $('dashboardView').classList.add('hidden');
    }

    function showDashboard() {
      $('loginView').classList.add('hidden');
      $('dashboardView').classList.remove('hidden');
      $('adminEmail').textContent = state.email;
    }

    async function bootstrap() {
      if (!state.token) {
        showLogin();
        return;
      }
      try {
        const profile = await request('/auth/profile');
        if (!profile.roles?.includes('admin')) throw new Error('Admin role is required');
        state.email = profile.email;
        showDashboard();
        await loadMerchants();
      } catch {
        sessionStorage.removeItem('adminAccessToken');
        state.token = '';
        showLogin();
      }
    }

    $('loginForm').addEventListener('submit', async (event) => {
      event.preventDefault();
      showError('');
      const button = $('loginButton');
      setLoading(button, true, 'Send OTP');
      try {
        const data = await request('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email: $('email').value.trim(), password: $('password').value }),
        });
        state.otpEmail = data.email;
        state.otpRequestId = data.otpRequestId;
        $('otpEmail').textContent = data.email;
        $('loginForm').classList.add('hidden');
        $('otpForm').classList.remove('hidden');
      } catch (error) {
        showError(error.message);
      } finally {
        setLoading(button, false, 'Send OTP');
      }
    });

    $('otpForm').addEventListener('submit', async (event) => {
      event.preventDefault();
      showError('');
      const button = $('otpButton');
      setLoading(button, true, 'Verify and open dashboard');
      try {
        const data = await request('/auth/verify-login', {
          method: 'POST',
          body: JSON.stringify({ email: state.otpEmail, code: $('otp').value.trim() }),
        });
        if (!data.user?.roles?.includes('admin')) throw new Error('This account is not allowed to access admin tools');
        state.token = data.accessToken;
        state.email = data.user.email;
        sessionStorage.setItem('adminAccessToken', state.token);
        showDashboard();
        await loadMerchants();
      } catch (error) {
        showError(error.message);
      } finally {
        setLoading(button, false, 'Verify and open dashboard');
      }
    });

    $('backToLogin').addEventListener('click', () => {
      $('otpForm').classList.add('hidden');
      $('loginForm').classList.remove('hidden');
      showError('');
    });

    $('logoutButton').addEventListener('click', () => {
      sessionStorage.removeItem('adminAccessToken');
      state.token = '';
      state.merchants = [];
      state.selectedId = '';
      showLogin();
    });

    $('refreshButton').addEventListener('click', loadMerchants);
    $('statusFilter').addEventListener('change', loadMerchants);

    async function loadMerchants() {
      $('merchantList').innerHTML = '<div class="empty">Loading applications...</div>';
      const status = $('statusFilter').value;
      state.merchants = await request('/admin/api/merchants' + (status ? '?status=' + encodeURIComponent(status) : ''));
      renderMerchantList();
      const selected = state.merchants.find((merchant) => merchant.id === state.selectedId) || state.merchants[0];
      if (selected) selectMerchant(selected.id);
      else renderEmptyDetail();
    }

    function renderMerchantList() {
      if (!state.merchants.length) {
        $('merchantList').innerHTML = '<div class="empty">No applications found.</div>';
        return;
      }
      $('merchantList').innerHTML = state.merchants.map((merchant) => {
        const profile = merchant.merchantProfile || {};
        const status = profile.applicationStatus || 'draft';
        const title = profile.shopName || merchant.username || merchant.email;
        return '<button class="merchant-item ' + (merchant.id === state.selectedId ? 'active' : '') + '" data-id="' + escapeHtml(merchant.id) + '">' +
          '<div class="merchant-title"><span>' + escapeHtml(title) + '</span><span class="badge ' + escapeHtml(status) + '">' + escapeHtml(readable(status)) + '</span></div>' +
          '<div class="muted">' + escapeHtml(merchant.email) + '</div>' +
          '<div class="muted">Submitted: ' + escapeHtml(fmt(profile.submittedAt)) + '</div>' +
          '</button>';
      }).join('');
      document.querySelectorAll('.merchant-item').forEach((button) => button.addEventListener('click', () => selectMerchant(button.dataset.id)));
    }

    async function selectMerchant(id) {
      state.selectedId = id;
      renderMerchantList();
      $('detailEmpty').classList.add('hidden');
      $('detailContent').classList.remove('hidden');
      $('detailContent').innerHTML = '<div class="empty">Loading details...</div>';
      const merchant = await request('/admin/api/merchants/' + encodeURIComponent(id));
      renderDetail(merchant);
    }

    function renderEmptyDetail() {
      state.selectedId = '';
      $('detailEmpty').classList.remove('hidden');
      $('detailContent').classList.add('hidden');
      $('detailContent').innerHTML = '';
    }

    function renderObjectList(object) {
      if (!object || typeof object !== 'object') return '<div class="muted">Not provided</div>';
      return '<dl class="kv">' + Object.entries(object).map(([key, value]) => {
        const isLink = typeof value === 'string' && /^https?:\\/\\//.test(value);
        const rendered = isLink ? '<a class="doc-link" target="_blank" rel="noreferrer" href="' + escapeHtml(value) + '">Open file</a>' : escapeHtml(Array.isArray(value) ? value.join(', ') : value);
        return '<dt>' + escapeHtml(readable(key)) + '</dt><dd>' + rendered + '</dd>';
      }).join('') + '</dl>';
    }

    function renderDetail(merchant) {
      const profile = merchant.merchantProfile || {};
      const status = profile.applicationStatus || 'draft';
      const canReview = status === 'underReview';
      $('detailContent').innerHTML =
        '<div class="row between"><div><h1>' + escapeHtml(profile.shopName || merchant.username || merchant.email) + '</h1><div class="muted">' + escapeHtml(merchant.email) + '</div></div><span class="badge ' + escapeHtml(status) + '">' + escapeHtml(readable(status)) + '</span></div>' +
        '<div class="grid">' +
          section('Account', '<dl class="kv"><dt>User ID</dt><dd>' + escapeHtml(merchant.id) + '</dd><dt>Owner</dt><dd>' + escapeHtml(profile.ownerName || merchant.username) + '</dd><dt>Phone</dt><dd>' + escapeHtml(profile.phone || merchant.phone || 'Not provided') + '</dd><dt>Email verified</dt><dd>' + escapeHtml(fmt(merchant.emailVerifiedAt)) + '</dd><dt>Last login</dt><dd>' + escapeHtml(fmt(merchant.lastLoginAt)) + '</dd></dl>') +
          section('Shop', '<dl class="kv"><dt>Shop type</dt><dd>' + escapeHtml((profile.shopType || []).join(', ') || 'Not provided') + '</dd><dt>Shop phone</dt><dd>' + escapeHtml(profile.shopPhone || 'Not provided') + '</dd><dt>Description</dt><dd>' + escapeHtml(profile.shopDescription || 'Not provided') + '</dd><dt>Submitted</dt><dd>' + escapeHtml(fmt(profile.submittedAt)) + '</dd></dl>') +
          section('Location', renderObjectList(profile.location)) +
          section('Documents', renderObjectList(profile.documents)) +
          section('Bank', renderObjectList(profile.bank)) +
          section('Operating Hours', renderHours(profile.operatingHours)) +
        '</div>' +
        (profile.rejection ? section('Latest Rejection', renderObjectList(profile.rejection)) : '') +
        '<div class="actions stack">' +
          '<div class="row"><button id="approveButton" class="btn" ' + (canReview ? '' : 'disabled') + '>Approve merchant</button><button id="toggleRejectButton" class="btn danger" ' + (canReview ? '' : 'disabled') + '>Reject application</button></div>' +
          '<form id="rejectForm" class="stack hidden"><label>Reason<textarea id="rejectReason" required minlength="8"></textarea></label><label>Helpful tip<textarea id="rejectTip"></textarea></label><label>Rejected sections<select id="rejectedSections" multiple>' + sections.map((s) => '<option value="' + s + '">' + readable(s) + '</option>').join('') + '</select></label><button class="btn danger" type="submit">Confirm rejection</button></form>' +
        '</div>';
      $('approveButton').addEventListener('click', () => approveMerchant(merchant.id));
      $('toggleRejectButton').addEventListener('click', () => $('rejectForm').classList.toggle('hidden'));
      $('rejectForm').addEventListener('submit', (event) => rejectMerchant(event, merchant.id));
    }

    function section(title, content) {
      return '<section class="section stack"><h3>' + escapeHtml(title) + '</h3>' + content + '</section>';
    }

    function renderHours(hours) {
      if (!Array.isArray(hours) || !hours.length) return '<div class="muted">Not provided</div>';
      return '<dl class="kv">' + hours.map((hour) => '<dt>' + escapeHtml(hour.day) + '</dt><dd>' + escapeHtml(hour.isOpen ? hour.openTime + ' - ' + hour.closeTime : 'Closed') + '</dd>').join('') + '</dl>';
    }

    async function approveMerchant(id) {
      if (!confirm('Approve this merchant application?')) return;
      await request('/admin/api/merchants/' + encodeURIComponent(id) + '/approve', { method: 'POST' });
      await loadMerchants();
    }

    async function rejectMerchant(event, id) {
      event.preventDefault();
      const selectedSections = Array.from($('rejectedSections').selectedOptions).map((option) => option.value);
      await request('/admin/api/merchants/' + encodeURIComponent(id) + '/reject', {
        method: 'POST',
        body: JSON.stringify({
          reason: $('rejectReason').value.trim(),
          tip: $('rejectTip').value.trim() || undefined,
          rejectedSections: selectedSections,
          acceptedSections: sections.filter((section) => !selectedSections.includes(section)),
        }),
      });
      await loadMerchants();
    }

    bootstrap();
  </script>
</body>
</html>`;
}
