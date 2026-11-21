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
     6-2. 접속자 수     사이트 전체 오늘·누적 접속자 수 (HUB.visitors.ready, HUB.visitors.read)
     7. 쪽지           HUB.msg.compose(), HUB.msg.button(), HUB.msg.refreshBadge()

   ※ 상단 메뉴를 추가·변경할 때는 아래 HUB.MENU만 고치면 모든 페이지에 반영됩니다.
   ===================================================================== */
(function (w, d) {
    'use strict';
    if (w.HUB && w.HUB.__loaded) return;          // 두 번 불러와도 한 번만 실행
    const HUB = w.HUB = w.HUB || {};
    HUB.__loaded = true;
    HUB.VERSION = '1.7.0';

    // ── 보안: 다른 사이트가 이 페이지를 몰래 액자(iframe)에 넣어 클릭을 가로채는 것(클릭재킹) 막기 ──
    //  같은 사이트 안의 액자는 허용, 다른 사이트 안에 들어가 있으면 이 페이지를 맨 위 창으로 띄움
    if (w.top !== w.self) {
        let sameSite = false;
        try { sameSite = w.top.location.origin === w.location.origin; } catch (e) { sameSite = false; }
        if (!sameSite) {
            d.documentElement.style.visibility = "hidden";
            try { w.top.location = w.location.href; } catch (e) {}
        }
    }

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
        // ※ 메뉴 구성: 큰 분류 5개만 상단에 보이고, 마우스를 올리면 하위 메뉴가 펼쳐집니다
        //   - 하위 메뉴를 추가하려면 해당 분류의 children 안에 한 줄을 넣으세요
        //   - soon: true → 아직 페이지가 없는 메뉴 ('준비 중' 표시). 페이지를 만들면 file 이름을 넣고 soon 을 지우세요
        { file: "lawsearch.html", label: "법령ㆍ판례",
          icon: '<path d="M4 19.5V5a2 2 0 0 1 2-2h14v16H6a2 2 0 0 0-2 2z"/><path d="M8 7h8"/><path d="M8 11h8"/><path d="M8 15h5"/>' },
        { label: "인사ㆍ노무",
          icon: '<circle cx="9" cy="8" r="3.2"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><path d="M16 11h5"/><path d="M16 15h5"/><path d="M16 7h5"/>',
          children: [
            { file: "hobong.html", label: "교원 호봉획정",
              icon: '<path d="M4 20V14"/><path d="M9 20V10"/><path d="M14 20V6"/><path d="M19 20V3"/><path d="M2 20h20"/>' },
            { file: "geunmu_search.html", label: "복무 통계 작성",
              icon: '<path d="M4 20V10"/><path d="M10 20V4"/><path d="M16 20v-7"/><path d="M22 20H2"/>' },
            { file: "labor.html", label: "노무 정보마당",
              icon: '<path d="M12 3v18"/><path d="M5 7h14"/><path d="M5 7l-3 7a3 3 0 0 0 6 0z"/><path d="M19 7l-3 7a3 3 0 0 0 6 0z"/><path d="M8 21h8"/>' },
            { file: "yeoncha.html", label: "연차 계산",
              icon: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18"/><path d="M8 2v4"/><path d="M16 2v4"/><path d="M8 14h3"/><path d="M8 17h6"/>' }
          ] },
        { label: "재무ㆍ계약",
          icon: '<rect x="2.5" y="6" width="19" height="13" rx="2"/><path d="M2.5 10h19"/><path d="M16 15h2"/>',
          children: [
            { file: "budget.html", label: "교특회계",
              icon: '<path d="M3 21h18"/><path d="M4 10h16"/><path d="M12 3 3 8v2h18V8z"/><path d="M6 10v8"/><path d="M10 10v8"/><path d="M14 10v8"/><path d="M18 10v8"/>' },
            { file: "", label: "학교회계", soon: true,
              icon: '<path d="M3 21h18"/><path d="M5 21V10l7-5 7 5v11"/><path d="M10 21v-5h4v5"/><path d="M12 5V2h3"/>' },
            { file: "Per_diem.html", label: "여비관리",
              icon: '<path d="M5 16V11l2-5h10l2 5v5"/><path d="M3 16h18v2H3z"/><circle cx="7.5" cy="13" r="0.8"/><circle cx="16.5" cy="13" r="0.8"/><path d="M5 11h14"/>' },
            { file: "mulpum_sys.html", label: "물품관리",
              icon: '<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="M3 8l9 5 9-5"/><path d="M12 13v8"/>' },
            { file: "facility.html", label: "시설공사 공고문 작성",
              icon: '<path d="M2 20h20"/><path d="M4 20V9l8-5 8 5v11"/><path d="M9 20v-6h6v6"/><path d="M8 10h8"/>' }
          ] },
        { label: "학교운영",
          icon: '<circle cx="12" cy="7" r="2.6"/><circle cx="5" cy="9.5" r="2.1"/><circle cx="19" cy="9.5" r="2.1"/><path d="M7.5 20a4.5 4.5 0 0 1 9 0"/><path d="M1.8 19a3.3 3.3 0 0 1 5.4-2.5"/><path d="M22.2 19a3.3 3.3 0 0 0-5.4-2.5"/>',
          children: [
            { file: "summary_minutes.html", label: "학교운영위원회 회의 관리",
              icon: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/><path d="M8 13h8"/><path d="M8 17h5"/>' }
          ] },
        { label: "소통ㆍ도구",
          icon: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.6A8 8 0 1 1 21 12z"/><path d="M8.5 11h.01"/><path d="M12 11h.01"/><path d="M15.5 11h.01"/>',
          children: [
            { file: "apps.html", label: "스마트 업무도구",
              icon: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>' },
            { file: "index.html#community", label: "커뮤니티 라운지",
              icon: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.6A8 8 0 1 1 21 12z"/><path d="M8.5 11h.01"/><path d="M12 11h.01"/><path d="M15.5 11h.01"/>' }
          ] }
    ];
    const HOME_ICON = '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20h14V9.5"/><path d="M10 20v-5h4v5"/>';

    // 방문기록 화면에 보일 페이지 이름 (메뉴에 없는 페이지 포함)
    HUB.PAGE_LABELS = {
        "index.html": "포털 홈",
        "mypage.html": "내 페이지",
        "apps.html": "스마트 업무도구",
        "labor.html": "노무관리",
        "yeoncha.html": "연차 계산",
        "budget.html": "예산관리(교특회계)",
        "Per_diem.html": "여비관리",
        "mulpum_sys.html": "물품관리",
        "summary_minutes.html": "학교운영위원회 회의록 작성",
        "hobong.html": "교원 호봉획정",
        "geunmu_search.html": "복무 통계 작성",
        "facility.html": "시설공사 공고문 작성",
        "lawsearch.html": "법령ㆍ판례 검색"
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
    // ── 보안 도구 ──
    // 글 번호(문서 ID)가 정상인지 확인: 영문·숫자·_·- 만 허용
    //  (따옴표 등이 섞인 번호로 글을 만들어 화면의 버튼 코드를 바꾸는 공격을 막음)
    HUB.okId = function (id) { return typeof id === "string" && /^[A-Za-z0-9_-]{1,128}$/.test(id); };
    // 링크 주소는 http:// 또는 https:// 만 허용 ('javascript:' 같은 위험한 주소는 빈 값으로)
    HUB.safeUrl = function (u) {
        u = String(u == null ? "" : u).trim();
        if (!u) return "";
        if (!/^[a-z][a-z0-9+.-]*:/i.test(u)) u = "https://" + u.replace(/^\/+/, "");
        try { const x = new URL(u); return (x.protocol === "http:" || x.protocol === "https:") ? x.href : ""; } catch (e) { return ""; }
    };
    // 오늘 날짜 'YYYY-MM-DD' — 항상 한국 시간 기준
    //  (방문자 컴퓨터의 시간대와 상관없이 같은 날짜. 해외 시간대 컴퓨터가 '어제' 날짜로 기록하는 문제 방지)
    HUB.todayKey = function () { return new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10); };
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

    // ── 아이디·닉네임 찾기표 (보안) ──
    //  회원 정보(users)는 본인과 관리자만 읽을 수 있게 잠그고,
    //  로그인 전에 꼭 필요한 것만 따로 둠 (목록으로 한꺼번에 볼 수는 없고, 정확한 아이디·닉네임으로만 찾을 수 있음)
    //   - logins/{아이디}  : { uid, mailLock, mailLockOld }  ← 아이디로 로그인할 때 필요
    //   - nicknames/{닉네임}: { uid }                         ← 닉네임이 겹치는지 확인
    HUB.idx = {
        okNick(n) { return typeof n === "string" && n.length > 0 && n.length <= 40 && n.indexOf("/") < 0 && n !== "." && n !== ".."; },
        async login(db, loginId) {
            try { const s = await db.collection("logins").doc(loginId).get(); return s.exists ? s.data() : null; } catch (e) { return null; }
        },
        async nickTaken(db, nick, exceptUid) {
            if (!HUB.idx.okNick(nick)) return true;
            const s = await db.collection("nicknames").doc(nick).get();
            return s.exists && s.data().uid !== exceptUid;
        },
        // 닉네임 바꾸기: 새 이름 등록 → 예전 이름 풀어 줌
        async moveNick(db, uid, newNick, oldNick) {
            if (HUB.idx.okNick(newNick)) await db.collection("nicknames").doc(newNick).set({ uid: uid });
            if (oldNick && oldNick !== newNick && HUB.idx.okNick(oldNick)) {
                try { const s = await db.collection("nicknames").doc(oldNick).get(); if (s.exists && s.data().uid === uid) await db.collection("nicknames").doc(oldNick).delete(); } catch (e) {}
            }
        },
        // 로그인용 잠금 값 저장
        async saveLock(db, uid, loginId, fields) {
            if (!loginId) return;
            await db.collection("logins").doc(loginId).set(Object.assign({ uid: uid }, fields), { merge: true });
        },
        // 찾기표에 빠진 것이 있으면 채움 (예전에 가입한 회원)
        async ensure(db, uid, prof) {
            try {
                if (prof.loginId) {
                    const s = await db.collection("logins").doc(prof.loginId).get();
                    if (!s.exists) {
                        const f = { uid: uid };
                        if (prof.mailLock) f.mailLock = prof.mailLock;
                        if (prof.mailLockOld) f.mailLockOld = prof.mailLockOld;
                        await db.collection("logins").doc(prof.loginId).set(f);
                    }
                }
                if (HUB.idx.okNick(prof.name)) {
                    const n = await db.collection("nicknames").doc(prof.name).get();
                    if (!n.exists) await db.collection("nicknames").doc(prof.name).set({ uid: uid });
                }
            } catch (e) { console.log("아이디·닉네임 찾기표 정리 실패", e); }
        }
    };

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
        const items = HUB.MENU.map((m, i) => {
            if (m.children) {   // 하위 메뉴 묶음 → 단추 + 펼침 메뉴
                const on = !!opt.active && hasFile(m.children, opt.active);
                return `<button type="button" class="nav-item nav-group${on ? " active" : ""}" data-dd="${i}" aria-haspopup="true" aria-expanded="false"><svg viewBox="0 0 24 24">${m.icon}</svg>${m.label}<span class="nav-caret" aria-hidden="true"></span></button>`;
            }
            const on = m.file === opt.active;
            return `<a href="${m.file}" class="nav-item${on ? " active" : ""}"${on ? ' aria-current="page"' : ""}><svg viewBox="0 0 24 24">${m.icon}</svg>${m.label}</a>`;
        }).join("");
        const home = opt.home ? `<a href="index.html" class="home-btn" title="${HUB.esc(opt.homeTitle || "포털 첫 화면(index.html)으로 이동합니다")}"><svg viewBox="0 0 24 24">${HOME_ICON}</svg>홈으로</a>` : "";
        const right = opt.right != null
            ? `<div class="hub-right${opt.rightClass ? " " + opt.rightClass : ""}"${opt.rightId ? ` id="${opt.rightId}"` : ""}>${opt.right}</div>` : "";
        h.innerHTML = home + `<nav class="nav-wrap" aria-label="업무 페이지"><div class="nav-pill">${items}</div></nav>` + right;
        setupDropdowns(h, opt.active);
        return h;
    };

    // 하위 메뉴(몇 단계든) 안에 이 파일이 있는지
    function hasFile(list, file) { return (list || []).some(c => (c.file && c.file === file) || hasFile(c.children, file)); }

    // ── 상단 메뉴의 펼침(드롭다운) 메뉴 ──
    //  메뉴판은 화면 맨 위(body)에 따로 띄워서, 상단바 모양(넘침 숨김 등)에 가려지지 않게 함
    //  - 마우스를 올리면 펼침, 벗어나면 잠시 뒤 닫힘
    //  - 터치 화면·키보드는 눌러서 열고 닫음 (Esc·바깥 누르기·스크롤 시 닫힘)
    let ddCssDone = false;
    function ddCss() {
        if (ddCssDone) return; ddCssDone = true;
        const st = d.createElement("style");
        st.textContent = `
.nav-group{border:none;background:none;font-family:inherit;cursor:pointer}
.nav-group .nav-caret{display:inline-block;width:0;height:0;margin:0 1px 0 8px;border-left:6px solid transparent;border-right:6px solid transparent;border-top:7px solid currentColor;vertical-align:middle;transition:transform .2s}
.nav-group[aria-expanded="true"] .nav-caret{transform:rotate(180deg)}
.hub-dd{position:fixed;z-index:3000;min-width:200px;background:#fff;border:1px solid #E2E8F0;border-radius:12px;padding:6px;box-shadow:0 14px 34px rgba(15,23,42,.16);font-family:'Pretendard',-apple-system,'Malgun Gothic',sans-serif;opacity:0;transform:translateY(-4px);transition:opacity .15s,transform .15s;pointer-events:none}
.hub-dd.open{opacity:1;transform:none;pointer-events:auto}
.hub-dd a{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:8px;color:#1E293B;text-decoration:none;font-size:14.5px;font-weight:700;white-space:nowrap}
.hub-dd a:hover,.hub-dd a:focus{background:#EEF4FF;color:#1D4ED8;outline:none}
.hub-dd a.active{background:#E0EAFF;color:#1D4ED8}
.hub-dd a.soon{color:#94A3B8}
.hub-dd a.soon:hover,.hub-dd a.soon:focus{background:#F8FAFC;color:#64748B}
.hub-dd .dd-soon{margin-left:auto;padding-left:12px;font-size:11.5px;font-weight:800;color:#94A3B8}
.hub-dd .dd-sub{position:relative;display:flex;align-items:stretch}
.hub-dd .dd-sub>a{flex:1}
.hub-dd .dd-arrow{border:none;background:none;border-radius:8px;padding:0 10px;cursor:pointer;color:#94A3B8;font-size:12px;font-family:inherit}
.hub-dd .dd-arrow:hover,.hub-dd .dd-sub.open>.dd-arrow{background:#EEF4FF;color:#1D4ED8}
.hub-dd .dd-fly{position:absolute;top:-7px;left:100%;margin-left:4px;min-width:190px;background:#fff;border:1px solid #E2E8F0;border-radius:12px;padding:6px;box-shadow:0 14px 34px rgba(15,23,42,.16);display:none}
.hub-dd .dd-sub.flip>.dd-fly{left:auto;right:100%;margin-left:0;margin-right:4px}
.hub-dd .dd-sub:hover>.dd-fly,.hub-dd .dd-sub:focus-within>.dd-fly,.hub-dd .dd-sub.open>.dd-fly{display:block}
.hub-dd .dd-sub::after{content:"";position:absolute;top:0;bottom:0;left:100%;width:8px}
.hub-dd svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;flex-shrink:0}
@media (prefers-reduced-motion: reduce){.hub-dd,.nav-group .nav-caret{transition:none}}`;
        d.head.appendChild(st);
    }
    let ddOpen = null, ddTimer = null;
    function ddClose() {
        clearTimeout(ddTimer);
        if (!ddOpen) return;
        ddOpen.menu.classList.remove("open");
        ddOpen.menu.querySelectorAll(".dd-sub.open").forEach(x => x.classList.remove("open"));
        ddOpen.btn.setAttribute("aria-expanded", "false");
        ddOpen = null;
    }
    function ddShow(btn, menu) {
        clearTimeout(ddTimer);
        if (ddOpen && ddOpen.menu !== menu) ddClose();
        const r = btn.getBoundingClientRect();
        menu.style.top = (r.bottom + 6) + "px";
        const left = Math.min(r.left, w.innerWidth - menu.offsetWidth - 8);
        menu.style.left = Math.max(8, left) + "px";
        menu.classList.add("open");
        btn.setAttribute("aria-expanded", "true");
        ddOpen = { btn, menu };
    }
    function setupDropdowns(h, active) {
        ddCss();
        d.querySelectorAll(".hub-dd").forEach(x => x.remove());   // 다시 그릴 때 예전 메뉴판 정리
        h.querySelectorAll(".nav-group").forEach(btn => {
            const m = HUB.MENU[Number(btn.dataset.dd)];
            if (!m || !m.children) return;
            const menu = d.createElement("div");
            menu.className = "hub-dd"; menu.setAttribute("role", "menu");
            const item = c => {
                const link = (c.soon || !c.file)
                    ? `<a href="#" role="menuitem" class="soon" aria-disabled="true" data-soon="${HUB.esc(c.label)}"><svg viewBox="0 0 24 24">${c.icon}</svg>${HUB.esc(c.label)}<span class="dd-soon">준비 중</span></a>`
                    : `<a href="${c.file}" role="menuitem"${c.file === active ? ' class="active" aria-current="page"' : ""}><svg viewBox="0 0 24 24">${c.icon}</svg>${HUB.esc(c.label)}</a>`;
                if (!c.children || !c.children.length) return link;
                // 하위 메뉴가 또 있으면: 이름(누르면 이동) + ▶ 단추(누르면 펼침) + 오른쪽 펼침판
                return `<div class="dd-sub">${link}<button type="button" class="dd-arrow" aria-label="${HUB.esc(c.label)} 하위 메뉴 펼치기" aria-haspopup="true">▶</button><div class="dd-fly" role="menu">${c.children.map(item).join("")}</div></div>`;
            };
            menu.innerHTML = m.children.map(item).join("");
            menu.querySelectorAll(".dd-sub").forEach(sub => {
                const place = () => {   // 화면 오른쪽 끝에 걸리면 왼쪽으로 펼침
                    sub.classList.remove("flip");
                    const fly = sub.querySelector(".dd-fly"); const prev = fly.style.display; fly.style.display = "block";
                    if (fly.getBoundingClientRect().right > w.innerWidth - 8) sub.classList.add("flip");
                    fly.style.display = prev;
                };
                sub.addEventListener("mouseenter", place);
                sub.querySelector(".dd-arrow").addEventListener("click", e => {   // 터치 화면·키보드용
                    e.preventDefault(); e.stopPropagation(); place();
                    const open = !sub.classList.contains("open");
                    menu.querySelectorAll(".dd-sub.open").forEach(x => x.classList.remove("open"));
                    sub.classList.toggle("open", open);
                    if (open) { const f = sub.querySelector(".dd-fly a"); if (f && e.detail === 0) f.focus(); }
                });
            });
            menu.querySelectorAll("a.soon").forEach(a => a.addEventListener("click", e => {
                e.preventDefault(); ddClose();
                HUB.toast("'" + a.dataset.soon + "' 메뉴는 준비 중입니다. 조금만 기다려 주세요.");
            }));
            d.body.appendChild(menu);
            const later = () => { clearTimeout(ddTimer); ddTimer = setTimeout(ddClose, 180); };
            btn.addEventListener("mouseenter", () => ddShow(btn, menu));
            btn.addEventListener("mouseleave", later);
            menu.addEventListener("mouseenter", () => clearTimeout(ddTimer));
            menu.addEventListener("mouseleave", later);
            btn.addEventListener("click", e => {   // 터치 화면·키보드용
                e.preventDefault(); e.stopPropagation();
                ddShow(btn, menu);   // 누르면 항상 열림 (닫기는 바깥 누르기·Esc·마우스 벗어나기)
                const f = menu.querySelector("a"); if (e.detail === 0 && f) f.focus();   // 키보드(Enter)로 열면 첫 항목으로
            });
        });
    }
    d.addEventListener("click", e => { if (ddOpen && !e.target.closest(".hub-dd")) ddClose(); });
    d.addEventListener("keydown", e => { if (e.key === "Escape" && ddOpen) { const b = ddOpen.btn; ddClose(); b.focus(); } });
    w.addEventListener("scroll", () => ddClose(), { passive: true });
    w.addEventListener("resize", () => ddClose());

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
        //  사진 주소는 두 가지만 허용 (보안):
        //   ① Firebase Storage 주소 (예전 방식)
        //   ② 회원 정보에 바로 저장한 사진 'data:image/jpeg;base64,...' (무료 요금제용 새 방식, 300KB 이하)
        const okPhoto = /^https:\/\/firebasestorage\.googleapis\.com\//.test(a.url || "")
            || (/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+\/]+=*$/.test(a.url || "") && a.url.length <= 300000);
        if (a.type === "photo" && okPhoto) return `<span class="${cls}"><img src="${HUB.esc(a.url)}" alt="" onerror="this.remove()"></span>`;
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
                      <a href="mypage.html#msg" role="menuitem">✉️ 쪽지함 <span class="hub-badge" data-hub-msgcnt hidden></span></a>
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
                const dateKey = HUB.todayKey();            // 한국 시간 기준 날짜
                const body = { writes: [{
                    update: { name: DOC_BASE + "/stats/" + docId, fields: {
                        kind: { stringValue: "visit" }, page: { stringValue: HUB.currentPage().slice(0, 60) },
                        title: { stringValue: (d.title || "").slice(0, 80) }, region: { stringValue: region }, dateKey: { stringValue: dateKey } } },
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
       6-2. 접속자 수 (사이트 전체: 오늘 · 누적)
          - 어느 페이지로 들어오든 한 브라우저는 '하루 1번'만 셈
            (같은 날 여러 페이지를 돌아다니거나 새로고침해도 1명)
          - 저장 위치: Firebase stats/visitors { total, todayCount, todayDate }
          - Firebase 프로그램이 없는 페이지에서도 셀 수 있도록 웹 주소로 직접 저장
          - 관리자 브라우저는 세지 않음
          - 첫 화면(index.html)은 HUB.visitors.read()로 숫자를 읽어 보여 줌
       ================================================================= */
    HUB.visitors = (function () {
        const C = HUB.FIREBASE_CONFIG;
        const DOC = "projects/" + C.projectId + "/databases/(default)/documents/stats/visitors";
        const API = "https://firestore.googleapis.com/v1/";
        const DAY_KEY = "hubVisitDay";          // 이 브라우저가 마지막으로 세어진 날(한국 시간)
        const num = f => f ? Number(f.integerValue != null ? f.integerValue : (f.doubleValue || 0)) : 0;
        // 지금 저장된 숫자 읽기 → { total, todayCount, todayDate } (오늘 날짜가 아니면 오늘 수는 0)
        function read() {
            return fetch(API + DOC + "?key=" + C.apiKey)
                .then(res => res.status === 404 ? { fields: {} } : (res.ok ? res.json() : Promise.reject(new Error("HTTP " + res.status))))
                .then(j => {
                    const f = j.fields || {}, today = HUB.todayKey();
                    const todayDate = f.todayDate ? f.todayDate.stringValue : "";
                    return { total: num(f.total), todayCount: todayDate === today ? num(f.todayCount) : 0, todayDate: today };
                });
        }
        // 하루 1번 세기
        function count() {
            let today = HUB.todayKey();
            try { if (HUB.isAdminDevice() || localStorage.getItem(DAY_KEY) === today) return Promise.resolve(false); } catch (e) { return Promise.resolve(false); }
            try { localStorage.setItem(DAY_KEY, today); } catch (e) {}   // 먼저 표시 → 페이지를 여러 개 동시에 열어도 한 번만
            return fetch(API + DOC + "?key=" + C.apiKey)
                .then(res => res.status === 404 ? { fields: {} } : (res.ok ? res.json() : Promise.reject(new Error("HTTP " + res.status))))
                .then(j => {
                    const f = j.fields || {};
                    const saved = f.todayDate ? f.todayDate.stringValue : "";
                    const newDay = !saved || today > saved;               // 날짜가 넘어갔으면 오늘 수를 1부터 다시
                    const fields = { todayDate: { stringValue: newDay ? today : saved } };
                    const mask = ["todayDate"];
                    const tr = [{ fieldPath: "total", increment: { integerValue: "1" } }];   // 서버에서 1을 더함 (동시 접속에도 안 빠짐)
                    if (newDay) { fields.todayCount = { integerValue: "1" }; mask.push("todayCount"); }
                    else tr.push({ fieldPath: "todayCount", increment: { integerValue: "1" } });
                    const body = { writes: [{ update: { name: DOC, fields: fields }, updateMask: { fieldPaths: mask }, updateTransforms: tr }] };
                    return fetch(API + "projects/" + C.projectId + "/databases/(default)/documents:commit?key=" + C.apiKey,
                        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
                        .then(res => {
                            if (!res.ok) return res.text().then(t => { throw new Error(res.status + " " + t); });
                            // 나중에 이 브라우저로 관리자 로그인하면 되돌릴 수 있게 기억
                            try { localStorage.setItem("countedVisitDate", newDay ? today : saved); } catch (e) {}
                            return true;
                        });
                })
                .catch(err => {
                    try { localStorage.removeItem(DAY_KEY); } catch (e) {}   // 실패하면 다음에 다시 세도록
                    try { console.log("접속자 수 저장 실패:", err); } catch (e) {}
                    return false;
                });
        }
        const ready = new Promise(resolve => {
            const go = () => count().then(resolve, () => resolve(false));
            if (d.readyState === "loading") d.addEventListener("DOMContentLoaded", go); else go();
        });
        return { ready, read, count };
    })();

    /* =================================================================
       7. 쪽지 (회원끼리 주고받기)
          - Firebase 'messages' 보관함에 1통 = 문서 1개
          - 보낸 사람과 받는 사람만 읽을 수 있음 (관리자도 못 봄, '신고'된 쪽지만 관리자가 확인)
          - 1년이 지난 쪽지는 쪽지함을 열 때 자동으로 지움
       ================================================================= */
    HUB.msg = (function () {
        const MAX = 1000;
        let cssDone = false;
        function css() {
            if (cssDone) return; cssDone = true;
            const st = d.createElement("style");
            st.textContent = `
.hub-badge{display:inline-block;min-width:18px;padding:0 6px;border-radius:999px;background:#dc2626;color:#fff;font-size:11.5px;font-weight:800;line-height:18px;text-align:center;margin-left:4px;vertical-align:1px}
.hub-badge[hidden]{display:none}
.hub-msg-to{display:inline-flex;align-items:center;gap:3px;border:1px solid #BFD3FF;background:#EEF4FF;border-radius:999px;padding:0 9px;margin-left:6px;font-family:inherit;font-size:12px;line-height:22px;cursor:pointer;color:#1D4ED8;font-weight:800;vertical-align:1px;white-space:nowrap}
.hub-msg-to:hover{border-color:#2563EB;background:#2563EB;color:#fff}
.hub-mc-back{position:fixed;inset:0;z-index:2000;background:rgba(14,50,39,.55);display:flex;align-items:center;justify-content:center;padding:16px;backdrop-filter:blur(3px)}
.hub-mc{background:#fff;border-radius:14px;width:440px;max-width:100%;padding:24px;box-shadow:0 24px 48px rgba(0,0,0,.25);border-top:6px solid #1B5442;font-family:'Pretendard',-apple-system,'Malgun Gothic',sans-serif;color:#17231D}
.hub-mc h3{margin:0 0 14px;font-size:19px;text-align:center}
.hub-mc label{display:block;font-size:13px;font-weight:700;color:#3E4C45;margin:0 0 4px}
.hub-mc input,.hub-mc textarea{width:100%;box-sizing:border-box;padding:10px 12px;border:1.5px solid #D5DFD9;border-radius:8px;font:inherit;font-size:15px;margin:0 0 10px}
.hub-mc textarea{min-height:150px;resize:vertical}
.hub-mc input:focus,.hub-mc textarea:focus{border-color:#1B5442;outline:none}
.hub-mc input[readonly]{background:#F2F5F3}
.hub-mc .mc-cnt{font-size:12px;color:#5B6B63;text-align:right;margin:-6px 0 8px}
.hub-mc .mc-msg{min-height:1.2em;font-size:13px;font-weight:700;color:#dc2626;margin:0 0 8px}
.hub-mc .mc-msg.ok{color:#1A9C7B}
.hub-mc .mc-row{display:flex;gap:8px}
.hub-mc .mc-row button{flex:1;padding:12px;border:none;border-radius:10px;font:inherit;font-size:15px;font-weight:800;cursor:pointer}
.hub-mc .mc-send{background:#F4C430;color:#2A2109}.hub-mc .mc-send:disabled{opacity:.6;cursor:wait}
.hub-mc .mc-close{background:#e2e8f0;color:#17231D}`;
            d.head.appendChild(st);
        }
        const me = () => { const u = HUB.getUser(); return u && u.uid ? u : null; };
        // 받는 사람 이름 옆에 붙는 '✉️' 버튼 (회원 글에만: 글 주인 표시값이 'uid:고유번호'일 때)
        function button(ownerKey, name) {
            css();
            const m = /^uid:([A-Za-z0-9_-]{1,128})$/.exec(String(ownerKey || ""));
            if (!m) return "";
            const u = me(); if (u && u.uid === m[1]) return "";
            const nm = String(name || "").replace(/\s*👑\s*$/, "").trim() || "글쓴이";
            return `<button type="button" class="hub-msg-to" title="${HUB.esc(nm)}님에게 쪽지 보내기" data-uid="${m[1]}" data-name="${HUB.esc(nm)}" onclick="event.stopPropagation(); event.preventDefault(); HUB.msg.compose(this.dataset.uid, this.dataset.name)">✉️ 쪽지</button>`;
        }
        // 쪽지 쓰기 창 (uid가 있으면 받는 사람 고정, 없으면 닉네임 입력)
        function compose(toUid, toName, opt) {
            css();
            const u = me();
            if (!u) {
                if (confirm("쪽지는 회원만 보낼 수 있어요.\n로그인(또는 30초 회원가입)하러 갈까요?")) location.href = "index.html#login";
                return;
            }
            const old = d.getElementById("hubMc"); if (old) old.remove();
            const back = d.createElement("div"); back.className = "hub-mc-back"; back.id = "hubMc";
            back.innerHTML = `<div class="hub-mc" role="dialog" aria-modal="true" aria-labelledby="hubMcT">
              <h3 id="hubMcT">✉️ 쪽지 보내기</h3>
              <label for="hubMcTo">받는 사람 (닉네임)</label><input id="hubMcTo" maxlength="40" autocomplete="off">
              <label for="hubMcText">내용</label><textarea id="hubMcText" maxlength="${MAX}" placeholder="보낼 내용을 적어 주세요 (${MAX}자 이내)"></textarea>
              <div class="mc-cnt"><span id="hubMcCnt">0</span> / ${MAX}</div>
              <p class="mc-msg" id="hubMcMsg" role="alert"></p>
              <div class="mc-row"><button type="button" class="mc-send" id="hubMcSend">보내기</button><button type="button" class="mc-close" id="hubMcClose">닫기</button></div></div>`;
            d.body.appendChild(back);
            const $ = id => d.getElementById(id);
            const toIn = $("hubMcTo"), tx = $("hubMcText"), msg = (t, ok) => { $("hubMcMsg").textContent = t || ""; $("hubMcMsg").classList.toggle("ok", !!ok); };
            if (toName) toIn.value = toName;
            if (toUid) toIn.readOnly = true;
            if (opt && opt.quote) tx.value = "\n\n──── 받은 쪽지 ────\n" + String(opt.quote).slice(0, 400);
            const close = () => back.remove();
            $("hubMcClose").onclick = close;
            back.addEventListener("click", e => { if (e.target === back) close(); });
            back.addEventListener("keydown", e => { if (e.key === "Escape") close(); });
            tx.addEventListener("input", () => { $("hubMcCnt").textContent = tx.value.length; });
            $("hubMcCnt").textContent = tx.value.length;
            setTimeout(() => (toUid ? tx : toIn).focus(), 30);
            $("hubMcSend").onclick = async () => {
                const text = tx.value.trim();
                if (!text) return msg("내용을 적어 주세요.");
                if (text.length > MAX) return msg(MAX + "자 이내로 줄여 주세요.");
                const db = HUB.db(); if (!db) return msg("서버에 연결하지 못했어요. 새로고침해 주세요.");
                const btn = $("hubMcSend"); btn.disabled = true; msg("보내는 중입니다...", true);
                try {
                    let uid = toUid, name = toIn.value.trim();
                    if (!uid) {   // 닉네임으로 받는 사람 찾기 (닉네임 찾기표)
                        if (!HUB.idx.okNick(name)) { btn.disabled = false; return msg("받는 사람 닉네임을 정확히 적어 주세요."); }
                        const s = await db.collection("nicknames").doc(name).get();
                        if (!s.exists) { btn.disabled = false; return msg("그 닉네임의 회원이 없어요. 띄어쓰기까지 정확히 적어 주세요."); }
                        uid = s.data().uid;
                    }
                    if (!HUB.okId(uid)) { btn.disabled = false; return msg("받는 사람을 찾지 못했어요."); }
                    if (uid === u.uid) { btn.disabled = false; return msg("나에게는 쪽지를 보낼 수 없어요."); }
                    await db.collection("messages").add({
                        from: u.uid, fromName: u.name || "", to: uid, toName: name.slice(0, 40),
                        text: text, createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        read: false, delFrom: false, delTo: false, reported: false
                    });
                    msg("✔ 쪽지를 보냈어요.", true);
                    setTimeout(close, 900);
                    if (opt && typeof opt.onSent === "function") opt.onSent();
                } catch (e) {
                    console.error(e); btn.disabled = false;
                    msg(/permission/i.test(String(e.code || e.message)) ? "보내지 못했어요. 탈퇴한 회원이거나, 내 닉네임 정보가 바뀌었을 수 있어요. 새로고침 후 다시 해 주세요." : "보내지 못했어요. (" + (e.code || e.message) + ")");
                }
            };
        }
        // 안 읽은 쪽지 수 → 화면의 [data-hub-msgcnt] 자리에 빨간 숫자로 표시
        let badgeTimer = null, last = { uid: null, n: 0, at: 0 };
        const paint = n => d.querySelectorAll("[data-hub-msgcnt]").forEach(x => { x.textContent = n > 99 ? "99+" : String(n); x.hidden = !n; });
        // force=true 이면 바로 서버에 다시 물어봄 (아니면 20초 안에는 지난 숫자를 그대로 사용)
        async function refreshBadge(force) {
            css();
            const u = me(), db = HUB.db();
            const spots = d.querySelectorAll("[data-hub-msgcnt]");
            if (!u || !db || !spots.length) { spots.forEach(x => x.hidden = true); return 0; }
            if (!force && last.uid === u.uid && Date.now() - last.at < 20000) { paint(last.n); return last.n; }
            try {
                const snap = await db.collection("messages").where("to", "==", u.uid).where("read", "==", false).get();
                let n = 0; snap.forEach(x => { if (!x.data().delTo) n++; });
                last = { uid: u.uid, n, at: Date.now() };
                paint(n); return n;
            } catch (e) { return 0; }
        }
        // 로그인 확인이 끝나면 숫자를 보여 주고, 화면을 보고 있는 동안 3분마다 다시 확인
        function autoBadge() {
            // 페이지가 메뉴를 새로 그려 숫자 자리가 생기면 자동으로 채움
            try {
                let q = null;
                new MutationObserver(() => { if (q) return; q = setTimeout(() => { q = null;
                    if ([...d.querySelectorAll("[data-hub-msgcnt]")].some(x => !x.dataset.hubDone)) {
                        d.querySelectorAll("[data-hub-msgcnt]").forEach(x => x.dataset.hubDone = "1"); refreshBadge(); } }, 80); })
                    .observe(d.body, { childList: true, subtree: true });
            } catch (e) {}
            HUB.onUserChange(() => setTimeout(refreshBadge, 50));   // 메뉴를 다시 그리면 숫자도 다시
            HUB.whenAuthChecked(() => {
                refreshBadge();
                clearInterval(badgeTimer);
                badgeTimer = setInterval(() => { if (!d.hidden) refreshBadge(true); }, 180000);
            });
        }
        return { MAX, button, compose, refreshBadge, autoBadge };
    })();

    /* =================================================================
       시작: Firebase 프로그램을 불러온 페이지는 로그인 상태를 자동으로 맞춤
       ================================================================= */
    d.addEventListener("DOMContentLoaded", () => {
        if (d.querySelector('script[src*="firebase-app-compat"]')) { HUB.startAuthSync(); HUB.msg.autoBadge(); }
    });
})(window, document);
