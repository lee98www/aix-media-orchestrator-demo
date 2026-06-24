/* AIX Media Orchestrator PoC — 공통 인터랙션 (캡처 + 시연 조작용 데모 모드) */

/* 토스트 */
let toastEl = null;
let toastTimer = null;
function toast(msg) {
  if (!toastEl) {
    toastEl = document.createElement("div");
    toastEl.className = "toast";
    document.body.appendChild(toastEl);
  }
  toastEl.textContent = msg;
  requestAnimationFrame(() => toastEl.classList.add("show"));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2400);
}

window.__pressoToast = toast;

document.addEventListener("click", (e) => {
  /* 세그먼트 컨트롤 */
  const segItem = e.target.closest(".seg-item");
  if (segItem) {
    const seg = segItem.closest(".seg");
    seg.querySelectorAll(".seg-item").forEach((el) => el.classList.remove("active"));
    segItem.classList.add("active");

    // 비율 세그 → 프리뷰 aspect-ratio 연동
    if (segItem.dataset.aspect) {
      const target = document.querySelector(seg.dataset.target || "[data-aspect-preview]");
      if (target) target.style.aspectRatio = segItem.dataset.aspect;
      document.querySelectorAll("[data-aspect-label]").forEach((el) => {
        el.textContent = segItem.dataset.label || segItem.textContent.trim();
      });
    }
    // 길이 세그 → 크레딧 연동
    if (segItem.dataset.credit) {
      document.querySelectorAll("[data-credit-out]").forEach((el) => {
        el.textContent = segItem.dataset.credit;
      });
    }
  }

  /* 단일 선택 칩 그룹 */
  const chip = e.target.closest(".chip:not(.chip-static)");
  if (chip) {
    const group = chip.closest(".chip-group");
    if (group && group.dataset.multi === undefined) {
      group.querySelectorAll(".chip").forEach((el) => el.classList.remove("active"));
      chip.classList.add("active");
    } else if (group) {
      chip.classList.toggle("active");
    }
  }

  /* 토글 스위치 — data-dim="#selector" 대상 패널 on/off 연동 */
  const toggle = e.target.closest(".toggle");
  if (toggle) {
    toggle.classList.toggle("on");
    const on = toggle.classList.contains("on");
    if (toggle.dataset.dim) {
      document.querySelectorAll(toggle.dataset.dim).forEach((el) => el.classList.toggle("is-off", !on));
    }
    if (toggle.dataset.statusLabel) {
      const lbl = document.querySelector(toggle.dataset.statusLabel);
      if (lbl) {
        lbl.textContent = on ? "ON" : "OFF";
        lbl.classList.toggle("badge-blue", on);
        lbl.classList.toggle("badge-gray", !on);
      }
    }
  }

  /* 체크 항목 (To Do) */
  const check = e.target.closest(".todo-check");
  if (check) {
    const item = check.closest(".todo-item");
    if (item) item.classList.toggle("done");
  }

  /* 선택 가능한 카드/클립 (data-selectable 그룹 내 단일 선택) */
  const sel = e.target.closest("[data-selectable] .selectable");
  if (sel) {
    sel.closest("[data-selectable]")
      .querySelectorAll(".selectable")
      .forEach((el) => el.classList.remove("selected"));
    sel.classList.add("selected");
  }

  /* 탭 */
  const tab = e.target.closest(".tab-item");
  if (tab) {
    tab.closest(".tabs").querySelectorAll(".tab-item").forEach((el) => el.classList.remove("active"));
    tab.classList.add("active");
  }

  /* 코멘트 핀 → 스레드 팝오버 토글 */
  const pin = e.target.closest("[data-pin]");
  if (pin) {
    const pop = document.querySelector(pin.dataset.pin);
    if (pop) pop.classList.toggle("hidden");
  }

  /* 레이어 가시성 눈 토글 */
  const eye = e.target.closest(".eye");
  if (eye) {
    e.stopPropagation();
    eye.classList.toggle("on");
    if (eye.dataset.eye) {
      const target = document.querySelector(eye.dataset.eye);
      if (target) target.style.visibility = eye.classList.contains("on") ? "visible" : "hidden";
    }
  }

  /* 생성/적용 — 단계별 진행 시뮬레이션 (데모) */
  const gen = e.target.closest("[data-fake-gen]");
  if (gen && !gen.dataset.busy) {
    gen.dataset.busy = "1";
    const orig = gen.innerHTML;
    gen.style.minWidth = gen.offsetWidth + "px";
    gen.style.opacity = ".85";
    const steps = (gen.dataset.steps || "").split("|").filter(Boolean);
    const finish = () => {
      gen.innerHTML = orig;
      gen.style.opacity = "";
      delete gen.dataset.busy;
      toast("완료 — 데모 모드에서는 미리 준비된 결과를 표시합니다");
      gen.dispatchEvent(new CustomEvent("fakegen:done", { bubbles: true }));
    };
    if (steps.length) {
      let i = 0;
      const next = () => {
        if (i >= steps.length) return finish();
        gen.innerHTML = `<span class="spin"></span> ${steps[i]}… (${i + 1}/${steps.length})`;
        i += 1;
        setTimeout(next, 950);
      };
      next();
    } else {
      gen.innerHTML = '<span class="spin"></span> 생성 중…';
      setTimeout(finish, 1900);
    }
    return;
  }

  /* 데모 안내 토스트 */
  const demo = e.target.closest("[data-demo]");
  if (demo) toast(demo.dataset.demo || "데모 화면입니다 — 실제 호출 없이 동작을 표시합니다");
});

/* 슬라이더 라이브 바인딩 — data-bind="selector|cssProp" */
document.querySelectorAll('input[type="range"][data-bind]').forEach((r) => {
  r.addEventListener("input", () => {
    const [sel, prop] = r.dataset.bind.split("|");
    document.querySelectorAll(sel).forEach((el) => { el.style[prop] = r.value + "px"; });
    const out = r.closest(".col, .field, div")?.querySelector("[data-out]");
    if (out) out.textContent = r.value + "px";
  });
});

/* 코멘트 입력 → 스레드에 추가 */
const commentForm = document.querySelector("[data-comment-form]");
if (commentForm) {
  commentForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const input = commentForm.querySelector("input");
    const text = input.value.trim();
    if (!text) return;
    const thread = document.querySelector("[data-comment-thread]");
    const item = document.createElement("li");
    item.className = "cmt";
    item.innerHTML =
      '<span class="avatar av-1">이</span>' +
      '<div class="cmt-body"><div class="cmt-head"><b>이무성</b><span class="muted xsmall">방금 전</span></div>' +
      "<p>" + text.replace(/</g, "&lt;") + "</p></div>";
    thread.appendChild(item);
    input.value = "";
    item.scrollIntoView({ behavior: "smooth", block: "end" });
  });
}
