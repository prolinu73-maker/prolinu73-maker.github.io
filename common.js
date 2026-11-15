/* =====================================================================
   조효식 허브 PRO · 공통 스크립트 (common.js)
   ---------------------------------------------------------------------
   모든 페이지가 함께 쓰는 기능을 'HUB'라는 이름 아래 모아 둡니다.
   페이지에서는 <head> 안에 아래 한 줄로 불러옵니다. (defer 없이)
       <script src="common.js"></script>

   여기 들어 있는 것
     1. 기본 설정       HUB.ADMIN_UIDS, HUB.FIREBASE_CONFIG, HUB.MENU, HUB.PAGE_LABELS
     2. 작은 도구       HUB.esc(), HUB.loadScript(), HUB.toast()
     3. Firebase        HUB.firebaseReady(), HUB.db(), HUB.storage(), HUB.auth()
     4. 로그인 정보     HUB.getUser(), HUB.setUser(), HUB.clearUser(), HUB.isAdmin(),
                        HUB.onUserChange(), HUB.startAuthSync(), HUB.whenAuthChecked()
     5. 화면 조각       HUB.renderHeader(), HUB.mountHomeButton(), HUB.avatarHTML(),
                        HUB.userMenuHTML(), HUB.toggleUserMenu(), HUB.closeUserMenu()
     6. 방문 기록       페이지를 열면 자동으로 기록 (관리자 브라우저는 제외)

   ※ 상단 메뉴를 추가·변경할 때는 아래 HUB.MENU만 고치면 모든 페이지에 반영됩니다.
   ===================================================================== */
(function (w, d) {
    'use strict';
    if (w.HUB && w.HUB.__loaded) return;          // 두 번 불러와도 한 번만 실행
    const HUB = w.HUB = w.HUB || {};
    HUB.__loaded = true;
    HUB.VERSION = '1.1.0';

    /* =================================================================
       1. 기본 설정
       ================================================================= */
    // 관리자 계정의 Firebase '사용자 UID' (Firebase 콘솔 → Authentication → 사용자 탭에서 확인)
    //  - 무작위 글자라 공개되어도 개인정보가 드러나지 않습니다.
    //  - Firebase 보안 규칙(isAdmin)에도 같은 값을 넣어야 실제 관리자 권한이 생깁니다.
    //  - 관리자를 더 두려면 쉼표로 이어 적으세요.
    HUB.ADMIN_UIDS = Object.freeze(["S7rzFPrdAMQ0uMRnfyJXQdQEHFZ2"]);
    // (예전 버전 호환용 이름. 개인정보 보호를 위해 휴대폰 번호는 더 이상 적지 않습니다)
    HUB.ADMIN_PHONE = null;
    HUB.FIREBASE_CONFIG = Object.freeze({
        apiKey: "AIzaSyCRmZ-OJKGhw0gOmTT63CE2T9e8kSD9dYw",
        authDomain: "prolinu73-6c409.firebaseapp.com",
        projectId: "prolinu73-6c409",
        storageBucket: "prolinu73-6c409.firebasestorage.app",
        messagingSenderId: "399358344473",
        appId: "1:399358344473:web:491d5e74448b4f0f029988"
    });
    HUB.SDK_BASE = "https://www.gstatic.com/firebasejs/";

    // 상단 메뉴 (순서대로 표시). 메뉴를 추가하려면 여기에 한 줄을 넣으세요.
    //   file: 이동할 파일, label: 메뉴 이름, icon: 그림(24×24 SVG 안쪽 모양)
    HUB.MENU = [
        { file: "labor.html", label: "노무관리",
          icon: '<path d="M12 3v18"/><path d="M5 7h14"/><path d="M5 7l-3 7a3 3 0 0 0 6 0z"/><path d="M19 7l-3 7a3 3 0 0 0 6 0z"/><path d="M8 21h8"/>' },
        { file: "budget.html", label: "예산관리",
          icon: '<rect x="2.5" y="6" width="19" height="13" rx="2"/><path d="M2.5 10h19"/><path d="M16 15h2"/>' },
        { file: "Per_diem.html", label: "여비관리",
          icon: '<path d="M5 16V11l2-5h10l2 5v5"/><path d="M3 16h18v2H3z"/><circle cx="7.5" cy="13" r="0.8"/><circle cx="16.5" cy="13" r="0.8"/><path d="M5 11h14"/>' },
        { file: "mulpum_sys.html", label: "물품관리",
          icon: '<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="M3 8l9 5 9-5"/><path d="M12 13v8"/>' },
        { file: "geunmu_search.html", label: "복무 통계 작성",
          icon: '<path d="M4 20V10"/><path d="M10 20V4"/><path d="M16 20v-7"/><path d="M22 20H2"/>' },
        { file: "facility.html", label: "시설공사 공고문 작성",
          icon: '<path d="M2 20h20"/><path d="M4 20V9l8-5 8 5v11"/><path d="M9 20v-6h6v6"/><path d="M8 10h8"/>' },
        { file: "apps.html", label: "스마트 업무도구",
          icon: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>' }
    ];
    const HOME_ICON = '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20h14V9.5"/><path d="M10 20v-5h4v5"/>';

    // 방문기록 화면에 보일 페이지 이름 (메뉴에 없는 페이지 포함)
    HUB.PAGE_LABELS = {
        "index.html": "포털 홈",
        "mypage.html": "내 페이지",
        "apps.html": "스마트 업무도구",
        "labor.html": "노무관리",
        "budget.html": "예산관리",
        "Per_diem.html": "여비관리",
        "mulpum_sys.html": "물품관리",
        "geunmu_search.html": "복무 통계 작성",
        "facility.html": "시설공사 공고문 작성"
    };

    // 프로필 그림으로 고를 수 있는 이모지·색 (내 페이지와 같아야 함)
    HUB.AV_EMOJIS = ["🧑‍💼", "👩‍💼", "👨‍🏫", "👩‍🏫", "🧑‍💻", "👷", "🦉", "🐻", "🐯", "🐰", "🦊", "🐼", "🌱", "🌻", "📚", "⚖️"];
    HUB.AV_COLORS = ["#1B5442", "#2F6FDE", "#7C5CD6", "#E0598B", "#E07A2F", "#1A9C7B", "#9A6B00", "#475569"];

    /* =================================================================
       2. 작은 도구
       ================================================================= */
    HUB.esc = function (s) {
        return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    };
    // 파일 이름 바로잡기: 'mulpum_sys (1).html', 'mulpum_sys(2).html', 'apps - 복사본.html' → 원래 이름
    //  (내려받을 때 같은 이름이 있으면 컴퓨터가 붙이는 번호·'복사본'을 떼어 냄)
    HUB.normalizePage = function (p) {
        p = String(p || "");
        try { p = decodeURIComponent(p); } catch (e) {}
        p = p.split(/[?#]/)[0].split("/").pop();
        if (!p) return "index.html";
        p = p.replace(/\s*\(\d+\)(?=\.html?$)/i, "")          // ' (1)'
             .replace(/\s*-\s*복사본(\s*\(\d+\))?(?=\.html?$)/i, "")   // ' - 복사본'
             .replace(/\s*-\s*Copy(\s*\(\d+\))?(?=\.html?$)/i, "");   // ' - Copy'
        return p;
    };
    HUB.currentPage = function () { return HUB.normalizePage(location.pathname); };
    HUB.loadScript = function (src) {
        return new Promise((resolve, reject) => {
            const s = d.createElement("script");
            s.src = src; s.onload = resolve; s.onerror = reject;
            d.head.appendChild(s);
        });
    };
    // 비밀번호 암호화 (게스트 글 비밀번호 등)
    //  - hashSecret: 글마다 다른 소금값 + 10만 번 반복(PBKDF2) → 'pbkdf2$반복$소금$값'
    //  - verifySecret: 암호화 값과 비교 (예전 글의 원문 비밀번호도 확인됨)
    //  - sha256: 같은 입력이면 항상 같은 값 (예전 회원 휴대폰 번호 찾기용)
    const b64 = u8 => btoa(String.fromCharCode.apply(null, u8));
    const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
    async function pbkdf2(pw, salt, it) {
        const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(String(pw)), "PBKDF2", false, ["deriveBits"]);
        return new Uint8Array(await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: it, hash: "SHA-256" }, key, 256));
    }
    HUB.hashSecret = async function (pw) {
        const salt = crypto.getRandomValues(new Uint8Array(16));
        return "pbkdf2$100000$" + b64(salt) + "$" + b64(await pbkdf2(pw, salt, 100000));
    };
    HUB.verifySecret = async function (pw, stored, legacyPlain) {
        if (pw == null) return false;
        if (stored && String(stored).indexOf("pbkdf2$") === 0) {
            try { const p = stored.split("$"); return b64(await pbkdf2(pw, unb64(p[2]), Number(p[1]))) === p[3]; } catch (e) { return false; }
        }
        return legacyPlain != null && legacyPlain !== "" && String(pw) === String(legacyPlain);   // 예전 원문 비밀번호
    };
    HUB.sha256 = async function (text) {
        const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(String(text)));
        return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
    };
    // 예전 회원 휴대폰 번호 → 찾기용 값 (번호 원문은 저장하지 않음)
    HUB.phoneKey = function (phone) { return HUB.sha256("hub-phone:" + String(phone || "").replace(/[^0-9]/g, "")); };

    // 화면 아래 가운데에 잠깐 뜨는 알림
    let toastTimer;
    HUB.toast = function (msg, ms) {
        let t = d.getElementById("hubToast");
        if (!t) { t = d.createElement("div"); t.id = "hubToast"; t.className = "hub-toast"; t.setAttribute("role", "status"); d.body.appendChild(t); }
        t.textContent = msg; t.classList.add("show");
        clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove("show"), ms || 4000);
    };

    /* =================================================================
       3. Firebase (페이지가 Firebase 프로그램을 불러온 경우에만 동작)
       ================================================================= */
    // Firebase 프로그램이 준비될 때까지 기다림 (준비되면 true, 시간 초과면 false)
    HUB.firebaseReady = function (timeoutMs) {
        return new Promise(resolve => {
            const ok = () => typeof w.firebase !== "undefined" && w.firebase.firestore;
            if (ok()) return resolve(true);
            const t0 = Date.now();
            const iv = setInterval(() => {
                if (ok()) { clearInterval(iv); resolve(true); }
                else if (Date.now() - t0 > (timeoutMs || 15000)) { clearInterval(iv); resolve(false); }
            }, 50);
        });
    };
    // 기본 Firebase 앱을 한 번만 만들고 같이 씀
    HUB.app = function () {
        if (typeof w.firebase === "undefined") return null;
        if (!w.firebase.apps.some(a => a.name === "[DEFAULT]")) w.firebase.initializeApp(HUB.FIREBASE_CONFIG);
        return w.firebase.apps.find(a => a.name === "[DEFAULT]") || null;
    };
    HUB.db = function () {
        if (typeof w.firebase === "undefined" || !w.firebase.firestore) return null;
        HUB.app();
        return w.firebase.firestore();
    };
    HUB.storage = function () {
        if (typeof w.firebase === "undefined" || !w.firebase.storage) return null;
        HUB.app();
        return w.firebase.storage();
    };
    HUB.auth = function () {
        if (typeof w.firebase === "undefined" || !w.firebase.auth) return null;
        HUB.app();
        const a = w.firebase.auth();
        a.languageCode = "ko";              // 재설정·확인 메일을 한국어로
        return a;
    };
    // 페이지가 로그인 프로그램(auth)을 안 불러왔으면 같은 버전으로 불러옴
    HUB.ensureAuthSDK = async function () {
        if (!(await HUB.firebaseReady())) return false;
        if (!w.firebase.auth) {
            const v = w.firebase.SDK_VERSION || "10.7.1";
            try { await HUB.loadScript(HUB.SDK_BASE + v + "/firebase-auth-compat.js"); } catch (e) { return false; }
        }
        return !!w.firebase.auth;
    };

    /* =================================================================
       4. 로그인 정보
          - 이 브라우저의 로그인 정보는 localStorage 'currentUser'에 둠
            (Firebase를 쓰지 않는 페이지도 읽을 수 있도록)
          - Firebase 로그인 상태(onAuthStateChanged)와 항상 맞춰 둠
          - phone 칸 = '글 주인 표시값' (예전 회원은 예전 휴대폰 번호, 새 회원은 'uid:고유번호')
       ================================================================= */
    const USER_KEY = "currentUser";
    const listeners = [];
    HUB.getUser = function () {
        try { return JSON.parse(localStorage.getItem(USER_KEY) || "null"); } catch (e) { return null; }
    };
    // 관리자 여부: 로그인한 계정의 UID로 확인 (휴대폰 번호로 확인하지 않음)
    //  ※ 화면 표시용 확인입니다. 실제 수정·삭제 권한은 Firebase 보안 규칙이 로그인 정보로 다시 확인합니다.
    HUB.isAdmin = function (u) {
        if (u === undefined) u = HUB.getUser();
        return !!(u && u.uid && HUB.ADMIN_UIDS.indexOf(u.uid) !== -1);
    };
    // 관리자 브라우저 표시 (방문기록·방문자 수에서 제외). 한 번 관리자로 로그인하면 계속 유지
    HUB.isAdminDevice = function () {
        try {
            if (HUB.isAdmin()) localStorage.setItem("hubAdminDevice", "1");
            return localStorage.getItem("hubAdminDevice") === "1";
        } catch (e) { return false; }
    };
    function notify(u) { listeners.slice().forEach(cb => { try { cb(u); } catch (e) { console.error(e); } }); }
    HUB.setUser = function (u) {
        localStorage.setItem(USER_KEY, JSON.stringify(u));
        if (HUB.isAdmin(u)) localStorage.setItem("hubAdminDevice", "1");
        notify(u);
    };
    HUB.clearUser = function () {
        localStorage.removeItem(USER_KEY);
        notify(null);
    };
    // 로그인 상태가 바뀔 때마다 실행할 일을 등록 (되돌리는 함수를 돌려줌)
    HUB.onUserChange = function (cb) {
        listeners.push(cb);
        return () => { const i = listeners.indexOf(cb); if (i >= 0) listeners.splice(i, 1); };
    };
    // 다른 탭에서 로그인·로그아웃하면 이 탭에도 반영
    w.addEventListener("storage", e => { if (e.key === USER_KEY || e.key === null) notify(HUB.getUser()); });

    // 회원 정보(users 문서) → 이 브라우저 로그인 정보
    HUB.profileToUser = function (uid, prof) {
        return { phone: prof.ownerKey || ("uid:" + uid), name: prof.name, uid: uid, loginId: prof.loginId, avatar: prof.avatar || null };
    };

    // Firebase 로그인 상태와 이 브라우저 로그인 정보를 맞춤 (페이지마다 한 번)
    let syncStarted = false, authChecked = false;
    const checkedCbs = [];
    function markChecked() { authChecked = true; checkedCbs.splice(0).forEach(cb => { try { cb(); } catch (e) { console.error(e); } }); }
    // 첫 로그인 확인이 끝나면 실행 (이미 끝났으면 바로 실행)
    HUB.whenAuthChecked = function (cb) { authChecked ? cb() : checkedCbs.push(cb); };
    HUB.startAuthSync = async function () {
        if (syncStarted) return; syncStarted = true;
        if (!(await HUB.ensureAuthSDK())) return markChecked();
        const auth = HUB.auth();
        auth.onAuthStateChanged(async fu => {
            const cur = HUB.getUser();
            if (fu) {
                try {
                    const snap = await HUB.db().collection("users").doc(fu.uid).get();
                    if (!snap.exists) {                       // 관리자가 탈퇴 처리한 계정
                        await auth.signOut();
                        if (cur) HUB.clearUser();
                    } else {
                        const nu = HUB.profileToUser(fu.uid, snap.data());
                        if (!cur || cur.uid !== nu.uid || cur.name !== nu.name || cur.phone !== nu.phone
                            || JSON.stringify(cur.avatar || null) !== JSON.stringify(nu.avatar || null)) HUB.setUser(nu);
                    }
                } catch (e) { console.log("회원 정보 확인 실패", e); }
            } else if (cur) {
                // 예전 방식 로그인 정보이거나 로그인이 끝난 경우 → 다시 로그인하게 함
                HUB.clearUser();
            }
            markChecked();
        });
    };

    /* =================================================================
       5. 화면 조각
       ================================================================= */
    // 상단바 그리기. 페이지에서는 이렇게 씁니다:
    //   <header id="hubHeader"></header>
    //   <script>HUB.renderHeader({ active: 'apps.html', home: true, wrapAt: 1500, right: '...' });</script>
    //   - active : 강조할 메뉴 파일 (없으면 강조 안 함)
    //   - home   : 왼쪽에 '홈으로' 버튼 표시 여부
    //   - homeTitle : '홈으로' 버튼에 마우스를 올렸을 때 나오는 설명 (생략 가능)
    //   - wrapAt : 이 폭보다 좁으면 메뉴바를 아래 줄로 (1140 / 1300 / 1500)
    //   - right  : 오른쪽에 넣을 HTML (로그인 버튼 등). 바깥 칸에 'hub-right'가 붙습니다
    //   - rightClass, rightId : 오른쪽 칸의 class·id
    HUB.renderHeader = function (opt) {
        opt = opt || {};
        const h = d.getElementById(opt.target || "hubHeader");
        if (!h) return null;
        h.className = "top hub-top wrap-" + (opt.wrapAt || 1500);
        const items = HUB.MENU.map(m => {
            const on = m.file === opt.active;
            return `<a href="${m.file}" class="nav-item${on ? " active" : ""}"${on ? ' aria-current="page"' : ""}><svg viewBox="0 0 24 24">${m.icon}</svg>${m.label}</a>`;
        }).join("");
        const home = opt.home ? `<a href="index.html" class="home-btn" title="${HUB.esc(opt.homeTitle || "포털 첫 화면(index.html)으로 이동합니다")}"><svg viewBox="0 0 24 24">${HOME_ICON}</svg>홈으로</a>` : "";
        const right = opt.right != null
            ? `<div class="hub-right${opt.rightClass ? " " + opt.rightClass : ""}"${opt.rightId ? ` id="${opt.rightId}"` : ""}>${opt.right}</div>` : "";
        h.innerHTML = home + `<nav class="nav-wrap" aria-label="업무 페이지"><div class="nav-pill">${items}</div></nav>` + right;
        return h;
    };

    // '홈으로' 버튼 (labor·budget·Per_diem·mulpum·geunmu·facility 모양)
    // 넣을 자리에 <span data-hub-home></span> 를 두고 바로 뒤에서 HUB.mountHomeButton() 실행
    //   onclick: 누를 때 먼저 할 일 (예: 시설공사 페이지는 '저장 후 이동')
    HUB.homeButtonHTML = function (title) {
        return `<a id="hubHomeBtn" href="index.html" title="${HUB.esc(title || "홈(index.html)으로 이동합니다")}"><svg viewBox="0 0 24 24" aria-hidden="true">${HOME_ICON}</svg>홈으로</a>`;
    };
    HUB.mountHomeButton = function (opt) {
        opt = opt || {};
        const spot = opt.target ? d.querySelector(opt.target) : d.querySelector("[data-hub-home]");
        if (!spot) return null;
        const tmp = d.createElement("div");
        tmp.innerHTML = HUB.homeButtonHTML(opt.title);
        const a = tmp.firstChild;
        if (typeof opt.onclick === "function") a.addEventListener("click", e => { e.preventDefault(); opt.onclick(e); });
        spot.replaceWith(a);
        return a;
    };

    // 프로필 그림 (내 페이지에서 정한 이모지·색 또는 사진)
    HUB.avatarHTML = function (u, size) {
        const a = (u && u.avatar) || {};
        const cls = "av" + (size ? " " + size : "");
        if (a.type === "photo" && /^https:\/\//.test(a.url || "")) return `<span class="${cls}"><img src="${HUB.esc(a.url)}" alt="" onerror="this.remove()"></span>`;
        const color = HUB.AV_COLORS.includes(a.color) ? a.color : "#1B5442";
        const face = HUB.AV_EMOJIS.includes(a.emoji) ? a.emoji : HUB.esc(String((u && u.name) || "?").slice(0, 1));
        return `<span class="${cls}" style="background:${color}" aria-hidden="true">${face}</span>`;
    };

    // 닉네임 펼침 메뉴 (프로필 그림 + 닉네임 ▼)
    //   act: 메뉴를 누를 때 실행할 함수 이름(문자열). 비워 두면 홈 화면 주소로 이동합니다.
    //        { myInfo, members, visits, logout }
    HUB.userMenuHTML = function (u, act) {
        act = act || {};
        const admin = HUB.isAdmin(u);
        const item = (label, fn, href) => fn
            ? `<button role="menuitem" onclick="HUB.closeUserMenu(); ${fn}">${label}</button>`
            : `<a href="${href}" role="menuitem">${label}</a>`;
        return `
                  <div class="um-wrap">
                    <button class="um-btn" id="umBtn" aria-haspopup="true" aria-expanded="false" onclick="HUB.toggleUserMenu(event)">${HUB.avatarHTML(u, 'sm')}<span>${HUB.esc(u.name)}</span>${admin ? '<span class="admin-tag">ADMIN</span>' : ''}<span class="caret">▼</span></button>
                    <div class="um-menu" id="umMenu" role="menu" hidden>
                      <a href="mypage.html" role="menuitem">🏠 내 페이지</a>
                      <a href="mypage.html#edit" role="menuitem">⚙️ 프로필 편집</a>
                      ${item("🔑 이메일·비밀번호 변경", act.myInfo, "index.html#mypw")}
                      <a href="mypage.html#fav" role="menuitem">⭐ 즐겨찾기</a>
                      ${admin ? `<div class="um-sec">관리자</div>
                      ${item("👥 회원관리", act.members, "index.html#members")}
                      ${item("📈 방문기록", act.visits, "index.html#visits")}` : ''}
                      ${act.logout ? `<button role="menuitem" class="logout" onclick="HUB.closeUserMenu(); ${act.logout}">로그아웃</button>` : `<a href="index.html#logout" role="menuitem" class="logout">로그아웃</a>`}
                    </div>
                  </div>`;
    };
    HUB.toggleUserMenu = function (e) {
        e.stopPropagation();
        const m = d.getElementById("umMenu"), b = d.getElementById("umBtn"); if (!m) return;
        const open = m.hidden;
        m.hidden = !open; b.setAttribute("aria-expanded", String(open));
    };
    HUB.closeUserMenu = function () {
        const m = d.getElementById("umMenu");
        if (m) { m.hidden = true; d.getElementById("umBtn").setAttribute("aria-expanded", "false"); }
    };
    d.addEventListener("click", e => { if (!e.target.closest(".um-wrap")) HUB.closeUserMenu(); });
    d.addEventListener("keydown", e => { if (e.key === "Escape") HUB.closeUserMenu(); });

    /* =================================================================
       6. 방문 기록 (방문 일시 · 페이지 · 시도 단위 지역)
          - IP는 지역 확인에만 잠깐 쓰이고 저장하지 않음
          - 페이지 자체의 Firebase와 분리 (웹 주소로 직접 저장)
          - 관리자 브라우저는 기록하지 않음
       ================================================================= */
    (function visitTracker() {
        if (w.__visitTrackerLoaded) return;          // 페이지에 예전 기록 코드가 남아 있어도 한 번만
        w.__visitTrackerLoaded = true;
        if (HUB.isAdminDevice()) return;

        const PROJECT_ID = HUB.FIREBASE_CONFIG.projectId;
        const DOC_BASE = "projects/" + PROJECT_ID + "/databases/(default)/documents";
        const COMMIT_URL = "https://firestore.googleapis.com/v1/" + DOC_BASE + ":commit?key=" + HUB.FIREBASE_CONFIG.apiKey;
        const REGION_MAP = [
            ["seoul", "서울특별시"], ["busan", "부산광역시"], ["daegu", "대구광역시"],
            ["incheon", "인천광역시"], ["gwangju", "광주광역시"], ["daejeon", "대전광역시"],
            ["ulsan", "울산광역시"], ["sejong", "세종특별자치시"], ["gyeonggi", "경기도"],
            ["gangwon", "강원특별자치도"],
            ["chungcheongbuk", "충청북도"], ["northchungcheong", "충청북도"], ["chungbuk", "충청북도"],
            ["chungcheongnam", "충청남도"], ["southchungcheong", "충청남도"], ["chungnam", "충청남도"],
            ["jeollabuk", "전북특별자치도"], ["northjeolla", "전북특별자치도"], ["jeonbuk", "전북특별자치도"],
            ["jeollanam", "전라남도"], ["southjeolla", "전라남도"], ["jeonnam", "전라남도"],
            ["gyeongsangbuk", "경상북도"], ["northgyeongsang", "경상북도"], ["gyeongbuk", "경상북도"],
            ["gyeongsangnam", "경상남도"], ["southgyeongsang", "경상남도"], ["gyeongnam", "경상남도"],
            ["jeju", "제주특별자치도"]
        ];
        function toKoreanRegion(region, countryCode, countryName) {
            if (countryCode && countryCode !== "KR") return "해외(" + (countryName || countryCode) + ")";
            const key = (region || "").toLowerCase().replace(/[^a-z]/g, "");
            for (let i = 0; i < REGION_MAP.length; i++) if (key.indexOf(REGION_MAP[i][0]) !== -1) return REGION_MAP[i][1];
            return region ? region : "알 수 없음";
        }
        function fetchJson(url) {
            const ctrl = new AbortController();
            const timer = setTimeout(() => ctrl.abort(), 4000);
            return fetch(url, { signal: ctrl.signal })
                .then(res => { if (!res.ok) throw new Error("HTTP " + res.status); return res.json(); })
                .finally(() => clearTimeout(timer));
        }
        function getRegion() {
            try { const c = sessionStorage.getItem("visitRegion"); if (c) return Promise.resolve(c); } catch (e) {}
            return fetchJson("https://ipapi.co/json/")
                .then(x => { if (!x || x.error) throw new Error("ipapi 실패"); return toKoreanRegion(x.region, x.country_code, x.country_name); })
                .catch(() => fetchJson("https://ipwho.is/?fields=success,country,country_code,region")
                    .then(x => (x && x.success !== false) ? toKoreanRegion(x.region, x.country_code, x.country) : "알 수 없음")
                    .catch(() => "알 수 없음"))
                .then(r => { try { sessionStorage.setItem("visitRegion", r); } catch (e) {} return r; });
        }
        function newId() {
            const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"; let id = "";
            for (let i = 0; i < 20; i++) id += chars.charAt(Math.floor(Math.random() * chars.length));
            return id;
        }
        function recordVisit() {
            if (HUB.isAdminDevice()) return;           // 기다리는 사이 관리자로 로그인했어도 기록하지 않음
            const docId = newId();
            getRegion().then(region => {
                const now = new Date();
                const dateKey = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0") + "-" + String(now.getDate()).padStart(2, "0");
                const body = { writes: [{
                    update: { name: DOC_BASE + "/stats/" + docId, fields: {
                        kind: { stringValue: "visit" }, page: { stringValue: HUB.currentPage() },
                        title: { stringValue: d.title || "" }, region: { stringValue: region }, dateKey: { stringValue: dateKey } } },
                    updateTransforms: [{ fieldPath: "visitedAt", setToServerValue: "REQUEST_TIME" }],
                    currentDocument: { exists: false } }] };
                return fetch(COMMIT_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
                    .then(res => {
                        if (!res.ok) return res.text().then(t => { throw new Error(res.status + " " + t); });
                        // 이 브라우저가 남긴 기록 번호를 기억 → 나중에 관리자로 로그인하면 홈에서 자동 삭제
                        try {
                            let ids = JSON.parse(localStorage.getItem("myVisitIds") || "[]");
                            ids.push(docId); if (ids.length > 300) ids = ids.slice(-300);
                            localStorage.setItem("myVisitIds", JSON.stringify(ids));
                        } catch (e) {}
                    });
            }).catch(err => { try { console.log("방문 기록 저장 실패:", err); } catch (e) {} });
        }
        const startLater = () => setTimeout(recordVisit, 1500);   // 페이지가 다 뜨고 1.5초 뒤 기록
        if (d.readyState === "complete") startLater(); else w.addEventListener("load", startLater);
    })();

    /* =================================================================
       시작: Firebase 프로그램을 불러온 페이지는 로그인 상태를 자동으로 맞춤
       ================================================================= */
    d.addEventListener("DOMContentLoaded", () => {
        if (d.querySelector('script[src*="firebase-app-compat"]')) HUB.startAuthSync();
    });
})(window, document);
